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
        console.log("Accounts Tree API Response:", response); // Debug log - remove once shape is confirmed
        // Handle every shape we've seen this API return elsewhere:
        // { data: [...] }, { data: { data: [...] } }, { status: true, data: [...] }, or a raw array.
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

    // GET /accounting/accounts/{id}/statement (generic - any account)
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
  transformResponse: (response) => {
    console.log('Transactions API Response:', response); // Open F12 Console to see this log!

    // Extract items array regardless of nesting level
    let items = [];
    let meta = { total: 0, per_page: 20, current_page: 1, total_pages: 1 };

    if (Array.isArray(response)) {
      items = response;
    } else if (Array.isArray(response?.data)) {
      items = response.data;
      meta = response?.meta || response;
    } else if (Array.isArray(response?.data?.data)) {
      // Handles Laravel standard pagination: { data: { data: [...], current_page: 1 } }
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
  },
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
      transformResponse: (response) => response?.data ?? [],
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
      invalidatesTags: ["Transaction", "Account", "CompanyStatement", "TrialBalance"],
    }),
getPayrollHistory: builder.query({
  query: (params = {}) => ({ url: "/accounting/payroll/history", params }),
  transformResponse: (response) => {
    console.log('Payroll History Response:', response);
    // Handle both { status: true, data: [...] } and direct array
    if (response?.status === true && Array.isArray(response?.data)) {
      return response.data;
    }
    if (Array.isArray(response)) {
      return response;
    }
    return [];
  },
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
} = accountingApi;
