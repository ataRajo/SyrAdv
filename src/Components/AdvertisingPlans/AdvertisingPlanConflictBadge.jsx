// AdvertisingPlanConflictBadge.jsx
//
// تنبيه غير حاجب (non-blocking) يظهر في جدول اختيار اللوحات عند إنشاء/تعديل
// حجز (BookingTable.jsx) عندما تكون اللوحة موجودة ضمن خطة إعلانية "غير
// مؤرشفة" تتقاطع تواريخها مع تاريخ الحجز الجاري إنشاؤه - طلب صريح من
// العميل: "تتم معالجتها على أنها متاحة بشرط أن يظهر للموظف تنبيه ... من
// تاريخ إلى تاريخ".
//
// يعتمد هذا المكوّن على حقل `active_advertising_plans` الذي يجب أن يعيده
// الباك-إند ضمن كل عنصر لوحة (road sign) في استجابة GET /road-signs عندما
// يُمرَّر start_date/end_date ويوجد تقاطع فعلي - راجع API_CONTRACT.md.
// لا يُغيّر هذا المكوّن أي منطق توفّر/حجب موجود - عرض فقط.
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertTriangle } from "lucide-react";

function formatDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("ar-EG");
  } catch {
    return value;
  }
}

// يقبل إما لوحة مفردة (sign.active_advertising_plans) أو مجموعة لوحات
// متماثلة (group.signs[].active_advertising_plans) عبر prop `plans` مباشرة.
export default function AdvertisingPlanConflictBadge({ plans, size = "sm" }) {
  if (!plans || plans.length === 0) return null;

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 cursor-help align-middle"
            role="status"
          >
            <AlertTriangle className={iconSize} />
            ضمن خطة إعلانية
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[260px] text-right" dir="rtl">
          <p className="font-semibold mb-1">
            هذه اللوحة موجودة ضمن {plans.length > 1 ? "أكثر من خطة إعلانية" : "خطة إعلانية"} غير مؤرشفة:
          </p>
          <ul className="space-y-1">
            {plans.map((p) => (
              <li key={p.id} className="text-xs">
                {p.name ? `«${p.name}» ` : ""}
                من {formatDate(p.start_date)} إلى {formatDate(p.end_date)}
              </li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
