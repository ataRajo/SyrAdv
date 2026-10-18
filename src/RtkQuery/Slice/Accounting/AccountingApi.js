import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "../../../Api/baseUrl";

/**
 * Same token lookup used across the app (see PaymentsContainer.jsx's
 * getToken()) - kept local here so this slice has no dependency on any
 * other file besides BASE_URL.
 */
const getToken = () => {
  try {
    const raw = localStorage.getItem("SuperAdminInfo");
    const info = raw ? JSON.parse(raw) : null;
    return info?.user?.token || info?.token || localStorage.getItem("token");
  } catch (error) {
    return localStorage.getItem("token");
  }
};

/**
 * Shared parser for every paginated list endpoint in this module
 * (paginateSuccessResponse() on the backend - see ResponseTrait.php):
 * { data: <Laravel paginator JSON>, meta: {total, per_page, current_page,
 * total_pages} }. Handles every shape actually seen in the wild (including
 * the older successResponse() shape with a flat array and an all-zero
 * meta, for endpoints not yet migrated to real pagination) so a backend
 * fix never silently breaks the UI either way.
 */
const parsePaginatedResponse = (response) => {
  let items = [];
  let meta = { total: 0, per_page: 20, current_page: 1, total_pages: 1 };

  if (Array.isArray(response)) {
    items = response;
  } else if (Array.isArray(response?.data)) {
    items = response.data;
    meta = response?.meta || meta;
  } else if (Array.isArray(response?.data?.data)) {
    items = response.data.data;
    meta = response.data;
  }

  return {
    data: items,
    meta: {
      total: meta.total ?? items.length,
      per_page: meta.per_page ?? 20,
      current_page: meta.current_page ?? 1,
      total_pages: meta.last_page ?? meta.total_pages ?? 1,
      // إجمالي إضافي من الخادم إن وُجد (مثال: total_outstanding لسجل السلف).
      ...(response?.meta?.total_outstanding != null ? { total_outstanding: Number(response.meta.total_outstanding) } : {}),
    },
  };
};

/**
 * Every endpoint of the Accounting & Company Cashbox Management API
 * (see ACCOUNTING_MODULE.md) is wired up here - Chart of Accounts,
 * transactions (incoming/outgoing/transfer/reverse), statements, and the
 * trial balance summary. Nothing in that API is left unconnected.
 */
export const accountingApi = createApi({
  reducerPath: "accountingApi",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      const token = getToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      headers.set("Accept", "application/json");
      return headers;
    },
  }),
  tagTypes: [
    "Account",
    "Transaction",
    "CustomerStatement",
    "CompanyStatement",
    "TrialBalance",
    "CashClosing",
    "PayrollEmployee",
    "SupplierCategory",
    "Supplier",
    "PurchaseInvoice",
    "BrokerCommission",
    "Material",
    "EmployeeAdvance",
    "SupplierAdvance",
    "SupplierStatement",
    "AccountManualAdjustment",
    "ReconciliationLog",
  ],
  endpoints: (builder) => ({
    // ---------------------------------------------------------------
    // Chart of Accounts  (GET/POST/PUT/DELETE /accounting/accounts)
    // ---------------------------------------------------------------
    getAccounts: builder.query({
      query: (params = {}) => ({ url: "/accounting/accounts", params }),
      transformResponse: (response) => response?.data ?? [],
      providesTags: ["Account"],
    }),
    getAccountsTree: builder.query({
      // حسابات الزبائن برصيد صفر مخفية افتراضيًا من الشجرة (طلب صريح) -
      // { includeZeroCustomers: true } يُظهرها (زر في دليل الحسابات).
      query: ({ includeZeroCustomers = false } = {}) => ({
        url: "/accounting/accounts",
        params: { tree: 1, ...(includeZeroCustomers ? { include_zero_customers: 1 } : {}) },
      }),
      transformResponse: (response) => {
        if (Array.isArray(response)) return response;
        if (Array.isArray(response?.data)) return response.data;
        if (Array.isArray(response?.data?.data)) return response.data.data;
        return [];
      },
      providesTags: ["Account"],
    }),
    getAccount: builder.query({
      query: (id) => `/accounting/accounts/${id}`,
      transformResponse: (response) => response?.data,
      providesTags: (result, error, id) => [{ type: "Account", id }],
    }),
    addAccount: builder.mutation({
      query: (body) => ({ url: "/accounting/accounts", method: "POST", body }),
      invalidatesTags: ["Account"],
    }),
    updateAccount: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/accounting/accounts/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        "Account",
        { type: "Account", id },
      ],
    }),
    deleteAccount: builder.mutation({
      query: (id) => ({ url: `/accounting/accounts/${id}`, method: "DELETE" }),
      invalidatesTags: ["Account"],
    }),
    // "تعديل يدوي للحسابات من شجرة الحسابات (من السوبر ادمن فقط)" - طلب
    // صريح. يفتح حقولًا مقفلة عادة (code/type/normal_balance/parent_id)
    // وحتى balance نفسه - راجع AccountController::manualAdjust على
    // الباك-إند، المقيَّد بدور super admin فقط.
    manualAdjustAccount: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/accounting/accounts/${id}/manual-adjust`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        "Account",
        { type: "Account", id },
        { type: "AccountManualAdjustment", id },
      ],
    }),
    getAccountManualAdjustments: builder.query({
      query: (id) => `/accounting/accounts/${id}/manual-adjustments`,
      transformResponse: (response) => response?.data ?? [],
      providesTags: (result, error, id) => [{ type: "AccountManualAdjustment", id }],
    }),
    getAccountStatement: builder.query({
      query: ({ id, ...params }) => ({
        url: `/accounting/accounts/${id}/statement`,
        params,
      }),
      transformResponse: (response) => response?.data,
      providesTags: (result, error, { id }) => [
        { type: "Account", id: `statement-${id}` },
      ],
    }),

    // ---------------------------------------------------------------
    // Transactions  (GET/POST /accounting/transactions)
    // ---------------------------------------------------------------
    getTransactions: builder.query({
      query: (params = {}) => ({ url: "/accounting/transactions", params }),
      transformResponse: parsePaginatedResponse,
      providesTags: ["Transaction"],
    }),
    getTransaction: builder.query({
      query: (id) => `/accounting/transactions/${id}`,
      transformResponse: (response) => response?.data,
      providesTags: (result, error, id) => [{ type: "Transaction", id }],
    }),
    recordIncoming: builder.mutation({
      query: (body) => ({
        url: "/accounting/transactions/incoming",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        "Transaction",
        "Account",
        "CustomerStatement",
        "CompanyStatement",
        "TrialBalance",
      ],
    }),
    recordOutgoing: builder.mutation({
      query: (body) => ({
        url: "/accounting/transactions/outgoing",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        "Transaction",
        "Account",
        "CompanyStatement",
        "TrialBalance",
      ],
    }),
    transferFunds: builder.mutation({
      query: (body) => ({
        url: "/accounting/transactions/transfer",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        "Transaction",
        "Account",
        "CompanyStatement",
        "TrialBalance",
      ],
    }),
    // توثيق سند (رفع صورة السند الموقَّع) - السند بانتظار التوثيق يُرحَّل
    // على شجرة الحسابات لحظتها فقط (CashboxTransactionService::document).
    documentTransaction: builder.mutation({
      query: ({ id, body }) => ({
        url: `/accounting/transactions/${id}/document`,
        method: "POST",
        body, // FormData يحمل "image"
      }),
      invalidatesTags: [
        "Transaction",
        "Account",
        "CustomerStatement",
        "CompanyStatement",
        "TrialBalance",
        "Supplier",
        "SupplierStatement",
        "PurchaseInvoice",
        "EmployeeAdvance",
        "SupplierAdvance",
        "PayrollEmployee",
      ],
    }),
    // ترحيل دفتر اليومية - السوبر أدمن فقط (TransactionController::post/postBatch).
    postTransaction: builder.mutation({
      query: (id) => ({ url: `/accounting/transactions/${id}/post`, method: "POST" }),
      invalidatesTags: [
        "Transaction",
        "Account",
        "CustomerStatement",
        "CompanyStatement",
        "TrialBalance",
        "Supplier",
        "SupplierStatement",
        "PurchaseInvoice",
        "EmployeeAdvance",
        "SupplierAdvance",
        "PayrollEmployee",
      ],
    }),
    postTransactionsBatch: builder.mutation({
      query: (ids) => ({ url: `/accounting/transactions/post-batch`, method: "POST", body: { ids } }),
      invalidatesTags: [
        "Transaction",
        "Account",
        "CustomerStatement",
        "CompanyStatement",
        "TrialBalance",
        "Supplier",
        "SupplierStatement",
        "PurchaseInvoice",
        "EmployeeAdvance",
        "SupplierAdvance",
        "PayrollEmployee",
      ],
    }),
    reverseTransaction: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/accounting/transactions/${id}/reverse`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: [
        "Transaction",
        "Account",
        "CustomerStatement",
        "CompanyStatement",
        "TrialBalance",
        "EmployeeAdvance",
        "SupplierAdvance",
        "PayrollEmployee",
        "Supplier",
        "PurchaseInvoice",
      ],
    }),

    // زر «تعديل» في المعاملات/السندات: الوصف والتاريخ فقط (طلب صريح).
    updateTransaction: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/accounting/transactions/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Transaction", "CompanyStatement", "CustomerStatement"],
    }),
    // حذف نهائي لسند/قيد تجريبي (مرحلة الاختبار) - dry_run=1 يعرض ما سيُحذف فقط.
    previewDeleteTransaction: builder.query({
      query: (id) => ({ url: `/accounting/transactions/${id}`, method: "DELETE", params: { dry_run: 1 } }),
      transformResponse: (response) => response?.data ?? response,
      keepUnusedDataFor: 0,
    }),
    deleteTransaction: builder.mutation({
      query: (id) => ({ url: `/accounting/transactions/${id}`, method: "DELETE" }),
      invalidatesTags: [
        "Transaction",
        "Account",
        "CustomerStatement",
        "CompanyStatement",
        "TrialBalance",
        "EmployeeAdvance",
        "SupplierAdvance",
        "PayrollEmployee",
        "Supplier",
        "SupplierStatement",
        "PurchaseInvoice",
        "CashClosing",
      ],
    }),

    // ---------------------------------------------------------------
    // Statements & reports
    // ---------------------------------------------------------------
    getCustomerStatement: builder.query({
      query: ({ customerId, ...params }) => ({
        url: `/accounting/customers/${customerId}/statement`,
        params,
      }),
      transformResponse: (response) => response?.data,
      providesTags: (result, error, { customerId }) => [
        { type: "CustomerStatement", id: customerId },
      ],
    }),
    sendCustomerStatement: builder.mutation({
      query: ({ customerId, ...body }) => ({
        url: `/accounting/customers/${customerId}/statement/send`,
        method: "POST",
        body,
      }),
    }),
    getCompanyStatement: builder.query({
      query: (params = {}) => ({ url: "/accounting/company/statement", params }),
      transformResponse: (response) => response?.data,
      providesTags: ["CompanyStatement"],
    }),
    getTrialBalance: builder.query({
      query: () => "/accounting/company/summary",
      transformResponse: (response) => response?.data,
      providesTags: ["TrialBalance"],
    }),

    // ---------------------------------------------------------------
    // Cash Register Closing (تقفيل الصندوق اليومي)
    // ---------------------------------------------------------------
    previewCashClosing: builder.query({
      query: (params) => ({ url: "/accounting/cash-closings/preview", params }),
      transformResponse: (response) => response?.data,
    }),
    closeCashRegister: builder.mutation({
      query: (body) => ({ url: "/accounting/cash-closings", method: "POST", body }),
      invalidatesTags: ["CashClosing"],
    }),
    getCashClosings: builder.query({
      query: (params = {}) => ({ url: "/accounting/cash-closings", params }),
      transformResponse: parsePaginatedResponse,
      providesTags: ["CashClosing"],
    }),
    getCashClosing: builder.query({
      query: (id) => `/accounting/cash-closings/${id}`,
      transformResponse: (response) => response?.data,
      providesTags: (result, error, id) => [{ type: "CashClosing", id }],
    }),
    confirmCashClosing: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/accounting/cash-closings/${id}/confirm`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["CashClosing"],
    }),

    // ---------------------------------------------------------------
    // Payroll (الرواتب والأجور)
    // ---------------------------------------------------------------
    getPayrollEmployees: builder.query({
      query: () => "/accounting/payroll/employees",
      transformResponse: (response) => response?.data ?? [],
      providesTags: ["PayrollEmployee"],
    }),
    setEmployeeSalary: builder.mutation({
      query: ({ userId, ...body }) => ({
        url: `/accounting/payroll/employees/${userId}/salary`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["PayrollEmployee"],
    }),
    payEmployeeSalary: builder.mutation({
      query: (body) => ({ url: "/accounting/payroll/pay", method: "POST", body }),
      invalidatesTags: ["Transaction", "Account", "CompanyStatement", "TrialBalance", "PayrollEmployee", "EmployeeAdvance"],
    }),
    getPayrollHistory: builder.query({
      query: (params = {}) => ({ url: "/accounting/payroll/history", params }),
      transformResponse: parsePaginatedResponse,
    }),

    // ---------------------------------------------------------------
    // Financial statements (قائمة الدخل، الميزانية العمومية)
    // ---------------------------------------------------------------
    getIncomeStatement: builder.query({
      query: (params) => ({ url: "/accounting/reports/income-statement", params }),
      transformResponse: (response) => response?.data,
    }),
    getBalanceSheet: builder.query({
      query: (params = {}) => ({ url: "/accounting/reports/balance-sheet", params }),
      transformResponse: (response) => response?.data,
    }),

    // ---------------------------------------------------------------
    // Accounts for select-lists only (postable/active, with full path)
    // ---------------------------------------------------------------
    getSelectableAccounts: builder.query({
      query: () => "/accounting/accounts/selectable",
      transformResponse: (response) => response?.data ?? [],
      providesTags: ["Account"],
    }),

    // ---------------------------------------------------------------
    // Suppliers (الموردون) - "نوع عمل" منفصل مرتبط بحساب مصروف في الشجرة
    // ---------------------------------------------------------------
    getSupplierCategories: builder.query({
      query: () => "/accounting/supplier-categories",
      transformResponse: (response) => response?.data ?? [],
      providesTags: ["SupplierCategory"],
    }),
    addSupplierCategory: builder.mutation({
      query: (body) => ({
        url: "/accounting/supplier-categories",
        method: "POST",
        body,
      }),
      invalidatesTags: ["SupplierCategory"],
    }),
    updateSupplierCategory: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/accounting/supplier-categories/${id}`, method: "PUT", body }),
      invalidatesTags: ["SupplierCategory", "Supplier"],
    }),
    // طلب صريح: "حذف فئات الموردين" - مرفوض من الباك-إند إن كان أي مورد لا
    // يزال تابعًا للفئة (راجع SupplierCategoryController::destroy).
    deleteSupplierCategory: builder.mutation({
      query: (id) => ({ url: `/accounting/supplier-categories/${id}`, method: "DELETE" }),
      invalidatesTags: ["SupplierCategory"],
    }),
    getSuppliers: builder.query({
      query: () => "/accounting/suppliers",
      transformResponse: (response) => response?.data ?? [],
      providesTags: ["Supplier"],
    }),
    addSupplier: builder.mutation({
      query: (body) => ({ url: "/accounting/suppliers", method: "POST", body }),
      invalidatesTags: ["Supplier", "Account"],
    }),
    // تعديل مورد + استكمال الثبوتية (FormData عبر POST لدعم رفع الملفات).
    updateSupplier: builder.mutation({
      query: ({ id, body }) => ({ url: `/accounting/suppliers/${id}`, method: "POST", body }),
      invalidatesTags: ["Supplier", "Account", "SupplierStatement"],
    }),
    // طلب صريح: "إضافة خيار حذف المورد" - مسموح فقط إن لم يكن للمورد فواتير
    // شراء أو سلف مسجَّلة (راجع SupplierController::destroy على الباك-إند).
    deleteSupplier: builder.mutation({
      query: (id) => ({ url: `/accounting/suppliers/${id}`, method: "DELETE" }),
      invalidatesTags: ["Supplier", "Account"],
    }),
    getSupplierStatement: builder.query({
      query: ({ supplierId, ...params }) => ({
        url: `/accounting/suppliers/${supplierId}/statement`,
        params,
      }),
      transformResponse: (response) => response?.data ?? response,
      providesTags: (result, error, { supplierId }) => [{ type: "SupplierStatement", id: supplierId }],
    }),

    // ---------------------------------------------------------------
    // Purchase invoices (فواتير الشراء) - كل فاتورة تُصدر سند دفع فورًا
    // ---------------------------------------------------------------
    getPurchaseInvoices: builder.query({
      query: (params = {}) => ({ url: "/accounting/purchase-invoices", params }),
      transformResponse: parsePaginatedResponse,
      providesTags: ["PurchaseInvoice"],
    }),
    getPurchaseInvoice: builder.query({
      query: (id) => `/accounting/purchase-invoices/${id}`,
      transformResponse: (response) => response?.data ?? null,
      providesTags: (result, error, id) => [{ type: "PurchaseInvoice", id }],
    }),
    addPurchaseInvoice: builder.mutation({
      query: (body) => ({
        url: "/accounting/purchase-invoices",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        "PurchaseInvoice",
        "Supplier",
        "Account",
        "Transaction",
        "TrialBalance",
        "SupplierAdvance",
        "SupplierStatement",
      ],
    }),
    // زر «تعديل» الفاتورة: رقم الفاتورة/الوصف/تاريخ الاستحقاق فقط (غير مالية).
    updatePurchaseInvoice: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/accounting/purchase-invoices/${id}`, method: "PUT", body }),
      invalidatesTags: (result, error, { id }) => [{ type: "PurchaseInvoice", id }, "PurchaseInvoice"],
    }),
    archivePurchaseInvoice: builder.mutation({
      query: (id) => ({
        url: `/accounting/purchase-invoices/${id}/archive`,
        method: "POST",
      }),
      invalidatesTags: ["PurchaseInvoice"],
    }),
    unarchivePurchaseInvoice: builder.mutation({
      query: (id) => ({
        url: `/accounting/purchase-invoices/${id}/unarchive`,
        method: "POST",
      }),
      invalidatesTags: ["PurchaseInvoice"],
    }),
    // حذف فاتورة شراء - القيود تُعكَس في الباك-إند (PurchaseInvoiceService::delete).
    deletePurchaseInvoice: builder.mutation({
      query: (id) => ({
        url: `/accounting/purchase-invoices/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["PurchaseInvoice", "Supplier", "Account", "Transaction", "TrialBalance", "Material", "SupplierAdvance", "SupplierStatement"],
    }),
    payPurchaseInvoice: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/accounting/purchase-invoices/${id}/pay`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["PurchaseInvoice", "Supplier", "Account", "Transaction", "TrialBalance", "SupplierAdvance", "SupplierStatement"],
    }),
    // إرفاق/إزالة صورة الفاتورة الخارجية (طلب صريح: أرشفة موثَّقة بالصورة
    // للفواتير القادمة من خارج النظام) - راجع PurchaseInvoiceController.
    uploadPurchaseInvoiceImage: builder.mutation({
      query: ({ id, body }) => ({
        url: `/accounting/purchase-invoices/${id}/image`,
        method: "POST",
        body, // FormData يحمل حقل "image"
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "PurchaseInvoice", id }, "PurchaseInvoice"],
    }),
    removePurchaseInvoiceImage: builder.mutation({
      query: (id) => ({
        url: `/accounting/purchase-invoices/${id}/image`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [{ type: "PurchaseInvoice", id }, "PurchaseInvoice"],
    }),

    // ---------------------------------------------------------------
    // فهرس المواد - للبحث عند إضافة بنود فاتورة شراء (طلب العميل)
    // ---------------------------------------------------------------
    getMaterials: builder.query({
      query: (params = {}) => ({ url: "/accounting/materials", params }),
      transformResponse: (response) => response?.data ?? [],
      providesTags: ["Material"],
    }),
    addMaterial: builder.mutation({
      query: (body) => ({ url: "/accounting/materials", method: "POST", body }),
      invalidatesTags: ["Material"],
    }),
    updateMaterial: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/accounting/materials/${id}`, method: "PUT", body }),
      invalidatesTags: ["Material"],
    }),
    // حذف مادة من الفهرس - بنود الفواتير السابقة تحتفظ باسم المادة (material_name).
    deleteMaterial: builder.mutation({
      query: (id) => ({ url: `/accounting/materials/${id}`, method: "DELETE" }),
      invalidatesTags: ["Material", "PurchaseInvoice"],
    }),

    // ---------------------------------------------------------------
    // تبويبة "المواد" المستقلة (طلب العميل: تسهيل البحث عن مادة وكميتها
    // بدل تصفّح كل فاتورة شراء على حدة) - نفس فهرس المواد أعلاه، لكن مع
    // إجماليات الشراء (الكمية/المبلغ/عدد الفواتير) لكل مادة.
    // ---------------------------------------------------------------
    getMaterialsWithStats: builder.query({
      query: (params = {}) => ({
        url: "/accounting/materials",
        params: { ...params, with_stats: 1 },
      }),
      transformResponse: (response) => response?.data ?? [],
      providesTags: ["Material"],
    }),
    getMaterialPurchases: builder.query({
      query: (params = {}) => ({ url: "/accounting/material-purchases", params }),
      transformResponse: parsePaginatedResponse,
      providesTags: ["Material"],
    }),

    // ---------------------------------------------------------------
    // Broker commissions (عمولات الوسطاء) - دفع لكل حجز على حدة
    // ---------------------------------------------------------------
    payBrokerCommission: builder.mutation({
      query: ({ bookingId, ...body }) => ({
        url: `/accounting/bookings/${bookingId}/broker-commission/pay`,
        method: "POST",
        body,
      }),
      invalidatesTags: [
        "BrokerCommission",
        "Transaction",
        "Account",
        "TrialBalance",
      ],
    }),
    getBrokerCommissionHistory: builder.query({
      query: (params = {}) => ({
        url: "/accounting/broker-commissions/history",
        params,
      }),
      transformResponse: parsePaginatedResponse,
      providesTags: ["BrokerCommission"],
    }),

    // ---------------------------------------------------------------
    // سلف الموظفين والموردين (Employee & Supplier Advances)
    // ---------------------------------------------------------------
    giveEmployeeAdvance: builder.mutation({
      query: ({ userId, ...body }) => ({
        url: `/accounting/employees/${userId}/advances`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["EmployeeAdvance", "PayrollEmployee", "Transaction", "Account", "TrialBalance"],
    }),
    settleEmployeeAdvance: builder.mutation({
      query: ({ userId, ...body }) => ({
        url: `/accounting/employees/${userId}/advances/settle`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["EmployeeAdvance", "PayrollEmployee", "Transaction", "Account", "CompanyStatement", "TrialBalance"],
    }),
    // زر «تعديل» و«حذف نهائي» لسلفة موظف (طلب صريح).
    updateEmployeeAdvance: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/accounting/employee-advances/${id}`, method: "PUT", body }),
      invalidatesTags: [
        "Transaction",
        "Account",
        "CustomerStatement",
        "CompanyStatement",
        "TrialBalance",
        "EmployeeAdvance",
        "SupplierAdvance",
        "PayrollEmployee",
        "Supplier",
        "SupplierStatement",
        "PurchaseInvoice",
        "CashClosing",
      ],
    }),
    previewDeleteEmployeeAdvance: builder.query({
      query: (id) => ({ url: `/accounting/employee-advances/${id}`, method: "DELETE", params: { dry_run: 1 } }),
      transformResponse: (response) => response?.data ?? response,
      keepUnusedDataFor: 0,
    }),
    deleteEmployeeAdvance: builder.mutation({
      query: (id) => ({ url: `/accounting/employee-advances/${id}`, method: "DELETE" }),
      invalidatesTags: [
        "Transaction",
        "Account",
        "CustomerStatement",
        "CompanyStatement",
        "TrialBalance",
        "EmployeeAdvance",
        "SupplierAdvance",
        "PayrollEmployee",
        "Supplier",
        "SupplierStatement",
        "PurchaseInvoice",
        "CashClosing",
      ],
    }),
    getEmployeeAdvanceBalance: builder.query({
      query: (userId) => `/accounting/employees/${userId}/advances/balance`,
      transformResponse: (response) => response?.data ?? response,
      providesTags: (result, error, userId) => [{ type: "EmployeeAdvance", id: userId }],
    }),
    getEmployeeAdvancesHistory: builder.query({
      query: (params = {}) => ({
        url: "/accounting/employee-advances/history",
        params,
      }),
      transformResponse: parsePaginatedResponse,
      providesTags: ["EmployeeAdvance"],
    }),
    getEmployeeStatement: builder.query({
      query: ({ userId, ...params }) => ({
        url: `/accounting/employees/${userId}/statement`,
        params,
      }),
      transformResponse: (response) => response?.data ?? response,
      providesTags: (result, error, { userId }) => [{ type: "EmployeeAdvance", id: `statement-${userId}` }],
    }),
    giveSupplierAdvance: builder.mutation({
      query: ({ supplierId, ...body }) => ({
        url: `/accounting/suppliers/${supplierId}/advances`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["SupplierAdvance", "Supplier", "SupplierStatement", "Transaction", "Account", "TrialBalance"],
    }),
    settleSupplierAdvance: builder.mutation({
      query: ({ supplierId, ...body }) => ({
        url: `/accounting/suppliers/${supplierId}/advances/settle`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["SupplierAdvance", "Supplier", "SupplierStatement", "Transaction", "Account", "CompanyStatement", "TrialBalance"],
    }),
    // زر «تعديل» و«حذف نهائي» لسلفة مورد (طلب صريح).
    updateSupplierAdvance: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/accounting/supplier-advances/${id}`, method: "PUT", body }),
      invalidatesTags: [
        "Transaction",
        "Account",
        "CustomerStatement",
        "CompanyStatement",
        "TrialBalance",
        "EmployeeAdvance",
        "SupplierAdvance",
        "PayrollEmployee",
        "Supplier",
        "SupplierStatement",
        "PurchaseInvoice",
        "CashClosing",
      ],
    }),
    previewDeleteSupplierAdvance: builder.query({
      query: (id) => ({ url: `/accounting/supplier-advances/${id}`, method: "DELETE", params: { dry_run: 1 } }),
      transformResponse: (response) => response?.data ?? response,
      keepUnusedDataFor: 0,
    }),
    deleteSupplierAdvance: builder.mutation({
      query: (id) => ({ url: `/accounting/supplier-advances/${id}`, method: "DELETE" }),
      invalidatesTags: [
        "Transaction",
        "Account",
        "CustomerStatement",
        "CompanyStatement",
        "TrialBalance",
        "EmployeeAdvance",
        "SupplierAdvance",
        "PayrollEmployee",
        "Supplier",
        "SupplierStatement",
        "PurchaseInvoice",
        "CashClosing",
      ],
    }),
    getSupplierAdvanceBalance: builder.query({
      query: (supplierId) => `/accounting/suppliers/${supplierId}/advances/balance`,
      transformResponse: (response) => response?.data ?? response,
      providesTags: (result, error, supplierId) => [{ type: "SupplierAdvance", id: supplierId }],
    }),
    getSupplierAdvancesHistory: builder.query({
      query: (params = {}) => ({
        url: "/accounting/supplier-advances/history",
        params,
      }),
      transformResponse: parsePaginatedResponse,
      providesTags: ["SupplierAdvance"],
    }),

    // ---------------------------------------------------------------
    // "والتأكد من جميع الحسابات" - راجع ReconciliationController.
    // ---------------------------------------------------------------
    getReconciliationLogs: builder.query({
      query: () => "/accounting/reconciliation/logs",
      transformResponse: (response) => response?.data ?? [],
      providesTags: ["ReconciliationLog"],
    }),
    runReconciliation: builder.mutation({
      query: () => ({ url: "/accounting/reconciliation/run", method: "POST" }),
      invalidatesTags: ["ReconciliationLog"],
    }),
  }),
});

export const {
  useGetAccountsQuery,
  useGetAccountsTreeQuery,
  useGetAccountQuery,
  useAddAccountMutation,
  useUpdateAccountMutation,
  useDeleteAccountMutation,
  useManualAdjustAccountMutation,
  useGetAccountManualAdjustmentsQuery,
  useGetAccountStatementQuery,
  useGetTransactionsQuery,
  useGetTransactionQuery,
  useRecordIncomingMutation,
  useRecordOutgoingMutation,
  useTransferFundsMutation,
  useReverseTransactionMutation,
  useUpdateTransactionMutation,
  useLazyPreviewDeleteTransactionQuery,
  useDeleteTransactionMutation,
  useDocumentTransactionMutation,
  useUpdateSupplierMutation,
  usePostTransactionMutation,
  usePostTransactionsBatchMutation,
  useGetCustomerStatementQuery,
  useSendCustomerStatementMutation,
  useGetCompanyStatementQuery,
  useGetTrialBalanceQuery,
  usePreviewCashClosingQuery,
  useLazyPreviewCashClosingQuery,
  useCloseCashRegisterMutation,
  useGetCashClosingsQuery,
  useGetCashClosingQuery,
  useConfirmCashClosingMutation,
  useGetPayrollEmployeesQuery,
  useSetEmployeeSalaryMutation,
  usePayEmployeeSalaryMutation,
  useGetPayrollHistoryQuery,
  useLazyGetPayrollHistoryQuery,
  useLazyGetIncomeStatementQuery,
  useLazyGetBalanceSheetQuery,
  useGetSelectableAccountsQuery,
  useGetSupplierCategoriesQuery,
  useAddSupplierCategoryMutation,
  useUpdateSupplierCategoryMutation,
  useDeleteSupplierCategoryMutation,
  useGetSuppliersQuery,
  useAddSupplierMutation,
  useDeleteSupplierMutation,
  useGetSupplierStatementQuery,
  useLazyGetSupplierStatementQuery,
  useGetPurchaseInvoicesQuery,
  useGetPurchaseInvoiceQuery,
  useAddPurchaseInvoiceMutation,
  useUpdatePurchaseInvoiceMutation,
  useArchivePurchaseInvoiceMutation,
  useUnarchivePurchaseInvoiceMutation,
  usePayPurchaseInvoiceMutation,
  useDeletePurchaseInvoiceMutation,
  useUploadPurchaseInvoiceImageMutation,
  useRemovePurchaseInvoiceImageMutation,
  useGetMaterialsQuery,
  useLazyGetMaterialsQuery,
  useAddMaterialMutation,
  useUpdateMaterialMutation,
  useDeleteMaterialMutation,
  useGetMaterialsWithStatsQuery,
  useGetMaterialPurchasesQuery,
  usePayBrokerCommissionMutation,
  useGetBrokerCommissionHistoryQuery,
  useLazyGetBrokerCommissionHistoryQuery,
  useGiveEmployeeAdvanceMutation,
  useSettleEmployeeAdvanceMutation,
  useUpdateEmployeeAdvanceMutation,
  useLazyPreviewDeleteEmployeeAdvanceQuery,
  useDeleteEmployeeAdvanceMutation,
  useLazyGetEmployeeAdvanceBalanceQuery,
  useGetEmployeeAdvancesHistoryQuery,
  useLazyGetEmployeeAdvancesHistoryQuery,
  useLazyGetEmployeeStatementQuery,
  useGiveSupplierAdvanceMutation,
  useSettleSupplierAdvanceMutation,
  useUpdateSupplierAdvanceMutation,
  useLazyPreviewDeleteSupplierAdvanceQuery,
  useDeleteSupplierAdvanceMutation,
  useLazyGetSupplierAdvanceBalanceQuery,
  useGetSupplierAdvancesHistoryQuery,
  useLazyGetSupplierAdvancesHistoryQuery,
  useGetReconciliationLogsQuery,
  useRunReconciliationMutation,
} = accountingApi;