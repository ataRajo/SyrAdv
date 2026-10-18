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
import toast from "react-hot-toast";
import { useAuth } from "../../Context/AuthProvider";
import HardDeleteDialog from "./HardDeleteDialog";
import {
  useUpdateEmployeeAdvanceMutation,
  useUpdateSupplierAdvanceMutation,
  useLazyPreviewDeleteEmployeeAdvanceQuery,
  useDeleteEmployeeAdvanceMutation,
  useLazyPreviewDeleteSupplierAdvanceQuery,
  useDeleteSupplierAdvanceMutation,
} from "../../RtkQuery/Slice/Accounting/AccountingApi";

const fmt = (n) =>
  new Intl.NumberFormat("ar-SY", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    Number(n || 0)
  );

/**
 * نموذج مشترك لمنح سلفة - يُستخدَم لكل من الموظف والمورد، الفرق فقط في
 * قائمة الخيارات (موظفون مقابل موردون) والحقل الذي يُرسَل (userId/supplierId).
 */
const GiveAdvanceForm = ({
  entities,
  entityLabel,
  cashboxAccounts,
  onCancel,
  onSave,
  isSaving,
}) => {
  const [form, setForm] = useState({ entityId: "", amount: "", notes: "", cashbox_account_id: "" });
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          entityId: Number(form.entityId),
          amount: Number(form.amount),
          ...(form.notes ? { notes: form.notes } : {}),
          ...(form.cashbox_account_id
            ? { cashbox_account_id: Number(form.cashbox_account_id) }
            : {}),
        });
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label>{entityLabel}</Label>
        <Select value={form.entityId} onValueChange={set("entityId")}>
          <SelectTrigger>
            <SelectValue placeholder={`اختر ${entityLabel}`} />
          </SelectTrigger>
          <SelectContent>
            {(entities ?? []).map((e) => (
              <SelectItem key={e.id} value={String(e.id)}>
                {e.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
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
        <Label>الصندوق الذي صُرفت منه (اختياري - الصندوق الافتراضي إن لم يُحدَّد)</Label>
        <Select value={form.cashbox_account_id} onValueChange={set("cashbox_account_id")}>
          <SelectTrigger>
            <SelectValue placeholder="اختر صندوقًا" />
          </SelectTrigger>
          <SelectContent>
            {(cashboxAccounts ?? []).map((a) => (
              <SelectItem key={a.id} value={String(a.id)}>
                {a.path || `${a.code} - ${a.name}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>ملاحظات (اختياري)</Label>
        <Input value={form.notes} onChange={(e) => set("notes")(e.target.value)} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          إلغاء
        </Button>
        <Button type="submit" disabled={isSaving || !form.entityId || !form.amount}>
          {isSaving ? "جارٍ الحفظ..." : "منح السلفة"}
        </Button>
      </DialogFooter>
    </form>
  );
};

/**
 * نموذج تحصيل/تسوية سلفة مستحقة (سند قبض) - مشترك للموظف والمورد. طلب
 * صريح من العميل: موظف عليه سلفة لم يسدِّدها بعد ويريد الاستقالة - في
 * هذه الحالة يُنشأ سند قبض بقيمة السلفة (كاملة أو جزء منها) من الموظف
 * إلى الصندوق. المبلغ مُعبَّأ افتراضيًا بكامل الرصيد المتبقي (هذا بالضبط
 * ما تحتاجه حالة الاستقالة: "سدِّد كل ما هو مستحق عليه الآن") ولا يمكن
 * أبدًا تجاوزه - "الموازنة الدقيقة" التي طلبها العميل صراحةً.
 */
const SettleAdvanceForm = ({ entityName, outstandingBalance, cashboxAccounts, onCancel, onSave, isSaving }) => {
  const [form, setForm] = useState({
    amount: String(outstandingBalance ?? 0),
    notes: "",
    cashbox_account_id: "",
  });
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const amountNumber = Number(form.amount || 0);
  const exceedsOutstanding = amountNumber > Number(outstandingBalance ?? 0) + 0.01;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          amount: amountNumber,
          ...(form.notes ? { notes: form.notes } : {}),
          ...(form.cashbox_account_id ? { cashbox_account_id: Number(form.cashbox_account_id) } : {}),
        });
      }}
      className="space-y-4"
    >
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <p>
          <span className="font-semibold">{entityName}</span> عليه حاليًا رصيد سلفة مستحق قدره{" "}
          <span className="font-mono font-semibold">{fmt(outstandingBalance)}</span> — سيُنشأ سند قبض بالمبلغ
          المُدخَل أدناه من هذا الرصيد إلى الصندوق.
        </p>
      </div>
      <div className="space-y-2">
        <Label>المبلغ المُحصَّل</Label>
        <Input
          type="number"
          step="0.01"
          min="0.01"
          max={outstandingBalance}
          value={form.amount}
          onChange={(e) => set("amount")(e.target.value)}
          required
        />
        {exceedsOutstanding && (
          <p className="text-xs text-destructive">
            لا يمكن تحصيل أكثر من الرصيد المستحق ({fmt(outstandingBalance)}).
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label>الصندوق المُستلِم (اختياري - الصندوق الافتراضي إن لم يُحدَّد)</Label>
        <Select value={form.cashbox_account_id} onValueChange={set("cashbox_account_id")}>
          <SelectTrigger>
            <SelectValue placeholder="اختر صندوقًا" />
          </SelectTrigger>
          <SelectContent>
            {(cashboxAccounts ?? []).map((a) => (
              <SelectItem key={a.id} value={String(a.id)}>
                {a.path || `${a.code} - ${a.name}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>سبب/ملاحظات (اختياري - مثال: "تسوية عند إنهاء الخدمة")</Label>
        <Input value={form.notes} onChange={(e) => set("notes")(e.target.value)} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          إلغاء
        </Button>
        <Button
          type="submit"
          disabled={isSaving || !form.amount || amountNumber <= 0 || exceedsOutstanding}
        >
          {isSaving ? "جارٍ التحصيل..." : "تسجيل سند القبض"}
        </Button>
      </DialogFooter>
    </form>
  );
};

/**
 * تعديل سلفة: الملاحظات دائمًا، والمبلغ فقط إن لم تُخصم منها أي دفعة ولم تُلغَ
 * (الخادم يعكس سند المنح القديم ويُنشئ سندًا جديدًا بالمبلغ الجديد).
 */
const EditAdvanceDialog = ({ target, onClose }) => {
  const { row, kind } = target || {};
  const [amount, setAmount] = useState(String(row?.amount ?? ""));
  const [notes, setNotes] = useState(row?.notes || "");
  const [updateEmployee, { isLoading: l1 }] = useUpdateEmployeeAdvanceMutation();
  const [updateSupplier, { isLoading: l2 }] = useUpdateSupplierAdvanceMutation();
  const amountLocked = Boolean(row?.is_cancelled) || Number(row?.deducted_total || 0) > 0;

  const submit = async (e) => {
    e.preventDefault();
    const body = { id: row.id, notes };
    if (!amountLocked && Number(amount) !== Number(row.amount)) body.amount = Number(amount);
    try {
      await (kind === "employee" ? updateEmployee : updateSupplier)(body).unwrap();
      toast.success("تم تعديل السلفة");
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || "فشل تعديل السلفة");
    }
  };

  return (
    <Dialog open={Boolean(row)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>تعديل السلفة</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>المبلغ</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              disabled={amountLocked}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            {amountLocked ? (
              <p className="text-xs text-muted-foreground">
                لا يمكن تغيير المبلغ لسلفة ملغاة أو خُصم منها شيء.
              </p>
            ) : (
              <p className="text-xs text-amber-700">
                تغيير المبلغ يعكس سند المنح القديم وينشئ سند منح جديدًا (الدفتر لا يُعدَّل مباشرة).
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
            <Button type="submit" disabled={l1 || l2}>{l1 || l2 ? "جارٍ الحفظ..." : "حفظ"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const DEDUCTION_TYPE_LABELS = {
  salary: "خصم من راتب",
  purchase: "خصم من فاتورة شراء",
  settlement: "تحصيل نقدي",
};

const entryStatusBadge = (status) =>
  status === "pending" ? (
    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">
      بانتظار التوثيق/الترحيل
    </span>
  ) : null;

/**
 * سجل السلف: الأصلي، المخصوم (من راتب/فاتورة/تحصيل)، المتبقي الفعلي، والحالة -
 * مع تفصيل كل خصم (متى وكم ومن أي قيد/فاتورة). المتبقي = الأصلي - المخصوم،
 * ويعود تلقائيًا عند عكس/إلغاء قيد الراتب أو حذف الفاتورة (راجع الباك-إند).
 */
const AdvancesHistoryTable = ({ rows, isFetching, nameKey, emptyLabel, onSettle, isSettleLoading, onEdit, onDelete }) => {
  const [expandedId, setExpandedId] = useState(null);
  const colSpan = 8;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-center min-w-[760px]">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="p-2 text-center">الاسم</th>
            <th className="p-2 text-center">المبلغ الأصلي</th>
            <th className="p-2 text-center">المخصوم</th>
            <th className="p-2 text-center">المتبقي</th>
            <th className="p-2 text-center">الحالة</th>
            <th className="p-2 text-center">ملاحظات</th>
            <th className="p-2 text-center">التاريخ</th>
            <th className="p-2 text-center">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {isFetching && (
            <tr>
              <td colSpan={colSpan} className="p-4 text-center text-muted-foreground">
                جارٍ التحميل...
              </td>
            </tr>
          )}
          {!isFetching && (rows ?? []).length === 0 && (
            <tr>
              <td colSpan={colSpan} className="p-4 text-center text-muted-foreground">
                {emptyLabel}
              </td>
            </tr>
          )}
          {(rows ?? []).map((r) => {
            const remaining = Number(r.remaining_balance || 0);
            const deductions = Array.isArray(r.deductions) ? r.deductions : [];
            const isOpen = expandedId === r.id;
            return (
              <React.Fragment key={r.id}>
                <tr className={`border-b border-border/50 hover:bg-muted/30 ${r.is_cancelled ? "opacity-60" : ""}`}>
                  <td className="p-2 text-center">{r[nameKey] || "-"}</td>
                  <td className="p-2 font-mono text-center">{fmt(r.amount)}</td>
                  <td className="p-2 font-mono text-center">
                    {Number(r.deducted_total) > 0 ? (
                      <button
                        type="button"
                        className="underline decoration-dotted text-primary"
                        onClick={() => setExpandedId(isOpen ? null : r.id)}
                        title="عرض تفاصيل الخصم"
                      >
                        {fmt(r.deducted_total)} ({deductions.length})
                      </button>
                    ) : (
                      <span className="text-muted-foreground">{fmt(0)}</span>
                    )}
                  </td>
                  <td
                    className={`p-2 font-mono text-center ${
                      remaining > 0 && !r.is_cancelled ? "text-amber-600 font-semibold" : "text-muted-foreground"
                    }`}
                  >
                    {fmt(remaining)}
                  </td>
                  <td className="p-2 text-center">
                    <div className="flex flex-col items-center gap-1">
                      {r.is_cancelled ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          ملغاة (عُكس سند المنح)
                        </span>
                      ) : remaining <= 0 ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 border border-green-200">
                          مسدَّدة بالكامل
                        </span>
                      ) : Number(r.deducted_total) > 0 ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200">
                          مسدَّدة جزئيًا
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                          قائمة
                        </span>
                      )}
                      {!r.is_cancelled && entryStatusBadge(r.given_entry_status)}
                    </div>
                  </td>
                  <td className="p-2 text-xs text-muted-foreground text-center">{r.notes || "-"}</td>
                  <td className="p-2 text-xs text-center">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString("ar-SY") : "-"}
                  </td>
                  <td className="p-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                    {onEdit && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="تعديل" onClick={() => onEdit(r)}>
                        <Icon icon="mdi:pencil-outline" className="w-4 h-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="حذف نهائي (بيانات تجريبية)"
                        onClick={() => onDelete(r)}
                      >
                        <Icon icon="mdi:trash-can-outline" className="w-4 h-4" />
                      </Button>
                    )}
                    {remaining > 0 && !r.is_cancelled && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        disabled={isSettleLoading}
                        onClick={() => onSettle(r)}
                      >
                        <Icon icon="mdi:cash-check" className="w-3.5 h-3.5 ml-1" />
                        تحصيل / تسوية
                      </Button>
                    )}
                    </div>
                  </td>
                </tr>
                {isOpen && deductions.length > 0 && (
                  <tr className="bg-muted/20 border-b border-border/50">
                    <td colSpan={colSpan} className="p-3">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-muted-foreground">
                            <th className="p-1 text-right">التاريخ</th>
                            <th className="p-1 text-right">النوع</th>
                            <th className="p-1 text-right">القيد / الفاتورة</th>
                            <th className="p-1 text-right">البيان</th>
                            <th className="p-1 text-left">المبلغ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deductions.map((d) => (
                            <tr key={d.id} className="border-t border-border/40">
                              <td className="p-1 text-right">{d.date || "-"}</td>
                              <td className="p-1 text-right">{DEDUCTION_TYPE_LABELS[d.type] || d.type}</td>
                              <td className="p-1 text-right">
                                {d.entry_number || (d.journal_entry_id ? `#${d.journal_entry_id}` : "-")}
                                {d.purchase_invoice_number ? ` · فاتورة ${d.purchase_invoice_number}` : ""}{" "}
                                {entryStatusBadge(d.entry_status)}
                              </td>
                              <td className="p-1 text-right text-muted-foreground">{d.description || "-"}</td>
                              <td className="p-1 text-left font-mono">{fmt(d.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/**
 * سلف الموظفين والموردين - كل سلفة تُخصَم تلقائيًا (FIFO) من أول راتب/فاتورة
 * شراء لاحقة على الباك-إند (EmployeeAdvanceService/SupplierAdvanceService)،
 * أو يمكن تحصيلها/تسويتها يدويًا في أي وقت عبر زر "تحصيل / تسوية" - طلب
 * صريح من العميل: موظف/مورد عليه سلفة لم تُسدَّد بعد (مثال: موظف يستقيل)،
 * فيُنشأ سند قبض بقيمتها. عمود "المتبقي" هو المؤشر العملي: صفر يعني
 * سُدِّدت بالكامل.
 *
 * ملاحظة: قد يملك موظف/مورد واحد أكثر من سلفة (عدة صفوف)؛ التسوية تعمل
 * دائمًا على إجمالي ما هو مستحق عليه (عبر كل سلفه، FIFO) لا سلفة واحدة
 * بعينها - فيُجلب الرصيد الإجمالي الحي من الخادم (getEmployeeAdvanceBalance/
 * getSupplierAdvanceBalance) عند فتح حوار التسوية، لا من عمود "المتبقي"
 * لصف واحد فقط، حتى يبقى الحد الأقصى المعروض دقيقًا دائمًا.
 */
const AdvancesTab = ({ accounting }) => {
  const {
    payrollEmployees,
    suppliers,
    selectableAccounts,
    employeeAdvances,
    employeeAdvancesTotalOutstanding,
    isFetchingEmployeeAdvances,
    giveEmployeeAdvance,
    isGivingEmployeeAdvance,
    getEmployeeAdvanceBalance,
    settleEmployeeAdvance,
    isSettlingEmployeeAdvance,
    supplierAdvances,
    supplierAdvancesTotalOutstanding,
    isFetchingSupplierAdvances,
    giveSupplierAdvance,
    isGivingSupplierAdvance,
    getSupplierAdvanceBalance,
    settleSupplierAdvance,
    isSettlingSupplierAdvance,
  } = accounting;

  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [settleEmployeeTarget, setSettleEmployeeTarget] = useState(null); // { id, name, outstanding }
  const [settleSupplierTarget, setSettleSupplierTarget] = useState(null);
  const [isLoadingSettleTarget, setIsLoadingSettleTarget] = useState(false);
  const { hasRole, hasPermission } = useAuth();
  const isSuper = hasRole("super admin");
  const canEdit = isSuper || hasPermission("edit-financials");
  const canHardDelete = isSuper || hasPermission("delete-financials");
  const [editTarget, setEditTarget] = useState(null); // { kind, row }
  const [deleteTarget, setDeleteTarget] = useState(null); // { kind, row }

  const cashboxAccounts = (selectableAccounts ?? []).filter((a) => a.is_cash_account);
  const employeeOptions = (payrollEmployees ?? []).map((e) => ({ id: e.id, name: e.name }));
  const supplierOptions = (suppliers ?? []).map((s) => ({ id: s.id, name: s.name }));

  const employeeRows = (employeeAdvances ?? []).map((a) => ({ ...a, employee_name: a.user_name }));
  const supplierRows = (supplierAdvances ?? []).map((a) => ({ ...a, entity_name: a.supplier_name }));

  // طلب صريح: "اظهار متبقي السلف" - إجمالي مباشر أعلى كل قائمة، بدل
  // الاضطرار لجمع عمود "المتبقي" يدويًا سطرًا سطرًا. مجموع بسيط لكل الصفحة
  // الحالية المحمَّلة فعليًا (نفس بيانات الجدول أسفله تمامًا، بلا استعلام
  // إضافي).
  // الإجمالي من الخادم (كل الصفحات، بلا الملغاة) - وإلا مجموع الصفحة المعروضة.
  const pageRemaining = (rows) =>
    rows.reduce((sum, r) => sum + (r.is_cancelled ? 0 : Number(r.remaining_balance || 0)), 0);
  const totalEmployeeRemaining = employeeAdvancesTotalOutstanding ?? pageRemaining(employeeRows);
  const totalSupplierRemaining = supplierAdvancesTotalOutstanding ?? pageRemaining(supplierRows);

  const openSettleEmployee = async (row) => {
    setIsLoadingSettleTarget(true);
    const balance = await getEmployeeAdvanceBalance(row.user_id);
    setIsLoadingSettleTarget(false);
    if (!balance) return;
    setSettleEmployeeTarget({
      id: row.user_id,
      name: row.employee_name,
      outstanding: balance.outstanding_balance,
    });
  };

  const openSettleSupplier = async (row) => {
    setIsLoadingSettleTarget(true);
    const balance = await getSupplierAdvanceBalance(row.supplier_id);
    setIsLoadingSettleTarget(false);
    if (!balance) return;
    setSettleSupplierTarget({
      id: row.supplier_id,
      name: row.entity_name,
      outstanding: balance.outstanding_balance,
    });
  };

  return (
    <div className="space-y-4">
      <div className="border border-border rounded-lg bg-card">
        <div className="flex items-center justify-between p-4 border-b border-border flex-wrap gap-2">
          <h3 className="font-semibold">سلف الموظفين</h3>
          <div className="flex items-center gap-3">
            {totalEmployeeRemaining > 0 && (
              <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 font-mono">
                إجمالي المتبقي: {fmt(totalEmployeeRemaining)}
              </span>
            )}
            <Button size="sm" onClick={() => setEmployeeDialogOpen(true)}>
              <Icon icon="mdi:hand-coin-outline" className="w-4 h-4 ml-1" />
              منح سلفة موظف
            </Button>
          </div>
        </div>
        <AdvancesHistoryTable
          rows={employeeRows}
          isFetching={isFetchingEmployeeAdvances}
          nameKey="employee_name"
          emptyLabel="لا يوجد سلف موظفين بعد"
          onSettle={openSettleEmployee}
          isSettleLoading={isLoadingSettleTarget}
          onEdit={canEdit ? (row) => setEditTarget({ kind: "employee", row }) : undefined}
          onDelete={canHardDelete ? (row) => setDeleteTarget({ kind: "employee", row }) : undefined}
        />
      </div>

      <div className="border border-border rounded-lg bg-card">
        <div className="flex items-center justify-between p-4 border-b border-border flex-wrap gap-2">
          <h3 className="font-semibold">سلف الموردين</h3>
          <div className="flex items-center gap-3">
            {totalSupplierRemaining > 0 && (
              <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 font-mono">
                إجمالي المتبقي: {fmt(totalSupplierRemaining)}
              </span>
            )}
            <Button size="sm" onClick={() => setSupplierDialogOpen(true)}>
              <Icon icon="mdi:truck-fast-outline" className="w-4 h-4 ml-1" />
              منح سلفة مورد
            </Button>
          </div>
        </div>
        <AdvancesHistoryTable
          rows={supplierRows}
          isFetching={isFetchingSupplierAdvances}
          nameKey="entity_name"
          emptyLabel="لا يوجد سلف موردين بعد"
          onSettle={openSettleSupplier}
          isSettleLoading={isLoadingSettleTarget}
          onEdit={canEdit ? (row) => setEditTarget({ kind: "supplier", row }) : undefined}
          onDelete={canHardDelete ? (row) => setDeleteTarget({ kind: "supplier", row }) : undefined}
        />
      </div>

      {editTarget && (
        <EditAdvanceDialog key={`${editTarget.kind}-${editTarget.row.id}`} target={editTarget} onClose={() => setEditTarget(null)} />
      )}

      <HardDeleteDialog
        open={deleteTarget?.kind === "employee"}
        onClose={() => setDeleteTarget(null)}
        id={deleteTarget?.row?.id}
        title="حذف نهائي - سلفة موظف"
        usePreviewLazy={useLazyPreviewDeleteEmployeeAdvanceQuery}
        useDelete={useDeleteEmployeeAdvanceMutation}
      />
      <HardDeleteDialog
        open={deleteTarget?.kind === "supplier"}
        onClose={() => setDeleteTarget(null)}
        id={deleteTarget?.row?.id}
        title="حذف نهائي - سلفة مورد"
        usePreviewLazy={useLazyPreviewDeleteSupplierAdvanceQuery}
        useDelete={useDeleteSupplierAdvanceMutation}
      />

      <Dialog open={employeeDialogOpen} onOpenChange={setEmployeeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>سلفة موظف جديدة</DialogTitle>
          </DialogHeader>
          <GiveAdvanceForm
            entities={employeeOptions}
            entityLabel="الموظف"
            cashboxAccounts={cashboxAccounts}
            onCancel={() => setEmployeeDialogOpen(false)}
            isSaving={isGivingEmployeeAdvance}
            onSave={async ({ entityId, ...data }) => {
              const result = await giveEmployeeAdvance({ userId: entityId, ...data });
              if (result) setEmployeeDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={supplierDialogOpen} onOpenChange={setSupplierDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>سلفة مورد جديدة</DialogTitle>
          </DialogHeader>
          <GiveAdvanceForm
            entities={supplierOptions}
            entityLabel="المورد"
            cashboxAccounts={cashboxAccounts}
            onCancel={() => setSupplierDialogOpen(false)}
            isSaving={isGivingSupplierAdvance}
            onSave={async ({ entityId, ...data }) => {
              const result = await giveSupplierAdvance({ supplierId: entityId, ...data });
              if (result) setSupplierDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* تحصيل/تسوية سلفة موظف - سند قبض (مثال العميل: تسوية عند الاستقالة) */}
      <Dialog open={Boolean(settleEmployeeTarget)} onOpenChange={(v) => !v && setSettleEmployeeTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تحصيل سلفة - {settleEmployeeTarget?.name}</DialogTitle>
          </DialogHeader>
          {settleEmployeeTarget && (
            <SettleAdvanceForm
              entityName={settleEmployeeTarget.name}
              outstandingBalance={settleEmployeeTarget.outstanding}
              cashboxAccounts={cashboxAccounts}
              isSaving={isSettlingEmployeeAdvance}
              onCancel={() => setSettleEmployeeTarget(null)}
              onSave={async (data) => {
                const result = await settleEmployeeAdvance({ userId: settleEmployeeTarget.id, ...data });
                if (result) setSettleEmployeeTarget(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* تحصيل/استرجاع سلفة مورد - سند قبض */}
      <Dialog open={Boolean(settleSupplierTarget)} onOpenChange={(v) => !v && setSettleSupplierTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تحصيل سلفة - {settleSupplierTarget?.name}</DialogTitle>
          </DialogHeader>
          {settleSupplierTarget && (
            <SettleAdvanceForm
              entityName={settleSupplierTarget.name}
              outstandingBalance={settleSupplierTarget.outstanding}
              cashboxAccounts={cashboxAccounts}
              isSaving={isSettlingSupplierAdvance}
              onCancel={() => setSettleSupplierTarget(null)}
              onSave={async (data) => {
                const result = await settleSupplierAdvance({ supplierId: settleSupplierTarget.id, ...data });
                if (result) setSettleSupplierTarget(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdvancesTab;
