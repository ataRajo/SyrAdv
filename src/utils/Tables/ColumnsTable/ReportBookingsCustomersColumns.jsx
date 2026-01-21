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
    header: "القياس",
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
    accessor: "direction", // This should work now
    cellClassName: "text-center",
  },
];

export { ReportBookingsCustomersColumns }; 