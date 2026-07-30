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

const fmt = (n) => Number(n ?? 0).toLocaleString("ar-SY", { minimumFractionDigits: 2 });

const ConfirmClosingForm = ({ closing, onCancel, onConfirm, isConfirming }) => {
  const [countedAmount, setCountedAmount] = useState(closing?.calculated_closing_balance ?? "");
  const [notes, setNotes] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onConfirm(Number(countedAmount), notes);
      }}
      className="space-y-4"
    >
      <div className="bg-muted/40 rounded p-3 text-sm">
        <div className="flex justify-between mb-1">
          <span>الصافي المحسوب:</span>
          <span className="font-mono font-semibold">{fmt(closing?.calculated_closing_balance)}</span>
        </div>
      </div>
      <div className="space-y-2">
        <Label>المبلغ الفعلي المعدود</Label>
        <Input
          type="number"
          step="0.01"
          value={countedAmount}
          onChange={(e) => setCountedAmount(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>ملاحظات (اختياري)</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>إلغاء</Button>
        <Button type="submit" disabled={isConfirming || !countedAmount}>
          {isConfirming ? "جارٍ التأكيد..." : "تأكيد الاستلام"}
        </Button>
      </DialogFooter>
    </form>
  );
};

const CashClosingTab = ({ accounting }) => {
  const {
    cashAccounts,
    cashClosingFilters,
    setCashClosingFilters,
    cashClosings,
    isFetchingCashClosings,
    cashClosingPreview,
    isPreviewingCashClosing,
    previewCashClosing,
    closeCashRegister,
    isClosingCashRegister,
    confirmCashClosing,
    isConfirmingCashClosing,
    printCashClosing,
  } = accounting;

  const [form, setForm] = useState({
    account_id: "",
    date: new Date().toISOString().slice(0, 10),
    employee_id: "",
    notes: "",
  });
  const [confirmTarget, setConfirmTarget] = useState(null);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const handlePreview = () => {
    previewCashClosing(form.account_id, form.date, form.employee_id || undefined);
  };

  const handleClose = async () => {
    const ok = await closeCashRegister({
      account_id: Number(form.account_id),
      date: form.date,
      ...(form.employee_id ? { employee_id: Number(form.employee_id) } : {}),
      ...(form.notes ? { notes: form.notes } : {}),
    });
    if (ok) handlePreview();
  };

  return (
    <div className="space-y-6">
      {/* Preview / Close form */}
      <div className="border border-border rounded-lg bg-card">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">تقفيل الصندوق اليومي</h3>
          <p className="text-xs text-muted-foreground mt-1">
            الرصيد الافتتاحي + القبض − الصرف = الصافي الجاهز للتسليم
          </p>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-2 min-w-[200px]">
              <Label>الصندوق / البنك</Label>
              <Select value={form.account_id} onValueChange={set("account_id")}>
                <SelectTrigger><SelectValue placeholder="اختر الحساب" /></SelectTrigger>
                <SelectContent>
                  {cashAccounts.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>التاريخ</Label>
              <Input type="date" value={form.date} onChange={(e) => set("date")(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>الموظف (اختياري)</Label>
              <Input
                type="number"
                placeholder="رقم الموظف"
                value={form.employee_id}
                onChange={(e) => set("employee_id")(e.target.value)}
                className="w-36"
              />
            </div>
            <Button variant="outline" onClick={handlePreview} disabled={!form.account_id || !form.date}>
              <Icon icon="mdi:calculator-variant-outline" className="w-4 h-4 ml-1" />
              معاينة
            </Button>
          </div>

          {isPreviewingCashClosing && <p className="text-sm text-muted-foreground">جارٍ الحساب...</p>}

          {cashClosingPreview && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div className="bg-muted/40 rounded p-2">
                  <div className="text-xs text-muted-foreground">الرصيد الافتتاحي</div>
                  <div className="font-mono font-semibold">{fmt(cashClosingPreview.opening_balance)}</div>
                </div>
                <div className="bg-muted/40 rounded p-2">
                  <div className="text-xs text-muted-foreground">إجمالي القبض</div>
                  <div className="font-mono font-semibold text-emerald-700">+{fmt(cashClosingPreview.total_incoming)}</div>
                </div>
                <div className="bg-muted/40 rounded p-2">
                  <div className="text-xs text-muted-foreground">إجمالي الصرف</div>
                  <div className="font-mono font-semibold text-red-700">-{fmt(cashClosingPreview.total_outgoing)}</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded p-2">
                  <div className="text-xs text-muted-foreground">الصافي الجاهز للتسليم</div>
                  <div className="font-mono font-bold text-lg">{fmt(cashClosingPreview.calculated_closing_balance)}</div>
                </div>
              </div>

              {cashClosingPreview.line_details?.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs">
                    تفاصيل الحركات (للمراجعة قبل التأكيد - كل العقود والدفعات والسندات)
                  </Label>
                  <div className="overflow-x-auto border border-border rounded max-h-64 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-card">
                        <tr className="text-muted-foreground border-b border-border">
                          <th className="p-1 text-right">القيد</th>
                          <th className="p-1 text-right">النوع</th>
                          <th className="p-1 text-right">المرجع</th>
                          <th className="p-1 text-right">البيان</th>
                          <th className="p-1 text-right">الموظف</th>
                          <th className="p-1 text-left">مدين</th>
                          <th className="p-1 text-left">دائن</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cashClosingPreview.line_details.map((line) => (
                          <tr key={line.id} className="border-b border-border/50">
                            <td className="p-1 font-mono">{line.entry_number}</td>
                            <td className="p-1">{line.type_label}</td>
                            <td className="p-1 font-mono">{line.reference}</td>
                            <td className="p-1 max-w-[160px] truncate" title={line.description}>{line.description}</td>
                            <td className="p-1 text-muted-foreground">{line.created_by || "-"}</td>
                            <td className="p-1 font-mono">{line.debit ? fmt(line.debit) : "-"}</td>
                            <td className="p-1 font-mono">{line.credit ? fmt(line.credit) : "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>ملاحظات (اختياري)</Label>
                <Input value={form.notes} onChange={(e) => set("notes")(e.target.value)} />
              </div>

              <Button onClick={handleClose} disabled={isClosingCashRegister}>
                <Icon icon="mdi:lock-outline" className="w-4 h-4 ml-1" />
                {isClosingCashRegister ? "جارٍ الإغلاق..." : "إغلاق الصندوق (تسجيل التقفيل)"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* History / list */}
      <div className="border border-border rounded-lg bg-card">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">سجل التقفيلات</h3>
          <Select
            value={cashClosingFilters.status || "all"}
            onValueChange={(v) => setCashClosingFilters((f) => ({ ...f, status: v === "all" ? undefined : v }))}
          >
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="pending">بانتظار التأكيد</SelectItem>
              <SelectItem value="confirmed">مؤكّد</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="p-2 text-right">التاريخ</th>
                <th className="p-2 text-right">الحساب</th>
                <th className="p-2 text-right">الموظف</th>
                <th className="p-2 text-left">الصافي المحسوب</th>
                <th className="p-2 text-left">المعدود</th>
                <th className="p-2 text-left">الفرق</th>
                <th className="p-2 text-center">الحالة</th>
                <th className="p-2 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {isFetchingCashClosings && (
                <tr><td colSpan={8} className="p-4 text-center text-muted-foreground">جارٍ التحميل...</td></tr>
              )}
              {!isFetchingCashClosings && cashClosings.length === 0 && (
                <tr><td colSpan={8} className="p-4 text-center text-muted-foreground">لا توجد تقفيلات</td></tr>
              )}
              {cashClosings.map((c) => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="p-2">{c.closing_date}</td>
                  <td className="p-2">{c.account?.name}</td>
                  <td className="p-2">{c.employee?.name ?? "الكل"}</td>
                  <td className="p-2 font-mono">{fmt(c.calculated_closing_balance)}</td>
                  <td className="p-2 font-mono">{c.counted_amount != null ? fmt(c.counted_amount) : "-"}</td>
                  <td className={`p-2 font-mono ${c.variance < 0 ? "text-red-700" : c.variance > 0 ? "text-emerald-700" : ""}`}>
                    {c.variance != null ? fmt(c.variance) : "-"}
                  </td>
                  <td className="p-2 text-center">
                    <Badge variant={c.status === "confirmed" ? "default" : "secondary"}>
                      {c.status === "confirmed" ? "مؤكّد" : "بانتظار التأكيد"}
                    </Badge>
                  </td>
                  <td className="p-2">
                    <div className="flex items-center justify-center gap-1">
                      {c.status === "pending" && (
                        <Button size="icon" variant="ghost" className="h-7 w-7" title="تأكيد الاستلام" onClick={() => setConfirmTarget(c)}>
                          <Icon icon="mdi:check-decagram-outline" className="w-4 h-4 text-emerald-700" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="طباعة سند التسليم" onClick={() => printCashClosing(c.id)}>
                        <Icon icon="mdi:printer-outline" className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={Boolean(confirmTarget)} onOpenChange={(v) => !v && setConfirmTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>تأكيد استلام صندوق {confirmTarget?.closing_date}</DialogTitle></DialogHeader>
          <ConfirmClosingForm
            closing={confirmTarget}
            onCancel={() => setConfirmTarget(null)}
            onConfirm={async (amount, notes) => {
              const ok = await confirmCashClosing(confirmTarget.id, amount, notes);
              if (ok) setConfirmTarget(null);
            }}
            isConfirming={isConfirmingCashClosing}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CashClosingTab;
