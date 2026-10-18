// RoadSignExportService.js
import html2pdf from "html2pdf.js";
import { saveAs } from "file-saver";
import { getSacLogoBase64 } from "../../../utils/branding/sacBrand";
import { saveHtml2PdfWithSacLetterhead } from "../../../utils/branding/pdfLetterheadJsPdf";
import {
  sacLetterheadStyles,
  sacLetterheadHeader,
  sacLetterheadFooter,
  sacLetterheadWatermark,
} from "../../../utils/branding/pdfLetterheadHtml";
class PdfGenerator {
  normalizeSize = (size) => {
    if (!size) return "غير متوفر";
    size = size.replace(/\s+/g, "");
    size = size.replace(/[^0-9]/g, "×");
    const parts = size.split("×").filter(Boolean);
    return parts.length === 2 ? `${parts[0]} × ${parts[1]}` : size;
  };

  getLogoBase64 = async () => getSacLogoBase64();

  // Generate PDF Report
  generatePDFReport = async (data, filters, formikValues) => {
    const {
      roadSigns,
      groupedRoadSigns,
      cities,
      regions
    } = data;

    if (!roadSigns || roadSigns.length === 0) {
      throw new Error("لا توجد بيانات لطباعتها");
    }

    const logoBase64 = await this.getLogoBase64();
    const htmlContent = this.getPDFHTMLContent(data, filters, formikValues, logoBase64);
    
    try {
      // Create temporary element
      const element = document.createElement('div');
      element.innerHTML = htmlContent;
      element.style.position = 'fixed';
      element.style.left = '-9999px';
      document.body.appendChild(element);

      const options = {
        margin: [10, 10, 10, 10],
        filename: `تقرير_اللوحات_${new Date().toISOString().slice(0,10)}.pdf`,
        image: { 
          type: 'jpeg', 
          quality: 0.95 
        },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#FFFFFF'
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait' 
        }
      };

      // Renders the HTML, then stamps the official SAC letterhead (logo
      // corner, watermark, footer bar) on every page of the PDF.
      await saveHtml2PdfWithSacLetterhead(html2pdf, element, options);
      document.body.removeChild(element);
      return true;
    } catch (error) {
      document.body.removeChild(element);
      throw error;
    }
  };

  // Generate Word Report
  generateWordReport = async (data, filters, formikValues) => {
    const {
      roadSigns,
      groupedRoadSigns
    } = data;

    if (!roadSigns || roadSigns.length === 0) {
      throw new Error("لا توجد بيانات لطباعتها");
    }

    const logoBase64 = await this.getLogoBase64();
    const htmlContent = this.getWordHTMLContent(data, filters, formikValues, logoBase64);
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const fileName = `تقرير_اللوحات_${new Date().toISOString().slice(0,10)}.doc`;
    saveAs(blob, fileName);
    return true;
  };

  getPDFHTMLContent = (data, filters, formikValues, logoBase64) => {
    const {
      roadSigns,
      groupedRoadSigns,
      cities,
      regions
    } = data;

    const { cityId, regionId, model, direction, place } = filters;
    const { start_date, end_date } = formikValues;

    // Build filters
    const filterItems = [];
    if (cityId) {
      const cityName = cities?.find(c => c.id === parseInt(cityId))?.name || cityId;
      filterItems.push(`<span class="filter-tag">المدينة: ${cityName}</span>`);
    }
    if (regionId) {
      const regionName = regions?.find(r => r.id === parseInt(regionId))?.name || regionId;
      filterItems.push(`<span class="filter-tag">المنطقة: ${regionName}</span>`);
    }
    if (model) filterItems.push(`<span class="filter-tag">النموذج: ${model}</span>`);
    if (direction) filterItems.push(`<span class="filter-tag">الاتجاه: ${direction}</span>`);
    if (place) filterItems.push(`<span class="filter-tag">مكان التموضع: ${place}</span>`);
    if (start_date) filterItems.push(`<span class="filter-tag">تاريخ البداية: ${start_date}</span>`);
    if (end_date) filterItems.push(`<span class="filter-tag">تاريخ النهاية: ${end_date}</span>`);

    const totalAvailable = groupedRoadSigns.reduce((sum, group) => sum + group.totalAvailable, 0);
    const totalPanels = groupedRoadSigns.reduce((sum, group) => sum + group.totalPanels, 0);

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تقرير اللوحات الطرقية</title>
        <style>
          /* SIMPLE CSS - NO MODERN FUNCTIONS */
          body {
            font-family: Arial, sans-serif;
            direction: rtl;
            text-align: right;
            margin: 0;
            padding: 20px;
            color: #000000;
            background-color: #ffffff;
            line-height: 1.6;
          }
          
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #2c3e50;
          }
          
          .header h1 {
            color: #2c3e50;
            margin: 0 0 10px 0;
            font-size: 24px;
          }
          
          .header .date {
            color: #7f8c8d;
            font-size: 14px;
          }
          
          .filters-section {
            background-color: #f8f9fa;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 5px;
            border: 1px solid #dee2e6;
          }
          
          .filters-section h3 {
            color: #2c3e50;
            margin-top: 0;
            margin-bottom: 10px;
            font-size: 16px;
          }
          
          .filter-tag {
            display: inline-block;
            background-color: #e0e0e0;
            padding: 4px 8px;
            margin: 0 5px 5px 0;
            border-radius: 3px;
            font-size: 12px;
          }
          
          .summary {
            background-color: #e3f2fd;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 5px;
            border: 1px solid #bbdefb;
          }
          
          .summary h3 {
            color: #1565c0;
            margin-top: 0;
            margin-bottom: 10px;
            font-size: 16px;
          }
          
          .summary-item {
            display: inline-block;
            margin: 0 15px 5px 0;
            font-weight: bold;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 11px;
            page-break-inside: auto;
          }
          
          table th {
            background-color: #2c3e50;
            color: #ffffff;
            padding: 10px 8px;
            text-align: center;
            border: 1px solid #34495e;
            font-weight: bold;
          }
          
          table td {
            padding: 8px 6px;
            text-align: center;
            border: 1px solid #dddddd;
            vertical-align: middle;
          }
          
          table tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          
          .group-row {
            background-color: #e8f4fd !important;
            font-weight: bold;
          }
          
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #dddddd;
            color: #7f8c8d;
            font-size: 12px;
          }
          
          .available {
            color: #27ae60;
            font-weight: bold;
          }
          
          .not-available {
            color: #e74c3c;
            font-weight: bold;
          }
          
          .face-count {
            background-color: #e8f4fd;
            border: 1px solid #a8d4fd;
            border-radius: 4px;
            padding: 2px 8px;
            font-weight: bold;
            color: #2c5282;
            display: inline-block;
          }
          
          @media print {
            @page {
              size: A4;
              margin: 15mm;
            }
            body {
              margin: 0;
              padding: 0;
            }
          }

          ${sacLetterheadStyles({ mode: "canvas" })}
        </style>
      </head>
      <body>
        ${sacLetterheadWatermark({ mode: "canvas" })}
        ${sacLetterheadHeader({
          logoBase64,
          title: "تقرير اللوحات الطرقية",
          subtitle: `تم إنشاؤه في: ${new Date().toLocaleDateString('ar-SA')} الساعة ${new Date().toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit'})}`,
        })}

        <div class="filters-section">
          <h3>الفلاتر المطبقة:</h3>
          ${filterItems.length > 0 ? filterItems.join('') : '<span class="filter-tag">جميع اللوحات</span>'}
        </div>
        
        <div class="summary">
          <h3>إحصائيات التقرير:</h3>
          <div class="summary-item">• عدد اللوحات: ${roadSigns.length} لوحة</div>
          <div class="summary-item">• عدد المجموعات: ${groupedRoadSigns.length} مجموعة</div>
          <div class="summary-item">• اللوحات المتاحة: ${totalAvailable}</div>
          <div class="summary-item">• إجمالي الوجوه: ${totalPanels}</div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>المدينة</th>
              <th>النموذج</th>
              <th>النوع</th>
              <th>عدد اللوحات</th>
              <th>القياس</th>
              <th>المنطقة</th>
              <th>مكان التموضع</th>
              <th>الاتجاه</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${groupedRoadSigns.map((group, index) => {
              const status = group.totalAvailable > 0 
                ? '<span class="available">🟢 متاح</span>' 
                : '<span class="not-available">🔴 غير متاح</span>';
              
              return `
              <tr class="group-row">
                <td>${index + 1}</td>
                <td>${group.city?.name || 'غير متوفر'}</td>
                <td><strong>${group.template?.model || 'غير متوفر'}</strong></td>
                <td>${group.template?.type || 'غير محدد'}</td>
                <td>
                  <div class="face-count">
                    ${group.similarSignsCount} لوحة
                  </div>
                </td>
                <td>${this.normalizeSize(group.template?.size)}</td>
                <td>${group.region?.name || 'غير متوفر'}</td>
                <td>${group.place || 'غير متوفر'}</td>
                <td>${group.directions || 'غير متوفر'}</td>
                <td><strong>${status}</strong></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <h3>ملاحظات:</h3>
          <p>1. هذا التقرير تم إنشاؤه تلقائياً من نظام إدارة اللوحات الإعلانية</p>
          <p>2. يتم تحديث البيانات تلقائياً وفقاً للحجوزات الفعلية</p>
          <p>3. التواريخ المعتمدة: من ${start_date || "غير محدد"} إلى ${end_date || "غير محدد"}</p>
          <p style="margin-top: 20px;">
            <strong>© ${new Date().getFullYear()} - الشركة السورية للإعلان</strong>
          </p>
        </div>
        ${sacLetterheadFooter({ mode: "canvas" })}
      </body>
      </html>
    `;
  };

  getWordHTMLContent = (data, filters, formikValues, logoBase64) => {
    const {
      groupedRoadSigns
    } = data;

    const { direction, place } = filters;
    const memoizedFiltersText = getActiveFiltersText(direction, place);

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>تقرير اللوحات الطرقية</title>
        <style>
          body {
            font-family: Arial;
            direction: rtl;
            padding: 20px;
            margin: 0;
          }
          h1 {
            color: #1A1817;
            text-align: center;
            margin-bottom: 30px;
          }
          .filter-info {
            background: #f8f9fa;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
            border: 1px solid #dee2e6;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 12px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: center;
          }
          th {
            background-color: #D5A225;
            color: white;
            font-weight: bold;
          }
          .group-row {
            background-color: #f0f8ff;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 12px;
          }

          ${sacLetterheadStyles({ mode: "word" })}
        </style>
      </head>
      <body>
        ${sacLetterheadWatermark({ mode: "word" })}
        ${sacLetterheadHeader({ logoBase64, title: "تقرير اللوحات الطرقية" })}
        <div class="filter-info">
          <strong>الفلاتر المطبقة:</strong> ${memoizedFiltersText || 'جميع اللوحات'}
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>المدينة</th>
              <th>النموذج</th>
              <th>عدد اللوحات</th>
              <th>القياس</th>
              <th>المنطقة</th>
              <th>مكان التموضع</th>
              <th>الاتجاه</th>
            </tr>
          </thead>
          <tbody>
            ${groupedRoadSigns.map((group, index) => `
              <tr class="group-row">
                <td>${index + 1}</td>
                <td>${group.city?.name || 'غير متوفر'}</td>
                <td>${group.template?.model || 'غير متوفر'}</td>
                <td>${group.similarSignsCount}</td>
                <td>${this.normalizeSize(group.template?.size)}</td>
                <td>${group.region?.name || 'غير متوفر'}</td>
                <td>${group.place || 'غير متوفر'}</td>
                <td>${group.directions || 'غير متوفر'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          <p>تم إنشاء التقرير في ${new Date().toLocaleDateString('ar-SA')}</p>
          <p>© ${new Date().getFullYear()} - الشركة السورية للإعلان</p>
        </div>
        ${sacLetterheadFooter({ mode: "word" })}
      </body>
      </html>
    `;
  };

  // Helper function
  getActiveFiltersText = (direction, place) => {
    const filters = [];
    if (direction) filters.push(`الاتجاه: ${direction}`);
    if (place) filters.push(`المكان: ${place}`);
    return filters.join("، ");
  };
}

export default new PdfGenerator();