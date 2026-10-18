// AdvertisingPlanStatusBadge.jsx
//
// شارة حالة الخطة: نشطة (مع عدّاد تنازلي حتى الأرشفة) أو مؤرشفة. ألوان
// متوافقة مع الدارك/لايت مود عبر توكنات Tailwind الدلالية المستخدمة في
// باقي المشروع (green/gray مع variants dark:).
import { Clock, Archive, CheckCircle2 } from "lucide-react";
import useAdvertisingPlanCountdown from "../../hooks/useAdvertisingPlanCountdown";

export default function AdvertisingPlanStatusBadge({ plan, className = "" }) {
  const { isArchived, remainingText } = useAdvertisingPlanCountdown(plan);

  if (isArchived) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 ${className}`}
      >
        <Archive className="h-3.5 w-3.5" />
        مؤرشفة
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 ${className}`}
      title="تُؤرشف الخطة تلقائياً بعد 48 ساعة من إنشائها ما لم يتم حجزها"
    >
      <CheckCircle2 className="h-3.5 w-3.5" />
      نشطة
      {remainingText && (
        <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 border-r border-green-300 dark:border-green-700 pr-1.5 mr-0.5">
          <Clock className="h-3 w-3" />
          {remainingText}
        </span>
      )}
    </span>
  );
}
