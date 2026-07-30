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

const fmt = (n) => Number(n ?? 0).toLocaleString("ar-SY", { minimumFractionDigits: 2 });

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
          <Input type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => set("amount")(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>النوع</Label>
          <Select value={form.salary_type} onValueChange={set("salary_type")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
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
        <Input type="date" value={form.effective_from} onChange={(e) => set("effective_from")(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>ملاحظات (اختياري)</Label>
        <Input value={form.notes} onChange={(e) => set("notes")(e.target.value)} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>إلغاء</Button>
        <Button type="submit" disabled={isSaving || !form.amount}>
          {isSaving ? "جارٍ الحفظ..." : "حفظ الراتب"}
        </Button>
      </DialogFooter>
    </form>
  );
};

const PaySalaryForm = ({ employee, onCancel, onPay, isPaying }) => {
  const [form, setForm] = useState({
    amount: employee?.salary?.amount ?? "",
    date: new Date().toISOString().slice(0, 10),
    notes: "",
  });
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onPay({
          user_id: employee.id,
          ...(form.amount ? { amount: Number(form.amount) } : {}),
          ...(form.date ? { date: form.date } : {}),
          ...(form.notes ? { notes: form.notes } : {}),
        });
      }}
      className="space-y-4"
    >
      {!employee?.salary && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
          لا يوجد راتب محدد لهذا الموظف - أدخل مبلغًا يدويًا لهذه الدفعة فقط، أو حدد راتبه أولاً.
        </p>
      )}
      <div className="space-y-2">
        <Label>المبلغ {employee?.salary && "(اتركه فارغًا لاستخدام الراتب المحدد)"}</Label>
        <Input
          type="number"
          step="0.01"
          min="0.01"
          placeholder={employee?.salary ? fmt(employee.salary.amount) : ""}
          value={form.amount}
          onChange={(e) => set("amount")(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>التاريخ</Label>
        <Input type="date" value={form.date} onChange={(e) => set("date")(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>ملاحظات (اختياري)</Label>
        <Input value={form.notes} onChange={(e) => set("notes")(e.target.value)} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>إلغاء</Button>
        <Button type="submit" disabled={isPaying || (!form.amount && !employee?.salary)}>
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
    isFetchingPayrollHistory,
    loadPayrollHistory,
    handleOpenVoucher,
  } = accounting;

  const safePayrollHistory = Array.isArray(payrollHistory) ? payrollHistory : [];


  const [salaryDialogEmployee, setSalaryDialogEmployee] = useState(null);
  const [payDialogEmployee, setPayDialogEmployee] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

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
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="p-2 text-right">الموظف</th>
                <th className="p-2 text-right">القسم</th>
                <th className="p-2 text-right">الراتب المحدد</th>
                <th className="p-2 text-right">النوع</th>
                <th className="p-2 text-right">ساري من</th>
                <th className="p-2 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {isFetchingPayrollEmployees && (
                <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">جارٍ التحميل...</td></tr>
              )}
              {!isFetchingPayrollEmployees && payrollEmployees.length === 0 && (
                <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">لا يوجد موظفون</td></tr>
              )}
              {payrollEmployees.map((emp) => (
                <tr key={emp.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="p-2">{emp.name}</td>
                  <td className="p-2 text-xs text-muted-foreground">{emp.department || "-"}</td>
                  <td className="p-2 font-mono">{emp.salary ? fmt(emp.salary.amount) : "-"}</td>
                  <td className="p-2 text-xs">{emp.salary ? SALARY_TYPE_LABELS[emp.salary.salary_type] : "-"}</td>
                  <td className="p-2 text-xs">{emp.salary?.effective_from ?? "-"}</td>
                  <td className="p-2">
                    <div className="flex items-center justify-center gap-1">
                      <Button size="sm" variant="outline" onClick={() => setSalaryDialogEmployee(emp)}>
                        <Icon icon="mdi:pencil" className="w-3.5 h-3.5 ml-1" />
                        تحديد الراتب
                      </Button>
                      <Button size="sm" onClick={() => setPayDialogEmployee(emp)}>
                        <Icon icon="mdi:cash-fast" className="w-3.5 h-3.5 ml-1" />
                        صرف راتب
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
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold">سجل صرف الرواتب والأجور</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="p-2 text-right">التاريخ</th>
                  <th className="p-2 text-right">رقم السند</th>
                  <th className="p-2 text-right">البيان</th>
                  <th className="p-2 text-left">المبلغ</th>
                  <th className="p-2 text-center">طباعة</th>
                </tr>
              </thead>
              <tbody>
                

{isFetchingPayrollHistory && (
    <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">جارٍ التحميل...</td></tr>
  )}
  {!isFetchingPayrollHistory && safePayrollHistory.length === 0 && (
    <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">لا يوجد سجل بعد</td></tr>
  )}
  {safePayrollHistory.map((entry) => (
    <tr key={entry.id} className="border-b border-border/50">
      <td className="p-2 text-xs">{entry.entry_date}</td>
      <td className="p-2 font-mono text-xs">{entry.voucher_number || entry.entry_number}</td>
      <td className="p-2 max-w-[260px] truncate" title={entry.description}>{entry.description}</td>
      <td className="p-2 font-mono">{fmt(entry.total_debit)}</td>
      <td className="p-2 text-center">
        {entry.voucher_number && (
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleOpenVoucher(entry.id)}>
            <Icon icon="mdi:printer-outline" className="w-4 h-4" />
          </Button>
        )}
      </td>
    </tr>
  ))}

              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={Boolean(salaryDialogEmployee)} onOpenChange={(v) => !v && setSalaryDialogEmployee(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>تحديد راتب {salaryDialogEmployee?.name}</DialogTitle></DialogHeader>
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

      <Dialog open={Boolean(payDialogEmployee)} onOpenChange={(v) => !v && setPayDialogEmployee(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>صرف راتب {payDialogEmployee?.name}</DialogTitle></DialogHeader>
          <PaySalaryForm
            employee={payDialogEmployee}
            onCancel={() => setPayDialogEmployee(null)}
            onPay={async (data) => {
              const ok = await payEmployeeSalary(data);
              if (ok) setPayDialogEmployee(null);
            }}
            isPaying={isPayingSalary}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PayrollTab;
