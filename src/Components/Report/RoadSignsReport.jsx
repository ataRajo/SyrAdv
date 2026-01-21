import { DynamicTable } from "../../utils/Tables/DynamicTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportBookingsColumns } from "../../utils/Tables/ColumnsTable/ReportBookingsColumns";
import { ReportUnbookedSignsColumns } from "../../utils/Tables/ColumnsTable/ReportUnbookedSignsColumns";
import { Loader, FileText, Printer, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import useReports from "../../hooks/useReports";
import { jsPDF } from "jspdf";
import { useState, useEffect, useRef, useMemo } from "react";
import { productTypeOptions } from "../../Static/StaticData";
import html2canvas from "html2canvas";
import logo from '../../assets/images/adv_syrian.png';

const getBase64FromUrl = (url) => {
  return fetch(url)
    .then(res => res.blob())
    .then(blob => new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    }));
};

const RoadSignsReport = ({ isWeeklyReport = true }) => {
  const {
    setActiveTab,
    cityId,
    regionId,
    model,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    cities,
    isCitiesLoading,
    regions,
    isRegionsLoading,
    getRoadSignsModel,
    isGetRoadSignsModel,
    bookingsData,
    isBookingsLoading,
    isBookingsFetching,
    unbookedSignsData,
    isUnbookedLoading,
    isUnbookedFetching,
    handleCityChange,
    handleRegionChange,
    handleModelChange,
    selectedCustomerId,
    customersData,
    isCustomersLoading,
    customersError,
    handleCustomerChange,
  } = useReports();

  const [bookingsPage, setBookingsPage] = useState(1);
  const [unbookedPage, setUnbookedPage] = useState(1);
  const [bookingsPageSize, setBookingsPageSize] = useState(50);
  const [unbookedPageSize, setUnbookedPageSize] = useState(50);
  
  const pageSizeOptions = [10, 25, 50, 100, 250];

  const groupRoadSigns = (roadSigns, isUnbooked = false) => {
    if (!roadSigns || !Array.isArray(roadSigns)) return [];
    
    const groupedMap = {};
    
    roadSigns.forEach(sign => {
      const place = sign?.place || 'غير محدد';
      const model = sign?.template?.model || sign?.template?.name || 'غير محدد';
      const direction = sign?.directions || sign?.direction || 'غير محدد';
      
      const key = `${place}|${model}|${direction}`;
      
      if (!groupedMap[key]) {
        groupedMap[key] = {
          ...sign,
          key: key,
          place: place,
          model: model,
          direction: direction,
          groupedRecords: [sign],
          allPlaces: new Set([place]),
          ...(isUnbooked ? {} : {
            bookings: sign.bookings ? [{
              ...sign.bookings[0],
              pivot: {
                ...sign.bookings[0]?.pivot,
                booking_faces: sign.bookings[0]?.pivot?.booking_faces || 0,
                total_booking_faces: sign.bookings[0]?.pivot?.booking_faces || 0
              }
            }] : null
          }),
          grouped_count: 1,
          template: sign.template,
          region: sign.region
        };
      } else {
        const existing = groupedMap[key];
        existing.groupedRecords.push(sign);
        existing.grouped_count += 1;
        
        existing.allPlaces.add(place);
        
        if (!isUnbooked && sign.bookings?.[0]?.pivot?.booking_faces && existing.bookings?.[0]?.pivot) {
          existing.bookings[0].pivot.booking_faces = 
            (existing.bookings[0].pivot.booking_faces || 0) + 
            (sign.bookings[0].pivot.booking_faces || 0);
          existing.bookings[0].pivot.total_booking_faces = 
            (existing.bookings[0].pivot.total_booking_faces || 0) + 
            (sign.bookings[0].pivot.booking_faces || 0);
        }
      }
    });
    
    return Object.values(groupedMap).map(group => {
      group.allPlaces = Array.from(group.allPlaces || []);
      
      if (!isUnbooked && group.grouped_count > 1 && group.groupedRecords.length > 0) {
        const startDates = group.groupedRecords
          .map(record => record.bookings?.[0]?.start_date)
          .filter(Boolean);
        const endDates = group.groupedRecords
          .map(record => record.bookings?.[0]?.end_date)
          .filter(Boolean);
        
        if (startDates.length > 0 && endDates.length > 0) {
          const earliestStart = startDates.reduce((earliest, current) => 
            current < earliest ? current : earliest
          );
          const latestEnd = endDates.reduce((latest, current) => 
            current > latest ? current : latest
          );
          
          return {
            ...group,
            bookings: group.bookings ? [{
              ...group.bookings[0],
              start_date: `${earliestStart} (${group.grouped_count})`,
              end_date: `${latestEnd} (${group.grouped_count})`,
              pivot: {
                ...group.bookings[0]?.pivot,
                booking_faces: group.bookings[0]?.pivot?.booking_faces || 0
              }
            }] : null
          };
        }
      }
      
      return group;
    });
  };

  const handleExportWord = async (isUnbooked = false) => {
    const dataToExport = isUnbooked ? filteredUnbookedData : filteredBookingsData;
    
    if (dataToExport.length === 0) {
      alert(`لا توجد بيانات ${isUnbooked ? 'لللوحات غير المحجوزة' : 'للتصدير'}`);
      return;
    }

    setIsGeneratingPDF(true);

    try {
      const logoBase64 = await getBase64FromUrl(logo);
      const htmlContent = isUnbooked ? createUnbookedWordHTML() : createReportHTML();
const wordContent = `
  <html xmlns:v="urn:schemas-microsoft-com:vml"
        xmlns:o="urn:schemas-microsoft-com:office:office"
        xmlns:w="urn:schemas-microsoft-com:office:word"
        xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta charset="UTF-8">
    <!--[if gte mso 9]>
    <xml>
      <w:WordDocument>
        <w:View>Print</w:View>
        <w:Zoom>100</w:Zoom>
        <w:DoNotOptimizeForBrowser/>
      </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
      body {
        font-family: 'Traditional Arabic', Arial, sans-serif;
        direction: rtl;
        text-align: right;
        margin: 20px;
        background-color: #ffffff;
        color: #333333;
      }
      .header {
        text-align: center;
        margin-bottom: 30px;
        padding-bottom: 15px;
        border-bottom: 3px solid #2c5282;
      }
     
      h1 {
        color: #2c5282;
        margin: 10px 0;
        font-size: 24px;
      }
      h2 {
        color: #2d3748;
        margin: 15px 0 10px 0;
        font-size: 20px;
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 5px;
      }
      h3 {
        color: #4a5568;
        margin: 12px 0 8px 0;
        font-size: 18px;
      }
      table {
        border-collapse: collapse;
        width: 100%;
        margin: 15px 0;
        border: 2px solid #2c5282;
        font-size: 14px;
      }
      th {
        background-color: #2c5282;
        color: white;
        padding: 10px 8px;
        border: 1px solid #1a365d;
        font-weight: bold;
        text-align: center;
      }
      td {
        border: 1px solid #a0aec0;
        padding: 8px;
        text-align: center;
      }
      tr:nth-child(even) {
        background-color: #f7fafc;
      }
      tr:hover {
        background-color: #ebf8ff;
      }
      .product-type-header {
        background-color: #4a5568;
        color: white;
        padding: 12px;
        margin: 20px 0 10px 0;
        border-radius: 4px;
        font-weight: bold;
      }
      .customer-header {
        background-color: #2d3748;
        color: white;
        padding: 10px;
        margin: 15px 0 10px 0;
        border-radius: 4px;
        font-weight: bold;
      }
      .city-header {
        background-color: #742a2a;
        color: white;
        padding: 12px;
        margin: 20px 0 10px 0;
        border-radius: 4px;
        font-weight: bold;
      }
      .stats-box {
        background-color: #e6fffa;
        border: 2px solid #38b2ac;
        padding: 12px;
        margin: 15px 0;
        border-radius: 6px;
        font-weight: bold;
        color: #234e52;
      }
      .warning-box {
        background-color: #fed7d7;
        border: 2px solid #e53e3e;
        padding: 10px;
        margin: 15px 0;
        border-radius: 6px;
        color: #742a2a;
      }
      .info-box {
        background-color: #bee3f8;
        color: #2c5282;
        padding: 10px;
        margin: 15px 0;
        /* Removed border line */
        border: none;
      }
      .sign-code {
        font-family: 'Courier New', monospace;
        direction: ltr;
        text-align: left;
        background-color: #f7fafc;
        padding: 3px 6px;
        border-radius: 3px;
        border: 1px solid #cbd5e0;
      }
      .footer {
        text-align: center;
        margin-top: 40px;
        color: #718096;
        font-size: 12px;
        border-top: 1px solid #e2e8f0;
        padding-top: 15px;
      }
      .total-cell {
        background-color: #c6f6d5;
        font-weight: bold;
        color: #22543d;
      }
      .meter-cell {
        background-color: #fed7d7;
        font-weight: bold;
        color: #742a2a;
      }
      .space-cell {
        background-color: #e9d8fd;
        font-weight: bold;
        color: #553c9a;
      }
      .bold {
        font-weight: bold;
      }
      .text-right {
        text-align: right;
      }
      .text-center {
        text-align: center;
      }
      .text-left {
        text-align: left;
      }
      .mb-3 {
        margin-bottom: 15px;
      }
      .mt-3 {
        margin-top: 15px;
      }
      .p-3 {
        padding: 12px;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>${isUnbooked ? 'تقرير اللوحات غير المحجوزة' : (isWeeklyReport ? 'التقرير العام ' : 'تقرير تفاصيل اللوحات')}</h1>
      <div class="info-box">
        <div>تاريخ التقرير: ${formatArabicDate(new Date())}</div>
        <div>الفترة: من ${fromDate ? formatArabicDate(fromDate) : "غير محدد"} إلى ${toDate ? formatArabicDate(toDate) : "غير محدد"}</div>
        ${templateNameFilter ? `<div>فلتر القالب: <span class="bold">${templateNameFilter}</span></div>` : ''}
      </div>
    </div>
    ${htmlContent}
    <div class="footer">
      <p>تم الإنشاء آلياً بواسطة نظام الإعلانات - ${new Date().getFullYear()}</p>
      <p>تاريخ الطباعة: ${formatArabicDate(new Date())}</p>
    </div>
  </body>
  </html>
`;

      const blob = new Blob([wordContent], { type: "application/msword" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `تقرير_${isUnbooked ? 'اللوحات_غير_المحجوزة' : isWeeklyReport ? 'أسبوعي' : 'تفاصيل_اللوحات'}_${new Date().toISOString().split("T")[0]}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Error exporting to Word:", error);
      alert("حدث خطأ أثناء التصدير إلى Word");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const calculateBookingAdvertisingSpace = (booking) => {
    if (!isWeeklyReport) return 0;
    
    if (booking.groupedRecords) {
      let totalSpace = 0;
      booking.groupedRecords.forEach(record => {
        const advertisingSpace = parseFloat(record.template?.advertising_space) || 0;
        const facesNumber = parseInt(record.faces_number) || 1;
        const bookingFaces = parseInt(record.bookings?.[0]?.pivot?.booking_faces) || 
                             parseInt(record.pivot?.booking_faces) || facesNumber;
        totalSpace += advertisingSpace * bookingFaces;
      });
      return totalSpace;
    }
    
    const advertisingSpace = parseFloat(booking.template?.advertising_space) || 0;
    const facesNumber = parseInt(booking.faces_number) || 1;
    const bookingFaces = parseInt(booking.bookings?.[0]?.pivot?.booking_faces) || 
                         parseInt(booking.pivot?.booking_faces) || facesNumber;
    return advertisingSpace * bookingFaces;
  };

  const calculateUnbookedAdvertisingSpace = (sign) => {
    if (!isWeeklyReport) return 0;
    
    const advertisingSpace = parseFloat(sign.template?.advertising_space) || 0;
    const facesNumber = parseInt(sign.faces_number) || 1;
    return advertisingSpace * facesNumber;
  };

  const [customerTypeFilter, setCustomerTypeFilter] = useState("");
  const [templateNameFilter, setTemplateNameFilter] = useState("");
  const [filteredBookingsData, setFilteredBookingsData] = useState([]);
  const [filteredUnbookedData, setFilteredUnbookedData] = useState([]);
  const [localFilters, setLocalFilters] = useState({
    cityId: "",
    regionId: "",
    model: "",
    fromDate: "",
    toDate: "",
    customerId: "",
  });

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const memoizedBookingsData = useMemo(() => {
    if (!bookingsData || !Array.isArray(bookingsData)) return [];

    let filtered = [...bookingsData];

    if (localFilters.cityId && localFilters.cityId !== "") {
      filtered = filtered.filter(booking => {
        const bookingCityId = booking.city_id || booking.city?.id;
        return bookingCityId === parseInt(localFilters.cityId);
      });
    }

    if (templateNameFilter && templateNameFilter !== "") {
      filtered = filtered.filter(booking => {
        const templateModel = booking.template?.model || booking.template?.name || '';
        return templateModel === templateNameFilter;
      });
    }

    if (isWeeklyReport && customerTypeFilter && customerTypeFilter !== "" && customersData && customersData.length > 0) {
      const selectedType = parseInt(customerTypeFilter);
      
      if (!isNaN(selectedType)) {
        const customersOfType = customersData.filter(customer => {
          const customerType = parseInt(customer.type);
          return !isNaN(customerType) && customerType === selectedType;
        });
        
        if (customersOfType.length > 0) {
          const customerIdsOfType = customersOfType.map(customer => customer.id);
          
          filtered = filtered.filter(booking => {
            const bookingCustomerId = booking.bookings?.[0]?.customer?.id || 
                                     booking.customer_id || 
                                     booking.customer?.id;
            
            if (!bookingCustomerId) return false;
            
            return customerIdsOfType.includes(parseInt(bookingCustomerId));
          });
        } else {
          filtered = [];
        }
      }
    }

    return filtered;
  }, [bookingsData, customerTypeFilter, customersData, localFilters.cityId, templateNameFilter, isWeeklyReport]);

  const memoizedUnbookedData = useMemo(() => {
    if (!unbookedSignsData || !Array.isArray(unbookedSignsData)) return [];

    let filtered = [...unbookedSignsData];
    
    if (localFilters.cityId && localFilters.cityId !== "") {
      filtered = filtered.filter(sign => {
        const signCityId = sign.city_id || sign.city?.id;
        return signCityId === parseInt(localFilters.cityId);
      });
    }

    if (templateNameFilter && templateNameFilter !== "") {
      filtered = filtered.filter(sign => {
        const templateModel = sign.template?.model || sign.template?.name || '';
        return templateModel === templateNameFilter;
      });
    }

    return filtered;
  }, [unbookedSignsData, localFilters.cityId, templateNameFilter]);

  const paginatedBookingsData = useMemo(() => {
    const startIndex = (bookingsPage - 1) * bookingsPageSize;
    const endIndex = startIndex + bookingsPageSize;
    return memoizedBookingsData.slice(startIndex, endIndex);
  }, [memoizedBookingsData, bookingsPage, bookingsPageSize]);

  const paginatedUnbookedData = useMemo(() => {
    const startIndex = (unbookedPage - 1) * unbookedPageSize;
    const endIndex = startIndex + unbookedPageSize;
    return memoizedUnbookedData.slice(startIndex, endIndex);
  }, [memoizedUnbookedData, unbookedPage, unbookedPageSize]);

  useEffect(() => {
    setLocalFilters(prev => ({
      ...prev,
      cityId: cityId || "",
      regionId: regionId || "",
      model: model || "",
      fromDate: fromDate || "",
      toDate: toDate || "",
      customerId: selectedCustomerId || "",
    }));
  }, [cityId, regionId, model, fromDate, toDate, selectedCustomerId]);

  const getAllTemplateNames = () => {
    const allData = [...(bookingsData || []), ...(unbookedSignsData || [])];
    const templateNames = new Set();
    
    allData.forEach(item => {
      const templateName = item.template?.model || item.template?.name;
      if (templateName) {
        templateNames.add(templateName);
      }
    });
    
    return Array.from(templateNames).sort();
  };

  const templateOptions = useMemo(() => getAllTemplateNames(), [bookingsData, unbookedSignsData]);

  const totalBookingsPages = useMemo(() => 
    Math.ceil((memoizedBookingsData?.length || 0) / bookingsPageSize),
    [memoizedBookingsData, bookingsPageSize]
  );

  const totalUnbookedPages = useMemo(() => 
    Math.ceil((memoizedUnbookedData?.length || 0) / unbookedPageSize),
    [memoizedUnbookedData, unbookedPageSize]
  );

  const handleBookingsPageSizeChange = (value) => {
    const newPageSize = parseInt(value);
    setBookingsPageSize(newPageSize);
    setBookingsPage(1);
  };

  const handleUnbookedPageSizeChange = (value) => {
    const newPageSize = parseInt(value);
    setUnbookedPageSize(newPageSize);
    setUnbookedPage(1);
  };

  useEffect(() => {
    setFilteredBookingsData(memoizedBookingsData);
    setBookingsPage(1);
  }, [memoizedBookingsData]);

  useEffect(() => {
    setFilteredUnbookedData(memoizedUnbookedData);
    setUnbookedPage(1);
  }, [memoizedUnbookedData]);

  const customerTypeOptions = isWeeklyReport ? [
    { value: "", label: "جميع الأنواع" },
    ...productTypeOptions.map(option => ({
      value: option.value,
      label: option.label
    }))
  ] : [];

  const handleFilterChange = (filterName, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleDateChange = (dateType, value) => {
    if (dateType === 'fromDate') {
      setFromDate(value);
      handleFilterChange('fromDate', value);
    } else if (dateType === 'toDate') {
      setToDate(value);
      handleFilterChange('toDate', value);
    }
  };

  const clearAllFilters = () => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    setFromDate(today.toISOString().split('T')[0]);
    setToDate(nextWeek.toISOString().split('T')[0]);
    
    setCustomerTypeFilter("");
    setTemplateNameFilter("");
    handleCityChange({ target: { value: "" } });
    
    setLocalFilters({
      cityId: "",
      regionId: "",
      model: "",
      fromDate: today.toISOString().split('T')[0],
      toDate: nextWeek.toISOString().split('T')[0],
      customerId: "",
    });
    
    setBookingsPage(1);
    setUnbookedPage(1);
  };

  const calculateTotalAdvertisingSpace = (data) => {
    if (!isWeeklyReport) return "0.00";
    return data.reduce((total, booking) => {
      return total + calculateBookingAdvertisingSpace(booking);
    }, 0).toFixed(2);
  };

  const calculateTotalUnbookedAdvertisingSpace = (data) => {
    if (!isWeeklyReport) return "0.00";
    return data.reduce((total, sign) => {
      return total + calculateUnbookedAdvertisingSpace(sign);
    }, 0).toFixed(2);
  };

  const getCustomerTypeLabel = () => {
    if (!isWeeklyReport || !customerTypeFilter) return "";
    const option = productTypeOptions.find(opt => opt.value == customerTypeFilter);
    return option ? option.label : "";
  };

  const formatArabicDate = (dateString) => {
    if (!dateString) return 'غير محدد';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'غير محدد';
      
      const arabicMonths = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
      ];
      const day = date.getDate();
      const month = arabicMonths[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch (error) {
      return 'غير محدد';
    }
  };

const normalizeSize = (size) => {
  if (!size) return "غير محدد";

  // Convert to string and trim
  size = String(size).trim();

  // Handle empty cases
  if (!size || size === 'null' || size === 'undefined' || size === '') {
    return "غير محدد";
  }

  console.log('Processing size input:', size); // Debug

  // Pattern 1: "X 100 200" → "200 X 100"
  const xWithSpacesMatch = size.match(/^[xX]\s+(\d+)\s+(\d+)/i);
  if (xWithSpacesMatch) {
    const num1 = xWithSpacesMatch[1];
    const num2 = xWithSpacesMatch[2];
    // Put the larger number first: 200 X 100
    const larger = Math.max(parseInt(num1), parseInt(num2));
    const smaller = Math.min(parseInt(num1), parseInt(num2));
    return `${larger} X ${smaller}`;
  }

  // Pattern 2: "X100200" (compact, no spaces) → "200 X 100"
  const xCompactMatch = size.match(/^[xX](\d+)(\d{3,})/i);
  if (xCompactMatch) {
    const firstNum = parseInt(xCompactMatch[1]);
    const secondNum = parseInt(xCompactMatch[2]);
    const larger = Math.max(firstNum, secondNum);
    const smaller = Math.min(firstNum, secondNum);
    return `${larger} X ${smaller}`;
  }

  // Pattern 3: "100X200" or "100 X 200" → "200 X 100"
  const middleXMatch = size.match(/(\d+)\s*[xX]\s*(\d+)/i);
  if (middleXMatch) {
    const num1 = parseInt(middleXMatch[1]);
    const num2 = parseInt(middleXMatch[2]);
    const larger = Math.max(num1, num2);
    const smaller = Math.min(num1, num2);
    return `${larger} X ${smaller}`;
  }

  // Pattern 4: "100 200" (just two numbers) → "200 X 100"
  const twoNumbersMatch = size.match(/(\d+)\s+(\d+)/);
  if (twoNumbersMatch) {
    const num1 = parseInt(twoNumbersMatch[1]);
    const num2 = parseInt(twoNumbersMatch[2]);
    const larger = Math.max(num1, num2);
    const smaller = Math.min(num1, num2);
    return `${larger} X ${smaller}`;
  }

  // Pattern 5: Any two numbers in the string
  const anyNumbersMatch = size.match(/\d+/g);
  if (anyNumbersMatch && anyNumbersMatch.length >= 2) {
    const num1 = parseInt(anyNumbersMatch[0]);
    const num2 = parseInt(anyNumbersMatch[1]);
    const larger = Math.max(num1, num2);
    const smaller = Math.min(num1, num2);
    return `${larger} X ${smaller}`;
  }

  // Fallback: Clean and return
  const cleaned = size.replace(/[xX×]/g, ' ')
                     .replace(/\s+/g, ' ')
                     .trim();
  
  return cleaned || "غير محدد";
};


  const createReportHTML = () => {
    const customerTypeLabel = getCustomerTypeLabel();
    const currentDate = formatArabicDate(new Date());
    const fromDateText = fromDate ? formatArabicDate(fromDate) : "غير محدد";
    const toDateText = toDate ? formatArabicDate(toDate) : "غير محدد";
    
    const groupedData = groupRoadSigns(filteredBookingsData, false);

    let html = '';
    
    if (isWeeklyReport) {
      const groupedByProductType = {};
      
      productTypeOptions.forEach(type => {
        groupedByProductType[type.value] = {
          label: type.label,
          bookings: [],
          totalBookings: 0,
          customers: {},
          totalSpace: 0
        };
      });

      groupedByProductType["unknown"] = {
        label: "غير معروف",
        bookings: [],
        totalBookings: 0,
        customers: {},
        totalSpace: 0
      };

      groupedData.forEach(booking => {
        const customerId = booking.bookings?.[0]?.customer?.id || 
                          booking.customer_id || 
                          booking.customer?.id;
        
        let productType = "unknown";
        
        if (customerId && customersData) {
          const customer = customersData.find(c => c.id === parseInt(customerId));
          if (customer && customer.type) {
            productType = customer.type;
          }
        }
        
        if (!groupedByProductType[productType]) {
          groupedByProductType[productType] = {
            label: `نوع النموذج ${productType}`,
            bookings: [],
            totalBookings: 0,
            customers: {},
            totalSpace: 0
          };
        }
        
        const bookingSpace = calculateBookingAdvertisingSpace(booking);
        groupedByProductType[productType].bookings.push(booking);
        groupedByProductType[productType].totalBookings += 1;
        groupedByProductType[productType].totalSpace += bookingSpace;
        
        if (!groupedByProductType[productType].customers[customerId]) {
          let customerName = "غير معروف";
          if (customerId && customersData) {
            const customer = customersData.find(c => c.id === parseInt(customerId));
            if (customer) {
              customerName = customer.company_name || customer.full_name || `زبون #${customerId}`;
            }
          }
          groupedByProductType[productType].customers[customerId] = {
            name: customerName,
            bookings: [],
            totalSpace: 0
          };
        }
        
        groupedByProductType[productType].customers[customerId].bookings.push(booking);
        groupedByProductType[productType].customers[customerId].totalSpace += bookingSpace;
      });

      html = `
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #1a365d; margin-bottom: 10px;">${isWeeklyReport ? 'التقرير العام ' : 'تقرير تفاصيل اللوحات'}</h1>
          <div>تاريخ التقرير: ${currentDate}</div>
          <div>الفترة: من ${fromDateText} إلى ${toDateText}</div>
          ${isWeeklyReport && customerTypeLabel ? `<div>نوع المنتج: ${customerTypeLabel}</div>` : ''}
          ${templateNameFilter ? `<div>فلتر القالب: ${templateNameFilter}</div>` : ''}
        </div>
      `;

      const totalSpace = groupedData.reduce((total, booking) => total + calculateBookingAdvertisingSpace(booking), 0);
      if (isWeeklyReport && totalSpace > 0) {
        html += `
          <div style="background-color: #dbeafe; color: #1e40af; font-weight: bold; padding: 12px; text-align: center; border: 2px solid #3b82f6; border-radius: 6px; margin: 20px 0;">
            إجمالي الأمتار الإعلانية: ${totalSpace.toFixed(2)} متر مربع
          </div>
        `;
      }

      Object.entries(groupedByProductType).forEach(([typeKey, typeData]) => {
        if (typeData.totalBookings === 0) return;
        
        html += `
          <div style="margin-bottom: 25px; border: 1px solid #ddd; border-radius: 5px;">
            <div style="background-color: #2c5282; color: white; padding: 10px; border-radius: 5px 5px 0 0;">
              نوع المنتج: ${typeData.label}
              ${isWeeklyReport ? `<span style="float: left;">إجمالي: ${typeData.totalSpace.toFixed(2)} م²</span>` : ''}
            </div>
        `;
        
        Object.values(typeData.customers).forEach((customer, customerIndex) => {
          html += `
            <div style="margin: 15px;">
              <div style="background-color: yellow; color: #000; padding: 8px; border-radius: 4px; margin-bottom: 10px; font-weight: bold;">
                العميل: ${customer.name}
                ${isWeeklyReport ? `<span style="float: left;">إجمالي: ${customer.totalSpace.toFixed(2)} م²</span>` : ''}
              </div>
              
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background-color: #e9ecef;">
                    <th style="border: 1px solid #ddd; padding: 6px;">م</th>
                    <th style="border: 1px solid #ddd; padding: 6px;">النموذج</th>
                    <th style="border: 1px solid #ddd; padding: 6px;">القياس</th>
                    <th style="border: 1px solid #ddd; padding: 6px;">عدد الأوجه</th>
                    ${isWeeklyReport ? '<th style="border: 1px solid #ddd; padding: 6px;">المساحة (م²)</th>' : ''}
                    <th style="border: 1px solid #ddd; padding: 6px;">المنطقة</th>
                    <th style="border: 1px solid #ddd; padding: 6px;">الاتجاه</th>
                    <th style="border: 1px solid #ddd; padding: 6px;">الأماكن</th>
                  </tr>
                </thead>
                <tbody>
          `;
          
          customer.bookings.forEach((booking, index) => {
            const faces = booking.bookings?.[0]?.pivot?.booking_faces || 
                         booking.pivot?.booking_faces || 
                         booking.faces_number || 1;
            const templateName = booking.template?.model || booking.template?.name || "غير معروف";
            const templateSize = normalizeSize(booking.template?.size);

            const direction = booking.directions || booking.direction || "غير محدد";
            const regionName = booking.region?.name || booking.region_name || "غير محدد";
            const isGrouped = booking.grouped_count > 1;
            const bookingSpace = calculateBookingAdvertisingSpace(booking);
            
            let displayPlaces = [];
            
            if (isGrouped && booking.groupedRecords && booking.groupedRecords.length > 0) {
              const placesSet = new Set();
              booking.groupedRecords.forEach(record => {
                if (record.place) {
                  placesSet.add(record.place.trim());
                }
              });
              displayPlaces = Array.from(placesSet);
            } else if (isGrouped && booking.allPlaces && booking.allPlaces.length > 0) {
              displayPlaces = booking.allPlaces.map(place => place.trim());
            } else {
              const place = booking.place || "غير محدد";
              if (place) {
                displayPlaces = [place.trim()];
              }
            }
            
            displayPlaces = displayPlaces.filter(place => place && place.trim() !== '');
            let placesDisplay = displayPlaces.length > 0 ? displayPlaces.join("، ") : "غير محدد";
            
            const displayFaces = isGrouped ? booking.grouped_count : faces;
            
            html += `
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${index + 1}</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${templateName}</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">
  <span dir="ltr" style="unicode-bidi: bidi-override;">${templateSize}</span>
</td>
</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">
                  ${displayFaces}
                  ${isGrouped ? `<br/><small>(مجموعة من ${booking.grouped_count} سجل)</small>` : ''}
                </td>
                ${isWeeklyReport ? `<td style="border: 1px solid #ddd; padding: 6px; text-align: center; font-weight: bold;">${bookingSpace.toFixed(2)}</td>` : ''}
                <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${regionName}</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${direction}</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${placesDisplay}</td>
              </tr>
            `;
          });
          
          html += `
                </tbody>
              </table>
            </div>
          `;
        });
        
        html += `</div>`;
      });
    } else {
      const groupedByCustomer = {};
      
      groupedData.forEach(booking => {
        const customerId = booking.bookings?.[0]?.customer?.id || 
                          booking.customer_id || 
                          booking.customer?.id;
        
        if (!groupedByCustomer[customerId]) {
          let customerName = "غير معروف";
          if (customerId && customersData) {
            const customer = customersData.find(c => c.id === parseInt(customerId));
            if (customer) {
              customerName = customer.company_name || customer.full_name || `زبون #${customerId}`;
            }
          }
          
          groupedByCustomer[customerId] = {
            name: customerName,
            bookings: []
          };
        }
        
        groupedByCustomer[customerId].bookings.push(booking);
      });

      html = `
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #1a365d; margin-bottom: 10px;">تقرير تفاصيل اللوحات</h1>
          <div>تاريخ التقرير: ${currentDate}</div>
          <div>الفترة: من ${fromDateText} إلى ${toDateText}</div>
          ${templateNameFilter ? `<div>فلتر القالب: ${templateNameFilter}</div>` : ''}
        </div>
      `;

      Object.values(groupedByCustomer).forEach((customer, customerIndex) => {
        if (customer.bookings.length === 0) return;
        
        html += `
          <div style="margin-bottom: 25px; border: 1px solid #ddd; border-radius: 5px;">
            <div style="background-color: yellow; color: #000; padding: 8px; border-radius: 5px 5px 0 0; font-weight: bold;">
              العميل: ${customer.name}
            </div>
            
            <div style="margin: 15px;">
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background-color: #e9ecef;">
                    <th style="border: 1px solid #ddd; padding: 6px;">م</th>
                    <th style="border: 1px solid #ddd; padding: 6px;">النموذج</th>
                    <th style="border: 1px solid #ddd; padding: 6px;">القياس</th>
                    <th style="border: 1px solid #ddd; padding: 6px;">عدد الأوجه</th>
                    <th style="border: 1px solid #ddd; padding: 6px;">المنطقة</th>
                    <th style="border: 1px solid #ddd; padding: 6px;">الاتجاه</th>
                    <th style="border: 1px solid #ddd; padding: 6px;">الأماكن</th>
                  </tr>
                </thead>
                <tbody>
        `;
        
        customer.bookings.forEach((booking, index) => {
          const faces = booking.bookings?.[0]?.pivot?.booking_faces || 
                       booking.pivot?.booking_faces || 
                       booking.faces_number || 1;
          const templateName = booking.template?.model || booking.template?.name || "غير معروف";
          const templateSize = normalizeSize(booking.template?.size);

          const direction = booking.directions || booking.direction || "غير محدد";
          const regionName = booking.region?.name || booking.region_name || "غير محدد";
          const isGrouped = booking.grouped_count > 1;
          
          let displayPlaces = [];
          
          if (isGrouped && booking.groupedRecords && booking.groupedRecords.length > 0) {
            const placesSet = new Set();
            booking.groupedRecords.forEach(record => {
              if (record.place) {
                placesSet.add(record.place.trim());
              }
            });
            displayPlaces = Array.from(placesSet);
          } else if (isGrouped && booking.allPlaces && booking.allPlaces.length > 0) {
            displayPlaces = booking.allPlaces.map(place => place.trim());
          } else {
            const place = booking.place || "غير محدد";
            if (place) {
              displayPlaces = [place.trim()];
            }
          }
          
          displayPlaces = displayPlaces.filter(place => place && place.trim() !== '');
          let placesDisplay = displayPlaces.length > 0 ? displayPlaces.join("، ") : "غير محدد";
          
          const displayFaces = isGrouped ? booking.grouped_count : faces;
          
          html += `
            <tr>
              <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${index + 1}</td>
              <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${templateName}</td>
              <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">
  <span dir="ltr" style="unicode-bidi: bidi-override;">${templateSize}</span>
</td>
</td>
              <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">
                ${displayFaces}
                ${isGrouped ? `<br/><small>(مجموعة من ${booking.grouped_count} سجل)</small>` : ''}
              </td>
              <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${regionName}</td>
              <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${direction}</td>
              <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${placesDisplay}</td>
            </tr>
          `;
        });
        
        html += `
              </tbody>
            </table>
          </div>
        </div>
        `;
      });
    }

    html += `
      <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
        <p>تم الإنشاء آلياً بواسطة نظام ${isWeeklyReport ? 'التقرير العام ' : 'تفاصيل اللوحات'}</p>
        <p>تاريخ الطباعة: ${currentDate}</p>
        ${templateNameFilter ? `<p>فلتر القالب المطبق: ${templateNameFilter}</p>` : ''}
      </div>
    `;
    
    return html;
  };

  const createUnbookedWordHTML = () => {
    const currentDate = formatArabicDate(new Date());
    const fromDateText = fromDate ? formatArabicDate(fromDate) : "غير محدد";
    const toDateText = toDate ? formatArabicDate(toDate) : "غير محدد";
    
    const groupedData = groupRoadSigns(filteredUnbookedData, true);

    const groupedByCity = {};
    let totalMeters = isWeeklyReport ? 0 : 0;
    
    groupedData.forEach(sign => {
      const cityName = sign.city?.name || "غير معروف";
      const advertisingSpace = calculateUnbookedAdvertisingSpace(sign);
      if (isWeeklyReport) totalMeters += advertisingSpace;
      
      if (!groupedByCity[cityName]) {
        groupedByCity[cityName] = {
          signs: [],
          totalMeters: 0,
          totalCount: 0
        };
      }
      
      groupedByCity[cityName].signs.push(sign);
      groupedByCity[cityName].totalCount += 1;
      if (isWeeklyReport) groupedByCity[cityName].totalMeters += advertisingSpace;
    });

    let html = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #dc2626; margin-bottom: 10px;">${isWeeklyReport ? 'التقرير العام  - اللوحات غير المحجوزة' : 'تقرير اللوحات غير المحجوزة'}</h1>
        <div>تاريخ التقرير: ${currentDate}</div>
        <div>الفترة: من ${fromDateText} إلى ${toDateText}</div>
        <div>عدد اللوحات غير المحجوزة: ${groupedData.length} (بعد التجميع)</div>
        ${templateNameFilter ? `<div>فلتر القالب: ${templateNameFilter}</div>` : ''}
        <div style="color: #dc2626; background-color: #fef2f2; padding: 8px; margin-top: 10px;">
          ملاحظة: تم تجميع السجلات حسب المكان والنموذج والاتجاه
        </div>
        ${isWeeklyReport && totalMeters > 0 ? `
          <div style="background-color: #dbeafe; color: #1e40af; font-weight: bold; padding: 10px; margin-top: 15px; border: 2px solid #3b82f6; border-radius: 5px;">
            إجمالي الأمتار الإعلانية غير المحجوزة: ${totalMeters.toFixed(0)} متر مربع
          </div>
        ` : ''}
      </div>
    `;

    Object.entries(groupedByCity).forEach(([cityName, cityData]) => {
      if (cityData.signs.length === 0) return;
      
      html += `
        <div style="margin-bottom: 25px; border: 1px solid #ddd; border-radius: 5px;">
          <div style="background-color: #991b1b; color: white; padding: 10px; border-radius: 5px 5px 0 0;">
            المدينة: ${cityName}
          </div>
          
          <div style="background-color: #fee2e2; padding: 8px; display: flex; justify-content: space-between;">
            <span>عدد اللوحات: ${cityData.signs.length}</span>
            ${isWeeklyReport ? `<span>الإجمالي: ${cityData.totalMeters.toFixed(0)} متر مربع</span>` : ''}
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background-color: #dc2626; color: white;">
                <th style="border: 1px solid #ddd; padding: 6px; text-align: center;">م</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: center;">كود اللوحة</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: center;">النموذج</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: center;">عدد الأوجه</th>
                ${isWeeklyReport ? '<th style="border: 1px solid #ddd; padding: 6px; text-align: center;">الإجمالي (م²)</th>' : ''}
                <th style="border: 1px solid #ddd; padding: 6px; text-align: center;">المنطقة</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: center;">الاتجاه</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: center;">الأماكن</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      cityData.signs.forEach((sign, index) => {
        const advertisingSpace = calculateUnbookedAdvertisingSpace(sign);
        const faces = parseInt(sign.faces_number) || 1;
        const templateName = sign.template?.model || sign.template?.name || "غير معروف";
        const direction = sign.direction || sign.directions || "غير محدد";
        const regionName = sign.region?.name || sign.region_name || "غير محدد";
        const isGrouped = sign.grouped_count > 1;
        const signCode = sign.roadsign_code || `X${sign.id.toString().padStart(6, '0')}`;
        
        let displayPlaces = [];
        
        if (isGrouped && sign.groupedRecords && sign.groupedRecords.length > 0) {
          const placesSet = new Set();
          sign.groupedRecords.forEach(record => {
            if (record.place) {
              placesSet.add(record.place.trim());
            }
          });
          displayPlaces = Array.from(placesSet);
        } else if (isGrouped && sign.allPlaces && sign.allPlaces.length > 0) {
          displayPlaces = sign.allPlaces.map(place => place.trim());
        } else {
          const place = sign.place || "غير محدد";
          if (place) {
            displayPlaces = [place.trim()];
          }
        }
        
        displayPlaces = displayPlaces.filter(place => place && place.trim() !== '');
        let placesDisplay = displayPlaces.length > 0 ? displayPlaces.join("، ") : "غير محدد";
        
        const displayFaces = isGrouped ? sign.grouped_count : faces;
        
        html += `
          <tr>
            <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${index + 1}</td>
            <td style="border: 1px solid #ddd; padding: 6px; text-align: center; font-family: 'Courier New', monospace; direction: ltr;">${signCode}</td>
            <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${templateName}</td>
            <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">
              ${displayFaces}
              ${isGrouped ? `<br/><small style="color: #666; font-style: italic;">(مجموعة من ${sign.grouped_count} سجل)</small>` : ''}
            </td>
            ${isWeeklyReport ? `<td style="border: 1px solid #ddd; padding: 6px; text-align: center; font-weight: bold;">${advertisingSpace.toFixed(0)}</td>` : ''}
            <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${regionName}</td>
            <td style="border: 1px solid #ddd; padding: 6px; text-align: right; direction: rtl;">${direction}</td>
            <td style="border: 1px solid #ddd; padding: 6px; text-align: right; direction: rtl;">${placesDisplay}</td>
          </tr>
        `;
      });
      
      html += `
            </tbody>
          </table>
          <div style="background-color: #e9ecef; padding: 8px; margin-top: 10px; border-radius: 4px; font-weight: bold;">
            إجمالي مدينة ${cityName}: ${isWeeklyReport ? `${cityData.totalMeters.toFixed(0)} متر مربع` : `${cityData.totalCount} لوحة`}
          </div>
        </div>
      `;
    });

    html += `
      <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
        <p>تم الإنشاء آلياً بواسطة نظام ${isWeeklyReport ? 'التقرير العام ' : 'تفاصيل اللوحات'} - اللوحات غير المحجوزة</p>
        <p>ملاحظة: البيانات مجمعة حسب المكان والنموذج والاتجاه</p>
        ${templateNameFilter ? `<p>فلتر القالب المطبق: ${templateNameFilter}</p>` : ''}
        <p>تاريخ الطباعة: ${currentDate}</p>
      </div>
    `;
    
    return html;
  };

  // Function to convert logo to base64 for HTML2Canvas
  const getLogoBase64 = async () => {
    try {
      const response = await fetch(logo);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error loading logo:", error);
      return '';
    }
  };

  const createUnbookedReportHTML = async (groupedData) => {
    const currentDate = formatArabicDate(new Date());
    const fromDateText = fromDate ? formatArabicDate(fromDate) : "غير محدد";
    const toDateText = toDate ? formatArabicDate(toDate) : "غير محدد";
    
    const groupedByCity = {};
    let totalMeters = isWeeklyReport ? 0 : 0;
    
    groupedData.forEach(sign => {
      const cityName = sign.city?.name || "غير معروف";
      const advertisingSpace = calculateUnbookedAdvertisingSpace(sign);
      if (isWeeklyReport) totalMeters += advertisingSpace;
      
      if (!groupedByCity[cityName]) {
        groupedByCity[cityName] = {
          signs: [],
          totalMeters: 0,
          totalCount: 0
        };
      }
      
      groupedByCity[cityName].signs.push(sign);
      groupedByCity[cityName].totalCount += 1;
      if (isWeeklyReport) groupedByCity[cityName].totalMeters += advertisingSpace;
    });

    // Get logo as base64
    const logoBase64 = await getLogoBase64();

    let html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${isWeeklyReport ? 'التقرير العام  - اللوحات غير المحجوزة' : 'تقرير اللوحات غير المحجوزة'}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
          
          body {
            font-family: 'Amiri', serif;
            direction: rtl;
            background-color: #fff;
            color: #000;
            margin: 0;
            padding: 10px;
          }
          
          .header-container {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            margin-bottom: 20px;
            border-bottom: 2px solid #dc2626;
            padding-bottom: 15px;
            gap: 20px;
          }
          
          .logo-container {
            flex-shrink: 0;
            margin-top: 10px;
          }
          
          .logo {
            width: 100px;
            height: auto;
            max-width: 100px;
          }
          
          .header-content {
            flex-grow: 1;
            text-align: center;
          }
          
          .header-content h1 {
            color: #dc2626;
            margin-bottom: 10px;
            margin-top: 0;
          }
          
          ${isWeeklyReport ? `
          .total-meters {
            background-color: #dbeafe;
            color: #1e40af;
            font-weight: bold;
            padding: 12px;
            text-align: center;
            border: 2px solid #3b82f6;
            border-radius: 6px;
            margin: 20px 0;
            font-size: 18px;
          }
          ` : ''}
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 12px;
          }
          
          th {
            background-color: #dc2626;
            color: white;
            padding: 8px;
            text-align: center;
            border: 1px solid #ddd;
            font-size: 13px;
          }
          
          td {
            padding: 6px;
            text-align: center;
            border: 1px solid #ddd;
            font-size: 12px;
          }
          
          .city-header {
            background-color: #991b1b;
            color: white;
            padding: 10px;
            margin-top: 20px;
            border-radius: 5px 5px 0 0;
            font-size: 14px;
          }
          
          .city-stats {
            background-color: #fee2e2;
            padding: 8px;
            display: flex;
            justify-content: space-between;
            font-size: 13px;
          }
          
          .city-total {
            background-color: #e9ecef;
            padding: 8px;
            margin-top: 10px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 13px;
          }
          
          .sign-code {
            font-family: 'Courier New', monospace;
            direction: ltr;
            text-align: left;
            font-size: 11px;
          }
          
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 11px;
            border-top: 1px solid #ccc;
            padding-top: 15px;
          }
          
          .group-note {
            font-size: 10px;
            color: #666;
            font-style: italic;
          }
          
          ${isWeeklyReport ? `
          .total-meter-cell {
            font-weight: bold;
          }
          ` : ''}
          
          .direction-cell, .places-cell {
            text-align: right;
            direction: rtl;
          }
          
          @media print {
            body {
              padding: 5mm;
            }
            .logo {
              width: 80px;
            }
            table {
              font-size: 10px;
            }
            th, td {
              padding: 4px;
            }
          }
        </style>
      </head>
      <body>
        <div class="header-container">
          <div class="logo-container">
            <img src="${logoBase64}" alt="Logo" class="logo" />
          </div>
          <div class="header-content">
            <h1>${isWeeklyReport ? 'التقرير العام  - اللوحات غير المحجوزة' : 'تقرير اللوحات غير المحجوزة'}</h1>
            <div>تاريخ التقرير: ${currentDate}</div>
            <div>الفترة: من ${fromDateText} إلى ${toDateText}</div>
            <div>عدد اللوحات غير المحجوزة: ${groupedData.length} (بعد التجميع)</div>
            ${templateNameFilter ? `<div>فلتر القالب: ${templateNameFilter}</div>` : ''}
            <div style="color: #dc2626; background-color: #fef2f2; padding: 8px; margin-top: 10px; border-radius: 4px; font-size: 12px;">
              ملاحظة: تم تجميع السجلات حسب المكان والنموذج والاتجاه
            </div>
          </div>
        </div>
        
        ${isWeeklyReport && totalMeters > 0 ? `
          <div class="total-meters">
            إجمالي الأمتار الإعلانية غير المحجوزة: ${totalMeters.toFixed(0)} متر مربع
          </div>
        ` : ''}
    `;

    Object.entries(groupedByCity).forEach(([cityName, cityData]) => {
      if (cityData.signs.length === 0) return;
      
      html += `
        <div class="city-header">
          المدينة: ${cityName}
        </div>
        
        <div class="city-stats">
          <span>عدد اللوحات: ${cityData.signs.length}</span>
          ${isWeeklyReport ? `<span>الإجمالي: ${cityData.totalMeters.toFixed(0)} متر مربع</span>` : ''}
        </div>
        
        <table>
          <thead>
            <tr>
              <th>م</th>
              <th>كود اللوحة</th>
              <th>النموذج</th>
              <th>عدد الأوجه</th>
              ${isWeeklyReport ? '<th>الإجمالي (م²)</th>' : ''}
              <th>المنطقة</th>
              <th>الاتجاه</th>
              <th>الأماكن</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      cityData.signs.forEach((sign, index) => {
        const advertisingSpace = calculateUnbookedAdvertisingSpace(sign);
        const faces = parseInt(sign.faces_number) || 1;
        const templateName = sign.template?.model || sign.template?.name || "غير معروف";
        const direction = sign.direction || sign.directions || "غير محدد";
        const regionName = sign.region?.name || sign.region_name || "غير محدد";
        const isGrouped = sign.grouped_count > 1;
        const signCode = sign.roadsign_code || `X${sign.id.toString().padStart(6, '0')}`;
        
        let displayPlaces = [];
        
        if (isGrouped && sign.groupedRecords && sign.groupedRecords.length > 0) {
          const placesSet = new Set();
          sign.groupedRecords.forEach(record => {
            if (record.place) {
              placesSet.add(record.place.trim());
            }
          });
          displayPlaces = Array.from(placesSet);
        } else if (isGrouped && sign.allPlaces && sign.allPlaces.length > 0) {
          displayPlaces = sign.allPlaces.map(place => place.trim());
        } else {
          const place = sign.place || "غير محدد";
          if (place) {
            displayPlaces = [place.trim()];
          }
        }
        
        displayPlaces = displayPlaces.filter(place => place && place.trim() !== '');
        let placesDisplay = displayPlaces.length > 0 ? displayPlaces.join("، ") : "غير محدد";
        
        const displayFaces = isGrouped ? sign.grouped_count : faces;
        
        html += `
          <tr>
            <td>${index + 1}</td>
            <td class="sign-code">${signCode}</td>
            <td>${templateName}</td>
            <td>
              ${displayFaces}
              ${isGrouped ? '<div class="group-note">(مجموعة)</div>' : ''}
            </td>
            ${isWeeklyReport ? `<td class="${isWeeklyReport ? 'total-meter-cell' : ''}">${advertisingSpace.toFixed(0)}</td>` : ''}
            <td>${regionName}</td>
            <td class="direction-cell">${direction}</td>
            <td class="places-cell">${placesDisplay}</td>
          </tr>
        `;
      });
      
      html += `
          </tbody>
        </table>
        <div class="city-total">
          إجمالي مدينة ${cityName}: ${isWeeklyReport ? `${cityData.totalMeters.toFixed(0)} متر مربع` : `${cityData.totalCount} لوحة`}
        </div>
      </div>
      `;
    });

    html += `
        <div class="footer">
          <p>تم الإنشاء آلياً بواسطة نظام ${isWeeklyReport ? 'التقرير العام ' : 'تفاصيل اللوحات'} - اللوحات غير المحجوزة</p>
          <p>ملاحظة: البيانات مجمعة حسب المكان والنموذج والاتجاه</p>
          ${templateNameFilter ? `<p>فلتر القالب المطبق: ${templateNameFilter}</p>` : ''}
          <p>تاريخ الطباعة: ${currentDate}</p>
        </div>
      </body>
      </html>
    `;
    
    return html;
  };

  const handlePrintReport = async () => {
    if (filteredBookingsData.length === 0) {
      alert("لا توجد بيانات للطباعة");
      return;
    }

    setIsGeneratingPDF(true);
    
    try {
      const htmlContent = await createReportHTMLForPDF();
      
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      
      if (!printWindow) {
        alert('يرجى السماح بالنوافذ المنبثقة لهذا الموقع');
        setIsGeneratingPDF(false);
        return;
      }
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      printWindow.onload = () => {
        setTimeout(async () => {
          try {
            const canvas = await html2canvas(printWindow.document.body, {
              scale: 2,
              useCORS: true,
              logging: false,
              backgroundColor: '#ffffff',
              allowTaint: true
            });
            
            const pdf = new jsPDF({
              orientation: 'portrait',
              unit: 'mm',
              format: 'a4'
            });
            
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const imgWidth = 210;
            const pageHeight = 297;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            let heightLeft = imgHeight;
            let position = 0;
            
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
            
            while (heightLeft > 0) {
              position = heightLeft - imgHeight;
              pdf.addPage();
              pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
              heightLeft -= pageHeight;
            }
            
            const fileName = `${isWeeklyReport ? 'التقرير_الأسبوعي' : 'تفاصيل_اللوحات'}_${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);
            
            printWindow.close();
            
          } catch (error) {
            console.error('Error generating PDF:', error);
            alert('حدث خطأ أثناء إنشاء PDF. يرجى المحاولة مرة أخرى.');
          } finally {
            setIsGeneratingPDF(false);
          }
        }, 1500);
      };
      
    } catch (error) {
      console.error('Error in print report:', error);
      alert('حدث خطأ. يرجى المحاولة مرة أخرى.');
      setIsGeneratingPDF(false);
    }
  };

  const createReportHTMLForPDF = async () => {
    const customerTypeLabel = getCustomerTypeLabel();
    const currentDate = formatArabicDate(new Date());
    const fromDateText = fromDate ? formatArabicDate(fromDate) : "غير محدد";
    const toDateText = toDate ? formatArabicDate(toDate) : "غير محدد";
    
    const groupedData = groupRoadSigns(filteredBookingsData, false);

    // Get logo as base64
    const logoBase64 = await getLogoBase64();

    let html = '';
    
    if (isWeeklyReport) {
      const groupedByProductType = {};
      
      productTypeOptions.forEach(type => {
        groupedByProductType[type.value] = {
          label: type.label,
          bookings: [],
          totalBookings: 0,
          customers: {},
          totalSpace: 0
        };
      });

      groupedByProductType["unknown"] = {
        label: "غير معروف",
        bookings: [],
        totalBookings: 0,
        customers: {},
        totalSpace: 0
      };

      groupedData.forEach(booking => {
        const customerId = booking.bookings?.[0]?.customer?.id || 
                          booking.customer_id || 
                          booking.customer?.id;
        
        let productType = "unknown";
        
        if (customerId && customersData) {
          const customer = customersData.find(c => c.id === parseInt(customerId));
          if (customer && customer.type) {
            productType = customer.type;
          }
        }
        
        if (!groupedByProductType[productType]) {
          groupedByProductType[productType] = {
            label: `نوع النموذج ${productType}`,
            bookings: [],
            totalBookings: 0,
            customers: {},
            totalSpace: 0
          };
        }
        
        const bookingSpace = calculateBookingAdvertisingSpace(booking);
        groupedByProductType[productType].bookings.push(booking);
        groupedByProductType[productType].totalBookings += 1;
        groupedByProductType[productType].totalSpace += bookingSpace;
        
        if (!groupedByProductType[productType].customers[customerId]) {
          let customerName = "غير معروف";
          if (customerId && customersData) {
            const customer = customersData.find(c => c.id === parseInt(customerId));
            if (customer) {
              customerName = customer.company_name || customer.full_name || `زبون #${customerId}`;
            }
          }
          groupedByProductType[productType].customers[customerId] = {
            name: customerName,
            bookings: [],
            totalSpace: 0
          };
        }
        
        groupedByProductType[productType].customers[customerId].bookings.push(booking);
        groupedByProductType[productType].customers[customerId].totalSpace += bookingSpace;
      });

      html = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${isWeeklyReport ? 'التقرير العام ' : 'تقرير تفاصيل اللوحات'}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
            
            body {
              font-family: 'Amiri', serif;
              direction: rtl;
              background-color: #fff;
              color: #000;
              margin: 0;
              padding: 10px;
            }
            
            .header-container {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              margin-bottom: 20px;
              border-bottom: 2px solid #1a365d;
              padding-bottom: 15px;
              gap: 20px;
            }
            
            .logo-container {
              flex-shrink: 0;
              margin-top: 10px;
            }
            
            .logo {
              width: 100px;
              height: auto;
              max-width: 100px;
            }
            
            .header-content {
              flex-grow: 1;
              text-align: center;
            }
            
            .header-content h1 {
              color: #1a365d;
              margin-bottom: 10px;
              margin-top: 0;
            }
            
            ${isWeeklyReport ? `
            .total-space {
              background-color: #dbeafe;
              color: #1e40af;
              font-weight: bold;
              padding: 12px;
              text-align: center;
              border: 2px solid #3b82f6;
              border-radius: 6px;
              margin: 20px 0;
              font-size: 18px;
            }
            ` : ''}
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              font-size: 12px;
            }
            
            th {
              background-color: #e9ecef;
              color: black;
              padding: 8px;
              text-align: center;
              border: 1px solid #ddd;
              font-size: 13px;
            }
            
            td {
              padding: 6px;
              text-align: center;
              border: 1px solid #ddd;
              font-size: 12px;
            }
            
            .product-type-header {
              background-color: #2c5282;
              color: white;
              padding: 10px;
              margin-top: 20px;
              border-radius: 5px 5px 0 0;
              font-size: 14px;
            }
            
            .customer-header {
              background-color: yellow;
              color: #000;
              padding: 8px;
              margin: 15px 0 10px 0;
              font-weight: bold;
              border-radius: 4px;
              font-size: 13px;
            }
            
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 11px;
              border-top: 1px solid #ccc;
              padding-top: 15px;
            }
            
            .group-note {
              font-size: 10px;
              color: #666;
              font-style: italic;
            }
            
            ${isWeeklyReport ? `
            .space-cell {
              font-weight: bold;
            }
            ` : ''}
            
            .direction-cell {
              text-align: right;
              direction: rtl;
            }
            
            .places-cell {
              text-align: right;
              direction: rtl;
              max-width: 150px;
              word-wrap: break-word;
            }
            
            @media print {
              body {
                padding: 5mm;
              }
              .logo {
                width: 80px;
              }
              table {
                font-size: 10px;
              }
              th, td {
                padding: 4px;
              }
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div class="logo-container">
              <img src="${logoBase64}" alt="Logo" class="logo" />
            </div>
            <div class="header-content">
              <h1>${isWeeklyReport ? 'التقرير العام ' : 'تقرير تفاصيل اللوحات'}</h1>
              <div>تاريخ التقرير: ${currentDate}</div>
              <div>الفترة: من ${fromDateText} إلى ${toDateText}</div>
              ${isWeeklyReport && customerTypeLabel ? `<div>نوع المنتج: ${customerTypeLabel}</div>` : ''}
              ${templateNameFilter ? `<div>فلتر القالب: ${templateNameFilter}</div>` : ''}
            </div>
          </div>
      `;

      const totalSpace = groupedData.reduce((total, booking) => total + calculateBookingAdvertisingSpace(booking), 0);
      if (isWeeklyReport && totalSpace > 0) {
        html += `
          <div class="total-space">
            إجمالي الأمتار الإعلانية: ${totalSpace.toFixed(2)} متر مربع
          </div>
        `;
      }

      Object.entries(groupedByProductType).forEach(([typeKey, typeData]) => {
        if (typeData.totalBookings === 0) return;
        
        html += `
          <div class="product-type-header">
            نوع المنتج: ${typeData.label}
            ${isWeeklyReport ? `<span style="float: left;">إجمالي: ${typeData.totalSpace.toFixed(2)} م²</span>` : ''}
          </div>
        `;
        
        Object.values(typeData.customers).forEach((customer, customerIndex) => {
          html += `
            <div style="margin: 15px 0;">
              <div class="customer-header">
                العميل: ${customer.name}
                ${isWeeklyReport ? `<span style="float: left;">إجمالي: ${customer.totalSpace.toFixed(2)} م²</span>` : ''}
              </div>
              
              <table>
                <thead>
                  <tr>
                    <th>م</th>
                    <th>النموذج</th>
                    <th>القياس</th>
                    <th>عدد الأوجه</th>
                    ${isWeeklyReport ? '<th>المساحة (م²)</th>' : ''}
                    <th>المنطقة</th>
                    <th>الاتجاه</th>
                    <th>الأماكن</th>
                  </tr>
                </thead>
                <tbody>
          `;
          
          customer.bookings.forEach((booking, index) => {
            const faces = booking.bookings?.[0]?.pivot?.booking_faces || 
                         booking.pivot?.booking_faces || 
                         booking.faces_number || 1;
            const templateName = booking.template?.model || booking.template?.name || "غير معروف";
            const templateSize = normalizeSize(booking.template?.size);

            const direction = booking.directions || booking.direction || "غير محدد";
            const regionName = booking.region?.name || booking.region_name || "غير محدد";
            const isGrouped = booking.grouped_count > 1;
            const bookingSpace = calculateBookingAdvertisingSpace(booking);
            
            let displayPlaces = [];
            
            if (isGrouped && booking.groupedRecords && booking.groupedRecords.length > 0) {
              const placesSet = new Set();
              booking.groupedRecords.forEach(record => {
                if (record.place) {
                  placesSet.add(record.place.trim());
                }
              });
              displayPlaces = Array.from(placesSet);
            } else if (isGrouped && booking.allPlaces && booking.allPlaces.length > 0) {
              displayPlaces = booking.allPlaces.map(place => place.trim());
            } else {
              const place = booking.place || "غير محدد";
              if (place) {
                displayPlaces = [place.trim()];
              }
            }
            
            displayPlaces = displayPlaces.filter(place => place && place.trim() !== '');
            let placesDisplay = displayPlaces.length > 0 ? displayPlaces.join("، ") : "غير محدد";
            
            const displayFaces = isGrouped ? booking.grouped_count : faces;
            
            html += `
              <tr>
                <td>${index + 1}</td>
                <td>${templateName}</td>
                <td><span dir="ltr" style="unicode-bidi: bidi-override;">${templateSize}</span></td>

                <td>
                  ${displayFaces}
                  ${isGrouped ? '<div class="group-note">(مجموعة)</div>' : ''}
                </td>
                ${isWeeklyReport ? `<td class="space-cell">${bookingSpace.toFixed(2)}</td>` : ''}
                <td>${regionName}</td>
                <td class="direction-cell">${direction}</td>
                <td class="places-cell">${placesDisplay}</td>
              </tr>
            `;
          });
          
          html += `
                </tbody>
              </table>
            </div>
          `;
        });
      });
    } else {
      const groupedByCustomer = {};
      
      groupedData.forEach(booking => {
        const customerId = booking.bookings?.[0]?.customer?.id || 
                          booking.customer_id || 
                          booking.customer?.id;
        
        if (!groupedByCustomer[customerId]) {
          let customerName = "غير معروف";
          if (customerId && customersData) {
            const customer = customersData.find(c => c.id === parseInt(customerId));
            if (customer) {
              customerName = customer.company_name || customer.full_name || `زبون #${customerId}`;
            }
          }
          
          groupedByCustomer[customerId] = {
            name: customerName,
            bookings: []
          };
        }
        
        groupedByCustomer[customerId].bookings.push(booking);
      });

      html = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>تقرير تفاصيل اللوحات</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
            
            body {
              font-family: 'Amiri', serif;
              direction: rtl;
              background-color: #fff;
              color: #000;
              margin: 0;
              padding: 10px;
            }
            
            .header-container {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              margin-bottom: 20px;
              border-bottom: 2px solid #1a365d;
              padding-bottom: 15px;
              gap: 20px;
            }
            
            .logo-container {
              flex-shrink: 0;
              margin-top: 10px;
            }
            
            .logo {
              width: 100px;
              height: auto;
              max-width: 100px;
            }
            
            .header-content {
              flex-grow: 1;
              text-align: center;
            }
            
            .header-content h1 {
              color: #1a365d;
              margin-bottom: 10px;
              margin-top: 0;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              font-size: 12px;
            }
            
            th {
              background-color: #e9ecef;
              color: black;
              padding: 8px;
              text-align: center;
              border: 1px solid #ddd;
              font-size: 13px;
            }
            
            td {
              padding: 6px;
              text-align: center;
              border: 1px solid #ddd;
              font-size: 12px;
            }
            
            .customer-header {
              background-color: yellow;
              color: #000;
              padding: 8px;
              margin: 15px 0 10px 0;
              font-weight: bold;
              border-radius: 4px;
              font-size: 13px;
            }
            
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 11px;
              border-top: 1px solid #ccc;
              padding-top: 15px;
            }
            
            .group-note {
              font-size: 10px;
              color: #666;
              font-style: italic;
            }
            
            .direction-cell {
              text-align: right;
              direction: rtl;
            }
            
            .places-cell {
              text-align: right;
              direction: rtl;
              max-width: 150px;
              word-wrap: break-word;
            }
            
            @media print {
              body {
                padding: 5mm;
              }
              .logo {
                width: 80px;
              }
              table {
                font-size: 10px;
              }
              th, td {
                padding: 4px;
              }
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div class="logo-container">
              <img src="${logoBase64}" alt="Logo" class="logo" />
            </div>
            <div class="header-content">
              <h1>تقرير تفاصيل اللوحات</h1>
              <div>تاريخ التقرير: ${currentDate}</div>
              <div>الفترة: من ${fromDateText} إلى ${toDateText}</div>
              ${templateNameFilter ? `<div>فلتر القالب: ${templateNameFilter}</div>` : ''}
            </div>
          </div>
      `;

      Object.values(groupedByCustomer).forEach((customer, customerIndex) => {
        if (customer.bookings.length === 0) return;
        
        html += `
          <div class="customer-header">
            العميل: ${customer.name}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>م</th>
                <th>النموذج</th>
                <th>القياس</th>
                <th>عدد الأوجه</th>
                <th>المنطقة</th>
                <th>الاتجاه</th>
                <th>الأماكن</th>
              </tr>
            </thead>
            <tbody>
        `;
        
        customer.bookings.forEach((booking, index) => {
          const faces = booking.bookings?.[0]?.pivot?.booking_faces || 
                       booking.pivot?.booking_faces || 
                       booking.faces_number || 1;
          const templateName = booking.template?.model || booking.template?.name || "غير معروف";
          const templateSize = normalizeSize(booking.template?.size);

          const direction = booking.directions || booking.direction || "غير محدد";
          const regionName = booking.region?.name || booking.region_name || "غير محدد";
          const isGrouped = booking.grouped_count > 1;
          
          let displayPlaces = [];
          
          if (isGrouped && booking.groupedRecords && booking.groupedRecords.length > 0) {
            const placesSet = new Set();
            booking.groupedRecords.forEach(record => {
              if (record.place) {
                placesSet.add(record.place.trim());
              }
            });
            displayPlaces = Array.from(placesSet);
          } else if (isGrouped && booking.allPlaces && booking.allPlaces.length > 0) {
            displayPlaces = booking.allPlaces.map(place => place.trim());
          } else {
            const place = booking.place || "غير محدد";
            if (place) {
              displayPlaces = [place.trim()];
            }
          }
          
          displayPlaces = displayPlaces.filter(place => place && place.trim() !== '');
          let placesDisplay = displayPlaces.length > 0 ? displayPlaces.join("، ") : "غير محدد";
          
          const displayFaces = isGrouped ? booking.grouped_count : faces;
          
          html += `
            <tr>
              <td>${index + 1}</td>
              <td>${templateName}</td>
<td><span dir="ltr" style="unicode-bidi: bidi-override;">${templateSize}</span></td>
              <td>
                ${displayFaces}
                ${isGrouped ? '<div class="group-note">(مجموعة)</div>' : ''}
              </td>
              <td>${regionName}</td>
              <td class="direction-cell">${direction}</td>
              <td class="places-cell">${placesDisplay}</td>
            </tr>
          `;
        });
        
        html += `
            </tbody>
          </table>
        `;
      });
    }

    html += `
        <div class="footer">
          <p>تم الإنشاء آلياً بواسطة نظام ${isWeeklyReport ? 'التقرير العام ' : 'تفاصيل اللوحات'}</p>
          <p>تاريخ الطباعة: ${currentDate}</p>
          ${templateNameFilter ? `<p>فلتر القالب المطبق: ${templateNameFilter}</p>` : ''}
        </div>
      </body>
      </html>
    `;
    
    return html;
  };

  const handleSimplePrint = async () => {
    if (filteredBookingsData.length === 0) {
      alert("لا توجد بيانات للطباعة");
      return;
    }

    const htmlContent = await createReportHTMLForPDF();
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (!printWindow) {
      alert('يرجى السماح بالنوافذ المنبثقة لهذا الموقع');
      return;
    }
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  };

  const generateUnbookedPdf = async () => {
    if (filteredUnbookedData.length === 0) {
      alert("لا توجد بيانات للطباعة");
      return;
    }

    setIsGeneratingPDF(true);
    
    try {
      const groupedData = groupRoadSigns(filteredUnbookedData, true);
      const htmlContent = await createUnbookedReportHTML(groupedData);
      
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      
      if (!printWindow) {
        alert('يرجى السماح بالنوافذ المنبثقة لهذا الموقع');
        setIsGeneratingPDF(false);
        return;
      }
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      printWindow.onload = () => {
        setTimeout(async () => {
          try {
            const canvas = await html2canvas(printWindow.document.body, {
              scale: 2,
              useCORS: true,
              logging: false,
              backgroundColor: '#ffffff',
              allowTaint: true
            });
            
            const pdf = new jsPDF({
              orientation: 'portrait',
              unit: 'mm',
              format: 'a4'
            });
            
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const imgWidth = 210;
            const pageHeight = 297;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            let heightLeft = imgHeight;
            let position = 0;
            
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
            
            while (heightLeft > 0) {
              position = heightLeft - imgHeight;
              pdf.addPage();
              pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
              heightLeft -= pageHeight;
            }
            
            const fileName = `${isWeeklyReport ? 'التقرير_الأسبوعي' : 'تفاصيل_اللوحات'}_غير_المحجوزة_${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);
            
            printWindow.close();
            
          } catch (error) {
            console.error('Error generating PDF:', error);
            alert('حدث خطأ أثناء إنشاء PDF. يرجى المحاولة مرة أخرى.');
          } finally {
            setIsGeneratingPDF(false);
          }
        }, 1500);
      };
      
    } catch (error) {
      console.error('Error in print report:', error);
      alert('حدث خطأ. يرجى المحاولة مرة أخرى.');
      setIsGeneratingPDF(false);
    }
  };

 const formatIndividualUnbookedSign = (sign) => {
  const advertisingSpace = parseFloat(sign.template?.advertising_space) || 0;
  const facesNumber = parseInt(sign.faces_number) || 1;
  const totalAdvertisingSpace = advertisingSpace * facesNumber;
  
  // Here you're looking for sign.directions or sign.direction
  const direction = sign.directions || sign.direction || "غير محدد";
  
  return {
    ...sign,
    id: sign.id,
    roadsign_code: sign.roadsign_code || `X${sign.id.toString().padStart(6, '0')}`,
    place: sign.place || 'غير محدد',
    template_name: sign.template?.model || sign.template?.name || 'غير محدد',
    advertising_space: isWeeklyReport ? totalAdvertisingSpace.toFixed(0) : undefined,
    region_name: sign.region?.name || 'غير محدد',
    direction: direction, // This should show the directions from your data
    faces_number: sign.faces_number || 1,
    panels_number: sign.panels_number || 1
  };
};

  const Pagination = ({ currentPage, totalPages, onPageChange, dataType, pageSize, onPageSizeChange }) => {
    if (totalPages <= 1 && pageSize === pageSizeOptions[0]) return null;
    
    const pagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(pagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + pagesToShow - 1);
    
    if (endPage - startPage + 1 < pagesToShow) {
      startPage = Math.max(1, endPage - pagesToShow + 1);
    }
    
    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="pageSize" className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
              عدد السجلات:
            </Label>
            <Select value={pageSize.toString()} onValueChange={onPageSizeChange}>
              <SelectTrigger className="w-[100px] h-9">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((option) => (
                  <SelectItem key={option} value={option.toString()}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="hidden sm:block text-sm text-gray-500 dark:text-gray-400">
            | عرض {dataType === 'bookings' ? 
              `${paginatedBookingsData.length} من ${memoizedBookingsData.length}` :
              `${paginatedUnbookedData.length} من ${memoizedUnbookedData.length}`
            } سجل
          </div>
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-1">
              {startPage > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(1)}
                    className="px-3 py-1 min-w-[40px]"
                  >
                    1
                  </Button>
                  {startPage > 2 && <span className="px-1 text-gray-500">...</span>}
                </>
              )}
              
              {pages.map(page => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page)}
                  className="px-3 py-1 min-w-[40px]"
                >
                  {page}
                </Button>
              ))}
              
              {endPage < totalPages && (
                <>
                  {endPage < totalPages - 1 && <span className="px-1 text-gray-500">...</span>}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(totalPages)}
                    className="px-3 py-1 min-w-[40px]"
                  >
                    {totalPages}
                  </Button>
                </>
              )}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        )}
        
        <div className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
          الصفحة {currentPage} من {totalPages}
        </div>
      </div>
    );
  };

  if (isBookingsLoading || isUnbookedLoading || isCustomersLoading) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center">
        <Loader />
        <p className="text-muted-foreground text-sm">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-full mx-auto space-y-6 bg-background rounded-lg shadow-sm dark:shadow-gray-800">
      <h2 className="text-2xl font-bold text-foreground mb-4">{isWeeklyReport ? 'التقرير العام ' : 'تفاصيل اللوحات'}</h2>
      
      <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
        <h3 className="font-semibold text-yellow-700 dark:text-yellow-300">
          ملاحظة: الجدول يظهر السجلات الفردية - التجميع يكون في التقرير PDF فقط
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          في الجدول: جميع السجلات الفردية | في PDF: يتم دمج السجلات المتشابهة في المكان والنموذج والاتجاه
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${isWeeklyReport ? '4' : '3'} gap-4 mb-6">
        <div>
          <Label
            htmlFor="city"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            المدينة
          </Label>
          <select
            id="city"
            value={localFilters.cityId || ""}
            onChange={(e) => {
              handleCityChange(e);
              handleFilterChange('cityId', e.target.value);
            }}
            disabled={isCitiesLoading}
            className="w-full p-2 border dark:bg-gray-900 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">جميع المدن</option>
            {isCitiesLoading && <option>جاري تحميل المدن ...</option>}
            {cities?.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label
            htmlFor="templateFilter"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            اسم القالب
          </Label>
          <select
            id="templateFilter"
            value={templateNameFilter}
            onChange={(e) => setTemplateNameFilter(e.target.value)}
            className="w-full p-2 border dark:bg-gray-900 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">جميع القوالب</option>
            {templateOptions.length > 0 ? (
              templateOptions.map((templateName, index) => (
                <option key={index} value={templateName}>
                  {templateName}
                </option>
              ))
            ) : (
              <option disabled>لا توجد قوالب في البيانات</option>
            )}
          </select>
          {templateNameFilter && (
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-green-600">✓ تم تطبيق الفلتر</span>
              <button
                onClick={() => setTemplateNameFilter("")}
                className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                type="button"
              >
                <X size={12} />
                إزالة الفلتر
              </button>
            </div>
          )}
        </div>

        {isWeeklyReport && (
          <div>
            <Label
              htmlFor="customerType"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              نوع المنتج
            </Label>
            <select
              id="customerType"
              value={customerTypeFilter}
              onChange={(e) => setCustomerTypeFilter(e.target.value)}
              className="w-full p-2 border dark:bg-gray-900 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {customerTypeOptions.map((type) => (
                <option key={type.value || "all"} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-end">
          <Button
            onClick={clearAllFilters}
            className="w-full bg-gray-500 hover:bg-gray-600 text-white"
          >
            مسح جميع الفلاتر
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <Label className="mb-2 text-sm font-medium text-right text-foreground">
            من تاريخ
          </Label>
          <input
            type="date"
            value={fromDate || ''}
            onChange={(e) => handleDateChange('fromDate', e.target.value)}
            className="p-2.5 border rounded-lg bg-card text-foreground text-sm shadow-sm focus:ring-2 focus:ring-primary focus:border-primary w-full transition-colors duration-200"
          />
        </div>

        <div>
          <Label className="mb-2 text-sm font-medium text-right text-foreground">
            إلى تاريخ
          </Label>
          <input
            type="date"
            value={toDate || ''}
            onChange={(e) => handleDateChange('toDate', e.target.value)}
            className="p-2.5 border rounded-lg bg-card text-foreground text-sm shadow-sm focus:ring-2 focus:ring-primary focus:border-primary w-full transition-colors duration-200"
          />
        </div>
      </div>

      <Tabs
        defaultValue="bookings"
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full overflow-auto grid-cols-5 justify-between flex bg-card rounded-lg border border-border">
          <TabsTrigger value="bookings" className="text-sm font-medium">
            الحجوزات ({memoizedBookingsData.length})
          </TabsTrigger>
          <TabsTrigger value="unbooked" className="text-sm font-medium">
            اللوحات الغير محجوزة ({memoizedUnbookedData.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bookings">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="flex-1">
              {localFilters.customerId && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="font-semibold text-blue-700 dark:text-blue-300">
                    عرض تقرير للزبون المحدد
                  </h3>
                </div>
              )}
              {templateNameFilter && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg mt-2">
                  <h3 className="font-semibold text-green-700 dark:text-green-300">
                    فلتر القالب: "{templateNameFilter}"
                  </h3>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handlePrintReport}
                disabled={isGeneratingPDF || isBookingsLoading || isBookingsFetching || memoizedBookingsData.length === 0}
                className="flex items-center gap-2 bg-green-600 text-white"
              >
                {isGeneratingPDF ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>جاري التحميل...</span>
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4" />
                    <span>طباعة التقرير (PDF)</span>
                  </>
                )}
              </Button>

              <Button
                onClick={() => handleExportWord(false)}
                disabled={isGeneratingPDF || isBookingsLoading || isBookingsFetching || memoizedBookingsData.length === 0}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isGeneratingPDF ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>جاري التحميل...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>تصدير Word</span>
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleSimplePrint}
                disabled={isBookingsLoading || isBookingsFetching || memoizedBookingsData.length === 0}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة مباشرة</span>
              </Button>
            </div>
          </div>
          
          {memoizedBookingsData.length > 0 ? (
            <>
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h3 className="font-semibold text-green-700 dark:text-green-300">
                  عدد السجلات: {memoizedBookingsData.length}
                </h3>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  ملاحظة: الجدول يظهر السجلات الفردية - التجميع يكون في التقرير PDF فقط
                  {templateNameFilter && ` | مفلتر حسب القالب: "${templateNameFilter}"`}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  الصفحة الحالية: {bookingsPage} من {totalBookingsPages} (عرض {paginatedBookingsData.length} سجل من أصل {memoizedBookingsData.length})
                </p>
              </div>
              
              <DynamicTable
                data={paginatedBookingsData}
                columns={ReportBookingsColumns.filter(col => 
                  (!isWeeklyReport && col.accessor === "total_advertising_space") ||
                  (!isWeeklyReport && col.accessor === "customer_type") ? false : true
                )}
                isLoading={isBookingsFetching}
                className="bg-card rounded-lg shadow-sm border border-border w-full"
              />
              
              <Pagination
                currentPage={bookingsPage}
                totalPages={totalBookingsPages}
                onPageChange={setBookingsPage}
                pageSize={bookingsPageSize}
                onPageSizeChange={handleBookingsPageSizeChange}
                dataType="bookings"
              />
            </>
          ) : (
            <div className="text-center p-8 text-gray-500">
              {isBookingsFetching ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>جاري تحميل البيانات...</span>
                </div>
              ) : (
                <>
                  <p>لا توجد حجوزات تطابق الفلاتر المحددة</p>
                  {templateNameFilter && (
                    <p className="text-sm text-red-600 mt-2">
                      لا توجد حجوزات للقالب: "{templateNameFilter}"
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="unbooked">
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1">
              {localFilters.cityId && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="font-semibold text-blue-700 dark:text-blue-300">
                    عرض تقرير اللوحات غير المحجوزة
                  </h3>
                </div>
              )}
              {templateNameFilter && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg mt-2">
                  <h3 className="font-semibold text-green-700 dark:text-green-300">
                    فلتر القالب: "{templateNameFilter}"
                  </h3>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={generateUnbookedPdf}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
                disabled={isUnbookedLoading || isUnbookedFetching || memoizedUnbookedData.length === 0}
              >
                <FileText className="w-4 h-4" />
                <span>تصدير PDF</span>
              </Button>
              
              <Button
                onClick={() => handleExportWord(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isUnbookedLoading || isUnbookedFetching || memoizedUnbookedData.length === 0}
              >
                <FileText className="w-4 h-4" />
                <span>تصدير Word</span>
              </Button>
            </div>
          </div>
          
          {memoizedUnbookedData.length > 0 ? (
            <>
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h3 className="font-semibold text-green-700 dark:text-green-300">
                  عدد السجلات: {memoizedUnbookedData.length}
                </h3>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  ملاحظة: الجدول يظهر السجلات الفردية - التجميع يكون في التقرير PDF فقط
                  {templateNameFilter && ` | مفلتر حسب القالب: "${templateNameFilter}"`}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  الصفحة الحالية: {unbookedPage} من {totalUnbookedPages} (عرض {paginatedUnbookedData.length} سجل من أصل {memoizedUnbookedData.length})
                </p>
              </div>
              
              <DynamicTable
                data={paginatedUnbookedData.map(formatIndividualUnbookedSign)}
                columns={[
                  {
                    header: "كود اللوحة",
                    accessor: "roadsign_code",
                    cellClassName: "text-center font-mono"
                  },
                  {
                    header: "النموذج",
                    accessor: "template_name",
                    cellClassName: "text-center"
                  },
                  ...(isWeeklyReport ? [{
                    header: "الأمتار (م²)",
                    accessor: "advertising_space",
                    cellClassName: "text-center font-bold",
                    cell: (row) => `${row.advertising_space || 0} م²`
                  }] : []),
                  {
                    header: "المنطقة",
                    accessor: "region_name",
                    cellClassName: "text-center"
                  },
                {
  header: "الاتجاه",
  accessor: "direction",
  cellClassName: "text-right",
  cell: (row) => (
    <div className="max-w-xs truncate" title={row.direction}>
      {row.direction || "غير محدد"}
    </div>
  )
} , 

                  {
                    header: "المكان",
                    accessor: "place",
                    cellClassName: "text-right"
                  },
                  {
                    header: "عدد الأوجه",
                    accessor: "faces_number",
                    cellClassName: "text-center"
                  }
                ]}
                isLoading={isUnbookedFetching}
                className="bg-card rounded-lg shadow-sm border border-border w-full"
              />
              
              <Pagination
                currentPage={unbookedPage}
                totalPages={totalUnbookedPages}
                onPageChange={setUnbookedPage}
                pageSize={unbookedPageSize}
                onPageSizeChange={handleUnbookedPageSizeChange}
                dataType="unbooked"
              />
            </>
          ) : (
            <div className="text-center p-8 text-gray-500">
              {isUnbookedFetching ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>جاري تحميل البيانات...</span>
                </div>
              ) : (
                <>
                  <p>لا توجد لوحات غير محجوزة تطابق الفلاتر المحددة</p>
                  {templateNameFilter && (
                    <p className="text-sm text-red-600 mt-2">
                      لا توجد لوحات غير محجوزة للقالب: "{templateNameFilter}"
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RoadSignsReport;