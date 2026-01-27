import { useState, useMemo, useEffect } from "react";
import { DynamicTable } from "../../utils/Tables/DynamicTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { ReportBookingsCustomersColumns } from "../../utils/Tables/ColumnsTable/ReportBookingsCustomersColumns";
import { ReportPdf } from "./ReportPdf";
import { productTypeOptions } from "../../Static/StaticData";
import { Label } from "@/components/ui/label";
import useReports from "../../hooks/useReports";
import { Button } from "@/components/ui/button";

const ReportsContainer = () => {
  const {
    setActiveTab,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    data,
    isBookingsDateLoading,
    isBookingsDateFetching,
    productId,
    setProductId,
    selectedCustomerId,
    setSelectedCustomerId,
    customersData,
    isCustomersLoading,
    customersError,
    handleCustomerChange,
    cities,
    regions,
  } = useReports();

  // State for expanded directions
  const [expandedDirections, setExpandedDirections] = useState({});

  // Debug: Log data structure
  useEffect(() => {
    if (data?.customers?.[0]?.roadSigns?.[0]) {
      console.log("🔍 Sample road sign structure:", data.customers[0].roadSigns[0]);
      console.log("📋 Regions data from sign:", data.customers[0].roadSigns[0].region);
    }
  }, [data]);

  // Function to get region name from road sign object
  const getRegionName = (sign) => {
    // First check if region object exists in the sign
    if (sign?.region?.name) {
      return sign.region.name;
    }
    // Fallback to region ID if name not available
    return sign?.region_id ? `المنطقة ${sign.region_id}` : 'غير محدد';
  };

  // Function to group road signs by city, region, place, model, and direction
  const groupRoadSigns = (roadSigns) => {
    if (!roadSigns || !Array.isArray(roadSigns)) return [];
    
    const groupedMap = {};
    
    roadSigns.forEach(sign => {
      // Get the values for grouping - including region name
      const regionName = getRegionName(sign);
      const place = sign?.place || 'غير محدد';
      const model = sign?.template?.model || 'غير محدد';
      const direction = sign?.directions || sign?.direction || 'غير محدد';
      
      // Create a unique key based on region, place, model, and direction
      const key = `${regionName}|${place}|${model}|${direction}`;
      
      if (!groupedMap[key]) {
        groupedMap[key] = {
          ...sign,
          key: key,
          region: regionName, // Store region name
          place: place,
          model: model,
          direction: direction,
          originalDirection: direction, // Store original for PDF
          groupedRecords: [sign],
          pivot: {
            ...sign.pivot,
            booking_faces: sign.pivot?.booking_faces || 0,
            total_booking_faces: sign.pivot?.booking_faces || 0,
            start_dates: [sign.pivot?.start_date],
            end_dates: [sign.pivot?.end_date]
          },
          total_advertising_space: sign.total_advertising_space || 0,
          grouped_count: 1,
          template: sign.template,
          region_id: sign.region_id,
          region_object: sign.region // Keep original region object
        };
      } else {
        // Add to existing group
        const existing = groupedMap[key];
        existing.groupedRecords.push(sign);
        existing.grouped_count += 1;
        
        existing.pivot.booking_faces = (existing.pivot.booking_faces || 0) + (sign.pivot?.booking_faces || 0);
        existing.pivot.total_booking_faces = (existing.pivot.total_booking_faces || 0) + (sign.pivot?.booking_faces || 0);
        existing.total_advertising_space = (existing.total_advertising_space || 0) + (sign.total_advertising_space || 0);
        existing.pivot.start_dates.push(sign.pivot?.start_date);
        existing.pivot.end_dates.push(sign.pivot?.end_date);
      }
    });
    
    // Convert to array and format dates for display
    return Object.values(groupedMap).map(group => {
      const startDates = group.pivot.start_dates?.filter(Boolean) || [];
      const endDates = group.pivot.end_dates?.filter(Boolean) || [];
      
      if (startDates.length > 1) {
        const earliestStart = startDates.reduce((earliest, current) => 
          current < earliest ? current : earliest
        );
        const latestEnd = endDates.reduce((latest, current) => 
          current > latest ? current : latest
        );
        
        return {
          ...group,
          pivot: {
            ...group.pivot,
            start_date: `${earliestStart} (${group.grouped_count})`,
            end_date: `${latestEnd} (${group.grouped_count})`,
            booking_faces: group.pivot.booking_faces
          }
        };
      }
      
      return group;
    });
  };

  // Toggle expanded direction
  const toggleDirection = (key) => {
    setExpandedDirections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Process customer data with grouping
  const processCustomerData = (customer) => {
    if (!customer) return null;
    
    return {
      ...customer,
      roadSigns: groupRoadSigns(customer.roadSigns)
    };
  };

  // Filter and process data based on selected customer
  const filteredData = selectedCustomerId 
    ? {
        ...data,
        customers: data?.customers?.filter(
          customer => customer.id === parseInt(selectedCustomerId)
        ).map(processCustomerData) || []
      }
    : {
        ...data,
        customers: data?.customers?.map(processCustomerData) || []
      };

  // Find selected customer for PDF title
  const selectedCustomer = selectedCustomerId 
    ? customersData?.find(c => c.id === parseInt(selectedCustomerId))
    : null;

  // Prepare data for PDF with original directions
  const pdfData = useMemo(() => {
    if (!filteredData?.customers) return { customers: [] };
    
    const customersForPdf = filteredData.customers.map(customer => ({
      ...customer,
      roadSigns: customer.roadSigns?.map(sign => ({
        ...sign,
        direction: sign.originalDirection || sign.direction,
        region: sign.region || getRegionName(sign) // Ensure region is included for PDF
      })) || []
    }));
    
    return {
      ...filteredData,
      customers: customersForPdf
    };
  }, [filteredData]);

  // Handle Word Export
  const handleExportWord = () => {
    if (!filteredData?.customers || filteredData.customers.length === 0) {
      alert("لا توجد بيانات للتصدير");
      return;
    }

    // Calculate templateStats from customer data
    const calculateTemplateStats = () => {
      const stats = {};
      
      filteredData.customers?.forEach(customer => {
        customer.roadSigns?.forEach(sign => {
          const templateName = sign.template?.model || sign.template?.name || "غير معروف";
          
          if (!stats[templateName]) {
            stats[templateName] = {
              count: 0,
              size: sign.template?.size || "غير محدد"
            };
          }
          
          stats[templateName].count += 1;
        });
      });
      
      return stats;
    };

    const templateStats = calculateTemplateStats();
    const statsArray = Object.entries(templateStats || {})
      .map(([templateName, stats]) => ({
        templateName,
        stats
      }))
      .sort((a, b) => b.stats.count - a.stats.count);

    // Create HTML content
    let htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تقرير حجوزات الزبائن</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
          
          body {
            font-family: 'Amiri', serif;
            direction: rtl;
            text-align: right;
            margin: 20px;
            padding: 20px;
            line-height: 1.8;
            word-spacing: 1px;
          }
          
          .report-header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          
          .report-header h1 {
            font-size: 28px;
            color: #1a365d;
            margin: 0 0 15px 0;
          }
          
          .report-header .subtitle {
            font-size: 16px;
            color: #666;
            margin: 8px 0;
          }
          
          .customer-section {
            margin-bottom: 40px;
            page-break-inside: avoid;
            border: 1px solid #ddd;
            padding: 20px;
            border-radius: 8px;
            background-color: #f8f9fa;
          }
          
          .customer-name {
            font-size: 20px;
            color: #b45309;
            font-weight: bold;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #ecc94b;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            font-size: 14px;
          }
          
          table th {
            background-color: #4a90e2;
            color: white;
            padding: 10px 8px;
            text-align: center;
            border: 1px solid #ddd;
            font-size: 15px;
          }
          
          table td {
            padding: 8px 6px;
            text-align: center;
            border: 1px solid #ddd;
            line-height: 1.6;
          }
          
          table tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          
          .group-note {
            font-size: 12px;
            color: #666;
            font-style: italic;
            margin-top: 5px;
          }
          
          .footer {
            text-align: center;
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #ccc;
            color: #666;
            font-size: 13px;
          }
          
          @media print {
            body {
              font-size: 12px;
            }
            
            .customer-section {
              page-break-inside: avoid;
            }
            
            table {
              font-size: 11px;
            }
          }
        </style>
      </head>
      <body>
        <div class="report-header">
          <h1>تقرير حجوزات الزبائن</h1>
          <div class="subtitle">تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}</div>
          <div class="subtitle">الفترة: من ${fromDate} إلى ${toDate}</div>
          ${productId ? `<div class="subtitle">المنتج: ${productTypeOptions.find(p => p.value == productId)?.label || "غير محدد"}</div>` : ''}
          ${selectedCustomer ? `<div class="subtitle">الزبون: ${selectedCustomer.company_name || selectedCustomer.full_name}</div>` : ''}
        </div>
    `;

    // Add customer data
    filteredData.customers.forEach((customer, customerIndex) => {
      htmlContent += `
        <div class="customer-section">
          <div class="customer-name">
            الزبون: ${customer.company_name || customer.full_name || "غير محدد"}
            ${selectedCustomerId ? '' : ` (${customerIndex + 1})`}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>م</th>
                <th>المنطقة</th>
                <th>التموضع</th>
                <th>النموذج</th>
                <th>القياس</th>
                <th>المساحة (م²)</th>
                <th>عدد الأوجه</th>
                <th>الإجمالي (م²)</th>
                <th>الاتجاه</th>
              </tr>
            </thead>
            <tbody>
      `;

      customer.roadSigns?.forEach((sign, signIndex) => {
        const isGrouped = sign.grouped_count > 1;
        const templateSize = sign.template?.size || "غير محدد";
        const templateArea = sign.template?.advertising_space || 0;
        const totalMeters = sign.total_advertising_space || 0;
        const regionName = sign.region || getRegionName(sign);
        
        htmlContent += `
          <tr>
            <td>${signIndex + 1}</td>
            <td>${regionName}</td>
            <td>${sign.place || "غير محدد"}</td>
            <td>${sign.model || "غير محدد"}</td>
            <td>${templateSize ? templateSize.replace(/x/gi, ' × ') : "غير محدد"}</td>
            <td>${templateArea}</td>
            <td>${sign.pivot?.booking_faces || 1}${isGrouped ? ` <span class="group-note">(مجموعة: ${sign.grouped_count})</span>` : ''}</td>
            <td>${totalMeters}</td>
            <td style="text-align: right; padding-right: 10px;">${sign.direction || "غير محدد"}</td>
          </tr>
        `;
      });

      htmlContent += `
            </tbody>
          </table>
        </div>
      `;
    });

    // Add template summary
    if (statsArray.length > 0) {
      const totalCount = statsArray.reduce((sum, item) => sum + item.stats.count, 0);
      
      htmlContent += `
        <div class="customer-section">
          <div class="customer-name">ملخص النماذج</div>
          <table>
            <thead>
              <tr>
                <th>م</th>
                <th>النموذج</th>
                <th>القياس</th>
                <th>العدد</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      statsArray.forEach((item, i) => {
        htmlContent += `
          <tr>
            <td>${i + 1}</td>
            <td>${item.templateName}</td>
            <td>${item.stats.size}</td>
            <td>${item.stats.count}</td>
          </tr>
        `;
      });
      
      htmlContent += `
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3"><strong>المجموع الكلي</strong></td>
                <td><strong>${totalCount}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
      `;
    }

    htmlContent += `
        <div class="footer">
          <p>تم الإنشاء آلياً بواسطة نظام التقارير</p>
          <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')}</p>
        </div>
      </body>
      </html>
    `;

    // Create and download Word file
    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = selectedCustomer 
      ? `تقرير_${selectedCustomer.company_name || selectedCustomer.full_name}_${new Date().toISOString().split('T')[0]}.doc`
      : `تقرير_حجوزات_${new Date().toISOString().split('T')[0]}.doc`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Update ReportBookingsCustomersColumns to remove المدينة and keep المنطقة
  const updatedColumns = ReportBookingsCustomersColumns.map(col => {
    // Remove المدينة column if it exists
    if (col.header === "المدينة") {
      return null; // Will be filtered out
    }
    
    // Update المنطقة column to be more prominent
    if (col.header === "المنطقة") {
      return {
        ...col,
        cellClassName: "font-semibold text-green-700 dark:text-green-400 min-w-[150px]",
        format: (value, row) => {
          const regionName = row.region || getRegionName(row) || 'غير محدد';
          return (
            <span className="px-3 py-1.5 bg-green-50 dark:bg-green-900/30 rounded-md border border-green-200 dark:border-green-700">
              {regionName}
            </span>
          );
        }
      };
    }
    
    // Handle الاتجاه column with expand/collapse
    if (col.header === "الاتجاه") {
      return {
        ...col,
        cellClassName: "text-right min-w-[200px] max-w-[350px]",
        format: (value, row) => {
          const direction = row.direction || 'غير محدد';
          const isExpanded = expandedDirections[row.key];
          const shouldShowButton = direction.length > 50;
          
          return (
            <div className="flex flex-col w-full">
              <div className={`font-medium text-foreground text-right leading-relaxed break-words whitespace-pre-wrap ${
                isExpanded ? '' : shouldShowButton ? 'line-clamp-3' : ''
              }`}>
                {direction}
              </div>
              {shouldShowButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 p-0 h-auto text-xs text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 justify-end self-end"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDirection(row.key);
                  }}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3 ml-1" />
                      عرض أقل
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3 ml-1" />
                      عرض المزيد
                    </>
                  )}
                </Button>
              )}
            </div>
          );
        }
      };
    }
    
    // Enhance التموضع column
    if (col.header === "التموضع") {
      return {
        ...col,
        cellClassName: "font-semibold text-primary min-w-[120px]",
        format: (value) => (
          <span className="px-2 py-1 bg-primary/10 rounded-md">
            {value || "غير محدد"}
          </span>
        )
      };
    }
    
    // Enhance النموذج column
    if (col.header === "النموذج") {
      return {
        ...col,
        cellClassName: "text-center bg-gray-50 dark:bg-gray-800/50 font-medium min-w-[100px]"
      };
    }
    
    return {
      ...col,
      cellClassName: col.cellClassName || "text-center"
    };
  }).filter(col => col !== null); // Remove null columns (المدينة)

  if (isBookingsDateLoading || isCustomersLoading) {
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {/* Customer Filter */}
        <div>
          <Label
            htmlFor="customer"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            الزبون
          </Label>
          <select
            id="customer"
            value={selectedCustomerId}
            onChange={handleCustomerChange}
            disabled={isCustomersLoading || customersError}
            className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-800 
                     text-gray-900 dark:text-gray-100
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     disabled:bg-gray-100 dark:disabled:bg-gray-700 
                     disabled:text-gray-500 dark:disabled:text-gray-400
                     disabled:cursor-not-allowed
                     transition-colors duration-200"
          >
            <option value="" className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800">
              جميع الزبائن
            </option>
            
            {customersError ? (
              <option value="" disabled className="text-red-500 bg-white dark:bg-gray-800">
                خطأ في تحميل الزبائن
              </option>
            ) : isCustomersLoading ? (
              <option value="" disabled className="text-gray-500 bg-white dark:bg-gray-800">
                جاري تحميل الزبائن...
              </option>
            ) : customersData && customersData.length > 0 ? (
              customersData.map((customer) => (
                <option
                  key={customer.id}
                  value={customer.id}
                  className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 
                           hover:bg-blue-50 dark:hover:bg-gray-700"
                >
                  {customer.company_name || customer.full_name || customer.email || `زبون #${customer.id}`}
                </option>
              ))
            ) : (
              <option value="" disabled className="text-gray-500 bg-white dark:bg-gray-800">
                لا يوجد زبائن
              </option>
            )}
          </select>
          
          {customersError && (
            <div className="mt-2 flex items-center text-red-500 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 mr-1" />
              <span>خطأ في تحميل قائمة الزبائن</span>
            </div>
          )}
        </div>

        {/* Product Filter */}
        <div>
          <Label
            htmlFor="product"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            المنتج
          </Label>
          <select
            id="product"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            disabled={isBookingsDateLoading}
            className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-800 
                     text-gray-900 dark:text-gray-100
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     disabled:bg-gray-100 dark:disabled:bg-gray-700 
                     disabled:text-gray-500 dark:disabled:text-gray-400
                     disabled:cursor-not-allowed
                     transition-colors duration-200"
          >
            <option value="" className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800">
              اختر المنتج
            </option>
            {isBookingsDateLoading ? (
              <option value="" disabled className="text-gray-500 bg-white dark:bg-gray-800">
                يرجى الانتظار...
              </option>
            ) : (
              productTypeOptions?.map((product) => (
                <option
                  key={product.value}
                  value={product.value}
                  className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 
                           hover:bg-blue-50 dark:hover:bg-gray-700"
                >
                  {product.label}
                </option>
              ))
            )}
          </select>
        </div>

        {/* From Date */}
        <div>
          <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            من
          </Label>
          <input
            type="date"
            value={fromDate || ''}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-800 
                     text-gray-900 dark:text-gray-100
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     transition-colors duration-200
                     [&::-webkit-calendar-picker-indicator]:invert-[0.6] dark:[&::-webkit-calendar-picker-indicator]:invert-[0.9]"
          />
        </div>

        {/* To Date */}
        <div>
          <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            إلى
          </Label>
          <input
            type="date"
            value={toDate || ''}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-800 
                     text-gray-900 dark:text-gray-100
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     transition-colors duration-200
                     [&::-webkit-calendar-picker-indicator]:invert-[0.6] dark:[&::-webkit-calendar-picker-indicator]:invert-[0.9]"
          />
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        {/* PDF Button */}
        <ReportPdf
          customers={pdfData.customers}
          globalModelCounts={pdfData.globalModelCounts}
          total_advertising_space_all_customers={pdfData.total_advertising_space_all_customers}
          from_date={fromDate}
          to_date={toDate}
          product={productTypeOptions.find(p => p.value == productId)?.label || "غير محدد"}
          selectedCustomer={selectedCustomer}
          isFilteredByCustomer={!!selectedCustomerId}
          isGrouped={true}
        />

        <Button
          onClick={handleExportWord}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          disabled={!filteredData?.customers || filteredData.customers.length === 0}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>تصدير كملف Word</span>
        </Button>
      </div>

      {/* Tabs for switching between bookings and unbooked signs */}
      <Tabs
        defaultValue="customer-booking"
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full overflow-auto grid-cols-5 justify-between flex bg-card rounded-lg border border-border">
          <TabsTrigger value="customer-booking" className="text-sm font-medium">
            حجوزات الزبائن
          </TabsTrigger>
          <TabsTrigger value="model-booking" className="text-sm font-medium">
            النماذج المحجوزة
          </TabsTrigger>
        </TabsList>

        {/* Customer Booking Tab - This Date Tables */}
        <TabsContent value="customer-booking">
          {selectedCustomerId && (
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-full">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-800 dark:text-blue-300">
                      تقرير الزبون: {selectedCustomer?.company_name || selectedCustomer?.full_name}
                    </h3>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      (المعلومات مجمعة حسب المنطقة والتموضع والنموذج والاتجاه)
                    </p>
                  </div>
                </div>
                <div className="text-sm px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                  {filteredData?.customers?.[0]?.roadSigns?.length || 0} سجل
                </div>
              </div>
            </div>
          )}

          {filteredData?.customers?.length > 0 ? (
            filteredData.customers.map((customer, ind) => (
              <div
                dir="rtl"
                className="border-2 border-border dark:border-gray-700 p-4 m-2 text-right rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow duration-200"
                key={ind}
              >
                <div className="flex items-center justify-between mb-4 p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-foreground">
                        {customer?.company_name || "غير مسجل"}
                      </h3>
                      {customer.roadSigns?.some(sign => sign.grouped_count > 1) && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                            {customer.roadSigns?.filter(s => s.grouped_count > 1).length} مجموعة مجمعة
                          </span>
                          <span className="text-sm text-gray-500">
                            إجمالي: {customer.roadSigns?.length || 0} سجل
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <DynamicTable
                  data={customer?.roadSigns || []}
                  columns={updatedColumns}
                  isLoading={isBookingsDateFetching}
                  className="bg-transparent border-none shadow-none"
                  tableClassName="border border-border dark:border-gray-700 rounded-lg overflow-hidden"
                />
              </div>
            ))
          ) : (
            <div className="text-center p-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {selectedCustomerId 
                  ? "لا توجد حجوزات لهذا الزبون"
                  : "لا توجد حجوزات متاحة"
                }
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                {selectedCustomerId 
                  ? "لم يتم العثور على أي حجوزات للزبون المحدد في الفترة المختارة."
                  : "لم يتم العثور على أي حجوزات بناءً على عوامل التصفية المحددة."
                }
              </p>
            </div>
          )}
        </TabsContent>

        {/* Model Booking Tab - This Date Tables */}
        <TabsContent value="model-booking">
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-800 rounded-full">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-green-800 dark:text-green-300">
                    إحصائيات النماذج المحجوزة
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    نظرة عامة على توزيع النماذج المحجوزة والمتاحة
                  </p>
                </div>
              </div>
              <div className="text-sm px-3 py-1 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 rounded-full font-medium">
                {filteredData?.globalModelCounts?.length || 0} نموذج
              </div>
            </div>
          </div>
          
          <DynamicTable
            data={filteredData?.globalModelCounts || []}
            columns={[
              {
                header: "النموذج",
                accessor: "model",
                cellClassName: "text-center font-bold text-primary min-w-[150px]",
                format: (value) => (
                  <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg">
                    {value || "غير محدد"}
                  </span>
                )
              },
              {
                header: "اللوحات المحجوزة",
                accessor: "reserved_panels",
                cellClassName: "text-center font-semibold text-amber-600 dark:text-amber-400 min-w-[120px]",
                format: (value) => (
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                    <span>{value || 0}</span>
                  </div>
                )
              },
              {
                header: "اللوحات المتاحة",
                accessor: "available_panels",
                cellClassName: "text-center font-semibold text-green-600 dark:text-green-400 min-w-[120px]",
                format: (value) => (
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>{value || 0}</span>
                  </div>
                )
              },
              {
                header: "إجمالي اللوحات",
                accessor: "total_panels",
                cellClassName: "text-center font-bold text-blue-600 dark:text-blue-400 min-w-[120px]",
                format: (value) => (
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>{value || 0}</span>
                  </div>
                )
              },
            ]}
            isLoading={isBookingsDateFetching}
            className="bg-card rounded-lg shadow-sm border border-border w-full"
            tableClassName="border border-border dark:border-gray-700 rounded-lg overflow-hidden"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsContainer;