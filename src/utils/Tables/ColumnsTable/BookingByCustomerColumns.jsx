import { BookingType } from "../../../Static/StaticData";
import {BookingDetailsButton} from "../../../utils/Tables/ColumnsTable/BookingColumns"  


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
    header: "تفاصيل الحجز",
    accessor: "id",
    // Passing the row's booking ID straight into your custom Button component
    cell: ({ row }) => <BookingDetailsButton bookingId={row.id || row.original?.id} />,
    className: "min-w-[100px]",
  },
];