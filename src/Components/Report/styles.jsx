export const detailsPDFStyles = {
  body: `
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
      border-bottom: 3px solid {activeTab === "available" ? '#4CAF50' : '#F44336'};
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
      background: {activeTab === "available" ? '#E8F5E9' : '#FFEBEE'};
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      border-right: 4px solid {activeTab === "available" ? '#4CAF50' : '#F44336'};
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
      background: {activeTab === "available" ? '#4CAF50' : '#F44336'};
      color: white;
      font-weight: bold;
      padding: 10px 8px;
      text-align: center;
      border: 1px solid #ddd;
      font-size: 15px;
    }
    
    .print-table td {
      padding: 8px 6px;
      text-align: center;
      border: 1px solid #ddd;
      line-height: 1.6;
    }
    
    .print-table tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    
    .group-highlight {
      background-color: {activeTab === "available" ? '#F1F8E9' : '#FFEBEE'} !important;
      border-left: 3px solid {activeTab === "available" ? '#4CAF50' : '#F44336'};
      border-right: 3px solid {activeTab === "available" ? '#4CAF50' : '#F44336'};
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
      background: {activeTab === "available" ? '#E8F5E9' : '#FFEBEE'};
      border-radius: 8px;
      border-right: 4px solid {activeTab === "available" ? '#4CAF50' : '#F44336'};
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
      padding-top: 20px;
      border-top: 1px solid #ddd;
      color: #666;
      font-size: 13px;
    }
    
    .generation-time {
      font-size: 10px;
      color: #999;
      margin-top: 10px;
    }
  `,
  
  mediaPrint: `
    @media print {
      @page {
        size: A4;
        margin: 15mm;
      }
      body {
        font-size: 12px;
      }
      .customer-section {
        page-break-inside: avoid;
      }
      .print-table {
        font-size: 11px;
      }
    }
  `
};

export const weeklyPDFStyles = {
  body: `
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap');
    
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
    
    .sum-cell {
      font-weight: bold;
      color: #6a1b9a;
      background: #f3e5f5;
      border-radius: 4px;
      padding: 4px 8px;
      display: inline-block;
      min-width: 60px;
      border: 1px solid #8e24aa;
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
    
    .template-usage-summary {
      background: linear-gradient(135deg, #f5f5f5, #e0e0e0);
      padding: 15px;
      margin-top: 20px;
      border-radius: 8px;
      border-left: 4px solid #4a6baf;
    }
    
    .template-usage-title {
      font-size: 14px;
      font-weight: bold;
      color: #1a237e;
      margin-bottom: 10px;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .template-usage-title::before {
      content: "📋";
      font-size: 16px;
    }
    
    .template-usage-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 10px;
      margin-top: 10px;
    }
    
    .template-item {
      background: white;
      padding: 8px 12px;
      border-radius: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      font-size: 10px;
    }
    
    .template-name {
      font-weight: 500;
      color: #333;
      flex: 1;
      text-align: right;
    }
    
    .template-count {
      background: #e3f2fd;
      color: #1565c0;
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: bold;
      min-width: 40px;
      text-align: center;
      margin-right: 8px;
    }
    
    .template-area {
      background: #e8f5e9;
      color: #2e7d32;
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: bold;
      min-width: 50px;
      text-align: center;
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
    
    .badge-sum {
      background: linear-gradient(135deg, #8e24aa, #6a1b9a);
      color: white;
      font-size: 12px;
      padding: 6px 12px;
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
  `,
  
  mediaPrint: `
    @media print {
      @page {
        size: A4 landscape;
        margin: 15mm;
      }
      body {
        font-size: 11px;
      }
      .customer-section {
        page-break-inside: avoid;
      }
    }
  `
};