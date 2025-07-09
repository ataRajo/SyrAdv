import { BookingType } from "../../../Static/StaticData";

export const BookingCustomerColumns = [
  {
    header: "من",
    accessor: "start_date",
    format: (value) => new Date(value).toLocaleDateString("en-US"),
    prefixIcon: "mdi:calendar-start",
    className: "min-w-[100px] sm:min-w-[120px] md:min-w-[150px]",
    priority: 4,
  },

  {
    header: "إلى",
    accessor: "end_date",
    format: (value) => new Date(value).toLocaleDateString("en-US"),
    prefixIcon: "mdi:calendar-end",
    className: "min-w-[100px] sm:min-w-[120px] md:min-w-[150px]",
    priority: 3,
  },

  {
    header: "الحالة",
    accessor: "type",
    prefixIcon: "mdi:tag",
    format: (value) => BookingType[value] || "غير معروف",
    className: "min-w-[80px] sm:min-w-[100px] md:min-w-[120px]",
    priority: 6,
  },
  {
    header: "القيمة قبل الحسم",
    accessor: "total_price_befor_discount",
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
    accessor: "total_price",
    format: (value) => parseFloat(value).toFixed(2),
    prefixIcon: "mdi:currency-usd",
    className: "min-w-[80px] sm:min-w-[100px] md:min-w-[120px]",
    priority: 6,
  },
];
