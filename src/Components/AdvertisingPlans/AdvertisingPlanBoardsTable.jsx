// AdvertisingPlanBoardsTable.jsx
//
// جدول اللوحات المختارة ضمن خطة إعلانية قيد الإنشاء/التعديل: يعرض كل لوحة
// مع حقل سعر قابل للتعديل يدوياً وزر حذف، بالإضافة لسطر المجموع النهائي.
//
// جولة تعديلات جديدة (طلب صريح): حين يكون "التسعير التلقائي" مفعَّلاً في
// النموذج (نوع المنتج + نوع الطباعة مُحدَّدان وتم حساب السعر النهائي عبر
// نفس محرك تسعير الحجوزات)، يتحوّل عمود السعر هنا لعرض فقط (بلا إدخال) -
// السعر الحقيقي أصبح على مستوى الخطة كاملة (راجع AdvertisingPlanForm.jsx)
// والقيمة المعروضة هنا هي فقط حصة تقريبية متساوية لكل لوحة من ذلك المجموع
// (نفس ما يوزّعه الباك-إند تلقائياً - راجع AdvertisingPlanService::syncRoadSigns).
import { Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// items: [{ road_sign: {...}, price: number }]
export default function AdvertisingPlanBoardsTable({
  items,
  onPriceChange,
  onRemove,
  autoPricingActive = false,
  autoPricingTotal = 0,
}) {
  const manualTotal = items.reduce((sum, it) => sum + (Number(it.price) || 0), 0);
  const evenShare = items.length > 0 ? autoPricingTotal / items.length : 0;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-border rounded-lg text-muted-foreground text-sm">
        لم يتم اختيار أي لوحة بعد. اختر اللوحات من الخريطة على اليمين.
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-right">اللوحة</TableHead>
              <TableHead className="text-right">المدينة / المكان</TableHead>
              <TableHead className="text-right">النموذج</TableHead>
              <TableHead className="text-right w-[140px]">
                {autoPricingActive ? "الحصة التقريبية" : "السعر (ل.س)"}
              </TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(({ road_sign, price }) => (
              <TableRow key={road_sign.id}>
                <TableCell className="text-sm font-mono">
                  {road_sign.roadsign_code || `#${road_sign.id}`}
                </TableCell>
                <TableCell className="text-sm">
                  {road_sign.city?.name || "—"}
                  {road_sign.place ? ` - ${road_sign.place}` : ""}
                </TableCell>
                <TableCell className="text-sm">
                  {road_sign.template?.model || "—"}
                  {road_sign.template?.size ? ` (${road_sign.template.size})` : ""}
                </TableCell>
                <TableCell>
                  {autoPricingActive ? (
                    <span className="text-sm text-muted-foreground">
                      ≈ {evenShare.toLocaleString("ar-EG", { maximumFractionDigits: 2 })} $
                    </span>
                  ) : (
                    <Input
                      type="number"
                      min={0}
                      value={price ?? 0}
                      onChange={(e) => onPriceChange(road_sign.id, e.target.value)}
                      className="h-8 text-sm"
                    />
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(road_sign.id)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                    title="إزالة من الخطة"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {!autoPricingActive && (
        <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-t border-border">
          <span className="text-sm text-muted-foreground">{items.length} لوحة</span>
          <span className="text-base font-bold text-foreground">
            المجموع: {manualTotal.toLocaleString("ar-EG")} ل.س
          </span>
        </div>
      )}
    </div>
  );
}
