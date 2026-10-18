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
import SupplierStatementDialog from "./SupplierStatementDialog";
import { useUpdateSupplierCategoryMutation } from "../../RtkQuery/Slice/Accounting/AccountingApi";

const fmt = (n) => Number(n ?? 0).toLocaleString("ar-SY", { minimumFractionDigits: 2 });

const AddCategoryForm = ({ selectableAccounts, onCancel, onSave, isSaving, initialData }) => {
  const [form, setForm] = useState({
    name: initialData?.name || "",
    expense_account_id: initialData?.expense_account_id ? String(initialData.expense_account_id) : "",
  });
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
          {isSaving ? "جارٍ الحفظ..." : initialData ? "حفظ التعديل" : "حفظ الفئة"}
        </Button>
      </DialogFooter>
    </form>
  );
};

const ID_DOCUMENT_TYPES = [
  { value: "national_id", label: "هوية شخصية" },
  { value: "passport", label: "جواز سفر" },
  { value: "commercial_register", label: "سجل تجاري" },
  { value: "industrial_register", label: "سجل صناعي" },
  { value: "other", label: "أخرى" },
];

/**
 * نموذج مورد موحَّد للإضافة والتعديل (طلب صريح: "تعديل مورد من أجل تعديل
 * الموردين السابقين واستكمال معلوماتهم الثبوتية") + قسم "الثبوتية": نوع
 * الوثيقة ورقمها واسم صاحبها وتاريخ انتهائها وصورها (وجه/خلف الهوية...).
 * يُرسَل كـ FormData لدعم رفع الصور.
 */
const SupplierForm = ({ categories, initialData, onCancel, onSave, isSaving }) => {
  const isEdit = Boolean(initialData?.id);
  const [form, setForm] = useState({
    name: initialData?.name ?? "",
    supplier_category_id: initialData?.supplier_category_id ? String(initialData.supplier_category_id) : "",
    phone: initialData?.phone ?? "",
    address: initialData?.address ?? "",
    notes: initialData?.notes ?? "",
    id_document_type: initialData?.id_document_type ?? "",
    id_document_number: initialData?.id_document_number ?? "",
    id_holder_name: initialData?.id_holder_name ?? "",
    id_document_expiry: initialData?.id_document_expiry ?? "",
  });
  const [newFiles, setNewFiles] = useState([]);
  const [removeIds, setRemoveIds] = useState([]);
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const existingDocs = (initialData?.identity_documents ?? []).filter((d) => !removeIds.includes(d.id));

  const addFiles = (fileList) => {
    const files = Array.from(fileList || []).filter(
      (f) => (f.type?.startsWith("image/") || f.type === "application/pdf") && f.size <= 10 * 1024 * 1024
    );
    setNewFiles((prev) =>
      [...prev, ...files.map((file) => ({ file, url: file.type.startsWith("image/") ? URL.createObjectURL(file) : null }))].slice(0, 6)
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const body = new FormData();
    body.append("name", form.name);
    body.append("supplier_category_id", form.supplier_category_id);
    // في التعديل نرسل الحقول النصية دائمًا (حتى الفارغة) كي يمكن مسحها.
    ["phone", "address", "notes", "id_document_number", "id_holder_name"].forEach((k) => {
      if (isEdit || form[k]) body.append(k, form[k] ?? "");
    });
    if (form.id_document_type) body.append("id_document_type", form.id_document_type);
    if (form.id_document_expiry) body.append("id_document_expiry", form.id_document_expiry);
    newFiles.forEach(({ file }) => body.append("identity_documents[]", file));
    removeIds.forEach((id) => body.append("remove_document_ids[]", id));
    onSave(body);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>الهاتف</Label>
          <Input value={form.phone} onChange={(e) => set("phone")(e.target.value)} dir="ltr" />
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

      {/* الثبوتية (طلب صريح) */}
      <div className="space-y-3 rounded-lg border border-border p-3 bg-muted/10">
        <div className="flex items-center gap-2">
          <Icon icon="mdi:card-account-details-outline" className="w-5 h-5 text-primary" />
          <span className="font-semibold text-sm">الثبوتية</span>
          <span className="text-xs text-muted-foreground">(يمكن استكمالها لاحقًا من "تعديل")</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">نوع الوثيقة</Label>
            <Select value={form.id_document_type} onValueChange={set("id_document_type")}>
              <SelectTrigger><SelectValue placeholder="اختر نوع الوثيقة" /></SelectTrigger>
              <SelectContent>
                {ID_DOCUMENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">رقم الوثيقة</Label>
            <Input value={form.id_document_number} onChange={(e) => set("id_document_number")(e.target.value)} dir="ltr" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">اسم صاحب الوثيقة</Label>
            <Input value={form.id_holder_name} onChange={(e) => set("id_holder_name")(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">تاريخ الانتهاء (اختياري)</Label>
            <Input type="date" value={form.id_document_expiry} onChange={(e) => set("id_document_expiry")(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">صور الوثيقة (وجه/خلف الهوية، السجل... - حتى 6 ملفات، صور أو PDF)</Label>
          <div className="flex flex-wrap gap-2">
            {existingDocs.map((d) => (
              <div key={d.id} className="relative h-20 w-20 overflow-hidden rounded border border-border bg-background">
                {d.mime_type?.startsWith("image/") ? (
                  <a href={d.url} target="_blank" rel="noopener noreferrer">
                    <img src={d.url} alt={d.name} className="h-full w-full object-cover" />
                  </a>
                ) : (
                  <a href={d.url} target="_blank" rel="noopener noreferrer" className="flex h-full w-full flex-col items-center justify-center text-[10px]">
                    <Icon icon="mdi:file-pdf-box" className="h-8 w-8 text-red-600" />
                    PDF
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setRemoveIds((ids) => [...ids, d.id])}
                  className="absolute left-0.5 top-0.5 rounded-full bg-white/90 p-0.5 text-destructive shadow"
                  title="حذف"
                >
                  <Icon icon="mdi:close" className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {newFiles.map((f, i) => (
              <div key={`n-${i}`} className="relative h-20 w-20 overflow-hidden rounded border-2 border-dashed border-emerald-400 bg-background">
                {f.url ? (
                  <img src={f.url} alt={f.file.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center text-[10px]">
                    <Icon icon="mdi:file-pdf-box" className="h-8 w-8 text-red-600" />
                    PDF
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setNewFiles((list) => list.filter((_, idx) => idx !== i))}
                  className="absolute left-0.5 top-0.5 rounded-full bg-white/90 p-0.5 text-destructive shadow"
                  title="إزالة"
                >
                  <Icon icon="mdi:close" className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {existingDocs.length + newFiles.length < 6 && (
              <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded border-2 border-dashed border-border text-[10px] text-muted-foreground hover:bg-muted/40">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
                <Icon icon="mdi:camera-plus-outline" className="h-6 w-6" />
                إضافة
              </label>
            )}
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>إلغاء</Button>
        <Button type="submit" disabled={isSaving || !form.name || !form.supplier_category_id}>
          {isSaving ? "جارٍ الحفظ..." : isEdit ? "حفظ التعديلات" : "حفظ المورد"}
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
    deleteSupplierCategory,
    isDeletingSupplierCategory,
    suppliers,
    isFetchingSuppliers,
    addSupplier,
    isSavingSupplier,
    updateSupplier,
    isUpdatingSupplier,
    deleteSupplier,
    isDeletingSupplier,
    selectableAccounts,
    openSupplierStatement,
  } = accounting;

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [updateSupplierCategory, { isLoading: isUpdatingCategory }] = useUpdateSupplierCategoryMutation();
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [identityFilter, setIdentityFilter] = useState("all");

  const visibleSuppliers = (suppliers ?? []).filter((s) => {
    if (identityFilter === "missing" && s.has_identity) return false;
    if (identityFilter === "complete" && !s.has_identity) return false;
    const q = supplierSearch.trim().toLowerCase();
    if (!q) return true;
    return [s.name, s.phone, s.id_document_number, s.category?.name]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q));
  });
  const missingIdentityCount = (suppliers ?? []).filter((s) => !s.has_identity).length;

  const handleDeleteSupplier = async (supplier) => {
    if (isDeletingSupplier) return;
    const userConfirmed = window.confirm(`هل تريد حذف المورد "${supplier.name}"؟ لا يمكن التراجع عن هذا الإجراء.`);
    if (!userConfirmed) return;
    await deleteSupplier(supplier.id);
  };

  // طلب صريح: "حذف فئات الموردين" - مرفوض من الباك-إند إن كان أي مورد لا
  // يزال تابعًا لهذه الفئة (رسالة الخطأ تُعرض كما هي عبر toast).
  const handleDeleteSupplierCategory = async (category) => {
    if (isDeletingSupplierCategory) return;
    const userConfirmed = window.confirm(`هل تريد حذف فئة "${category.name}"؟ لا يمكن التراجع عن هذا الإجراء.`);
    if (!userConfirmed) return;
    await deleteSupplierCategory(category.id);
  };

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
        <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border bg-muted/20">
          <Input
            placeholder="بحث بالاسم أو الهاتف أو رقم الوثيقة..."
            value={supplierSearch}
            onChange={(e) => setSupplierSearch(e.target.value)}
            className="w-full sm:w-72"
          />
          <Select value={identityFilter} onValueChange={setIdentityFilter}>
            <SelectTrigger className="w-full sm:w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الموردين</SelectItem>
              <SelectItem value="missing">ثبوتية ناقصة ({missingIdentityCount})</SelectItem>
              <SelectItem value="complete">ثبوتية مكتملة</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-center">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="p-2 text-center">اسم المورد</th>
                <th className="p-2 text-center">الفئة (نوع العمل)</th>
                <th className="p-2 text-center">الهاتف</th>
                <th className="p-2 text-center">العنوان</th>
                {/* طلب صريح: "خانة جديدة اسمها المتبقي على الشركة" - مثال
                    العميل: فاتورة شراء 500 + سلفة 200 = متبقي 300. القيمة
                    من SupplierResource::net_remaining_balance (رصيد حساب
                    المورد المستحق ناقص أي سلفة قائمة لم تُستهلَك بعد) -
                    نفس الحساب المعروض داخل "كشف حساب" لكن هنا مباشرة بجانب
                    كل مورد بلا حاجة لفتح الكشف. */}
                <th className="p-2 text-center">المتبقي على الشركة</th>
                <th className="p-2 text-center">الثبوتية</th>
                <th className="p-2 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {isFetchingSuppliers && (
                <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">جارٍ التحميل...</td></tr>
              )}
              {!isFetchingSuppliers && (suppliers ?? []).length === 0 && (
                <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">لا يوجد موردون بعد</td></tr>
              )}
              {visibleSuppliers.map((s) => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="p-2 text-center">{s.name}</td>
                  <td className="p-2 text-xs text-muted-foreground text-center">{s.category?.name ?? "-"}</td>
                  <td className="p-2 text-xs text-center">{s.phone || "-"}</td>
                  <td className="p-2 text-xs text-center">{s.address || "-"}</td>
                  <td className="p-2 text-center font-mono">
                    {/* net_remaining_balance_raw سالب => السلفة القائمة تفوق
                        المستحق (فائض سلفة جاهز لفواتير قادمة)، نفس منطق
                        SupplierStatementDialog تمامًا. */}
                    {s.net_remaining_balance_raw < 0 ? (
                      <span className="text-emerald-700 text-xs">
                        فائض سلفة: {fmt(Math.abs(s.net_remaining_balance_raw))}
                      </span>
                    ) : (
                      <span className={s.net_remaining_balance > 0 ? "text-amber-700 font-semibold" : ""}>
                        {fmt(s.net_remaining_balance)}
                      </span>
                    )}
                  </td>
                  <td className="p-2 text-center">
                    {s.has_identity ? (
                      <span
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
                        title={[s.id_document_type_label, s.id_document_number].filter(Boolean).join(" - ")}
                      >
                        <Icon icon="mdi:card-account-details-outline" className="h-3.5 w-3.5" />
                        {s.id_document_type_label || "مرفقة"}
                        {(s.identity_documents ?? []).length > 0 && ` (${s.identity_documents.length})`}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingSupplier(s)}
                        className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 hover:bg-amber-100"
                        title="استكمال الثبوتية"
                      >
                        <Icon icon="mdi:alert-outline" className="h-3.5 w-3.5" /> ناقصة
                      </button>
                    )}
                  </td>
                  <td className="p-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditingSupplier(s)}>
                        <Icon icon="mdi:pencil-outline" className="w-3.5 h-3.5 ml-1" />
                        تعديل
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openSupplierStatement(s.id)}>
                        <Icon icon="mdi:file-document-outline" className="w-3.5 h-3.5 ml-1" />
                        كشف حساب
                      </Button>
                      {/* طلب صريح: "إضافة خيار حذف المورد" - مرفوض من
                          الباك-إند إن كان للمورد فواتير شراء أو سلف مسجَّلة
                          (رسالة الخطأ من السيرفر تُعرض كما هي عبر toast). */}
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={isDeletingSupplier}
                        onClick={() => handleDeleteSupplier(s)}
                      >
                        <Icon icon="mdi:trash-can-outline" className="w-3.5 h-3.5 ml-1" />
                        حذف
                      </Button>
                    </div>
                  </td>
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
                <th className="p-2 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {isFetchingSupplierCategories && (
                <tr><td colSpan={3} className="p-4 text-center text-muted-foreground">جارٍ التحميل...</td></tr>
              )}
              {!isFetchingSupplierCategories && (supplierCategories ?? []).length === 0 && (
                <tr><td colSpan={3} className="p-4 text-center text-muted-foreground">لا يوجد فئات بعد</td></tr>
              )}
              {(supplierCategories ?? []).map((c) => (
                <tr key={c.id} className="border-b border-border/50">
                  <td className="p-2 text-center">{c.name}</td>
                  <td className="p-2 text-xs text-muted-foreground text-center">
                    {c.expense_account?.name ?? c.expense_account_id ?? "-"}
                  </td>
                  <td className="p-2 text-center">
                    {/* طلب صريح: "حذف فئات الموردين" - مرفوض من الباك-إند إن
                        كان أي مورد لا يزال تابعًا لهذه الفئة. */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="ml-2"
                      onClick={() => setEditCategory(c)}
                    >
                      <Icon icon="mdi:pencil-outline" className="w-3.5 h-3.5 ml-1" />
                      تعديل
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={isDeletingSupplierCategory}
                      onClick={() => handleDeleteSupplierCategory(c)}
                    >
                      <Icon icon="mdi:trash-can-outline" className="w-3.5 h-3.5 ml-1" />
                      حذف
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={Boolean(editCategory)} onOpenChange={(v) => !v && setEditCategory(null)}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>تعديل فئة الموردين</DialogTitle></DialogHeader>
          {editCategory && (
            <AddCategoryForm
              key={editCategory.id}
              initialData={editCategory}
              selectableAccounts={selectableAccounts}
              onCancel={() => setEditCategory(null)}
              isSaving={isUpdatingCategory}
              onSave={async (data) => {
                try {
                  await updateSupplierCategory({ id: editCategory.id, ...data }).unwrap();
                  toast.success("تم تعديل الفئة");
                  setEditCategory(null);
                } catch (err) {
                  toast.error(err?.data?.message || "فشل تعديل الفئة");
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>

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

      <Dialog open={Boolean(editingSupplier)} onOpenChange={(o) => !o && setEditingSupplier(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>تعديل المورد - {editingSupplier?.name}</DialogTitle></DialogHeader>
          {editingSupplier && (
            <SupplierForm
              key={editingSupplier.id}
              categories={supplierCategories}
              initialData={editingSupplier}
              onCancel={() => setEditingSupplier(null)}
              onSave={async (body) => {
                const ok = await updateSupplier(editingSupplier.id, body);
                if (ok) setEditingSupplier(null);
              }}
              isSaving={isUpdatingSupplier}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={supplierDialogOpen} onOpenChange={setSupplierDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>مورد جديد</DialogTitle></DialogHeader>
          <SupplierForm
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

      <SupplierStatementDialog accounting={accounting} />
    </div>
  );
};

export default SuppliersTab;