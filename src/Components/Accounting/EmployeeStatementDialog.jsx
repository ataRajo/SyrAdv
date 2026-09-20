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

const SALARY_TYPE_LABELS = { monthly: "شهري", weekly: "أسبوعي", daily: "يومي" };

/**
 * كل نوع حركة في الـ timeline له أيقونة ولون مميّز، ليسهل على المستخدم
 * تمييز حركات "له" (مكافأة/سلفة ممنوحة) عن حركات "عليه" (خصم/دفعة راتب
 * تُطفئ رصيد السلفة) بنظرة سريعة، دون قراءة كل سطر بالتفصيل.
 */
const ENTRY_META = {
  salary_definition: { icon: "mdi:file-document-edit-outline", color: "text-sky-700 bg-sky-50 border-sky-200" },
  salary_payment: { icon: "mdi:cash-fast", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  bonus: { icon: "mdi:gift-outline", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  deduction: { icon: "mdi:minus-circle-outline", color: "text-red-700 bg-red-50 border-red-200" },
  advance_given: { icon: "mdi:hand-coin-outline", color: "text-amber-700 bg-amber-50 border-amber-200" },
  advance_deduction: { icon: "mdi:cash-minus", color: "text-amber-700 bg-amber-50 border-amber-200" },
  // سند قبض - تحصيل سلفة يدويًا (مثال العميل: عند استقالة الموظف) - راجع
  // EmployeeAdvanceService::settleOutstanding(). لون مختلف عمدًا عن
  // advance_deduction (خصم تلقائي ضمن الراتب) لتمييز الحركتين بنظرة سريعة.
  advance_settlement: { icon: "mdi:cash-check", color: "text-blue-700 bg-blue-50 border-blue-200" },
};

const SummaryCard = ({ label, value, sub, tone = "" }) => (
  <div className={`rounded-lg border border-border p-3 bg-card ${tone}`}>
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    <p className="font-mono font-semibold">{value}</p>
    {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
  </div>
);

/**
 * كشف حساب موظف موحَّد (المطلب الرابع) - راتب معرَّف + سلف على الراتب +
 * مكافآت + خصومات، بتفاصيل كاملة وتواريخ دقيقة، في timeline واحد بدل
 * الاضطرار للتنقل بين تبويبتَي "الرواتب" و"السلف" لتكوين صورة كاملة.
 *
 * يُفتَح من زر "كشف حساب" بجانب كل موظف في PayrollTab، ويعتمد على
 * GET /accounting/employees/{userId}/statement (EmployeeStatementService).
 */
const EmployeeStatementDialog = ({ accounting }) => {
  const {
    statementEmployeeId,
    closeEmployeeStatement,
    employeeStatement,
    isFetchingEmployeeStatement,
    loadEmployeeStatement,
  } = accounting;

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const open = Boolean(statementEmployeeId);

  // تصفير حقول الفلترة المحلية في كل مرة يُفتح فيها الكشف لموظف جديد -
  // openEmployeeStatement() على مستوى الـ hook يجلب النطاق الافتراضي
  // (آخر 12 شهرًا) دون فلاتر، فيجب أن تعكس الحقول ذلك بصريًا أيضًا.
  useEffect(() => {
    if (open) {
      setFromDate("");
      setToDate("");
    }
  }, [open, statementEmployeeId]);

  const applyFilters = () => {
    loadEmployeeStatement({
      ...(fromDate ? { from_date: fromDate } : {}),
      ...(toDate ? { to_date: toDate } : {}),
    });
  };

  const clearFilters = () => {
    setFromDate("");
    setToDate("");
    loadEmployeeStatement({});
  };

  const summary = employeeStatement?.summary;
  const entries = Array.isArray(employeeStatement?.entries) ? employeeStatement.entries : [];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && closeEmployeeStatement()}>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            كشف حساب {employeeStatement?.employee?.name ? `- ${employeeStatement.employee.name}` : ""}
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
          {employeeStatement?.from_date && employeeStatement?.to_date && (
            <span className="text-xs text-muted-foreground mr-auto">
              الفترة المعروضة: {employeeStatement.from_date} إلى {employeeStatement.to_date}
            </span>
          )}
        </div>

        {isFetchingEmployeeStatement && !employeeStatement && (
          <p className="p-6 text-center text-muted-foreground">جارٍ التحميل...</p>
        )}

        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryCard
              label="الراتب الحالي"
              value={summary.current_salary ? fmt(summary.current_salary.amount) : "-"}
              sub={summary.current_salary ? `${SALARY_TYPE_LABELS[summary.current_salary.salary_type] || summary.current_salary.salary_type} - ساري من ${summary.current_salary.effective_from}` : "لا يوجد راتب محدد"}
            />
            <SummaryCard
              label="رصيد السلفة القائم"
              value={fmt(summary.outstanding_advance_balance)}
              tone={summary.outstanding_advance_balance > 0 ? "border-amber-200" : ""}
            />
            <SummaryCard label="إجمالي الصافي المصروف" value={fmt(summary.total_paid_net)} />
            <SummaryCard label="إجمالي المكافآت" value={fmt(summary.total_bonuses)} />
            <SummaryCard label="إجمالي الخصومات" value={fmt(summary.total_deductions)} />
            <SummaryCard label="إجمالي السلف الممنوحة" value={fmt(summary.total_advances_given)} />
            <SummaryCard label="إجمالي المسدَّد من السلف" value={fmt(summary.total_advances_repaid)} />
          </div>
        )}

        <div className="space-y-2">
          <h4 className="font-semibold text-sm">الحركات ({entries.length})</h4>
          {!isFetchingEmployeeStatement && entries.length === 0 && (
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
                      <p className="font-medium text-sm">{entry.title}</p>
                      <p className="text-xs text-muted-foreground shrink-0">{entry.date}</p>
                    </div>
                    {entry.details && (
                      <p className="text-xs text-muted-foreground mt-0.5 break-words">{entry.details}</p>
                    )}
                    {entry.type === "salary_payment" && (entry.bonus_total > 0 || entry.deduction_total > 0) && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {entry.bonus_total > 0 && `+ مكافآت: ${fmt(entry.bonus_total)} `}
                        {entry.deduction_total > 0 && `- خصومات: ${fmt(entry.deduction_total)}`}
                      </p>
                    )}
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

export default EmployeeStatementDialog;
