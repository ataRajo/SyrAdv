import { DynamicTable } from "../../utils/Tables/DynamicTable";
import { OrderFieldsShow } from "../../utils/Dialogs/Data/Show/OrderFieldsShow";
import DialogShow from "../../utils/Dialogs/DialogShow/DialogShow";
import { OrdersColumns } from "../../utils/Tables/ColumnsTable/OrdersColumns";
import { DeleteDialog } from "../../utils/Dialogs/DeleteDialog/DeleteDialog";
import { DialogEditOrders } from "../../utils/Dialogs/EditAddDialog/Edit/DialogEditOrders";
import OrdersPdf from "./OrdersPdf";
import { Loader, Eye, Download, Printer, ShoppingCart } from "lucide-react";
import { Permissions } from "../../Static/StaticData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HistoryOrdersColumns } from "../../utils/Tables/ColumnsTable/HistoryOrdersColumns";
import useMangeOrders from "../../hooks/useMangeOrders";
import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useGetCustomersQuery } from "../../RtkQuery/Slice/Customers/CustomersApi"
import { toast } from "sonner";

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

  // Change to customers instead of users
  const { data: customersList = [], isLoading: isLoadingCustomers } = useGetCustomersQuery();
  
  // Change state name to selectedCustomerId
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  
  // Add this state for notification counter
  const [unreadOrdersCount, setUnreadOrdersCount] = useState(0);
  const [viewedOrderIds, setViewedOrderIds] = useState(new Set());

  // Calculate unread orders count when data changes
  useEffect(() => {
    if (data && Array.isArray(data)) {
      const activeOrders = data.filter(order => order.status == 0);
      const unreadOrders = activeOrders.filter(order => !viewedOrderIds.has(order.id));
      setUnreadOrdersCount(unreadOrders.length);
    }
  }, [data, viewedOrderIds]);

  // Enhanced OrdersColumns with eye icon for details and PDF download
  const enhancedOrdersColumns = useMemo(() => [
    {
      header: "اسم الشركة",
      accessor: "customer.company_name",
      prefixIcon: "mdi:office-building",
      className: "min-w-[150px]",
      priority: 3,
    },
    {
      header: "الزبون الجديد",
      accessor: "customer_new.company_name",
      format: (value) => value ? value : "غير متوفر",
      prefixIcon: "mdi:office-building",
      className: "min-w-[150px]",
      priority: 3,
    },
    {
      header: "نوع الطلب",
      accessor: "type",
      prefixIcon: "mdi:format-list-bulleted-type",
      format: (value) => {
        const typeText = value === 1 ? "فك" : value === 2 ? "تركيب" : "فك و تركيب";
        const colorClass = value === 1 
          ? "bg-red-500 text-red-200 border border-red-300 font-bold px-3 py-1 rounded-lg" 
          : value === 2 
          ? "bg-green-500 text-green-800 border border-green-300 font-bold px-3 py-1 rounded-lg"
          : "bg-blue-100 text-blue-800 border border-blue-300 font-bold px-3 py-1 rounded-lg";
        
        return (
          <span className={`text-sm ${colorClass}`}>
            {typeText}
          </span>
        );
      },
      className: "min-w-[100px]",
      priority: 4,
    },
    {
      header: "تاريخ الفك أو التركيب",
      accessor: "action_date",
      prefixIcon: "mdi:calendar",
      format: (value) => new Date(value).toLocaleDateString("ar-EG"),
      className: "min-w-[120px] font-medium",
      priority: 5,
    },
    {
      header: "الملاحظة",
      accessor: "notes",
      prefixIcon: "mdi:note-text",
      className: "min-w-[100px]",
      priority: 6,
    },
    {
      header: "الحالة",
      accessor: "status",
      prefixIcon: "mdi:traffic-light",
      format: (value) => (
        <span className={`font-bold ${value === 0 ? "text-yellow-600" : "text-green-600"}`}>
          {value === 0 ? "جاري العمل" : "تمت العملية"}
        </span>
      ),
      className: "min-w-[100px]",
      priority: 7,
    },
    {
      header: "الإجراءات",
      accessor: "actions",
      prefixIcon: "mdi:cog",
      format: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails(row);
            }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors relative"
            title="عرض التفاصيل"
          >
            <Eye className="w-4 h-4" />
            {/* Show red dot if order hasn't been viewed */}
            {!viewedOrderIds.has(row.id) && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
            )}
          </button>
          
          {/*
          
<button
            onClick={(e) => {
              e.stopPropagation();
              handleGenerateDocument(row, 'print');
            }}
            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            title="طباعة"
          >
            <Printer className="w-4 h-4" />
          </button>

          
          */}

          
        </div>
      ),
      className: "min-w-[120px]",
      priority: 8,
    },
  ], [viewedOrderIds]);

  // Handle viewing order details
  const handleViewDetails = (order) => {
    // Mark this order as viewed and decrement counter
    if (!viewedOrderIds.has(order.id)) {
      setViewedOrderIds(prev => new Set([...prev, order.id]));
      setUnreadOrdersCount(prev => Math.max(0, prev - 1));
    }
    
    setSelectedOrder(order);
    setOpenShow(true);
  };

  // Function to mark all orders as read
  const markAllOrdersAsRead = () => {
    if (data && Array.isArray(data)) {
      const activeOrders = data.filter(order => order.status == 0);
      const allOrderIds = new Set(activeOrders.map(order => order.id));
      setViewedOrderIds(allOrderIds);
      setUnreadOrdersCount(0);
      toast.success("تم تعليم جميع الطلبات كمقروءة");
    }
  };

  // Sort and filter data by CUSTOMER selection
  const sortedData = useMemo(() => {
    const today = new Date();
    let filteredData = Array.isArray(data) ? data.filter((order) => order.status == 0) : [];
    
    // Apply CUSTOMER filter if selected
    if (selectedCustomerId) {
      filteredData = filteredData.filter(order => {
        // Check order.customer_id against selected customer
        if (order.customer_id && order.customer_id.toString() === selectedCustomerId.toString()) {
          return true;
        }
        
        // Check nested customer object id
        if (order.customer && order.customer.id && order.customer.id.toString() === selectedCustomerId.toString()) {
          return true;
        }
        
        // Check customer_new object if exists
        if (order.customer_new && order.customer_new.id && order.customer_new.id.toString() === selectedCustomerId.toString()) {
          return true;
        }
        
        return false;
      });
    }
    
    return [...filteredData].sort((a, b) => {
      const dateA = new Date(a.action_date);
      const dateB = new Date(b.action_date);
      const diffA = Math.abs(dateA - today);
      const diffB = Math.abs(dateB - today);
      return diffA - diffB;
    });
  }, [data, selectedCustomerId]);

  // Sort history by newest first
  const sortedHistory = useMemo(() => {
    if (!history || !Array.isArray(history)) return [];
    return [...history].sort((a, b) => new Date(b.action_date) - new Date(a.action_date));
  }, [history]);

  // Simple PDF generation without autoTable dependency issues
  const generateFilteredPDF = async () => {
  if (sortedData.length === 0) {
    toast.error("لا توجد بيانات للتصدير");
    return;
  }

  try {
    toast.info("جاري إنشاء ملف PDF...");
    
    const { jsPDF } = await import('jspdf');
    
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Get selected customer name
    const selectedCustomerName = selectedCustomerId 
      ? customersList.find(c => c.id.toString() === selectedCustomerId.toString())?.company_name || 'عميل'
      : 'جميع العملاء';
    
    // Add Arabic font support
    doc.setFont('helvetica', 'normal');
    
    // Add header
    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229); // #4f46e5
    doc.text("تقرير طلبات العميل", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139); // #64748b
    doc.text(`تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}`, pageWidth - 20, 30, { align: "right" });
    
    // Add filter info
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59); // #1e293b
    doc.text(`العميل: ${selectedCustomerName}`, 20, 40);
    doc.text(`عدد الطلبات: ${sortedData.length}`, 20, 50);
    
    // Simple table generation without autoTable
    let yPosition = 60;
    const lineHeight = 7;
    const colWidths = [40, 25, 30, 25, 40];
    const colPositions = [20];
    
    // Calculate column positions
    for (let i = 1; i < colWidths.length; i++) {
      colPositions[i] = colPositions[i-1] + colWidths[i-1];
    }
    
    // Add table headers
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(79, 70, 229); // #4f46e5
    
    const headers = ["اسم الشركة", "نوع الطلب", "تاريخ العملية", "الحالة", "ملاحظات"];
    headers.forEach((header, i) => {
      doc.rect(colPositions[i], yPosition - 5, colWidths[i], 8, 'F');
      doc.text(header, colPositions[i] + (colWidths[i] / 2), yPosition, { align: "center" });
    });
    
    yPosition += 10;
    
    // Add table rows
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    
    sortedData.forEach((order, index) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }
      
      const rowData = [
        order.customer?.company_name || "غير متوفر",
        order.type === 1 ? "فك" : order.type === 2 ? "تركيب" : "فك و تركيب",
        new Date(order.action_date).toLocaleDateString("ar-EG"),
        order.status === 0 ? "جاري العمل" : "تمت العملية",
        order.notes || "-"
      ];
      
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(20, yPosition - 3, pageWidth - 40, lineHeight + 2, 'F');
      }
      
      doc.setDrawColor(226, 232, 240);
      doc.rect(20, yPosition - 3, pageWidth - 40, lineHeight + 2);
      
      rowData.forEach((cell, i) => {
        let displayText = cell;
        if (cell.length > 20) {
          displayText = cell.substring(0, 17) + '...';
        }
        
        let textX = colPositions[i] + 2;
        if (i === 0) {
          textX = colPositions[i] + 2;
        } else {
          textX = colPositions[i] + (colWidths[i] / 2);
        }
        
        doc.text(displayText, textX, yPosition, { align: i === 0 ? "right" : "center" });
      });
      
      yPosition += lineHeight + 2;
    });
    
    // Add footer
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text("تم إنشاء هذا التقرير تلقائياً من نظام إدارة الطلبات", pageWidth / 2, pageHeight - 20, { align: "center" });
    doc.text(`© ${new Date().getFullYear()} جميع الحقوق محفوظة`, pageWidth / 2, pageHeight - 15, { align: "center" });
    
    const fileName = `طلبات_${selectedCustomerName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    toast.success("تم تحميل ملف PDF بنجاح");
  } catch (error) {
    console.error('Error generating PDF:', error);
    
    toast.info("جاري استخدام طريقة بديلة للتصدير...");
    setTimeout(() => {
      generatePDFViaPrint();
    }, 1000);
  }
};

const generatePDFViaPrint = () => {
  if (sortedData.length === 0) {
    toast.error("لا توجد بيانات للتصدير");
    return;
  }

  const selectedCustomerName = selectedCustomerId 
    ? customersList.find(c => c.id.toString() === selectedCustomerId.toString())?.company_name || 'عميل'
    : 'جميع العملاء';

  // Create printable HTML
  const printContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>تقرير طلبات العميل</title>
      <style>
        @media print {
          @page { margin: 20mm; }
        }
        body {
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
          direction: rtl;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #4f46e5;
        }
        .header h1 {
          color: #4f46e5;
          margin-bottom: 10px;
          font-size: 24px;
        }
        .filter-info {
          background-color: #f0f9ff;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          border-right: 4px solid #0ea5e9;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          font-size: 12px;
        }
        th {
          background-color: #4f46e5;
          color: white;
          padding: 12px;
          text-align: center;
          font-weight: bold;
          border: 1px solid #ddd;
        }
        td {
          padding: 10px;
          text-align: center;
          border: 1px solid #ddd;
        }
        tr:nth-child(even) {
          background-color: #f8fafc;
        }
        .badge {
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: bold;
        }
        .badge-release { background-color: #fecaca; color: #dc2626; }
        .badge-install { background-color: #bbf7d0; color: #16a34a; }
        .badge-both { background-color: #dbeafe; color: #2563eb; }
        .badge-pending { background-color: #fef3c7; color: #d97706; }
        .badge-completed { background-color: #dcfce7; color: #16a34a; }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #e5e7eb;
          color: #666;
          font-size: 11px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>تقرير طلبات العميل</h1>
        <p>${new Date().toLocaleDateString('ar-EG')} - ${new Date().toLocaleTimeString('ar-EG')}</p>
      </div>
      
      <div class="filter-info">
        <p><strong>العميل المحدد:</strong> ${selectedCustomerName}</p>
        <p><strong>عدد الطلبات:</strong> ${sortedData.length}</p>
        <p><strong>نوع التقرير:</strong> الطلبات النشطة (جاري العمل)</p>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>اسم الشركة</th>
            <th>نوع الطلب</th>
            <th>تاريخ العملية</th>
            <th>الحالة</th>
            <th>ملاحظات</th>
          </tr>
        </thead>
        <tbody>
          ${sortedData.map(order => {
            const typeText = order.type === 1 ? "فك" : order.type === 2 ? "تركيب" : "فك و تركيب";
            const typeClass = order.type === 1 ? "release" : order.type === 2 ? "install" : "both";
            const statusText = order.status === 0 ? "جاري العمل" : "تمت العملية";
            const statusClass = order.status === 0 ? "pending" : "completed";
            
            return `
              <tr>
                <td>${order.customer?.company_name || 'غير متوفر'}</td>
                <td><span class="badge badge-${typeClass}">${typeText}</span></td>
                <td>${new Date(order.action_date).toLocaleDateString('ar-EG')}</td>
                <td><span class="badge badge-${statusClass}">${statusText}</span></td>
                <td>${order.notes || '-'}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      
      <div class="footer">
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

  // Open print window
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    toast.info("جاري فتح نافذة الطباعة...");
  }
};

  // Only show loading on initial load or when cities are loading
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
            {/* Add notification badge here */}
            {unreadOrdersCount > 0 && (
              <div className="absolute -top-2 -right-2">
                <div className="relative">
                  <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></div>
                  <div className="relative inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 border-2 border-white rounded-full">
                    {unreadOrdersCount} {/* Show actual number */}
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
                            {unreadOrdersCount} {/* Show actual number */}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/*
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllOrdersAsRead}
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      تعليم الكل كمقروء
                    </Button>
                    */}
                    
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <OrdersPdf orders={Array.isArray(data) ? data : []} />
                <Button
                  onClick={generatePDFViaPrint}
                  disabled={sortedData.length === 0}
                  variant="outline"
                  className="flex items-center gap-2 bg-blue-50 border-blue-200 hover:bg-blue-100"
                >
                  <Printer className="w-4 h-4" />
                  طباعة
                </Button>
              </div>
            </div>
            
            {/* Stats card showing orders count */}
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
              {/* CUSTOMER Filter */}
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

              {/* Order Type Filter */}
              <div className="flex flex-col">
                <label className="mb-2 text-sm font-medium text-foreground">
                  نوع الطلب
                </label>
                <div className="flex flex-wrap gap-4 bg-card p-4 rounded-lg shadow-sm border border-border">
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
                    <input
                      type="radio"
                      name="orderType"
                      value="both"
                      checked={orderType === "both"}
                      onChange={(e) => setOrderType(e.target.value)}
                      className="text-blue-500 focus:ring-blue-500 h-4 w-4 accent-blue-500"
                    />
                    <span className="text-blue-600 font-medium">فك وتركيب</span>
                  </label>
                </div>
              </div>

              {/* City Filter */}
              <div className="flex flex-col">
                <label className="mb-2 text-sm font-medium text-foreground">
                  المدينة
                </label>
                <select
                  value={cityId}
                  onChange={(e) => setCityId(e.target.value)}
                  className="p-2.5 border rounded-lg bg-card text-foreground text-sm shadow-sm focus:ring-2 focus:ring-primary focus:border-primary w-full disabled:bg-muted disabled:text-muted-foreground transition-colors duration-200"
                >
                  <option value="">اختر مدينة</option>
                  {Array.isArray(cities) && cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Region Filter */}
              <div className="flex flex-col">
                <label className="mb-2 text-sm font-medium text-foreground">
                  المنطقة
                </label>
                <select
                  value={regionId}
                  onChange={(e) => setRegionId(e.target.value)}
                  className="p-2.5 border rounded-lg bg-card text-foreground text-sm shadow-sm focus:ring-2 focus:ring-primary focus:border-primary w-full disabled:bg-muted disabled:text-muted-foreground transition-colors duration-200"
                  disabled={!cityId}
                >
                  <option value="">اختر منطقة</option>
                  {Array.isArray(regions) && regions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter Summary */}
            {selectedCustomerId && (
              <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 border border-blue-200 dark:border-gray-700 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
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
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
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
          <DynamicTable
            data={sortedHistory}
            columns={HistoryOrdersColumns}
            isLoading={isFetchingHistory}
            permissions={permission}
            className="bg-card rounded-lg shadow-sm border border-border w-full"
          />
        </TabsContent>
      </Tabs>
    </>
  );
};

export default OrdersContainer;