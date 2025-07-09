import { BookingType, statusBookings } from "../../../Static/StaticData";

export const BookingColumns = [
   {
    header: "اسم الشركة",
    accessor: "customer.company_name",
    prefixIcon: "mdi:office-building",
    className:
      "min-w-[120px] sm:min-w-[150px] md:min-w-[200px] lg:min-w-[250px]",
    cellClassName: "font-medium",
    priority: 5,
  },
  {
    header: "من",
    accessor: "start_date",
    format: (value) =>
      new Date(value).toLocaleDateString("en-US"),
    prefixIcon: "mdi:calendar-start",
    className: "min-w-[100px] sm:min-w-[120px] md:min-w-[150px]",
    priority: 4,
  },

  {
    header: "إلى",
    accessor: "end_date",
    format: (value) =>
      new Date(value).toLocaleDateString("en-US"),
    prefixIcon: "mdi:calendar-end",
    className: "min-w-[100px] sm:min-w-[120px] md:min-w-[150px]",
    priority: 3,
  },
  
 
  {
    header: "نوع الحجز",
    accessor: "type",
    prefixIcon: "mdi:tag",
    format: (value) => BookingType[value] || "غير معروف",
    className: "min-w-[80px] sm:min-w-[100px] md:min-w-[120px]",
    priority: 6,
  },

   {
    header: "الحالة",
    accessor: "status",
    prefixIcon: "mdi:tag",
    format: (value) => statusBookings[value] || "غير معروف",
    className: "min-w-[80px] sm:min-w-[100px] md:min-w-[120px]",
    priority: 6,
  },
];
