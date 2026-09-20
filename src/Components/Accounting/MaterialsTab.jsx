import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@iconify/react";
import {
  useGetMaterialsWithStatsQuery,
  useGetMaterialPurchasesQuery,
} from "../../RtkQuery/Slice/Accounting/AccountingApi";

const fmt = (n) => Number(n ?? 0).toLocaleString("ar-SY", { minimumFractionDigits: 2 });

/**
 * سجل شراء مادة بعينها عبر كل الفواتير - أيقونة العين على تبويبة "المواد".
 */
const MaterialPurchasesDialog = ({ material, open, onOpenChange }) => {
  const [page, setPage] = useState(1);
  const { data, isFetching } = useGetMaterialPurchasesQuery(
    { material_id: material?.id, page },
    { skip: !material?.id }
  );
  const rows = data?.data ?? [];
  const meta = data?.meta;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setPage(1);
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>سجل شراء "{material?.name}"</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="bg-muted/40 rounded p-2">
            <div className="text-xs text-muted-foreground">إجمالي الكمية المُشتراة</div>
            <div className="font-semibold font-mono">
              {fmt(material?.total_quantity)} {material?.unit || ""}
            </div>
          </div>
          <div className="bg-muted/40 rounded p-2">
            <div className="text-xs text-muted-foreground">إجمالي المبلغ</div>
            <div className="font-semibold font-mono">${fmt(material?.total_amount)}</div>
          </div>
          <div className="bg-muted/40 rounded p-2">
            <div className="text-xs text-muted-foreground">عدد مرات الشراء</div>
            <div className="font-semibold font-mono">{material?.purchases_count ?? 0}</div>
          </div>
        </div>

        <div className="overflow-x-auto border border-border rounded-md">
          <table className="w-full text-sm text-center">
            <thead>
              <tr className="border-b border-border text-muted-foreground bg-muted/20">
                <th className="p-2 text-center">رقم الفاتورة</th>
                <th className="p-2 text-center">المورد</th>
                <th className="p-2 text-center">التاريخ</th>
                <th className="p-2 text-center">الكمية</th>
                <th className="p-2 text-center">سعر الوحدة</th>
                <th className="p-2 text-center">المجموع</th>
              </tr>
            </thead>
            <tbody>
              {isFetching && (
                <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">جارٍ التحميل...</td></tr>
              )}
              {!isFetching && rows.length === 0 && (
                <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">لا يوجد سجل شراء لهذه المادة بعد</td></tr>
              )}
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border/50">
                  <td className="p-2 text-center font-mono text-xs">{row.invoice_number || `#${row.invoice_id}`}</td>
                  <td className="p-2 text-center">{row.supplier_name || "-"}</td>
                  <td className="p-2 text-center text-xs">{row.invoice_date || "-"}</td>
                  <td className="p-2 text-center font-mono">{row.quantity} {row.unit || ""}</td>
                  <td className="p-2 text-center font-mono">{fmt(row.unit_price)}</td>
                  <td className="p-2 text-center font-mono">{fmt(row.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {meta?.total_pages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              السابق
            </Button>
            <span className="text-sm text-muted-foreground">
              صفحة {meta.current_page} من {meta.total_pages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= meta.total_pages}
              onClick={() => setPage((p) => p + 1)}
            >
              التالي
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إغلاق</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * تبويبة "المواد" - طلب العميل: مكان مخصص للبحث عن مادة (مثال: "فليكس")
 * ومعرفة إجمالي كميتها المُشتراة عبر كل الفواتير دفعة واحدة، بدل تصفّح كل
 * فاتورة شراء على حدة بحثًا عنها. نفس بيانات فواتير الشراء، مُجمَّعة حسب
 * المادة لتسهيل البحث تحديدًا (طلب العميل الحرفي).
 */
const MaterialsTab = () => {
  const [search, setSearch] = useState("");
  const { data: materials = [], isFetching } = useGetMaterialsWithStatsQuery({
    search: search || undefined,
    per_page: 100,
  });
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  return (
    <div className="border border-border rounded-lg bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border">
        <h3 className="font-semibold">المواد</h3>
        <div className="space-y-1 min-w-[240px]">
          <Label className="text-xs">ابحث عن مادة (مثال: فليكس)</Label>
          <Input
            placeholder="اسم المادة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-center">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="p-2 text-center">اسم المادة</th>
              <th className="p-2 text-center">الوحدة</th>
              <th className="p-2 text-center">إجمالي الكمية المُشتراة</th>
              <th className="p-2 text-center">إجمالي المبلغ</th>
              <th className="p-2 text-center">عدد مرات الشراء</th>
              <th className="p-2 text-center">التفاصيل</th>
            </tr>
          </thead>
          <tbody>
            {isFetching && (
              <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">جارٍ التحميل...</td></tr>
            )}
            {!isFetching && materials.length === 0 && (
              <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">لا يوجد مواد مطابقة</td></tr>
            )}
            {materials.map((m) => (
              <tr key={m.id} className="border-b border-border/50 hover:bg-muted/30">
                <td className="p-2 text-center font-medium">{m.name}</td>
                <td className="p-2 text-center text-xs text-muted-foreground">{m.unit || "-"}</td>
                <td className="p-2 text-center font-mono">{fmt(m.total_quantity)}</td>
                <td className="p-2 text-center font-mono">${fmt(m.total_amount)}</td>
                <td className="p-2 text-center font-mono">{m.purchases_count ?? 0}</td>
                <td className="p-2 text-center">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => setSelectedMaterial(m)}
                    title="عرض سجل الشراء"
                  >
                    <Icon icon="mdi:eye-outline" className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <MaterialPurchasesDialog
        material={selectedMaterial}
        open={Boolean(selectedMaterial)}
        onOpenChange={(open) => !open && setSelectedMaterial(null)}
      />
    </div>
  );
};

export default MaterialsTab;
