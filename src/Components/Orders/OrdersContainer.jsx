import { DynamicTable } from "../../utils/Tables/DynamicTable";
import { OrderFieldsShow } from "../../utils/Dialogs/Data/Show/OrderFieldsShow";
import DialogShow from "../../utils/Dialogs/DialogShow/DialogShow";
import { OrdersColumns } from "../../utils/Tables/ColumnsTable/OrdersColumns";
import { DeleteDialog } from "../../utils/Dialogs/DeleteDialog/DeleteDialog";
import { DialogEditOrders } from "../../utils/Dialogs/EditAddDialog/Edit/DialogEditOrders";
import { Loader, Eye, Download, Printer, ShoppingCart, MapPin, Building, User, DownloadCloud, FileText, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HistoryOrdersColumns } from "../../utils/Tables/ColumnsTable/HistoryOrdersColumns";
import useMangeOrders from "../../hooks/useMangeOrders";
import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useGetCustomersQuery } from "../../RtkQuery/Slice/Customers/CustomersApi"
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

// Import logo
import Logo from "../../assets/images/adv_syrian.png";

const OrdersContainer = () => {
  const {
    setActiveTab,
    orderType,
    setOrderType,
    cityId,
    setCityId,
    regionId,
    setRegionId,
    actionDate,
    setActionDate,
    regions,
    cities,
    isCitiesLoading,
    data,
    isLoading,
    isFetching,
    history,
    isFetchingHistory,
    iLoadingConfirm,
    openShow,
    setOpenShow,
    openConfirm,
    setOpenConfirm,
    openEdit,
    setOpenEdit,
    isConfirmAction,
    selectedOrder,
    setSelectedOrder,
    handleEdit,
    handleShow,
    handleConfirmOrUnconfirm,
    onConfirmOrder,
    permission,
  } = useMangeOrders();

  const { data: customersList = [], isLoading: isLoadingCustomers } = useGetCustomersQuery();
  
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [unreadOrdersCount, setUnreadOrdersCount] = useState(0);
  const [viewedOrderIds, setViewedOrderIds] = useState(new Set());
  const [selectedCustomerIdHistory, setSelectedCustomerIdHistory] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    if (data && Array.isArray(data)) {
      const activeOrders = data.filter(order => order.status == 0);
      const unreadOrders = activeOrders.filter(order => !viewedOrderIds.has(order.id));
      setUnreadOrdersCount(unreadOrders.length);
    }
  }, [data, viewedOrderIds]);

 const enhancedOrdersColumns = useMemo(() => [
  {
    header: "اسم الشركة",
    accessor: "customer.company_name",
    prefixIcon: "mdi:office-building",
    className: "min-w-[150px]",
    priority: 3,
    format: (value, row) => (
      <div className="flex flex-col">
        <span className="font-medium">{value || "غير متوفر"}</span>
        {row.customer_new?.company_name && (
          <span className="text-xs text-green-600 font-semibold mt-1">
            ← {row.customer_new.company_name}
          </span>
        )}
      </div>
    ),
  },
  {
    header: "المدينة",
    accessor: "road_sign.city.name",
    format: (value) => (
      <Badge variant="outline">
        {value || "غير محدد"}
      </Badge>
    ),
    className: "min-w-[120px]",
    priority: 2,
  },
  {
    header: "التموضع",
    accessor: "road_sign.region.name",
    prefixIcon: "mdi:map-marker",
    format: (value) => (
      <span className="text-sm text-gray-600">{value || "غير محددة"}</span>
    ),
    className: "min-w-[130px]",
    priority: 2,
  },
  {
    header: "القالب",
    accessor: "road_sign.roadsign_code",
    format: (value) => (
      <Badge variant="outline" >
        {value || "غير محدد"}
      </Badge>
    ),
    className: "min-w-[100px]",
    priority: 3,
  },
  
  {
    header: "الاتجاه",
    accessor: "road_sign.directions",
    format: (value) => (
      <span className="text-sm text-gray-500 line-clamp-2" title={value}>
        {value || "غير محددة"}
      </span>
    ),
    className: "min-w-[150px] max-w-[200px]",
    priority: 5,
  },
  {
    header: "المكان",
    accessor: "road_sign.place",
    
    format: (value) => (
      <span className="text-sm text-gray-500 line-clamp-2" title={value}>
        {value || "غير محدد"}
      </span>
    ),
    className: "min-w-[150px] max-w-[200px]",
    priority: 6,
  },
 
  {
    header: "نوع الطلب",
    accessor: "type",
    format: (value) => {
      const typeText = value === 1 ? "فك" : value === 2 ? "تركيب" : "فك و تركيب";
      const colorClass = value === 1 
        ? "bg-red-100 text-red-800 border border-red-300 font-bold px-3 py-1 rounded-lg" 
        : value === 2 
        ? "bg-green-100 text-green-800 border border-green-300 font-bold px-3 py-1 rounded-lg"
        : "bg-blue-100 text-blue-800 border border-blue-300 font-bold px-3 py-1 rounded-lg";
      
      return (
        <span className={`text-sm ${colorClass}`}>
          {typeText}
        </span>
      );
    },
    className: "min-w-[100px]",
    priority: 8,
  },
  {
    header: "تاريخ الفك أو التركيب",
    accessor: "action_date",
    prefixIcon: "mdi:calendar",
    format: (value) => (
      <div className="flex flex-col">
        <span className="font-medium">{new Date(value).toLocaleDateString("ar-EG")}</span>
        <span className="text-xs text-gray-500">
          {new Date(value).toLocaleDateString("en-US")}
        </span>
      </div>
    ),
    className: "min-w-[120px] font-medium",
    priority: 9,
  },
  {
    header: "الملاحظة",
    accessor: "notes",
    prefixIcon: "mdi:note-text",
    format: (value) => (
      <span className={`text-sm ${value ? 'text-gray-700' : 'text-gray-400 italic'}`}>
        {value || "لا يوجد"}
      </span>
    ),
    className: "min-w-[100px]",
    priority: 10,
  },
  {
    header: "الحالة",
    accessor: "status",
    prefixIcon: "mdi:traffic-light",
    format: (value) => (
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${value === 0 ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
        <span className={`font-bold ${value === 0 ? "text-yellow-600" : "text-green-600"}`}>
          {value === 0 ? "جاري العمل" : "تمت العملية"}
        </span>
      </div>
    ),
    className: "min-w-[100px]",
    priority: 11,
  },
  {
    header: "مشاهدة الاجرائات",
    accessor: "actions",
    prefixIcon: "mdi:cog",
    format: (_, row) => (
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleViewDetails(row);
          }}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors relative group"
          title="عرض التفاصيل"
        >
          <Eye className="w-4 h-4" />
          {!viewedOrderIds.has(row.id) && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
          )}
        </button>
        

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDownloadIndividualPDF(row);
          }}
          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          title="تحميل PDF فردي"
        >
          <DownloadCloud className="w-4 h-4" />
        </button>
      </div>
    ),
    className: "min-w-[120px]",
    priority: 12,
  },
], [viewedOrderIds]);

  const handleViewDetails = (order) => {
    if (!viewedOrderIds.has(order.id)) {
      setViewedOrderIds(prev => new Set([...prev, order.id]));
      setUnreadOrdersCount(prev => Math.max(0, prev - 1));
    }
    
    setSelectedOrder(order);
    setOpenShow(true);
  };

  const getLogoBase64 = async () => {
    try {
      // Try to fetch the logo
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

  const handleDownloadIndividualPDF = async (order) => {
    if (!order) {
      toast.error("لا يوجد بيانات للطلب");
      return;
    }

    toast.info("جاري إنشاء ملف PDF فردي...");

    const logoBase64 = await getLogoBase64();

    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تفاصيل الطلب #${order.id}</title>
        <style>
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
        </style>
      </head>
      <body>
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
              <div class="location-label">القالب:</div>
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
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      toast.info("جاري فتح نافذة الطباعة... يمكنك اختيار 'حفظ كـ PDF' من خيارات الطباعة");
    }
  };

  const generatePDFViaPrint = async () => {
  if (sortedData.length === 0) {
    toast.error("لا توجد بيانات للتصدير");
    return;
  }

  const selectedCustomerName = selectedCustomerId 
    ? customersList.find(c => c.id.toString() === selectedCustomerId.toString())?.company_name || 'عميل'
    : 'جميع العملاء';

  const uniqueCustomers = {};
  sortedData.forEach(order => {
    if (order.customer?.id) {
      uniqueCustomers[order.customer.id] = order.customer;
    }
    if (order.customer_new?.id) {
      uniqueCustomers[order.customer_new.id] = order.customer_new;
    }
  });

  const logoBase64 = await getLogoBase64();

  const printContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>تقرير طلبات العميل</title>
      <style>
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
          font-size: 13px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          overflow: hidden;
        }
        th {
          background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
          color: white;
          padding: 12px 8px;
          text-align: center;
          font-weight: bold;
          border: none;
          font-size: 14px;
        }
        td {
          padding: 10px 8px;
          text-align: center;
          border-bottom: 1px solid #e5e7eb;
          border-right: 1px solid #e5e7eb;
          vertical-align: top;
        }
        td:last-child {
          border-right: none;
        }
        tr:nth-child(even) {
          background-color: #f8fafc;
        }
        .badge {
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
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
        .date-cell {
          min-width: 110px;
          text-align: center;
        }
        .date-display {
          background: #dbeafe;
          padding: 6px 8px;
          border-radius: 6px;
          color: #1e40af;
          font-weight: 600;
          font-size: 12px;
          display: block;
        }
        .date-english {
          font-size: 10px;
          color: #4b5563;
          margin-top: 2px;
        }
        .notes-cell {
          min-width: 150px;
          max-width: 250px;
          text-align: right;
        }
        .notes-display {
          background: #fef3c7;
          border: 1px solid #fbbf24;
          border-radius: 6px;
          padding: 8px 10px;
          font-size: 11px;
          color: #92400e;
          line-height: 1.4;
          text-align: right;
          display: block;
          word-wrap: break-word;
          max-height: 100px;
          overflow-y: auto;
        }
        .no-notes {
          color: #9ca3af;
          font-style: italic;
          font-size: 11px;
        }
        .customer-cell {
          text-align: right;
          min-width: 120px;
        }
        .customer-name {
          font-weight: 600;
          color: #1e293b;
          font-size: 12px;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          color: #64748b;
          font-size: 14px;
        }
        @media print {
          .no-print {
            display: none;
          }
          .page-break {
            page-break-before: always;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-container">
          ${logoBase64 ? `<img src="${logoBase64}" alt="الشركة السورية للإعلان" class="logo">` : '<div class="logo-placeholder">الشعار</div>'}
        </div>
        <div class="header-content">
          <h1>تقرير طلبات العميل</h1>
          <div style="font-size: 16px; opacity: 0.9;">
            ${new Date().toLocaleDateString('ar-EG')} - ${new Date().toLocaleTimeString('ar-EG')}
          </div>
        </div>
      </div>
      
      <div class="filter-info">
        <h3 style="color: #0ea5e9; margin-bottom: 15px; margin-top: 0;">معلومات التصفية</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
          <div>
            <strong>العميل المحدد:</strong><br>
            <span style="font-size: 16px; color: #1e293b;">${selectedCustomerName}</span>
          </div>
          <div>
            <strong>عدد الطلبات:</strong><br>
            <span style="font-size: 16px; color: #1e293b;">${sortedData.length}</span>
          </div>
          <div>
            <strong>تاريخ التقرير:</strong><br>
            <span style="font-size: 16px; color: #1e293b;">${new Date().toLocaleDateString('ar-EG')}</span>
          </div>
        </div>
      </div>
      
      <table cellspacing="0" cellpadding="0">
        <thead>
          <tr>
            <th style="width: 120px;">اسم الشركة</th>
            <th style="width: 80px;">المدينة</th>
            <th style="width: 80px;">المنطقة</th>
            <th style="width: 80px;">كود اللوحة</th>
            <th style="width: 80px;">المكان</th>
            <th style="width: 100px;">الاتجاه</th>
            <th style="width: 70px;">نوع الطلب</th>
            <th style="width: 110px;">تاريخ العملية</th>
            <th style="width: 150px;">الملاحظات</th>
          </tr>
        </thead>
        <tbody>
          ${sortedData.map((order, index) => {
            const typeText = order.type === 1 ? "فك" : order.type === 2 ? "تركيب" : "فك و تركيب";
            const typeClass = order.type === 1 ? "release" : order.type === 2 ? "install" : "both";
            
            // Format the date - FIXED: Use action_date directly
            const actionDate = order.action_date ? new Date(order.action_date) : null;
            const dateDisplay = actionDate ? 
              `<div class="date-display">
                ${actionDate.toLocaleDateString('ar-EG')}
                <div class="date-english">${actionDate.toLocaleDateString('en-US')}</div>
              </div>` : 
              '<span class="no-notes">-</span>';
            
            // Format notes - FIXED: Use order.notes directly
            const notes = order.notes || "";
            const notesDisplay = notes ? 
              `<div class="notes-display">${notes}</div>` : 
              '<span class="no-notes">لا توجد ملاحظات</span>';
            
            return `
              <tr ${index > 0 && index % 20 === 0 ? 'class="page-break"' : ''}>
                <td class="customer-cell">
                  <div class="customer-name">
                    ${order.customer?.company_name || order.customer_new?.company_name || 'غير متوفر'}
                  </div>
                </td>
                <td>${order.road_sign?.city?.name || 'غير محدد'}</td>
                <td>${order.road_sign?.region?.name || 'غير محددة'}</td>
                <td>${order.road_sign?.roadsign_code || 'غير محدد'}</td>
                <td>${order.road_sign?.place || 'غير محدد'}</td>
                <td>${order.road_sign?.directions || 'غير محددة'}</td>
                <td><span class="badge badge-${typeClass}">${typeText}</span></td>
                <td class="date-cell">${dateDisplay}</td>
                <td class="notes-cell">${notesDisplay}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      
      <div class="footer">
        <div style="margin-bottom: 20px;">
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; display: inline-block;">
            <strong>ملخص التقرير:</strong>
            <div style="margin-top: 10px; display: flex; gap: 20px; justify-content: center; flex-wrap: wrap;">
              <div>عدد الطلبات: <strong>${sortedData.length}</strong></div>
              <div>تاريخ الإنشاء: <strong>${new Date().toLocaleDateString('ar-EG')}</strong></div>
            </div>
          </div>
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
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    toast.info("جاري فتح نافذة الطباعة... يمكنك اختيار 'حفظ كـ PDF' من خيارات الطباعة");
  }
};

  const exportToWord = async () => {
    if (sortedData.length === 0) {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }

    const selectedCustomerName = selectedCustomerId 
      ? customersList.find(c => c.id.toString() === selectedCustomerId.toString())?.company_name || 'عميل'
      : 'جميع العملاء';

    const uniqueCustomers = {};
    sortedData.forEach(order => {
      if (order.customer?.id) {
        uniqueCustomers[order.customer.id] = order.customer;
      }
      if (order.customer_new?.id) {
        uniqueCustomers[order.customer_new.id] = order.customer_new;
      }
    });

    const logoBase64 = await getLogoBase64();

    const wordContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تقرير طلبات العميل</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 40px;
            padding: 20px;
            color: #333;
            direction: rtl;
            background-color: #fff;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #4f46e5;
            background-color: #f8fafc;
            padding: 30px;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
          }
          .logo-container {
            flex-shrink: 0;
            margin-left: 20px;
          }
          .logo {
            width: 100px;
            height: auto;
            max-height: 60px;
            border-radius: 4px;
          }
          .logo-placeholder {
            width: 100px;
            height: 60px;
            background-color: #1e40af;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 12px;
            border-radius: 4px;
          }
          .header-content {
            flex: 1;
            text-align: right;
          }
          .header h1 {
            margin: 0 0 15px 0;
            font-size: 32px;
            color: #1e293b;
            font-weight: bold;
          }
          .report-info {
            background-color: #f0f9ff;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-right: 4px solid #0ea5e9;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }
          .info-item {
            background: white;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          }
          .info-label {
            font-weight: bold;
            color: #64748b;
            margin-bottom: 5px;
            font-size: 14px;
          }
          .info-value {
            color: #1e293b;
            font-size: 16px;
            font-weight: 600;
          }
          .stats {
            display: flex;
            justify-content: space-around;
            margin: 30px 0;
            flex-wrap: wrap;
            gap: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
          }
          .stat-item {
            text-align: center;
            flex: 1;
            min-width: 150px;
          }
          .stat-number {
            font-size: 36px;
            font-weight: bold;
            margin-bottom: 10px;
            color: white;
          }
          .stat-label {
            color: rgba(255, 255, 255, 0.9);
            font-size: 16px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
            font-size: 14px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
          }
          th {
            background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
            color: white;
            padding: 15px;
            text-align: center;
            font-weight: bold;
            border: none;
            font-size: 15px;
          }
          td {
            padding: 12px 15px;
            text-align: center;
            border-bottom: 1px solid #e2e8f0;
            border-right: 1px solid #e2e8f0;
          }
          td:last-child {
            border-right: none;
          }
          tr {
            transition: background-color 0.2s;
          }
          tr:hover {
            background-color: #f8fafc;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .badge {
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: bold;
            display: inline-block;
            min-width: 70px;
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
          .badge-city { 
            background-color: #e0f2fe; 
            color: #0284c7; 
            border: 1px solid #bae6fd;
          }
          .badge-region { 
            background-color: #f0f9ff; 
            color: #0ea5e9; 
            border: 1px solid #7dd3fc;
          }
          .badge-place { 
            background-color: #fef3c7; 
            color: #d97706; 
            border: 1px solid #fde68a;
          }
          .badge-roadsign { 
            background-color: #fef3c7; 
            color: #d97706; 
            border: 1px solid #fde68a;
            font-weight: bold;
          }
          .badge-direction { 
            background-color: #e0f2fe; 
            color: #2563eb; 
            border: 1px solid #93c5fd;
            font-weight: bold;
          }
          .customer-name {
            font-weight: 600;
            color: #1e293b;
            text-align: right;
            padding-right: 20px;
          }
          .new-customer {
            color: #10b981;
            font-size: 12px;
            margin-top: 5px;
            font-weight: 600;
          }
          .footer {
            text-align: center;
            margin-top: 50px;
            padding-top: 30px;
            border-top: 2px solid #e2e8f0;
            color: #64748b;
            font-size: 14px;
            background-color: #f8fafc;
            padding: 30px;
            border-radius: 10px;
          }
          .summary-box {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .summary-title {
            color: #4f46e5;
            font-size: 18px;
            margin-bottom: 15px;
            font-weight: bold;
          }
          .summary-content {
            display: flex;
            justify-content: space-around;
            flex-wrap: wrap;
            gap: 20px;
          }
          .summary-item {
            text-align: center;
          }
          .summary-number {
            font-size: 24px;
            font-weight: bold;
            color: #4f46e5;
            margin-bottom: 5px;
          }
          .summary-label {
            color: #64748b;
            font-size: 14px;
          }
          .timestamp {
            background-color: #1e293b;
            color: white;
            padding: 10px 20px;
            border-radius: 6px;
            display: inline-block;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-container">
            ${logoBase64 ? `<img src="${logoBase64}" alt="الشركة السورية للإعلان" class="logo">` : '<div class="logo-placeholder">الشعار</div>'}
          </div>
          <div class="header-content">
            <h1>📋 تقرير طلبات العميل</h1>
            <div class="timestamp">
              تم إنشاء التقرير في: ${new Date().toLocaleDateString('ar-EG')} الساعة ${new Date().toLocaleTimeString('ar-EG')}
            </div>
            <p style="color: #64748b; font-size: 16px; margin-top: 10px;">
              هذا التقرير يحتوي على تفاصيل الطلبات النشطة للعميل المحدد
            </p>
          </div>
        </div>
        
        <div class="report-info">
          <h2 style="color: #0ea5e9; margin-bottom: 20px; margin-top: 0;">معلومات التقرير</h2>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">العميل المحدد:</div>
              <div class="info-value">${selectedCustomerName}</div>
            </div>
            <div class="info-item">
              <div class="info-label">عدد الطلبات:</div>
              <div class="info-value">${sortedData.length}</div>
            </div>
            <div class="info-item">
              <div class="info-label">نوع التقرير:</div>
              <div class="info-value">الطلبات النشطة (جاري العمل)</div>
            </div>
            <div class="info-item">
              <div class="info-label">تاريخ التقرير:</div>
              <div class="info-value">${new Date().toLocaleDateString('ar-EG')}</div>
            </div>
          </div>
        </div>
        
        <div class="stats">
          <div class="stat-item">
            <div class="stat-number">${sortedData.length}</div>
            <div class="stat-label">إجمالي الطلبات</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${Object.keys(uniqueCustomers).length}</div>
            <div class="stat-label">عدد العملاء</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${sortedData.filter(order => order.type === 2).length}</div>
            <div class="stat-label">طلبات تركيب</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${sortedData.filter(order => order.type === 1).length}</div>
            <div class="stat-label">طلبات فك</div>
          </div>
        </div>
        
        <h2 style="color: #4f46e5; margin-bottom: 20px; text-align: center; font-size: 24px;">📋 قائمة الطلبات</h2>
        
        <table>
          <thead>
            <tr>
              <th>اسم الشركة</th>
              <th>المدينة</th>
              <th>التموضع</th>
              <th>كود اللوحة</th>
              <th>رمز الاتجاه</th>
              <th>المكان (التموضع)</th>
              <th>الاتجاه</th>
              <th>نوع الطلب</th>
              <th>تاريخ العملية</th>
              <th>ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            ${sortedData.map((order) => {
              const typeText = order.type === 1 ? "فك" : order.type === 2 ? "تركيب" : "فك و تركيب";
              const typeClass = order.type === 1 ? "release" : order.type === 2 ? "install" : "both";
              
              return `
                <tr>
                  <td class="customer-name">
                    ${order.customer?.company_name || 'غير متوفر'}
                    ${order.customer_new?.company_name ? `
                      <div class="new-customer">← ${order.customer_new.company_name}</div>
                    ` : ''}
                  </td>
                  <td><span class="badge badge-city">${order.road_sign?.city?.name || 'غير محدد'}</span></td>
                  <td><span class="badge badge-region">${order.road_sign?.region?.name || 'غير محددة'}</span></td>
                  <td><span class="badge badge-roadsign">${order.road_sign?.roadsign_code || 'غير محدد'}</span></td>
                  <td><span class="badge badge-direction">${order.road_sign?.direction_code || 'غير محدد'}</span></td>
                  <td><span class="badge badge-place">${order.road_sign?.place || 'غير محدد'}</span></td>
                  <td>${order.road_sign?.directions || 'غير محددة'}</td>
                  <td><span class="badge badge-${typeClass}">${typeText}</span></td>
                  <td>${new Date(order.action_date).toLocaleDateString('ar-EG')}</td>
                  <td>${order.notes || '-'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <div style="margin-bottom: 20px;">
            <div style="background: white; padding: 20px; border-radius: 8px; display: inline-block; border: 1px solid #e2e8f0;">
              <strong style="color: #4f46e5;">📝 ملاحظات التقرير:</strong>
              <div style="margin-top: 15px; display: flex; gap: 30px; justify-content: center; flex-wrap: wrap;">
                <div>📅 تاريخ التقرير: <strong>${new Date().toLocaleDateString('ar-EG')}</strong></div>
                <div>👥 عدد العملاء: <strong>${Object.keys(uniqueCustomers).length}</strong></div>
                <div>📦 إجمالي الطلبات: <strong>${sortedData.length}</strong></div>
              </div>
            </div>
          </div>
          <p>تم إنشاء هذا التقرير تلقائياً من نظام إدارة الطلبات</p>
          <p>© ${new Date().getFullYear()} جميع الحقوق محفوظة</p>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 10px;">
            رقم التقرير: DOC-${Date.now()}-${sortedData.length}
          </p>
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

  const markAllOrdersAsRead = () => {
    if (data && Array.isArray(data)) {
      const activeOrders = data.filter(order => order.status == 0);
      const allOrderIds = new Set(activeOrders.map(order => order.id));
      setViewedOrderIds(allOrderIds);
      setUnreadOrdersCount(0);
      toast.success("تم تعليم جميع الطلبات كمقروءة");
    }
  };

  const sortedData = useMemo(() => {
    const today = new Date();
    let filteredData = Array.isArray(data) ? data.filter((order) => order.status == 0) : [];
    
    // Filter by customer
    if (selectedCustomerId) {
      filteredData = filteredData.filter(order => {
        if (order.customer_id && order.customer_id.toString() === selectedCustomerId.toString()) {
          return true;
        }
        
        if (order.customer && order.customer.id && order.customer.id.toString() === selectedCustomerId.toString()) {
          return true;
        }
        
        if (order.customer_new && order.customer_new.id && order.customer_new.id.toString() === selectedCustomerId.toString()) {
          return true;
        }
        
        return false;
      });
    }
    
    // Filter by date (تاريخ الفك أو التركيب)
    if (selectedDate) {
      filteredData = filteredData.filter(order => {
        const orderDate = new Date(order.action_date);
        const selected = new Date(selectedDate);
        
        // Compare only year, month, and day (ignore time)
        return orderDate.getFullYear() === selected.getFullYear() &&
               orderDate.getMonth() === selected.getMonth() &&
               orderDate.getDate() === selected.getDate();
      });
    }
    
    // Filter by city
    if (cityId) {
      filteredData = filteredData.filter(order => 
        order.road_sign?.city?.id?.toString() === cityId.toString()
      );
    }
    
    // Filter by region
    if (regionId) {
      filteredData = filteredData.filter(order => 
        order.road_sign?.region?.id?.toString() === regionId.toString()
      );
    }
    
    return [...filteredData].sort((a, b) => {
      const dateA = new Date(a.action_date);
      const dateB = new Date(b.action_date);
      const diffA = Math.abs(dateA - today);
      const diffB = Math.abs(dateB - today);
      return diffA - diffB;
    });
  }, [data, selectedCustomerId, selectedDate, cityId, regionId]);

  const sortedHistory = useMemo(() => {
    if (!history || !Array.isArray(history)) return [];
    
    let filteredHistory = [...history];
    
    if (selectedCustomerIdHistory) {
      filteredHistory = filteredHistory.filter(order => {
        if (order.customer_id && order.customer_id.toString() === selectedCustomerIdHistory.toString()) {
          return true;
        }
        
        if (order.customer && order.customer.id && order.customer.id.toString() === selectedCustomerIdHistory.toString()) {
          return true;
        }
        
        if (order.customer_new && order.customer_new.id && order.customer_new.id.toString() === selectedCustomerIdHistory.toString()) {
          return true;
        }
        
        return false;
      });
    }
    
    // Filter by city
    if (cityId) {
      filteredHistory = filteredHistory.filter(order => 
        order.road_sign?.city?.id?.toString() === cityId.toString()
      );
    }
    
    // Filter by region
    if (regionId) {
      filteredHistory = filteredHistory.filter(order => 
        order.road_sign?.region?.id?.toString() === regionId.toString()
      );
    }
    
    return filteredHistory.sort((a, b) => new Date(b.action_date) - new Date(a.action_date));
  }, [history, selectedCustomerIdHistory, cityId, regionId]);

  if (isLoading || isCitiesLoading) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center">
        <Loader />
        <p className="text-muted-foreground text-sm">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <>
      <Tabs
        defaultValue="orders"
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full overflow-auto grid-cols-2 justify-between flex bg-card rounded-lg border border-border">
          <TabsTrigger value="orders" className="text-sm font-medium relative">
            الطلبات (الأقرب أولاً)
            {unreadOrdersCount > 0 && (
              <div className="absolute -top-2 -right-2">
                <div className="relative">
                  <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></div>
                  <div className="relative inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 border-2 border-white rounded-full">
                    {unreadOrdersCount}
                  </div>
                </div>
              </div>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="text-sm font-medium">
            الأرشيف
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <div className="p-4 sm:p-6 max-w-full mx-auto space-y-6 bg-background rounded-lg shadow-sm dark:shadow-gray-800">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-foreground">
                  إدارة الطلبات
                </h2>
                
                {unreadOrdersCount > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <ShoppingCart className="h-6 w-6 text-blue-600" />
                      <div className="absolute -top-2 -right-2">
                        <div className="relative">
                          <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></div>
                          <div className="relative inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 border-2 border-white rounded-full">
                            {unreadOrdersCount}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={exportToWord}
                  disabled={sortedData.length === 0}
                  variant="outline"
                  className="flex items-center gap-2 bg-purple-50 border-purple-200 hover:bg-purple-100"
                >
                  <FileText className="w-4 h-4" />
                  تصدير Word
                </Button>
                <Button
                  onClick={generatePDFViaPrint}
                  disabled={sortedData.length === 0}
                  variant="outline"
                  className="flex items-center gap-2 bg-green-50 border-green-200 hover:bg-green-100"
                >
                  <Printer className="w-4 h-4" />
                  طباعة (pdf)
                </Button>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 p-4 rounded-lg border border-border mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-foreground">إحصائيات الطلبات</h3>
                  <p className="text-sm text-muted-foreground">الطلبات النشطة الحالية</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {sortedData.length}
                    </div>
                    <div className="text-sm text-muted-foreground">إجمالي الطلبات</div>
                  </div>
                  
                  {unreadOrdersCount > 0 && (
                    <div className="text-center">
                      <div className="relative">
                        <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                          {unreadOrdersCount}
                        </div>
                        <div className="text-sm text-muted-foreground">طلبات غير مقروءة</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="flex flex-col">
                <label className="mb-2 text-sm font-medium text-foreground">
                  تصفية بالعميل
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="p-2.5 border rounded-lg bg-card text-foreground text-sm shadow-sm focus:ring-2 focus:ring-primary focus:border-primary w-full disabled:bg-muted disabled:text-muted-foreground transition-colors duration-200"
                  disabled={isLoadingCustomers}
                >
                  <option value="">جميع العملاء</option>
                  {Array.isArray(customersList) && customersList.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.company_name || customer.name || `عميل #${customer.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="mb-2 text-sm font-medium text-foreground">
                  نوع الطلب
                </label>
                <div className="flex flex-wrap gap-4 bg-card p-4 rounded-lg shadow-sm border border-border">
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="radio"
                      name="orderType"
                      value=""
                      checked={!orderType}
                      onChange={() => setOrderType("")}
                      className="text-gray-500 focus:ring-gray-500 h-4 w-4 accent-gray-500"
                    />
                    <span className="text-gray-600 font-medium">فك وتركيب</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="radio"
                      name="orderType"
                      value="release"
                      checked={orderType === "release"}
                      onChange={(e) => setOrderType(e.target.value)}
                      className="text-red-500 focus:ring-red-500 h-4 w-4 accent-red-500"
                    />
                    <span className="text-red-600 font-medium">فك</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="radio"
                      name="orderType"
                      value="installation"
                      checked={orderType === "installation"}
                      onChange={(e) => setOrderType(e.target.value)}
                      className="text-green-500 focus:ring-green-500 h-4 w-4 accent-green-500"
                    />
                    <span className="text-green-600 font-medium">تركيب</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-foreground">
                   
                  </label>
                </div>
              </div>
              
              <div className="flex flex-col">
                <label className="mb-2 text-sm font-medium text-foreground">
                  تصفية بالتاريخ
                </label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="p-2.5 border rounded-lg bg-card text-foreground text-sm shadow-sm focus:ring-2 focus:ring-primary focus:border-primary w-full"
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="mb-2 text-sm font-medium text-foreground">
                  المدينة
                </label>
                <select
                  value={cityId}
                  onChange={(e) => setCityId(e.target.value)}
                  className="p-2.5 border rounded-lg bg-card text-foreground text-sm shadow-sm focus:ring-2 focus:ring-primary focus:border-primary w-full disabled:bg-muted disabled:text-muted-foreground transition-colors duration-200"
                >
                  <option value="">جميع المدن</option>
                  {Array.isArray(cities) && cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Region Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="flex flex-col">
                <label className="mb-2 text-sm font-medium text-foreground">
                  المنطقة (التموضع)
                </label>
                <select
                  value={regionId}
                  onChange={(e) => setRegionId(e.target.value)}
                  className="p-2.5 border rounded-lg bg-card text-foreground text-sm shadow-sm focus:ring-2 focus:ring-primary focus:border-primary w-full disabled:bg-muted disabled:text-muted-foreground transition-colors duration-200"
                  disabled={!regions || regions.length === 0}
                >
                  <option value="">جميع المناطق</option>
                  {Array.isArray(regions) && regions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedCustomerId && (
              <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 border border-blue-200 dark:border-gray-700 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Building className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          التصفية حسب العميل:
                        </span>
                        <span className="px-3 py-1 bg-white dark:bg-gray-800 border border-blue-100 dark:border-gray-700 rounded-md text-blue-700 dark:text-blue-300 font-semibold text-sm">
                          {customersList.find(c => c.id.toString() === selectedCustomerId.toString())?.company_name || selectedCustomerId}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-blue-500/10 dark:bg-blue-500/20 rounded-full text-blue-700 dark:text-blue-300 font-medium text-sm flex items-center gap-1">
                          <ShoppingCart className="w-4 h-4" />
                          {sortedData.length} طلب
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCustomerId("")}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    إزالة التصفية
                  </Button>
                </div>
              </div>
            )}

            {selectedDate && (
              <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 border border-green-200 dark:border-gray-700 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          التصفية حسب تاريخ الفك/التركيب:
                        </span>
                        <span className="px-3 py-1 bg-white dark:bg-gray-800 border border-green-100 dark:border-gray-700 rounded-md text-green-700 dark:text-green-300 font-semibold text-sm">
                          ${new Date(selectedDate).toLocaleDateString('ar-EG')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDate("")}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    إزالة التصفية
                  </Button>
                </div>
              </div>
            )}

            {cityId && (
              <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 border border-purple-200 dark:border-gray-700 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          التصفية حسب المدينة:
                        </span>
                        <span className="px-3 py-1 bg-white dark:bg-gray-800 border border-purple-100 dark:border-gray-700 rounded-md text-purple-700 dark:text-purple-300 font-semibold text-sm">
                          {cities.find(c => c.id.toString() === cityId.toString())?.name || cityId}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCityId("")}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    إزالة التصفية
                  </Button>
                </div>
              </div>
            )}

            {regionId && (
              <div className="mb-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 border border-amber-200 dark:border-gray-700 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                      <MapPin className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          التصفية حسب المنطقة:
                        </span>
                        <span className="px-3 py-1 bg-white dark:bg-gray-800 border border-amber-100 dark:border-gray-700 rounded-md text-amber-700 dark:text-amber-300 font-semibold text-sm">
                          {regions.find(r => r.id.toString() === regionId.toString())?.name || regionId}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRegionId("")}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    إزالة التصفية
                  </Button>
                </div>
              </div>
            )}

            <DynamicTable
              data={sortedData}
              columns={enhancedOrdersColumns}
              isLoading={isFetching}
              onEdit={handleEdit}
              onShow={handleShow}
              onConfirmOrder={onConfirmOrder}
              permissions={permission}
              className="bg-card rounded-lg shadow-sm border border-border w-full"
            />
            <DialogEditOrders
              show={openEdit}
              handleClose={() => setOpenEdit(false)}
              initData={selectedOrder}
            />
            <DialogShow
              show={openShow}
              handleClose={() => {
                setOpenShow(false);
                setSelectedOrder(null);
              }}
              data={selectedOrder}
              fields={OrderFieldsShow}
            />
            <DeleteDialog
              open={openConfirm}
              onClose={() => setOpenConfirm(false)}
              title={
                isConfirmAction
                  ? "عملية تأكيد الطلب"
                  : "عملية إلغاء تأكيد الطلب"
              }
              description={`هل تريد ${
                isConfirmAction ? "تأكيد" : "إلغاء تأكيد"
              } هذا الطلب؟`}
              confirmText="نعم"
              onConfirm={handleConfirmOrUnconfirm}
              loading={iLoadingConfirm}
              titleLoading={`  ${
                isConfirmAction ? "جاري التأكيد " : "جاري إلغاء تأكيد"
              }  `}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="history">
          <div className="p-4 sm:p-6 max-w-full mx-auto space-y-6 bg-background rounded-lg shadow-sm dark:shadow-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-foreground">أرشيف الطلبات</h2>
              <div className="text-sm text-muted-foreground">
                إجمالي الطلبات المؤرشفة : {sortedHistory.length}
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="flex flex-col">
                <label className="mb-2 text-sm font-medium text-foreground">
                  تصفية بالعميل
                </label>
                <select
                  value={selectedCustomerIdHistory}
                  onChange={(e) => setSelectedCustomerIdHistory(e.target.value)}
                  className="p-2.5 border rounded-lg bg-card text-foreground text-sm shadow-sm focus:ring-2 focus:ring-primary focus:border-primary w-full disabled:bg-muted disabled:text-muted-foreground transition-colors duration-200"
                  disabled={isLoadingCustomers}
                >
                  <option value="">جميع العملاء</option>
                  {Array.isArray(customersList) && customersList.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.company_name || customer.name || `عميل #${customer.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="mb-2 text-sm font-medium text-foreground">
                  نوع الطلب
                </label>
                <div className="flex flex-wrap gap-4 bg-card p-4 rounded-lg shadow-sm border border-border">
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="radio"
                      name="orderTypeHistory"
                      value=""
                      checked={!orderType}
                      onChange={() => setOrderType("")}
                      className="text-gray-500 focus:ring-gray-500 h-4 w-4 accent-gray-500"
                    />
                    <span className="text-gray-600 font-medium">فك وتركيب</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="radio"
                      name="orderTypeHistory"
                      value="release"
                      checked={orderType === "release"}
                      onChange={(e) => setOrderType(e.target.value)}
                      className="text-red-500 focus:ring-red-500 h-4 w-4 accent-red-500"
                    />
                    <span className="text-red-600 font-medium">فك</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="radio"
                      name="orderTypeHistory"
                      value="installation"
                      checked={orderType === "installation"}
                      onChange={(e) => setOrderType(e.target.value)}
                      className="text-green-500 focus:ring-green-500 h-4 w-4 accent-green-500"
                    />
                    <span className="text-green-600 font-medium">تركيب</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-foreground">
                  
                  </label>
                </div>
              </div>

              <div className="flex flex-col">
                <label className="mb-2 text-sm font-medium text-foreground">
                  تصفية بالتاريخ
                </label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="p-2.5 border rounded-lg bg-card text-foreground text-sm shadow-sm focus:ring-2 focus:ring-primary focus:border-primary w-full"
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="mb-2 text-sm font-medium text-foreground">
                  المدينة
                </label>
                <select
                  value={cityId}
                  onChange={(e) => setCityId(e.target.value)}
                  className="p-2.5 border rounded-lg bg-card text-foreground text-sm shadow-sm focus:ring-2 focus:ring-primary focus:border-primary w-full disabled:bg-muted disabled:text-muted-foreground transition-colors duration-200"
                >
                  <option value="">جميع المدن</option>
                  {Array.isArray(cities) && cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Region Filter for History */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="flex flex-col">
                <label className="mb-2 text-sm font-medium text-foreground">
                  المنطقة (التموضع)
                </label>
                <select
                  value={regionId}
                  onChange={(e) => setRegionId(e.target.value)}
                  className="p-2.5 border rounded-lg bg-card text-foreground text-sm shadow-sm focus:ring-2 focus:ring-primary focus:border-primary w-full disabled:bg-muted disabled:text-muted-foreground transition-colors duration-200"
                  disabled={!regions || regions.length === 0}
                >
                  <option value="">جميع المناطق</option>
                  {Array.isArray(regions) && regions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {selectedCustomerIdHistory && (
              <div className="mb-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          التصفية حسب العميل:
                        </span>
                        <span className="px-3 py-1 bg-white dark:bg-gray-800 border border-blue-100 dark:border-gray-700 rounded-md text-blue-700 dark:text-blue-300 font-semibold text-sm">
                          {customersList.find(c => c.id.toString() === selectedCustomerIdHistory.toString())?.company_name || selectedCustomerIdHistory}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-blue-500/10 dark:bg-blue-500/20 rounded-full text-blue-700 dark:text-blue-300 font-medium text-sm flex items-center gap-1">
                          <ShoppingCart className="w-4 h-4" />
                          {sortedHistory.length} طلب
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCustomerIdHistory("")}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    إزالة التصفية
                  </Button>
                </div>
              </div>
            )}

            {selectedDate && (
              <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 border border-green-200 dark:border-gray-700 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          التصفية حسب تاريخ الفك/التركيب:
                        </span>
                        <span className="px-3 py-1 bg-white dark:bg-gray-800 border border-green-100 dark:border-gray-700 rounded-md text-green-700 dark:text-green-300 font-semibold text-sm">
                          ${new Date(selectedDate).toLocaleDateString('ar-EG')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDate("")}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    إزالة التصفية
                  </Button>
                </div>
              </div>
            )}

            {cityId && (
              <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 border border-purple-200 dark:border-gray-700 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          التصفية حسب المدينة:
                        </span>
                        <span className="px-3 py-1 bg-white dark:bg-gray-800 border border-purple-100 dark:border-gray-700 rounded-md text-purple-700 dark:text-purple-300 font-semibold text-sm">
                          {cities.find(c => c.id.toString() === cityId.toString())?.name || cityId}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCityId("")}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    إزالة التصفية
                  </Button>
                </div>
              </div>
            )}

            {regionId && (
              <div className="mb-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 border border-amber-200 dark:border-gray-700 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                      <MapPin className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          التصفية حسب المنطقة:
                        </span>
                        <span className="px-3 py-1 bg-white dark:bg-gray-800 border border-amber-100 dark:border-gray-700 rounded-md text-amber-700 dark:text-amber-300 font-semibold text-sm">
                          {regions.find(r => r.id.toString() === regionId.toString())?.name || regionId}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRegionId("")}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    إزالة التصفية
                  </Button>
                </div>
              </div>
            )}

            <DynamicTable
              data={sortedHistory}
              columns={HistoryOrdersColumns}
              isLoading={isFetchingHistory}
              permissions={permission}
              className="bg-card rounded-lg shadow-sm border border-border w-full"
            />
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
};

export default OrdersContainer;