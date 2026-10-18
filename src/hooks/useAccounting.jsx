import { useCallback, useMemo, useState } from "react";
import { useAuth } from "../Context/AuthProvider";
import toast from "react-hot-toast";
import { BASE_URL } from "../Api/baseUrl";
import { openJournalEntryVoucher } from "../utils/branding/voucherDocument";
import {
  useGetAccountsQuery,
  useGetAccountsTreeQuery,
  useGetAccountStatementQuery,
  useAddAccountMutation,
  useUpdateAccountMutation,
  useDeleteAccountMutation,
  useManualAdjustAccountMutation,
  useGetAccountManualAdjustmentsQuery,
  useGetTransactionsQuery,
  useRecordIncomingMutation,
  useRecordOutgoingMutation,
  useTransferFundsMutation,
  useReverseTransactionMutation,
  useDocumentTransactionMutation,
  useUpdateSupplierMutation,
  usePostTransactionMutation,
  usePostTransactionsBatchMutation,
  useGetCustomerStatementQuery,
  useSendCustomerStatementMutation,
  useGetCompanyStatementQuery,
  useGetTrialBalanceQuery,
  useLazyPreviewCashClosingQuery,
  useCloseCashRegisterMutation,
  useGetCashClosingsQuery,
  useConfirmCashClosingMutation,
  useGetPayrollEmployeesQuery,
  useSetEmployeeSalaryMutation,
  usePayEmployeeSalaryMutation,
  useLazyGetPayrollHistoryQuery,
  useLazyGetIncomeStatementQuery,
  useLazyGetBalanceSheetQuery,
  useGetSelectableAccountsQuery,
  useGetSupplierCategoriesQuery,
  useAddSupplierCategoryMutation,
  useDeleteSupplierCategoryMutation,
  useGetSuppliersQuery,
  useAddSupplierMutation,
  useDeleteSupplierMutation,
  useLazyGetSupplierStatementQuery,
  useGetPurchaseInvoicesQuery,
  useAddPurchaseInvoiceMutation,
  useArchivePurchaseInvoiceMutation,
  useUnarchivePurchaseInvoiceMutation,
  usePayPurchaseInvoiceMutation,
  useDeletePurchaseInvoiceMutation,
  useUploadPurchaseInvoiceImageMutation,
  useRemovePurchaseInvoiceImageMutation,
  useLazyGetMaterialsQuery,
  useAddMaterialMutation,
  usePayBrokerCommissionMutation,
  useLazyGetBrokerCommissionHistoryQuery,
  useGiveEmployeeAdvanceMutation,
  useSettleEmployeeAdvanceMutation,
  useLazyGetEmployeeAdvanceBalanceQuery,
  useGetEmployeeAdvancesHistoryQuery,
  useLazyGetEmployeeStatementQuery,
  useGiveSupplierAdvanceMutation,
  useSettleSupplierAdvanceMutation,
  useLazyGetSupplierAdvanceBalanceQuery,
  useGetSupplierAdvancesHistoryQuery,
  useGetReconciliationLogsQuery,
  useRunReconciliationMutation,
} from "../RtkQuery/Slice/Accounting/AccountingApi";

/**
 * The same token lookup used everywhere else in the app
 * (see PaymentsContainer.jsx's getToken()).
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
 * Everything the Accounting UI needs, in one place: Chart of Accounts
 * management, transaction posting (incoming/outgoing/transfer/reverse),
 * customer/company statements, the trial balance, and exporting a
 * transaction's سند قبض / سند صرف voucher for printing.
 */
export const useAccounting = () => {
  // صلاحيات تبويبات المحاسبة (financials-tab-*) - طلب صريح. الاستعلامات التي
  // يفرض الباك-إند عليها صلاحية التبويب تُتخطّى (skip) عند غيابها كي لا
  // يُطلق موظف بصلاحيات محدودة طلبات تنتهي بـ 403 عند فتح الصفحة.
  // المنطق مطابق لـ AccountingTabs::anyOf على الباك-إند (يكفي تبويب واحد).
  const { hasPermission, isSuperAdmin } = useAuth();
  const canAnyTab = (...keys) =>
    isSuperAdmin() || hasPermission(keys.map((key) => `financials-tab-${key}`));

  // ---- Chart of Accounts -------------------------------------------------
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [deleteAccountTarget, setDeleteAccountTarget] = useState(null);

  // "عدم ظهور الزبائن يلي رصيدهن = 0 في الشجرة" (طلب صريح) - مخفيون
  // افتراضيًا، والزر في دليل الحسابات يُظهرهم عند الحاجة.
  const [showZeroCustomerAccounts, setShowZeroCustomerAccounts] = useState(false);
  const { data: accountsTree = [], isFetching: isFetchingAccountsTree } =
    useGetAccountsTreeQuery({ includeZeroCustomers: showZeroCustomerAccounts });
  const { data: accountsFlat = [], isFetching: isFetchingAccounts } =
    useGetAccountsQuery({});

  const [addAccount, { isLoading: isAddingAccount }] = useAddAccountMutation();
  const [updateAccount, { isLoading: isUpdatingAccount }] =
    useUpdateAccountMutation();
  const [deleteAccount, { isLoading: isDeletingAccount }] =
    useDeleteAccountMutation();
  const [manualAdjustAccountMutation, { isLoading: isManualAdjustingAccount }] =
    useManualAdjustAccountMutation();

  // "تعديل يدوي للحسابات من شجرة الحسابات (من السوبر ادمن فقط)" - راجع
  // AccountController::manualAdjust على الباك-إند. reason إلزامي.
  const manualAdjustAccount = useCallback(
    async (id, data) => {
      try {
        await manualAdjustAccountMutation({ id, ...data }).unwrap();
        toast.success("تم تعديل الحساب يدويًا بنجاح");
        return true;
      } catch (error) {
        toast.error(error?.data?.message || "فشل التعديل اليدوي للحساب");
        return false;
      }
    },
    [manualAdjustAccountMutation]
  );

  const { data: accountManualAdjustments = [], isFetching: isFetchingAccountManualAdjustments } =
    useGetAccountManualAdjustmentsQuery(editingAccount?.id, { skip: !editingAccount?.id });

  // Cash/bank accounts only - used to populate the "from/to" selects for
  // incoming/outgoing/transfer forms.
  const cashAccounts = useMemo(
    () => accountsFlat.filter((a) => a.is_cash_account),
    [accountsFlat]
  );
  // Postable (non-header) accounts - valid targets for an outgoing entry.
  const postableAccounts = useMemo(
    () => accountsFlat.filter((a) => a.is_transactional),
    [accountsFlat]
  );

  const openCreateAccount = useCallback(() => {
    setEditingAccount(null);
    setAccountDialogOpen(true);
  }, []);

  const openEditAccount = useCallback((account) => {
    setEditingAccount(account);
    setAccountDialogOpen(true);
  }, []);

  const handleSaveAccount = useCallback(
    async (data) => {
      try {
        if (editingAccount) {
          await updateAccount({ id: editingAccount.id, ...data }).unwrap();
          toast.success("تم تحديث الحساب بنجاح");
        } else {
          await addAccount(data).unwrap();
          toast.success("تم إنشاء الحساب بنجاح");
        }
        setAccountDialogOpen(false);
        setEditingAccount(null);
        return true;
      } catch (error) {
        toast.error(error?.data?.message || "فشل في حفظ الحساب");
        return false;
      }
    },
    [editingAccount, addAccount, updateAccount]
  );

  const handleDeleteAccount = useCallback(async () => {
    if (!deleteAccountTarget) return;
    try {
      await deleteAccount(deleteAccountTarget.id).unwrap();
      toast.success("تم حذف الحساب بنجاح");
      setDeleteAccountTarget(null);
      return true;
    } catch (error) {
      toast.error(error?.data?.message || "تعذر حذف الحساب");
      return false;
    }
  }, [deleteAccountTarget, deleteAccount]);

  // A single account's own statement (e.g. viewing the Bank's ledger).
  const [inspectedAccountId, setInspectedAccountId] = useState(null);
  const [accountStatementFilters, setAccountStatementFilters] = useState({
    from_date: "",
    to_date: "",
  });
  const { data: accountStatement, isFetching: isFetchingAccountStatement } =
    useGetAccountStatementQuery(
      inspectedAccountId
        ? { id: inspectedAccountId, ...accountStatementFilters }
        : undefined,
      { skip: !inspectedAccountId }
    );

  // ---- Transactions -------------------------------------------------------
  const [transactionFilters, setTransactionFilters] = useState({
    per_page: 20,
    page: 1,
  });
  const { data: transactionsResponse, isFetching: isFetchingTransactions } =
    useGetTransactionsQuery(transactionFilters, { skip: !canAnyTab("transactions") });

const transactions = Array.isArray(transactionsResponse?.data) 
  ? transactionsResponse.data 
  : Array.isArray(transactionsResponse) 
    ? transactionsResponse 
    : [];
    
 const transactionsMeta = transactionsResponse?.meta ?? {
  total: 0,
  per_page: 20,
  current_page: 1,
  total_pages: 1,
};
  const [incomingDialogOpen, setIncomingDialogOpen] = useState(false);
  const [outgoingDialogOpen, setOutgoingDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [reverseTarget, setReverseTarget] = useState(null);

  const [recordIncoming, { isLoading: isRecordingIncoming }] =
    useRecordIncomingMutation();
  const [recordOutgoing, { isLoading: isRecordingOutgoing }] =
    useRecordOutgoingMutation();
  const [transferFunds, { isLoading: isTransferring }] =
    useTransferFundsMutation();
  const [reverseTransaction, { isLoading: isReversing }] =
    useReverseTransactionMutation();

  const handleRecordIncoming = useCallback(
    async (data) => {
      try {
        await recordIncoming(data).unwrap();
        toast.success("تم تسجيل قيد القبض بنجاح - بانتظار التوثيق (ارفع صورة السند من تبويب المعاملات لترحيله)");
        setIncomingDialogOpen(false);
        return true;
      } catch (error) {
        toast.error(error?.data?.message || "فشل في تسجيل قيد القبض");
        return false;
      }
    },
    [recordIncoming]
  );

  const handleRecordOutgoing = useCallback(
    async (data) => {
      try {
        await recordOutgoing(data).unwrap();
        toast.success("تم تسجيل قيد الصرف بنجاح - بانتظار التوثيق (ارفع صورة السند من تبويب المعاملات لترحيله)");
        setOutgoingDialogOpen(false);
        return true;
      } catch (error) {
        toast.error(error?.data?.message || "فشل في تسجيل قيد الصرف");
        return false;
      }
    },
    [recordOutgoing]
  );

  const handleTransfer = useCallback(
    async (data) => {
      try {
        await transferFunds(data).unwrap();
        toast.success("تم تسجيل التحويل بنجاح");
        setTransferDialogOpen(false);
        return true;
      } catch (error) {
        toast.error(error?.data?.message || "فشل في تسجيل التحويل");
        return false;
      }
    },
    [transferFunds]
  );

  // توثيق السندات (طلب صريح) ----------------------------------------------
  const [documentTarget, setDocumentTarget] = useState(null);
  const [documentTransactionMutation, { isLoading: isDocumentingTransaction }] =
    useDocumentTransactionMutation();

  const handleDocumentTransaction = useCallback(
    async (file) => {
      if (!documentTarget) return false;
      try {
        const body = new FormData();
        body.append("image", file);
        const res = await documentTransactionMutation({ id: documentTarget.id, body }).unwrap();
        const after = res?.data;
        toast.success(
          documentTarget.status !== "pending"
            ? "تم إرفاق صورة السند"
            : after?.status === "posted"
              ? "تم توثيق السند وترحيله على شجرة الحسابات"
              : "تم توثيق السند - بانتظار ترحيله من السوبر أدمن"
        );
        setDocumentTarget(null);
        return true;
      } catch (error) {
        toast.error(error?.data?.message || "تعذّر توثيق السند");
        return false;
      }
    },
    [documentTarget, documentTransactionMutation]
  );

  // ترحيل دفتر اليومية (السوبر أدمن فقط - الخادم يرفض غيره) ---------------
  const [postTransactionMutation, { isLoading: isPostingTransaction }] = usePostTransactionMutation();
  const [postTransactionsBatchMutation, { isLoading: isPostingBatch }] = usePostTransactionsBatchMutation();

  const handlePostTransaction = useCallback(
    async (id) => {
      try {
        await postTransactionMutation(id).unwrap();
        toast.success("تم ترحيل السند على شجرة الحسابات");
        return true;
      } catch (error) {
        toast.error(error?.data?.message || "تعذّر ترحيل السند");
        return false;
      }
    },
    [postTransactionMutation]
  );

  const handlePostTransactionsBatch = useCallback(
    async (ids) => {
      if (!ids?.length) return false;
      try {
        const res = await postTransactionsBatchMutation(ids).unwrap();
        const failed = res?.data?.failed ?? [];
        if (failed.length) toast.error(`${failed.length} سند تعذّر ترحيله: ${failed[0]?.message || ""}`);
        toast.success(res?.message || "تم الترحيل");
        return true;
      } catch (error) {
        toast.error(error?.data?.message || "تعذّر الترحيل");
        return false;
      }
    },
    [postTransactionsBatchMutation]
  );

  const handleReverse = useCallback(
    async (reason) => {
      if (!reverseTarget) return false;
      try {
        await reverseTransaction({ id: reverseTarget.id, reason }).unwrap();
        toast.success(reverseTarget.status === "pending" ? "تم إلغاء السند" : "تم عكس القيد بنجاح");
        setReverseTarget(null);
        return true;
      } catch (error) {
        toast.error(error?.data?.message || "فشل في عكس القيد");
        return false;
      }
    },
    [reverseTarget, reverseTransaction]
  );

  /**
   * Opens the printable سند قبض / سند صرف for a transaction in a new tab.
   * The endpoint returns full HTML (see resources/views/receipt.blade.php),
   * so - exactly like the existing handleReceipt() flow for old Payment
   * receipts in PaymentsContainer.jsx - we fetch it with the auth header
   * manually (a plain <a href> can't carry a Bearer token) and hand the
   * browser a blob URL to open/print.
   */
  const handleOpenVoucher = useCallback(async (journalEntryId, options = {}) => {
    if (!journalEntryId) {
      toast.error("رقم القيد مطلوب لعرض السند");
      return;
    }
    try {
      // السند يُولَّد بالواجهة بتصميم SAC الرسمي (voucherDocument.js)
      await openJournalEntryVoucher(journalEntryId, options);
    } catch (error) {
      toast.error(error?.message || "تعذر عرض السند");
    }
  }, []);

  // ---- Customer statement ---------------------------------------------------
  const [statementCustomerId, setStatementCustomerId] = useState(null);
  const [customerStatementFilters, setCustomerStatementFilters] = useState({
    from_date: "",
    to_date: "",
  });
  const { data: customerStatement, isFetching: isFetchingCustomerStatement } =
    useGetCustomerStatementQuery(
      statementCustomerId
        ? { customerId: statementCustomerId, ...customerStatementFilters }
        : undefined,
      { skip: !statementCustomerId }
    );

  const [sendCustomerStatementMutation, { isLoading: isSendingStatement }] =
    useSendCustomerStatementMutation();

  /**
   * Opens the professional كشف حساب (print preview) for a customer in a
   * new tab - same manual-fetch-with-auth-header + blob-URL pattern as
   * handleOpenVoucher, since this is a normal permission-gated API route,
   * not a signed link.
   */
  const printCustomerStatementDocument = useCallback(async (customerId, filters = {}) => {
    if (!customerId) {
      toast.error("رقم العميل مطلوب");
      return;
    }
    try {
      const token = getToken();
      const params = new URLSearchParams(filters).toString();
      const response = await fetch(
        `${BASE_URL}/accounting/customers/${customerId}/statement/print${params ? `?${params}` : ""}`,
        { headers: { Accept: "text/html", Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error(`تعذر عرض كشف الحساب (${response.status})`);
      const html = await response.text();
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      toast.error(error.message || "تعذر عرض كشف الحساب");
    }
  }, []);

  /**
   * Downloads the actual PDF (dompdf, server-side) - same auth-header
   * fetch, but triggers a real file download via a temporary <a>.
   */
  const downloadCustomerStatementDocument = useCallback(async (customerId, filters = {}) => {
    if (!customerId) {
      toast.error("رقم العميل مطلوب");
      return;
    }
    try {
      const token = getToken();
      const params = new URLSearchParams(filters).toString();
      const response = await fetch(
        `${BASE_URL}/accounting/customers/${customerId}/statement/pdf${params ? `?${params}` : ""}`,
        { headers: { Accept: "application/pdf", Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error(`تعذر تحميل كشف الحساب (${response.status})`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kashf-hesab-${customerId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      toast.error(error.message || "تعذر تحميل كشف الحساب");
    }
  }, []);

  const sendCustomerStatementDocument = useCallback(
    async (customerId, { email, message, from_date, to_date } = {}) => {
      if (!customerId) {
        toast.error("رقم العميل مطلوب");
        return false;
      }
      try {
        await sendCustomerStatementMutation({
          customerId,
          ...(email ? { email } : {}),
          ...(message ? { message } : {}),
          ...(from_date ? { from_date } : {}),
          ...(to_date ? { to_date } : {}),
        }).unwrap();
        toast.success("تم إرسال كشف الحساب بالبريد الإلكتروني بنجاح");
        return true;
      } catch (error) {
        toast.error(error?.data?.message || "فشل إرسال كشف الحساب");
        return false;
      }
    },
    [sendCustomerStatementMutation]
  );

  // ---- Company statement (general ledger of the cashbox/bank) --------------
  const [companyAccountId, setCompanyAccountId] = useState(null);
  const [companyStatementFilters, setCompanyStatementFilters] = useState({
    from_date: "",
    to_date: "",
  });
  const { data: companyStatement, isFetching: isFetchingCompanyStatement } =
    useGetCompanyStatementQuery({
      ...(companyAccountId ? { account_id: companyAccountId } : {}),
      ...companyStatementFilters,
    });

  // ---- Trial balance ---------------------------------------------------------
  const { data: trialBalance, isFetching: isFetchingTrialBalance } =
    useGetTrialBalanceQuery();

  // ---- Cash register closing (تقفيل الصندوق اليومي) --------------------------
  const [cashClosingFilters, setCashClosingFilters] = useState({ status: "pending", page: 1 });
  const { data: cashClosingsResponse, isFetching: isFetchingCashClosings } =
    useGetCashClosingsQuery(cashClosingFilters, { skip: !canAnyTab("cash-closing") });
  const cashClosings = cashClosingsResponse?.data ?? [];
  const cashClosingsMeta = cashClosingsResponse?.meta ?? {
    total: 0,
    per_page: 20,
    current_page: 1,
    total_pages: 1,
  };

  const [previewCashClosingTrigger, { data: cashClosingPreview, isFetching: isPreviewingCashClosing }] =
    useLazyPreviewCashClosingQuery();

  const [closeCashRegisterMutation, { isLoading: isClosingCashRegister }] =
    useCloseCashRegisterMutation();
  const [confirmCashClosingMutation, { isLoading: isConfirmingCashClosing }] =
    useConfirmCashClosingMutation();

  const previewCashClosing = useCallback(
    (accountId, date, employeeId) => {
      if (!accountId || !date) {
        toast.error("الحساب والتاريخ مطلوبان لمعاينة التقفيل");
        return;
      }
      previewCashClosingTrigger({
        account_id: accountId,
        date,
        ...(employeeId ? { employee_id: employeeId } : {}),
      });
    },
    [previewCashClosingTrigger]
  );

  const closeCashRegister = useCallback(
    async (data) => {
      try {
        await closeCashRegisterMutation(data).unwrap();
        toast.success("تم إغلاق الصندوق - بانتظار تأكيد المشرف");
        return true;
      } catch (error) {
        toast.error(error?.data?.message || "فشل إغلاق الصندوق");
        return false;
      }
    },
    [closeCashRegisterMutation]
  );

  const confirmCashClosing = useCallback(
    async (id, countedAmount, notes) => {
      try {
        await confirmCashClosingMutation({ id, counted_amount: countedAmount, notes }).unwrap();
        toast.success("تم تأكيد التقفيل بنجاح");
        return true;
      } catch (error) {
        toast.error(error?.data?.message || "فشل تأكيد التقفيل");
        return false;
      }
    },
    [confirmCashClosingMutation]
  );

  /**
   * Opens the printable handover slip - same manual-fetch-with-auth-header
   * + blob-URL pattern as handleOpenVoucher/printCustomerStatementDocument,
   * since this is a normal permission-gated API route, not a signed link.
   */
  const printCashClosing = useCallback(async (closingId) => {
    if (!closingId) return;
    try {
      const token = getToken();
      const response = await fetch(`${BASE_URL}/accounting/cash-closings/${closingId}/print`, {
        headers: { Accept: "text/html", Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`تعذر عرض سند التقفيل (${response.status})`);
      const html = await response.text();
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      toast.error(error.message || "تعذر عرض سند التقفيل");
    }
  }, []);

  // ---- Payroll (الرواتب والأجور) ----------------------------------------
  const { data: payrollEmployees = [], isFetching: isFetchingPayrollEmployees } =
    useGetPayrollEmployeesQuery(undefined, { skip: !canAnyTab("payroll", "advances") });

  const [setEmployeeSalaryMutation, { isLoading: isSavingSalary }] =
    useSetEmployeeSalaryMutation();
  const [payEmployeeSalaryMutation, { isLoading: isPayingSalary }] =
    usePayEmployeeSalaryMutation();
    
    const [fetchPayrollHistory, { data: payrollHistoryResponse, isFetching: isFetchingPayrollHistory }] =
    useLazyGetPayrollHistoryQuery();
  const payrollHistory = payrollHistoryResponse?.data ?? [];
  const payrollHistoryMeta = payrollHistoryResponse?.meta ?? {
    total: 0,
    per_page: 20,
    current_page: 1,
    total_pages: 1,
  };
  const [payrollHistoryFilters, setPayrollHistoryFilters] = useState({ page: 1 });



  const setEmployeeSalary = useCallback(
    async (userId, data) => {
      try {
        await setEmployeeSalaryMutation({ userId, ...data }).unwrap();
        toast.success("تم تحديد راتب الموظف بنجاح");
        return true;
      } catch (error) {
        toast.error(error?.data?.message || "فشل تحديد الراتب");
        return false;
      }
    },
    [setEmployeeSalaryMutation]
  );

  const payEmployeeSalary = useCallback(
    async (data) => {
      try {
        const response = await payEmployeeSalaryMutation(data).unwrap();
        // طلب العميل: إشارة صريحة عند الصرف أنه خُصمت سلفة سابقة من هذا
        // الموظف + القيمة الصافية التي خرجت فعليًا من الصندوق - انظر
        // PayrollController::pay() / PayrollService::paySalary().
        const payload = response?.data;
        if (payload?.had_outstanding_advance) {
          toast.success(
            `تم صرف الراتب - خُصم من سلفة سابقة: ${Number(payload.advance_deducted ?? 0).toLocaleString("ar-SY", { minimumFractionDigits: 2 })}، الصافي المدفوع فعليًا: ${Number(payload.net_amount_paid ?? 0).toLocaleString("ar-SY", { minimumFractionDigits: 2 })}${payload.advance_remaining_after != null ? `، المتبقي من السلفة: ${Number(payload.advance_remaining_after).toLocaleString("ar-SY", { minimumFractionDigits: 2 })}` : ""}`,
            { duration: 6000 }
          );
        } else {
          toast.success("تم تسجيل صرف الراتب بنجاح - بانتظار التوثيق (ارفع صورة السند من تبويب المعاملات لترحيله)");
        }
        return payload ?? true;
      } catch (error) {
        toast.error(error?.data?.message || "فشل صرف الراتب");
        return false;
      }
    },
    [payEmployeeSalaryMutation]
  );

  const loadPayrollHistory = useCallback(
    (filters = {}) => {
      const merged = { ...payrollHistoryFilters, ...filters };
      setPayrollHistoryFilters(merged);
      fetchPayrollHistory(merged);
    },
    [fetchPayrollHistory, payrollHistoryFilters]
  );


  // ---- Financial statements (قائمة الدخل، الميزانية العمومية) --------------
  const [fetchIncomeStatement, { data: incomeStatement, isFetching: isFetchingIncomeStatement }] =
    useLazyGetIncomeStatementQuery();
  const [fetchBalanceSheet, { data: balanceSheet, isFetching: isFetchingBalanceSheet }] =
    useLazyGetBalanceSheetQuery();

  const loadIncomeStatement = useCallback(
    (fromDate, toDate) => {
      if (!fromDate || !toDate) {
        toast.error("التاريخ من وإلى مطلوبان");
        return;
      }
      fetchIncomeStatement({ from_date: fromDate, to_date: toDate });
    },
    [fetchIncomeStatement]
  );

  const loadBalanceSheet = useCallback(
    (asOfDate) => {
      fetchBalanceSheet(asOfDate ? { as_of_date: asOfDate } : {});
    },
    [fetchBalanceSheet]
  );

  // ---- Accounts for select-lists (postable/active, with full path) -------
  const { data: selectableAccounts = [], isFetching: isFetchingSelectableAccounts } =
    useGetSelectableAccountsQuery();

  // ---- "والتأكد من جميع الحسابات" - راجع ReconciliationController --------
  const {
    data: reconciliationLogs = [],
    isFetching: isFetchingReconciliationLogs,
    refetch: refetchReconciliationLogs,
  } = useGetReconciliationLogsQuery();
  const [runReconciliationMutation, { isLoading: isRunningReconciliation }] =
    useRunReconciliationMutation();

  const runReconciliation = useCallback(async () => {
    try {
      const result = await runReconciliationMutation().unwrap();
      toast.success("اكتمل التدقيق الشامل لكل الحسابات");
      return result;
    } catch (error) {
      toast.error(error?.data?.message || "فشل تشغيل التدقيق الشامل");
      return null;
    }
  }, [runReconciliationMutation]);

  // ---- Suppliers (الموردون) ------------------------------------------------
  const { data: supplierCategories = [], isFetching: isFetchingSupplierCategories } =
    useGetSupplierCategoriesQuery(undefined, { skip: !canAnyTab("suppliers", "purchase-invoices") });
  const [addSupplierCategoryMutation, { isLoading: isSavingSupplierCategory }] =
    useAddSupplierCategoryMutation();
  const [deleteSupplierCategoryMutation, { isLoading: isDeletingSupplierCategory }] =
    useDeleteSupplierCategoryMutation();
  const { data: suppliers = [], isFetching: isFetchingSuppliers } =
    useGetSuppliersQuery(undefined, { skip: !canAnyTab("suppliers", "purchase-invoices", "advances") });
  const [addSupplierMutation, { isLoading: isSavingSupplier }] =
    useAddSupplierMutation();
  const [deleteSupplierMutation, { isLoading: isDeletingSupplier }] =
    useDeleteSupplierMutation();

  const addSupplierCategory = useCallback(
    async (data) => {
      try {
        await addSupplierCategoryMutation(data).unwrap();
        toast.success("تم إنشاء فئة الموردين بنجاح");
        return true;
      } catch (error) {
        toast.error(error?.data?.message || "فشل إنشاء فئة الموردين");
        return false;
      }
    },
    [addSupplierCategoryMutation]
  );

  // طلب صريح: "حذف فئات الموردين".
  const deleteSupplierCategory = useCallback(
    async (id) => {
      try {
        await deleteSupplierCategoryMutation(id).unwrap();
        toast.success("تم حذف فئة الموردين بنجاح");
        return true;
      } catch (error) {
        toast.error(error?.data?.message || "تعذر حذف فئة الموردين");
        return false;
      }
    },
    [deleteSupplierCategoryMutation]
  );

  const [updateSupplierMutation, { isLoading: isUpdatingSupplier }] = useUpdateSupplierMutation();

  // تعديل مورد + استكمال الثبوتية (طلب صريح). body: FormData.
  const updateSupplier = useCallback(
    async (id, body) => {
      try {
        await updateSupplierMutation({ id, body }).unwrap();
        toast.success("تم تعديل بيانات المورد");
        return true;
      } catch (error) {
        const errors = error?.data?.errors;
        const first = errors ? Object.values(errors)?.[0]?.[0] : null;
        toast.error(first || error?.data?.message || "فشل تعديل المورد");
        return false;
      }
    },
    [updateSupplierMutation]
  );

  const addSupplier = useCallback(
    async (data) => {
      try {
        await addSupplierMutation(data).unwrap();
        toast.success("تم إضافة المورد بنجاح");
        return true;
      } catch (error) {
        toast.error(error?.data?.message || "فشل إضافة المورد");
        return false;
      }
    },
    [addSupplierMutation]
  );

  const deleteSupplier = useCallback(
    async (id) => {
      try {
        await deleteSupplierMutation(id).unwrap();
        toast.success("تم حذف المورد بنجاح");
        return true;
      } catch (error) {
        toast.error(error?.data?.message || "فشل حذف المورد");
        return false;
      }
    },
    [deleteSupplierMutation]
  );

  // ---- سلف الموظفين والموردين (Employee & Supplier Advances) -------------
  // كل سلفة تُخصم تلقائيًا (FIFO) من أول راتب/فاتورة شراء لاحقة على
  // الباك-إند - لا حاجة لأي فعل هنا غير المنح والعرض.
  const [employeeAdvanceHistoryFilters, setEmployeeAdvanceHistoryFilters] = useState({});
  const { data: employeeAdvancesResponse, isFetching: isFetchingEmployeeAdvances } =
    useGetEmployeeAdvancesHistoryQuery(employeeAdvanceHistoryFilters, {
      skip: !canAnyTab("advances", "payroll"),
    });
  const employeeAdvances = employeeAdvancesResponse?.data ?? [];
  const employeeAdvancesTotalOutstanding = employeeAdvancesResponse?.meta?.total_outstanding;

  const [giveEmployeeAdvanceMutation, { isLoading: isGivingEmployeeAdvance }] =
    useGiveEmployeeAdvanceMutation();
  const [triggerEmployeeAdvanceBalance] = useLazyGetEmployeeAdvanceBalanceQuery();

  const giveEmployeeAdvance = useCallback(
    async ({ userId, ...data }) => {
      try {
        const result = await giveEmployeeAdvanceMutation({ userId, ...data }).unwrap();
        toast.success("تم تسجيل سلفة الموظف بنجاح - بانتظار التوثيق (ارفع صورة السند من تبويب المعاملات لترحيله)");
        return result?.data ?? result;
      } catch (error) {
        toast.error(error?.data?.message || "فشل تسجيل سلفة الموظف");
        return null;
      }
    },
    [giveEmployeeAdvanceMutation]
  );

  const getEmployeeAdvanceBalance = useCallback(
    async (userId) => {
      try {
        const result = await triggerEmployeeAdvanceBalance(userId).unwrap();
        return result?.data ?? result;
      } catch (error) {
        toast.error(error?.data?.message || "فشل جلب رصيد السلفة");
        return null;
      }
    },
    [triggerEmployeeAdvanceBalance]
  );

  // تحصيل/تسوية سلفة موظف يدويًا (سند قبض) - طلب صريح: موظف يستقيل وعليه
  // سلفة لم تُسدَّد بعد. amount اختياري - بلا تحديد، تُسوَّى كامل السلفة
  // المتبقية دفعة واحدة (هذا بالضبط ما تحتاجه حالة الاستقالة).
  const [settleEmployeeAdvanceMutation, { isLoading: isSettlingEmployeeAdvance }] =
    useSettleEmployeeAdvanceMutation();

  const settleEmployeeAdvance = useCallback(
    async ({ userId, ...data }) => {
      try {
        const result = await settleEmployeeAdvanceMutation({ userId, ...data }).unwrap();
        toast.success("تم تسجيل سند قبض تحصيل السلفة بنجاح - بانتظار التوثيق (ارفع صورة السند من تبويب المعاملات لترحيله)");
        return result?.data ?? result;
      } catch (error) {
        toast.error(error?.data?.message || "فشل تحصيل السلفة");
        return null;
      }
    },
    [settleEmployeeAdvanceMutation]
  );

  // ---- كشف حساب موظف (Employee Statement) - راتب+سلفة+مكافآت+خصومات ------
  // طلب صريح (المطلب الرابع). راجع EmployeeStatementController/Service.
  const [statementEmployeeId, setStatementEmployeeId] = useState(null);
  const [employeeStatementFilters, setEmployeeStatementFilters] = useState({});
  const [
    fetchEmployeeStatement,
    { data: employeeStatement, isFetching: isFetchingEmployeeStatement },
  ] = useLazyGetEmployeeStatementQuery();

  const openEmployeeStatement = useCallback(
    (userId) => {
      setStatementEmployeeId(userId);
      setEmployeeStatementFilters({});
      fetchEmployeeStatement({ userId });
    },
    [fetchEmployeeStatement]
  );

  const closeEmployeeStatement = useCallback(() => {
    setStatementEmployeeId(null);
  }, []);

  // ملاحظة: على عكس loadPayrollHistory (الذي يدمج فوق الفلاتر الحالية)،
  // هذه الدالة تستبدل الفلاتر بالكامل في كل استدعاء - الحوار (Dialog)
  // يمرّر دائمًا المجموعة الكاملة المطلوبة (from_date/to_date معًا، أو {}
  // لإعادة الضبط لنطاق آخر 12 شهرًا الافتراضي)، فلا حاجة للدمج، وتفاديًا
  // لتسريب مفاتيح قديمة (مثل from_date سابق) لا يريدها المستخدم بعد الآن.
  const loadEmployeeStatement = useCallback(
    (filters = {}) => {
      if (!statementEmployeeId) return;
      setEmployeeStatementFilters(filters);
      fetchEmployeeStatement({ userId: statementEmployeeId, ...filters });
    },
    [fetchEmployeeStatement, statementEmployeeId]
  );

  const [supplierAdvanceHistoryFilters, setSupplierAdvanceHistoryFilters] = useState({});
  const { data: supplierAdvancesResponse, isFetching: isFetchingSupplierAdvances } =
    useGetSupplierAdvancesHistoryQuery(supplierAdvanceHistoryFilters, {
      skip: !canAnyTab("advances", "suppliers", "purchase-invoices"),
    });
  const supplierAdvances = supplierAdvancesResponse?.data ?? [];
  const supplierAdvancesTotalOutstanding = supplierAdvancesResponse?.meta?.total_outstanding;

  const [giveSupplierAdvanceMutation, { isLoading: isGivingSupplierAdvance }] =
    useGiveSupplierAdvanceMutation();
  const [triggerSupplierAdvanceBalance] = useLazyGetSupplierAdvanceBalanceQuery();

  const giveSupplierAdvance = useCallback(
    async ({ supplierId, ...data }) => {
      try {
        const result = await giveSupplierAdvanceMutation({ supplierId, ...data }).unwrap();
        toast.success("تم تسجيل سلفة المورد بنجاح - بانتظار التوثيق (ارفع صورة السند من تبويب المعاملات لترحيله)");
        return result?.data ?? result;
      } catch (error) {
        toast.error(error?.data?.message || "فشل تسجيل سلفة المورد");
        return null;
      }
    },
    [giveSupplierAdvanceMutation]
  );

  const getSupplierAdvanceBalance = useCallback(
    async (supplierId) => {
      try {
        const result = await triggerSupplierAdvanceBalance(supplierId).unwrap();
        return result?.data ?? result;
      } catch (error) {
        toast.error(error?.data?.message || "فشل جلب رصيد السلفة");
        return null;
      }
    },
    [triggerSupplierAdvanceBalance]
  );

  // تحصيل/استرجاع سلفة مورد يدويًا (سند قبض) - نفس فكرة settleEmployeeAdvance
  // تمامًا، على الجانب الآخر.
  const [settleSupplierAdvanceMutation, { isLoading: isSettlingSupplierAdvance }] =
    useSettleSupplierAdvanceMutation();

  const settleSupplierAdvance = useCallback(
    async ({ supplierId, ...data }) => {
      try {
        const result = await settleSupplierAdvanceMutation({ supplierId, ...data }).unwrap();
        toast.success("تم تسجيل سند قبض تحصيل السلفة بنجاح - بانتظار التوثيق (ارفع صورة السند من تبويب المعاملات لترحيله)");
        return result?.data ?? result;
      } catch (error) {
        toast.error(error?.data?.message || "فشل تحصيل السلفة");
        return null;
      }
    },
    [settleSupplierAdvanceMutation]
  );

  // ---- كشف حساب مورد (Supplier Statement) - فواتير شراء+مواد+دفعات+سلف ----
  // طلب صريح من العميل. راجع SupplierStatementController/Service. نفس
  // نمط كشف حساب الموظف (statementEmployeeId/...) أعلاه تمامًا.
  const [statementSupplierId, setStatementSupplierId] = useState(null);
  const [supplierStatementFilters, setSupplierStatementFilters] = useState({});
  const [
    fetchSupplierStatement,
    { data: supplierStatement, isFetching: isFetchingSupplierStatement },
  ] = useLazyGetSupplierStatementQuery();

  const openSupplierStatement = useCallback(
    (supplierId) => {
      setStatementSupplierId(supplierId);
      setSupplierStatementFilters({});
      fetchSupplierStatement({ supplierId });
    },
    [fetchSupplierStatement]
  );

  const closeSupplierStatement = useCallback(() => {
    setStatementSupplierId(null);
  }, []);

  // تستبدل الفلاتر بالكامل في كل استدعاء (لا تدمج فوق الحالي) - نفس سبب
  // loadEmployeeStatement أعلاه بالضبط.
  const loadSupplierStatement = useCallback(
    (filters = {}) => {
      if (!statementSupplierId) return;
      setSupplierStatementFilters(filters);
      fetchSupplierStatement({ supplierId: statementSupplierId, ...filters });
    },
    [fetchSupplierStatement, statementSupplierId]
  );

  // ---- Purchase invoices (فواتير الشراء) -----------------------------------
  const [purchaseInvoiceFilters, setPurchaseInvoiceFilters] = useState({ page: 1 });
  const { data: purchaseInvoicesResponse, isFetching: isFetchingPurchaseInvoices } =
    useGetPurchaseInvoicesQuery(purchaseInvoiceFilters, { skip: !canAnyTab("purchase-invoices") });
  const purchaseInvoices = purchaseInvoicesResponse?.data ?? [];
  const purchaseInvoicesMeta = purchaseInvoicesResponse?.meta ?? {
    total: 0,
    per_page: 20,
    current_page: 1,
    total_pages: 1,
  };
  const [addPurchaseInvoiceMutation, { isLoading: isSavingPurchaseInvoice }] =
    useAddPurchaseInvoiceMutation();

  const addPurchaseInvoice = useCallback(
    async (data) => {
      try {
        const response = await addPurchaseInvoiceMutation(data).unwrap();
        const advanceDeducted = Number(response?.data?.advance_deducted || 0);
        toast.success(
          advanceDeducted > 0
            ? `تم تسجيل فاتورة الشراء - خُصم من سلفة المورد: ${advanceDeducted.toLocaleString("ar-SY", { minimumFractionDigits: 2 })}$`
            : "تم تسجيل فاتورة الشراء - سند الدفع (إن وُجد) بانتظار التوثيق",
          { duration: 6000 }
        );
        return true;
      } catch (error) {
        toast.error(error?.data?.message || "فشل تسجيل فاتورة الشراء");
        return false;
      }
    },
    [addPurchaseInvoiceMutation]
  );

  /**
   * سند دفع فاتورة الشراء - يعيد استخدام نفس مسار سند الصرف العادي
   * (VoucherController::show) الذي يفتحه handleOpenVoucher أعلاه بالضبط،
   * فقط نستخرج معرّف القيد من payment_journal_entry_id.
   */
  const openPurchaseInvoiceVoucher = useCallback(
    (invoice) => {
      if (!invoice?.payment_journal_entry_id) {
        toast.error("لا يوجد سند دفع لهذه الفاتورة");
        return;
      }
      handleOpenVoucher(invoice.payment_journal_entry_id, { title: "سند فاتورة" });
    },
    [handleOpenVoucher]
  );

  const [archivePurchaseInvoiceMutation, { isLoading: isArchivingPurchaseInvoice }] =
    useArchivePurchaseInvoiceMutation();
  const [unarchivePurchaseInvoiceMutation, { isLoading: isUnarchivingPurchaseInvoice }] =
    useUnarchivePurchaseInvoiceMutation();

  const archivePurchaseInvoice = useCallback(
    async (id) => {
      try {
        await archivePurchaseInvoiceMutation(id).unwrap();
        toast.success("تمت أرشفة الفاتورة");
        return true;
      } catch (error) {
        toast.error(error?.data?.message || "فشلت الأرشفة");
        return false;
      }
    },
    [archivePurchaseInvoiceMutation]
  );

  const unarchivePurchaseInvoice = useCallback(
    async (id) => {
      try {
        await unarchivePurchaseInvoiceMutation(id).unwrap();
        toast.success("تمت استعادة الفاتورة من الأرشيف");
        return true;
      } catch (error) {
        toast.error(error?.data?.message || "فشلت الاستعادة");
        return false;
      }
    },
    [unarchivePurchaseInvoiceMutation]
  );

  const [deletePurchaseInvoiceMutation, { isLoading: isDeletingPurchaseInvoice }] =
    useDeletePurchaseInvoiceMutation();

  const deletePurchaseInvoice = useCallback(
    async (id) => {
      try {
        await deletePurchaseInvoiceMutation(id).unwrap();
        toast.success("تم حذف الفاتورة وعكس قيودها المحاسبية");
        return true;
      } catch (error) {
        toast.error(error?.data?.message || "فشل حذف الفاتورة");
        return false;
      }
    },
    [deletePurchaseInvoiceMutation]
  );

  const [payPurchaseInvoiceMutation, { isLoading: isPayingPurchaseInvoice }] =
    usePayPurchaseInvoiceMutation();

  const payPurchaseInvoice = useCallback(
    async (id, data = {}) => {
      try {
        await payPurchaseInvoiceMutation({ id, ...data }).unwrap();
        toast.success("تم تسجيل الدفعة بنجاح - بانتظار التوثيق (ارفع صورة السند من تبويب المعاملات لترحيله)");
        return true;
      } catch (error) {
        toast.error(error?.data?.message || "فشل تسجيل الدفعة");
        return false;
      }
    },
    [payPurchaseInvoiceMutation]
  );

  // إرفاق/إزالة صورة الفاتورة الخارجية (طلب صريح) --------------------------
  const [uploadPurchaseInvoiceImageMutation, { isLoading: isUploadingPurchaseInvoiceImage }] =
    useUploadPurchaseInvoiceImageMutation();
  const [removePurchaseInvoiceImageMutation, { isLoading: isRemovingPurchaseInvoiceImage }] =
    useRemovePurchaseInvoiceImageMutation();

  const uploadPurchaseInvoiceImage = useCallback(
    async (id, file) => {
      try {
        const formData = new FormData();
        formData.append("image", file);
        await uploadPurchaseInvoiceImageMutation({ id, body: formData }).unwrap();
        toast.success("تم إرفاق صورة الفاتورة بنجاح");
        return true;
      } catch (error) {
        toast.error(error?.data?.message || "تعذّر إرفاق صورة الفاتورة");
        return false;
      }
    },
    [uploadPurchaseInvoiceImageMutation]
  );

  const removePurchaseInvoiceImage = useCallback(
    async (id) => {
      try {
        await removePurchaseInvoiceImageMutation(id).unwrap();
        toast.success("تم حذف صورة الفاتورة");
        return true;
      } catch (error) {
        toast.error(error?.data?.message || "تعذّر حذف صورة الفاتورة");
        return false;
      }
    },
    [removePurchaseInvoiceImageMutation]
  );

  // ---- فهرس المواد (طلب العميل: البحث عن المادة وكميتها) ------------------
  const [fetchMaterials, { data: materials = [], isFetching: isFetchingMaterials }] =
    useLazyGetMaterialsQuery();
  const [addMaterialMutation, { isLoading: isSavingMaterial }] = useAddMaterialMutation();

  const searchMaterials = useCallback(
    (search = "") => {
      fetchMaterials(search ? { search } : {});
    },
    [fetchMaterials]
  );

  const addMaterial = useCallback(
    async (data) => {
      try {
        const result = await addMaterialMutation(data).unwrap();
        return result?.data ?? null;
      } catch (error) {
        toast.error(error?.data?.message || "فشل إضافة المادة");
        return null;
      }
    },
    [addMaterialMutation]
  );

  // ---- Broker commissions (عمولات الوسطاء) --------------------------------
  const [payBrokerCommissionMutation, { isLoading: isPayingCommission }] =
    usePayBrokerCommissionMutation();
  const [
    fetchBrokerCommissionHistory,
    { data: brokerCommissionHistoryResponse, isFetching: isFetchingBrokerCommissionHistory },
  ] = useLazyGetBrokerCommissionHistoryQuery();
  const brokerCommissionHistory = brokerCommissionHistoryResponse?.data ?? [];
  const brokerCommissionHistoryMeta = brokerCommissionHistoryResponse?.meta ?? {
    total: 0,
    per_page: 20,
    current_page: 1,
    total_pages: 1,
  };
  const [brokerCommissionHistoryFilters, setBrokerCommissionHistoryFilters] = useState({ page: 1 });

  const payBrokerCommission = useCallback(
    async (bookingId, data = {}) => {
      if (!bookingId) {
        toast.error("رقم الحجز مطلوب");
        return false;
      }
      try {
        await payBrokerCommissionMutation({ bookingId, ...data }).unwrap();
        toast.success("تم دفع عمولة الوسيط بنجاح");
        return true;
      } catch (error) {
        toast.error(error?.data?.message || "فشل دفع عمولة الوسيط");
        return false;
      }
    },
    [payBrokerCommissionMutation]
  );

  const loadBrokerCommissionHistory = useCallback(
    (filters = {}) => {
      const merged = { ...brokerCommissionHistoryFilters, ...filters };
      setBrokerCommissionHistoryFilters(merged);
      fetchBrokerCommissionHistory(merged);
    },
    [fetchBrokerCommissionHistory, brokerCommissionHistoryFilters]
  );

  return {
    // Chart of accounts
    accountsTree,
    showZeroCustomerAccounts,
    setShowZeroCustomerAccounts,
    accountsFlat,
    cashAccounts,
    postableAccounts,
    isFetchingAccounts: isFetchingAccounts || isFetchingAccountsTree,
    accountDialogOpen,
    setAccountDialogOpen,
    editingAccount,
    openCreateAccount,
    openEditAccount,
    handleSaveAccount,
    isSavingAccount: isAddingAccount || isUpdatingAccount,
    deleteAccountTarget,
    setDeleteAccountTarget,
    handleDeleteAccount,
    isDeletingAccount,
    // "تعديل يدوي للحسابات من شجرة الحسابات (من السوبر ادمن فقط)"
    manualAdjustAccount,
    isManualAdjustingAccount,
    accountManualAdjustments,
    isFetchingAccountManualAdjustments,
    inspectedAccountId,
    setInspectedAccountId,
    accountStatementFilters,
    setAccountStatementFilters,
    accountStatement,
    isFetchingAccountStatement,

    // Transactions
    transactions,
    transactionsMeta,
    isFetchingTransactions,
    transactionFilters,
    setTransactionFilters,
    incomingDialogOpen,
    setIncomingDialogOpen,
    outgoingDialogOpen,
    setOutgoingDialogOpen,
    transferDialogOpen,
    setTransferDialogOpen,
    reverseTarget,
    setReverseTarget,
    handleRecordIncoming,
    isRecordingIncoming,
    handleRecordOutgoing,
    isRecordingOutgoing,
    handleTransfer,
    isTransferring,
    handleReverse,
    isReversing,
    documentTarget,
    setDocumentTarget,
    handleDocumentTransaction,
    isDocumentingTransaction,
    handlePostTransaction,
    isPostingTransaction,
    handlePostTransactionsBatch,
    isPostingBatch,
    handleOpenVoucher,

    // Customer statement
    statementCustomerId,
    setStatementCustomerId,
    customerStatementFilters,
    setCustomerStatementFilters,
    customerStatement,
    isFetchingCustomerStatement,
    printCustomerStatementDocument,
    downloadCustomerStatementDocument,
    sendCustomerStatementDocument,
    isSendingStatement,

    // Company statement
    companyAccountId,
    setCompanyAccountId,
    companyStatementFilters,
    setCompanyStatementFilters,
    companyStatement,
    isFetchingCompanyStatement,

    // Trial balance
    trialBalance,
    isFetchingTrialBalance,

    // Cash register closing
    cashClosingFilters,
    setCashClosingFilters,
    cashClosings,
    cashClosingsMeta,
    isFetchingCashClosings,
    cashClosingPreview,
    isPreviewingCashClosing,
    previewCashClosing,
    closeCashRegister,
    isClosingCashRegister,
    confirmCashClosing,
    isConfirmingCashClosing,
    printCashClosing,

    // Payroll
    payrollEmployees,
    isFetchingPayrollEmployees,
    setEmployeeSalary,
    isSavingSalary,
    payEmployeeSalary,
    isPayingSalary,
    payrollHistory,
    payrollHistoryMeta,
    isFetchingPayrollHistory,
    loadPayrollHistory,

    // Financial statements
    incomeStatement,
    isFetchingIncomeStatement,
    loadIncomeStatement,
    balanceSheet,
    isFetchingBalanceSheet,
    loadBalanceSheet,

    // Accounts for select-lists
    selectableAccounts,
    isFetchingSelectableAccounts,

    // "والتأكد من جميع الحسابات"
    reconciliationLogs,
    isFetchingReconciliationLogs,
    refetchReconciliationLogs,
    runReconciliation,
    isRunningReconciliation,

    // Suppliers
    supplierCategories,
    isFetchingSupplierCategories,
    addSupplierCategory,
    isSavingSupplierCategory,
    deleteSupplierCategory,
    isDeletingSupplierCategory,
    suppliers,
    isFetchingSuppliers,
    addSupplier,
    isSavingSupplier,
    updateSupplier,
    isUpdatingSupplier,
    deleteSupplier,
    isDeletingSupplier,

    // Employee & Supplier Advances
    employeeAdvances,
    employeeAdvancesTotalOutstanding,
    isFetchingEmployeeAdvances,
    employeeAdvanceHistoryFilters,
    setEmployeeAdvanceHistoryFilters,
    giveEmployeeAdvance,
    isGivingEmployeeAdvance,
    getEmployeeAdvanceBalance,
    settleEmployeeAdvance,
    isSettlingEmployeeAdvance,

    // Employee statement (كشف حساب موظف)
    statementEmployeeId,
    openEmployeeStatement,
    closeEmployeeStatement,
    employeeStatement,
    isFetchingEmployeeStatement,
    employeeStatementFilters,
    loadEmployeeStatement,

    supplierAdvances,
    supplierAdvancesTotalOutstanding,
    isFetchingSupplierAdvances,
    supplierAdvanceHistoryFilters,
    setSupplierAdvanceHistoryFilters,
    giveSupplierAdvance,
    isGivingSupplierAdvance,
    getSupplierAdvanceBalance,
    settleSupplierAdvance,
    isSettlingSupplierAdvance,

    // Supplier statement (كشف حساب مورد)
    statementSupplierId,
    openSupplierStatement,
    closeSupplierStatement,
    supplierStatement,
    isFetchingSupplierStatement,
    supplierStatementFilters,
    loadSupplierStatement,

    // Purchase invoices
    purchaseInvoices,
    purchaseInvoicesMeta,
    purchaseInvoiceFilters,
    setPurchaseInvoiceFilters,
    isFetchingPurchaseInvoices,
    addPurchaseInvoice,
    isSavingPurchaseInvoice,
    openPurchaseInvoiceVoucher,
    archivePurchaseInvoice,
    isArchivingPurchaseInvoice,
    unarchivePurchaseInvoice,
    isUnarchivingPurchaseInvoice,
    payPurchaseInvoice,
    isPayingPurchaseInvoice,
    deletePurchaseInvoice,
    isDeletingPurchaseInvoice,
    uploadPurchaseInvoiceImage,
    isUploadingPurchaseInvoiceImage,
    removePurchaseInvoiceImage,
    isRemovingPurchaseInvoiceImage,
    materials,
    isFetchingMaterials,
    searchMaterials,
    addMaterial,
    isSavingMaterial,

    // Broker commissions
    payBrokerCommission,
    isPayingCommission,
    brokerCommissionHistory,
    brokerCommissionHistoryMeta,
    isFetchingBrokerCommissionHistory,
    loadBrokerCommissionHistory,
  };
};

export default useAccounting;
