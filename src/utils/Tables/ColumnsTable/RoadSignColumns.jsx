import toast from "react-hot-toast";

const ProductType = {
  1: "Local",
  2: "Foreign",
  3: "Both",
};

// Helper function to copy location link to clipboard
const copyLocationLink = async (lat, lng, roadsignCode) => {
  const googleMapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
  try {
    await navigator.clipboard.writeText(googleMapsLink);
    toast.success(`تم نسخ رابط موقع اللوحة ${roadsignCode}`, {
      duration: 2000,
      position: "top-center",
    });
  } catch (err) {
    toast.error("فشل نسخ الرابط", {
      duration: 2000,
      position: "top-center",
    });
  }
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

  /*
  {
  header: "اسم الشركة", // Changed from "اسم العميل" to "اسم الشركة"
  accessor: "bookings",
  prefixIcon: "mdi:account",
  className: "min-w-[120px] sm:min-w-[140px] md:min-w-[160px]",
  priority: 5,
  format: (bookings) => {
    if (!bookings || !Array.isArray(bookings) || bookings.length === 0) {
      return "لا يوجد حجوزات";
    }
    
    const firstBooking = bookings[0];
    // Display company_name instead of full_name
    if (firstBooking?.customer?.company_name) {
      return firstBooking.customer.company_name;
    }
    
    return "لا يوجد حجوزات";
  },
},

*/

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
  // NEW COLUMN: موقع اللوحة (Copy Location Link)
  {
    header: "موقع اللوحة",
    accessor: "latitudeX", // Use a string accessor, not a function
    prefixIcon: "mdi:map-marker-radius",
    className: "min-w-[100px] sm:min-w-[120px] md:min-w-[140px] text-center",
    cellClassName: "text-center",
    priority: 4,
    // Use format function that receives the ENTIRE row
    format: (value, row) => {
      const lat = row.latitudeX;
      const lng = row.longitudeY;
      const roadsignCode = row.roadsign_code || "اللوحة";
      
      if (!lat || !lng) {
        return (
          <span className="text-gray-400 text-xs">
            لا يوجد موقع
          </span>
        );
      }
      
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            copyLocationLink(lat, lng, roadsignCode);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-all duration-200 text-sm font-medium border border-indigo-200 hover:border-indigo-300"
          title="نسخ رابط الموقع من خرائط جوجل"
        >
          <svg 
            className="w-4 h-4" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span className="hidden sm:inline">نسخ الموقع</span>
          <span className="sm:hidden">نسخ</span>
        </button>
      );
    },
  },
];