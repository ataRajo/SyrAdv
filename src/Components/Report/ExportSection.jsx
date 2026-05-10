import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader, FileText, Printer } from "lucide-react";
import toast from "react-hot-toast";
import { 
  formatArabicDate, 
  calculateTotalAdvertisingSpace,
  getAllTemplateNames,
  getAllCustomers 
} from './ReportUtils';
import { detailsPDFStyles, weeklyPDFStyles } from './styles';

const ExportSection = ({
  isWeeklyReport,
  activeTab,
  currentData,
  cities,
  cityId,
  templateNameFilter,
  startDate,
  endDate,
  customerOptions ,
  filterStartDate , 
  filterEndDate 
}) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingWord, setIsGeneratingWord] = useState(false);

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
          ${detailsPDFStyles.mediaPrint}
          ${detailsPDFStyles.body.replace(/{activeTab === "available" \? '([^']+)' : '([^']+)'}/g, activeTab === "available" ? '$1' : '$2')}
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
                const firstItem = group.items[0];
                const groupFaces = group.totalItems;
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
  const reportType = 'تقرير الحجوزات الأسبوعي';
  
  // Get current date for report generation
  const reportDate = new Date();
  const formattedReportDate = reportDate.toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Use actual filter dates
  const getWeekDates = () => {
    if (startDate && endDate) {
      return {
        start: formatArabicDate(new Date(startDate)),
        end: formatArabicDate(new Date(endDate))
      };
    }
    
    if (filterStartDate && filterEndDate) {
      return {
        start: formatArabicDate(new Date(filterStartDate)),
        end: formatArabicDate(new Date(filterEndDate))
      };
    }
    
    const today = new Date();
    const exampleStartDate = new Date(today);
    const exampleEndDate = new Date(today);
    exampleEndDate.setDate(today.getDate() + 6);
    
    return {
      start: formatArabicDate(exampleStartDate),
      end: formatArabicDate(exampleEndDate)
    };
  };

  const weekDates = getWeekDates();
  
  // Updated grouping key to include booking dates
  const createGroupKey = (item, booking) => {
    const bookingStart = booking?.start_date || 'بدون_تاريخ';
    const bookingEnd = booking?.end_date || 'بدون_تاريخ';
    return `${item.region?.name || 'بدون_منطقة'}_${item.place || 'بدون_مكان'}_${item.directions || item.direction || 'بدون_اتجاه'}_${bookingStart}_${bookingEnd}`;
  };
  
  const groupedByCustomer = {};
  const templateUsageSummary = {};
  
  // Calculate total area for all contracts
  let totalAreaForAllContracts = 0;
  
  printData.forEach(item => {
    if (!item.bookings || item.bookings.length === 0) return;
    
    const booking = item.bookings[0];
    const customer = booking.customer;
    
    const templateName = item.template?.model || "غير محدد";
    if (!templateUsageSummary[templateName]) {
      templateUsageSummary[templateName] = {
        name: templateName,
        count: 0,
        totalArea: 0
      };
    }
    templateUsageSummary[templateName].count += 1;
    const itemArea = parseFloat(item.template?.advertising_space || 0);
    templateUsageSummary[templateName].totalArea += itemArea;
    
    // Add to total area for all contracts
    totalAreaForAllContracts += itemArea;
    
    if (!customer) {
      const unknownId = 'unknown';
      if (!groupedByCustomer[unknownId]) {
        groupedByCustomer[unknownId] = {
          customerName: "غير محدد",
          customerCompany: "غير محدد",
          totalBookings: 0,
          totalArea: 0,
          totalSum: 0,
          totalPrice: 0,
          groups: []
        };
      }
      
      const groupKey = createGroupKey(item, booking);
      let group = groupedByCustomer[unknownId].groups.find(g => g.key === groupKey);
      if (!group) {
        group = {
          key: groupKey,
          region: item.region?.name || "غير محدد",
          directions: item.directions || item.direction || "غير محدد",
          place: item.place || "غير محدد",
          bookingStart: booking.start_date || "غير محدد",
          bookingEnd: booking.end_date || "غير محدد",
          items: [],
          totalSum: 0,
          count: 0
        };
        groupedByCustomer[unknownId].groups.push(group);
      }
      
      group.items.push({ item, booking });
      group.count += 1;
      groupedByCustomer[unknownId].totalBookings += 1;
      const areaPerFace = parseFloat(item.template?.advertising_space || 0);
      groupedByCustomer[unknownId].totalArea += areaPerFace;
      const facesNumber = 1;
      const sumForItem = facesNumber * areaPerFace;
      groupedByCustomer[unknownId].totalSum += sumForItem;
      group.totalSum += sumForItem;
      
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
        totalSum: 0,
        totalPrice: 0,
        groups: []
      };
    }
    
    const groupKey = createGroupKey(item, booking);
    let group = groupedByCustomer[customerId].groups.find(g => g.key === groupKey);
    if (!group) {
      group = {
        key: groupKey,
        region: item.region?.name || "غير محدد",
        directions: item.directions || item.direction || "غير محدد",
        place: item.place || "غير محدد",
        bookingStart: booking.start_date || "غير محدد",
        bookingEnd: booking.end_date || "غير محدد",
        items: [],
        totalSum: 0,
        count: 0
      };
      groupedByCustomer[customerId].groups.push(group);
    }
    
    group.items.push({ item, booking });
    group.count += 1;
    groupedByCustomer[customerId].totalBookings += 1;
    const areaPerFace = parseFloat(item.template?.advertising_space || 0);
    groupedByCustomer[customerId].totalArea += areaPerFace;
    const facesNumber = 1;
    const sumForItem = facesNumber * areaPerFace;
    groupedByCustomer[customerId].totalSum += sumForItem;
    group.totalSum += sumForItem;
    
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
        ${weeklyPDFStyles.mediaPrint}
        ${weeklyPDFStyles.body}
        
        .date-range-section {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
          text-align: center;
        }
        
        .date-range-item {
          display: inline-block;
          margin: 0 15px;
          font-weight: 600;
          color: #495057;
        }
        
        .date-range-label {
          color: #6c757d;
          font-size: 14px;
          margin-left: 5px;
        }
        
        .date-range-value {
          color: #198754;
          font-size: 15px;
          font-weight: bold;
        }
        
        .booking-date-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          margin-top: 5px;
        }
        
        .booking-date-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
        }
        
        .booking-date-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 10px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        
        .booking-start {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        
        .booking-end {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
        
        .date-icon {
          font-size: 9px;
        }
        
        .group-summary {
          background: #f8f9fa;
          padding: 6px 10px;
          border-radius: 6px;
          margin-top: 5px;
          font-size: 10px;
          color: #495057;
          border: 1px solid #e9ecef;
        }
        
        .grouping-note {
          background: #e7f3ff;
          border: 1px solid #b3d7ff;
          border-radius: 6px;
          padding: 8px 12px;
          margin: 10px 0;
          font-size: 11px;
          color: #0d6efd;
        }
        
        /* Summary sections styles */
        .total-summary-section {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 20px;
          margin: 30px 0;
          page-break-inside: avoid;
        }
        
        .summary-title {
          font-size: 18px;
          font-weight: bold;
          color: #0d6efd;
          margin-bottom: 15px;
          text-align: center;
          border-bottom: 2px solid #0d6efd;
          padding-bottom: 10px;
        }
        
        .total-contracts-area {
          background: #198754;
          color: white;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          margin: 15px 0;
          font-size: 20px;
          font-weight: bold;
        }
        
        .template-usage-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 10px;
          margin-top: 20px;
        }
        
        .template-usage-item {
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          padding: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .template-name {
          font-weight: bold;
          color: #495057;
        }
        
        .template-count {
          background: #0d6efd;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: bold;
          font-size: 14px;
        }
        
        .template-area {
          color: #198754;
          font-weight: bold;
          font-size: 12px;
        }
        
        .report-date-line {
          text-align: center;
          margin: 10px 0 5px 0;
          color: #495057;
          font-size: 14px;
          background: #e7f3ff;
          padding: 8px;
          border-radius: 6px;
          border: 1px solid #b3d7ff;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="report-container">
        <!-- Report Header -->
        <div class="report-header">
          <h1>${reportType}</h1>
          
          <!-- Date Range Section -->
          <div class="date-range-section">
            ${startDate || endDate ? `
              <div class="date-range-item">
                <span class="date-range-label">تاريخ البدء:</span>
                <span class="date-range-value">${startDate ? new Date(startDate).toLocaleDateString('ar-EG') : 'غير محدد'}</span>
              </div>
              <div class="date-range-item">
                <span class="date-range-label">تاريخ الانتهاء:</span>
                <span class="date-range-value">${endDate ? new Date(endDate).toLocaleDateString('ar-EG') : 'غير محدد'}</span>
              </div>
            ` : `
              <div class="date-range-item">
                <span class="date-range-label">نطاق التاريخ:</span>
                <span class="date-range-value">${weekDates.start} - ${weekDates.end}</span>
              </div>
            `}
            
            <!-- تاريخ التقرير Line - ADDED HERE -->
            <div class="report-date-line" style="margin-top: 10px;">
              📅 تاريخ التقرير: ${formattedReportDate}
            </div>
          </div>
        </div>


         <div class="generation-time">
          تم إنشاء التقرير في: ${new Date().toLocaleString('ar-EG')}
        </div>
        
        <!-- Date Summary Card -->
        <div style="background: #e7f3ff; border-radius: 8px; padding: 15px; margin: 15px 0; border: 1px solid #b3d7ff;">
          <div style="display: flex; justify-content: space-around; align-items: center; flex-wrap: wrap;">
            <div style="text-align: center;">
              <div style="font-size: 12px; color: #495057;">📅 تاريخ البدء (تصفية)</div>
              <div style="font-size: 16px; font-weight: bold; color: #0d6efd;">${startDate ? new Date(startDate).toLocaleDateString('ar-EG') : ''}</div>
            </div>
            <div style="font-size: 20px; color: #6c757d;">←</div>
            <div style="text-align: center;">
              <div style="font-size: 12px; color: #495057;">📅 تاريخ الانتهاء (تصفية)</div>
              <div style="font-size: 16px; font-weight: bold; color: #198754;">${endDate ? new Date(endDate).toLocaleDateString('ar-EG') : ''}</div>
            </div>
          </div>
        </div>
        
        <!-- Customer Sections -->
        ${Object.entries(groupedByCustomer).map(([customerId, customerData], customerIndex) => `
          <div class="customer-section ${customerIndex > 0 && customerIndex % 2 === 0 ? 'page-break' : ''}">
            <div class="customer-header">
              <div class="customer-name">${customerData.customerName}</div>
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
                  <th width="18%">تاريخ الحجز</th>
                </tr>
              </thead>
              <tbody>
                ${customerData.groups.map((group, groupIndex) => {
                  const groupCount = group.count;
                  const firstItem = group.items[0];
                  const areaPerFace = parseFloat(firstItem.item.template?.advertising_space || 0);
                  const sumForGroup = groupCount * areaPerFace;
                  const size = firstItem.item.template?.size || "غير محدد";
                  
                  const bookingStart = group.bookingStart !== "غير محدد" ? 
                    new Date(group.bookingStart).toLocaleDateString('ar-EG') : 
                    "غير محدد";
                  const bookingEnd = group.bookingEnd !== "غير محدد" ? 
                    new Date(group.bookingEnd).toLocaleDateString('ar-EG') : 
                    "غير محدد";
                  
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
                          ${areaPerFace.toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <div class="faces-cell">${groupCount}</div>
                      </td>
                      <td>
                        <div class="booking-date-container">
                          <div class="booking-date-row">
                            <span class="booking-date-badge booking-start">
                              <span class="date-icon">📅</span>
                              من: ${bookingStart}
                            </span>
                            <span style="color: #666; font-size: 10px;">←</span>
                            <span class="booking-date-badge booking-end">
                              <span class="date-icon">📅</span>
                              إلى: ${bookingEnd}
                            </span>
                          </div>
                          ${groupCount > 1 ? `
                           
                          ` : ''}
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
                
                <!-- Customer Total Row -->
                <tr class="total-row">
                  <td colspan="8" class="text-center">
                    <strong>إجمالي العميل: ${customerData.totalBookings} لوحة | إجمالي المساحة: ${customerData.totalArea.toFixed(2)} م² | عدد المجموعات: ${customerData.groups.length}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        `).join('')}
        
        <!-- Summary Section -->
        <div class="total-summary-section">
          <div class="summary-title">📊 ملخص إحصائي شامل</div>
          
          <!-- Total Area for All Contracts -->
          <div class="total-contracts-area">
            🏢 مجموع الأمتار الكلي للعقود: ${totalAreaForAllContracts.toFixed(2)} م²
          </div>
          
          <!-- Template Usage Summary -->
          <div style="margin-top: 20px;">
            <h3 style="color: #495057; margin-bottom: 15px; text-align: center;">📋 استخدام النماذج</h3>
            <div class="template-usage-grid">
              ${Object.entries(templateUsageSummary).map(([templateName, templateData]) => `
                <div class="template-usage-item">
                  <div>
                    <div class="template-name">${templateName}</div>
                    <div class="template-area">${templateData.totalArea.toFixed(2)} م²</div>
                  </div>
                  <div class="template-count">${templateData.count}</div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background: #f1f3f4; border-radius: 6px;">
            </div>
          </div>
        </div>
        
        <div class="footer-grid" style="margin-top: 20px;">
        </div>
        
       
        
        <div style="margin-top: 15px; font-size: 10px; color: #999; text-align: center;">
          © ${new Date().getFullYear()} جميع الحقوق محفوظة
        </div>
      </div>
      
      <script>
        window.onload = function() {
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


const handleExportWord = () => {
  setIsGeneratingWord(true);
  
  try {
    const exportData = currentData;
    const reportType = 'تقرير الحجوزات الأسبوعي';
    
    // Get current date for report generation
    const reportDate = new Date();
    const formattedReportDate = reportDate.toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Use actual filter dates
    const getWeekDates = () => {
      if (startDate && endDate) {
        return {
          start: formatArabicDate(new Date(startDate)),
          end: formatArabicDate(new Date(endDate))
        };
      }
      
      if (filterStartDate && filterEndDate) {
        return {
          start: formatArabicDate(new Date(filterStartDate)),
          end: formatArabicDate(new Date(filterEndDate))
        };
      }
      
      const today = new Date();
      const exampleStartDate = new Date(today);
      const exampleEndDate = new Date(today);
      exampleEndDate.setDate(today.getDate() + 6);
      
      return {
        start: formatArabicDate(exampleStartDate),
        end: formatArabicDate(exampleEndDate)
      };
    };

    const weekDates = getWeekDates();
    
    // Updated grouping key to include booking dates
    const createGroupKey = (item, booking) => {
      const bookingStart = booking?.start_date || 'بدون_تاريخ';
      const bookingEnd = booking?.end_date || 'بدون_تاريخ';
      return `${item.region?.name || 'بدون_منطقة'}_${item.place || 'بدون_مكان'}_${item.directions || item.direction || 'بدون_اتجاه'}_${bookingStart}_${bookingEnd}`;
    };
    
    const groupedByCustomer = {};
    const templateUsageSummary = {};
    
    // Calculate total area for all contracts
    let totalAreaForAllContracts = 0;
    
    exportData.forEach(item => {
      if (!item.bookings || item.bookings.length === 0) return;
      
      const booking = item.bookings[0];
      const customer = booking.customer;
      
      const templateName = item.template?.model || "غير محدد";
      if (!templateUsageSummary[templateName]) {
        templateUsageSummary[templateName] = {
          name: templateName,
          count: 0,
          totalArea: 0
        };
      }
      templateUsageSummary[templateName].count += 1;
      const itemArea = parseFloat(item.template?.advertising_space || 0);
      templateUsageSummary[templateName].totalArea += itemArea;
      
      // Add to total area for all contracts
      totalAreaForAllContracts += itemArea;
      
      if (!customer) {
        const unknownId = 'unknown';
        if (!groupedByCustomer[unknownId]) {
          groupedByCustomer[unknownId] = {
            customerName: "غير محدد",
            customerCompany: "غير محدد",
            totalBookings: 0,
            totalArea: 0,
            totalSum: 0,
            totalPrice: 0,
            groups: []
          };
        }
        
        const groupKey = createGroupKey(item, booking);
        let group = groupedByCustomer[unknownId].groups.find(g => g.key === groupKey);
        if (!group) {
          group = {
            key: groupKey,
            region: item.region?.name || "غير محدد",
            directions: item.directions || item.direction || "غير محدد",
            place: item.place || "غير محدد",
            bookingStart: booking.start_date || "غير محدد",
            bookingEnd: booking.end_date || "غير محدد",
            items: [],
            totalSum: 0,
            count: 0
          };
          groupedByCustomer[unknownId].groups.push(group);
        }
        
        group.items.push({ item, booking });
        group.count += 1;
        groupedByCustomer[unknownId].totalBookings += 1;
        const areaPerFace = parseFloat(item.template?.advertising_space || 0);
        groupedByCustomer[unknownId].totalArea += areaPerFace;
        const facesNumber = 1;
        const sumForItem = facesNumber * areaPerFace;
        groupedByCustomer[unknownId].totalSum += sumForItem;
        group.totalSum += sumForItem;
        
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
          totalSum: 0,
          totalPrice: 0,
          groups: []
        };
      }
      
      const groupKey = createGroupKey(item, booking);
      let group = groupedByCustomer[customerId].groups.find(g => g.key === groupKey);
      if (!group) {
        group = {
          key: groupKey,
          region: item.region?.name || "غير محدد",
          directions: item.directions || item.direction || "غير محدد",
          place: item.place || "غير محدد",
          bookingStart: booking.start_date || "غير محدد",
          bookingEnd: booking.end_date || "غير محدد",
          items: [],
          totalSum: 0,
          count: 0
        };
        groupedByCustomer[customerId].groups.push(group);
      }
      
      group.items.push({ item, booking });
      group.count += 1;
      groupedByCustomer[customerId].totalBookings += 1;
      const areaPerFace = parseFloat(item.template?.advertising_space || 0);
      groupedByCustomer[customerId].totalArea += areaPerFace;
      const facesNumber = 1;
      const sumForItem = facesNumber * areaPerFace;
      groupedByCustomer[customerId].totalSum += sumForItem;
      group.totalSum += sumForItem;
      
      if (booking.total_price) {
        groupedByCustomer[customerId].totalPrice += parseFloat(booking.total_price);
      }
    });
    
    const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${reportType}</title>
    <style>
        @page {
            size: A4;
            margin: 20mm;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
            padding: 0;
        }
        
        .report-container {
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
            background: white;
            padding: 20px;
        }
        
        .report-header {
            text-align: center;
            margin-bottom: 20px;
        }
        
        .report-header h1 {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
            text-decoration: underline;
        }
        
        .date-range-section {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
        }
        
        .date-range-items {
            display: flex;
            justify-content: center;
            align-items: center;
            flex-wrap: wrap;
            gap: 20px;
            margin-bottom: 15px;
        }
        
        .date-range-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            min-width: 120px;
        }
        
        .date-range-label {
            color: #6c757d;
            font-size: 14px;
            margin-bottom: 5px;
        }
        
        .date-range-value {
            color: #198754;
            font-size: 15px;
            font-weight: bold;
            padding: 8px 12px;
            background: #e7f3ff;
            border-radius: 6px;
            border: 1px solid #b3d7ff;
            min-width: 120px;
            text-align: center;
        }
        
        .report-date-container {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px dashed #dee2e6;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 10px;
        }
        
        .report-date-label {
            color: #6c757d;
            font-size: 14px;
            font-weight: bold;
        }
        
        .report-date-value {
            color: #000000;
            font-size: 15px;
            font-weight: bold;
            padding: 8px 15px;
            background: #f8f9fa;
            border-radius: 6px;
            border: 1px solid #dee2e6;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }
        
        .customer-section {
            margin-bottom: 40px;
            page-break-inside: avoid;
        }
        
        .customer-header {
            background: #e7f3ff;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            border: 1px solid #b3d7ff;
        }
        
        .customer-name {
            font-size: 20px;
            font-weight: bold;
            color: #0d6efd;
        }
        
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 11px;
        }
        
        .data-table th {
            background: #495057;
            color: white;
            padding: 8px;
            text-align: right;
            border: 1px solid #6c757d;
            font-weight: bold;
        }
        
        .data-table td {
            padding: 6px;
            border: 1px solid #dee2e6;
            text-align: right;
        }
        
        .total-row {
            background: #e9ecef !important;
            font-weight: bold;
            border-top: 2px solid #495057;
        }
        
        .booking-date-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            margin-top: 5px;
        }
        
        .booking-date-row {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 11px;
        }
        
        .booking-date-badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 10px;
            display: inline-flex;
            align-items: center;
            gap: 4px;
        }
        
        .booking-start {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .booking-end {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .date-icon {
            font-size: 9px;
        }
        
        .size-cell {
            font-weight: bold;
            color: #1e40af;
            background: #f0f9ff;
            border-radius: 4px;
            padding: 3px 8px;
            border: 1px solid #bfdbfe;
            display: inline-block;
        }
        
        .area-cell {
            font-weight: bold;
            color: #198754;
            background: #d4edda;
            border-radius: 4px;
            padding: 3px 8px;
            border: 1px solid #c3e6cb;
            display: inline-block;
        }
        
        .faces-cell {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            color: Black;
            border-radius: 50%;
            font-weight: bold;
        }
        
        .text-right {
            text-align: right;
        }
        
        .text-center {
            text-align: center;
        }
        
        .total-summary-section {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
            page-break-inside: avoid;
        }
        
        .summary-title {
            font-size: 18px;
            font-weight: bold;
            color: #0d6efd;
            margin-bottom: 15px;
            text-align: center;
            border-bottom: 2px solid #0d6efd;
            padding-bottom: 10px;
        }
        
        .total-contracts-area {
            background: #198754;
            color: white;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            margin: 15px 0;
            font-size: 20px;
            font-weight: bold;
        }
        
        .template-usage-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 10px;
            margin-top: 20px;
        }
        
        .template-usage-item {
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            padding: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .template-name {
            font-weight: bold;
            color: #495057;
        }
        
        .template-count {
            color: Black;
            padding: 4px 12px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 14px;
        }
        
        .template-area {
            color: #198754;
            font-weight: bold;
            font-size: 12px;
        }
        
        .footer-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-top: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 6px;
            border: 1px solid #dee2e6;
        }
        
        .footer-item {
            text-align: center;
            font-size: 12px;
            color: #495057;
        }
        
        .generation-time {
            margin-top: 10px;
            color: #6c757d;
            font-size: 11px;
            text-align: center;
        }
        
        @media print {
            .customer-section {
                page-break-inside: avoid;
            }
            
            .page-break {
                page-break-before: always;
            }
        }
    </style>
</head>
<body>
    <div class="report-container">
        <!-- Report Header -->
        <div class="report-header">
            <h1 style="border-bottom: none; margin-bottom: 10px;">${reportType}</h1>
            
            <!-- Date Range Section -->
            <div class="date-range-section">
                <div class="date-range-items">
                    ${startDate || endDate ? `
                        <div class="date-range-item">
                            <span class="date-range-label">تاريخ البدء:</span>
                            <span class="date-range-value">${startDate ? new Date(startDate).toLocaleDateString('ar-EG') : 'غير محدد'}</span>
                        </div>
                        <div class="date-range-item">
                            <span class="date-range-label">تاريخ الانتهاء:</span>
                            <span class="date-range-value">${endDate ? new Date(endDate).toLocaleDateString('ar-EG') : 'غير محدد'}</span>
                        </div>
                    ` : `
                        <div class="date-range-item">
                            <span class="date-range-label">نطاق التاريخ:</span>
                            <span class="date-range-value">${weekDates.start} - ${weekDates.end}</span>
                        </div>
                    `}
                </div>
                
                <!-- تاريخ التقرير - Report Date (in black) -->
                <div class="report-date-container">
                    <span class="report-date-label">تاريخ التقرير:</span>
                    <span class="report-date-value">
                        📅 ${formattedReportDate}
                    </span>
                </div>
            </div>
        </div>
        
        <!-- Customer Sections -->
        ${Object.entries(groupedByCustomer).map(([customerId, customerData], customerIndex) => `
            <div class="customer-section ${customerIndex > 0 && customerIndex % 2 === 0 ? 'page-break' : ''}">
                <div class="customer-header">
                    <div class="customer-name">${customerData.customerName}</div>
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
                            <th width="18%">تاريخ الحجز</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${customerData.groups.map((group, groupIndex) => {
                            const groupCount = group.count;
                            const firstItem = group.items[0];
                            const areaPerFace = parseFloat(firstItem.item.template?.advertising_space || 0);
                            const sumForGroup = groupCount * areaPerFace;
                            const size = firstItem.item.template?.size || "غير محدد";
                            
                            const bookingStart = group.bookingStart !== "غير محدد" ? 
                                new Date(group.bookingStart).toLocaleDateString('ar-EG') : 
                                "غير محدد";
                            const bookingEnd = group.bookingEnd !== "غير محدد" ? 
                                new Date(group.bookingEnd).toLocaleDateString('ar-EG') : 
                                "غير محدد";
                            
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
                                            ${areaPerFace.toFixed(2)}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="faces-cell">${groupCount}</div>
                                    </td>
                                    <td>
                                        <div class="booking-date-container">
                                            <div class="booking-date-row">
                                                <span class="booking-date-badge booking-start">
                                                    <span class="date-icon">📅</span>
                                                    من: ${bookingStart}
                                                </span>
                                                <span style="color: #666; font-size: 10px;">←</span>
                                                <span class="booking-date-badge booking-end">
                                                    <span class="date-icon">📅</span>
                                                    إلى: ${bookingEnd}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                        
                        <!-- Customer Total Row -->
                        <tr class="total-row">
                            <td colspan="8" class="text-center">
                                <strong>إجمالي العميل: ${customerData.totalBookings} لوحة | إجمالي المساحة: ${customerData.totalArea.toFixed(2)} م² | عدد المجموعات: ${customerData.groups.length}</strong>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `).join('')}
        
        <!-- Summary Section -->
        <div class="total-summary-section">
            <div class="summary-title">📊 ملخص إحصائي شامل</div>
            
            <!-- Total Area for All Contracts -->
            <div class="total-contracts-area">
                🏢 مجموع الأمتار الكلي للعقود: ${totalAreaForAllContracts.toFixed(2)} م²
            </div>
            
            <!-- Template Usage Summary -->
            <div style="margin-top: 20px;">
                <h3 style="color: #495057; margin-bottom: 15px; text-align: center;">📋 استخدام النماذج</h3>
                <div class="template-usage-grid">
                    ${Object.entries(templateUsageSummary).map(([templateName, templateData]) => `
                        <div class="template-usage-item">
                            <div>
                                <div class="template-name">${templateName}</div>
                                <div class="template-area">${templateData.totalArea.toFixed(2)} م²</div>
                            </div>
                            <div class="template-count">${templateData.count}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- Total Count Summary -->
            <div style="margin-top: 20px; padding: 15px; background: #f1f3f4; border-radius: 6px;">
                <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 10px;">
                </div>
            </div>
        </div>
        
        <div class="footer-grid" style="margin-top: 20px;">
        <div class="generation-time">
            تم إنشاء التقرير في: ${new Date().toLocaleString('ar-EG')}
        </div>
        
        <div style="margin-top: 15px; font-size: 10px; color: #999; text-align: center;">
            © ${new Date().getFullYear()} جميع الحقوق محفوظة
        </div>
    </div>
</body>
</html>`;
    
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `تقرير_حجوزات_أسبوعي_${new Date().toISOString().split('T')[0]}.doc`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    toast.success(`تم تصدير التقرير بنجاح! يحتوي على ${exportData.length} لوحة و ${Object.keys(groupedByCustomer).length} عميل`);
    
  } catch (error) {
    console.error('Error exporting Word document:', error);
    toast.error('حدث خطأ أثناء تصدير الملف. يرجى المحاولة مرة أخرى.');
  } finally {
    setIsGeneratingWord(false);
  }
};


  const handleExportPDF = () => {
    if (isWeeklyReport) {
      handleExportWeeklyPDF();
    } else {
      handleExportDetailsPDF();
    }
  };



  return (
    <div className="flex flex-wrap justify-end gap-3 mb-4">
      <Button
        onClick={handleExportPDF}
        disabled={isGeneratingPDF || currentData.length === 0}
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
        disabled={isGeneratingWord || currentData.length === 0}
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
  );
};
export default ExportSection;