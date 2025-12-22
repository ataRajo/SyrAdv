export const OrdersColumns = [
  {
    header: "اسم الشركة",
    accessor: "customer.company_name",
    prefixIcon: "mdi:office-building",
    className: "min-w-[150px]",
    priority: 3,
  },
  {
    header: "الزبون الجديد",
    accessor: "customer_new.company_name",
    format: (value) => value ? value : "غير متوفر",
    prefixIcon: "mdi:office-building",
    className: "min-w-[150px]",
    priority: 3,
  },
  {
    header: "نوع الطلب",
    accessor: "type",
    prefixIcon: "mdi:format-list-bulleted-type",
    format: (value) => {
      const typeText = value === 1 ? "فك" : value === 2 ? "تركيب" : "فك و تركيب";
      const colorClass = value === 1 ? "text-red-600 bg-red-100" : 
                        value === 2 ? "text-green-600 bg-green-100" : 
                        "text-blue-600 bg-blue-100";
      
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
          {typeText}
        </span>
      );
    },
    className: "min-w-[100px]",
    priority: 4,
  },
  {
    header: "تاريخ الفك أو التركيب",
    accessor: "action_date",
    prefixIcon: "mdi:calendar",
    format: (value) => new Date(value).toLocaleDateString("ar-EG"), // Arabic date format
    className: "min-w-[120px]",
    priority: 5,
  },
  {
    header: "الملاحظة",
    accessor: "notes",
    prefixIcon: "mdi:note-text",
    className: "min-w-[100px]",
    priority: 6,
  },
  {
    header: "الحالة",
    accessor: "status",
    prefixIcon: "mdi:traffic-light",
    format: (value) => {
      const statusText = value === 0 ? "جاري العمل" : "تمت العملية";
      const colorClass = value === 0 ? "text-yellow-600 bg-yellow-100" : "text-green-600 bg-green-100";
      
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
          {statusText}
        </span>
      );
    },
    className: "min-w-[100px]",
    priority: 7,
  },
];