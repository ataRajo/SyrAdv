import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icon } from "@iconify/react";

/**
 * تقرير إنجاز أسبوعي لكل الورشات - أساس احتساب المكافآت الأسبوعية (طلب
 * صريح في بداية بناء نظام الورشات). مرتَّب تنازليًا حسب عدد اللوحات
 * المُنفَّذة (executed_at ضمن الأسبوع، لا التاريخ المخطَّط).
 */
const WeeklyReportTab = ({ workshops }) => {
  const { allWorkshopsWeeklyReport, isFetchingWeeklyReport, weeklyReportWeekStart, setWeeklyReportWeekStart } =
    workshops;

  const rows = allWorkshopsWeeklyReport?.workshops ?? [];
  const topCount = rows.length > 0 ? rows[0]?.total_executed ?? 0 : 0;

  return (
    <div className="space-y-4">
      <div className="border border-border rounded-lg bg-card p-4 flex flex-wrap items-end gap-3 justify-between">
        <div className="space-y-1">
          <Label className="text-xs">أي تاريخ ضمن الأسبوع المطلوب</Label>
          <Input
            type="date"
            value={weeklyReportWeekStart}
            onChange={(e) => setWeeklyReportWeekStart(e.target.value)}
            className="w-48"
          />
        </div>
        {allWorkshopsWeeklyReport?.week_start && (
          <div className="text-sm text-muted-foreground">
            الأسبوع: {allWorkshopsWeeklyReport.week_start} إلى {allWorkshopsWeeklyReport.week_end}
          </div>
        )}
      </div>

      <div className="border border-border rounded-lg bg-card">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">ترتيب الورشات حسب الإنجاز</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-center">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="p-2 text-center">الترتيب</th>
                <th className="p-2 text-center">الورشة</th>
                <th className="p-2 text-center">عدد اللوحات المُنفَّذة</th>
              </tr>
            </thead>
            <tbody>
              {isFetchingWeeklyReport && (
                <tr>
                  <td colSpan={3} className="p-4 text-center text-muted-foreground">
                    جارٍ التحميل...
                  </td>
                </tr>
              )}
              {!isFetchingWeeklyReport && rows.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-4 text-center text-muted-foreground">
                    لا يوجد إنجاز مُسجَّل ضمن هذا الأسبوع
                  </td>
                </tr>
              )}
              {rows.map((r, index) => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="p-2 text-center">
                    {index === 0 && r.total_executed > 0 ? (
                      <Icon icon="mdi:trophy" className="w-4 h-4 text-amber-500 inline" />
                    ) : (
                      index + 1
                    )}
                  </td>
                  <td className="p-2 text-center font-medium">{r.name}</td>
                  <td className="p-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-mono font-semibold">{r.total_executed}</span>
                      {topCount > 0 && (
                        <div className="w-24 h-2 rounded-full bg-muted overflow-hidden hidden sm:block">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${(r.total_executed / topCount) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WeeklyReportTab;
