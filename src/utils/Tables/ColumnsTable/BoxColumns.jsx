import { Icon } from "@iconify/react";

export const getBoxColumns = (onViewDetails) => [
  {
    header: "اسم الزبون",
    accessor: "customer_name",
    className: "min-w-[180px]",
    // FIX: Added { row } to destructure the object passed by DynamicTable
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-semibold text-foreground">{row.customer_name}</span>
        <span className="text-xs text-muted-foreground">معرّف: #{row.customer_id}</span>
      </div>
    ),
  },
  {
    header: "الحجوزات",
    accessor: "bookings_count",
    className: "min-w-[100px] text-center",
    cell: ({ row }) => (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
        {row.bookings_count} حجز
      </span>
    ),
  },
  {
    header: "إجمالي الحجوزات",
    accessor: "total_booking_amount",
    className: "min-w-[130px]",
    cell: ({ row }) => (
      <span className="font-semibold tabular-nums">
        {Number(row.total_booking_amount || 0).toLocaleString("ar-EG")} <span className="text-xs font-normal text-muted-foreground">$</span>
      </span>
    ),
  },
  {
    header: "عدد الدفعات",
    accessor: "payments_count",
    className: "min-w-[100px] text-center",
    cell: ({ row }) => (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        {row.payments_count} دفعات
      </span>
    ),
  },
  {
    header: "المدفوع",
    accessor: "total_paid",
    className: "min-w-[130px]",
    cell: ({ row }) => (
      <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
        {Number(row.total_paid || 0).toLocaleString("ar-EG")} <span className="text-xs font-normal text-muted-foreground">$</span>
      </span>
    ),
  },
  {
    header: "المبلغ المتبقي",
    accessor: "outstanding_balance",
    className: "min-w-[130px]",
    cell: ({ row }) => {
      const balance = Number(row.outstanding_balance || 0);
      const isCredit = balance < 0;
      return (
        <span className={`font-semibold tabular-nums ${isCredit ? "text-blue-600 dark:text-blue-400" : "text-amber-600 dark:text-amber-400"}`}>
          {Math.abs(balance).toLocaleString("ar-EG")} <span className="text-xs font-normal text-muted-foreground">$ {isCredit ? "(دائن)" : ""}</span>
        </span>
      );
    },
  },
  {
    header: "المستحق للفترة",
    accessor: "period_calculated_outstanding",
    className: "min-w-[130px]",
    cell: ({ row }) => (
      <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">
        {Number(row.period_calculated_outstanding || 0).toLocaleString("ar-EG")} <span className="text-xs font-normal text-muted-foreground">$</span>
      </span>
    ),
  },

];