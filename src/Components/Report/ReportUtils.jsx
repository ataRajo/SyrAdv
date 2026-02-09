import { productTypeOptions } from "../../Static/StaticData";

// Cache for expensive calculations
const arabicMonths = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

// Using WeakMap for memory-safe caching
const dateCache = new WeakMap();
const advertisingSpaceCache = new WeakMap();

// Format date for Arabic display with caching
export const formatArabicDate = (dateString) => {
  if (!dateString) return 'غير محدد';
  
  // Create a simple key for caching
  const cacheKey = { dateString };
  
  // Check cache
  if (dateCache.has(cacheKey)) {
    return dateCache.get(cacheKey);
  }
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      dateCache.set(cacheKey, 'غير محدد');
      return 'غير محدد';
    }
    
    const day = date.getDate();
    const month = arabicMonths[date.getMonth()];
    const year = date.getFullYear();
    const result = `${day} ${month} ${year}`;
    
    // Cache the result
    dateCache.set(cacheKey, result);
    return result;
  } catch (error) {
    dateCache.set(cacheKey, 'غير محدد');
    return 'غير محدد';
  }
};

// Calculate total advertising space with caching
export const calculateTotalAdvertisingSpace = (data) => {
  if (!data || !Array.isArray(data)) return "0.00";
  
  // Check cache
  if (advertisingSpaceCache.has(data)) {
    return advertisingSpaceCache.get(data);
  }
  
  const result = data.reduce((total, item) => {
    const space = parseFloat(item.template?.advertising_space || item.advertising_space || 0);
    const faces = parseInt(item.faces_number || 1);
    return total + (space * faces);
  }, 0).toFixed(2);
  
  // Cache the result
  advertisingSpaceCache.set(data, result);
  return result;
};

// Calculate end date based on start date - optimized
export const calculateEndDate = (startDateString, daysToAdd = 6) => {
  if (!startDateString) return "";
  
  try {
    const date = new Date(startDateString);
    date.setDate(date.getDate() + daysToAdd);
    
    // Format manually without string manipulation
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    return "";
  }
};

// Get all unique template names from data - optimized
export const getAllTemplateNames = (data, isWeeklyReport) => {
  if (!data || !Array.isArray(data) || data.length === 0) return [];
  
  const templateNames = new Set();
  const length = data.length;
  
  // Use for loop for better performance with large arrays
  for (let i = 0; i < length; i++) {
    const item = data[i];
    const templateName = item.template?.model || item.template?.name || item.model;
    if (templateName) {
      templateNames.add(templateName);
    }
  }
  
  // Convert to array and sort once
  return Array.from(templateNames).sort();
};

// Get all customers from weekly data - optimized
export const getAllCustomers = (weeklyData) => {
  if (!weeklyData || !Array.isArray(weeklyData) || weeklyData.length === 0) return [];
  
  const customers = new Map();
  const dataLength = weeklyData.length;
  
  for (let i = 0; i < dataLength; i++) {
    const item = weeklyData[i];
    const bookings = item.bookings;
    
    if (bookings && bookings.length > 0) {
      const bookingsLength = bookings.length;
      
      for (let j = 0; j < bookingsLength; j++) {
        const booking = bookings[j];
        const customer = booking.customer;
        
        if (customer && customer.id) {
          const customerName = customer.full_name || customer.company_name;
          if (customerName) {
            customers.set(customer.id, {
              id: customer.id,
              name: customerName,
              company: customer.company_name
            });
          }
        }
      }
    }
  }
  
  // Sort once at the end
  const sortedCustomers = Array.from(customers.values());
  sortedCustomers.sort((a, b) => a.name.localeCompare(b.name));
  
  return sortedCustomers;
};

// Memoized cell renderers to prevent recreating functions
const getRoadsignCodeCell = (row) => row.roadsign_code || `X${row.id?.toString().padStart(6, '0')}`;

const getModelCell = (row) => row.template?.model || row.template?.name || "غير محدد";

const getAdvertisingSpaceCell = (row) => {
  const space = parseFloat(row.template?.advertising_space || row.advertising_space || 0);
  const faces = parseInt(row.faces_number || 1);
  return (space * faces).toFixed(2);
};

const getAdvertisingSpaceCellDetails = (row) => {
  const space = parseFloat(row.template?.advertising_space || 0);
  const faces = parseInt(row.faces_number || 1);
  return (space * faces).toFixed(2);
};

const getCityCell = (row) => row.city?.name || "غير محدد";

const getRegionCell = (row) => row.region?.name || "غير محدد";

const getPlaceCell = (row) => row.place || "غير محدد";

const getDirectionsCell = (row) => row.directions || row.direction || "غير محدد";

const getFacesNumberCell = (row) => row.faces_number || 1;

const getCustomerNameCell = (row) => {
  if (row.bookings && row.bookings.length > 0) {
    const booking = row.bookings[0];
    return booking.customer?.full_name || booking.customer?.company_name || "غير محدد";
  }
  return "غير محدد";
};

const getStatusCell = (row) => row.is_booked ? "محجوزة" : "متاحة";

const getStatusCellClassName = (row) => row.is_booked 
  ? "text-center text-red-600 font-bold" 
  : "text-center text-green-600 font-bold";

// Table column definitions - using memoized functions
export const weeklyTableColumns = [
  {
    header: "كود اللوحة",
    accessor: "roadsign_code",
    cell: getRoadsignCodeCell,
    cellClassName: "text-center font-mono bg-blue-50 dark:bg-blue-900/20"
  },
  {
    header: "النموذج",
    accessor: "model",
    cell: getModelCell,
    cellClassName: "text-center"
  },
  {
    header: "المساحة (م²)",
    accessor: "advertising_space",
    cell: getAdvertisingSpaceCell,
    cellClassName: "text-center font-bold"
  },
  {
    header: "الاتجاه",
    accessor: "directions",
    cell: getDirectionsCell,
    cellClassName: "text-center"
  },
  {
    header: "عدد الأوجه",
    accessor: "faces_number",
    cell: getFacesNumberCell,
    cellClassName: "text-center"
  },
  {
    header: "المدينة",
    accessor: "city.name",
    cell: getCityCell,
    cellClassName: "text-center"
  },
  {
    header: "المنطقة",
    accessor: "region.name",
    cell: getRegionCell,
    cellClassName: "text-center"
  },
  {
    header: "المكان",
    accessor: "place",
    cell: getPlaceCell,
    cellClassName: "text-right"
  },
  {
    header: "اسم العميل",
    accessor: "customer.name",
    cell: getCustomerNameCell,
    cellClassName: "text-center bg-yellow-100 dark:bg-yellow-900/30 font-bold text-yellow-800 dark:text-yellow-200"
  },
];

export const detailsTableColumns = [
  {
    header: "كود اللوحة",
    accessor: "roadsign_code",
    cell: getRoadsignCodeCell,
    cellClassName: "text-center font-mono"
  },
  {
    header: "النموذج",
    accessor: "template.model",
    cell: getModelCell,
    cellClassName: "text-center"
  },
  {
    header: "المساحة (م²)",
    accessor: "advertising_space",
    cell: getAdvertisingSpaceCellDetails,
    cellClassName: "text-center font-bold"
  },
  {
    header: "عدد الأوجه",
    accessor: "faces_number",
    cell: getFacesNumberCell,
    cellClassName: "text-center"
  },
  {
    header: "المدينة",
    accessor: "city.name",
    cell: getCityCell,
    cellClassName: "text-center"
  },
  {
    header: "المنطقة",
    accessor: "region.name",
    cell: getRegionCell,
    cellClassName: "text-center"
  },
  {
    header: "المكان",
    accessor: "place",
    cell: getPlaceCell,
    cellClassName: "text-right"
  },
  {
    header: "الاتجاه",
    accessor: "directions",
    cell: getDirectionsCell,
    cellClassName: "text-center"
  },
  {
    header: "الحالة",
    accessor: "is_booked",
    cell: getStatusCell,
    cellClassName: getStatusCellClassName
  }
];

export const createMemoizedColumns = (isWeeklyReport) => {
  return isWeeklyReport ? weeklyTableColumns : detailsTableColumns;
};