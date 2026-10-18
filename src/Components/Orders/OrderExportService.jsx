import { getSacLogoBase64 } from "../../utils/branding/sacBrand";
import {
  sacLetterheadStyles,
  sacLetterheadFooter,
  sacLetterheadWatermark,
  sacRestyleHeader,
} from "../../utils/branding/pdfLetterheadHtml";

class OrderExportService {
  getLogoBase64 = async () => getSacLogoBase64();

  // Individual PDF Methods
  downloadIndividualPDF = async (order, toast) => {
    if (!order) {
      toast.error("لا يوجد بيانات للطلب");
      return;
    }

    toast.info("جاري إنشاء ملف PDF فردي...");
    const logoBase64 = await this.getLogoBase64();

    const printContent = this.getIndividualPDFContent(order, logoBase64);
    this.openPrintWindow(printContent, toast);
  };

  getIndividualPDFContent = (order, logoBase64) => `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>تفاصيل الطلب #${order.id}</title>
      <style>
        ${this.getIndividualPDFStyles()}
      </style>
    </head>
    <body>
      ${this.getIndividualPDFBody(order, logoBase64)}
    </body>
    </html>
  `;

  getIndividualPDFStyles = () => `
    @media print {
      @page { margin: 15mm; }
      body { margin: 0; }
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 20px;
      color: #333;
      direction: rtl;
      background-color: #fff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #D5A225;
      background: linear-gradient(135deg, #3a2f1a 0%, #D5A225 100%);
      color: white;
      padding: 20px;
      border-radius: 10px;
      margin: -20px -20px 30px -20px;
    }
    .logo-container {
      flex-shrink: 0;
      margin-left: 20px;
    }
    .logo {
      width: 120px;
      height: auto;
      max-height: 80px;
      border-radius: 6px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .logo-placeholder {
      width: 120px;
      height: 80px;
      background-color: #1e40af;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 14px;
      border-radius: 4px;
    }
    .header-content {
      flex: 1;
      text-align: right;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 28px;
      font-weight: bold;
    }
    .header .order-id {
      font-size: 18px;
      background: rgba(255, 255, 255, 0.2);
      padding: 5px 15px;
      border-radius: 20px;
      display: inline-block;
    }
    .customer-section {
      display: flex;
      gap: 20px;
      margin-bottom: 30px;
      flex-wrap: wrap;
    }
    .customer-card {
      flex: 1;
      min-width: 300px;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      background: #f9fafb;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .customer-card h3 {
      color: #1A1817;
      margin-bottom: 15px;
      font-size: 18px;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .customer-info {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      font-size: 15px;
    }
    .info-item {
      margin-bottom: 12px;
    }
    .info-label {
      font-weight: bold;
      color: #666;
      display: block;
      margin-bottom: 5px;
      font-size: 14px;
    }
    .info-value {
      color: #333;
      background: white;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      min-height: 40px;
      display: flex;
      align-items: center;
    }
    .new-customer {
      border-color: #10b981;
      background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
    }
    .new-customer h3 {
      color: #10b981;
    }
    .old-customer {
      border-color: #f59e0b;
      background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
    }
    .old-customer h3 {
      color: #f59e0b;
    }
    .order-details-section {
      margin-bottom: 30px;
    }
    .order-details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    .detail-card {
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .detail-card h4 {
      color: #1A1817;
      margin-bottom: 15px;
      font-size: 16px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .detail-content {
      font-size: 16px;
      color: #333;
    }
    .badge {
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: bold;
      display: inline-block;
    }
    .badge-release { background-color: #fecaca; color: #dc2626; }
    .badge-install { background-color: #bbf7d0; color: #16a34a; }
    .badge-both { background-color: #dbeafe; color: #2563eb; }
    .badge-completed { background-color: #dcfce7; color: #16a34a; }
    .badge-city { background-color: #e0f2fe; color: #0284c7; }
    .badge-region { background-color: #f0f9ff; color: #0ea5e9; }
    .badge-place { background-color: #fef3c7; color: #d97706; }
    .badge-direction { background-color: #e0f2fe; color: #2563eb; }
    .badge-roadsign { background-color: #fef3c7; color: #d97706; font-weight: bold; }
    .location-info {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 25px;
      margin: 30px 0;
    }
    .location-info h3 {
      color: #1e293b;
      margin-bottom: 20px;
      font-size: 18px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .location-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }
    .location-item {
      background: white;
      padding: 15px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .location-label {
      font-weight: bold;
      color: #64748b;
      margin-bottom: 5px;
      font-size: 14px;
    }
    .location-value {
      color: #1e293b;
      font-size: 16px;
    }
    .notes-section {
      margin-top: 30px;
    }
    .notes-box {
      background: #fef3c7;
      border: 2px solid #fbbf24;
      border-radius: 12px;
      padding: 20px;
      margin-top: 15px;
    }
    .notes-content {
      font-size: 16px;
      color: #92400e;
      line-height: 1.6;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      color: #64748b;
      font-size: 14px;
    }
    .print-date {
      background: #f8fafc;
      padding: 10px 20px;
      border-radius: 8px;
      display: inline-block;
      margin-bottom: 10px;
    }
    @media print {
      .no-print {
        display: none;
      }
    }

    ${sacLetterheadStyles()}
    ${sacRestyleHeader('.header')}
  `;

  getIndividualPDFBody = (order, logoBase64) => `
    ${sacLetterheadWatermark()}
    <div class="header">
      <div class="logo-container">
        ${logoBase64 ? `<img src="${logoBase64}" alt="الشركة السورية للإعلان" class="logo">` : '<div class="logo-placeholder">الشعار</div>'}
      </div>
      <div class="header-content">
        <h1>تفاصيل الطلب</h1>
        <div class="order-id">رقم الطلب: ${order.id}</div>
        <div style="margin-top: 10px; font-size: 14px; opacity: 0.9;">
          تم إنشاء هذا التقرير في: ${new Date().toLocaleDateString('ar-EG')}
        </div>
      </div>
    </div>
    
    <div class="customer-section">
      <div class="customer-card old-customer">
        <h3>👤 العميل الحالي</h3>
        <div class="customer-info">
          <div class="info-item">
            <span class="info-label">اسم الشركة:</span>
            <span class="info-value">${order.customer?.company_name || 'غير متوفر'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">اسم العميل:</span>
            <span class="info-value">${order.customer?.full_name || 'غير متوفر'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">رقم الهاتف:</span>
            <span class="info-value">${order.customer?.phone_number || 'غير متوفر'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">البريد الإلكتروني:</span>
            <span class="info-value">${order.customer?.email || 'غير متوفر'}</span>
          </div>
          ${order.customer?.commercial_registration_number ? `
          <div class="info-item">
            <span class="info-label">رقم السجل التجاري:</span>
            <span class="info-value">${order.customer.commercial_registration_number}</span>
          </div>
          ` : ''}
        </div>
      </div>
      
      ${order.customer_new ? `
        <div class="customer-card new-customer">
          <h3>🆕 العميل الجديد</h3>
          <div class="customer-info">
            <div class="info-item">
              <span class="info-label">اسم الشركة:</span>
              <span class="info-value">${order.customer_new.company_name || 'غير متوفر'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">اسم العميل:</span>
              <span class="info-value">${order.customer_new.full_name || 'غير متوفر'}</span>
            </div>
            ${order.customer_new.phone_number ? `
            <div class="info-item">
              <span class="info-label">رقم الهاتف:</span>
              <span class="info-value">${order.customer_new.phone_number}</span>
            </div>
            ` : ''}
            ${order.customer_new.email ? `
            <div class="info-item">
              <span class="info-label">البريد الإلكتروني:</span>
              <span class="info-value">${order.customer_new.email}</span>
            </div>
            ` : ''}
          </div>
        </div>
      ` : ''}
    </div>
    
    <div class="location-info">
      <h3>📍 معلومات الموقع التفصيلية</h3>
      <div class="location-grid">
        <div class="location-item">
          <div class="location-label">المدينة:</div>
          <div class="location-value">
            <span class="badge badge-city">${order.road_sign?.city?.name || 'غير محدد'}</span>
          </div>
        </div>
        <div class="location-item">
          <div class="location-label">التموضع:</div>
          <div class="location-value">
            <span class="badge badge-region">${order.road_sign?.region?.name || 'غير محددة'}</span>
          </div>
        </div>
        <div class="location-item">
          <div class="location-label">النموذج:</div>
          <div class="location-value">
            <span class="badge badge-roadsign">${order.road_sign?.roadsign_code || 'غير محدد'}</span>
          </div>
        </div>
        <div class="location-item">
          <div class="location-label">القياس:</div>
          <div class="location-value">
            <span class="badge badge-roadsign">${order.road_sign?.template?.size || 'غير محدد'}</span>
          </div>
        </div>
        <div class="location-item">
          <div class="location-label">رمز الاتجاه:</div>
          <div class="location-value">
            <span class="badge badge-direction">${order.road_sign?.direction_code || 'غير محدد'}</span>
          </div>
        </div>
        <div class="location-item">
          <div class="location-label">المكان (التموضع):</div>
          <div class="location-value">
            <span class="badge badge-place">${order.road_sign?.place || 'غير محدد'}</span>
          </div>
        </div>
        <div class="location-item">
          <div class="location-label">الاتجاه:</div>
          <div class="location-value">${order.road_sign?.directions || 'غير محددة'}</div>
        </div>
      </div>
    </div>
    
    <div class="order-details-section">
      <h3 style="color: #1A1817; margin-bottom: 20px; display:flex; align-items: center; gap: 10px;">📋 تفاصيل الطلب</h3>
      <div class="order-details-grid">
        <div class="detail-card">
          <h4>نوع الطلب</h4>
          <div class="detail-content">
            <span class="badge ${order.type === 1 ? 'badge-release' : order.type === 2 ? 'badge-install' : 'badge-both'}">
              ${order.type === 1 ? "فك" : order.type === 2 ? "تركيب" : "فك و تركيب"}
            </span>
          </div>
        </div>
        
        <div class="detail-card">
          <h4>تاريخ العملية</h4>
          <div class="detail-content">
            ${new Date(order.action_date).toLocaleDateString('ar-EG')}<br>
            <small style="color: #666;">${new Date(order.action_date).toLocaleDateString('en-US')}</small>
          </div>
        </div>
        
        <div class="detail-card">
          <h4>تاريخ الإنشاء</h4>
          <div class="detail-content">
            ${new Date(order.created_at).toLocaleDateString('ar-EG')}<br>
            <small style="color: #666;">${new Date(order.created_at).toLocaleTimeString('ar-EG')}</small>
          </div>
        </div>
      </div>
    </div>
    
    ${order.notes ? `
      <div class="notes-section">
        <h3 style="color: #1A1817; margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">📝 الملاحظات</h3>
        <div class="notes-box">
          <div class="notes-content">${order.notes}</div>
        </div>
      </div>
    ` : ''}
    
    <div class="footer">
      <div class="print-date">
        تم إنشاء هذا التقرير في: ${new Date().toLocaleDateString('ar-EG')} الساعة ${new Date().toLocaleTimeString('ar-EG')}
      </div>
      <p>تم إنشاء هذا التقرير تلقائياً من نظام إدارة الطلبات</p>
      <p>© ${new Date().getFullYear()} جميع الحقوق محفوظة</p>
    </div>
    ${sacLetterheadFooter()}

    <script>
      window.onload = function() {
        window.print();
        setTimeout(() => {
          window.close();
        }, 1000);
      };
    </script>
  `;

  // Bulk PDF Methods
  generatePDFViaPrint = async (orders, selectedCustomerName, customersList, toast) => {
    if (orders.length === 0) {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }

    const currentDate = new Date();
    const formattedReportDate = currentDate.toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedReportTime = currentDate.toLocaleTimeString('ar-EG');

    const logoBase64 = await this.getLogoBase64();

    const printContent = this.getBulkPDFContent(orders, selectedCustomerName, customersList, logoBase64, formattedReportDate, formattedReportTime);
    this.openPrintWindow(printContent, toast);
  };

  getBulkPDFContent = (orders, selectedCustomerName, customersList, logoBase64, formattedReportDate, formattedReportTime) => `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>تقرير طلبات العميل</title>
      <style>
        ${this.getBulkPDFStyles()}
      </style>
    </head>
    <body>
      ${this.getBulkPDFBody(orders, selectedCustomerName, customersList, logoBase64, formattedReportDate, formattedReportTime)}
    </body>
    </html>
  `;

  getBulkPDFStyles = (mode = "print") => `
    @media print {
      @page { margin: 15mm; }
      body { margin: 0; }
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 20px;
      color: #333;
      direction: rtl;
      background-color: #fff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #D5A225;
      background: linear-gradient(135deg, #3a2f1a 0%, #D5A225 100%);
      color: white;
      padding: 20px;
      border-radius: 10px;
      margin: -20px -20px 30px -20px;
    }
    .logo-container {
      flex-shrink: 0;
      margin-left: 20px;
    }
    .logo {
      width: 100px;
      height: 300px;
      max-height: 80px;
      border-radius: 6px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .logo-placeholder {
      width: 120px;
      height: 80px;
      background-color: #1e40af;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 14px;
      border-radius: 4px;
    }
    .header-content {
      flex: 1;
      text-align: right;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 28px;
      font-weight: bold;
    }
    .filter-info {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 30px;
      border-right: 4px solid #0ea5e9;
      border: 2px solid #bae6fd;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      font-size: 11px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      border-radius: 12px;
      overflow: hidden;
    }
    th {
      background: linear-gradient(135deg, #3a2f1a 0%, #D5A225 100%);
      color: white;
      padding: 10px 6px;
      text-align: center;
      font-weight: bold;
      border: none;
      font-size: 11px;
      white-space: nowrap;
    }
    td {
      padding: 8px 6px;
      text-align: center;
      border-bottom: 1px solid #e5e7eb;
      border-right: 1px solid #e5e7eb;
      vertical-align: top;
      font-size: 10px;
    }
    td:last-child {
      border-right: none;
    }
    tr:nth-child(even) {
      background-color: #f8fafc;
    }
    
    .badge {
      padding: 3px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: bold;
      display: inline-block;
      white-space: nowrap;
    }
    .badge-release { 
      background-color: #fecaca; 
      color: #dc2626; 
      border: 1px solid #fca5a5;
    }
    .badge-install { 
      background-color: #bbf7d0; 
      color: #16a34a; 
      border: 1px solid #86efac;
    }
    .badge-both { 
      background-color: #dbeafe; 
      color: #2563eb; 
      border: 1px solid #93c5fd;
    }
    
    .date-badge {
      background-color: #e0f2fe;
      border: 1px solid #93c5fd;
      color: #0284c7;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: bold;
      display: inline-block;
      text-align: center;
      min-width: 70px;
    }
    
    .customer-old {
      background-color: #fef3c7;
      border: 1px solid #fbbf24;
      color: #92400e;
      padding: 4px 6px;
      border-radius: 4px;
      font-size: 9px;
      display: block;
      margin-bottom: 2px;
      line-height: 1.3;
    }
    .customer-new {
      background-color: #dbeafe;
      border: 1px solid #93c5fd;
      color: #1e40af;
      padding: 4px 6px;
      border-radius: 4px;
      font-size: 9px;
      display: block;
      margin-top: 2px;
      line-height: 1.3;
    }
    .no-customer {
      color: #9ca3af;
      font-style: italic;
      font-size: 9px;
    }
    .notes-cell {
      max-width: 120px;
      text-align: right;
    }
    .notes-display {
      background: #fef3c7;
      border: 1px solid #fbbf24;
      border-radius: 4px;
      padding: 4px 6px;
      font-size: 9px;
      color: #92400e;
      line-height: 1.4;
      text-align: right;
      display: block;
      word-wrap: break-word;
      max-height: 60px;
      overflow-y: auto;
    }
    .no-notes {
      color: #9ca3af;
      font-style: italic;
      font-size: 9px;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      color: #64748b;
      font-size: 12px;
    }

    /* ============ جدول أوامر الورشة (مجمّع حسب المنطقة) ============ */

    .workshop-table {
      font-size: 10px;
      table-layout: fixed;
      width: 100%;
    }
    .workshop-table td {
      vertical-align: middle;
      word-wrap: break-word;
    }
    .workshop-table tbody tr:nth-child(even) {
      background-color: #f8fafc;
    }

    /* سطر عنوان المنطقة: يفصل كتلة عن كتلة بصريًا، ولا يُترك وحيدًا في
       أسفل الصفحة بفضل page-break-after أدناه. */
    .region-header td {
      background: #1e293b;
      color: #fff;
      text-align: right;
      padding: 8px 12px;
      font-size: 12px;
      border: none;
    }
    .region-header .region-title {
      font-weight: bold;
      font-size: 14px;
    }
    .region-header .region-city {
      opacity: 0.75;
      margin-right: 10px;
      font-size: 11px;
    }
    .region-header .region-meta {
      float: left;
      opacity: 0.85;
      font-size: 11px;
      font-weight: bold;
    }
    .region-block + .region-block .region-header td {
      border-top: 3px solid #fff;
    }

    .serial-cell {
      font-weight: bold;
      color: #64748b;
      font-size: 10px;
    }
    .region-cell {
      font-size: 9px;
      color: #475569;
    }
    .model-name {
      font-weight: bold;
      font-size: 11px;
      color: #1e293b;
    }
    .model-size {
      font-size: 9px;
      color: #64748b;
      margin-top: 2px;
    }
    .direction-cell {
      text-align: right;
      font-size: 9px;
      line-height: 1.4;
    }

    /* خانة العدد هي بيت القصيد: الورشة تقرأ منها كم لوحة في هذا السطر. */
    .count-cell {
      background: #eef2ff;
    }
    .count-boards {
      font-size: 18px;
      font-weight: bold;
      color: #1A1817;
      line-height: 1;
    }
    .count-label {
      font-size: 9px;
      color: #1A1817;
      margin-right: 2px;
    }
    .count-faces {
      font-size: 8px;
      color: #6366f1;
      margin-top: 3px;
    }

    .codes-cell {
      text-align: right;
    }
    .code-list {
      display: block;
      line-height: 1.7;
    }
    .code-chip {
      display: inline-block;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 3px;
      padding: 1px 4px;
      margin: 1px;
      font-size: 9px;
      font-family: 'Courier New', monospace;
      color: #334155;
      white-space: nowrap;
    }

    .note-line {
      display: block;
      margin-bottom: 2px;
    }

    /* مربع توقيع/تأشير لفريق الورشة عند إنجاز السطر. */
    .done-cell {
      background: #fff;
    }
    .done-cell::before {
      content: '';
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 1.5px solid #94a3b8;
      border-radius: 3px;
    }

    .region-summary {
      margin: 0 0 25px 0;
      padding: 14px 18px;
      background: #f8fafc;
      border: 2px solid #e2e8f0;
      border-radius: 10px;
    }
    .region-summary h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
      color: #1e293b;
    }
    .region-summary-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .region-summary-item {
      background: #fff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 6px 10px;
      font-size: 11px;
    }
    .region-summary-item b {
      color: #1A1817;
    }

    @media print {
      /* التقرير أفقي: 12 عمودًا لا تتسع في A4 عمودي، والوضع الأفقي وحده
         يوفّر نحو ثلث عدد الصفحات قبل احتساب أثر الدمج. */
      @page { size: A4 portrait; margin: 10mm; }

      .no-print { display: none; }

      /* تكرار رؤوس الأعمدة في كل صفحة - بدونها تصبح الصفحة الثانية
         أرقامًا بلا عناوين. */
      thead { display: table-header-group; }

      /* لا يُقطع سطر في منتصفه، ولا يبقى عنوان منطقة وحيدًا في أسفل
         صفحة. هذا ما يستبدل الفاصل الثابت كل 20 سطرًا الذي كان يقطع
         الجدول في مكان عشوائي بصرف النظر عن المنطقة. */
      tr { page-break-inside: avoid; break-inside: avoid; }
      .region-header { page-break-after: avoid; break-after: avoid; }

      .region-summary { page-break-after: avoid; }
      .footer { page-break-before: avoid; }
    }

    ${sacLetterheadStyles({ mode })}
    ${sacRestyleHeader('.header')}
  `;

  getBulkPDFBody = (orders, selectedCustomerName, customersList, logoBase64, formattedReportDate, formattedReportTime) => `
    ${sacLetterheadWatermark()}
    <div class="header">
      <div class="logo-container">
        ${logoBase64 ? `<img src="${logoBase64}" alt="الشركة السورية للإعلان" class="logo">` : '<div class="logo-placeholder">الشعار</div>'}
      </div>
      <div class="header-content">
        <h1>تقرير طلبات العميل</h1>
        <div style="font-size: 14px; opacity: 0.9; margin-top: 5px;">
          ${formattedReportDate}
        </div>
        <div style="font-size: 12px; opacity: 0.8; margin-top: 3px;">
          الساعة: ${formattedReportTime}
        </div>
      </div>
    </div>
    
    <div class="filter-info">
      <h3 style="color: #0ea5e9; margin-bottom: 15px; margin-top: 0;">معلومات التصفية</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
        <div>
          <strong>العميل المحدد:</strong><br>
          <span style="font-size: 14px; color: #1e293b;">${selectedCustomerName}</span>
        </div>
        <div>
          <strong>حجم العمل:</strong><br>
          <span style="font-size: 14px; color: #1e293b;">${this.getWorkshopStats(orders).boards} لوحة في ${this.getWorkshopStats(orders).lines} سطر (${this.getWorkshopStats(orders).regions} منطقة)</span>
        </div>
        <div>
          <strong>تاريخ التقرير:</strong><br>
          <span style="font-size: 14px; color: #1e293b;">${formattedReportDate}</span>
        </div>
        <div>
          <strong>وقت التقرير:</strong><br>
          <span style="font-size: 14px; color: #1e293b;">${formattedReportTime}</span>
        </div>
      </div>
    </div>
    
    ${this.getWorkshopRegionIndex(orders)}

    ${this.getWorkshopTable(orders)}
    
    <div class="footer">
      <div style="margin-bottom: 20px;">
        <div style="background: #f8fafc; padding: 12px; border-radius: 8px; display: inline-block;">
          <strong>ملخص التقرير:</strong>
          <div style="margin-top: 10px; display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; font-size: 12px;">
            <div>إجمالي اللوحات: <strong>${this.getWorkshopStats(orders).boards}</strong></div>
            <div>عدد الأسطر: <strong>${this.getWorkshopStats(orders).lines}</strong></div>
            <div>عدد المناطق: <strong>${this.getWorkshopStats(orders).regions}</strong></div>
            <div>تاريخ الإنشاء: <strong>${formattedReportDate}</strong></div>
            <div>وقت الإنشاء: <strong>${formattedReportTime}</strong></div>
          </div>
        </div>
      </div>
      <p>تم إنشاء هذا التقرير تلقائياً من نظام إدارة الطلبات</p>
      <p>تاريخ التقرير: ${formattedReportDate} - الساعة: ${formattedReportTime}</p>
      <p>© ${new Date().getFullYear()} جميع الحقوق محفوظة</p>
    </div>
    ${sacLetterheadFooter()}

    <script>
      window.onload = function() {
        window.print();
        setTimeout(() => {
          window.close();
        }, 1000);
      };
    </script>
  `;

  /* ==================================================================
   *  تجميع أوامر الورشة
   * ==================================================================
   *  المشكلة: كل لوحة كانت تُطبع في سطر مستقل، فحجز فيه 40 لوحة متطابقة
   *  في المنطقة والنموذج والقياس والاتجاه يخرج في 40 سطرًا موزّعة على
   *  صفحتين، وأسطر المنطقة الواحدة متناثرة بين المناطق الأخرى - فتضطر
   *  الورشة للتنقل بين المناطق ذهابًا وإيابًا.
   *
   *  الحل هنا على مستويين:
   *   1) دمج اللوحات المتطابقة في سطر واحد يحمل العدد وأرقام اللوحات.
   *   2) ترتيب الأسطر ضمن أقسام: كل منطقة كتلة متصلة، تُنجزها الورشة
   *      كاملة قبل الانتقال للمنطقة التالية.
   * ================================================================== */

  WORKSHOP_TYPE_LABELS = { 1: 'فك', 2: 'تركيب', 3: 'فك وتركيب', 4: 'صيانة' };

  workshopText = (value) => {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  };

  /**
   * تاريخ موحّد للمقارنة: 'YYYY-MM-DD' مأخوذ من النص مباشرة.
   * لا يمرّ عبر new Date() لأن '2026-08-11' تُقرأ كـ UTC فتظهر يومًا
   * أسبق في أي متصفح غرب غرينتش - وهذا يفصل لوحتين ليومهما نفسه.
   */
  workshopDateKey = (value) => {
    if (!value) return '';
    const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
  };

  workshopDateLabel = (dateKey) => {
    if (!dateKey) return 'غير محدد';
    const [y, m, d] = dateKey.split('-');
    return `${d}/${m}/${y}`;
  };

  /** أسماء المعلن القديم/الجديد - نفس منطق getOrderRow مع إضافة نوع الصيانة. */
  getWorkshopCustomers = (order) => {
    const current = order.customer?.company_name || order.customer?.full_name || '';
    const incoming = order.customer_new?.company_name || order.customer_new?.full_name || '';
    const type = Number(order.type);

    if (type === 1) return { oldCustomer: current || 'غير محدد', newCustomer: '-' };
    if (type === 2) return { oldCustomer: '-', newCustomer: incoming || current || 'غير محدد' };
    if (type === 3) {
      return {
        oldCustomer: current || 'المعلن القديم',
        newCustomer: incoming || 'المعلن الجديد',
      };
    }
    return { oldCustomer: current || 'غير محدد', newCustomer: '-' };
  };

  /**
   * مفتاح الدمج: منطقة + مدينة + نموذج + قياس + اتجاه + عدد الأوجه + نوع
   * الأمر + التاريخ + المعلن القديم + المعلن الجديد.
   *
   * النوع والتاريخ والمعلنان جزء من المفتاح عمدًا: دمج فك مع تركيب، أو
   * دمج لوحتين لمعلنَين مختلفين في سطر واحد، يعطي الورشة أمرًا خاطئًا.
   * أرقام اللوحات والملاحظات خارج المفتاح - هي ما يُجمَّع داخل السطر.
   */
  buildWorkshopKey = (order) => {
    const roadSign = order.road_sign || {};
    const template = roadSign.template || {};
    const { oldCustomer, newCustomer } = this.getWorkshopCustomers(order);

    return [
      this.workshopText(roadSign.city?.name),
      this.workshopText(roadSign.region?.name),
      this.workshopText(template.model),
      this.workshopText(template.size),
      this.workshopText(roadSign.directions),
      this.workshopText(roadSign.faces_number || 1),
      Number(order.type) || 0,
      this.workshopDateKey(order.action_date),
      this.workshopText(oldCustomer),
      this.workshopText(newCustomer),
    ].join(' ¦ ');
  };

  /**
   * يحوّل مصفوفة الطلبات إلى أقسام مناطق، وكل قسم أسطر مدموجة.
   */
  groupOrdersForWorkshop = (orders = []) => {
    // التجميع يُستدعى عدة مرات في التصدير الواحد (الفهرس، الجدول، الرأس،
    // التذييل). النتيجة تُحفظ مقابل مرجع المصفوفة نفسه فلا يُعاد الحساب.
    if (this._workshopCacheSource === orders && this._workshopCache) {
      return this._workshopCache;
    }

    const regions = new Map();

    orders.forEach((order) => {
      const roadSign = order.road_sign || {};
      const template = roadSign.template || {};
      const cityName = this.workshopText(roadSign.city?.name) || 'مدينة غير محددة';
      const regionName = this.workshopText(roadSign.region?.name) || 'منطقة غير محددة';
      const regionKey = `${cityName} ¦ ${regionName}`;

      if (!regions.has(regionKey)) {
        regions.set(regionKey, { regionKey, regionName, cityName, groups: new Map() });
      }

      const region = regions.get(regionKey);
      const key = this.buildWorkshopKey(order);

      if (!region.groups.has(key)) {
        const { oldCustomer, newCustomer } = this.getWorkshopCustomers(order);
        const type = Number(order.type) || 0;
        const dateKey = this.workshopDateKey(order.action_date);

        region.groups.set(key, {
          key,
          cityName,
          regionName,
          model: this.workshopText(template.model) || 'غير محدد',
          size: this.workshopText(template.size),
          direction: this.workshopText(roadSign.directions) || 'غير محددة',
          facesPerBoard: Number(roadSign.faces_number) || 1,
          type,
          typeLabel: this.WORKSHOP_TYPE_LABELS[type] || 'غير محدد',
          dateKey,
          dateLabel: this.workshopDateLabel(dateKey),
          oldCustomer,
          newCustomer,
          codes: [],
          orderIds: [],
          notes: [],
        });
      }

      const group = region.groups.get(key);
      const code = this.workshopText(roadSign.roadsign_code) || `#${order.id}`;
      group.codes.push(code);
      group.orderIds.push(order.id);

      const note = this.workshopText(order.notes);
      if (note) group.notes.push({ code, note });
    });

    const collator = new Intl.Collator('ar', { numeric: true, sensitivity: 'base' });

    const result = Array.from(regions.values())
      .map((region) => {
        const groups = Array.from(region.groups.values()).map((group) => {
          group.codes.sort(collator.compare);

          // ملاحظة واحدة متكررة تُعرض مرة واحدة؛ الملاحظات المختلفة تُعرض
          // مسبوقة برقم لوحتها كي لا تضيع المعلومة عند الدمج.
          const distinctNotes = [...new Set(group.notes.map((n) => n.note))];
          // شرط "كل اللوحات" ضروري: لو كتب أحدهم ملاحظة على لوحة واحدة من
          // ثلاث، عرضها كملاحظة موحّدة للسطر يبلّغ الورشة بخطأ على لوحتين
          // سليمتين. تُعرض موحّدة فقط إن حملتها كل لوحات السطر بالنص نفسه.
          group.uniformNote =
            distinctNotes.length === 1 && group.notes.length === group.codes.length
              ? distinctNotes[0]
              : null;
          group.hasNotes = group.notes.length > 0;

          group.boards = group.codes.length;
          group.faces = group.boards * group.facesPerBoard;
          return group;
        });

        // الترتيب داخل المنطقة: الاتجاه (خط سير الورشة) ثم النموذج فالقياس
        // ثم نوع الأمر فالتاريخ - أي حسب ما تنفّذه الورشة فعليًا.
        groups.sort(
          (a, b) =>
            collator.compare(a.direction, b.direction) ||
            collator.compare(a.model, b.model) ||
            collator.compare(a.size, b.size) ||
            a.type - b.type ||
            a.dateKey.localeCompare(b.dateKey)
        );

        return {
          ...region,
          groups,
          lines: groups.length,
          boards: groups.reduce((sum, g) => sum + g.boards, 0),
          faces: groups.reduce((sum, g) => sum + g.faces, 0),
        };
      })
      .sort(
        (a, b) =>
          collator.compare(a.cityName, b.cityName) ||
          b.boards - a.boards ||
          collator.compare(a.regionName, b.regionName)
      );

    this._workshopCacheSource = orders;
    this._workshopCache = result;
    return result;
  };

  /** أرقام مجمّعة تُعرض في رأس التقرير وتذييله. */
  getWorkshopStats = (orders = []) => {
    const regions = this.groupOrdersForWorkshop(orders);
    return {
      regions: regions.length,
      lines: regions.reduce((sum, r) => sum + r.lines, 0),
      boards: regions.reduce((sum, r) => sum + r.boards, 0),
      faces: regions.reduce((sum, r) => sum + r.faces, 0),
      orders: orders.length,
    };
  };

  getWorkshopNotesCell = (group) => {
    if (!group.hasNotes) return '<span class="no-notes"></span>';
    if (group.uniformNote) return `<div class="notes-display">${group.uniformNote}</div>`;

    return `<div class="notes-display">${group.notes
      .map((n) => `<span class="note-line"><b>${n.code}:</b> ${n.note}</span>`)
      .join('')}</div>`;
  };

  /** صف PDF (طولي): النموذج/القياس، العدد، المنطقة، الاتجاه، ثم البقية. */
  getWorkshopGroupRow = (group, serial) => `
      <tr>
        <td class="serial-cell">${serial}</td>
        <td class="model-cell">
          <div class="model-name">${group.model}</div>
          ${group.size ? `<div class="model-size">${group.size}</div>` : ''}
        </td>
        <td class="count-cell">
          <span class="count-boards">${group.boards}</span>
          <span class="count-label">لوحة</span>
          <div class="count-faces">${group.faces} وجه</div>
        </td>
        <td class="region-cell">${group.regionName}</td>
        <td class="direction-cell">${group.direction}</td>
        <td>
          ${
            group.oldCustomer && group.oldCustomer !== '-'
              ? `<div class="customer-old">${group.oldCustomer}</div>`
              : '<span class="no-customer">-</span>'
          }
        </td>
        <td>
          ${
            group.newCustomer && group.newCustomer !== '-'
              ? `<div class="customer-new">${group.newCustomer}</div>`
              : '<span class="no-customer">-</span>'
          }
        </td>
        <td class="notes-cell">${this.getWorkshopNotesCell(group)}</td>
        <td class="done-cell"></td>
      </tr>
    `;

  /**
   * كل منطقة في <tbody> مستقل يسبقه سطر عنوان. مع
   * `page-break-after: avoid` على سطر العنوان لا يبقى عنوان منطقة وحيدًا
   * في أسفل الصفحة، ومع `display: table-header-group` على <thead> تتكرر
   * رؤوس الأعمدة في كل صفحة - وهما ما يجعل عدد الصفحات منطقيًا بدل
   * الفاصل الثابت كل 20 سطرًا الذي كان يقطع الجدول عشوائيًا.
   */
  getWorkshopRegionBody = (region, startSerial) => {
    let serial = startSerial;

    return `
      <tbody class="region-block">
        <tr class="region-header">
          <td colspan="9">
            <span class="region-title">${region.regionName}</span>
            <span class="region-city">${region.cityName}</span>
            <span class="region-meta">${region.lines} سطر · ${region.boards} لوحة · ${region.faces} وجه</span>
          </td>
        </tr>
        ${region.groups.map((group) => this.getWorkshopGroupRow(group, serial++)).join('')}
      </tbody>
    `;
  };

  /**
   * فهرس المناطق أعلى التقرير: يقرأ منه مسؤول الورشة خط سيره قبل أن يبدأ
   * (كم منطقة، وكم لوحة في كل منها) بدل أن يكتشف ذلك بتقليب الصفحات.
   */
  getWorkshopRegionIndex = (orders) => {
    const regions = this.groupOrdersForWorkshop(orders);
    if (regions.length === 0) return '';

    return `
      <div class="region-summary">
        <h3>خط سير الورشة - ${regions.length} منطقة</h3>
        <div class="region-summary-list">
          ${regions
            .map(
              (region, index) => `
            <div class="region-summary-item">
              <b>${index + 1}. ${region.regionName}</b>
              <span style="color:#64748b;"> (${region.cityName})</span>
              &nbsp;·&nbsp; ${region.boards} لوحة &nbsp;·&nbsp; ${region.lines} سطر
            </div>`
            )
            .join('')}
        </div>
      </div>
    `;
  };

  getWorkshopTable = (orders, options = {}) => {
    const forWord = !!options.forWord;
    const regions = this.groupOrdersForWorkshop(orders);

    if (regions.length === 0) {
      return '<p style="text-align:center; padding:30px;">لا توجد طلبات للطباعة</p>';
    }

    // Word لا يطبّق قواعد الطباعة من CSS الخارجي بشكل موثوق، فتُحقن
    // ألوان الرأس مباشرةً كما كان يفعل exportToWord أصلًا.
    const thStyle = forWord ? 'background:#000; color:#fff; border:1px solid #fff;' : '';

    let serial = 1;
    const bodies = regions
      .map((region) => {
        const html = this.getWorkshopRegionBody(region, serial);
        serial += region.groups.length;
        return html;
      })
      .join('');

    return `
      <table cellspacing="0" cellpadding="0" class="workshop-table">
        <thead>
          <tr>
            <th style="width: 5%; ${thStyle}">م</th>
            <th style="width: 14%; ${thStyle}">النموذج / القياس</th>
            <th style="width: 9%; ${thStyle}">العدد</th>
            <th style="width: 11%; ${thStyle}">المنطقة</th>
            <th style="width: 15%; ${thStyle}">الاتجاه</th>
            <th style="width: 13%; ${thStyle}">فك (المعلن القديم)</th>
            <th style="width: 13%; ${thStyle}">تركيب (المعلن الجديد)</th>
            <th style="width: 16%; ${thStyle}">الملاحظات</th>
            <th style="width: 4%; ${thStyle}">تم</th>
          </tr>
        </thead>
        ${bodies}
      </table>
    `;
  };

  getOrderRow = (order, index) => {
    const typeText = order.type === 1 ? "فك" : order.type === 2 ? "تركيب" : "فك و تركيب";
    const typeClass = order.type === 1 ? "release" : order.type === 2 ? "install" : "both";
    
    const notes = order.notes || "";
    const notesDisplay = notes ? 
      `<div class="notes-display">${notes}</div>` : 
      '<span class="no-notes"></span>';
    
    const actionDate = order.action_date ? new Date(order.action_date) : null;
    const formattedActionDate = actionDate ? actionDate.toLocaleDateString('ar-EG') : 'غير محدد';
    
    let oldCustomerName = "";
    let newCustomerName = "";
    
    if (order.type === 1) {
      oldCustomerName = order.customer?.company_name || order.customer?.full_name || 'غير محدد';
      newCustomerName = "-";
    } else if (order.type === 2) {
      if (order.customer_new) {
        oldCustomerName = "-";
        newCustomerName = order.customer_new.company_name || order.customer_new.full_name || 'معلن جديد';
      } else {
        oldCustomerName = "-";
        newCustomerName = order.customer?.company_name || order.customer?.full_name || 'غير محدد';
      }
    } else if (order.type === 3) {
      oldCustomerName = order.customer?.company_name || order.customer?.full_name || 'المعلن القديم';
      newCustomerName = order.customer_new?.company_name || order.customer_new?.full_name || 'المعلن الجديد';
    }
    
    const facesNumber = order.road_sign?.faces_number || 1;
    
    return `
      <tr ${index > 0 && index % 20 === 0 ? 'class="page-break"' : ''}>
        <td>${order.road_sign?.roadsign_code || 'غير محدد'}</td>
        <td><span class="badge">${facesNumber}</span></td>
        <td>${order.road_sign?.region?.name || 'غير محددة'}</td>
        <td style="text-align: right; font-size: 9px;">${order.road_sign?.directions || 'غير محددة'}</td>
        <td>
          ${oldCustomerName && oldCustomerName !== "-" ? 
            `<div class="customer-old">${oldCustomerName}</div>` : 
            `<span class="no-customer">-</span>`
          }
        </td>
        <td>
          ${newCustomerName && newCustomerName !== "-" ? 
            `<div class="customer-new">${newCustomerName}</div>` : 
            `<span class="no-customer">-</span>`
          }
        </td>
        <td>
          <span class="date-badge" title="${actionDate ? actionDate.toLocaleDateString('en-US') : ''}">
            ${formattedActionDate}
          </span>
        </td>
        <td class="notes-cell">${notesDisplay}</td>
      </tr>
    `;
  };

exportToWord = async (orders, selectedCustomerName, customersList, toast) => {
  if (orders.length === 0) {
    toast.error("لا توجد بيانات للتصدير");
    return;
  }

  const currentDate = new Date();
  const formattedReportDate = currentDate.toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedReportTime = currentDate.toLocaleTimeString('ar-EG');

  const logoBase64 = await this.getLogoBase64();

  const wordContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>تقرير طلبات العميل</title>
      <style>
        ${this.getBulkPDFStyles('word').replace(
          'background: linear-gradient(135deg, #3a2f1a 0%, #D5A225 100%); color: Black;',
          'background: linear-gradient(135deg, #3a2f1a 0%, #D5A225 100%); color: Black;'
        ).replace(
          'background: linear-gradient(135deg, #3a2f1a 0%, #D5A225 100%); color: Black;',
          'background: linear-gradient(135deg, #3a2f1a 0%, #D5A225 100%); color: Black;'
        )}

        /* Word لا يقرأ @page size من داخل @media print - يحتاج تعريف
           WordSection الخاص به ليفتح الملف بوضع أفقي مباشرة. */
        @page WordSection1 {
          size: 21cm 29.7cm;
          mso-page-orientation: portrait;
          margin: 1cm 1cm 1cm 1cm;
        }
        div.WordSection1 { page: WordSection1; }
        .workshop-table { mso-table-layout-alt: fixed; }
        .region-header td { background: #1e293b !important; color: #fff !important; }
      </style>
    </head>
    <body>
      <div class="WordSection1">
      ${sacLetterheadWatermark({ mode: "word" })}
      <div class="header">
        <div class="logo-container">
          ${logoBase64 ? `<img src="${logoBase64}" alt="الشركة السورية للإعلان" class="logo">` : '<div class="logo-placeholder">الشعار</div>'}
        </div>
        <div class="header-content">
          <h1>تقرير طلبات العميل</h1>
          <div style="font-size: 14px; opacity: 0.9; margin-top: 5px;">
            ${formattedReportDate}
          </div>
          <div style="font-size: 12px; opacity: 0.8; margin-top: 3px;">
            الساعة: ${formattedReportTime}
          </div>
        </div>
      </div>
      
      <div class="filter-info">
        <h3 style="color: #0ea5e9; margin-bottom: 15px; margin-top: 0;">معلومات التصفية</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
          <div>
            <strong>العميل المحدد:</strong><br>
            <span style="font-size: 14px; color: Black;">${selectedCustomerName}</span>
          </div>
          <div>
            <strong>حجم العمل:</strong><br>
            <span style="font-size: 14px; color: Black;">${this.getWorkshopStats(orders).boards} لوحة في ${this.getWorkshopStats(orders).lines} سطر (${this.getWorkshopStats(orders).regions} منطقة)</span>
          </div>
          <div>
            <strong>تاريخ التقرير:</strong><br>
            <span style="font-size: 14px; color: Black;">${formattedReportDate}</span>
          </div>
          <div>
            <strong>وقت التقرير:</strong><br>
            <span style="font-size: 14px; color: Black;">${formattedReportTime}</span>
          </div>
        </div>
      </div>
      
      ${this.getWorkshopRegionIndex(orders)}

      ${this.getWorkshopTable(orders, { forWord: true })}
      
      <div class="footer">
        <div style="margin-bottom: 20px;">
          <div style="background: #f8fafc; padding: 12px; border-radius: 8px; display: inline-block;">
            <strong>ملخص التقرير:</strong>
            <div style="margin-top: 10px; display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; font-size: 12px;">
              <div>إجمالي اللوحات: <strong>${this.getWorkshopStats(orders).boards}</strong></div>
            <div>عدد الأسطر: <strong>${this.getWorkshopStats(orders).lines}</strong></div>
            <div>عدد المناطق: <strong>${this.getWorkshopStats(orders).regions}</strong></div>
              <div>تاريخ الإنشاء: <strong>${formattedReportDate}</strong></div>
              <div>وقت الإنشاء: <strong>${formattedReportTime}</strong></div>
            </div>
          </div>
        </div>
        <p>تم إنشاء هذا التقرير تلقائياً من نظام إدارة الطلبات</p>
        <p>تاريخ التقرير: ${formattedReportDate} - الساعة: ${formattedReportTime}</p>
        <p>© ${new Date().getFullYear()} جميع الحقوق محفوظة</p>
      </div>
      ${sacLetterheadFooter({ mode: "word" })}
      </div>
    </body>
    </html>
  `;
  
  const blob = new Blob([wordContent], { type: 'application/msword' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `طلبات_${selectedCustomerName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.doc`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  toast.success("تم تحميل ملف Word بنجاح");
};

  openPrintWindow = (content, toast) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      toast.info("جاري فتح نافذة الطباعة... يمكنك اختيار 'حفظ كـ PDF' من خيارات الطباعة");
    }
  };
}

export default OrderExportService;