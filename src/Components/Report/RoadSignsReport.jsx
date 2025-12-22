import { DynamicTable } from "../../utils/Tables/DynamicTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportBookingsColumns } from "../../utils/Tables/ColumnsTable/ReportBookingsColumns";
import { ReportUnbookedSignsColumns } from "../../utils/Tables/ColumnsTable/ReportUnbookedSignsColumns";
import { Loader, FileText, Printer } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import useReports from "../../hooks/useReports";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useState, useEffect, useRef } from "react";
import { productTypeOptions } from "../../Static/StaticData";
import html2canvas from "html2canvas";

const RoadSignsReport = () => {
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

  const calculateBookingAdvertisingSpace = (booking) => {
    const advertisingSpace = parseFloat(booking.template?.advertising_space) || 0;
    const facesNumber = parseInt(booking.faces_number) || 1;
    const bookingFaces = parseInt(booking.bookings?.[0]?.pivot?.booking_faces) || 
                         parseInt(booking.pivot?.booking_faces) || facesNumber;
    return advertisingSpace * bookingFaces;
  };

  const calculateUnbookedAdvertisingSpace = (sign) => {
    const advertisingSpace = parseFloat(sign.template?.advertising_space) || 0;
    const facesNumber = parseInt(sign.faces_number) || 1;
    return advertisingSpace * facesNumber;
  };

  const [customerTypeFilter, setCustomerTypeFilter] = useState("");
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

  // Refs للطباعة
  const printRef = useRef(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Initialize local filters from hook values
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

  const isDateInRange = (dateString, fromDate, toDate) => {
    if (!dateString) return true;
    
    const date = new Date(dateString);
    
    if (fromDate) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      if (date < from) return false;
    }
    
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      if (date > to) return false;
    }
    
    return true;
  };

  // Filter bookings data
  useEffect(() => {
    if (!bookingsData || !Array.isArray(bookingsData)) {
      setFilteredBookingsData([]);
      return;
    }

    let filtered = [...bookingsData];

    if (localFilters.cityId && localFilters.cityId !== "") {
      filtered = filtered.filter(booking => {
        const bookingCityId = booking.city_id || booking.city?.id;
        return bookingCityId === parseInt(localFilters.cityId);
      });
    }

    if (customerTypeFilter && customerTypeFilter !== "" && customersData && customersData.length > 0) {
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

    if (localFilters.fromDate || localFilters.toDate) {
      filtered = filtered.filter(booking => {
        const bookingDate = booking.created_at || booking.booking_date || booking.date;
        return isDateInRange(bookingDate, localFilters.fromDate, localFilters.toDate);
      });
    }

    setFilteredBookingsData(filtered);
  }, [bookingsData, customerTypeFilter, customersData, localFilters]);

  // Filter unbooked signs data
  useEffect(() => {
    if (!unbookedSignsData || !Array.isArray(unbookedSignsData)) {
      setFilteredUnbookedData([]);
      return;
    }

    let filtered = [...unbookedSignsData];
    
    if (localFilters.cityId && localFilters.cityId !== "") {
      filtered = filtered.filter(sign => {
        const signCityId = sign.city_id || sign.city?.id;
        return signCityId === parseInt(localFilters.cityId);
      });
    }

    if (localFilters.fromDate || localFilters.toDate) {
      filtered = filtered.filter(sign => {
        const signDate = sign.created_at || sign.date;
        return isDateInRange(signDate, localFilters.fromDate, localFilters.toDate);
      });
    }

    setFilteredUnbookedData(filtered);
  }, [unbookedSignsData, localFilters]);

  const customerTypeOptions = [
    { value: "", label: "جميع الأنواع" },
    ...productTypeOptions.map(option => ({
      value: option.value,
      label: option.label
    }))
  ];

  const handleFilterChange = (filterName, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleDateChange = (dateType, value) => {
    if (dateType === 'fromDate') {
      setFromDate(value);
    } else if (dateType === 'toDate') {
      setToDate(value);
    }
    handleFilterChange(dateType, value);
  };

  const clearAllFilters = () => {
    setCustomerTypeFilter("");
    handleCityChange({ target: { value: "" } });
    setFromDate("");
    setToDate("");
    setLocalFilters({
      cityId: "",
      regionId: "",
      model: "",
      fromDate: "",
      toDate: "",
      customerId: "",
    });
  };

  const calculateTotalAdvertisingSpace = (data) => {
    return data.reduce((total, booking) => {
      return total + calculateBookingAdvertisingSpace(booking);
    }, 0).toFixed(2);
  };

  const calculateTotalUnbookedAdvertisingSpace = (data) => {
    return data.reduce((total, sign) => {
      return total + calculateUnbookedAdvertisingSpace(sign);
    }, 0).toFixed(2);
  };

  const getCustomerTypeLabel = () => {
    if (!customerTypeFilter) return "";
    const option = productTypeOptions.find(opt => opt.value == customerTypeFilter);
    return option ? option.label : "";
  };

  // دالة لتنسيق التاريخ بالعربية
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

  // دالة لإنشاء HTML للتقرير
  const createReportHTML = () => {
    const customerTypeLabel = getCustomerTypeLabel();
    const currentDate = formatArabicDate(new Date());
    const fromDateText = localFilters.fromDate ? formatArabicDate(localFilters.fromDate) : "البداية";
    const toDateText = localFilters.toDate ? formatArabicDate(localFilters.toDate) : "النهاية";

    // تجميع البيانات حسب نوع المنتج
    const groupedByProductType = {};
    
    // تهيئة المجموعات
    productTypeOptions.forEach(type => {
      groupedByProductType[type.value] = {
        label: type.label,
        bookings: [],
        totalMeters: 0,
        totalBookings: 0,
        customers: {}
      };
    });

    groupedByProductType["unknown"] = {
      label: "غير معروف",
      bookings: [],
      totalMeters: 0,
      totalBookings: 0,
      customers: {}
    };

    // تجميع البيانات
    filteredBookingsData.forEach(booking => {
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
          label: `النوع ${productType}`,
          bookings: [],
          totalMeters: 0,
          totalBookings: 0,
          customers: {}
        };
      }
      
      const advertisingSpace = calculateBookingAdvertisingSpace(booking);
      groupedByProductType[productType].bookings.push(booking);
      groupedByProductType[productType].totalMeters += advertisingSpace;
      groupedByProductType[productType].totalBookings += 1;
      
      // تجميع حسب العميل
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
          totalMeters: 0
        };
      }
      
      groupedByProductType[productType].customers[customerId].bookings.push(booking);
      groupedByProductType[productType].customers[customerId].totalMeters += advertisingSpace;
    });

    // إحصاءات القوالب
    const templateStats = {};
    filteredBookingsData.forEach(booking => {
      const templateName = booking.template?.model || booking.template?.name || "غير معروف";
      const advertisingSpace = calculateBookingAdvertisingSpace(booking);
      const faces = parseInt(booking.bookings?.[0]?.pivot?.booking_faces) || 
                   parseInt(booking.pivot?.booking_faces) || 
                   parseInt(booking.faces_number) || 1;
      
      if (!templateStats[templateName]) {
        templateStats[templateName] = {
          count: 0,
          totalFaces: 0,
          totalMeters: 0
        };
      }
      
      templateStats[templateName].count += 1;
      templateStats[templateName].totalFaces += faces;
      templateStats[templateName].totalMeters += advertisingSpace;
    });

    // إنشاء HTML
    let html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تقرير المنتجات</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
          
          body {
            font-family: 'Amiri', serif;
            direction: rtl;
            margin: 0;
            padding: 20px;
            background-color: #fff;
            color: #000;
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
          }
          
          .report-container {
            width: 100%;
          }
          
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          
          .header h1 {
            font-size: 28px;
            color: #1a365d;
            margin: 0 0 10px 0;
          }
          
          .header .subtitle {
            font-size: 16px;
            color: #666;
            margin: 5px 0;
          }
          
          .report-info {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-right: 4px solid #4a90e2;
          }
          
          .product-type-section {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          
          .product-type-header {
            background-color: #2c5282;
            color: white;
            padding: 12px 15px;
            border-radius: 6px 6px 0 0;
            font-size: 18px;
            font-weight: bold;
            text-align: center;
          }
          
          .product-type-stats {
            background-color: #ebf8ff;
            padding: 10px 15px;
            border: 1px solid #bee3f8;
            border-top: none;
            display: flex;
            justify-content: space-between;
            font-size: 14px;
          }
          
          .customer-section {
            margin: 15px 0;
            page-break-inside: avoid;
          }
          
          .customer-header {
            background-color: #fefcbf;
            color: #000;
            padding: 10px 15px;
            border-radius: 4px;
            font-size: 16px;
            font-weight: bold;
            border-right: 4px solid #ecc94b;
          }
          
          .customer-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 12px;
          }
          
          .customer-table th {
            background-color: #4a90e2;
            color: white;
            padding: 8px;
            text-align: center;
            border: 1px solid #ddd;
          }
          
          .customer-table td {
            padding: 6px;
            text-align: center;
            border: 1px solid #ddd;
          }
          
          .customer-table tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          
          .customer-total {
            text-align: left;
            padding: 8px 15px;
            font-weight: bold;
            color: #276749;
            background-color: #c6f6d5;
            border-radius: 4px;
            margin-top: 10px;
            font-size: 13px;
          }
          
          .template-summary {
            margin-top: 40px;
            page-break-before: always;
          }
          
          .template-summary h2 {
            text-align: center;
            color: #6b46c1;
            font-size: 22px;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #9f7aea;
          }
          
          .summary-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            font-size: 13px;
          }
          
          .summary-table th {
            background-color: #9f7aea;
            color: white;
            padding: 10px;
            text-align: center;
            border: 1px solid #ddd;
          }
          
          .summary-table td {
            padding: 8px;
            text-align: center;
            border: 1px solid #ddd;
          }
          
          .summary-table tr:last-child {
            background-color: #48bb78;
            color: white;
            font-weight: bold;
          }
          
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ccc;
            color: #666;
            font-size: 12px;
          }
          
          .page-break {
            page-break-after: always;
          }
          
          @media print {
            body {
              width: 100%;
              margin: 0;
              padding: 10mm;
            }
            
            .page-break {
              page-break-after: always;
            }
            
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          <div class="header">
            <h1>تقرير المنتجات - كشف الحجوزات</h1>
            <div class="subtitle">تاريخ التقرير: ${currentDate}</div>
            <div class="subtitle">الفترة: من ${fromDateText} إلى ${toDateText}</div>
            ${customerTypeLabel ? `<div class="subtitle">نوع المنتج: ${customerTypeLabel}</div>` : ''}
            <div class="subtitle">عدد الحجوزات: ${filteredBookingsData.length}</div>
          </div>
          
          <div class="report-info">
            <div style="text-align: center; font-size: 16px; font-weight: bold; color: #2d3748;">
              إجمالي الأمتار الإعلانية: ${calculateTotalAdvertisingSpace(filteredBookingsData)} متر مربع
            </div>
          </div>
    `;

    // إضافة كل نوع منتج
    Object.entries(groupedByProductType).forEach(([typeKey, typeData]) => {
      if (typeData.totalBookings === 0) return;
      
      html += `
        <div class="product-type-section">
          <div class="product-type-header">
            نوع المنتج: ${typeData.label}
          </div>
          
          <div class="product-type-stats">
            <span>عدد الحجوزات: ${typeData.totalBookings}</span>
            <span>الإجمالي: ${typeData.totalMeters.toFixed(0)} متر مربع</span>
          </div>
      `;
      
      // إضافة كل عميل في هذا النوع
      Object.values(typeData.customers).forEach((customer, customerIndex) => {
        html += `
          <div class="customer-section">
            <div class="customer-header">
              العميل: ${customer.name}
            </div>
            
            <table class="customer-table">
              <thead>
                <tr>
                  <th>م</th>
                  <th>النوع</th>
                  <th>المساحة</th>
                  <th>الوجوه</th>
                  <th>الإجمالي</th>
                  <th>المكان</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
        `;
        
        customer.bookings.forEach((booking, index) => {
          const advertisingSpace = parseFloat(booking.template?.advertising_space) || 0;
          const faces = parseInt(booking.faces_number) || 1;
          const bookedFaces = parseInt(booking.bookings?.[0]?.pivot?.booking_faces) || 
                            parseInt(booking.pivot?.booking_faces) || faces;
          const totalMeters = advertisingSpace * bookedFaces;
          const templateName = booking.template?.model || booking.template?.name || "غير معروف";
          const place = booking.place || "غير معروف";
          const date = formatArabicDate(booking.created_at || booking.booking_date || booking.date);
          
          html += `
            <tr>
              <td>${index + 1}</td>
              <td>${templateName}</td>
              <td>${advertisingSpace.toFixed(2)}</td>
              <td>${bookedFaces}</td>
              <td>${totalMeters.toFixed(0)}</td>
              <td>${place}</td>
              <td>${date}</td>
            </tr>
          `;
        });
        
        html += `
              </tbody>
            </table>
            
            <div class="customer-total">
              إجمالي العميل: ${customer.totalMeters.toFixed(0)} متر مربع
            </div>
          </div>
        `;
      });
      
      html += `</div>`;
    });

    // قسم إحصاءات القوالب
    html += `
      <div class="template-summary">
        <h2>ملخص استخدام القوالب</h2>
        
        <table class="summary-table">
          <thead>
            <tr>
              <th>م</th>
              <th>اسم القالب</th>
              <th>عدد المرات</th>
              <th>إجمالي الوجوه</th>
              <th>المساحة الكلية (م²)</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    const statsArray = Object.entries(templateStats)
      .map(([templateName, stats], index) => ({
        index,
        templateName,
        stats
      }))
      .sort((a, b) => b.stats.count - a.stats.count);
    
    statsArray.forEach((item, i) => {
      html += `
        <tr>
          <td>${i + 1}</td>
          <td>${item.templateName}</td>
          <td>${item.stats.count}</td>
          <td>${item.stats.totalFaces}</td>
          <td>${item.stats.totalMeters.toFixed(0)}</td>
        </tr>
      `;
    });
    
    // المجاميع الكلية
    const totalCount = Object.values(templateStats).reduce((sum, stat) => sum + stat.count, 0);
    const totalFaces = Object.values(templateStats).reduce((sum, stat) => sum + stat.totalFaces, 0);
    const totalMeters = Object.values(templateStats).reduce((sum, stat) => sum + stat.totalMeters, 0);
    
    html += `
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2"><strong>المجموع الكلي</strong></td>
              <td><strong>${totalCount}</strong></td>
              <td><strong>${totalFaces}</strong></td>
              <td><strong>${totalMeters.toFixed(0)}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <div class="footer">
        <p>---------------------------------------------</p>
        <p>تم الإنشاء آلياً بواسطة نظام التقارير</p>
        <p>تاريخ الطباعة: ${currentDate}</p>
      </div>
    `;
    
    html += `
        </div>
      </body>
      </html>
    `;
    
    return html;
  };

  // دالة الطباعة باستخدام HTML2Canvas
  const handlePrintReport = async () => {
    if (filteredBookingsData.length === 0) {
      alert("لا توجد بيانات للطباعة");
      return;
    }

    setIsGeneratingPDF(true);
    
    try {
      // إنشاء HTML للتقرير
      const htmlContent = createReportHTML();
      
      // إنشاء نافذة جديدة وعرض HTML
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      
      if (!printWindow) {
        alert('يرجى السماح بالنوافذ المنبثقة لهذا الموقع');
        setIsGeneratingPDF(false);
        return;
      }
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // انتظر حتى يتم تحميل الصفحة
      printWindow.onload = () => {
        setTimeout(async () => {
          try {
            // استخدام html2canvas لالتقاط الصفحة
            const canvas = await html2canvas(printWindow.document.body, {
              scale: 2, // زيادة الجودة
              useCORS: true,
              logging: false,
              backgroundColor: '#ffffff'
            });
            
            // إنشاء PDF
            const pdf = new jsPDF({
              orientation: 'portrait',
              unit: 'mm',
              format: 'a4'
            });
            
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            let heightLeft = imgHeight;
            let position = 0;
            
            // إضافة الصورة إلى PDF
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
            
            // إضافة صفحات إضافية إذا لزم الأمر
            while (heightLeft > 0) {
              position = heightLeft - imgHeight;
              pdf.addPage();
              pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
              heightLeft -= pageHeight;
            }
            
            // حفظ PDF
            const fileName = `تقرير_المنتجات_${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);
            
            // إغلاق النافذة
            printWindow.close();
            
          } catch (error) {
            console.error('Error generating PDF:', error);
            alert('حدث خطأ أثناء إنشاء PDF. يرجى المحاولة مرة أخرى.');
          } finally {
            setIsGeneratingPDF(false);
          }
        }, 1000); // انتظر ثانية لتحميل الخطوط والصور
      };
      
    } catch (error) {
      console.error('Error in print report:', error);
      alert('حدث خطأ. يرجى المحاولة مرة أخرى.');
      setIsGeneratingPDF(false);
    }
  };

  // دالة بديلة أبسط للطباعة مباشرة
  const handleSimplePrint = () => {
    if (filteredBookingsData.length === 0) {
      alert("لا توجد بيانات للطباعة");
      return;
    }

    const htmlContent = createReportHTML();
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (!printWindow) {
      alert('يرجى السماح بالنوافذ المنبثقة لهذا الموقع');
      return;
    }
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // بعد تحميل المحتوى، قم بالطباعة
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  };

  const generateBookingsPdf = () => {
    if (filteredBookingsData.length === 0) {
      alert("لا توجد بيانات لتصديرها");
      return;
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // ... (الكود الأصلي)

    const fileName = `كشف_الحجوزات_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const generateUnbookedPdf = () => {
    if (filteredUnbookedData.length === 0) {
      alert("لا توجد بيانات لتصديرها");
      return;
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // ... (الكود الأصلي)

    const fileName = `كشف_اللوحات_غير_المحجوزة_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
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
      <h2 className="text-2xl font-bold text-foreground mb-4">التقارير</h2>
      
      {/* Filters Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* City Filter */}
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

        {/* Customer Type Filter */}
        <div>
          <Label
            htmlFor="customerType"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            نوع الزبون
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

        {/* Clear Filters Button */}
        <div className="flex items-end">
          <Button
            onClick={clearAllFilters}
            className="w-full bg-gray-500 hover:bg-gray-600 text-white"
          >
            مسح جميع الفلاتر
          </Button>
        </div>
      </div>

      {/* Date Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <Label className="mb-2 text-sm font-medium text-right text-foreground">
            من تاريخ
          </Label>
          <input
            type="date"
            value={localFilters.fromDate || ''}
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
            value={localFilters.toDate || ''}
            onChange={(e) => handleDateChange('toDate', e.target.value)}
            className="p-2.5 border rounded-lg bg-card text-foreground text-sm shadow-sm focus:ring-2 focus:ring-primary focus:border-primary w-full transition-colors duration-200"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        defaultValue="bookings"
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full overflow-auto grid-cols-5 justify-between flex bg-card rounded-lg border border-border">
          <TabsTrigger value="bookings" className="text-sm font-medium">
            الحجوزات ({filteredBookingsData.length})
          </TabsTrigger>
          <TabsTrigger value="unbooked" className="text-sm font-medium">
            اللوحات الغير محجوزة ({filteredUnbookedData.length})
          </TabsTrigger>
        </TabsList>

        {/* Bookings Table */}
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
            </div>
            
            <div className="flex flex-wrap gap-3">
              {/* زر الطباعة الجديد - PDF عالي الجودة */}
              <Button
                onClick={handlePrintReport}
                disabled={isGeneratingPDF || isBookingsLoading || isBookingsFetching || filteredBookingsData.length === 0}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
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
              
              {/* زر الطباعة البسيط */}
              <Button
                onClick={handleSimplePrint}
                disabled={isBookingsLoading || isBookingsFetching || filteredBookingsData.length === 0}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة مباشرة</span>
              </Button>
              
                {/*
              
              

              
                */}

                
              
            </div>
          </div>
          
          {filteredBookingsData.length > 0 ? (
            <>
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h3 className="font-semibold text-green-700 dark:text-green-300">
                  إجمالي الأمتار الإعلانية: {calculateTotalAdvertisingSpace(filteredBookingsData)}
                </h3>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  عدد الحجوزات: {filteredBookingsData.length}
                </p>
              </div>
              
              <DynamicTable
                data={filteredBookingsData}
                columns={[
                  ...ReportBookingsColumns.filter(col => col.accessor !== "total_advertising_space"),
                  {
                    header: "عدد الأمتار الإعلانية",
                    accessor: "total_advertising_space",
                    cellClassName: "text-center",
                    cell: (row) => {
                      const totalSpace = calculateBookingAdvertisingSpace(row);
                      return totalSpace.toFixed(2);
                    }
                  }
                ]}
                isLoading={isBookingsFetching}
                className="bg-card rounded-lg shadow-sm border border-border w-full"
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
                "لا توجد حجوزات تطابق الفلاتر المحددة"
              )}
            </div>
          )}
        </TabsContent>

        {/* Unbooked Signs Table */}
        <TabsContent value="unbooked">
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1">
              {localFilters.customerId && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="font-semibold text-blue-700 dark:text-blue-300">
                    عرض تقرير اللوحات غير المحجوزة
                  </h3>
                </div>
              )}
            </div>
            
            <Button
              onClick={generateUnbookedPdf}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
              disabled={isUnbookedLoading || isUnbookedFetching || filteredUnbookedData.length === 0}
            >
              <FileText className="w-4 h-4" />
              <span>تصدير كملف PDF</span>
            </Button>
          </div>
          
          {filteredUnbookedData.length > 0 ? (
            <>
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h3 className="font-semibold text-green-700 dark:text-green-300">
                  إجمالي الأمتار الإعلانية للوحات غير المحجوزة: {calculateTotalUnbookedAdvertisingSpace(filteredUnbookedData)}
                </h3>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  عدد اللوحات غير المحجوزة: {filteredUnbookedData.length}
                </p>
              </div>
              
              <DynamicTable
                data={filteredUnbookedData}
                columns={[
                  ...ReportUnbookedSignsColumns.filter(col => col.accessor !== "total_advertising_space"),
                  {
                    header: "عدد الأمتار الإعلانية",
                    accessor: "total_advertising_space",
                    cellClassName: "text-center",
                    cell: (row) => {
                      const totalSpace = calculateUnbookedAdvertisingSpace(row);
                      return totalSpace.toFixed(2);
                    }
                  }
                ]}
                isLoading={isUnbookedFetching}
                className="bg-card rounded-lg shadow-sm border border-border w-full"
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
                "لا توجد لوحات غير محجوزة تطابق الفلاتر المحددة"
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RoadSignsReport;