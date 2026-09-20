import React, { useState } from "react";
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
import { useGetCustomersQuery } from "../../RtkQuery/Slice/Customers/CustomersApi";
import { useGetBookingQuery } from "../../RtkQuery/Slice/Booking/BookingApi";
import CurrencyAmountField from "./CurrencyAmountField";

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
  const [customerSearch, setCustomerSearch] = useState("");
  const { data: customersResponse } = useGetCustomersQuery({
    page: 1,
    per_page: 60,
    search: customerSearch || undefined,
  });
  const customers = customersResponse?.data ?? [];

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
          <Input
            placeholder="ابحث عن عميل..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            className="mb-2"
          />
          <Select value={form.party_id} onValueChange={handlePartyIdChange}>
            <SelectTrigger>
              <SelectValue placeholder="اختر العميل" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.company_name || c.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

const ReverseForm = ({ target, onCancel, onSave, isSaving }) => {
  const [reason, setReason] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(reason);
      }}
      className="space-y-4"
    >
      <p className="text-sm text-muted-foreground">
        سيتم إنشاء قيد جديد يعكس القيد رقم <strong>{target?.entry_number}</strong> دون حذف أو تعديل القيد الأصلي.
      </p>
      <div className="space-y-2">
        <Label>سبب العكس</Label>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} required />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>إلغاء</Button>
        <Button type="submit" variant="destructive" disabled={isSaving || !reason}>
          {isSaving ? "جارٍ التنفيذ..." : "تأكيد عكس القيد"}
        </Button>
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
  } = accounting;

  const navigate = useNavigate();

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
          <Input
            type="number"
            placeholder="رقم الموظف (دفتر اليومية)"
            className="w-44"
            value={transactionFilters.employee_id || ""}
            onChange={(e) => setTransactionFilters((f) => ({ ...f, employee_id: e.target.value || undefined, page: 1 }))}
          />
        </div>

        <div className="flex flex-wrap gap-2">
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
        <th className="p-2 text-center">إجراءات</th>
      </tr>
    </thead>
    <tbody>
      {isFetchingTransactions && (
        <tr><td colSpan={10} className="p-4 text-center text-muted-foreground">جارٍ التحميل...</td></tr>
      )}
      {!isFetchingTransactions && transactions.length === 0 && (
        <tr><td colSpan={10} className="p-4 text-center text-muted-foreground">لا توجد معاملات</td></tr>
      )}
      {transactions.map((tx) => (
        <tr key={tx.id} className="border-b border-border/50 hover:bg-muted/30">
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
            <div className="flex items-center justify-center gap-1">
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
              {tx.type !== "reversal" && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  title="عكس القيد"
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

      <Dialog open={Boolean(reverseTarget)} onOpenChange={(v) => !v && setReverseTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>عكس القيد {reverseTarget?.entry_number}</DialogTitle></DialogHeader>
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
