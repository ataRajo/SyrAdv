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
import EmployeeStatementDialog from "./EmployeeStatementDialog";

const fmt = (n) =>
  Number(n ?? 0).toLocaleString("ar-SY", { minimumFractionDigits: 2 });

const SALARY_TYPE_LABELS = { monthly: "شهري", weekly: "أسبوعي", daily: "يومي" };

const SetSalaryForm = ({ employee, onCancel, onSave, isSaving }) => {
  const [form, setForm] = useState({
    amount: employee?.salary?.amount ?? "",
    salary_type: employee?.salary?.salary_type ?? "monthly",
    effective_from: new Date().toISOString().slice(0, 10),
    notes: "",
  });
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          amount: Number(form.amount),
          salary_type: form.salary_type,
          effective_from: form.effective_from,
          ...(form.notes ? { notes: form.notes } : {}),
        });
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>المبلغ</Label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            value={form.amount}
            onChange={(e) => set("amount")(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>النوع</Label>
          <Select value={form.salary_type} onValueChange={set("salary_type")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">شهري</SelectItem>
              <SelectItem value="weekly">أسبوعي</SelectItem>
              <SelectItem value="daily">يومي</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>ساري من تاريخ</Label>
        <Input
          type="date"
          value={form.effective_from}
          onChange={(e) => set("effective_from")(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>ملاحظات (اختياري)</Label>
        <Input
          value={form.notes}
          onChange={(e) => set("notes")(e.target.value)}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          إلغاء
        </Button>
        <Button type="submit" disabled={isSaving || !form.amount}>
          {isSaving ? "جارٍ الحفظ..." : "حفظ الراتب"}
        </Button>
      </DialogFooter>
    </form>
  );
};

const emptyAdjustment = () => ({ reason: "", amount: "" });

const PaySalaryForm = ({
  employee,
  cashAccounts = [],
  onCancel,
  onPay,
  isPaying,
}) => {
  const [form, setForm] = useState({
    amount: employee?.salary?.amount ?? "",
    exchange_rate: "",
    date: new Date().toISOString().slice(0, 10),
    notes: "",
    cashbox_account_id: "",
  });
  const [bonuses, setBonuses] = useState([]);
  const [deductions, setDeductions] = useState([]);
  // خصم السلفة من الراتب (طلب صريح: تلقائي أو اختياري) - افتراضيًا كامل
  // المتبقي حتى قيمة الراتب، ويمكن إلغاؤه أو تحديد مبلغ جزئي.
  const [deductAdvance, setDeductAdvance] = useState(true);
  const [advanceMode, setAdvanceMode] = useState("all"); // all | custom
  const [advanceAmount, setAdvanceAmount] = useState("");
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const updateAdjustment = (list, setList, index, patch) =>
    setList(
      list.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  const removeAdjustment = (list, setList, index) =>
    setList(list.filter((_, i) => i !== index));

  const bonusesTotal = bonuses.reduce(
    (sum, b) => sum + (Number(b.amount) || 0),
    0,
  );
  const deductionsTotal = deductions.reduce(
    (sum, d) => sum + (Number(d.amount) || 0),
    0,
  );

  // طلب العميل: "عند صرف راتب الموظف أعطني إشارة أنه أخذ سلفة، مع إظهار
  // القيمة المتبقية لراتبه (راتبه 200 أخذ سلفة 100 باقيله 100)" - تقدير حي
  // أثناء تعبئة النموذج، بافتراض عدم تحويل عملة (نفس تحفّظ الباك-إند في
  // PayrollService::listEmployeesWithSalary). القيمة النهائية الدقيقة تُحسب
  // فعليًا فقط لحظة الصرف وتُعرَض في رسالة النجاح (useAccounting.payEmployeeSalary).
  const outstandingAdvance = Number(employee?.outstanding_advance_balance || 0);
  const hasAdvance = outstandingAdvance > 0;
  const grossForPreview =
    (Number(form.amount) || Number(employee?.salary?.amount) || 0) +
    bonusesTotal -
    deductionsTotal;
  const requestedAdvance =
    advanceMode === "custom" ? Math.max(Number(advanceAmount) || 0, 0) : outstandingAdvance;
  const advanceToDeductPreview = deductAdvance
    ? Math.min(outstandingAdvance, requestedAdvance, Math.max(grossForPreview, 0))
    : 0;
  const advanceAfterPreview = Math.max(outstandingAdvance - advanceToDeductPreview, 0);
  const customAdvanceTooHigh =
    deductAdvance && advanceMode === "custom" && Number(advanceAmount) > outstandingAdvance + 0.001;
  const netAfterAdvancePreview = Math.max(
    grossForPreview - advanceToDeductPreview,
    0,
  );

  const renderAdjustmentList = (title, list, setList, addLabel) => (
    <div className="space-y-2 border border-border rounded-md p-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm">{title}</Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setList((l) => [...l, emptyAdjustment()])}
        >
          <Icon icon="mdi:plus" className="w-4 h-4 ml-1" /> {addLabel}
        </Button>
      </div>
      {list.map((item, index) => (
        <div key={index} className="flex gap-2 items-start">
          <Input
            placeholder="السبب"
            className="flex-[2]"
            value={item.reason}
            onChange={(e) =>
              updateAdjustment(list, setList, index, { reason: e.target.value })
            }
          />
          <Input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="المبلغ"
            className="flex-1"
            value={item.amount}
            onChange={(e) =>
              updateAdjustment(list, setList, index, { amount: e.target.value })
            }
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => removeAdjustment(list, setList, index)}
          >
            <Icon
              icon="mdi:trash-can-outline"
              className="w-4 h-4 text-destructive"
            />
          </Button>
        </div>
      ))}
    </div>
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onPay({
          user_id: employee.id,
          ...(form.amount ? { amount: Number(form.amount) } : {}),
          ...(form.exchange_rate
            ? { exchange_rate: Number(form.exchange_rate) }
            : {}),
          ...(form.date ? { date: form.date } : {}),
          ...(form.notes ? { notes: form.notes } : {}),
          ...(form.cashbox_account_id
            ? { cashbox_account_id: Number(form.cashbox_account_id) }
            : {}),
          ...(bonuses.length > 0
            ? {
                bonuses: bonuses.map((b) => ({
                  reason: b.reason,
                  amount: Number(b.amount),
                })),
              }
            : {}),
          ...(deductions.length > 0
            ? {
                deductions: deductions.map((d) => ({
                  reason: d.reason,
                  amount: Number(d.amount),
                })),
              }
            : {}),
          ...(hasAdvance
            ? {
                deduct_advance: deductAdvance,
                ...(deductAdvance && advanceMode === "custom"
                  ? { advance_amount: Number(advanceAmount) || 0 }
                  : {}),
              }
            : {}),
        });
      }}
      className="space-y-4"
    >
      {!employee?.salary && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
          لا يوجد راتب محدد لهذا الموظف - أدخل مبلغًا يدويًا لهذه الدفعة فقط، أو
          حدد راتبه أولاً.
        </p>
      )}

      {/* إشارة السلفة (طلب صريح) - تظهر فقط إن كان لدى هذا الموظف سلفة قائمة
          لم تُسدَّد بعد. تُخصَم تلقائيًا (الأقدم أولًا) من هذا الصرف. */}
      {hasAdvance && (
        <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-300 rounded p-2.5">
          <Icon
            icon="mdi:alert-circle-outline"
            className="w-4 h-4 mt-0.5 shrink-0"
          />
          <div className="space-y-2 flex-1">
            <p className="font-semibold">
              هذا الموظف لديه سلفة سابقة لم تُسدَّد بعد:{" "}
              {fmt(outstandingAdvance)}
            </p>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={deductAdvance}
                onChange={(e) => setDeductAdvance(e.target.checked)}
              />
              خصم السلفة من هذا الراتب
            </label>
            {deductAdvance && (
              <div className="flex flex-wrap items-center gap-3 pr-6">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="advance-mode"
                    checked={advanceMode === "all"}
                    onChange={() => setAdvanceMode("all")}
                  />
                  كامل المتبقي (حتى قيمة الراتب)
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="advance-mode"
                    checked={advanceMode === "custom"}
                    onChange={() => setAdvanceMode("custom")}
                  />
                  مبلغ محدد:
                </label>
                {advanceMode === "custom" && (
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max={outstandingAdvance}
                    className="h-7 w-28 text-xs bg-white"
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(e.target.value)}
                  />
                )}
              </div>
            )}
            {customAdvanceTooHigh && (
              <p className="text-destructive">المبلغ أكبر من المتبقي من السلفة ({fmt(outstandingAdvance)}).</p>
            )}
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="rounded bg-white/70 border border-amber-200 p-1.5">
                <div className="text-[10px] text-muted-foreground">يُخصم من السلفة</div>
                <div className="font-mono font-semibold">{fmt(advanceToDeductPreview)}</div>
              </div>
              <div className="rounded bg-white/70 border border-amber-200 p-1.5">
                <div className="text-[10px] text-muted-foreground">المتبقي من السلفة بعدها</div>
                <div className="font-mono font-semibold">{fmt(advanceAfterPreview)}</div>
              </div>
              <div className="rounded bg-white/70 border border-amber-200 p-1.5">
                <div className="text-[10px] text-muted-foreground">الصافي نقدًا للموظف</div>
                <div className="font-mono font-semibold">{fmt(netAfterAdvancePreview)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-2">
        <Label>الصندوق / البنك (اختياري - الافتراضي: الصندوق - دولار)</Label>
        <Select
          value={form.cashbox_account_id}
          onValueChange={set("cashbox_account_id")}
        >
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
      <div className="space-y-2">
        <Label>
          المبلغ الأساسي (بالدولار دائمًا - مبلغ الراتب المُعرَّف){" "}
          {employee?.salary && "(اتركه فارغًا لاستخدام الراتب المحدد)"}
        </Label>
        <Input
          type="number"
          step="0.01"
          min="0.01"
          placeholder={employee?.salary ? fmt(employee.salary.amount) : ""}
          value={form.amount}
          onChange={(e) => set("amount")(e.target.value)}
        />
      </div>

      {renderAdjustmentList(
        "مكافآت (اختياري)",
        bonuses,
        setBonuses,
        "إضافة مكافأة",
      )}
      {renderAdjustmentList(
        "حسومات / عقوبات / تأخير (اختياري)",
        deductions,
        setDeductions,
        "إضافة حسم",
      )}
      {(bonusesTotal > 0 || deductionsTotal > 0) && (
        <p className="text-sm font-medium">
          الصافي التقديري:{" "}
          {fmt(
            (Number(form.amount) || employee?.salary?.amount || 0) +
              bonusesTotal -
              deductionsTotal,
          )}
        </p>
      )}

      {cashAccounts.find(
        (a) => String(a.id) === String(form.cashbox_account_id),
      )?.currency === "SYP" && (
        <div className="space-y-2">
          <Label>سعر الصرف (كم ليرة = 1 دولار)</Label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="مثال: 15000"
            value={form.exchange_rate}
            onChange={(e) => set("exchange_rate")(e.target.value)}
            required
          />
        </div>
      )}
      <div className="space-y-2">
        <Label>التاريخ</Label>
        <Input
          type="date"
          value={form.date}
          onChange={(e) => set("date")(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>ملاحظات (اختياري)</Label>
        <Input
          value={form.notes}
          onChange={(e) => set("notes")(e.target.value)}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          إلغاء
        </Button>
        <Button
          type="submit"
          disabled={isPaying || customAdvanceTooHigh || (!form.amount && !employee?.salary)}
        >
          {isPaying ? "جارٍ الصرف..." : "صرف الراتب"}
        </Button>
      </DialogFooter>
    </form>
  );
};

const PayrollTab = ({ accounting }) => {
  const {
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
    handleOpenVoucher,
    cashAccounts,
    openEmployeeStatement,
  } = accounting;

  const safePayrollHistory = Array.isArray(payrollHistory)
    ? payrollHistory
    : [];

  const [salaryDialogEmployee, setSalaryDialogEmployee] = useState(null);
  const [payDialogEmployee, setPayDialogEmployee] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [dateFilter, setDateFilter] = useState("");

  const filteredPayrollHistory = dateFilter
    ? safePayrollHistory.filter((entry) => entry.entry_date === dateFilter)
    : safePayrollHistory;

  return (
    <div className="space-y-4">
      <div className="border border-border rounded-lg bg-card">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">الرواتب والأجور</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setShowHistory((v) => !v);
              if (!showHistory) loadPayrollHistory({});
            }}
          >
            <Icon icon="mdi:history" className="w-4 h-4 ml-1" />
            {showHistory ? "إخفاء السجل" : "سجل صرف الرواتب"}
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-center">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="p-2 text-center">الموظف</th>
                <th className="p-2 text-center">القسم</th>
                <th className="p-2 text-center">الراتب المحدد</th>
                <th className="p-2 text-center">النوع</th>
                <th className="p-2 text-center">ساري من</th>
                <th className="p-2 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {isFetchingPayrollEmployees && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-4 text-center text-muted-foreground"
                  >
                    جارٍ التحميل...
                  </td>
                </tr>
              )}
              {!isFetchingPayrollEmployees && payrollEmployees.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-4 text-center text-muted-foreground"
                  >
                    لا يوجد موظفون
                  </td>
                </tr>
              )}
              {payrollEmployees.map((emp) => (
                <tr
                  key={emp.id}
                  className="border-b border-border/50 hover:bg-muted/30"
                >
                  <td className="p-2 text-center">
                    <span className="inline-flex items-center gap-1">
                      {emp.name}
                      {/* شارة السلفة (طلب صريح) - إشارة سريعة قبل حتى فتح نافذة الصرف */}
                      {emp.has_outstanding_advance && (
                        <span
                          className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200"
                          title={`لديه سلفة قائمة: ${fmt(emp.outstanding_advance_balance)}`}
                        >
                          <Icon
                            icon="mdi:hand-coin-outline"
                            className="w-3 h-3"
                          />
                          سلفة {fmt(emp.outstanding_advance_balance)}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="p-2 text-xs text-muted-foreground text-center">
                    {emp.department || "-"}
                  </td>
                  <td className="p-2 font-mono text-center">
                    {emp.salary ? fmt(emp.salary.amount) : "-"}
                  </td>
                  <td className="p-2 text-xs text-center">
                    {emp.salary
                      ? SALARY_TYPE_LABELS[emp.salary.salary_type]
                      : "-"}
                  </td>
                  <td className="p-2 text-xs text-center">
                    {emp.salary?.effective_from ?? "-"}
                  </td>
                  <td className="p-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSalaryDialogEmployee(emp)}
                      >
                        <Icon icon="mdi:pencil" className="w-3.5 h-3.5 ml-1" />
                        تحديد الراتب
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setPayDialogEmployee(emp)}
                      >
                        <Icon
                          icon="mdi:cash-fast"
                          className="w-3.5 h-3.5 ml-1"
                        />
                        صرف راتب
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEmployeeStatement(emp.id)}
                      >
                        <Icon
                          icon="mdi:file-document-outline"
                          className="w-3.5 h-3.5 ml-1"
                        />
                        كشف حساب
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showHistory && (
        <div className="border border-border rounded-lg bg-card">
          <div className="p-4 border-b border-border flex items-center justify-between flex-wrap gap-3">
            <h3 className="font-semibold">سجل صرف الرواتب والأجور</h3>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                className="h-8 w-36"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
              {dateFilter && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8"
                  onClick={() => setDateFilter("")}
                >
                  مسح
                </Button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-center">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="p-2 text-center">التاريخ</th>
                  <th className="p-2 text-center">رقم السند</th>
                  <th className="p-2 text-center">البيان</th>
                  <th className="p-2 text-center">المبلغ</th>
                  <th className="p-2 text-center">طباعة</th>
                </tr>
              </thead>
              <tbody>
                {isFetchingPayrollHistory && (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-4 text-center text-muted-foreground"
                    >
                      جارٍ التحميل...
                    </td>
                  </tr>
                )}
                {!isFetchingPayrollHistory &&
                  filteredPayrollHistory.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-4 text-center text-muted-foreground"
                      >
                        لا يوجد سجل بعد
                      </td>
                    </tr>
                  )}
                {filteredPayrollHistory.map((entry) => {
                  const adjustments = entry.payroll_adjustments ?? [];
                  const adjustmentsTitle = adjustments
                    .map(
                      (a) =>
                        `${a.type === "bonus" ? "+ مكافأة" : "- حسم"}: ${a.reason} (${fmt(a.amount)})`,
                    )
                    .join("\n");
                  return (
                    <tr key={entry.id} className="border-b border-border/50">
                      <td className="p-2 text-xs text-center">
                        {entry.entry_date}
                      </td>
                      <td className="p-2 font-mono text-xs text-center">
                        {entry.voucher_number || entry.entry_number}
                      </td>
                      <td
                        className="p-2 max-w-[260px] truncate text-center"
                        title={entry.description}
                      >
                        {entry.description}
                        {adjustments.length > 0 && (
                          <span
                            className="inline-block mr-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 cursor-help"
                            title={adjustmentsTitle}
                          >
                            {adjustments.length} تعديل
                          </span>
                        )}
                      </td>
                      <td className="p-2 font-mono text-center">
                        {fmt(entry.total_debit)}
                      </td>
                      <td className="p-2 text-center">
                        {entry.voucher_number && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => handleOpenVoucher(entry.id)}
                          >
                            <Icon
                              icon="mdi:printer-outline"
                              className="w-4 h-4"
                            />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {payrollHistoryMeta?.total_pages > 1 && (
            <div className="flex items-center justify-center gap-2 p-3 border-t border-border">
              <Button
                size="sm"
                variant="outline"
                disabled={payrollHistoryMeta.current_page <= 1}
                onClick={() =>
                  loadPayrollHistory({
                    page: (payrollHistoryMeta.current_page || 1) - 1,
                  })
                }
              >
                السابق
              </Button>
              <span className="text-sm text-muted-foreground">
                صفحة {payrollHistoryMeta.current_page} من{" "}
                {payrollHistoryMeta.total_pages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={
                  payrollHistoryMeta.current_page >=
                  payrollHistoryMeta.total_pages
                }
                onClick={() =>
                  loadPayrollHistory({
                    page: (payrollHistoryMeta.current_page || 1) + 1,
                  })
                }
              >
                التالي
              </Button>
            </div>
          )}
        </div>
      )}

      <Dialog
        open={Boolean(salaryDialogEmployee)}
        onOpenChange={(v) => !v && setSalaryDialogEmployee(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تحديد راتب {salaryDialogEmployee?.name}</DialogTitle>
          </DialogHeader>
          <SetSalaryForm
            employee={salaryDialogEmployee}
            onCancel={() => setSalaryDialogEmployee(null)}
            onSave={async (data) => {
              const ok = await setEmployeeSalary(salaryDialogEmployee.id, data);
              if (ok) setSalaryDialogEmployee(null);
            }}
            isSaving={isSavingSalary}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(payDialogEmployee)}
        onOpenChange={(v) => !v && setPayDialogEmployee(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>صرف راتب {payDialogEmployee?.name}</DialogTitle>
          </DialogHeader>
          <PaySalaryForm
            employee={payDialogEmployee}
            cashAccounts={cashAccounts}
            onCancel={() => setPayDialogEmployee(null)}
            onPay={async (data) => {
              const ok = await payEmployeeSalary(data);
              if (ok) setPayDialogEmployee(null);
            }}
            isPaying={isPayingSalary}
          />
        </DialogContent>
      </Dialog>

      <EmployeeStatementDialog accounting={accounting} />
    </div>
  );
};

export default PayrollTab;
