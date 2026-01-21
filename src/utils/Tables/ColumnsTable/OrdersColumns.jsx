export const OrdersColumns = [
  {
    header: "اسم الشركة",
    accessor: "customer.company_name",
    prefixIcon: "mdi:office-building",
    className: "min-w-[150px]",
    priority: 3,
    format: (value, row) => (
      <div className="flex flex-col">
        <span className="font-medium">{value || "غير متوفر"}</span>
        {row.customer_new?.company_name && (
          <span className="text-xs text-green-600 font-semibold mt-1">
            ← {row.customer_new.company_name}
          </span>
        )}
      </div>
    ),
  },
  {
    header: "المدينة",
    accessor: "road_sign.city.name",
    prefixIcon: "mdi:city",
    className: "min-w-[120px]",
    priority: 2,
    format: (value) => (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        {value || "غير محدد"}
      </span>
    ),
  },
  {
    header: "المنطقة",
    accessor: "road_sign.region.name",
    prefixIcon: "mdi:map-marker",
    className: "min-w-[130px]",
    priority: 2,
    format: (value) => (
      <span className="text-sm text-gray-600">{value || "غير محددة"}</span>
    ),
  },
  {
    header: "كود اللوحة",
    accessor: "road_sign.roadsign_code",
    prefixIcon: "mdi:numeric",
    className: "min-w-[120px]",
    priority: 3,
    format: (value) => (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 font-mono">
        {value || "غير محدد"}
      </span>
    ),
  },
  {
    header: "نوع الطلب",
    accessor: "type",
    prefixIcon: "mdi:format-list-bulleted-type",
    format: (value) => {
      const typeText = value === 1 ? "فك" : value === 2 ? "تركيب" : "فك و تركيب";
      const colorClass = value === 1 
        ? "bg-red-100 text-red-800 border border-red-300 font-bold px-3 py-1 rounded-lg" 
        : value === 2 
        ? "bg-green-100 text-green-800 border border-green-300 font-bold px-3 py-1 rounded-lg"
        : "bg-blue-100 text-blue-800 border border-blue-300 font-bold px-3 py-1 rounded-lg";
      
      return (
        <span className={`text-sm ${colorClass}`}>
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
    format: (value) => (
      <div className="flex flex-col">
        <span className="font-medium">{new Date(value).toLocaleDateString("ar-EG")}</span>
        <span className="text-xs text-gray-500">
          {new Date(value).toLocaleDateString("en-US")}
        </span>
      </div>
    ),
    className: "min-w-[120px] font-medium",
    priority: 5,
  },
  {
    header: "الملاحظة",
    accessor: "notes",
    prefixIcon: "mdi:note-text",
    format: (value) => (
      <span className={`text-sm ${value ? 'text-gray-700' : 'text-gray-400 italic'}`}>
        {value || "لا يوجد"}
      </span>
    ),
    className: "min-w-[100px]",
    priority: 6,
  },
  {
    header: "الحالة",
    accessor: "status",
    prefixIcon: "mdi:traffic-light",
    format: (value) => (
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${value === 0 ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
        <span className={`font-bold ${value === 0 ? "text-yellow-600" : "text-green-600"}`}>
          {value === 0 ? "جاري العمل" : "تمت العملية"}
        </span>
      </div>
    ),
    className: "min-w-[100px]",
    priority: 7,
  },
];