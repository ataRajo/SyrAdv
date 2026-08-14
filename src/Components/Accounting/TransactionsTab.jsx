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
import { useGetCustomersQuery } from "../../RtkQuery/Slice/Customers/CustomersApi";
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

const IncomingForm = ({ cashAccounts, onCancel, onSave, isSaving }) => {
  const [customerSearch, setCustomerSearch] = useState("");
  const { data: customersResponse } = useGetCustomersQuery({
    page: 1,
    per_page: 60,
    search: customerSearch || undefined,
  });
  const customers = customersResponse?.data ?? [];

  const [form, setForm] = useState({
    customer_id: "",
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
      customer_id: Number(form.customer_id),
      amount: Number(form.amount),
      ...(form.exchange_rate ? { exchange_rate: Number(form.exchange_rate) } : {}),
      ...(form.date ? { date: form.date } : {}),
      ...(form.description ? { description: form.description } : {}),
      ...(form.reference_no ? { reference_no: form.reference_no } : {}),
      ...(form.cashbox_account_id ? { cashbox_account_id: Number(form.cashbox_account_id) } : {}),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>العميل</Label>
        <Input
          placeholder="ابحث عن عميل..."
          value={customerSearch}
          onChange={(e) => setCustomerSearch(e.target.value)}
          className="mb-2"
        />
        <Select value={form.customer_id} onValueChange={set("customer_id")}>
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
        <Button type="submit" disabled={isSaving || !form.customer_id}>
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
        <th className="p-2 text-center">الموظف</th>
        <th className="p-2 text-center">مدين</th>
        <th className="p-2 text-center">دائن</th>
        <th className="p-2 text-center">إجراءات</th>
      </tr>
    </thead>
    <tbody>
      {isFetchingTransactions && (
        <tr><td colSpan={9} className="p-4 text-center text-muted-foreground">جارٍ التحميل...</td></tr>
      )}
      {!isFetchingTransactions && transactions.length === 0 && (
        <tr><td colSpan={9} className="p-4 text-center text-muted-foreground">لا توجد معاملات</td></tr>
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
