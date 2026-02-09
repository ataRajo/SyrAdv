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
    templateUsageSummary[templateName].totalArea += parseFloat(item.template?.advertising_space || 0);
    
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
          </div>
        </div>
        
        <!-- Date Summary Card -->
        <div style="background: #e7f3ff; border-radius: 8px; padding: 15px; margin: 15px 0; border: 1px solid #b3d7ff;">
          <div style="display: flex; justify-content: space-around; align-items: center; flex-wrap: wrap;">
            <div style="text-align: center;">
              <div style="font-size: 12px; color: #495057;">📅 تاريخ البدء (تصفية)</div>
              <div style="font-size: 16px; font-weight: bold; color: #0d6efd;">${startDate ? new Date(startDate).toLocaleDateString('ar-EG') : ''}</div>
            </div>
            <div style="font-size: 20px; color: #6c757d;">→</div>
            <div style="text-align: center;">
              <div style="font-size: 12px; color: #495057;">📅 تاريخ الانتهاء (تصفية)</div>
              <div style="font-size: 16px; font-weight: bold; color: #198754;">${endDate ? new Date(endDate).toLocaleDateString('ar-EG') : ''}</div>
            </div>
          
        </div>
        
        <!-- Customer Sections -->
        ${Object.entries(groupedByCustomer).map(([customerId, customerData], customerIndex) => `
          <div class="customer-section ${customerIndex > 0 && customerIndex % 2 === 0 ? 'page-break' : ''}">
            <div class="customer-header">
              <div class="customer-name">${customerData.customerName}</div>
              <div style="font-size: 12px; color: #6c757d; margin-top: 5px;">
                📅 تقرير الحجوزات - التفاصيل حسب التواريخ
              </div>
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
              <div class="info-item">
                <span class="info-label">إجمالي المجموع:</span>
                <span class="info-value badge badge-sum">${customerData.totalSum.toFixed(2)} م²</span>
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
                    <strong>إجمالي العميل: ${customerData.totalBookings} لوحة | إجمالي المساحة: ${customerData.totalArea.toFixed(2)} م² | إجمالي المجموع: ${customerData.totalSum.toFixed(2)} م² | عدد المجموعات: ${customerData.groups.length}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
            
            <!-- Customer Total Section -->
            <div class="customer-total-section">
              <span>🔢 المجموع النهائي:</span>
              <span style="margin-right: 10px; font-size: 16px;">${customerData.totalSum.toFixed(2)} م²</span>
              <span style="font-size: 12px; opacity: 0.9;">(عدد الأوجه × المساحة لكل وجه)</span>
            </div>
          </div>
        `).join('')}
            
          
          <div class="footer-grid" style="margin-top: 20px;">
            <div class="footer-item">
              نظام إدارة اللوحات الإعلانية
            </div>
            <div class="footer-item">
              التقرير الأسبوعي - الإصدار 5.2
            </div>
            <div class="footer-item">
              رقم التقرير: REP-${new Date().getTime().toString().slice(-8)}
            </div>
          </div>
          
          <div class="generation-time">
            تم إنشاء التقرير في: ${new Date().toLocaleString('ar-EG')}
          </div>
          
          <div style="margin-top: 15px; font-size: 10px; color: #999; text-align: center;">
            © ${new Date().getFullYear()} جميع الحقوق محفوظة
          </div>
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
    const reportType = isWeeklyReport ? 'التقرير الأسبوعي للوحات المحجوزة' : `تفاصيل اللوحات ${activeTab === "available" ? 'المتاحة' : 'المحجوزة'}`;
    const statusType = isWeeklyReport ? 'المحجوزة' : (activeTab === "available" ? 'المتاحة' : 'المحجوزة');
    const currentDate = new Date().toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Grouping logic based on report type
    const groupMap = new Map();
    
    exportData.forEach((item) => {
      if (isWeeklyReport && item.bookings && item.bookings.length > 0) {
        // For weekly reports: group by (template + city + region + directions + place + booking dates)
        const booking = item.bookings[0];
        const bookingStart = booking?.start_date || 'بدون_تاريخ';
        const bookingEnd = booking?.end_date || 'بدون_تاريخ';
        
        const groupKey = `${item.template?.model || item.model || "غير محدد"}_${item.city?.name || "غير محدد"}_${item.region?.name || "غير محدد"}_${item.directions || item.direction || "غير محدد"}_${item.place || "غير محدد"}_${bookingStart}_${bookingEnd}`;
        
        if (!groupMap.has(groupKey)) {
          groupMap.set(groupKey, {
            template: item.template?.model || item.template?.name || item.model || "غير محدد",
            city: item.city?.name || "غير محدد",
            region: item.region?.name || "غير محدد",
            directions: item.directions || item.direction || "غير محدد",
            place: item.place || "غير محدد",
            size: item.template?.size || "غير محدد",
            type: item.template?.type || "غير محدد",
            bookingStart: bookingStart !== 'بدون_تاريخ' ? formatArabicDate(bookingStart) : 'غير محدد',
            bookingEnd: bookingEnd !== 'بدون_تاريخ' ? formatArabicDate(bookingEnd) : 'غير محدد',
            count: 0,
            items: [],
            totalArea: 0
          });
        }
        
        const group = groupMap.get(groupKey);
        group.count += 1;
        group.items.push(item);
        group.totalArea += parseFloat(item.template?.advertising_space || item.advertising_space || 0);
      } else {
        // For non-weekly reports: keep original grouping
        const groupKey = `${item.template?.model || item.model || "غير محدد"}_${item.city?.name || "غير محدد"}_${item.region?.name || "غير محدد"}_${item.directions || item.direction || "غير محدد"}_${item.place || "غير محدد"}`;
        
        if (!groupMap.has(groupKey)) {
          groupMap.set(groupKey, {
            template: item.template?.model || item.template?.name || item.model || "غير محدد",
            city: item.city?.name || "غير محدد",
            region: item.region?.name || "غير محدد",
            directions: item.directions || item.direction || "غير محدد",
            place: item.place || "غير محدد",
            size: item.template?.size || "غير محدد",
            type: item.template?.type || "غير محدد",
            count: 0,
            items: [],
            totalArea: 0
          });
        }
        
        const group = groupMap.get(groupKey);
        group.count += 1;
        group.items.push(item);
        group.totalArea += parseFloat(item.template?.advertising_space || item.advertising_space || 0);
      }
    });
    
    const totalBoards = exportData.length;
    const groupedItems = Array.from(groupMap.values());
    const totalArea = groupedItems.reduce((sum, group) => sum + group.totalArea, 0).toFixed(2);
    
    // Get filter info for header
    const getFilterInfo = () => {
      let info = [];
      if (cityId) info.push(`المدينة: ${cities?.find(c => c.id == cityId)?.name || ''}`);
      if (templateNameFilter) info.push(`القالب: ${templateNameFilter}`);
      if (startDate) info.push(`من: ${formatArabicDate(startDate)}`);
      if (endDate) info.push(`إلى: ${formatArabicDate(endDate)}`);
      return info.join(' | ');
    };
    
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
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 2px solid #000;
        }
        
        .report-header h1 {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
            text-decoration: underline;
        }
        
        .report-meta {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
        }
        
        .meta-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
        }
        
        .meta-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
        }
        
        .meta-label {
            font-weight: bold;
            color: #495057;
            min-width: 100px;
        }
        
        .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .badge-primary {
            background: #0d6efd;
            color: white;
        }
        
        .badge-warning {
            background: #ffc107;
            color: #000;
        }
        
        .badge-sum {
            background: #198754;
            color: white;
        }
        
        .print-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 12px;
            border: 1px solid #dee2e6;
        }
        
        .print-table th {
            background: #343a40;
            color: white;
            padding: 10px;
            text-align: right;
            border: 1px solid #495057;
            font-weight: bold;
        }
        
        .print-table td {
            padding: 8px;
            border: 1px solid #dee2e6;
            text-align: right;
        }
        
        .print-table tr.group-highlight {
            background: #f8f9fa !important;
        }
        
        .print-table tr:nth-child(even) {
            background: #f8f9fa;
        }
        
        .print-table tr:hover {
            background: #e9ecef !important;
        }
        
        .group-highlight {
            border-left: 3px solid #0d6efd !important;
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
        
        .report-footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        
        .generation-time {
            margin-top: 10px;
            color: #6c757d;
            font-size: 11px;
        }
        
        /* Weekly Report Specific Styles */
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
        
        .customer-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
            margin-bottom: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 6px;
            border: 1px solid #dee2e6;
        }
        
        .info-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .info-label {
            font-weight: bold;
            color: #495057;
        }
        
        .info-value {
            color: #212529;
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
        
        .customer-total-section {
            background: #198754;
            color: white;
            padding: 10px;
            border-radius: 6px;
            margin-top: 10px;
            text-align: center;
            font-weight: bold;
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
        
        .grouping-note {
            background: #e7f3ff;
            border: 1px solid #b3d7ff;
            border-radius: 6px;
            padding: 8px 12px;
            margin: 10px 0;
            font-size: 11px;
            color: #0d6efd;
        }
        
        @media print {
            body {
                padding: 0;
            }
            
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
                    <span class="badge badge-primary">${totalBoards} لوحة</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">إجمالي المساحة:</span>
                    <span class="badge badge-warning">${totalArea} م²</span>
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
        
        ${
          isWeeklyReport ? `
          <!-- Weekly Report Specific Content -->
          <div class="date-range-section">
            ${
              startDate || endDate ? `
                <div class="date-range-item">
                  <span class="date-range-label">تاريخ البدء:</span>
                  <span class="date-range-value">${startDate ? formatArabicDate(startDate) : 'غير محدد'}</span>
                </div>
                <div class="date-range-item">
                  <span class="date-range-label">تاريخ الانتهاء:</span>
                  <span class="date-range-value">${endDate ? formatArabicDate(endDate) : 'غير محدد'}</span>
                </div>
              ` : ''
            }
          </div>
          
          ` : ''
        }
        
        ${
          isWeeklyReport ? `
          <!-- Customer Sections for Weekly Report -->
          <div>
            ${(() => {
              // Group by customer for weekly reports
              const customerGroups = {};
              
              groupedItems.forEach(group => {
                const customer = group.items[0]?.bookings?.[0]?.customer || {};
                const customerId = customer.id || 'unknown';
                const customerName = customer.full_name || customer.company_name || "غير محدد";
                const customerCompany = customer.company_name || "غير محدد";
                
                if (!customerGroups[customerId]) {
                  customerGroups[customerId] = {
                    customerName,
                    customerCompany,
                    groups: [],
                    totalBookings: 0,
                    totalArea: 0
                  };
                }
                
                customerGroups[customerId].groups.push(group);
                customerGroups[customerId].totalBookings += group.count;
                customerGroups[customerId].totalArea += group.totalArea;
              });
              
              return Object.values(customerGroups).map((customerData, index) => `
                <div class="customer-section ${index > 0 ? 'page-break' : ''}">
                  <div class="customer-header">
                    <div class="customer-name">${customerData.customerName}</div>
                    <div style="font-size: 12px; color: #6c757d; margin-top: 5px;">
                      📅 تقرير الحجوزات - التفاصيل حسب التواريخ
                    </div>
                  </div>
                  
                  <div class="customer-info">
                    <div class="info-item">
                      <span class="info-label">الشركة:</span>
                      <span class="info-value">${customerData.customerCompany}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">عدد اللوحات:</span>
                      <span class="badge badge-primary">${customerData.totalBookings} لوحة</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">إجمالي المساحة:</span>
                      <span class="badge badge-warning">${customerData.totalArea.toFixed(2)} م²</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">إجمالي المجموع:</span>
                      <span class="badge badge-sum">${customerData.totalArea.toFixed(2)} م²</span>
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
                        <th width="18%">تاريخ الحجز</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${customerData.groups.map((group, groupIndex) => `
                        <tr class="group-highlight">
                          <td>${group.template}</td>
                          <td>${group.region}</td>
                          <td class="text-right">${group.place}</td>
                          <td class="text-right">${group.directions}</td>
                          <td>
                            <span class="size-cell">
                              ${group.size}
                            </span>
                          </td>
                          <td>
                            <span class="area-cell">
                              ${group.totalArea.toFixed(2)}
                            </span>
                          </td>
                          <td>
                            <div class="faces-cell">${group.count}</div>
                          </td>
                          <td>
                            <div class="booking-date-container">
                              <div class="booking-date-row">
                                <span class="booking-date-badge booking-start">
                                  من: ${group.bookingStart}
                                </span>
                                <span style="color: #666; font-size: 10px;">←</span>
                                <span class="booking-date-badge booking-end">
                                  إلى: ${group.bookingEnd}
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                  
                  <div class="customer-total-section">
                    <span>🔢 المجموع النهائي:</span>
                    <span style="margin-right: 10px; font-size: 16px;">${customerData.totalArea.toFixed(2)} م²</span>
                  </div>
                </div>
              `).join('');
            })()}
          </div>
          ` : `
          <!-- Details Report Table -->
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
              ${groupedItems.map((group) => `
                <tr class="group-highlight">
                  <td>${group.template}</td>
                  <td>
                    <span class="size-cell">
                      ${group.size}
                    </span>
                  </td>
                  <td>
                    <div class="faces-cell">${group.count}</div>
                  </td>
                  <td>${group.city}</td>
                  <td>${group.region}</td>
                  <td class="text-right">${group.place}</td>
                  <td class="text-right">${group.directions}</td>
                </tr>
              `).join('')}
              
              ${groupedItems.length === 0 ? `
                <tr>
                  <td colspan="7" style="text-align: center; padding: 30px; color: #666;">
                    لا توجد لوحات للعرض
                  </td>
                </tr>
              ` : ''}
            </tbody>
          </table>
          `
        }
        
        <!-- Report Footer -->
        <div class="report-footer">
          <p>📊 ${isWeeklyReport ? 'تقرير الحجوزات الأسبوعي' : 'تفاصيل اللوحات'} - نظام إدارة اللوحات الإعلانية</p>
          <p>📍 جميع المعلومات المعروضة محدثة حتى تاريخ الإنشاء</p>
          <div class="generation-time">
            🕒 تم إنشاء التقرير في: ${new Date().toLocaleString('ar-EG')}
          </div>
          <p style="margin-top: 10px;">© ${new Date().getFullYear()} جميع الحقوق محفوظة</p>
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
    
    toast.success(`تم تصدير التقرير بنجاح! يحتوي على ${totalBoards} لوحة في ${groupedItems.length} مجموعة`);
    
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