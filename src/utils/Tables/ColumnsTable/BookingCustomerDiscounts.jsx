export const BookingCustomerDiscounts = [
  {
    header: "نوع الحسم",
    accessor: "discount_type",
    prefixIcon: "mdi:tag",
    format: (value) => (value == 1 ? "قيمة ثابتة" : "نسبة مئوية"),
    className: "min-w-[80px] sm:min-w-[100px] md:min-w-[120px]",
    priority: 6,
  },
  {
    header: "القيمة قبل الحسم",
    accessor: "total",
    format: (value) => parseFloat(value).toFixed(2),

    prefixIcon: "mdi:currency-usd",
    className: "min-w-[80px] sm:min-w-[100px] md:min-w-[120px]",
    priority: 6,
  },
  {
    header: "الحسم",
    accessor: "value",
    format: (value, row) => {
      if (row?.discount_type === 1) {
        return `${value}$`;
      } else if (row?.discount_type === 2) {
        return `${value}%`;
      }
      return value;
    },
    prefixIcon: "mdi:percent",
    className: "min-w-[80px] sm:min-w-[100px] md:min-w-[120px]",
    priority: 6,
  },
  {
    header: "القيمة بعد الحسم",
    accessor: "remaining",
    format: (value) => parseFloat(value).toFixed(2),
    prefixIcon: "mdi:currency-usd",
    className: "min-w-[80px] sm:min-w-[100px] md:min-w-[120px]",
    priority: 6,
  },
  {
    header: "تاريخ الحسم",
    accessor: "created_at",
    format: (value) => new Date(value).toLocaleDateString("en-US"),
    prefixIcon: "mdi:calendar-start",
    className: "min-w-[100px] sm:min-w-[120px] md:min-w-[150px]",
    priority: 4,
  },
];
