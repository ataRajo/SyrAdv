// ReportBookingsCustomersColumns.js
const ReportBookingsCustomersColumns = [
  {
    header: "تاريخ البدء",
    accessor: "pivot.start_date",
    cellClassName: "text-center",
  },
  {
    header: "تاريخ الانتهاء",
    accessor: "pivot.end_date",
    cellClassName: "text-center",
  },
  {
    header: "ترميز اللوحة",
    accessor: "template.model",
    cellClassName: "text-center",
  },
  {
    header: "المدينة",
    accessor: "city",
    cellClassName: "text-center font-semibold text-blue-600 dark:text-blue-400",
  },
 
  {
    header: "التموضع",
    accessor: "place",
    cellClassName: "text-center font-semibold text-primary",
  },
  {
    header: "عدد الأوجه",
    accessor: "pivot.booking_faces",
    cellClassName: "text-center",
  },
  {
    header: "القياس",
    accessor: "template.size",
    cellClassName: "text-center",
  },
  {
    header: "المساحة (م²)",
    accessor: "template.advertising_space",
    cellClassName: "text-center",
  }, 
  {
    header: "عدد الأمتار الإعلانية",
    accessor: "total_advertising_space",
    cellClassName: "text-center",
  }, 
  {
    header: "الاتجاه",
    accessor: "direction",
    cellClassName: "text-center min-w-[200px]",
  },
];

export { ReportBookingsCustomersColumns };