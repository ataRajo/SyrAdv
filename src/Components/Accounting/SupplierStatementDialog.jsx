import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@iconify/react";

const fmt = (n) => Number(n ?? 0).toLocaleString("ar-SY", { minimumFractionDigits: 2 });

/**
 * كل نوع حركة في الـ timeline له أيقونة ولون مميّز - نفس فكرة
 * EmployeeStatementDialog's ENTRY_META بالضبط، على الجانب الآخر (مورد).
 */
const ENTRY_META = {
  purchase_invoice: { icon: "mdi:file-document-outline", color: "text-sky-700 bg-sky-50 border-sky-200" },
  invoice_payment: { icon: "mdi:cash-fast", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  advance_given: { icon: "mdi:hand-coin-outline", color: "text-amber-700 bg-amber-50 border-amber-200" },
  // سند قبض - تحصيل/استرجاع سلفة يدويًا - راجع
  // SupplierAdvanceService::settleOutstanding().
  advance_settlement: { icon: "mdi:cash-check", color: "text-blue-700 bg-blue-50 border-blue-200" },
};

const PAYMENT_TYPE_LABELS = { cash: "نقدي", credit: "آجل" };

const SummaryCard = ({ label, value, sub, tone = "" }) => (
  <div className={`rounded-lg border border-border p-3 bg-card ${tone}`}>
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    <p className="font-mono font-semibold">{value}</p>
    {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
  </div>
);

/**
 * جدول بنود المادة داخل بطاقة فاتورة الشراء - طلب صريح: "المواد" ضمن
 * تفاصيل كشف الحساب، لا فقط مبلغ الفاتورة الإجمالي.
 */
const InvoiceItemsTable = ({ items }) => {
  if (!items || items.length === 0) return null;
  return (
    <div className="mt-2 overflow-x-auto rounded-md border border-border/60 bg-background/60">
      <table className="w-full text-[11px] text-center">
        <thead>
          <tr className="text-muted-foreground border-b border-border/60">
            <th className="p-1 text-center">المادة</th>
            <th className="p-1 text-center">الكمية</th>
            <th className="p-1 text-center">الوحدة</th>
            <th className="p-1 text-center">سعر الوحدة</th>
            <th className="p-1 text-center">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} className="border-b border-border/40 last:border-0">
              <td className="p-1 text-center">{item.material_name || "-"}</td>
              <td className="p-1 text-center font-mono">{item.quantity}</td>
              <td className="p-1 text-center">{item.unit || "-"}</td>
              <td className="p-1 text-center font-mono">{fmt(item.unit_price)}</td>
              <td className="p-1 text-center font-mono">{fmt(item.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * كشف حساب مورد موحَّد (طلب صريح) - فواتير شراء (مع موادها) + دفعات على
 * فواتير آجلة + سلف، في timeline واحد بدل التنقل بين تبويبتَي "فواتير
 * الشراء" و"السلف" منفصلتين. يُفتَح من زر "كشف حساب" بجانب كل مورد في
 * SuppliersTab، ويعتمد على GET /accounting/suppliers/{id}/statement
 * (SupplierStatementService).
 */
const SupplierStatementDialog = ({ accounting }) => {
  const {
    statementSupplierId,
    closeSupplierStatement,
    supplierStatement,
    isFetchingSupplierStatement,
    loadSupplierStatement,
  } = accounting;

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const open = Boolean(statementSupplierId);

  useEffect(() => {
    if (open) {
      setFromDate("");
      setToDate("");
    }
  }, [open, statementSupplierId]);

  const applyFilters = () => {
    loadSupplierStatement({
      ...(fromDate ? { from_date: fromDate } : {}),
      ...(toDate ? { to_date: toDate } : {}),
    });
  };

  const clearFilters = () => {
    setFromDate("");
    setToDate("");
    loadSupplierStatement({});
  };

  const summary = supplierStatement?.summary;
  const materials = Array.isArray(supplierStatement?.materials) ? supplierStatement.materials : [];
  const entries = Array.isArray(supplierStatement?.entries) ? supplierStatement.entries : [];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && closeSupplierStatement()}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            كشف حساب مورد {supplierStatement?.supplier?.name ? `- ${supplierStatement.supplier.name}` : ""}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-end gap-2 flex-wrap border-b border-border pb-4">
          <div className="space-y-1">
            <Label className="text-xs">من تاريخ</Label>
            <Input type="date" className="h-8 w-36" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">إلى تاريخ</Label>
            <Input type="date" className="h-8 w-36" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <Button size="sm" className="h-8" onClick={applyFilters}>تطبيق</Button>
          {(fromDate || toDate) && (
            <Button size="sm" variant="ghost" className="h-8" onClick={clearFilters}>مسح</Button>
          )}
          {supplierStatement?.from_date && supplierStatement?.to_date && (
            <span className="text-xs text-muted-foreground mr-auto">
              الفترة المعروضة: {supplierStatement.from_date} إلى {supplierStatement.to_date}
            </span>
          )}
        </div>

        {isFetchingSupplierStatement && !supplierStatement && (
          <p className="p-6 text-center text-muted-foreground">جارٍ التحميل...</p>
        )}

        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryCard
              label="الرصيد المستحق للمورد"
              value={fmt(summary.outstanding_balance)}
              tone={summary.outstanding_balance > 0 ? "border-amber-200" : ""}
            />
            <SummaryCard label="رصيد السلفة القائم" value={fmt(summary.outstanding_advance_balance)} />
            {/* المتبقي (طلب صريح): المستحق فعليًا للمورد بعد خصم أي سلفة قائمة
                لم تُستهلَك بعد - انظر شرح net_remaining_balance في
                SupplierStatementService::summary(). سالب (net_remaining_balance_raw)
                يعني السلفة تفوق المستحق حاليًا: لا يوجد متبقٍ، بل فائض سلفة
                جاهز لفواتير قادمة. */}
            <SummaryCard
              label="المتبقي على المورد (بعد خصم السلفة)"
              value={
                summary.net_remaining_balance_raw < 0
                  ? `فائض سلفة: ${fmt(Math.abs(summary.net_remaining_balance_raw))}`
                  : fmt(summary.net_remaining_balance)
              }
              sub={
                summary.net_remaining_balance_raw < 0
                  ? "السلفة القائمة تغطي كامل المستحق وتزيد - الفائض جاهز لفواتير قادمة"
                  : summary.outstanding_advance_balance > 0
                  ? `بعد خصم سلفة قائمة قدرها ${fmt(summary.outstanding_advance_balance)}`
                  : undefined
              }
              tone={
                summary.net_remaining_balance_raw > 0
                  ? "border-amber-200"
                  : summary.net_remaining_balance_raw < 0
                  ? "border-emerald-200"
                  : ""
              }
            />
            <SummaryCard label="إجمالي المشتريات (للفترة)" value={fmt(summary.total_purchases)} />
            <SummaryCard label="إجمالي المدفوع (للفترة)" value={fmt(summary.total_paid)} />
            <SummaryCard label="إجمالي السلف الممنوحة (للفترة)" value={fmt(summary.total_advances_given)} />
            <SummaryCard label="إجمالي المُحصَّل من السلف (للفترة)" value={fmt(summary.total_advances_settled)} />
            <SummaryCard label="عدد الفواتير (للفترة)" value={summary.invoices_count} />
            <SummaryCard
              label="فواتير آجلة غير مسدَّدة"
              value={summary.unpaid_credit_invoices_count}
              tone={summary.unpaid_credit_invoices_count > 0 ? "border-red-200" : ""}
            />
          </div>
        )}

        {/* ملخص المواد - طلب صريح: تجميع كل ما اشتُرِي من كل مادة عبر كل الفواتير ضمن الفترة */}
        {materials.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-1.5">
              <Icon icon="mdi:package-variant-closed" className="w-4 h-4" />
              المواد المُشتراة ({materials.length})
            </h4>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-xs text-center">
                <thead>
                  <tr className="text-muted-foreground border-b border-border bg-muted/30">
                    <th className="p-2 text-center">المادة</th>
                    <th className="p-2 text-center">الوحدة</th>
                    <th className="p-2 text-center">إجمالي الكمية</th>
                    <th className="p-2 text-center">عدد عمليات الشراء</th>
                    <th className="p-2 text-center">إجمالي المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((m, idx) => (
                    <tr key={m.material_id ?? idx} className="border-b border-border/50 last:border-0">
                      <td className="p-2 text-center font-medium">{m.material_name || "-"}</td>
                      <td className="p-2 text-center">{m.unit || "-"}</td>
                      <td className="p-2 text-center font-mono">{m.total_quantity}</td>
                      <td className="p-2 text-center">{m.purchases_count}</td>
                      <td className="p-2 text-center font-mono font-semibold">{fmt(m.total_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="font-semibold text-sm">الحركات ({entries.length})</h4>
          {!isFetchingSupplierStatement && entries.length === 0 && (
            <p className="p-4 text-center text-muted-foreground text-sm">لا توجد حركات ضمن الفترة المحددة</p>
          )}
          <div className="space-y-2">
            {entries.map((entry) => {
              const meta = ENTRY_META[entry.type] || { icon: "mdi:circle-small", color: "text-muted-foreground bg-muted/30 border-border" };
              return (
                <div
                  key={entry.id}
                  className={`flex items-start gap-3 rounded-lg border p-3 ${meta.color}`}
                >
                  <Icon icon={meta.icon} className="w-5 h-5 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="font-medium text-sm">
                        {entry.title}
                        {entry.type === "purchase_invoice" && entry.payment_type && (
                          <span className="mr-1.5 text-[11px] font-normal text-muted-foreground">
                            ({PAYMENT_TYPE_LABELS[entry.payment_type] || entry.payment_type})
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground shrink-0">{entry.date}</p>
                    </div>
                    {entry.details && (
                      <p className="text-xs text-muted-foreground mt-0.5 break-words">{entry.details}</p>
                    )}
                    {entry.type === "purchase_invoice" && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        مدفوع: {fmt(entry.amount_paid)} — متبقي: {fmt(entry.remaining_amount)}
                        {entry.is_fully_paid ? " — مسدَّدة بالكامل" : ""}
                        {entry.is_archived ? " — مؤرشفة" : ""}
                      </p>
                    )}
                    {entry.type === "purchase_invoice" && <InvoiceItemsTable items={entry.items} />}
                    {entry.type === "advance_given" && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        الرصيد المتبقي من هذه السلفة: {fmt(entry.remaining_balance)}
                      </p>
                    )}
                  </div>
                  <p className="font-mono font-semibold text-sm shrink-0">{fmt(entry.amount)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SupplierStatementDialog;
