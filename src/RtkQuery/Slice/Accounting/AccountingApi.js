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
      query: () => ({ url: "/accounting/accounts", params: { tree: 1 } }),
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
    getSuppliers: builder.query({
      query: () => "/accounting/suppliers",
      transformResponse: (response) => response?.data ?? [],
      providesTags: ["Supplier"],
    }),
    addSupplier: builder.mutation({
      query: (body) => ({ url: "/accounting/suppliers", method: "POST", body }),
      invalidatesTags: ["Supplier", "Account"],
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
      ],
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
    payPurchaseInvoice: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/accounting/purchase-invoices/${id}/pay`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["PurchaseInvoice", "Supplier", "Account", "Transaction", "TrialBalance"],
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
      invalidatesTags: ["EmployeeAdvance"],
    }),
    settleEmployeeAdvance: builder.mutation({
      query: ({ userId, ...body }) => ({
        url: `/accounting/employees/${userId}/advances/settle`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["EmployeeAdvance", "Transaction", "Account", "CompanyStatement", "TrialBalance"],
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
      invalidatesTags: ["SupplierAdvance", "Supplier"],
    }),
    settleSupplierAdvance: builder.mutation({
      query: ({ supplierId, ...body }) => ({
        url: `/accounting/suppliers/${supplierId}/advances/settle`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["SupplierAdvance", "Supplier", "Transaction", "Account", "CompanyStatement", "TrialBalance"],
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
  }),
});

export const {
  useGetAccountsQuery,
  useGetAccountsTreeQuery,
  useGetAccountQuery,
  useAddAccountMutation,
  useUpdateAccountMutation,
  useDeleteAccountMutation,
  useGetAccountStatementQuery,
  useGetTransactionsQuery,
  useGetTransactionQuery,
  useRecordIncomingMutation,
  useRecordOutgoingMutation,
  useTransferFundsMutation,
  useReverseTransactionMutation,
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
  useGetSuppliersQuery,
  useAddSupplierMutation,
  useDeleteSupplierMutation,
  useGetSupplierStatementQuery,
  useLazyGetSupplierStatementQuery,
  useGetPurchaseInvoicesQuery,
  useGetPurchaseInvoiceQuery,
  useAddPurchaseInvoiceMutation,
  useArchivePurchaseInvoiceMutation,
  useUnarchivePurchaseInvoiceMutation,
  usePayPurchaseInvoiceMutation,
  useUploadPurchaseInvoiceImageMutation,
  useRemovePurchaseInvoiceImageMutation,
  useGetMaterialsQuery,
  useLazyGetMaterialsQuery,
  useAddMaterialMutation,
  useGetMaterialsWithStatsQuery,
  useGetMaterialPurchasesQuery,
  usePayBrokerCommissionMutation,
  useGetBrokerCommissionHistoryQuery,
  useLazyGetBrokerCommissionHistoryQuery,
  useGiveEmployeeAdvanceMutation,
  useSettleEmployeeAdvanceMutation,
  useLazyGetEmployeeAdvanceBalanceQuery,
  useGetEmployeeAdvancesHistoryQuery,
  useLazyGetEmployeeAdvancesHistoryQuery,
  useLazyGetEmployeeStatementQuery,
  useGiveSupplierAdvanceMutation,
  useSettleSupplierAdvanceMutation,
  useLazyGetSupplierAdvanceBalanceQuery,
  useGetSupplierAdvancesHistoryQuery,
  useLazyGetSupplierAdvancesHistoryQuery,
} = accountingApi;