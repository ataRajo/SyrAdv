import { Icon } from "@iconify/react";

const formatCurrency = (value) => {
  const n = parseInt(value) || 0;
  return Math.abs(n).toLocaleString("ar-EG");
};

const StatCard = ({ label, value, icon, accent, sublabel }) => (
  <div
    className={`relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-colors duration-200 border-s-4 ${accent.border}`}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
        <span className="text-2xl font-bold tabular-nums text-foreground">
          {formatCurrency(value)}
          <span className="ms-1 text-sm font-normal text-muted-foreground">
            د.ل
          </span>
        </span>
        {sublabel && (
          <span className="text-xs text-muted-foreground mt-1">
            {sublabel}
          </span>
        )}
      </div>
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${accent.bg}`}
      >
        <Icon icon={icon} className={`h-6 w-6 ${accent.text}`} />
      </div>
    </div>
  </div>
);

const BoxSummaryCards = ({ summary, isLoading }) => {
  // Debug: Log the summary data
  console.log("BoxSummaryCards received:", summary);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-[104px] rounded-xl border bg-card animate-pulse"
          />
        ))}
      </div>
    );
  }

  // Ensure summary is an object, even if undefined
  const safeSummary = summary || {};
  
  const {
    total_paid_received = 0,
    total_customer_remaining = 0,
    total_booking_amount = 0,
  } = safeSummary;

  // Check if values are numbers
  const paid = Number(total_paid_received) || 0;
  const remaining = Number(total_customer_remaining) || 0;
  const booking = Number(total_booking_amount) || 0;

  const isCredit = remaining < 0;

  // Debug: Log processed values
  console.log("Processed values:", { paid, remaining, booking, isCredit });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <StatCard
        label="المبالغ المدفوعة"
        value={paid}
        icon="mdi:cash-check"
        accent={{
          border: "border-e-emerald-500 border-emerald-500",
          bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
          text: "text-emerald-600 dark:text-emerald-400",
        }}
      />

      {isCredit ? (
        <StatCard
          label="رصيد دائن للزبون"
          value={remaining}
          icon="mdi:cash-refund"
          sublabel="الزبون دفع أكثر من المستحق"
          accent={{
            border: "border-e-blue-500 border-blue-500",
            bg: "bg-blue-500/10 dark:bg-blue-500/15",
            text: "text-blue-600 dark:text-blue-400",
          }}
        />
      ) : (
        <StatCard
          label="المبالغ المتبقية"
          value={remaining}
          icon="mdi:cash-clock"
          accent={{
            border: "border-e-amber-500 border-amber-500",
            bg: "bg-amber-500/10 dark:bg-amber-500/15",
            text: "text-amber-600 dark:text-amber-400",
          }}
        />
      )}

      <StatCard
        label="إجمالي الحجوزات"
        value={booking}
        icon="mdi:calculator-variant"
        accent={{
          border: "border-e-slate-500 border-slate-500",
          bg: "bg-slate-500/10 dark:bg-slate-500/15",
          text: "text-slate-600 dark:text-slate-300",
        }}
      />
    </div>
  );
};

export default BoxSummaryCards;