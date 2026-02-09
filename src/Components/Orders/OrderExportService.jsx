import Logo from "../../assets/images/adv_syrian.png";

class OrderExportService {
  getLogoBase64 = async () => {
    try {
      const response = await fetch(Logo);
      const blob = await response.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.log("Could not load logo, using placeholder");
      return '';
    }
  };

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
      border-bottom: 3px solid #4f46e5;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
      color: #4f46e5;
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
      color: #4f46e5;
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
  `;

  getIndividualPDFBody = (order, logoBase64) => `
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
      <h3 style="color: #4f46e5; margin-bottom: 20px; display:flex; align-items: center; gap: 10px;">📋 تفاصيل الطلب</h3>
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
        <h3 style="color: #4f46e5; margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">📝 الملاحظات</h3>
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

  getBulkPDFStyles = () => `
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
      border-bottom: 3px solid #4f46e5;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
      background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
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
    @media print {
      .no-print {
        display: none;
      }
      .page-break {
        page-break-before: always;
      }
    }
  `;

  getBulkPDFBody = (orders, selectedCustomerName, customersList, logoBase64, formattedReportDate, formattedReportTime) => `
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
          <strong>عدد الطلبات:</strong><br>
          <span style="font-size: 14px; color: #1e293b;">${orders.length}</span>
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
    
    <table cellspacing="0" cellpadding="0">
      <thead>
        <tr>
          <th style="width: 60px;">النموذج</th>
          <th style="width: 50px;">عدد الأوجه</th>
          <th style="width: 70px;">المنطقة</th>
          <th style="width: 100px;">الاتجاه</th>
          <th style="width: 120px;">فك (المعلن القديم)</th>
          <th style="width: 120px;">تركيب (المعلن الجديد)</th>
          <th style="width: 80px;">تاريخ الفك/التركيب</th>
          <th style="width: 90px;">الملاحظات</th>
        </tr>
      </thead>
      <tbody>
        ${orders.map((order, index) => this.getOrderRow(order, index)).join('')}
      </tbody>
    </table>
    
    <div class="footer">
      <div style="margin-bottom: 20px;">
        <div style="background: #f8fafc; padding: 12px; border-radius: 8px; display: inline-block;">
          <strong>ملخص التقرير:</strong>
          <div style="margin-top: 10px; display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; font-size: 12px;">
            <div>عدد الطلبات: <strong>${orders.length}</strong></div>
            <div>تاريخ الإنشاء: <strong>${formattedReportDate}</strong></div>
            <div>وقت الإنشاء: <strong>${formattedReportTime}</strong></div>
          </div>
        </div>
      </div>
      <p>تم إنشاء هذا التقرير تلقائياً من نظام إدارة الطلبات</p>
      <p>تاريخ التقرير: ${formattedReportDate} - الساعة: ${formattedReportTime}</p>
      <p>© ${new Date().getFullYear()} جميع الحقوق محفوظة</p>
    </div>
    
    <script>
      window.onload = function() {
        window.print();
        setTimeout(() => {
          window.close();
        }, 1000);
      };
    </script>
  `;

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
        ${this.getBulkPDFStyles().replace(
          'background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); color: Black;',
          'background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); color: Black;'
        ).replace(
          'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: Black;',
          'background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); color: Black;'
        )}
      </style>
    </head>
    <body>
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
            <strong>عدد الطلبات:</strong><br>
            <span style="font-size: 14px; color: Black;">${orders.length}</span>
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
      
      <table cellspacing="0" cellpadding="0">
  <thead>
    <tr>
      <th style="width: 60px; background: black; color: white; border: 1px solid white;">النموذج</th>
      <th style="width: 50px; background: black; color: white; border: 1px solid white;">عدد الأوجه</th>
      <th style="width: 70px; background: black; color: white; border: 1px solid white;">المنطقة</th>
      <th style="width: 100px; background: black; color: white; border: 1px solid white;">الاتجاه</th>
      <th style="width: 120px; background: black; color: white; border: 1px solid white;">فك (المعلن القديم)</th>
      <th style="width: 120px; background: black; color: white; border: 1px solid white;">تركيب (المعلن الجديد)</th>
      <th style="width: 80px; background: black; color: white; border: 1px solid white;">تاريخ الفك/التركيب</th>
      <th style="width: 90px; background: black; color: white; border: 1px solid white;">الملاحظات</th>
    </tr>
  </thead>
        <tbody>
          ${orders.map((order, index) => this.getOrderRow(order, index)).join('')}
        </tbody>
      </table>
      
      <div class="footer">
        <div style="margin-bottom: 20px;">
          <div style="background: #f8fafc; padding: 12px; border-radius: 8px; display: inline-block;">
            <strong>ملخص التقرير:</strong>
            <div style="margin-top: 10px; display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; font-size: 12px;">
              <div>عدد الطلبات: <strong>${orders.length}</strong></div>
              <div>تاريخ الإنشاء: <strong>${formattedReportDate}</strong></div>
              <div>وقت الإنشاء: <strong>${formattedReportTime}</strong></div>
            </div>
          </div>
        </div>
        <p>تم إنشاء هذا التقرير تلقائياً من نظام إدارة الطلبات</p>
        <p>تاريخ التقرير: ${formattedReportDate} - الساعة: ${formattedReportTime}</p>
        <p>© ${new Date().getFullYear()} جميع الحقوق محفوظة</p>
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