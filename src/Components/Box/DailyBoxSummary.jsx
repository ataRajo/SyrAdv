import React, { useMemo } from "react";
import { Icon } from "@iconify/react";

const formatCurrency = (value) => {
  const n = parseInt(value) || 0;
  return Math.abs(n).toLocaleString("ar-EG");
};

const formatTime = (value) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "-";
  }
};

const StatCard = ({ label, value, icon, accent, sublabel }) => (
  <div className={`relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-colors duration-200 border-s-4 ${accent.border}`}>
    <div className="flex items-start justify-between gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className="text-2xl font-bold tabular-nums text-foreground">
          {formatCurrency(value)}
          <span className="ms-1 text-sm font-normal text-muted-foreground">$</span>
        </span>
        {sublabel && <span className="text-xs text-muted-foreground mt-1">{sublabel}</span>}
      </div>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${accent.bg}`}>
        <Icon icon={icon} className={`h-6 w-6 ${accent.text}`} />
      </div>
    </div>
  </div>
);

/**
 * فلترة يومية للصندوق (طلب صريح) - يعرض ملخّص القيم المتكاملة (دفعات
 * اليوم + حجوزات اليوم + صافي التغيير على المستحقات، الرقم الذي يربط
 * بينهما فعليًا) وجدولاً موحَّدًا بكل حركات اليوم (دفعات وحجوزات معًا)
 * مرتَّبة زمنيًا، بدل جدولين منفصلين لا يظهر بينهما أي ترابط بصري.
 *
 * `data` هو استجابة GET /get-box-daily-report مباشرة:
 * { date, summary, payments: [...], bookings: [...], by_customer: [...] }
 */
const DailyBoxSummary = ({ data, isLoading }) => {
  const movements = useMemo(() => {
    if (!data) return [];
    const payments = (data.payments || []).map((p) => ({ ...p, _sortKey: p.created_at || p.date }));
    const bookings = (data.bookings || []).map((b) => ({ ...b, _sortKey: b.created_at }));
    return [...payments, ...bookings].sort((a, b) => new Date(b._sortKey) - new Date(a._sortKey));
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[104px] rounded-xl border bg-card animate-pulse" />
          ))}
        </div>
        <div className="h-40 rounded-xl border bg-card animate-pulse" />
      </div>
    );
  }

  if (!data) return null;

  const summary = data.summary || {};
  const isNetPositive = Number(summary.net_receivables_change || 0) >= 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="الدفعات المُحصَّلة اليوم"
          value={summary.total_paid_today}
          sublabel={`${summary.payments_count || 0} دفعة`}
          icon="mdi:cash-check"
          accent={{
            border: "border-e-emerald-500 border-emerald-500",
            bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
            text: "text-emerald-600 dark:text-emerald-400",
          }}
        />
        <StatCard
          label="الحجوزات الجديدة اليوم"
          value={summary.total_new_bookings_today}
          sublabel={`${summary.bookings_count || 0} حجز`}
          icon="mdi:calendar-plus"
          accent={{
            border: "border-e-blue-500 border-blue-500",
            bg: "bg-blue-500/10 dark:bg-blue-500/15",
            text: "text-blue-600 dark:text-blue-400",
          }}
        />
        <StatCard
          label={isNetPositive ? "صافي زيادة المستحقات" : "صافي انخفاض المستحقات"}
          value={summary.net_receivables_change}
          sublabel="حجوزات جديدة ناقص الدفعات المُحصَّلة"
          icon={isNetPositive ? "mdi:trending-up" : "mdi:trending-down"}
          accent={
            isNetPositive
              ? {
                  border: "border-e-amber-500 border-amber-500",
                  bg: "bg-amber-500/10 dark:bg-amber-500/15",
                  text: "text-amber-600 dark:text-amber-400",
                }
              : {
                  border: "border-e-slate-500 border-slate-500",
                  bg: "bg-slate-500/10 dark:bg-slate-500/15",
                  text: "text-slate-600 dark:text-slate-300",
                }
          }
        />
        <StatCard
          label="إجمالي الحركات"
          value={(summary.payments_count || 0) + (summary.bookings_count || 0)}
          sublabel={data.date}
          icon="mdi:swap-horizontal"
          accent={{
            border: "border-e-slate-500 border-slate-500",
            bg: "bg-slate-500/10 dark:bg-slate-500/15",
            text: "text-slate-600 dark:text-slate-300",
          }}
        />
      </div>

      <div className="border border-border rounded-xl bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold flex items-center gap-2">
            <Icon icon="mdi:timeline-clock-outline" className="w-5 h-5 text-primary" />
            حركات اليوم ({movements.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-center">
            <thead>
              <tr className="border-b border-border text-muted-foreground bg-muted/20">
                <th className="p-2 text-center">النوع</th>
                <th className="p-2 text-center">الوقت</th>
                <th className="p-2 text-center">الزبون</th>
                <th className="p-2 text-center">التفاصيل</th>
                <th className="p-2 text-center">المبلغ</th>
              </tr>
            </thead>
            <tbody>
              {movements.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-muted-foreground">
                    لا توجد حركات في هذا اليوم
                  </td>
                </tr>
              )}
              {movements.map((m) => {
                const isPayment = m.type === "payment";
                return (
                  <tr key={`${m.type}-${m.id}`} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-2 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isPayment
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        }`}
                      >
                        <Icon icon={isPayment ? "mdi:cash-fast" : "mdi:calendar-bookmark"} className="w-3.5 h-3.5" />
                        {isPayment ? "دفعة" : "حجز جديد"}
                      </span>
                    </td>
                    <td className="p-2 text-center text-xs text-muted-foreground">{formatTime(m.created_at)}</td>
                    <td className="p-2 text-center font-medium">{m.customer_name || "-"}</td>
                    <td className="p-2 text-center text-xs text-muted-foreground">
                      {isPayment
                        ? `دفعة رقم ${m.payment_number ?? m.id}${m.booking_id ? ` — حجز #${m.booking_id}` : ""}`
                        : `حجز رقم ${m.number ?? m.booking_id} — من ${m.start_date} إلى ${m.end_date}`}
                    </td>
                    <td className="p-2 text-center font-semibold tabular-nums">
                      {formatCurrency(isPayment ? m.paid : m.total_price)}{" "}
                      <span className="text-xs font-normal text-muted-foreground">$</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DailyBoxSummary;
