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

const AddCategoryForm = ({ selectableAccounts, onCancel, onSave, isSaving }) => {
  const [form, setForm] = useState({ name: "", expense_account_id: "" });
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const expenseAccounts = (selectableAccounts ?? []).filter(
    (a) => a.type === "expense"
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          name: form.name,
          expense_account_id: Number(form.expense_account_id),
        });
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label>اسم الفئة (نوع العمل)</Label>
        <Input value={form.name} onChange={(e) => set("name")(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label>حساب المصروف المرتبط</Label>
        <Select value={form.expense_account_id} onValueChange={set("expense_account_id")}>
          <SelectTrigger><SelectValue placeholder="اختر حساب المصروف" /></SelectTrigger>
          <SelectContent>
            {expenseAccounts.map((a) => (
              <SelectItem key={a.id} value={String(a.id)}>{a.path || `${a.code} - ${a.name}`}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>إلغاء</Button>
        <Button type="submit" disabled={isSaving || !form.name || !form.expense_account_id}>
          {isSaving ? "جارٍ الحفظ..." : "حفظ الفئة"}
        </Button>
      </DialogFooter>
    </form>
  );
};

const AddSupplierForm = ({ categories, onCancel, onSave, isSaving }) => {
  const [form, setForm] = useState({
    name: "",
    supplier_category_id: "",
    phone: "",
    address: "",
    notes: "",
  });
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          name: form.name,
          supplier_category_id: Number(form.supplier_category_id),
          ...(form.phone ? { phone: form.phone } : {}),
          ...(form.address ? { address: form.address } : {}),
          ...(form.notes ? { notes: form.notes } : {}),
        });
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label>فئة المورد (نوع العمل)</Label>
        <Select value={form.supplier_category_id} onValueChange={set("supplier_category_id")}>
          <SelectTrigger><SelectValue placeholder="اختر الفئة" /></SelectTrigger>
          <SelectContent>
            {(categories ?? []).map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>اسم المورد</Label>
        <Input value={form.name} onChange={(e) => set("name")(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>الهاتف</Label>
          <Input value={form.phone} onChange={(e) => set("phone")(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>العنوان</Label>
          <Input value={form.address} onChange={(e) => set("address")(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>ملاحظات (اختياري)</Label>
        <Input value={form.notes} onChange={(e) => set("notes")(e.target.value)} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>إلغاء</Button>
        <Button type="submit" disabled={isSaving || !form.name || !form.supplier_category_id}>
          {isSaving ? "جارٍ الحفظ..." : "حفظ المورد"}
        </Button>
      </DialogFooter>
    </form>
  );
};

/**
 * الموردون - "نوع عمل" مستقل عن TypeOfWork، مرتبط بحساب مصروف في شجرة
 * الحسابات (انظر SupplierCategory على الباك-إند). عند إنشاء مورد، حسابه
 * الخاص (جذوره في الشجرة) يُنشأ تلقائيًا عبر SupplierAccountObserver -
 * لا خطوة يدوية هنا لذلك.
 */
const SuppliersTab = ({ accounting }) => {
  const {
    supplierCategories,
    isFetchingSupplierCategories,
    addSupplierCategory,
    isSavingSupplierCategory,
    suppliers,
    isFetchingSuppliers,
    addSupplier,
    isSavingSupplier,
    selectableAccounts,
  } = accounting;

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="border border-border rounded-lg bg-card">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">الموردون</h3>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setCategoryDialogOpen(true)}>
              <Icon icon="mdi:tag-plus-outline" className="w-4 h-4 ml-1" />
              فئة جديدة
            </Button>
            <Button size="sm" onClick={() => setSupplierDialogOpen(true)}>
              <Icon icon="mdi:truck-plus-outline" className="w-4 h-4 ml-1" />
              مورد جديد
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-center">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="p-2 text-center">اسم المورد</th>
                <th className="p-2 text-center">الفئة (نوع العمل)</th>
                <th className="p-2 text-center">الهاتف</th>
                <th className="p-2 text-center">العنوان</th>
              </tr>
            </thead>
            <tbody>
              {isFetchingSuppliers && (
                <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">جارٍ التحميل...</td></tr>
              )}
              {!isFetchingSuppliers && (suppliers ?? []).length === 0 && (
                <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">لا يوجد موردون بعد</td></tr>
              )}
              {(suppliers ?? []).map((s) => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="p-2 text-center">{s.name}</td>
                  <td className="p-2 text-xs text-muted-foreground text-center">{s.category?.name ?? "-"}</td>
                  <td className="p-2 text-xs text-center">{s.phone || "-"}</td>
                  <td className="p-2 text-xs text-center">{s.address || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="border border-border rounded-lg bg-card">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">فئات الموردين (نوع العمل)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-center">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="p-2 text-center">اسم الفئة</th>
                <th className="p-2 text-center">حساب المصروف</th>
              </tr>
            </thead>
            <tbody>
              {isFetchingSupplierCategories && (
                <tr><td colSpan={2} className="p-4 text-center text-muted-foreground">جارٍ التحميل...</td></tr>
              )}
              {!isFetchingSupplierCategories && (supplierCategories ?? []).length === 0 && (
                <tr><td colSpan={2} className="p-4 text-center text-muted-foreground">لا يوجد فئات بعد</td></tr>
              )}
              {(supplierCategories ?? []).map((c) => (
                <tr key={c.id} className="border-b border-border/50">
                  <td className="p-2 text-center">{c.name}</td>
                  <td className="p-2 text-xs text-muted-foreground text-center">
                    {c.expense_account?.name ?? c.expense_account_id ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>فئة موردين جديدة</DialogTitle></DialogHeader>
          <AddCategoryForm
            selectableAccounts={selectableAccounts}
            onCancel={() => setCategoryDialogOpen(false)}
            onSave={async (data) => {
              const ok = await addSupplierCategory(data);
              if (ok) setCategoryDialogOpen(false);
            }}
            isSaving={isSavingSupplierCategory}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={supplierDialogOpen} onOpenChange={setSupplierDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>مورد جديد</DialogTitle></DialogHeader>
          <AddSupplierForm
            categories={supplierCategories}
            onCancel={() => setSupplierDialogOpen(false)}
            onSave={async (data) => {
              const ok = await addSupplier(data);
              if (ok) setSupplierDialogOpen(false);
            }}
            isSaving={isSavingSupplier}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuppliersTab;