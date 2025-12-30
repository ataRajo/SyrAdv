const ProductType = {
  1: "Local",
  2: "Foreign",
  3: "Both",
};

export const RoadSignColumns = [
  {
    header: "كود اللوحة",
    accessor: "roadsign_code",
    className: "min-w-[100px] sm:min-w-[120px] md:min-w-[140px] text-center",
    cellClassName: "text-center font-mono font-semibold text-blue-600",
    priority: 1,
    format: (value) => value || "---",
  },
  {
    header: "كود الاتجاه",
    accessor: "direction_code",
    prefixIcon: "mdi:arrow-right-bold",
    className: "min-w-[80px] sm:min-w-[90px] md:min-w-[100px] text-center",
    cellClassName: "text-center font-mono font-semibold text-green-600",
    priority: 2,
    format: (value) => value || "---",
  },
  {
    header: "اسم العميل",
    accessor: "bookings",
    prefixIcon: "mdi:account",
    className: "min-w-[120px] sm:min-w-[140px] md:min-w-[160px]",
    priority: 5,
    format: (bookings) => {
      if (!bookings || !Array.isArray(bookings) || bookings.length === 0) {
        return "لا يوجد حجوزات";
      }
      
      const firstBooking = bookings[0];
      if (firstBooking?.customer?.full_name) {
        return firstBooking.customer.full_name;
      }
      
      return "لا يوجد حجوزات";
    },
  },
  {
    header: "نموذج",
    accessor: "template.model",
    prefixIcon: "mdi:package-variant",
    className: "min-w-[80px] sm:min-w-[100px] md:min-w-[120px]",
    priority: 8,
  },
  {
    header: "القياس",
    accessor: "template.size",
    prefixIcon: "mdi:ruler-square",
    className: "text-right min-w-[80px] sm:min-w-[100px] md:min-w-[120px]",
    cellClassName: "text-right font-mono",
    priority: 7,
  },
  {
    header: "المدينة",
    accessor: "city.name",
    prefixIcon: "mdi:city",
    className: "min-w-[80px] sm:min-w-[100px] md:min-w-[120px]",
    priority: 9,
  },
  {
    header: "المنطقة",
    accessor: "region.name",
    prefixIcon: "mdi:map",
    className: "min-w-[80px] sm:min-w-[100px] md:min-w-[120px]",
    priority: 10,
  },
  {
    header: "مكان التموضع",
    accessor: "place",
    prefixIcon: "mdi:map-marker",
    className: "min-w-[120px] sm:min-w-[140px] md:min-w-[160px]",
    priority: 6,
  },
  {
    header: "الاتجاه",
    accessor: "directions",
    prefixIcon: "mdi:compass",
    className: "min-w-[80px] sm:min-w-[100px] md:min-w-[120px]",
    priority: 7,
  },
  {
    header: "عدد الوجوه",
    accessor: "faces_number",
    prefixIcon: "mdi:cube-outline",
    className: "min-w-[80px] sm:min-w-[90px] md:min-w-[100px] text-center",
    cellClassName: "text-center font-mono",
    priority: 8,
  },
  {
    header: "عدد اللوحات",
    accessor: "panels_number",
    prefixIcon: "mdi:package-variant",
    className: "min-w-[80px] sm:min-w-[90px] md:min-w-[100px] text-center",
    cellClassName: "text-center font-mono",
    priority: 8,
  },
];