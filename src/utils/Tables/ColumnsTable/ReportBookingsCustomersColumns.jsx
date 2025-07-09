// Columns for Bookings This Week
export const ReportBookingsCustomersColumns = [
   {
    header: "ترميز اللوحة",
    accessor: "template.model",
    cellClassName: "text-center",
  },
   {
    header: "التموضع",
    accessor: "place",
    cellClassName: "text-center",
  },
   {
    header: "عدد الأوجه",
    accessor: "pivot.booking_faces",
    cellClassName: "text-center",
  },
  {
    header: "  القياس",
    accessor: "template.advertising_space",
    cellClassName: "text-center",
  }, 
   {
    header: "عدد الأمتار الإعلانية",
    accessor: "total_advertising_space",
    cellClassName: "text-center",
  }, 
];