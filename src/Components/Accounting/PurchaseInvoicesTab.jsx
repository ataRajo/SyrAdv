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

const fmt = (n) => Number(n ?? 0).toLocaleString("ar-SY", { minimumFractionDigits: 2 });

const emptyItem = () => ({ material_id: null, material_name: "", unit: "", quantity: "1", unit_price: "" });

const AddPurchaseInvoiceForm = ({ suppliers, cashAccounts = [], accounting, onCancel, onSave, isSaving }) => {
  const [form, setForm] = useState({
    supplier_id: "",
    invoice_number: "",
    amount: "", // يُستخدَم فقط إن لم تُضَف أي بنود (فاتورة بسيطة بلا تفصيل)
    currency: "USD",
    exchange_rate: "",
    cashbox_account_id: "",
    date: new Date().toISOString().slice(0, 10),
    description: "",
    payment_type: "cash",
    due_date: "",
  });
  const [items, setItems] = useState([]);
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

  // الدفع يجب أن يتم عبر صندوق بنفس عملة الفاتورة (الأبسط والأوضح - بلا
  // تحويل مزدوج مُلبِس) - انظر PurchaseInvoiceService على الباك-إند.
  const matchingCashAccounts = cashAccounts.filter((a) => a.currency === form.currency);
  const isCredit = form.payment_type === "credit";

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>المورد</Label>
        <Select value={form.supplier_id} onValueChange={set("supplier_id")}>
          <SelectTrigger><SelectValue placeholder="اختر المورد" /></SelectTrigger>
          <SelectContent>
            {(suppliers ?? []).map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* بنود الفاتورة (طلب العميل: تفصيل المواد المشتراة وكمياتها، مع البحث) */}
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
            <div className="col-span-5">
              <Label className="text-xs">المادة</Label>
              <MaterialSearchInput
                value={item}
                accounting={accounting}
                onSelect={(v) => updateItem(index, v)}
              />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">الكمية</Label>
              <Input type="number" step="0.001" min="0.001" value={item.quantity}
                onChange={(e) => updateItem(index, { quantity: e.target.value })} required />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">سعر الوحدة</Label>
              <Input type="number" step="0.01" min="0" value={item.unit_price}
                onChange={(e) => updateItem(index, { unit_price: e.target.value })} required />
            </div>
            <div className="col-span-2">
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
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>رقم الفاتورة (اختياري)</Label>
          <Input value={form.invoice_number} onChange={(e) => set("invoice_number")(e.target.value)} />
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
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>إلغاء</Button>
        <Button type="submit" disabled={isSaving || !form.supplier_id || (!hasItems && !form.amount)}>
          {isSaving ? "جارٍ التسجيل..." : isCredit ? "تسجيل الفاتورة (آجل)" : "تسجيل الفاتورة وإصدار سند الدفع"}
        </Button>
      </DialogFooter>
    </form>
  );
};

const PayInvoiceForm = ({ invoice, cashAccounts = [], onCancel, onSave, isSaving }) => {
  const [form, setForm] = useState({
    amount: "",
    currency: "USD",
    exchange_rate: "",
    cashbox_account_id: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const matchingCashAccounts = cashAccounts.filter((a) => a.currency === form.currency);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          ...(form.amount ? { amount: Number(form.amount) } : {}), // فارغ = كامل المتبقي
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
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>إلغاء</Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "جارٍ التسديد..." : "تسديد وإصدار سند الدفع"}
        </Button>
      </DialogFooter>
    </form>
  );
};

/**
 * فواتير الشراء - كل فاتورة تُصدر تلقائيًا قيدين: اعتراف بالمصروف مقابل
 * حساب المورد، ثم سند دفع فعلي فورًا (PurchaseInvoiceService على
 * الباك-إند) - نفس مسار سند الصرف العادي، لذلك زر الطباعة هنا يفتح نفس
 * VoucherController::show() المستخدم في بقية الوحدة.
 */
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
    suppliers,
    setPurchaseInvoiceFilters,
    cashAccounts,
  } = accounting;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [payTarget, setPayTarget] = useState(null);
  const showingArchived = Boolean(purchaseInvoiceFilters?.archived);

  const updateFilter = (key, value) => {
    setPurchaseInvoiceFilters((f) => ({ ...f, [key]: value || undefined, page: 1 }));
  };

  return (
    <div className="space-y-4">
      <div className="border border-border rounded-lg bg-card">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">فواتير الشراء {showingArchived && "(المؤرشفة)"}</h3>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Icon icon="mdi:receipt-text-plus-outline" className="w-4 h-4 ml-1" />
            فاتورة جديدة
          </Button>
        </div>
        <div className="flex flex-wrap items-end gap-3 p-4 border-b border-border bg-muted/20">
          <div className="space-y-1">
            <Label className="text-xs">المورد</Label>
            <Select
              value={purchaseInvoiceFilters?.supplier_id ? String(purchaseInvoiceFilters.supplier_id) : "all"}
              onValueChange={(v) => updateFilter("supplier_id", v === "all" ? undefined : v)}
            >
              <SelectTrigger className="w-44"><SelectValue placeholder="كل الموردين" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الموردين</SelectItem>
                {(suppliers ?? []).map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">من تاريخ</Label>
            <Input
              type="date"
              className="w-40"
              value={purchaseInvoiceFilters?.from_date || ""}
              onChange={(e) => updateFilter("from_date", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">إلى تاريخ</Label>
            <Input
              type="date"
              className="w-40"
              value={purchaseInvoiceFilters?.to_date || ""}
              onChange={(e) => updateFilter("to_date", e.target.value)}
            />
          </div>
          <Button
            size="sm"
            variant={showingArchived ? "default" : "outline"}
            onClick={() => updateFilter("archived", showingArchived ? undefined : 1)}
          >
            <Icon icon="mdi:archive-outline" className="w-4 h-4 ml-1" />
            {showingArchived ? "عرض غير المؤرشف" : "عرض المؤرشف"}
          </Button>
          {(purchaseInvoiceFilters?.supplier_id || purchaseInvoiceFilters?.from_date || purchaseInvoiceFilters?.to_date) && (
            <Button size="sm" variant="ghost" onClick={() => setPurchaseInvoiceFilters({ page: 1 })}>
              مسح الفلاتر
            </Button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-center">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="p-2 text-center">رقم الفاتورة</th>
                <th className="p-2 text-center">المورد</th>
                <th className="p-2 text-center">التاريخ</th>
                <th className="p-2 text-center">الوصف</th>
                <th className="p-2 text-center">المبلغ</th>
                <th className="p-2 text-center">الحالة</th>
                <th className="p-2 text-center">سند الدفع</th>
                <th className="p-2 text-center">{showingArchived ? "استعادة" : "أرشفة"}</th>
              </tr>
            </thead>
            <tbody>
              {isFetchingPurchaseInvoices && (
                <tr><td colSpan={8} className="p-4 text-center text-muted-foreground">جارٍ التحميل...</td></tr>
              )}
              {!isFetchingPurchaseInvoices && (purchaseInvoices ?? []).length === 0 && (
                <tr><td colSpan={8} className="p-4 text-center text-muted-foreground">
                  {showingArchived ? "لا يوجد فواتير مؤرشفة" : "لا يوجد فواتير بعد"}
                </td></tr>
              )}
              {(purchaseInvoices ?? []).map((invoice) => (
                <tr key={invoice.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="p-2 font-mono text-xs text-center">{invoice.invoice_number || "-"}</td>
                  <td className="p-2 text-center">{invoice.supplier?.name ?? "-"}</td>
                  <td className="p-2 text-xs text-center">{invoice.date}</td>
                  <td className="p-2 max-w-[220px] truncate text-center" title={invoice.description}>{invoice.description || "-"}</td>
                  <td className="p-2 font-mono text-center">${fmt(invoice.amount)}</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {purchaseInvoicesMeta?.total_pages > 1 && (
          <div className="flex items-center justify-center gap-2 p-3 border-t border-border">
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
        <DialogContent>
          <DialogHeader><DialogTitle>فاتورة شراء جديدة</DialogTitle></DialogHeader>
          <AddPurchaseInvoiceForm
            suppliers={suppliers}
            cashAccounts={cashAccounts}
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
        <DialogContent>
          <DialogHeader><DialogTitle>تسديد فاتورة آجلة - {payTarget?.invoice_number || `#${payTarget?.id}`}</DialogTitle></DialogHeader>
          {payTarget && (
            <PayInvoiceForm
              invoice={payTarget}
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
    </div>
  );
};

export default PurchaseInvoicesTab;