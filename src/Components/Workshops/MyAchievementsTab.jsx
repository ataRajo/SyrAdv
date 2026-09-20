import React from "react";
import { Icon } from "@iconify/react";

const TYPE_LABELS = { INSTALLATION: "تركيب", RELEASE: "فك", RELEASE_AND_INSTALLATION: "فك وتركيب", MAINTENANCE: "صيانة" };

/**
 * "إنجازي" - إنجاز العامل الحالي شخصيًا (لا فريقه/ورشته كاملة، تلك في
 * تقرير مسؤول الورشة الأسبوعي). راجع OrderService::myAchievements().
 */
const MyAchievementsTab = ({ myWorkshop }) => {
  const { achievements, isFetchingAchievements } = myWorkshop;

  if (isFetchingAchievements && !achievements) {
    return <div className="text-center text-muted-foreground py-10">جارٍ التحميل...</div>;
  }

  const byDay = achievements?.by_day ?? {};
  const maxDay = Math.max(1, ...Object.values(byDay));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="border border-border rounded-lg bg-card p-4 text-center">
          <Icon icon="mdi:calendar-today" className="w-6 h-6 mx-auto text-primary mb-1" />
          <div className="text-3xl font-bold">{achievements?.today ?? 0}</div>
          <div className="text-xs text-muted-foreground">مُنجَز اليوم</div>
        </div>
        <div className="border border-border rounded-lg bg-card p-4 text-center">
          <Icon icon="mdi:trophy-outline" className="w-6 h-6 mx-auto text-amber-500 mb-1" />
          <div className="text-3xl font-bold">{achievements?.total ?? 0}</div>
          <div className="text-xs text-muted-foreground">
            الإجمالي ({achievements?.from} إلى {achievements?.to})
          </div>
        </div>
      </div>

      {achievements?.by_type && Object.keys(achievements.by_type).length > 0 && (
        <div className="border border-border rounded-lg bg-card p-4">
          <h4 className="font-medium text-sm mb-3">حسب نوع الأمر</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(achievements.by_type).map(([type, count]) => (
              <span key={type} className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary">
                {TYPE_LABELS[type] || type}: {count}
              </span>
            ))}
          </div>
        </div>
      )}

      {Object.keys(byDay).length > 0 && (
        <div className="border border-border rounded-lg bg-card p-4">
          <h4 className="font-medium text-sm mb-3">الإنجاز اليومي</h4>
          <div className="space-y-2">
            {Object.entries(byDay)
              .sort(([a], [b]) => (a < b ? 1 : -1))
              .map(([day, count]) => (
                <div key={day} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-24 shrink-0">{day}</span>
                  <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${(count / maxDay) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono w-6 text-left">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAchievementsTab;
