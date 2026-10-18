import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import MaterialSearchInput from "./MaterialSearchInput";
import { useGetPurchaseInvoiceQuery, useUpdatePurchaseInvoiceMutation } from "../../RtkQuery/Slice/Accounting/AccountingApi";
import toast from "react-hot-toast";
import { DeleteDialog } from "../../utils/Dialogs/DeleteDialog/DeleteDialog";
import { openPurchaseInvoicePrint } from "../../utils/branding/purchaseInvoiceDocument";

const fmt = (n) => Number(n ?? 0).toLocaleString("ar-SY", { minimumFractionDigits: 2 });

/**
 * خصم سلفة المورد من الفاتورة/الدفعة (طلب صريح: "أعطيته سلفة عن مواد سأشتريها
 * لاحقًا، ثم اشتريت منه => تنقص السلفة بالمبلغ الذي اشتريته"). تلقائي
 * افتراضيًا (حتى قيمة الفاتورة)، ويمكن إلغاؤه أو تحديد مبلغ جزئي.
 * القيم بالدولار دائمًا (السلفة بالدولار) - راجع PurchaseInvoiceService::advanceCap().
 */
const useAdvanceDeduction = () => {
  const [state, setState] = useState({ deduct: true, mode: "all", amount: "" });
  return [state, (patch) => setState((s) => ({ ...s, ...patch }))];
};

const advancePreview = (outstanding, totalUsd, state) => {
  const requested = state.mode === "custom" ? Math.max(Number(state.amount) || 0, 0) : outstanding;
  const deducted = state.deduct ? Math.min(outstanding, requested, Math.max(totalUsd || 0, 0)) : 0;
  return {
    deducted,
    remainingAdvance: Math.max(outstanding - deducted, 0),
    toPay: Math.max((totalUsd || 0) - deducted, 0),
    tooHigh: state.deduct && state.mode === "custom" && Number(state.amount) > outstanding + 0.001,
  };
};

const advancePayload = (outstanding, state) =>
  outstanding > 0
    ? {
        deduct_advance: state.deduct ? 1 : 0,
        ...(state.deduct && state.mode === "custom" ? { advance_amount: Number(state.amount) || 0 } : {}),
      }
    : {};

const AdvanceDeductionBox = ({ outstanding, totalUsd, state, onChange, payLabel = "المتبقي للدفع" }) => {
  if (!(outstanding > 0)) return null;
  const p = advancePreview(outstanding, totalUsd, state);
  return (
    <div className="text-xs text-amber-900 bg-amber-50 border border-amber-300 rounded-md p-3 space-y-2">
      <div className="font-semibold flex items-center gap-1.5">
        <Icon icon="mdi:hand-coin-outline" className="w-4 h-4" />
        لهذا المورد سلفة قائمة: ${fmt(outstanding)}
      </div>
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input type="checkbox" className="h-4 w-4" checked={state.deduct} onChange={(e) => onChange({ deduct: e.target.checked })} />
        خصم قيمة المشتريات من السلفة
      </label>
      {state.deduct && (
        <div className="flex flex-wrap items-center gap-3 pr-6">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="radio" checked={state.mode === "all"} onChange={() => onChange({ mode: "all" })} />
            تلقائي (حتى قيمة الفاتورة)
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="radio" checked={state.mode === "custom"} onChange={() => onChange({ mode: "custom" })} />
            مبلغ محدد ($):
          </label>
          {state.mode === "custom" && (
            <Input
              type="number"
              step="0.01"
              min="0"
              max={outstanding}
              className="h-7 w-28 text-xs bg-white"
              value={state.amount}
              onChange={(e) => onChange({ amount: e.target.value })}
            />
          )}
        </div>
      )}
      {p.tooHigh && <p className="text-destructive">المبلغ أكبر من رصيد السلفة (${fmt(outstanding)}).</p>}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded bg-white/70 border border-amber-200 p-1.5">
          <div className="text-[10px] text-muted-foreground">يُخصم من السلفة</div>
          <div className="font-mono font-semibold">${fmt(p.deducted)}</div>
        </div>
        <div className="rounded bg-white/70 border border-amber-200 p-1.5">
          <div className="text-[10px] text-muted-foreground">المتبقي من السلفة بعدها</div>
          <div className="font-mono font-semibold">${fmt(p.remainingAdvance)}</div>
        </div>
        <div className="rounded bg-white/70 border border-amber-200 p-1.5">
          <div className="text-[10px] text-muted-foreground">{payLabel}</div>
          <div className="font-mono font-semibold">${fmt(p.toPay)}</div>
        </div>
      </div>
    </div>
  );
};

const emptyItem = () => ({ material_id: null, material_name: "", unit: "", quantity: "1", unit_price: "" });

const AddPurchaseInvoiceForm = ({ suppliers, cashAccounts = [], expenseAccounts = [], accounting, onCancel, onSave, isSaving }) => {
  const [form, setForm] = useState({
    supplier_id: "",
    invoice_number: "",
    amount: "",
    currency: "USD",
    exchange_rate: "",
    cashbox_account_id: "",
    expense_account_id: "",
    date: new Date().toISOString().slice(0, 10),
    description: "",
    payment_type: "cash",
    due_date: "",
  });
  // هل عدّل المستخدم حقل حساب المصروف يدويًا؟ طالما لم يفعل، نُبقيه متزامنًا
  // مع الافتراضي المستمَد من فئة المورد المختار عند كل تغيير للمورد - فور
  // تعديله يدويًا نتوقف عن الكتابة فوقه.
  const [expenseAccountTouched, setExpenseAccountTouched] = useState(false);
  const [items, setItems] = useState([]);
  const [advanceState, setAdvanceState] = useAdvanceDeduction();
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const hasItems = items.length > 0;
  const itemsTotal = items.reduce(
    (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0),
    0
  );

  const updateItem = (index, patch) => {
    setItems((list) => list.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };
  const removeItem = (index) => setItems((list) => list.filter((_, i) => i !== index));

  const matchingCashAccounts = cashAccounts.filter((a) => a.currency === form.currency);
  const isCredit = form.payment_type === "credit";

  const selectedSupplier = (suppliers ?? []).find((s) => String(s.id) === String(form.supplier_id));
  const defaultExpenseAccount = selectedSupplier?.category?.expense_account;
  const defaultExpenseAccountId = selectedSupplier?.category?.expense_account_id;
  const supplierAdvance = Number(selectedSupplier?.outstanding_advance_balance || 0);
  const nativeTotal = hasItems ? itemsTotal : Number(form.amount) || 0;
  const invoiceTotalUsd =
    form.currency === "SYP" ? (Number(form.exchange_rate) > 0 ? nativeTotal / Number(form.exchange_rate) : 0) : nativeTotal;
  const advanceTooHigh = advancePreview(supplierAdvance, invoiceTotalUsd, advanceState).tooHigh;

  const handleSupplierChange = (value) => {
    set("supplier_id")(value);
    const supplier = (suppliers ?? []).find((s) => String(s.id) === String(value));
    // عند اختيار مورد جديد (أو أول اختيار)، نملأ حساب المصروف تلقائيًا من
    // فئته طالما المستخدم لم يخصّص حسابًا مختلفًا يدويًا بنفسه بعد.
    if (!expenseAccountTouched) {
      set("expense_account_id")(supplier?.category?.expense_account_id ? String(supplier.category.expense_account_id) : "");
    }
  };

  const handleExpenseAccountChange = (value) => {
    setExpenseAccountTouched(true);
    set("expense_account_id")(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      supplier_id: Number(form.supplier_id),
      currency: form.currency,
      ...(form.currency === "SYP" && form.exchange_rate ? { exchange_rate: Number(form.exchange_rate) } : {}),
      date: form.date,
      payment_type: form.payment_type,
      ...(isCredit && form.due_date ? { due_date: form.due_date } : {}),
      ...(form.invoice_number ? { invoice_number: form.invoice_number } : {}),
      ...(form.description ? { description: form.description } : {}),
      ...(!isCredit && form.cashbox_account_id ? { cashbox_account_id: Number(form.cashbox_account_id) } : {}),
      // تخصيص فاتورة الشراء لحساب مصروف في شجرة الحسابات (طلب العميل) -
      // إن لم يُختَر شيء، الباك-إند يعود تلقائيًا لحساب فئة المورد
      // الافتراضي (PurchaseInvoiceService::create).
      ...(form.expense_account_id ? { expense_account_id: Number(form.expense_account_id) } : {}),
      ...advancePayload(supplierAdvance, advanceState),
      ...(hasItems
        ? {
            items: items.map((it) => ({
              ...(it.material_id ? { material_id: it.material_id } : { material_name: it.material_name }),
              quantity: Number(it.quantity),
              unit: it.unit || undefined,
              unit_price: Number(it.unit_price),
            })),
          }
        : { amount: Number(form.amount) }),
    });
  };

  const canSubmit =
    Boolean(form.supplier_id) &&
    (hasItems || form.amount) &&
    (form.expense_account_id || defaultExpenseAccountId) &&
    !advanceTooHigh;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>المورد</Label>
        <Select value={form.supplier_id} onValueChange={handleSupplierChange}>
          <SelectTrigger><SelectValue placeholder="اختر المورد" /></SelectTrigger>
          <SelectContent>
            {(suppliers ?? []).map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>
          تخصيص الفاتورة (حساب المصروف في شجرة الحسابات)
        </Label>
        <Select value={form.expense_account_id} onValueChange={handleExpenseAccountChange}>
          <SelectTrigger>
            <SelectValue
              placeholder={
                defaultExpenseAccount
                  ? `افتراضي حسب فئة المورد: ${defaultExpenseAccount.name}`
                  : "اختر حساب المصروف (مثال: مصاريف طباعة، مصاريف وقود)"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {expenseAccounts.map((a) => (
              <SelectItem key={a.id} value={String(a.id)}>{a.code ? `${a.code} - ${a.name}` : a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!form.expense_account_id && !defaultExpenseAccountId && (
          <p className="text-xs text-destructive">
            هذا المورد بلا فئة/حساب مصروف افتراضي - يجب اختيار حساب المصروف يدويًا.
          </p>
        )}
      </div>

      <div className="space-y-2 border border-border rounded-md p-3">
        <div className="flex items-center justify-between">
          <Label>بنود الفاتورة (المواد المشتراة)</Label>
          <Button type="button" size="sm" variant="outline" onClick={() => setItems((l) => [...l, emptyItem()])}>
            <Icon icon="mdi:plus" className="w-4 h-4 ml-1" /> إضافة مادة
          </Button>
        </div>
        {!hasItems && (
          <p className="text-xs text-muted-foreground">
            لم تُضِف أي بند بعد - يمكنك إدخال مبلغ إجمالي مباشرة بالأسفل بدل التفصيل.
          </p>
        )}
        {items.map((item, index) => (
          <div key={index} className="grid grid-cols-12 gap-2 items-end border-t border-border/50 pt-2">
            <div className="col-span-12 sm:col-span-5">
              <Label className="text-xs">المادة</Label>
              <MaterialSearchInput
                value={item}
                accounting={accounting}
                onSelect={(v) => updateItem(index, v)}
              />
            </div>
            <div className="col-span-4 sm:col-span-2">
              <Label className="text-xs">الكمية</Label>
              <Input type="number" step="0.001" min="0.001" value={item.quantity}
                onChange={(e) => updateItem(index, { quantity: e.target.value })} required />
            </div>
            <div className="col-span-4 sm:col-span-2">
              <Label className="text-xs">سعر الوحدة</Label>
              <Input type="number" step="0.01" min="0" value={item.unit_price}
                onChange={(e) => updateItem(index, { unit_price: e.target.value })} required />
            </div>
            <div className="col-span-3 sm:col-span-2">
              <Label className="text-xs">المجموع</Label>
              <div className="h-9 flex items-center font-mono text-sm">
                {fmt((Number(item.quantity) || 0) * (Number(item.unit_price) || 0))}
              </div>
            </div>
            <div className="col-span-1">
              <Button type="button" size="icon" variant="ghost" onClick={() => removeItem(index)}>
                <Icon icon="mdi:trash-can-outline" className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
        {hasItems && (
          <div className="flex justify-end pt-2 border-t border-border/50 font-semibold">
            الإجمالي: {fmt(itemsTotal)} {form.currency === "SYP" ? "ل.س" : "$"}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>عملة الفاتورة (كيف فوتَر المورد)</Label>
        <Select value={form.currency} onValueChange={(v) => { set("currency")(v); set("cashbox_account_id")(""); }}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="USD">دولار ($)</SelectItem>
            <SelectItem value="SYP">ليرة سورية (ل.س)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>رقم الفاتورة</Label>
          <Input
            value={form.invoice_number}
            placeholder="يُولَّد تلقائيًا (أو أدخل رقم فاتورة المورد)"
            onChange={(e) => set("invoice_number")(e.target.value)}
          />
        </div>
        {!hasItems && (
          <div className="space-y-2">
            <Label>{form.currency === "SYP" ? "المبلغ الإجمالي (ل.س)" : "المبلغ الإجمالي ($)"}</Label>
            <Input type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => set("amount")(e.target.value)} required={!hasItems} />
          </div>
        )}
      </div>
      {form.currency === "SYP" && (
        <div className="space-y-2">
          <Label>سعر الصرف (كم ليرة = 1 دولار)</Label>
          <Input type="number" step="0.01" min="0.01" placeholder="مثال: 15000" value={form.exchange_rate} onChange={(e) => set("exchange_rate")(e.target.value)} required />
        </div>
      )}

      <AdvanceDeductionBox
        outstanding={supplierAdvance}
        totalUsd={invoiceTotalUsd}
        state={advanceState}
        onChange={setAdvanceState}
        payLabel={isCredit ? "يبقى مستحقًا (آجل)" : "يُدفع نقدًا"}
      />

      <div className="space-y-2">
        <Label>طريقة الدفع</Label>
        <Select value={form.payment_type} onValueChange={set("payment_type")}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">نقدي (يُدفع فورًا وبالكامل)</SelectItem>
            <SelectItem value="credit">آجل (يبقى مستحقًا على حساب المورد حتى يُسدَّد لاحقًا)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isCredit ? (
        <div className="space-y-2">
          <Label>تاريخ استحقاق الدفع (اختياري)</Label>
          <Input type="date" value={form.due_date} onChange={(e) => set("due_date")(e.target.value)} />
        </div>
      ) : (
        <div className="space-y-2">
          <Label>صندوق الدفع (يجب أن يكون بنفس عملة الفاتورة)</Label>
          <Select value={form.cashbox_account_id} onValueChange={set("cashbox_account_id")}>
            <SelectTrigger><SelectValue placeholder="الافتراضي" /></SelectTrigger>
            <SelectContent>
              {matchingCashAccounts.map((a) => (
                <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label>التاريخ</Label>
        <Input type="date" value={form.date} onChange={(e) => set("date")(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>الوصف / ملاحظات (اختياري)</Label>
        <Input value={form.description} onChange={(e) => set("description")(e.target.value)} />
      </div>
      <DialogFooter className="flex flex-col sm:flex-row gap-2">
        <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">إلغاء</Button>
        <Button type="submit" disabled={isSaving || !canSubmit} className="w-full sm:w-auto">
          {isSaving ? "جارٍ التسجيل..." : isCredit ? "تسجيل الفاتورة (آجل)" : "تسجيل الفاتورة وإصدار سند الدفع"}
        </Button>
      </DialogFooter>
    </form>
  );
};

const PayInvoiceForm = ({ invoice, suppliers = [], cashAccounts = [], onCancel, onSave, isSaving }) => {
  const [advanceState, setAdvanceState] = useAdvanceDeduction();
  const supplierAdvance = Number(
    (suppliers ?? []).find((s) => String(s.id) === String(invoice.supplier_id))?.outstanding_advance_balance || 0
  );
  const [form, setForm] = useState({
    amount: "",
    currency: "USD",
    exchange_rate: "",
    cashbox_account_id: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const matchingCashAccounts = cashAccounts.filter((a) => a.currency === form.currency);
  // مبلغ هذه الدفعة بالدولار (فارغ = كامل المتبقي).
  const payUsd = form.amount
    ? form.currency === "SYP"
      ? Number(form.exchange_rate) > 0
        ? Number(form.amount) / Number(form.exchange_rate)
        : 0
      : Number(form.amount)
    : Number(invoice.remaining_amount || 0);
  const advanceTooHigh = advancePreview(supplierAdvance, payUsd, advanceState).tooHigh;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          ...advancePayload(supplierAdvance, advanceState),
          ...(form.amount ? { amount: Number(form.amount) } : {}),
          currency: form.currency,
          ...(form.currency === "SYP" && form.exchange_rate ? { exchange_rate: Number(form.exchange_rate) } : {}),
          date: form.date,
          ...(form.cashbox_account_id ? { cashbox_account_id: Number(form.cashbox_account_id) } : {}),
        });
      }}
      className="space-y-4"
    >
      <p className="text-sm text-muted-foreground">
        المتبقي على هذه الفاتورة: <span className="font-semibold text-foreground">${fmt(invoice.remaining_amount)}</span>
      </p>
      <AdvanceDeductionBox
        outstanding={supplierAdvance}
        totalUsd={payUsd}
        state={advanceState}
        onChange={setAdvanceState}
        payLabel="يُدفع نقدًا"
      />
      <div className="space-y-2">
        <Label>عملة الدفعة</Label>
        <Select value={form.currency} onValueChange={(v) => { set("currency")(v); set("cashbox_account_id")(""); }}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="USD">دولار ($)</SelectItem>
            <SelectItem value="SYP">ليرة سورية (ل.س)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>{form.currency === "SYP" ? "المبلغ (ل.س) - اتركه فارغًا لتسديد المتبقي بالكامل" : "المبلغ ($) - اتركه فارغًا لتسديد المتبقي بالكامل"}</Label>
        <Input type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => set("amount")(e.target.value)} />
      </div>
      {form.currency === "SYP" && (
        <div className="space-y-2">
          <Label>سعر الصرف (كم ليرة = 1 دولار)</Label>
          <Input type="number" step="0.01" min="0.01" placeholder="مثال: 15000" value={form.exchange_rate} onChange={(e) => set("exchange_rate")(e.target.value)} required />
        </div>
      )}
      <div className="space-y-2">
        <Label>صندوق الدفع</Label>
        <Select value={form.cashbox_account_id} onValueChange={set("cashbox_account_id")}>
          <SelectTrigger><SelectValue placeholder="الافتراضي" /></SelectTrigger>
          <SelectContent>
            {matchingCashAccounts.map((a) => (
              <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>التاريخ</Label>
        <Input type="date" value={form.date} onChange={(e) => set("date")(e.target.value)} />
      </div>
      <DialogFooter className="flex flex-col sm:flex-row gap-2">
        <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">إلغاء</Button>
        <Button type="submit" disabled={isSaving || advanceTooHigh} className="w-full sm:w-auto">
          {isSaving ? "جارٍ التسديد..." : "تسديد وإصدار سند الدفع"}
        </Button>
      </DialogFooter>
    </form>
  );
};

/**
 * طلب صريح: "an invoice comparison feature that displays the attached
 * invoice image alongside the system's purchase invoice record, allowing
 * for a clear side-by-side price comparison." - عمود الصورة على اليمين
 * (رفع/استبدال/حذف + معاينة) بجانب سجل النظام على اليسار، خصوصًا للفواتير
 * الخارجية (طلب صريح آخر: "an option to attach an image of the actual
 * invoice document... particularly useful for external invoices").
 */
const InvoiceImageComparisonPanel = ({ invoice, accounting }) => {
  const {
    uploadPurchaseInvoiceImage,
    isUploadingPurchaseInvoiceImage,
    removePurchaseInvoiceImage,
    isRemovingPurchaseInvoiceImage,
  } = accounting ?? {};

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !uploadPurchaseInvoiceImage) return;
    await uploadPurchaseInvoiceImage(invoice.id, file);
    e.target.value = "";
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">صورة الفاتورة الخارجية (للمقارنة مع سجل النظام)</Label>
      <div className="border border-border rounded-md p-3 bg-muted/10 flex flex-col items-center justify-center min-h-[220px]">
        {invoice.invoice_image_url ? (
          <>
            <a href={invoice.invoice_image_url} target="_blank" rel="noopener noreferrer" className="block">
              <img
                src={invoice.invoice_image_url}
                alt="صورة الفاتورة الخارجية"
                className="max-h-64 rounded border border-border object-contain"
              />
            </a>
            <div className="flex gap-2 mt-3">
              <label>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                <Button asChild size="sm" variant="outline">
                  <span>{isUploadingPurchaseInvoiceImage ? "جارٍ الاستبدال..." : "استبدال الصورة"}</span>
                </Button>
              </label>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                disabled={isRemovingPurchaseInvoiceImage}
                onClick={() => removePurchaseInvoiceImage?.(invoice.id)}
              >
                حذف الصورة
              </Button>
            </div>
          </>
        ) : (
          <label className="flex flex-col items-center gap-2 cursor-pointer text-center">
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <Icon icon="mdi:image-plus-outline" className="w-10 h-10 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              لا توجد صورة مرفَقة - اضغط لإرفاق صورة الفاتورة الأصلية (خصوصًا للفواتير الخارجية)
            </span>
            <Button asChild size="sm" variant="outline">
              <span>{isUploadingPurchaseInvoiceImage ? "جارٍ الرفع..." : "إرفاق صورة"}</span>
            </Button>
          </label>
        )}
      </div>
    </div>
  );
};

const PurchaseInvoiceDetailsDialog = ({ invoiceId, open, onOpenChange, accounting }) => {
  const { data: invoice, isFetching } = useGetPurchaseInvoiceQuery(invoiceId, {
    skip: !invoiceId,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            تفاصيل الفاتورة {invoice?.invoice_number ? `#${invoice.invoice_number}` : invoiceId ? `#${invoiceId}` : ""}
          </DialogTitle>
        </DialogHeader>

        {isFetching && <p className="text-sm text-muted-foreground p-4 text-center">جارٍ التحميل...</p>}

        {!isFetching && invoice && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-4 md:col-span-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div className="bg-muted/40 rounded p-2">
                <div className="text-xs text-muted-foreground">المورد</div>
                <div className="font-semibold">{invoice.supplier?.name ?? "-"}</div>
              </div>
              <div className="bg-muted/40 rounded p-2">
                <div className="text-xs text-muted-foreground">حساب المصروف</div>
                <div className="font-semibold">{invoice.expense_account?.name ?? "-"}</div>
              </div>
              <div className="bg-muted/40 rounded p-2">
                <div className="text-xs text-muted-foreground">التاريخ</div>
                <div className="font-semibold">{invoice.date}</div>
              </div>
              <div className="bg-muted/40 rounded p-2">
                <div className="text-xs text-muted-foreground">طريقة الدفع</div>
                <div className="font-semibold">{invoice.payment_type === "credit" ? "آجل" : "نقدي"}</div>
              </div>
              <div className="bg-muted/40 rounded p-2">
                <div className="text-xs text-muted-foreground">المبلغ الإجمالي</div>
                <div className="font-semibold font-mono">${fmt(invoice.amount)}</div>
                {Number(invoice.advance_deducted) > 0 && (
                  <div className="text-xs text-amber-700">خُصم من سلفة المورد: ${fmt(invoice.advance_deducted)}</div>
                )}
              </div>
              <div className="bg-muted/40 rounded p-2">
                <div className="text-xs text-muted-foreground">أضيفت بواسطة</div>
                <div className="font-semibold">
                  {invoice.creator?.full_name || invoice.creator?.username || "-"}
                </div>
              </div>
            </div>

            {invoice.description && (
              <p className="text-sm text-muted-foreground">الوصف: {invoice.description}</p>
            )}

            <div>
              <Label className="text-xs">بنود الفاتورة (المواد المشتراة)</Label>
              <div className="overflow-x-auto border border-border rounded-md mt-1">
                <table className="w-full text-sm text-center">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground bg-muted/20">
                      <th className="p-2 text-center">المادة</th>
                      <th className="p-2 text-center">الوحدة</th>
                      <th className="p-2 text-center">الكمية</th>
                      <th className="p-2 text-center">سعر الوحدة</th>
                      <th className="p-2 text-center">المجموع</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(invoice.items ?? []).length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-3 text-center text-muted-foreground">
                          هذه فاتورة بمبلغ إجمالي بلا تفصيل مواد.
                        </td>
                      </tr>
                    )}
                    {(invoice.items ?? []).map((item) => (
                      <tr key={item.id} className="border-b border-border/50">
                        <td className="p-2 text-center">{item.material_name || item.material?.name || "-"}</td>
                        <td className="p-2 text-center text-xs">{item.unit || "-"}</td>
                        <td className="p-2 text-center font-mono">{item.quantity}</td>
                        <td className="p-2 text-center font-mono">{fmt(item.unit_price)}</td>
                        <td className="p-2 text-center font-mono">{fmt(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                  {(invoice.items ?? []).length > 0 && (
                    <tfoot>
                      <tr className="font-semibold bg-muted/20">
                        <td colSpan={4} className="p-2 text-center">الإجمالي</td>
                        <td className="p-2 text-center font-mono">
                          {fmt((invoice.items ?? []).reduce((s, it) => s + Number(it.subtotal || 0), 0))}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {(invoice.payments ?? []).length > 0 && (
              <div>
                <Label className="text-xs">الدفعات المسدَّدة</Label>
                <div className="overflow-x-auto border border-border rounded-md mt-1">
                  <table className="w-full text-sm text-center">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground bg-muted/20">
                        <th className="p-2 text-center">التاريخ</th>
                        <th className="p-2 text-center">المبلغ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.payments.map((p) => (
                        <tr key={p.id} className="border-b border-border/50">
                          <td className="p-2 text-center text-xs">{p.created_at?.slice?.(0, 10) ?? "-"}</td>
                          <td className="p-2 text-center font-mono">${fmt(p.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-1">
            <InvoiceImageComparisonPanel invoice={invoice} accounting={accounting} />
          </div>
          </div>
        )}

        <DialogFooter className="flex gap-2">
          {invoice && (
            <Button variant="default" onClick={() => openPurchaseInvoicePrint(invoice)}>
              <Icon icon="mdi:printer-outline" className="w-4 h-4 ml-1" />
              طباعة الفاتورة
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>إغلاق</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// تعديل غير مالي: رقم الفاتورة + الوصف (+ تاريخ الاستحقاق للآجلة). المبالغ والبنود تبقى كما هي.
const EditPurchaseInvoiceDialog = ({ invoice, onClose }) => {
  const [form, setForm] = useState({
    invoice_number: invoice?.invoice_number || "",
    description: invoice?.description || "",
    due_date: invoice?.due_date || "",
  });
  const [updateInvoice, { isLoading }] = useUpdatePurchaseInvoiceMutation();
  const isCredit = invoice?.payment_type === "credit";
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    try {
      await updateInvoice({
        id: invoice.id,
        invoice_number: form.invoice_number,
        description: form.description,
        ...(isCredit && form.due_date ? { due_date: form.due_date } : {}),
      }).unwrap();
      toast.success("تم تعديل الفاتورة");
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || "فشل تعديل الفاتورة");
    }
  };

  return (
    <Dialog open={Boolean(invoice)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl">
        <DialogHeader><DialogTitle>تعديل الفاتورة {invoice?.invoice_number || `#${invoice?.id ?? ""}`}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <p className="text-xs text-muted-foreground">
            لتغيير المبالغ أو البنود احذف الفاتورة (إن كانت تجريبية) وأعد إدخالها.
          </p>
          <div className="space-y-2">
            <Label>رقم الفاتورة</Label>
            <Input value={form.invoice_number} onChange={set("invoice_number")} />
          </div>
          <div className="space-y-2">
            <Label>الوصف</Label>
            <Input value={form.description} onChange={set("description")} />
          </div>
          {isCredit && (
            <div className="space-y-2">
              <Label>تاريخ الاستحقاق</Label>
              <Input type="date" value={form.due_date} onChange={set("due_date")} />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? "جارٍ الحفظ..." : "حفظ"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const PurchaseInvoicesTab = ({ accounting }) => {
  const {
    purchaseInvoices,
    purchaseInvoicesMeta,
    purchaseInvoiceFilters,
    isFetchingPurchaseInvoices,
    addPurchaseInvoice,
    isSavingPurchaseInvoice,
    openPurchaseInvoiceVoucher,
    archivePurchaseInvoice,
    unarchivePurchaseInvoice,
    payPurchaseInvoice,
    isPayingPurchaseInvoice,
    deletePurchaseInvoice,
    isDeletingPurchaseInvoice,
    suppliers,
    setPurchaseInvoiceFilters,
    cashAccounts,
    postableAccounts,
  } = accounting;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [payTarget, setPayTarget] = useState(null);
  const [detailsInvoiceId, setDetailsInvoiceId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editInvoice, setEditInvoice] = useState(null);
  const showingArchived = Boolean(purchaseInvoiceFilters?.archived);
  // حسابات المصروف القابلة للترحيل إليها فقط (شجرة الحسابات - نوع "مصروف")
  // - تُستخدم في تخصيص فاتورة الشراء (طلب العميل).
  const expenseAccounts = (postableAccounts ?? []).filter((a) => a.type === "expense");

  const updateFilter = (key, value) => {
    setPurchaseInvoiceFilters((f) => ({ ...f, [key]: value || undefined, page: 1 }));
  };

  return (
    <div className="space-y-4">
      <div className="border border-border rounded-lg bg-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-border gap-2">
          <h3 className="font-semibold">فواتير الشراء {showingArchived && "(المؤرشفة)"}</h3>
          <Button size="sm" onClick={() => setDialogOpen(true)} className="w-full sm:w-auto">
            <Icon icon="mdi:receipt-text-plus-outline" className="w-4 h-4 ml-1" />
            فاتورة جديدة
          </Button>
        </div>
        <div className="flex flex-wrap items-end gap-3 p-4 border-b border-border bg-muted/20">
          <div className="space-y-1 w-full sm:w-auto">
            <Label className="text-xs">المورد</Label>
            <Select
              value={purchaseInvoiceFilters?.supplier_id ? String(purchaseInvoiceFilters.supplier_id) : "all"}
              onValueChange={(v) => updateFilter("supplier_id", v === "all" ? undefined : v)}
            >
              <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="كل الموردين" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الموردين</SelectItem>
                {(suppliers ?? []).map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 w-full sm:w-auto">
            <Label className="text-xs">من تاريخ</Label>
            <Input
              type="date"
              className="w-full sm:w-40"
              value={purchaseInvoiceFilters?.from_date || ""}
              onChange={(e) => updateFilter("from_date", e.target.value)}
            />
          </div>
          <div className="space-y-1 w-full sm:w-auto">
            <Label className="text-xs">إلى تاريخ</Label>
            <Input
              type="date"
              className="w-full sm:w-40"
              value={purchaseInvoiceFilters?.to_date || ""}
              onChange={(e) => updateFilter("to_date", e.target.value)}
            />
          </div>
          <Button
            size="sm"
            variant={showingArchived ? "default" : "outline"}
            onClick={() => updateFilter("archived", showingArchived ? undefined : 1)}
            className="w-full sm:w-auto"
          >
            <Icon icon="mdi:archive-outline" className="w-4 h-4 ml-1" />
            {showingArchived ? "عرض غير المؤرشف" : "عرض المؤرشف"}
          </Button>
          {(purchaseInvoiceFilters?.supplier_id || purchaseInvoiceFilters?.from_date || purchaseInvoiceFilters?.to_date) && (
            <Button size="sm" variant="ghost" onClick={() => setPurchaseInvoiceFilters({ page: 1 })} className="w-full sm:w-auto">
              مسح الفلاتر
            </Button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-center min-w-[800px]">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="p-2 text-center">رقم الفاتورة</th>
                <th className="p-2 text-center">المورد</th>
                <th className="p-2 text-center">حساب المصروف</th>
                <th className="p-2 text-center">التاريخ</th>
                <th className="p-2 text-center">الوصف</th>
                <th className="p-2 text-center">المبلغ</th>
                <th className="p-2 text-center">الحالة</th>
                <th className="p-2 text-center">أضيفت بواسطة</th>
                <th className="p-2 text-center">سند الدفع</th>
                <th className="p-2 text-center">التفاصيل</th>
                <th className="p-2 text-center">{showingArchived ? "استعادة" : "أرشفة"}</th>
                <th className="p-2 text-center">تعديل</th>
                <th className="p-2 text-center">حذف</th>
              </tr>
            </thead>
            <tbody>
              {isFetchingPurchaseInvoices && (
                <tr><td colSpan={13} className="p-4 text-center text-muted-foreground">جارٍ التحميل...</td></tr>
              )}
              {!isFetchingPurchaseInvoices && (purchaseInvoices ?? []).length === 0 && (
                <tr><td colSpan={13} className="p-4 text-center text-muted-foreground">
                  {showingArchived ? "لا يوجد فواتير مؤرشفة" : "لا يوجد فواتير بعد"}
                </td></tr>
              )}
              {(purchaseInvoices ?? []).map((invoice) => (
                <tr key={invoice.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="p-2 font-mono text-xs text-center">{invoice.invoice_number || "-"}</td>
                  <td className="p-2 text-center">{invoice.supplier?.name ?? "-"}</td>
                  <td className="p-2 text-center text-xs">{invoice.expense_account?.name ?? "-"}</td>
                  <td className="p-2 text-xs text-center">{invoice.date}</td>
                  <td className="p-2 max-w-[220px] truncate text-center" title={invoice.description}>{invoice.description || "-"}</td>
                  <td className="p-2 font-mono text-center">
                    ${fmt(invoice.amount)}
                    {Number(invoice.advance_deducted) > 0 && (
                      <div className="text-[10px] text-amber-700 font-sans" title="خُصم من سلفة المورد">
                        من السلفة: ${fmt(invoice.advance_deducted)}
                      </div>
                    )}
                  </td>
                  <td className="p-2 text-center">
                    {invoice.payment_type === "credit" ? (
                      invoice.is_fully_paid ? (
                        <span className="text-xs text-emerald-600 font-medium">آجل - مسدَّدة بالكامل</span>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs text-amber-600 font-medium">
                            آجل - متبقٍ ${fmt(invoice.remaining_amount)}
                          </span>
                          <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => setPayTarget(invoice)}>
                            تسديد
                          </Button>
                        </div>
                      )
                    ) : (
                      <span className="text-xs text-muted-foreground">نقدي</span>
                    )}
                  </td>
                  <td className="p-2 text-center text-xs">
                    {invoice.creator?.full_name || invoice.creator?.username || "-"}
                  </td>
                  <td className="p-2 text-center">
                    {invoice.payment_voucher_url && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => openPurchaseInvoiceVoucher(invoice)}
                        title="طباعة سند الدفع"
                      >
                        <Icon icon="mdi:printer-outline" className="w-4 h-4" />
                      </Button>
                    )}
                  </td>
                  <td className="p-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => setDetailsInvoiceId(invoice.id)}
                        title="عرض تفاصيل الفاتورة"
                      >
                        <Icon icon="mdi:eye-outline" className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => openPurchaseInvoicePrint(invoice)}
                        title="طباعة فاتورة الشراء"
                      >
                        <Icon icon="mdi:file-document-outline" className="w-4 h-4" />
                      </Button>
                      {invoice.invoice_image_url && (
                        <Icon
                          icon="mdi:image-check-outline"
                          className="w-4 h-4 text-emerald-600"
                          title="مرفَق معها صورة الفاتورة الخارجية"
                        />
                      )}
                    </div>
                  </td>
                  <td className="p-2 text-center">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() =>
                        showingArchived
                          ? unarchivePurchaseInvoice(invoice.id)
                          : archivePurchaseInvoice(invoice.id)
                      }
                      title={showingArchived ? "استعادة من الأرشيف" : "أرشفة"}
                    >
                      <Icon
                        icon={showingArchived ? "mdi:archive-arrow-up-outline" : "mdi:archive-outline"}
                        className="w-4 h-4"
                      />
                    </Button>
                  </td>
                  <td className="p-2 text-center">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => setEditInvoice(invoice)}
                      title="تعديل الفاتورة"
                    >
                      <Icon icon="mdi:pencil-outline" className="w-4 h-4" />
                    </Button>
                  </td>
                  <td className="p-2 text-center">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(invoice)}
                      title="حذف الفاتورة"
                    >
                      <Icon icon="mdi:trash-can-outline" className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {purchaseInvoicesMeta?.total_pages > 1 && (
          <div className="flex items-center justify-center gap-2 p-3 border-t border-border flex-wrap">
            <Button
              size="sm"
              variant="outline"
              disabled={purchaseInvoicesMeta.current_page <= 1}
              onClick={() => setPurchaseInvoiceFilters((f) => ({ ...f, page: (f.page || 1) - 1 }))}
            >
              السابق
            </Button>
            <span className="text-sm text-muted-foreground">
              صفحة {purchaseInvoicesMeta.current_page} من {purchaseInvoicesMeta.total_pages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={purchaseInvoicesMeta.current_page >= purchaseInvoicesMeta.total_pages}
              onClick={() => setPurchaseInvoiceFilters((f) => ({ ...f, page: (f.page || 1) + 1 }))}
            >
              التالي
            </Button>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[600px] md:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>فاتورة شراء جديدة</DialogTitle></DialogHeader>
          <AddPurchaseInvoiceForm
            suppliers={suppliers}
            cashAccounts={cashAccounts}
            expenseAccounts={expenseAccounts}
            accounting={accounting}
            onCancel={() => setDialogOpen(false)}
            onSave={async (data) => {
              const ok = await addPurchaseInvoice(data);
              if (ok) setDialogOpen(false);
            }}
            isSaving={isSavingPurchaseInvoice}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(payTarget)} onOpenChange={(open) => !open && setPayTarget(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>تسديد فاتورة آجلة - {payTarget?.invoice_number || `#${payTarget?.id}`}</DialogTitle></DialogHeader>
          {payTarget && (
            <PayInvoiceForm
              invoice={payTarget}
              suppliers={suppliers}
              cashAccounts={cashAccounts}
              onCancel={() => setPayTarget(null)}
              onSave={async (data) => {
                const ok = await payPurchaseInvoice(payTarget.id, data);
                if (ok) setPayTarget(null);
              }}
              isSaving={isPayingPurchaseInvoice}
            />
          )}
        </DialogContent>
      </Dialog>

      <DeleteDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        loading={isDeletingPurchaseInvoice}
        title="حذف فاتورة الشراء"
        description={`سيتم حذف الفاتورة ${deleteTarget?.invoice_number || `#${deleteTarget?.id ?? ""}`} نهائيًا مع بنودها ودفعاتها، وتُعكَس قيودها المحاسبية (المصروف، حساب المورد، والصندوق) تلقائيًا. هل أنت متأكد؟`}
        onConfirm={async () => {
          const ok = await deletePurchaseInvoice(deleteTarget.id);
          if (ok) {
            if (detailsInvoiceId === deleteTarget.id) setDetailsInvoiceId(null);
            setDeleteTarget(null);
          }
        }}
      />

      {editInvoice && <EditPurchaseInvoiceDialog key={editInvoice.id} invoice={editInvoice} onClose={() => setEditInvoice(null)} />}

      <PurchaseInvoiceDetailsDialog
        invoiceId={detailsInvoiceId}
        open={Boolean(detailsInvoiceId)}
        onOpenChange={(open) => !open && setDetailsInvoiceId(null)}
        accounting={accounting}
      />
    </div>
  );
};

export default PurchaseInvoicesTab;