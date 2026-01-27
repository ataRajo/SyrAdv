import { DynamicTable } from "../../utils/Tables/DynamicTable";
import { Loader, FileText, X, ChevronLeft, ChevronRight, Calendar, Printer } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useMemo, useRef } from "react";
import { productTypeOptions } from "../../Static/StaticData";

import { useGetRoadSignsQuery } from "../../RtkQuery/Slice/RoadSings/RoadSingsApi";

import { useGetCitiesQuery } from "../../RtkQuery/Slice/CitiesAndRegions/CitiesAndRegionsApi";

import { useGetRoadSignBookingByWeekQuery } from "../../RtkQuery/Slice/Report/ReportApi";

const RoadSignsReport = ({ isWeeklyReport = true }) => {
  // State for filters
  const [cityId, setCityId] = useState("");
  const [templateNameFilter, setTemplateNameFilter] = useState("");
  const [regionId, setRegionId] = useState("");
  const [placeFilter, setPlaceFilter] = useState("");
  const [customerId, setCustomerId] = useState("");
  
  // For weekly report, always show booked signs only
  const [activeTab, setActiveTab] = useState(isWeeklyReport ? "unavailable" : "available");
  
// State for dates
const [startDate, setStartDate] = useState(() => {
  const today = new Date();
  return today.toISOString().split('T')[0];
});

const [endDate, setEndDate] = useState(() => {
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 6); // ← تغيير من 7 إلى 6
  return nextWeek.toISOString().split('T')[0];
});


  // Removed pagination states
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingWord, setIsGeneratingWord] = useState(false);
  
  // Removed pageSizeOptions
  
  // Ref for printing content
  const printRef = useRef(null);

  // Fetch cities
  const { data: cities, isLoading: isCitiesLoading } = useGetCitiesQuery();

  // Build query parameters for API calls
  const weeklyQueryParams = useMemo(() => {
    const params = {};
    
    if (isWeeklyReport) {
      if (startDate) params.from_date = startDate;
      if (endDate) params.to_date = endDate;
      if (cityId) params.city_id = cityId;
      if (regionId) params.region_id = regionId;
      if (placeFilter) params.place = placeFilter;
      if (templateNameFilter) params.model = templateNameFilter;
      // Removed page and per_page params
    }
    
    return params;
  }, [isWeeklyReport, startDate, endDate, cityId, regionId, placeFilter, templateNameFilter]); // Removed page and pageSize dependencies

  const detailsQueryParams = useMemo(() => {
    const params = {};
    
    if (!isWeeklyReport) {
      if (cityId) params.city_id = cityId;
      if (templateNameFilter) params.model = templateNameFilter;
      // Note: regionId and placeFilter are handled client-side
    }
    
    return params;
  }, [isWeeklyReport, cityId, templateNameFilter]); // Remove regionId from API call dependencies
  
  // Use the appropriate API based on report type
  const { 
    data: weeklyReportData, 
    isLoading: isWeeklyReportLoading,
    isFetching: isWeeklyReportFetching,
    refetch: refetchWeeklyReport
  } = useGetRoadSignBookingByWeekQuery(
    isWeeklyReport ? weeklyQueryParams : {},
    { skip: !isWeeklyReport }
  );

  const { 
    data: roadSignsData, 
    isLoading: isRoadSignsLoading,
    isFetching: isRoadSignsFetching,
    refetch: refetchRoadSigns
  } = useGetRoadSignsQuery(
    !isWeeklyReport ? detailsQueryParams : {},
    { skip: isWeeklyReport }
  );


// دالة لحساب التاريخ بعد 6 أيام
const calculateEndDate = (startDateString, daysToAdd = 6) => {
  if (!startDateString) return "";
  const date = new Date(startDateString);
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().split('T')[0];
};

// ثم أضف useEffect لتحديث تاريخ النهاية تلقائياً
useEffect(() => {
  if (startDate && !endDate) {
    const calculatedEndDate = calculateEndDate(startDate, 6);
    setEndDate(calculatedEndDate);
  }
}, [startDate]);



  // Set the loading states based on report type
  const isLoading = isWeeklyReport ? isWeeklyReportLoading : isRoadSignsLoading;
  const isFetching = isWeeklyReport ? isWeeklyReportFetching : isRoadSignsFetching;

  // Process weekly report data
  const processWeeklyData = useMemo(() => {
    if (!isWeeklyReport || !weeklyReportData) {
      return { data: [], total: 0, meta: {} };
    }
    
    let dataArray = [];
    let totalCount = 0;
    let meta = {};
    
    // Extract data from response
    if (weeklyReportData) {
      if (Array.isArray(weeklyReportData)) {
        dataArray = weeklyReportData;
        totalCount = weeklyReportData.length;
      } 
      else if (weeklyReportData.data && Array.isArray(weeklyReportData.data)) {
        dataArray = weeklyReportData.data;
        totalCount = weeklyReportData.total || weeklyReportData.data.length;
        meta = weeklyReportData.meta || {};
      }
      else if (weeklyReportData.results && Array.isArray(weeklyReportData.results)) {
        dataArray = weeklyReportData.results;
        totalCount = weeklyReportData.count || weeklyReportData.results.length;
      }
    }
    
    // Apply client-side filtering for customer name
    if (customerId) {
      dataArray = dataArray.filter(item => {
        if (item.bookings && item.bookings.length > 0) {
          const booking = item.bookings[0];
          const customer = booking.customer;
          if (customer) {
            const customerName = customer.full_name || customer.company_name;
            return customerName && customerName.includes(customerId);
          }
        }
        return false;
      });
      totalCount = dataArray.length;
    }
    
    return {
      data: dataArray,
      total: totalCount,
      meta: meta
    };
  }, [weeklyReportData, isWeeklyReport, customerId]);

  // Process details data (available/unavailable)
  const processDetailsData = useMemo(() => {
    if (isWeeklyReport) {
      return { available: [], unavailable: [], total: 0 };
    }
    
    let dataArray = [];
    
    if (roadSignsData) {
      if (Array.isArray(roadSignsData)) {
        dataArray = roadSignsData;
      } 
      else if (roadSignsData.data && Array.isArray(roadSignsData.data)) {
        dataArray = roadSignsData.data;
      }
      else if (roadSignsData.results && Array.isArray(roadSignsData.results)) {
        dataArray = roadSignsData.results;
      }
      else if (roadSignsData.items && Array.isArray(roadSignsData.items)) {
        dataArray = roadSignsData.items;
      }
    }

    // Apply region filter client-side if regionId is selected
    if (regionId) {
      dataArray = dataArray.filter(item => {
        const itemRegionId = item.region?.id || item.region_id;
        return itemRegionId == regionId; // Use loose equality for string/number comparison
      });
    }

    // Apply place filter client-side if placeFilter is selected
    if (placeFilter) {
      dataArray = dataArray.filter(item => {
        const itemPlace = item.place || "";
        return itemPlace.toLowerCase().includes(placeFilter.toLowerCase());
      });
    }

    const available = [];
    const unavailable = [];

    dataArray.forEach(item => {
      if (item.is_booked === true) {
        unavailable.push(item); // محجوزة
      } else {
        available.push(item); // متاحة
      }
    });

    return { 
      available, 
      unavailable,
      total: dataArray.length
    };
  }, [roadSignsData, isWeeklyReport, regionId, placeFilter]); // Add regionId and placeFilter to dependencies
  
  // Get current data based on report type - removed pagination logic
  const currentData = useMemo(() => {
    if (isWeeklyReport) {
      return processWeeklyData.data;
    } else {
      const detailsData = processDetailsData;
      return activeTab === "available" ? detailsData.available : detailsData.unavailable;
    }
  }, [isWeeklyReport, activeTab, processWeeklyData, processDetailsData]);

  // Get all unique template names from data
  const getAllTemplateNames = () => {
    const allData = isWeeklyReport 
      ? processWeeklyData.data 
      : [
          ...(processDetailsData.available || []),
          ...(processDetailsData.unavailable || [])
        ];
    
    const templateNames = new Set();
    
    allData.forEach(item => {
      const templateName = item.template?.model || item.template?.name || item.model;
      if (templateName) {
        templateNames.add(templateName);
      }
    });
    
    return Array.from(templateNames).sort();
  };

  const templateOptions = useMemo(() => getAllTemplateNames(), [processWeeklyData, processDetailsData, isWeeklyReport]);

  // Get unique customers from weekly data
  const getAllCustomers = () => {
    if (!isWeeklyReport) return [];
    
    const customers = new Map();
    
    processWeeklyData.data.forEach(item => {
      if (item.bookings && item.bookings.length > 0) {
        item.bookings.forEach(booking => {
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
        });
      }
    });
    
    return Array.from(customers.values()).sort((a, b) => a.name.localeCompare(b.name));
  };

  const customerOptions = useMemo(() => getAllCustomers(), [processWeeklyData, isWeeklyReport]);

  // Removed paginatedData calculation
  // Removed totalPages calculation
  // Removed totalItems calculation for pagination
  // Removed handlePageSizeChange function

  // Refetch data when filters change
  useEffect(() => {
    if (isWeeklyReport) {
      refetchWeeklyReport();
    } else {
      refetchRoadSigns();
    }
  }, [cityId, templateNameFilter, startDate, endDate, regionId, placeFilter, customerId, isWeeklyReport, refetchWeeklyReport, refetchRoadSigns]); // regionId and placeFilter are already included

  // Format date for display
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

  // Calculate totals
  const calculateTotalAdvertisingSpace = (data) => {
    if (!data || !Array.isArray(data)) return 0;
    return data.reduce((total, item) => {
      const space = parseFloat(item.template?.advertising_space || item.advertising_space || 0);
      const faces = parseInt(item.faces_number || 1);
      return total + (space * faces);
    }, 0).toFixed(2);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setCityId("");
    setTemplateNameFilter("");
    setRegionId("");
    setPlaceFilter("");
    setCustomerId("");
    
    // Reset dates to current week
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 6);
    
    setStartDate(today.toISOString().split('T')[0]);
    setEndDate(nextWeek.toISOString().split('T')[0]);
  };

  // Get regions based on selected city
  const getRegionsForCity = () => {
    if (!cityId || !cities) return [];
    const selectedCity = cities.find(city => city.id == cityId);
    return selectedCity?.regions || [];
  };

// Function to export Details Report as PDF with grouping ONLY in عدد الأوجه column
const handleExportDetailsPDF = () => {
  setIsGeneratingPDF(true);
  
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة لهذا الموقع');
    setIsGeneratingPDF(false);
    return;
  }
  
  const printData = currentData;
  const reportType = `تفاصيل اللوحات ${activeTab === "available" ? 'المتاحة' : 'المحجوزة'}`;
  const statusType = activeTab === "available" ? 'المتاحة' : 'المحجوزة';
  
  // Function to create a unique key for grouping
  const createGroupKey = (item) => {
    return `${item.region?.name || ''}_${item.directions || ''}_${item.city?.name || ''}_${item.place || ''}`;
  };
  
  // Group items by location details
  const groupedItems = {};
  
  printData.forEach(item => {
    // Create group key
    const groupKey = createGroupKey(item);
    
    if (!groupedItems[groupKey]) {
      groupedItems[groupKey] = {
        region: item.region?.name || "غير محدد",
        directions: item.directions || item.direction || "غير محدد",
        city: item.city?.name || "غير محدد",
        place: item.place || "غير محدد",
        items: [],
        totalItems: 0
      };
    }
    
    groupedItems[groupKey].items.push(item);
    groupedItems[groupKey].totalItems += 1;
  });

  const printContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${reportType}</title>
        <style>
            @media print {
                @page {
                    size: A4;
                    margin: 15mm;
                }
                body {
                    font-size: 11px;
                }
                .page-break {
                    page-break-before: always;
                }
            }
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Arial', sans-serif;
                line-height: 1.5;
                color: #333;
                background: white;
                padding: 20px;
            }
            
            .report-container {
                width: 100%;
                max-width: 100%;
                margin: 0 auto;
            }
            
            /* Report Header */
            .report-header {
                text-align: center;
                margin-bottom: 25px;
                padding-bottom: 15px;
                border-bottom: 3px solid ${activeTab === "available" ? '#4CAF50' : '#F44336'};
            }
            
            .report-header h1 {
                margin: 0;
                color: #2c3e50;
                font-size: 26px;
                font-weight: bold;
            }
            
            .report-header h2 {
                margin: 10px 0 0 0;
                color: #7f8c8d;
                font-size: 18px;
                font-weight: normal;
            }
            
            /* Report Meta */
            .report-meta {
                background: ${activeTab === "available" ? '#E8F5E9' : '#FFEBEE'};
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
                border-right: 4px solid ${activeTab === "available" ? '#4CAF50' : '#F44336'};
            }
            
            .meta-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 10px;
            }
            
            .meta-item {
                padding: 5px 0;
                font-size: 14px;
            }
            
            .meta-label {
                font-weight: bold;
                color: #2c3e50;
                margin-left: 5px;
            }
            
            /* Table Styles */
            .print-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
                font-size: 10px;
            }
            
            .print-table th {
                background: ${activeTab === "available" ? '#4CAF50' : '#F44336'};
                color: white;
                font-weight: bold;
                padding: 10px 8px;
                text-align: center;
                border: 1px solid #ddd;
            }
            
            .print-table td {
                padding: 8px;
                border: 1px solid #ddd;
                text-align: center;
                vertical-align: middle;
            }
            
            .print-table tr:nth-child(even) {
                background-color: #f8f9fa;
            }
            
            .group-highlight {
                background-color: ${activeTab === "available" ? '#F1F8E9' : '#FFEBEE'} !important;
                border-left: 3px solid ${activeTab === "available" ? '#4CAF50' : '#F44336'};
                border-right: 3px solid ${activeTab === "available" ? '#4CAF50' : '#F44336'};
            }
            
            .size-cell {
                font-weight: bold;
                color: #F57C00;
            }
            
            .faces-cell {
                font-weight: bold;
                color: #2E7D32;
                background: #E8F5E9;
                border-radius: 50%;
                width: 25px;
                height: 25px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto;
                font-size: 12px;
            }
            
            /* Summary */
            .report-summary {
                margin-top: 40px;
                padding: 20px;
                background: ${activeTab === "available" ? '#E8F5E9' : '#FFEBEE'};
                border-radius: 8px;
                border-right: 4px solid ${activeTab === "available" ? '#4CAF50' : '#F44336'};
            }
            
            .summary-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-top: 10px;
            }
            
            .summary-item {
                background: white;
                padding: 10px;
                border-radius: 5px;
                text-align: center;
            }
            
            .summary-value {
                font-size: 18px;
                font-weight: bold;
                color: #2c3e50;
                margin-top: 5px;
            }
            
            .summary-label {
                color: #7f8c8d;
                font-size: 14px;
            }
            
            .summary-note {
                margin-top: 15px;
                text-align: center;
                font-size: 11px;
                color: #666;
                font-style: italic;
            }
            
            /* Footer */
            .report-footer {
                margin-top: 40px;
                text-align: center;
                color: #7f8c8d;
                font-size: 11px;
                padding-top: 15px;
                border-top: 1px solid #ddd;
            }
            
            .generation-time {
                font-size: 10px;
                color: #999;
                margin-top: 10px;
            }
        </style>
    </head>
    <body>
        <div class="report-container">
            <!-- Report Header -->
            <div class="report-header">
                <h1>${reportType}</h1>
                <p>📅 تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}</p>
            </div>
            
            <!-- Report Meta Information -->
            <div class="report-meta">
                <div class="meta-grid">
                    <div class="meta-item">
                        <span class="meta-label">نوع التقرير:</span>
                        ${reportType}
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">حالة اللوحات:</span>
                        ${statusType}
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">عدد اللوحات:</span>
                        ${printData.length} لوحة
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">إجمالي المساحة:</span>
                        ${calculateTotalAdvertisingSpace(printData)} م²
                    </div>
                  
                    ${cityId ? `
                    <div class="meta-item">
                        <span class="meta-label">المدينة:</span>
                        ${cities?.find(c => c.id == cityId)?.name || ''}
                    </div>
                    ` : ''}
                    ${templateNameFilter ? `
                    <div class="meta-item">
                        <span class="meta-label">القالب:</span>
                        ${templateNameFilter}
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <table class="print-table">
                <thead>
                    <tr>
                        <th width="20%">النموذج</th>
                        <th width="15%">القياس</th>
                        <th width="12%">عدد الأوجه</th>
                        <th width="15%">المدينة</th>
                        <th width="13%">المنطقة</th>
                        <th width="15%">المكان</th>
                        <th width="10%">الاتجاه</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.values(groupedItems).map((group) => {
                      // Take only the first item from the group (since they're all the same)
                      const firstItem = group.items[0];
                      const groupFaces = group.totalItems;
                      
                      // Get the size from template
                      const itemSize = firstItem.template?.size || "غير محدد";
                      
                      return `
                        <tr class="group-highlight">
                            <td>${firstItem.template?.model || firstItem.template?.name || "غير محدد"}</td>
                            <td>
                                <span class="size-cell">
                                    ${itemSize}
                                </span>
                            </td>
                            <td>
                                <div class="faces-cell">${groupFaces}</div>
                            </td>
                            <td>${firstItem.city?.name || "غير محدد"}</td>
                            <td>${firstItem.region?.name || "غير محدد"}</td>
                            <td class="text-right">${firstItem.place || "غير محدد"}</td>
                            <td class="text-right">${firstItem.directions || firstItem.direction || "غير محدد"}</td>
                        </tr>
                        
                        ${groupFaces > 1 ? `
                            <tr style="background: #f9f9f9; font-size: 9px;">
                                <td colspan="7" class="text-right" style="padding: 5px 15px; color: #666;">
                                    <small>
                                        <strong>عدد اللوحات في هذه المجموعة: ${groupFaces}</strong>
                                    </small>
                                </td>
                            </tr>
                        ` : ''}
                      `;
                    }).join('')}
                </tbody>
            </table>
            
            <!-- Report Summary -->
            <div class="report-summary">
                <h3 style="margin: 0 0 15px 0; color: ${activeTab === "available" ? '#2E7D32' : '#D32F2F'}; text-align: center;">
                    📊 ملخص التقرير
                </h3>
                <div class="summary-grid">
                    <div class="summary-item">
                        <div class="summary-label">عدد اللوحات</div>
                        <div class="summary-value">${printData.length}</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">إجمالي المساحة</div>
                        <div class="summary-value">${calculateTotalAdvertisingSpace(printData)} م²</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">عدد المجموعات</div>
                        <div class="summary-value">${Object.keys(groupedItems).length}</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">متوسط المساحة</div>
                        <div class="summary-value">${printData.length > 0 ? (calculateTotalAdvertisingSpace(printData) / printData.length).toFixed(2) : 0} م²</div>
                    </div>
                </div>
                <div class="summary-note">
                    📋 <strong>ملاحظة:</strong> تم تجميع اللوحات المتشابهة وعرض عدد التكرارات في عمود "عدد الأوجه"
                </div>
            </div>
            
            <!-- Report Footer -->
            <div class="report-footer">
                <p>📊 تفاصيل اللوحات - نظام إدارة اللوحات الإعلانية</p>
                <p>📍 جميع المعلومات المعروضة محدثة حتى تاريخ الإنشاء</p>
                <div class="generation-time">
                    🕒 تم إنشاء التقرير في: ${new Date().toLocaleString('ar-EG')}
                </div>
                <p style="margin-top: 10px;">© ${new Date().getFullYear()} جميع الحقوق محفوظة</p>
            </div>
        </div>
        
        <script>
            window.onload = function() {
                setTimeout(() => {
                    window.print();
                    setTimeout(() => {
                        window.close();
                    }, 1000);
                }, 1000);
            };
        </script>
    </body>
    </html>
  `;
  
  printWindow.document.open();
  printWindow.document.write(printContent);
  printWindow.document.close();
  
  setTimeout(() => {
    setIsGeneratingPDF(false);
  }, 2000);
};

const handleExportWeeklyPDF = () => {
  setIsGeneratingPDF(true);
  
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة لهذا الموقع');
    setIsGeneratingPDF(false);
    return;
  }
  
  const printData = currentData;
  // Updated report title
  const reportType = 'تقرير الحجوزات الأسبوعي';
  
  // Create example week dates (25th to 31st)
  const getExampleWeekDates = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  
  // Get current week: today to today + 6 days
  const startDate = new Date(today);
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 6); // ← تغيير إلى +6
  
  return {
    start: formatArabicDate(startDate),
    end: formatArabicDate(endDate)
  };
};

  const exampleWeek = getExampleWeekDates();
  
  // Function to create a unique key for grouping
  const createGroupKey = (item) => {
    return `${item.region?.name || ''}_${item.place || ''}_${item.directions || ''}`;
  };
  
  // Group by customer and location details
  const groupedByCustomer = {};
  
  printData.forEach(item => {
    if (!item.bookings || item.bookings.length === 0) return;
    
    const booking = item.bookings[0];
    const customer = booking.customer;
    
    if (!customer) {
      const unknownId = 'unknown';
      if (!groupedByCustomer[unknownId]) {
        groupedByCustomer[unknownId] = {
          customerName: "غير محدد",
          customerCompany: "غير محدد",
          totalBookings: 0,
          totalArea: 0,
          totalPrice: 0,
          groups: []
        };
      }
      
      // Create group key
      const groupKey = createGroupKey(item);
      
      // Find existing group or create new one
      let group = groupedByCustomer[unknownId].groups.find(g => g.key === groupKey);
      if (!group) {
        group = {
          key: groupKey,
          region: item.region?.name || "غير محدد",
          directions: item.directions || item.direction || "غير محدد",
          place: item.place || "غير محدد",
          items: []
        };
        groupedByCustomer[unknownId].groups.push(group);
      }
      
      group.items.push({ item, booking });
      groupedByCustomer[unknownId].totalBookings += 1;
      // Calculate area per face (not total)
      const areaPerFace = parseFloat(item.template?.advertising_space || 0);
      groupedByCustomer[unknownId].totalArea += areaPerFace;
      // Calculate total price
      if (booking.total_price) {
        groupedByCustomer[unknownId].totalPrice += parseFloat(booking.total_price);
      }
      return;
    }
    
    const customerId = customer.id;
    const customerName = customer.full_name || customer.company_name || "غير محدد";
    const customerCompany = customer.company_name || "غير محدد";
    
    if (!groupedByCustomer[customerId]) {
      groupedByCustomer[customerId] = {
        customerName: customerName,
        customerCompany: customerCompany,
        totalBookings: 0,
        totalArea: 0,
        totalPrice: 0,
        groups: []
      };
    }
    
    // Create group key
    const groupKey = createGroupKey(item);
    
    // Find existing group or create new one
    let group = groupedByCustomer[customerId].groups.find(g => g.key === groupKey);
    if (!group) {
      group = {
        key: groupKey,
        region: item.region?.name || "غير محدد",
        directions: item.directions || item.direction || "غير محدد",
        place: item.place || "غير محدد",
        items: []
      };
      groupedByCustomer[customerId].groups.push(group);
    }
    
    group.items.push({ item, booking });
    groupedByCustomer[customerId].totalBookings += 1;
    // Calculate area per face (not total)
    const areaPerFace = parseFloat(item.template?.advertising_space || 0);
    groupedByCustomer[customerId].totalArea += areaPerFace;
    // Calculate total price
    if (booking.total_price) {
      groupedByCustomer[customerId].totalPrice += parseFloat(booking.total_price);
    }
  });

  const printContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${reportType}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap');
            
            @media print {
                @page {
                    size: A4 landscape;
                    margin: 15mm;
                }
                body {
                    font-size: 11px;
                }
                .page-break {
                    page-break-before: always;
                }
            }
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Cairo', 'Arial', sans-serif;
                line-height: 1.5;
                color: #333;
                background: white;
                padding: 20px;
                max-width: 100%;
                overflow-x: hidden;
            }
            
            .report-container {
                width: 100%;
                max-width: 100%;
                margin: 0 auto;
                background: white;
                border-radius: 8px;
                overflow: hidden;
            }
            
            /* Report Header */
            .report-header {
                background: linear-gradient(135deg, #1a237e 0%, #283593 100%);
                color: white;
                padding: 25px 30px;
                text-align: center;
                position: relative;
                overflow: hidden;
            }
            
            .report-header::before {
                content: "";
                position: absolute;
                top: -50%;
                right: -50%;
                width: 200%;
                height: 200%;
                background: rgba(255, 255, 255, 0.1);
                transform: rotate(45deg);
            }
            
            .report-header h1 {
                font-size: 26px;
                font-weight: 700;
                margin-bottom: 8px;
                position: relative;
                z-index: 1;
            }
            
            .report-header h2 {
                font-size: 18px;
                font-weight: 400;
                opacity: 0.9;
                position: relative;
                z-index: 1;
            }
            
            .report-date {
                position: relative;
                z-index: 1;
                font-size: 14px;
                margin-top: 10px;
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 10px;
            }
            
            .report-date::before {
                content: "📅";
                font-size: 16px;
            }
            
            /* Report Meta */
            .report-meta {
                background: #f8f9fa;
                padding: 20px 30px;
                margin: 20px 0;
                border-radius: 10px;
                border-right: 5px solid #4a6baf;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            }
            
            .meta-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
            }
            
            .meta-item {
                padding: 12px 15px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
                display: flex;
                flex-direction: column;
            }
            
            .meta-label {
                font-size: 12px;
                color: #666;
                margin-bottom: 5px;
                font-weight: 500;
            }
            
            .meta-value {
                font-size: 14px;
                font-weight: 600;
                color: #1a237e;
            }
            
            /* Customer Sections */
            .customer-section {
                margin: 30px 0;
                page-break-inside: avoid;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 3px 12px rgba(0, 0, 0, 0.08);
            }
            
            .customer-header {
                background: linear-gradient(135deg, #ffd700 0%, #ff9800 100%);
                color: #000;
                padding: 18px 25px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                position: relative;
                overflow: hidden;
                border-bottom: 3px solid #ff9800;
            }
            
            .customer-header::before {
                content: "";
                position: absolute;
                top: 0;
                right: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                transform: translateX(-100%);
                animation: shimmer 2s infinite;
            }
            
            @keyframes shimmer {
                100% {
                    transform: translateX(100%);
                }
            }
            
            .customer-name {
                font-size: 20px;
                font-weight: 700;
                position: relative;
                z-index: 1;
                color: #000;
                text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.5);
            }
            
            .customer-phone {
                font-size: 14px;
                font-weight: 600;
                position: relative;
                z-index: 1;
                color: #000;
                background: rgba(255, 255, 255, 0.8);
                padding: 5px 10px;
                border-radius: 20px;
            }
            
            .customer-phone::before {
                content: "📱 ";
            }
            
            .customer-info {
                background: #fffde7;
                padding: 15px 25px;
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 12px;
                font-size: 13px;
                border-bottom: 2px solid #ffecb3;
            }
            
            .info-item {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .info-label {
                font-weight: 600;
                color: #5d4037;
                min-width: 100px;
            }
            
            .info-value {
                color: #333;
                font-weight: 500;
            }
            
            /* Table Styles */
            .data-table {
                width: 100%;
                border-collapse: separate;
                border-spacing: 0;
                margin-top: 10px;
                font-size: 10px;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            
            .data-table th {
                background: linear-gradient(135deg, #3f51b5 0%, #303f9f 100%);
                color: white;
                font-weight: 600;
                padding: 12px 8px;
                text-align: center;
                border: none;
                position: relative;
                font-size: 11px;
            }
            
            .data-table th:not(:last-child)::after {
                content: "";
                position: absolute;
                left: 0;
                top: 20%;
                height: 60%;
                width: 1px;
                background: rgba(255, 255, 255, 0.3);
            }
            
            .data-table td {
                padding: 10px 8px;
                text-align: center;
                border: none;
                border-bottom: 1px solid #f0f0f0;
                vertical-align: middle;
                position: relative;
            }
            
            .data-table tr {
                transition: background-color 0.2s;
            }
            
            .data-table tr:hover {
                background-color: #f9f9f9;
            }
            
            .data-table tr:nth-child(even) {
                background-color: #fafafa;
            }
            
            .data-table tr:nth-child(even):hover {
                background-color: #f5f5f5;
            }
            
            .area-cell {
                font-weight: bold;
                color: #d84315;
                background: #ffecb3;
                border-radius: 4px;
                padding: 4px 8px;
                display: inline-block;
                min-width: 50px;
            }
            
            .size-cell {
                font-weight: bold;
                color: #1565c0;
                background: #e3f2fd;
                border-radius: 4px;
                padding: 4px 8px;
                display: inline-block;
                min-width: 60px;
            }
            
            .faces-cell {
                font-weight: bold;
                color: #2e7d32;
                background: #e8f5e9;
                border-radius: 4px;
                padding: 4px 8px;
                display: inline-block;
                min-width: 40px;
                text-align: center;
            }
            
            .group-highlight {
                background-color: #e8f5e9 !important;
                border-left: 4px solid #4caf50;
                border-right: 4px solid #4caf50;
            }
            
            .group-highlight td:first-child {
                border-top-left-radius: 8px;
                border-bottom-left-radius: 8px;
            }
            
            .group-highlight td:last-child {
                border-top-right-radius: 8px;
                border-bottom-right-radius: 8px;
            }
            
            .total-row {
                background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%) !important;
                font-weight: bold;
            }
            
            .total-row td {
                border-top: 2px solid #4caf50;
                border-bottom: none;
                font-size: 12px;
                padding: 12px 8px;
            }
            
            /* Report Summary */
            .report-summary {
                margin-top: 40px;
                background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
                padding: 25px 30px;
                border-radius: 12px;
                border-left: 5px solid #2196f3;
                box-shadow: 0 4px 12px rgba(33, 150, 243, 0.15);
            }
            
            .summary-title {
                font-size: 18px;
                font-weight: 700;
                color: #0d47a1;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .summary-title::before {
                content: "📊";
                font-size: 20px;
            }
            
            .summary-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                gap: 20px;
            }
            
            .summary-item {
                background: white;
                padding: 20px;
                border-radius: 10px;
                text-align: center;
                box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
                transition: transform 0.3s, box-shadow 0.3s;
            }
            
            .summary-item:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            }
            
            .summary-value {
                font-size: 24px;
                font-weight: 700;
                color: #1a237e;
                margin-bottom: 8px;
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 8px;
            }
            
            .summary-label {
                font-size: 13px;
                color: #666;
                font-weight: 500;
            }
            
            .summary-note {
                margin-top: 20px;
                text-align: center;
                font-size: 11px;
                color: #666;
                padding: 10px;
                background: rgba(255, 255, 255, 0.6);
                border-radius: 6px;
            }
            
            /* Report Footer */
            .report-footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 2px solid #e0e0e0;
                text-align: center;
                color: #666;
                font-size: 11px;
            }
            
            .footer-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 15px;
                margin-top: 15px;
            }
            
            .footer-item {
                padding: 8px;
                background: #f5f5f5;
                border-radius: 6px;
                font-size: 10px;
            }
            
            .generation-time {
                font-size: 10px;
                color: #999;
                margin-top: 15px;
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 8px;
            }
            
            .generation-time::before {
                content: "🕒";
            }
            
            /* Utility Classes */
            .badge {
                display: inline-block;
                padding: 4px 10px;
                border-radius: 12px;
                font-size: 10px;
                font-weight: 600;
                text-align: center;
                min-width: 60px;
            }
            
            .badge-primary {
                background: #e3f2fd;
                color: #1565c0;
            }
            
            .badge-success {
                background: #e8f5e9;
                color: #2e7d32;
            }
            
            .badge-warning {
                background: #fff3e0;
                color: #ef6c00;
            }
            
            .badge-price {
                background: linear-gradient(135deg, #4CAF50, #2E7D32);
                color: white;
                font-size: 12px;
                padding: 6px 12px;
            }
            
            .text-center {
                text-align: center;
            }
            
            .text-right {
                text-align: right;
            }
            
            .font-bold {
                font-weight: bold;
            }
            
            .mb-3 {
                margin-bottom: 15px;
            }
            
            .group-indicator {
                display: inline-block;
                width: 8px;
                height: 8px;
                background: #4caf50;
                border-radius: 50%;
                margin-left: 5px;
                vertical-align: middle;
            }
            
            .customer-total-section {
                background: linear-gradient(135deg, #FF9800, #F57C00);
                color: white;
                padding: 15px;
                margin-top: 10px;
                border-radius: 8px;
                text-align: center;
                font-weight: bold;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="report-container">
            <!-- Report Header -->
            <div class="report-header">
                <h1>${reportType}</h1>
                <h2>🗓️ الفترة: ${exampleWeek.start} - ${exampleWeek.end}</h2>
            
            </div>
            
            <!-- Report Meta Information -->
            <div class="report-meta">
                <div class="meta-grid">
                    <div class="meta-item">
                        <span class="meta-label">عدد العملاء</span>
                        <span class="meta-value">${Object.keys(groupedByCustomer).length} عميل</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">إجمالي اللوحات</span>
                        <span class="meta-value">${printData.length} لوحة</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">إجمالي المساحة</span>
                        <span class="meta-value">${calculateTotalAdvertisingSpace(printData)} م²</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">متوسط المساحة/لوحة</span>
                        <span class="meta-value">${printData.length > 0 ? (calculateTotalAdvertisingSpace(printData) / printData.length).toFixed(2) : 0} م²</span>
                    </div>
                    ${cityId ? `
                    <div class="meta-item">
                        <span class="meta-label">المدينة المحددة</span>
                        <span class="meta-value">${cities?.find(c => c.id == cityId)?.name || ''}</span>
                    </div>
                    ` : ''}
                    ${templateNameFilter ? `
                    <div class="meta-item">
                        <span class="meta-label">النموذج المحدد</span>
                        <span class="meta-value">${templateNameFilter}</span>
                    </div>
                    ` : ''}
                    ${customerId ? `
                    <div class="meta-item">
                        <span class="meta-label">العميل المحدد</span>
                        <span class="meta-value">${customerId}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <!-- Customer Sections -->
            ${Object.entries(groupedByCustomer).map(([customerId, customerData], customerIndex) => `
                <div class="customer-section ${customerIndex > 0 && customerIndex % 2 === 0 ? 'page-break' : ''}">
                    <div class="customer-header">
                        <div class="customer-name">👤 ${customerData.customerName}</div>
                    </div>
                    
                    <div class="customer-info">
                        <div class="info-item">
                            <span class="info-label">الشركة:</span>
                            <span class="info-value">${customerData.customerCompany}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">عدد اللوحات:</span>
                            <span class="info-value badge badge-primary">${customerData.totalBookings} لوحة</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">إجمالي المساحة:</span>
                            <span class="info-value badge badge-warning">${customerData.totalArea.toFixed(2)} م²</span>
                        </div>
                       
                    </div>
                    
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th width="12%">النموذج</th>
                                <th width="12%">المنطقة</th>
                                <th width="15%">المكان</th>
                                <th width="15%">الاتجاه</th>
                                <th width="10%">القياس</th>
                                <th width="10%">المساحة لكل وجه (م²)</th>
                                <th width="8%">عدد الأوجه</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${customerData.groups.map((group, groupIndex) => {
                                // Calculate total faces for this group (number of repetitions)
                                const groupFaces = group.items.length;
                                
                                // Take only the first item from the group (since they're all the same)
                                const firstItem = group.items[0];
                                
                                // Get area per face (not multiplied by faces_number)
                                const areaPerFace = parseFloat(firstItem.item.template?.advertising_space || 0).toFixed(2);
                                
                                // Get size from template (القياس)
                                const size = firstItem.item.template?.size || "غير محدد";
                                
                                return `
                                    <tr class="group-highlight">
                                        <td>${firstItem.item.template?.model || "غير محدد"}</td>
                                        <td>${firstItem.item.region?.name || "غير محدد"}</td>
                                        <td class="text-right">${firstItem.item.place || "غير محدد"}</td>
                                        <td class="text-right">${firstItem.item.directions || firstItem.item.direction || "غير محدد"}</td>
                                        <td>
                                            <span class="size-cell">
                                                ${size}
                                            </span>
                                        </td>
                                        <td>
                                            <span class="area-cell">
                                                ${areaPerFace}
                                            </span>
                                        </td>
                                        <td>
                                            <div class="faces-cell">${groupFaces}</div>
                                        </td>
                                    </tr>
                                    
                                    ${groupFaces > 1 ? `
                                        <tr style="background: #f9f9f9; font-size: 9px;">
                                            <td colspan="7" class="text-right" style="padding: 5px 15px; color: #666;">
                                                <small>
                                                    <strong>عدد التكرارات في هذه المجموعة: ${groupFaces}</strong>
                                                </small>
                                            </td>
                                        </tr>
                                    ` : ''}
                                `;
                            }).join('')}
                            
                            <!-- Customer Total Row -->
                            <tr class="total-row">
                                <td colspan="7" class="text-center">
                                    <strong>إجمالي العميل: ${customerData.totalBookings} لوحة | إجمالي المساحة: ${customerData.totalArea.toFixed(2)} م² | عدد المجموعات: ${customerData.groups.length}</strong>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <!-- Customer Total Area Section -->
                    <div class="customer-total-section">
                        <span>🔢 مجموع أمتار الزبون:</span>
                        <span style="margin-right: 10px; font-size: 16px;">${customerData.totalArea.toFixed(2)} م²</span>
                    </div>
                </div>
            `).join('')}
            
            <!-- Report Summary -->
            <div class="report-summary">
                <div class="summary-title">ملخص التقرير</div>
                <div class="summary-grid">
                    <div class="summary-item">
                        <div class="summary-value">
                            <span>${Object.keys(groupedByCustomer).length}</span>
                        </div>
                        <div class="summary-label">عدد العملاء</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-value">
                            <span>${printData.length}</span>
                        </div>
                        <div class="summary-label">إجمالي اللوحات</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-value">
                            <span>${calculateTotalAdvertisingSpace(printData)}</span>
                            <span style="font-size: 14px;">م²</span>
                        </div>
                        <div class="summary-label">إجمالي المساحة</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-value">
                            <span>${(printData.length / Math.max(1, Object.keys(groupedByCustomer).length)).toFixed(1)}</span>
                        </div>
                        <div class="summary-label">المتوسط / عميل</div>
                    </div>
                </div>
                <div class="summary-note">
                    📋 <strong>ملاحظة:</strong> 
                    1. تم تحديث عمود "عدد الأوجه" ليظهر عدد التكرارات للوحات المتشابهة في (المنطقة، المكان، الاتجاه)
                    2. العمود "المساحة لكل وجه" يعرض المساحة الإعلانية لكل وجه بشكل منفرد
                    3. العمود "القياس" يعرض أبعاد اللوحة (مثال: 200X100)
                </div>
            </div>
            
            <!-- Report Footer -->
            <div class="report-footer">
                <div class="footer-grid">
                    <div class="footer-item">
                        نظام إدارة اللوحات الإعلانية
                    </div>
                    <div class="footer-item">
                        التقرير الأسبوعي - الإصدار 5.0
                    </div>
                    <div class="footer-item">
                        رقم التقرير: REP-${new Date().getTime().toString().slice(-8)}
                    </div>
                </div>
                <div class="generation-time">
                    تم إنشاء التقرير في: ${new Date().toLocaleString('ar-EG')}
                </div>
                <div style="margin-top: 15px; font-size: 10px; color: #999;">
                    © ${new Date().getFullYear()} جميع الحقوق محفوظة
                </div>
            </div>
        </div>
        
        <script>
            window.onload = function() {
                // Apply additional styling for print
                document.querySelectorAll('.customer-section').forEach((section, index) => {
                    if (index > 0 && index % 2 === 0) {
                        section.classList.add('page-break');
                    }
                });
                
                setTimeout(() => {
                    window.print();
                    setTimeout(() => {
                        window.close();
                    }, 1000);
                }, 1000);
            };
        </script>
    </body>
    </html>
  `;
  
  printWindow.document.open();
  printWindow.document.write(printContent);
  printWindow.document.close();
  
  setTimeout(() => {
    setIsGeneratingPDF(false);
  }, 2000);
};


  const handleExportPDF = () => {
    if (isWeeklyReport) {
      handleExportWeeklyPDF();
    } else {
      handleExportDetailsPDF();
    }
  };

  // Function to export as Word document (for Details report)
  const handleExportWord = () => {
    setIsGeneratingWord(true);
    
    try {
      const exportData = currentData;
      const reportType = isWeeklyReport ? 'التقرير الأسبوعي للوحات المحجوزة' : `تفاصيل اللوحات ${activeTab === "available" ? 'المتاحة' : 'المحجوزة'}`;
      const statusType = isWeeklyReport ? 'المحجوزة' : (activeTab === "available" ? 'المتاحة' : 'المحجوزة');
      const currentDate = new Date().toLocaleDateString('ar-EG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const totalBoards = exportData.length;
      const totalArea = exportData.reduce((sum, item) => {
        return sum + (parseFloat(item.template?.advertising_space || item.advertising_space || 0) * parseInt(item.faces_number || 1));
      }, 0).toFixed(2);
      
      const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${reportType}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Cairo', 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f8fafc;
            padding: 20px;
        }
        
        .report-container {
            max-width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            background: white;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            border-radius: 12px;
            padding: 30px;
            position: relative;
            overflow: hidden;
        }
        
        .header-section {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #3b82f6;
            position: relative;
        }
        
        .logo-header {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .logo-placeholder {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 24px;
        }
        
        .report-title {
            color: #1e293b;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
            position: relative;
            display: inline-block;
            padding-bottom: 10px;
        }
        
        .report-title:after {
            content: '';
            position: absolute;
            bottom: 0;
            right: 0;
            left: 0;
            height: 4px;
            background: linear-gradient(90deg, #3b82f6, #10b981);
            border-radius: 2px;
            width: 100px;
            margin: 0 auto;
        }
        
        .subtitle {
            color: #64748b;
            font-size: 18px;
            font-weight: 500;
            margin-bottom: 5px;
        }
        
        .date-badge {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6, #10b981);
            color: white;
            padding: 8px 20px;
            border-radius: 25px;
            font-weight: 600;
            margin: 10px 0;
            font-size: 16px;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
        }
        
        .info-cards {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 30px;
        }
        
        .info-card {
            background: linear-gradient(135deg, #f8fafc, #e2e8f0);
            border-radius: 10px;
            padding: 15px;
            text-align: center;
            border: 1px solid #e2e8f0;
            transition: transform 0.3s ease;
        }
        
        .info-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
        }
        
        .info-card-icon {
            width: 40px;
            height: 40px;
            background: #3b82f6;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 10px;
            color: white;
        }
        
        .info-card-value {
            font-size: 22px;
            font-weight: 700;
            color: #1e293b;
            margin: 5px 0;
        }
        
        .info-card-label {
            font-size: 14px;
            color: #64748b;
            font-weight: 500;
        }
        
        .table-container {
            overflow-x: auto;
            margin: 30px 0;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            min-width: 800px;
        }
        
        thead {
            background: linear-gradient(135deg, #1e293b, #334155);
            color: white;
        }
        
        th {
            padding: 15px;
            text-align: right;
            font-weight: 600;
            font-size: 14px;
            border-left: 1px solid rgba(255, 255, 255, 0.1);
            position: relative;
            color :Black;
        }
        
        th:last-child {
            border-left: none;
        }
        
        th:after {
            content: '';
            position: absolute;
            left: 0;
            top: 15%;
            height: 70%;
            width: 2px;
            background: rgba(255, 255, 255, 0.1);
        }
        
        th:first-child:after {
            display: none;
        }
        
        tbody tr {
            border-bottom: 1px solid #e2e8f0;
            transition: background-color 0.3s ease;
        }
        
        tbody tr:hover {
            background-color: #f1f5f9;
        }
        
        tbody tr:nth-child(even) {
            background-color: #f8fafc;
        }
        
        tbody tr:nth-child(even):hover {
            background-color: #e2e8f0;
        }
        
        td {
            padding: 12px 15px;
            text-align: right;
            font-size: 13px;
            color: #475569;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-align: center;
            min-width: 80px;
        }
        
        .available-badge {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
        }
        
        .booked-badge {
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
        }
        
        .code-cell {
            font-family: 'Courier New', monospace;
            font-weight: 600;
            color: #1e293b;
            background: #f0f9ff;
            border-radius: 4px;
            padding: 4px 8px;
        }
        
        .footer-section {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 12px;
        }
        
        .watermark {
            position: absolute;
            opacity: 0.03;
            font-size: 120px;
            font-weight: 900;
            color: #1e293b;
            transform: rotate(-45deg);
            top: 40%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            white-space: nowrap;
            pointer-events: none;
            z-index: -1;
        }
        
        .summary-section {
            background: linear-gradient(135deg, #f0f9ff, #dbeafe);
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 30px;
            border: 1px solid #bfdbfe;
        }
        
        .summary-title {
            color: #1e40af;
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .summary-title:before {
            content: '📊';
            font-size: 20px;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .summary-item {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        
        .summary-label {
            color: #475569;
            font-size: 14px;
        }
        
        .summary-value {
            color: #1e293b;
            font-size: 16px;
            font-weight: 600;
        }
        
        @media print {
            body {
                padding: 0;
                background: white;
            }
            
            .report-container {
                box-shadow: none;
                border-radius: 0;
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="report-container">
        <!-- Watermark -->
        <div class="watermark">${statusType}</div>
        
        <!-- Header -->
        <div class="header-section">
            <div class="logo-header">
                <div class="logo-placeholder">
                    شعار
                </div>
                <div>
                    <h1 class="report-title">${reportType}</h1>
                    <p class="subtitle">نظام إدارة اللوحات الإعلانية</p>
                </div>
            </div>
            
            <div class="date-badge">${currentDate}</div>
        </div>
        
        <!-- Info Cards -->
        <div class="info-cards">
            <div class="info-card">
                <div class="info-card-icon">📋</div>
                <div class="info-card-value">${totalBoards}</div>
                <div class="info-card-label">عدد اللوحات</div>
            </div>
            
            <div class="info-card">
                <div class="info-card-icon">📐</div>
                <div class="info-card-value">${totalArea}</div>
                <div class="info-card-label">المساحة الإجمالية (م²)</div>
            </div>
            
            <div class="info-card">
                <div class="info-card-icon">${isWeeklyReport ? '📅' : (activeTab === "available" ? '✅' : '📌')}</div>
                <div class="info-card-value"> اللوحات ${statusType}</div>
                <div class="info-card-label"> حالة التقرير</div>
            </div>
        </div>
        
        <!-- Summary Section -->
        <div class="summary-section">
            <div class="summary-title">ملخص التقرير</div>
            <div class="summary-grid">
                <div class="summary-item">
                    <span class="summary-label">نوع التقرير:</span>
                    <span class="summary-value">${isWeeklyReport ? 'تقرير أسبوعي' : 'تقرير تفصيلي'}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">حالة اللوحات:</span>
                    <span class="summary-value">${statusType}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">تاريخ الإنشاء:</span>
                    <span class="summary-value">${currentDate}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">المساحة المتوسطة:</span>
                    <span class="summary-value">${(totalArea / totalBoards).toFixed(2)} م²</span>
                </div>
            </div>
        </div>
        
        <!-- Table Section -->
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>كود اللوحة</th>
                        <th>النموذج</th>
                        <th>المساحة (م²)</th>
                        <th>عدد الأوجه</th>
                        <th>المدينة</th>
                        <th>المنطقة</th>
                        <th>المكان</th>
                        <th>الاتجاه</th>
                        <th>اسم العميل</th>
                        <th>تاريخ الحجز</th>
                        <th>تاريخ الانتهاء</th>
                        <th>الحالة</th>
                    </tr>
                </thead>
                <tbody>
                    ${exportData.map((item, index) => {
                        const area = (parseFloat(item.template?.advertising_space || item.advertising_space || 0) * parseInt(item.faces_number || 1)).toFixed(2);
                        const hasBooking = item.bookings && item.bookings.length > 0;
                        const statusClass = hasBooking ? 'booked-badge' : 'available-badge';
                        const statusText = hasBooking ? 'محجوزة' : 'متاحة';
                        
                        return `
                        <tr>
                            <td><span class="code-cell">${item.roadsign_code || `X${item.id?.toString().padStart(6, '0')}`}</span></td>
                            <td>${item.template?.model || item.template?.name || item.model || "غير محدد"}</td>
                            <td>${area}</td>
                            <td>${item.faces_number || 1}</td>
                            <td>${item.city?.name || "غير محدد"}</td>
                            <td>${item.region?.name || "غير محدد"}</td>
                            <td>${item.place || "غير محدد"}</td>
                            <td>${item.directions || item.direction || "غير محدد"}</td>
                            <td>${hasBooking ? (item.bookings[0]?.customer?.full_name || item.bookings[0]?.customer?.company_name || "غير محدد") : "---"}</td>
                            <td>${hasBooking ? formatArabicDate(item.bookings[0]?.start_date) : "---"}</td>
                            <td>${hasBooking ? formatArabicDate(item.bookings[0]?.end_date) : "---"}</td>
                            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
        
        <!-- Footer -->
        <div class="footer-section">
            <p>تم إنشاء هذا التقرير تلقائياً بواسطة نظام إدارة اللوحات الإعلانية</p>
            <p>© ${new Date().getFullYear()} - جميع الحقوق محفوظة</p>
            <p>صفحة ${totalBoards} من 1 | آخر تحديث: ${new Date().toLocaleTimeString('ar-EG', { hour12: true })}</p>
        </div>
    </div>
</body>
</html>`;
      
      const blob = new Blob([htmlContent], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `تقرير_${isWeeklyReport ? 'أسبوعي' : 'تفاصيل'}_${new Date().toISOString().split('T')[0]}_${statusType}.doc`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      // Optional: Show success message
      toast.success(`تم تصدير التقرير بنجاح! يحتوي على ${totalBoards} لوحة`);
      
    } catch (error) {
      console.error('Error exporting Word document:', error);
      toast.error('حدث خطأ أثناء تصدير الملف. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsGeneratingWord(false);
    }
  };

  // Table columns configuration
  const weeklyTableColumns = [
    {
      header: "كود اللوحة",
      accessor: "roadsign_code",
      cell: (row) => row.roadsign_code || `X${row.id?.toString().padStart(6, '0')}`,
      cellClassName: "text-center font-mono bg-blue-50 dark:bg-blue-900/20"
    },
    {
      header: "النموذج",
      accessor: "model",
      cell: (row) => row.template?.model || row.template?.name || "غير محدد",
      cellClassName: "text-center"
    },
    {
      header: "المساحة (م²)",
      accessor: "advertising_space",
      cell: (row) => {
        const space = parseFloat(row.template?.advertising_space || row.advertising_space || 0);
        const faces = parseInt(row.faces_number || 1);
        return (space * faces).toFixed(2);
      },
      cellClassName: "text-center font-bold"
    },
    {
      header: "الاتجاه",
      accessor: "directions",
      cell: (row) => row.directions || row.direction || "غير محدد",
      cellClassName: "text-center"
    },
    {
      header: "عدد الأوجه",
      accessor: "faces_number",
      cell: (row) => row.faces_number || 1,
      cellClassName: "text-center"
    },
    {
      header: "المدينة",
      accessor: "city.name",
      cell: (row) => row.city?.name || "غير محدد",
      cellClassName: "text-center"
    },
    {
      header: "المنطقة",
      accessor: "region.name",
      cell: (row) => row.region?.name || "غير محدد",
      cellClassName: "text-center"
    },
    {
      header: "المكان",
      accessor: "place",
      cell: (row) => row.place || "غير محدد",
      cellClassName: "text-right"
    },
    {
      header: "اسم العميل",
      accessor: "customer.name",
      cell: (row) => {
        if (row.bookings && row.bookings.length > 0) {
          const booking = row.bookings[0];
          return booking.customer?.full_name || booking.customer?.company_name || "غير محدد";
        }
        return "غير محدد";
      },
      cellClassName: "text-center bg-yellow-100 dark:bg-yellow-900/30 font-bold text-yellow-800 dark:text-yellow-200"
    },
  ];

  const detailsTableColumns = [
    {
      header: "كود اللوحة",
      accessor: "roadsign_code",
      cell: (row) => row.roadsign_code || `X${row.id?.toString().padStart(6, '0')}`,
      cellClassName: "text-center font-mono"
    },
    {
      header: "النموذج",
      accessor: "template.model",
      cell: (row) => row.template?.model || row.template?.name || "غير محدد",
      cellClassName: "text-center"
    },
    {
      header: "المساحة (م²)",
      accessor: "advertising_space",
      cell: (row) => {
        const space = parseFloat(row.template?.advertising_space || 0);
        const faces = parseInt(row.faces_number || 1);
        return (space * faces).toFixed(2);
      },
      cellClassName: "text-center font-bold"
    },
    {
      header: "عدد الأوجه",
      accessor: "faces_number",
      cell: (row) => row.faces_number || 1,
      cellClassName: "text-center"
    },
    {
      header: "المدينة",
      accessor: "city.name",
      cell: (row) => row.city?.name || "غير محدد",
      cellClassName: "text-center"
    },
    {
      header: "المنطقة",
      accessor: "region.name",
      cell: (row) => row.region?.name || "غير محدد",
      cellClassName: "text-center"
    },
    {
      header: "المكان",
      accessor: "place",
      cell: (row) => row.place || "غير محدد",
      cellClassName: "text-right"
    },
    {
      header: "الاتجاه",
      accessor: "directions",
      cell: (row) => row.directions || row.direction || "غير محدد",
      cellClassName: "text-center"
    },
    {
      header: "الحالة",
      accessor: "is_booked",
      cell: (row) => row.is_booked ? "محجوزة" : "متاحة",
      cellClassName: (row) => row.is_booked ? "text-center text-red-600 font-bold" : "text-center text-green-600 font-bold"
    }
  ];

  const tableColumns = isWeeklyReport ? weeklyTableColumns : detailsTableColumns;

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center">
        <Loader className="animate-spin" />
        <p className="text-muted-foreground text-sm">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-full mx-auto space-y-6 bg-background rounded-lg shadow-sm dark:shadow-gray-800">
      <h2 className="text-2xl font-bold text-foreground mb-4">
        {isWeeklyReport ? 'التقرير الأسبوعي للوحات المحجوزة' : 'تفاصيل اللوحات'}
      </h2>
      
      {/* Date Filters - Only for Weekly Report */}
      {isWeeklyReport && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
     <div>
  <Label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
    من تاريخ
  </Label>
  <div className="relative">
    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
    <input
      type="date"
      id="startDate"
      value={startDate}
      onChange={(e) => {
        const newStartDate = e.target.value;
        setStartDate(newStartDate);
        // تحديث تاريخ النهاية تلقائياً
        if (newStartDate) {
          const newEndDate = calculateEndDate(newStartDate, 6);
          setEndDate(newEndDate);
        }
      }}
      className="w-full pl-10 p-2 border dark:bg-gray-900 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
</div>

          <div>
            <Label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              إلى تاريخ
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                }}
                className="w-full pl-10 p-2 border dark:bg-gray-900 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-end">
            <Button
              onClick={clearAllFilters}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white"
            >
              مسح جميع الفلاتر
            </Button>
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <Label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            المدينة
          </Label>
          <select
            id="city"
            value={cityId}
            onChange={(e) => {
              setCityId(e.target.value);
              setRegionId(""); // Reset region when city changes
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

        {cityId && (
          <div>
            <Label htmlFor="region" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              المنطقة
            </Label>
            <select
              id="region"
              value={regionId}
              onChange={(e) => {
                setRegionId(e.target.value);
              }}
              className="w-full p-2 border dark:bg-gray-900 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع المناطق</option>
              {getRegionsForCity().map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <Label htmlFor="templateFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            اسم القالب
          </Label>
          <select
            id="templateFilter"
            value={templateNameFilter}
            onChange={(e) => {
              setTemplateNameFilter(e.target.value);
            }}
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

        {isWeeklyReport ? (
          <div>
            <Label htmlFor="customerFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              اسم العميل
            </Label>
            <select
              id="customerFilter"
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
              }}
              className="w-full p-2 border dark:bg-gray-900 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع العملاء</option>
              {customerOptions.length > 0 ? (
                customerOptions.map((customer) => (
                  <option key={customer.id} value={customer.name}>
                    {customer.name} {customer.company ? `- ${customer.company}` : ''}
                  </option>
                ))
              ) : (
                <option disabled>لا توجد عملاء في البيانات</option>
              )}
            </select>
            {customerId && (
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-green-600">✓ تم تطبيق فلتر العميل</span>
                <button
                  onClick={() => setCustomerId("")}
                  className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                  type="button"
                >
                  <X size={12} />
                  إزالة الفلتر
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
         
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        {/* Tabs for Available/Unavailable - Only for Details Report */}
        {!isWeeklyReport && (
          <div className="flex justify-center mb-4">
            <div className="inline-flex rounded-lg border border-gray-200 p-1">
              <button
                onClick={() => setActiveTab("available")}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === "available"
                    ? "bg-green-500 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                اللوحات المتاحة ({processDetailsData.available?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("unavailable")}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === "unavailable"
                    ? "bg-red-500 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                اللوحات المحجوزة ({processDetailsData.unavailable?.length || 0})
              </button>
            </div>
          </div>
        )}

        {/* Export Buttons */}
        <div className="flex flex-wrap justify-end gap-3 mb-4">
          <Button
            onClick={handleExportPDF}
            disabled={isGeneratingPDF || isFetching || currentData.length === 0}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
          >
            {isGeneratingPDF ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>جاري الإنشاء...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>تصدير PDF</span>
              </>
            )}
          </Button>
          
          <Button
            onClick={handleExportWord}
            disabled={isGeneratingWord || isFetching || currentData.length === 0}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isGeneratingWord ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>جاري الإنشاء...</span>
              </>
            ) : (
              <>
                <Printer className="w-4 h-4" />
                <span>تصدير Word</span>
              </>
            )}
          </Button>
        </div>

        {/* Data Summary */}
        {currentData.length > 0 && (
          <div className={`p-3 rounded-lg mb-4 ${
            (isWeeklyReport || activeTab === "unavailable") 
              ? "bg-red-50 dark:bg-red-900/20" 
              : "bg-green-50 dark:bg-green-900/20"
          }`}>
            <h3 className={`font-semibold ${
              (isWeeklyReport || activeTab === "unavailable")
                ? "text-red-700 dark:text-red-300" 
                : "text-green-700 dark:text-green-300"
            }`}>
              {isWeeklyReport ? 'اللوحات المحجوزة' : `اللوحات ${activeTab === "available" ? 'المتاحة' : 'المحجوزة'}`}: {currentData.length} لوحة
              {templateNameFilter && ` | مفلتر حسب القالب: "${templateNameFilter}"`}
              {customerId && ` | مفلتر حسب العميل: "${customerId}"`}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              إجمالي الأمتار الإعلانية: {calculateTotalAdvertisingSpace(currentData)} متر مربع
            </p>
          </div>
        )}

        {/* Data Table */}
        {currentData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900">
                  {tableColumns.map((column, index) => (
                    <th key={index} className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300 border-b">
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentData.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b">
                    {tableColumns.map((column, colIndex) => (
                      <td key={colIndex} className={`px-4 py-3 text-right ${column.cellClassName ? 
                        (typeof column.cellClassName === 'function' ? column.cellClassName(item) : column.cellClassName) 
                        : ''}`}>
                        {column.cell ? column.cell(item) : item[column.accessor]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center p-8 text-gray-500">
            {isFetching ? (
              <div className="flex items-center justify-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                <span>جاري تحميل البيانات...</span>
              </div>
            ) : (
              <>
                <p>لا توجد لوحات {isWeeklyReport ? 'محجوزة' : (activeTab === "available" ? 'متاحة' : 'محجوزة')} تطابق الفلاتر المحددة</p>
                {templateNameFilter && (
                  <p className="text-sm text-red-600 mt-2">
                    لا توجد لوحات للقالب: "${templateNameFilter}"
                  </p>
                )}
                {isWeeklyReport && (
                  <p className="text-sm text-blue-600 mt-2">
                    الفترة: {formatArabicDate(startDate)} - {formatArabicDate(endDate)}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoadSignsReport;