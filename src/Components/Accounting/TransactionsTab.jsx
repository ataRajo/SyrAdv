import React, { useState } from "react";
import { useAuth } from "../../Context/AuthProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router";
import CustomerSearchSelect from "../Common/CustomerSearchSelect";
import DocumentUploadDialog from "../Common/DocumentUploadDialog";
import { useGetBookingQuery } from "../../RtkQuery/Slice/Booking/BookingApi";
import CurrencyAmountField from "./CurrencyAmountField";
import HardDeleteDialog from "./HardDeleteDialog";
import toast from "react-hot-toast";
import {
  useUpdateTransactionMutation,
  useLazyPreviewDeleteTransactionQuery,
  useDeleteTransactionMutation,
} from "../../RtkQuery/Slice/Accounting/AccountingApi";

const TYPE_LABELS = {
  incoming: { label: "قبض", variant: "default" },
  outgoing: { label: "صرف", variant: "secondary" },
  transfer: { label: "تحويل", variant: "outline" },
  revenue: { label: "قيمة حجز/عقد", variant: "outline" },
  reversal: { label: "عكس قيد", variant: "destructive" },
  adjustment: { label: "تسوية", variant: "outline" },
  opening: { label: "افتتاحي", variant: "outline" },
};

const TYPE_FILTER_OPTIONS = [
  { value: "all", label: "كل الأنواع" },
  { value: "incoming", label: "قبض" },
  { value: "outgoing", label: "صرف" },
  { value: "transfer", label: "تحويل" },
  { value: "revenue", label: "قيمة حجز/عقد" },
  { value: "reversal", label: "عكس قيد" },
];

// ---------------------------------------------------------------------------

const PARTY_TYPE_OPTIONS = [
  { value: "customer", label: "عميل" },
  { value: "supplier", label: "مورد" },
  { value: "employee", label: "موظف" },
  { value: "account", label: "حساب آخر" },
];

/**
 * سند قبض عام - طلب العميل: "تفعيل سندات القبض ... لكل أنواع الحسابات
 * الموجودة في النظام" (مثاله الصريح: سند قبض من موظف إلى الصندوق). طرف
 * السند واحد من أربعة (راجع RecordIncomingTransactionRequest/
 * TransactionController::incoming() على الباك-إند لمنطق التوجيه الكامل):
 *  - عميل: السلوك الأصلي دون أي تغيير، مع إمكانية ربط عقد/حجز.
 *  - مورد: قبض مباشر على حساب المورد نفسه (استرجاع/مرتجع نقدي).
 *  - موظف: تحصيل من سلفته المستحقة حصرًا (لا "حساب" مستقل للموظف) - يُعرض
 *    رصيده المستحق فور اختياره، ولا يمكن تجاوزه (نفس ضمان AdvancesTab
 *    تمامًا، فقط من داخل شاشة المعاملات العامة).
 *  - حساب آخر: أي حساب غير مرتبط بعميل/مورد/سلف (مثال: إيرادات أخرى).
 */
const IncomingForm = ({ cashAccounts, suppliers, employees, postableAccounts, getEmployeeAdvanceBalance, onCancel, onSave, isSaving }) => {
  const [partyType, setPartyType] = useState("customer");

  const [form, setForm] = useState({
    party_id: "",
    booking_id: "",
    amount: "",
    exchange_rate: "",
    date: "",
    description: "",
    reference_no: "",
    cashbox_account_id: "",
  });
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const [employeeOutstanding, setEmployeeOutstanding] = useState(null);
  const [isLoadingEmployeeOutstanding, setIsLoadingEmployeeOutstanding] = useState(false);

  // طلب العميل: عند تسجيل سند قبض مرتبط بقيمة عقد/حجز، تُتاح إمكانية
  // اختيار العقد المرتبط به - يُعرض هنا فقط بعد اختيار العميل، ويُستبعد
  // العقود المنتهية/المؤرشفة (is_archived) لأنه لا معنى لربط سند قبض
  // جديد بعقد سبق أن انتهى (راجع BookingService::extendBooking - العقد
  // القديم بعد التمديد يبقى فقط كسجل تاريخي).
  const { data: customerBookingsResponse, isFetching: isFetchingBookings } = useGetBookingQuery(
    { customer_id: partyType === "customer" ? form.party_id : "", is_archived: false, per_page: 50 },
    { skip: partyType !== "customer" || !form.party_id }
  );
  const customerBookings = customerBookingsResponse?.data ?? [];

  const handlePartyTypeChange = (value) => {
    setPartyType(value);
    setForm((f) => ({ ...f, party_id: "", booking_id: "" }));
    setEmployeeOutstanding(null);
  };

  const handlePartyIdChange = async (value) => {
    setForm((f) => ({ ...f, party_id: value, booking_id: "" }));
    if (partyType === "employee" && value && getEmployeeAdvanceBalance) {
      setEmployeeOutstanding(null);
      setIsLoadingEmployeeOutstanding(true);
      const balance = await getEmployeeAdvanceBalance(Number(value));
      setIsLoadingEmployeeOutstanding(false);
      setEmployeeOutstanding(balance?.outstanding_balance ?? 0);
    }
  };

  const amountNumber = Number(form.amount || 0);
  const exceedsEmployeeOutstanding =
    partyType === "employee" && employeeOutstanding !== null && amountNumber > employeeOutstanding + 0.01;

  const partyField = { customer: "customer_id", supplier: "supplier_id", employee: "employee_id", account: "account_id" }[partyType];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      [partyField]: Number(form.party_id),
      amount: amountNumber,
      ...(partyType === "customer" && form.booking_id ? { booking_id: Number(form.booking_id) } : {}),
      ...(form.exchange_rate ? { exchange_rate: Number(form.exchange_rate) } : {}),
      ...(form.date ? { date: form.date } : {}),
      ...(form.description ? { description: form.description } : {}),
      ...(form.reference_no ? { reference_no: form.reference_no } : {}),
      ...(form.cashbox_account_id ? { cashbox_account_id: Number(form.cashbox_account_id) } : {}),
    });
  };

  const nonCashPostableAccounts = (postableAccounts ?? []).filter((a) => !a.is_cash_account);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>طرف السند</Label>
        <Select value={partyType} onValueChange={handlePartyTypeChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PARTY_TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {partyType === "customer" && (
        <div className="space-y-2">
          <Label>العميل</Label>
          <CustomerSearchSelect
            value={form.party_id}
            onChange={(id) => handlePartyIdChange(id || "")}
            placeholder="ابحث واختر العميل"
            showRemaining
          />
        </div>
      )}

      {partyType === "supplier" && (
        <div className="space-y-2">
          <Label>المورد</Label>
          <Select value={form.party_id} onValueChange={handlePartyIdChange}>
            <SelectTrigger>
              <SelectValue placeholder="اختر المورد" />
            </SelectTrigger>
            <SelectContent>
              {(suppliers ?? []).map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {partyType === "employee" && (
        <div className="space-y-2">
          <Label>الموظف</Label>
          <Select value={form.party_id} onValueChange={handlePartyIdChange}>
            <SelectTrigger>
              <SelectValue placeholder="اختر الموظف" />
            </SelectTrigger>
            <SelectContent>
              {(employees ?? []).map((e) => (
                <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.party_id && (
            <p className="text-xs text-muted-foreground">
              {isLoadingEmployeeOutstanding
                ? "جارٍ جلب رصيد السلفة المستحق..."
                : employeeOutstanding !== null
                ? `رصيد السلفة المستحق على هذا الموظف حاليًا: ${employeeOutstanding.toLocaleString("ar-SY", { minimumFractionDigits: 2 })}`
                : null}
            </p>
          )}
          {exceedsEmployeeOutstanding && (
            <p className="text-xs text-destructive">لا يمكن تحصيل أكثر من الرصيد المستحق على الموظف.</p>
          )}
        </div>
      )}

      {partyType === "account" && (
        <div className="space-y-2">
          <Label>الحساب</Label>
          <Select value={form.party_id} onValueChange={handlePartyIdChange}>
            <SelectTrigger>
              <SelectValue placeholder="اختر الحساب" />
            </SelectTrigger>
            <SelectContent>
              {nonCashPostableAccounts.map((a) => (
                <SelectItem key={a.id} value={String(a.id)}>{a.code} - {a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {partyType === "customer" && form.party_id && (
        <div className="space-y-2">
          <Label>العقد / الحجز المرتبط (اختياري - إن كان السند مقابل قيمة عقد)</Label>
          <Select
            value={form.booking_id}
            onValueChange={set("booking_id")}
            disabled={isFetchingBookings}
          >
            <SelectTrigger>
              <SelectValue placeholder={isFetchingBookings ? "جارٍ التحميل..." : "بلا عقد مرتبط"} />
            </SelectTrigger>
            <SelectContent>
              {customerBookings.map((b) => (
                <SelectItem key={b.id} value={String(b.id)}>
                  عقد #{b.id} {b.number ? `- ${b.number}` : ""} ({b.start_date} → {b.end_date})
                </SelectItem>
              ))}
              {!isFetchingBookings && customerBookings.length === 0 && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">لا توجد عقود سارية لهذا العميل</div>
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label>الصندوق / البنك (اختياري - الافتراضي: الصندوق - دولار)</Label>
        <Select value={form.cashbox_account_id} onValueChange={set("cashbox_account_id")}>
          <SelectTrigger>
            <SelectValue placeholder="الصندوق - دولار (افتراضي)" />
          </SelectTrigger>
          <SelectContent>
            {cashAccounts.map((a) => (
              <SelectItem key={a.id} value={String(a.id)}>
                {a.name} {a.currency === "SYP" ? "(ل.س)" : "($)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <CurrencyAmountField
        cashAccounts={cashAccounts}
        selectedCashboxId={form.cashbox_account_id}
        amount={form.amount}
        onAmountChange={set("amount")}
        exchangeRate={form.exchange_rate}
        onExchangeRateChange={set("exchange_rate")}
      />

      <div className="space-y-2">
        <Label>التاريخ (اختياري)</Label>
        <Input type="date" value={form.date} onChange={(e) => set("date")(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label>البيان (اختياري)</Label>
        <Input value={form.description} onChange={(e) => set("description")(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label>رقم مرجعي (اختياري)</Label>
        <Input value={form.reference_no} onChange={(e) => set("reference_no")(e.target.value)} />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>إلغاء</Button>
        <Button type="submit" disabled={isSaving || !form.party_id || !form.amount || exceedsEmployeeOutstanding}>
          {isSaving ? "جارٍ الحفظ..." : "تسجيل قيد القبض"}
        </Button>
      </DialogFooter>
    </form>
  );
};

const OutgoingForm = ({ postableAccounts, cashAccounts, onCancel, onSave, isSaving }) => {
  const targetAccounts = postableAccounts.filter((a) => !a.is_cash_account);
  const [form, setForm] = useState({
    account_id: "",
    amount: "",
    exchange_rate: "",
    date: "",
    description: "",
    reference_no: "",
    cashbox_account_id: "",
  });
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      account_id: Number(form.account_id),
      amount: Number(form.amount),
      ...(form.exchange_rate ? { exchange_rate: Number(form.exchange_rate) } : {}),
      description: form.description,
      ...(form.date ? { date: form.date } : {}),
      ...(form.reference_no ? { reference_no: form.reference_no } : {}),
      ...(form.cashbox_account_id ? { cashbox_account_id: Number(form.cashbox_account_id) } : {}),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>حساب المصروف / الجهة (سند صرف)</Label>
        <Select value={form.account_id} onValueChange={set("account_id")}>
          <SelectTrigger>
            <SelectValue placeholder="اختر الحساب" />
          </SelectTrigger>
          <SelectContent>
            {targetAccounts.map((a) => (
              <SelectItem key={a.id} value={String(a.id)}>
                {a.code} - {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>الصندوق / البنك (اختياري - الافتراضي: الصندوق - دولار)</Label>
        <Select value={form.cashbox_account_id} onValueChange={set("cashbox_account_id")}>
          <SelectTrigger>
            <SelectValue placeholder="الصندوق - دولار (افتراضي)" />
          </SelectTrigger>
          <SelectContent>
            {cashAccounts.map((a) => (
              <SelectItem key={a.id} value={String(a.id)}>
                {a.name} {a.currency === "SYP" ? "(ل.س)" : "($)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <CurrencyAmountField
        cashAccounts={cashAccounts}
        selectedCashboxId={form.cashbox_account_id}
        amount={form.amount}
        onAmountChange={set("amount")}
        exchangeRate={form.exchange_rate}
        onExchangeRateChange={set("exchange_rate")}
      />

      <div className="space-y-2">
        <Label>التاريخ (اختياري)</Label>
        <Input type="date" value={form.date} onChange={(e) => set("date")(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label>البيان (مطلوب لكل عملية صرف)</Label>
        <Input value={form.description} onChange={(e) => set("description")(e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label>رقم مرجعي (اختياري)</Label>
        <Input value={form.reference_no} onChange={(e) => set("reference_no")(e.target.value)} />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>إلغاء</Button>
        <Button type="submit" disabled={isSaving || !form.account_id}>
          {isSaving ? "جارٍ الحفظ..." : "تسجيل قيد الصرف"}
        </Button>
      </DialogFooter>
    </form>
  );
};

const TransferForm = ({ cashAccounts, onCancel, onSave, isSaving }) => {
  const [form, setForm] = useState({ from_account_id: "", to_account_id: "", amount: "", exchange_rate: "", date: "", description: "" });
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const fromAccount = cashAccounts.find((a) => String(a.id) === String(form.from_account_id));
  const toAccount = cashAccounts.find((a) => String(a.id) === String(form.to_account_id));
  const isExchange = fromAccount && toAccount && fromAccount.currency !== toAccount.currency;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      from_account_id: Number(form.from_account_id),
      to_account_id: Number(form.to_account_id),
      amount: Number(form.amount),
      ...(form.exchange_rate ? { exchange_rate: Number(form.exchange_rate) } : {}),
      ...(form.date ? { date: form.date } : {}),
      ...(form.description ? { description: form.description } : {}),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>من حساب</Label>
          <Select value={form.from_account_id} onValueChange={set("from_account_id")}>
            <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
            <SelectContent>
              {cashAccounts.map((a) => (
                <SelectItem key={a.id} value={String(a.id)}>{a.name} {a.currency === "SYP" ? "(ل.س)" : "($)"}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>إلى حساب</Label>
          <Select value={form.to_account_id} onValueChange={set("to_account_id")}>
            <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
            <SelectContent>
              {cashAccounts.filter((a) => String(a.id) !== form.from_account_id).map((a) => (
                <SelectItem key={a.id} value={String(a.id)}>{a.name} {a.currency === "SYP" ? "(ل.س)" : "($)"}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>{fromAccount?.currency === "SYP" ? "المبلغ المحوَّل (ل.س)" : "المبلغ المحوَّل ($)"}</Label>
        <Input type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => set("amount")(e.target.value)} required />
      </div>
      {isExchange && (
        <div className="space-y-2">
          <Label>سعر الصرف (كم ليرة = 1 دولار) - عملية صرف عملة</Label>
          <Input type="number" step="0.01" min="0.01" placeholder="مثال: 15000" value={form.exchange_rate} onChange={(e) => set("exchange_rate")(e.target.value)} required />
        </div>
      )}
      <div className="space-y-2">
        <Label>البيان (اختياري)</Label>
        <Input value={form.description} onChange={(e) => set("description")(e.target.value)} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>إلغاء</Button>
        <Button type="submit" disabled={isSaving || !form.from_account_id || !form.to_account_id}>
          {isSaving ? "جارٍ الحفظ..." : "تنفيذ التحويل"}
        </Button>
      </DialogFooter>
    </form>
  );
};

// شارة حالة التوثيق لكل قيد (طلب صريح: السند لا يُرحَّل على الشجرة قبل التوثيق).
const DocumentStatusBadge = ({ tx }) => {
  if (tx.status === "pending" && tx.documented_at) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
        title={tx.documented_by_name ? `وثّقه: ${tx.documented_by_name}` : ""}
      >
        <Icon icon="mdi:timer-sand" className="h-3.5 w-3.5" /> موثَّق - بانتظار الترحيل
      </span>
    );
  }
  if (tx.status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
        <Icon icon="mdi:clock-outline" className="h-3.5 w-3.5" /> بانتظار التوثيق
      </span>
    );
  }
  if (tx.status === "cancelled") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground line-through"
        title={tx.cancel_reason || ""}
      >
        ملغى
      </span>
    );
  }
  if (tx.is_documented) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
        <Icon icon="mdi:check-decagram" className="h-3.5 w-3.5" /> موثَّق
      </span>
    );
  }
  return <span className="text-[11px] text-muted-foreground">مرحَّل</span>;
};

const ReverseForm = ({ target, onCancel, onSave, isSaving }) => {
  const [reason, setReason] = useState("");
  const isPending = target?.status === "pending";
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(reason);
      }}
      className="space-y-4"
    >
      <p className="text-sm text-muted-foreground">
        {isPending ? (
          <>السند <strong>{target?.voucher_number || target?.entry_number}</strong> لم يُوثَّق بعد ولم يؤثر على أي رصيد - سيُعلَّم ملغى فقط (بلا قيد عكسي).</>
        ) : (
          <>سيتم إنشاء قيد جديد يعكس القيد رقم <strong>{target?.entry_number}</strong> دون حذف أو تعديل القيد الأصلي.</>
        )}
      </p>
      <div className="space-y-2">
        <Label>{isPending ? "سبب الإلغاء" : "سبب العكس"}</Label>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} required />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>إلغاء</Button>
        <Button type="submit" variant="destructive" disabled={isSaving || !reason}>
          {isSaving ? "جارٍ التنفيذ..." : isPending ? "تأكيد إلغاء السند" : "تأكيد عكس القيد"}
        </Button>
      </DialogFooter>
    </form>
  );
};

// تعديل غير مالي: البيان + التاريخ فقط (المبالغ والحسابات ثابتة في الدفتر).
const EditTransactionForm = ({ target, onCancel }) => {
  const [description, setDescription] = useState(target?.description || "");
  const [entryDate, setEntryDate] = useState((target?.entry_date || "").slice(0, 10));
  const [updateTransaction, { isLoading }] = useUpdateTransactionMutation();

  const submit = async (e) => {
    e.preventDefault();
    try {
      await updateTransaction({ id: target.id, description, entry_date: entryDate }).unwrap();
      toast.success("تم تعديل السند");
      onCancel();
    } catch (err) {
      toast.error(err?.data?.message || "فشل التعديل");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-xs text-muted-foreground">
        يمكن تعديل البيان والتاريخ فقط. لتغيير المبلغ أو الحسابات استخدم «عكس القيد» ثم سجّل سندًا جديدًا (أو احذف السند إن كان تجريبيًا).
      </p>
      <div className="space-y-2">
        <Label>البيان</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label>التاريخ</Label>
        <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} required />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>إلغاء</Button>
        <Button type="submit" disabled={isLoading || !description}>{isLoading ? "جارٍ الحفظ..." : "حفظ"}</Button>
      </DialogFooter>
    </form>
  );
};

// ---------------------------------------------------------------------------

const TransactionsTab = ({ accounting }) => {
  const {
    transactions,
    transactionsMeta,
    isFetchingTransactions,
    transactionFilters,
    setTransactionFilters,
    cashAccounts,
    postableAccounts,
    suppliers,
    payrollEmployees,
    getEmployeeAdvanceBalance,
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
    handleOpenVoucher,
    documentTarget,
    setDocumentTarget,
    handleDocumentTransaction,
    isDocumentingTransaction,
    handlePostTransaction,
    isPostingTransaction,
    handlePostTransactionsBatch,
    isPostingBatch,
  } = accounting;

  const navigate = useNavigate();
  // ترحيل دفتر اليومية محصور بالسوبر أدمن (طلب صريح) - الخادم يفرضه أيضًا.
  const { hasRole, hasPermission } = useAuth();
  const canPost = hasRole("super admin");
  const canEdit = canPost || hasPermission("edit-financials");
  const canHardDelete = canPost || hasPermission("delete-financials");
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const awaitingPostingOnPage = transactions.filter((t) => t.status === "pending" && t.documented_at);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={transactionFilters.type || "all"}
            onValueChange={(v) =>
              setTransactionFilters((f) => ({ ...f, type: v === "all" ? undefined : v, page: 1 }))
            }
          >
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TYPE_FILTER_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            className="w-40"
            value={transactionFilters.from_date || ""}
            onChange={(e) => setTransactionFilters((f) => ({ ...f, from_date: e.target.value, page: 1 }))}
          />
          <Input
            type="date"
            className="w-40"
            value={transactionFilters.to_date || ""}
            onChange={(e) => setTransactionFilters((f) => ({ ...f, to_date: e.target.value, page: 1 }))}
          />
          <Select
            value={transactionFilters.status || "all"}
            onValueChange={(v) =>
              setTransactionFilters((f) => ({ ...f, status: v === "all" ? undefined : v, page: 1 }))
            }
          >
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              <SelectItem value="pending">غير مرحَّلة (الكل)</SelectItem>
              <SelectItem value="awaiting_documentation">بانتظار التوثيق</SelectItem>
              <SelectItem value="awaiting_posting">موثَّقة - بانتظار الترحيل</SelectItem>
              <SelectItem value="posted">مرحَّلة</SelectItem>
              <SelectItem value="cancelled">ملغاة</SelectItem>
            </SelectContent>
          </Select>
          <div className="w-64">
            <CustomerSearchSelect
              value={transactionFilters.customer_id ? String(transactionFilters.customer_id) : ""}
              onChange={(id) =>
                setTransactionFilters((f) => ({ ...f, customer_id: id || undefined, page: 1 }))
              }
              allowAll
              allValue=""
              allLabel="كل العملاء"
            />
          </div>
          <Input
            type="number"
            placeholder="رقم الموظف (دفتر اليومية)"
            className="w-44"
            value={transactionFilters.employee_id || ""}
            onChange={(e) => setTransactionFilters((f) => ({ ...f, employee_id: e.target.value || undefined, page: 1 }))}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {canPost && awaitingPostingOnPage.length > 0 && (
            <Button
              size="sm"
              className="bg-blue-600 text-white hover:bg-blue-700"
              disabled={isPostingBatch}
              onClick={() => handlePostTransactionsBatch(awaitingPostingOnPage.map((t) => t.id))}
              title="ترحيل كل السندات الموثَّقة الظاهرة في هذه الصفحة"
            >
              <Icon icon="mdi:check-all" className="w-4 h-4 ml-1" />
              {isPostingBatch ? "جارٍ الترحيل..." : `ترحيل الموثَّق (${awaitingPostingOnPage.length})`}
            </Button>
          )}
          <Button size="sm" onClick={() => setIncomingDialogOpen(true)}>
            <Icon icon="mdi:cash-plus" className="w-4 h-4 ml-1" /> قيد قبض
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setOutgoingDialogOpen(true)}>
            <Icon icon="mdi:cash-minus" className="w-4 h-4 ml-1" /> قيد صرف
          </Button>
          <Button size="sm" variant="outline" onClick={() => setTransferDialogOpen(true)}>
            <Icon icon="mdi:bank-transfer" className="w-4 h-4 ml-1" /> تحويل بين الصناديق
          </Button>
        </div>
      </div>

   <div className="border border-border rounded-lg bg-card overflow-x-auto">
  <table className="w-full text-sm text-center">
    <thead>
      <tr className="border-b border-border text-muted-foreground">
        <th className="p-2 text-center">رقم القيد</th>
        <th className="p-2 text-center">رقم السند</th>
        <th className="p-2 text-center">النوع</th>
        <th className="p-2 text-center">التاريخ</th>
        <th className="p-2 text-center">البيان</th>
        <th className="p-2 text-center">العقد</th>
        <th className="p-2 text-center">الموظف</th>
        <th className="p-2 text-center">مدين</th>
        <th className="p-2 text-center">دائن</th>
        <th className="p-2 text-center">التوثيق</th>
        <th className="p-2 text-center">إجراءات</th>
      </tr>
    </thead>
    <tbody>
      {isFetchingTransactions && (
        <tr><td colSpan={11} className="p-4 text-center text-muted-foreground">جارٍ التحميل...</td></tr>
      )}
      {!isFetchingTransactions && transactions.length === 0 && (
        <tr><td colSpan={11} className="p-4 text-center text-muted-foreground">لا توجد معاملات</td></tr>
      )}
      {transactions.map((tx) => (
        <tr
          key={tx.id}
          className={`border-b border-border/50 hover:bg-muted/30 ${tx.status === "pending" ? "bg-amber-50/40 dark:bg-amber-900/10" : ""} ${tx.status === "cancelled" ? "opacity-60" : ""}`}
        >
          <td className="p-2 font-mono text-xs text-center">{tx.entry_number}</td>
          <td className="p-2 font-mono text-xs text-center">{tx.voucher_number || "-"}</td>
          <td className="p-2 text-center">
            <Badge variant={TYPE_LABELS[tx.type]?.variant || "outline"}>
              {TYPE_LABELS[tx.type]?.label || tx.type}
            </Badge>
          </td>
          <td className="p-2 text-xs text-center">{tx.entry_date}</td>
          <td className="p-2 max-w-[220px] truncate text-center" title={tx.description}>{tx.description}</td>
          <td className="p-2 text-center">
            {tx.booking_id ? (
              <Button
                size="sm"
                variant="link"
                className="h-6 px-1 font-mono text-xs"
                title="فتح عقد الحجز"
                onClick={() => navigate(`/dashboard/booking/${tx.booking_id}`)}
              >
                #{tx.booking_id}
                <Icon icon="mdi:file-sign" className="w-3.5 h-3.5 mr-1" />
              </Button>
            ) : (
              "-"
            )}
          </td>
          <td className="p-2 text-xs text-muted-foreground text-center">{tx.created_by_name || "-"}</td>
          <td className="p-2 font-mono text-center">{Number(tx.total_debit).toLocaleString("ar-SY", { minimumFractionDigits: 2 })}</td>
          <td className="p-2 font-mono text-center">{Number(tx.total_credit).toLocaleString("ar-SY", { minimumFractionDigits: 2 })}</td>
          <td className="p-2 text-center">
            <div className="flex flex-col items-center gap-1">
              <DocumentStatusBadge tx={tx} />
              {tx.voucher_document_url && (
                <a
                  href={tx.voucher_document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-primary underline"
                >
                  صورة السند
                </a>
              )}
            </div>
          </td>
          <td className="p-2 text-center">
            <div className="flex items-center justify-center gap-1">
              {canPost && tx.status === "pending" && tx.documented_at && (
                <Button
                  size="sm"
                  className="h-7 bg-blue-600 px-2 text-xs text-white hover:bg-blue-700"
                  disabled={isPostingTransaction}
                  title="ترحيل السند على شجرة الحسابات (سوبر أدمن)"
                  onClick={() => handlePostTransaction(tx.id)}
                >
                  <Icon icon="mdi:send-check" className="w-4 h-4" />
                  <span className="mr-1">ترحيل</span>
                </Button>
              )}
              {tx.status !== "cancelled" && (tx.status === "pending" || tx.is_voucher) && (
                <Button
                  size="sm"
                  variant={tx.status === "pending" && !tx.documented_at ? "default" : "ghost"}
                  className={tx.status === "pending" && !tx.documented_at ? "h-7 bg-emerald-600 px-2 text-xs text-white hover:bg-emerald-700" : "h-7 w-7 p-0"}
                  title={tx.status === "pending" ? "توثيق السند (رفع صورة السند الموقَّع) وترحيله" : "إرفاق/استبدال صورة السند"}
                  onClick={() => setDocumentTarget(tx)}
                >
                  <Icon icon="mdi:file-upload-outline" className="w-4 h-4" />
                  {tx.status === "pending" && !tx.documented_at && <span className="mr-1">توثيق</span>}
                </Button>
              )}
              {tx.voucher_number && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  title="طباعة السند"
                  onClick={() => handleOpenVoucher(tx.id)}
                >
                  <Icon icon="mdi:printer-outline" className="w-4 h-4" />
                </Button>
              )}
              {canEdit && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  title="تعديل (البيان/التاريخ)"
                  onClick={() => setEditTarget(tx)}
                >
                  <Icon icon="mdi:pencil-outline" className="w-4 h-4" />
                </Button>
              )}
              {canHardDelete && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="حذف نهائي (بيانات تجريبية)"
                  onClick={() => setDeleteTarget(tx)}
                >
                  <Icon icon="mdi:trash-can-outline" className="w-4 h-4" />
                </Button>
              )}
              {tx.type !== "reversal" && tx.status !== "cancelled" && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  title={tx.status === "pending" ? "إلغاء السند" : "عكس القيد"}
                  onClick={() => setReverseTarget(tx)}
                >
                  <Icon icon="mdi:undo" className="w-4 h-4 text-destructive" />
                </Button>
              )}
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

      {transactionsMeta?.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={transactionsMeta.current_page <= 1}
            onClick={() => setTransactionFilters((f) => ({ ...f, page: (f.page || 1) - 1 }))}
          >
            السابق
          </Button>
          <span className="text-sm text-muted-foreground">
            صفحة {transactionsMeta.current_page} من {transactionsMeta.total_pages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={transactionsMeta.current_page >= transactionsMeta.total_pages}
            onClick={() => setTransactionFilters((f) => ({ ...f, page: (f.page || 1) + 1 }))}
          >
            التالي
          </Button>
        </div>
      )}

      <Dialog open={incomingDialogOpen} onOpenChange={setIncomingDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>تسجيل قيد قبض (سند قبض)</DialogTitle></DialogHeader>
          <IncomingForm
            cashAccounts={cashAccounts}
            suppliers={suppliers}
            employees={payrollEmployees}
            postableAccounts={postableAccounts}
            getEmployeeAdvanceBalance={getEmployeeAdvanceBalance}
            onCancel={() => setIncomingDialogOpen(false)}
            onSave={handleRecordIncoming}
            isSaving={isRecordingIncoming}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={outgoingDialogOpen} onOpenChange={setOutgoingDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>تسجيل قيد صرف (سند صرف)</DialogTitle></DialogHeader>
          <OutgoingForm
            postableAccounts={postableAccounts}
            cashAccounts={cashAccounts}
            onCancel={() => setOutgoingDialogOpen(false)}
            onSave={handleRecordOutgoing}
            isSaving={isRecordingOutgoing}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>تحويل بين الصندوق والبنك</DialogTitle></DialogHeader>
          <TransferForm
            cashAccounts={cashAccounts}
            onCancel={() => setTransferDialogOpen(false)}
            onSave={handleTransfer}
            isSaving={isTransferring}
          />
        </DialogContent>
      </Dialog>

      <DocumentUploadDialog
        open={Boolean(documentTarget)}
        onClose={() => setDocumentTarget(null)}
        onSubmit={handleDocumentTransaction}
        isLoading={isDocumentingTransaction}
        title={`توثيق ${documentTarget?.voucher_type_label || "السند"} ${documentTarget?.voucher_number || documentTarget?.entry_number || ""}`}
        subtitle={documentTarget?.description}
        existingImageUrl={documentTarget?.voucher_document_url}
        warning={
          documentTarget?.status === "pending"
            ? canPost
              ? "هذا السند لم يُرحَّل بعد - سيُوثَّق ويُرحَّل على شجرة الحسابات فور رفع صورة السند الموقَّع."
              : "هذا السند لم يُرحَّل بعد - بعد رفع صورة السند الموقَّع يبقى بانتظار ترحيله من السوبر أدمن."
            : "هذا القيد مرحَّل أصلًا - الصورة تُرفق للأرشفة فقط."
        }
      />

      <Dialog open={Boolean(editTarget)} onOpenChange={(v) => !v && setEditTarget(null)}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>تعديل {editTarget?.voucher_number || editTarget?.entry_number}</DialogTitle></DialogHeader>
          {editTarget && <EditTransactionForm key={editTarget.id} target={editTarget} onCancel={() => setEditTarget(null)} />}
        </DialogContent>
      </Dialog>

      <HardDeleteDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        id={deleteTarget?.id}
        title={`حذف نهائي - ${deleteTarget?.voucher_number || deleteTarget?.entry_number || ""}`}
        usePreviewLazy={useLazyPreviewDeleteTransactionQuery}
        useDelete={useDeleteTransactionMutation}
      />

      <Dialog open={Boolean(reverseTarget)} onOpenChange={(v) => !v && setReverseTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{reverseTarget?.status === "pending" ? "إلغاء السند" : "عكس القيد"} {reverseTarget?.voucher_number || reverseTarget?.entry_number}</DialogTitle></DialogHeader>
          <ReverseForm
            target={reverseTarget}
            onCancel={() => setReverseTarget(null)}
            onSave={handleReverse}
            isSaving={isReversing}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransactionsTab;
