// Columns for Bookings This Week
export const ReportBookingsColumns = [
  
  
 
  {
    header: "عدد الوجوه",
    accessor: "faces_number",
    cellClassName: "text-center",
  },
  
  {
    header: "النموذج",
    accessor: "template.model",
    cellClassName: "text-center",
  },
  {
    header: "الموقع",
    accessor: "place",
    cellClassName: "text-center",
  },
  {
    header: "المنطقة",
    accessor: "region.name",
    cellClassName: "text-center",
  },
  {
    header: "اسم الشركة",
    accessor: "bookings.0.customer.company_name",
    cellClassName: "text-center",
  }
 
];