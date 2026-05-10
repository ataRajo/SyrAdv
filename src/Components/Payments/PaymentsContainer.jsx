import React, { useState, useMemo, useEffect } from "react";
import { DynamicTable } from "../../utils/Tables/DynamicTable";
import HeaderComponent from "../../utils/HeaderComponent";
import { PaymentsColumns, PAYMENT_STATUS } from "../../utils/Tables/ColumnsTable/PaymentsColumns";
import { DialogAddPayments } from "../../utils/Dialogs/EditAddDialog/Add/DialogAddPayments";
import InvoicePdf from "./InvoicePdf";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeleteDialog } from "../../utils/Dialogs/DeleteDialog/DeleteDialog";
import { Permissions } from "../../Static/StaticData";
import InvoiceExcel from "./InvoiceExcel";
import useMangePayments from "../../hooks/useMangePayments";
import { ViewImageDialog } from "./ViewImageDialog";
import { useGetPaymentsQuery } from "../../RtkQuery/Slice/Payments/PaymentsApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetCustomersQuery } from "../../RtkQuery/Slice/Customers/CustomersApi";
import { Button } from "@/components/ui/button"; 
import { Icon } from "@iconify/react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "../../Context/AuthProvider";
import Logo from "../../assets/images/adv_syrian.png"
import { BASE_URL } from "../../Api/baseUrl";

const STATUS_FILTER_OPTIONS = [
  { label: "الكل", value: "all" },
  { label: PAYMENT_STATUS.WAITING.label, value: PAYMENT_STATUS.WAITING.value.toString() },
  { label: PAYMENT_STATUS.ACCEPTED.label, value: PAYMENT_STATUS.ACCEPTED.value.toString() },
  { label: PAYMENT_STATUS.REJECTED.label, value: PAYMENT_STATUS.REJECTED.value.toString() },
];



const CUSTOMER_FILTER_OPTIONS = [
  { label: "جميع العملاء", value: "all" },
];

const RemainingBalanceBadge = ({ count, overdueCount }) => {
  if (count <= 0) return null;
  
  return (
    <div className="flex items-center gap-1">
      <div className="relative">
        {overdueCount > 0 && (
          <div className="animate-ping absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500 opacity-75"></div>
        )}
        <Badge 
          variant={count > 0 ? "destructive" : "outline"}
          className="h-5 min-w-5 px-1 flex items-center justify-center text-xs font-bold relative"
          title={`${count} حجز لا يزال باقيًا`}
        >
          {count > 99 ? "99+" : count}
        </Badge>
      </div>
      {overdueCount > 0 && (
        <Icon 
          icon="mdi:alert-circle" 
          className="text-amber-500 w-4 h-4 animate-pulse"
          title={`${overdueCount} حجز متأخر`}
        />
      )}
    </div>
  );
};

const PaymentsContainer = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  
  const { user } = useAuth(); 
  
  const { data: payments = [], isLoading: isFetchingPayments } = useGetPaymentsQuery();
  const { data: customers = [], isLoading: isFetchingCustomers } = useGetCustomersQuery();

  const customersWithRemainingBalance = useMemo(() => {
    if (!customers || customers.length === 0) {
      return [];
    }
    
    const result = [];
    let counter = 0; // عداد للعملاء الذين لديهم رصيد متبقي
    
    customers.forEach(customer => {
      const remaining = parseFloat(customer.remaining) || 0;
      const hasRemaining = remaining > 0;
      
      if (hasRemaining) {
        counter++;
      }
      
      const customerPayments = payments?.filter(p => p.customer_id === customer.id) || [];
      
      const totalPaid = customerPayments.reduce((sum, payment) => {
        return sum + (parseFloat(payment.paid) || 0);
      }, 0);
      
      const totalAmount = customerPayments.reduce((sum, payment) => {
        return sum + (parseFloat(payment.total) || 0);
      }, 0);
      
      const incompletePayments = customerPayments.filter(p => 
        (parseFloat(p.remaining) || 0) > 0
      ).length;
      
      const latestPayment = customerPayments.sort((a, b) => 
        new Date(b.date || b.created_at) - new Date(a.date || a.created_at)
      )[0];
      
      result.push({
        id: customer.id,
        name: customer.full_name || `عميل #${customer.id}`,
        companyName: customer.company_name || customer.full_name || "غير معروف",
        phone: customer.phone_number || "غير معروف",
        email: customer.email || "غير معروف",
        address: customer.address || "غير معروف",
        remaining: remaining, // الرصيد المتبقي مباشرة من بيانات العميل
        hasRemaining: hasRemaining, // علامة إذا كان لديه رصيد متبقي
        totalPaid: totalPaid,
        totalAmount: totalAmount,
        paymentCount: customerPayments.length,
        incompletePayments: incompletePayments,
        latestPaymentDate: latestPayment?.date || latestPayment?.created_at || null,
        latestPaymentAmount: latestPayment?.paid || null,
        customerData: customer, // بيانات العميل الأصلية
        payments: customerPayments // جميع دفعات العميل
      });
    });
    
    console.log(`عدد العملاء الذين لديهم رصيد متبقي: ${counter} من ${customers.length}`);
    
    return result.sort((a, b) => b.remaining - a.remaining);
  }, [customers, payments]);

  const statistics = useMemo(() => {
    const allCustomers = customersWithRemainingBalance;
    const customersWithRemaining = allCustomers.filter(c => c.hasRemaining);
    
    return {
      totalCustomers: allCustomers.length,
      customersWithRemainingCount: customersWithRemaining.length,
      totalOutstandingBalance: customersWithRemaining.reduce((sum, c) => sum + c.remaining, 0),
      averageRemaining: customersWithRemaining.length > 0 
        ? customersWithRemaining.reduce((sum, c) => sum + c.remaining, 0) / customersWithRemaining.length 
        : 0,
      totalPaymentsAmount: allCustomers.reduce((sum, c) => sum + c.totalAmount, 0),
      totalPaidAmount: allCustomers.reduce((sum, c) => sum + c.totalPaid, 0)
    };
  }, [customersWithRemainingBalance]);


  
  const {
    openAdd,
    setOpenAdd,
    openDelete,
    setOpenDelete,
    isLoadingConfirm,
    paymentIsReceived,
    isFetchingPaymentsReceived,
    setActiveTab,
    openConfirm,
    setOpenConfirm,
    onShow,
    onConfirmPayment,
    handleConfirm,
    isLoadingDelete,
    handleDelete,
    onConfirmDelete,
    isFetchingPaymentsNotReceived,
    paymentIsNotReceived,
    dataInvoicePdf,
    permissions,
    openViewImage,
    setOpenViewImage,
    selectedPayment,
    allNotifications,
    calculateBookingNotifications,
  } = useMangePayments();

  const showPaymentTabs = useMemo(() => {
    if (!user) return true;
    const restrictedRoles = ["super_admin", "admin", "administrator"];
    const userRole = user.role?.toLowerCase() || user.roles?.[0]?.name?.toLowerCase() || "";
    return !restrictedRoles.includes(userRole);
  }, [user]);

  const filteredNotReceivedPayments = useMemo(() => {
    let filtered = paymentIsNotReceived || [];
    if (customerFilter !== "all") {
      filtered = filtered.filter((p) => p.customer_id === parseInt(customerFilter));
    }
    return filtered;
  }, [paymentIsNotReceived, customerFilter]);

  const filteredNotifications = useMemo(() => {
    return calculateBookingNotifications(filteredNotReceivedPayments);
  }, [calculateBookingNotifications, filteredNotReceivedPayments]);

 
const getToken = () => {
    try {
      const raw = localStorage.getItem("SuperAdminInfo");
      const info = raw ? JSON.parse(raw) : null;
      return info?.user?.token || info?.token || localStorage.getItem("token");
    } catch (error) {
      console.error("Error getting token:", error);
      return localStorage.getItem("token");
    }
  };
  
  
const handleReceipt = async (paymentId) => {
  if (!paymentId) {
    alert("رقم الدفعة مطلوب لعرض الوصل");
    return;
  }

  try {
    const token = getToken()
console.log(token)

    const response = await fetch(`${BASE_URL}/payments/${paymentId}/pdf`, {
      method: "POST",
      headers: {
        "Accept": "*/*",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`   
      },
      body: JSON.stringify({ id: paymentId })
    });

    if (!response.ok) {
      let errorDetail = "";

      try {
        const data = await response.clone().json();
        errorDetail = data.message || data.error || "";
      } catch {
        try {
          errorDetail = await response.clone().text();
        } catch {
          errorDetail = response.statusText;
        }
      }

      if (response.status === 404) {
        throw new Error(`الوصل غير موجود (رقم ${paymentId})`);
      }
      if (response.status === 400) {
        throw new Error(`طلب غير صالح: ${errorDetail || "رقم الدفعة غير صحيح"}`);
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error("غير مصرح لك بعرض هذا الوصل");
      }
      if (response.status === 405) {
        throw new Error("طريقة الطلب غير مدعومة");
      }

      throw new Error(`فشل في تحميل الوصل: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    console.log("Content-Type received:", contentType);

    // تحقق من نوع الملف
    const isWord = contentType && (
      contentType.includes("application/msword") ||
      contentType.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document") ||
      contentType.includes("application/octet-stream")
    );
    
    const isPdf = contentType && contentType.includes("application/pdf");

    if (isWord) {
      const wordBlob = await response.blob();
      
      if (wordBlob.size === 0) {
        throw new Error("ملف Word فارغ");
      }

      const wordUrl = URL.createObjectURL(wordBlob);
      const fileName = `سند_قبض_${paymentId}_${new Date().toISOString().split("T")[0]}.doc`;
      
      downloadFile(wordUrl, fileName);
      
    } else if (isPdf) {
      const pdfBlob = await response.blob();

      if (pdfBlob.size === 0) {
        throw new Error("ملف PDF فارغ");
      }

      const pdfUrl = URL.createObjectURL(pdfBlob);

      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = pdfUrl;
      document.body.appendChild(iframe);

      iframe.onload = () => {
        try {
          iframe.contentWindow.print();

          setTimeout(() => {
            document.body.removeChild(iframe);
            URL.revokeObjectURL(pdfUrl);
          }, 1000);
        } catch {
          document.body.removeChild(iframe);

          const win = window.open(pdfUrl, "_blank");
          if (win) {
            win.onload = () => win.print();
          } else {
            downloadFile(pdfUrl, `سند_قبض_${paymentId}.pdf`);
          }
        }
      };
      
    } else {
      try {
        const result = await response.clone().json();

        if (result.pdf_url || result.word_url || result.file_url) {
          window.open(result.pdf_url || result.word_url || result.file_url, "_blank");
          return;
        }

        throw new Error(result.message || "الاستجابة ليست ملف Word أو PDF");
      } catch {
        throw new Error("الاستجابة من الخادم غير متوقعة");
      }
    }
  } catch (error) {
    let msg = "خطأ في عرض الوصل";

    if (error.message.includes("الوصل غير موجود")) msg = error.message;
    else if (error.message.includes("طلب غير صالح")) msg = error.message;
    else if (error.message.includes("غير مصرح")) msg = "ليس لديك صلاحية لعرض هذا الوصل";
    else if (error.message.includes("طريقة الطلب")) msg = "طريقة الطلب غير مدعومة. يرجى التواصل مع الدعم الفني";
    else if (error.message.includes("فشل في تحميل")) msg = error.message;
    else if (error.message.includes("فارغ")) msg = "ملف الوصل فارغ";
    else if (error.message.includes("الاستجابة ليست ملف") || error.message.includes("غير متوقعة"))
      msg = "الاستجابة من الخادم غير صحيحة";
    else if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError"))
      msg = "تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت";

    alert(`${msg}\nرقم الدفعة: ${paymentId}`);
  }
};



const downloadFile = (fileUrl, fileName) => {
  try {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // تنظيف بعد ثانية
    setTimeout(() => {
      URL.revokeObjectURL(fileUrl);
    }, 1000);
    
    console.log(`تم تحميل الملف: ${fileName}`);
  } catch {
    alert("فشل في تحميل ملف الوصل");
  }
};



  const [showFilteredNotifications, setShowFilteredNotifications] = useState(false);
  const [storedNotifications, setStoredNotifications] = useState(() => {
    try {
      const count = parseInt(localStorage.getItem('paymentsNotificationCount') || '0');
      const overdue = parseInt(localStorage.getItem('paymentsOverdueCount') || '0');
      return { count, overdue };
    } catch (error) {
      return { count: 0, overdue: 0 };
    }
  });

  useEffect(() => {
    if (customerFilter !== "all") {
      setShowFilteredNotifications(true);
    } else {
      setShowFilteredNotifications(false);
    }
  }, [customerFilter]);



  const displayNotifications = useMemo(() => {
    if (showFilteredNotifications) {
      return {
        pendingBookings: filteredNotifications.pendingBookings,
        overdueBookings: filteredNotifications.overdueBookings,
        totalBookings: filteredNotifications.totalBookings,
        completedBookings: filteredNotifications.completedBookings,
        isFiltered: true,
      };
    } else {
      return {
        pendingBookings: storedNotifications.count,
        overdueBookings: storedNotifications.overdue,
        totalBookings: allNotifications?.totalBookings || 0,
        completedBookings: allNotifications?.completedBookings || 0,
        isFiltered: false,
      };
    }
  }, [showFilteredNotifications, filteredNotifications, storedNotifications, allNotifications]);

  const customerOptions = useMemo(() => {
    const options = [...CUSTOMER_FILTER_OPTIONS];
    customers?.forEach(customer => {
      if (customer.company_name || customer.full_name) {
        options.push({
          label: customer.company_name || customer.full_name || `عميل #${customer.id}`,
          value: customer.id.toString(),
          customerData: customer
        });
      }
    });
    return options;
  }, [customers]);

  const selectedCustomerData = useMemo(() => {
    if (customerFilter === "all") return null;
    return customerOptions.find(opt => opt.value === customerFilter)?.customerData || null;
  }, [customerFilter, customerOptions]);

  const filteredPayments = useMemo(() => {
    let filtered = payments;
    
    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === parseInt(statusFilter));
    }
    
    if (customerFilter !== "all") {
      filtered = filtered.filter((p) => p.customer_id === parseInt(customerFilter));
    }
    
    return filtered;
  }, [payments, statusFilter, customerFilter]);

  const pdfCustomerData = useMemo(() => {
    if (!selectedCustomerData) {
      return dataInvoicePdf || {};
    }
    
    return {
      ...selectedCustomerData,
      payments: filteredPayments.filter(p => p.customer_id === selectedCustomerData.id),
      company_name: selectedCustomerData.company_name || selectedCustomerData.full_name,
      id: selectedCustomerData.id,
    };
  }, [selectedCustomerData, filteredPayments, dataInvoicePdf]);

const handleExportWord = async () => {
  if (filteredPayments.length === 0) {
    alert("لا توجد بيانات للتصدير");
    return;
  }

  try {
    const customerName = selectedCustomerData?.company_name || selectedCustomerData?.full_name || 'جميع_العملاء';
    const fileName = `دفعات_${customerName}_${new Date().toISOString().split('T')[0]}.doc`;
    
    
    const totalAmount = filteredPayments.reduce((sum, p) => sum + (parseFloat(p.paid) || 0), 0);
    
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
      } catch {
        return 'غير محدد';
      }
    };

    const currentDate = formatArabicDate(new Date());
    const statusLabel = statusFilter !== "all" 
      ? STATUS_FILTER_OPTIONS.find(opt => opt.value === statusFilter)?.label 
      : 'الكل';
    const customerLabel = customerFilter !== "all" 
      ? customerOptions.find(opt => opt.value === customerFilter)?.label 
      : 'جميع العملاء';

    let wordContent = `
      <!DOCTYPE html>
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'
            dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>${fileName}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Amiri', serif;
            direction: rtl;
            text-align: right;
            margin: 20px 40px;
            line-height: 1.6;
            color: #000000;
            background-color: #fff;
          }
          
          @page {
    size: A4;
    margin: 15mm;
  }
          
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            border-bottom: 2px solid #000000;
            padding-bottom: 15px;
            width: 100%;
          }
          
          .logo-container {
            margin-left: 0;
            margin-right: 20px;
          }
          
          .logo {
            width: 100px;
            height: 400px;
          }
          
          .header-content {
            flex: 1;
            text-align: right;
          }
          
          .header h1 {
            font-size: 24px;
            color: #000000;
            margin: 0 0 10px 0;
          }
          
          .header .subtitle {
            font-size: 16px;
            color: #000000;
            margin: 5px 0;
          }
          
          .report-info {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
            border-right: 4px solid #000000;
          }
          
          .summary-cards {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin: 20px 0;
          }
          
          .summary-card {
            background-color: white;
            padding: 15px;
            border: 1px solid #000000;
            border-radius: 6px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .summary-value {
            font-size: 18px;
            font-weight: bold;
            color: #000000;
            margin: 10px 0;
          }
          
          .summary-label {
            font-size: 12px;
            color: #000000;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 12px;
          }
          
          table th {
            background-color: #000000;
            color: #ffffff;
            padding: 12px 8px;
            text-align: center;
            font-weight: bold;
            border: 1px solid #000000;
            font-size: 13px;
          }
          
          table td {
            padding: 10px 8px;
            text-align: center;
            border: 1px solid #000000;
            color: #000000;
          }
          
          table tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          
          .amount-cell {
            font-weight: bold;
            color: #000000;
            direction: ltr;
          }
          
          .total-row {
            background-color: #000000 !important;
            color: #ffffff !important;
            font-weight: bold;
            font-size: 13px;
          }
          
          .total-row td {
            color: #ffffff !important;
          }
          
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #000000;
            text-align: center;
            color: #000000;
            font-size: 12px;
          }
          
          @media print {
            body {
              margin: 1cm;
            }
            
            .no-print {
              display: none;
            }
          }
          
          img {
            -ms-interpolation-mode: bicubic;
            display: block !important;
            visibility: visible !important;
          }
          
          .logo-placeholder {
            width: 120px;
            height: 80px;
            background-color: #000000;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-container">
    `;
    
    wordContent += `
          </div>
          <div class="header-content">
            <h1>تقرير الدفعات</h1>
            <div class="subtitle">العميل: ${customerLabel}</div>
            <div class="subtitle">تاريخ التقرير: ${currentDate}</div>
            <div class="subtitle">حالة الفلتر: ${statusLabel}</div>
          </div>
        </div>
        
        <div class="report-info">
          <h3 style="color: #000000; margin-bottom: 10px;">ملخص التقرير</h3>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
            <div>
              <strong>العميل:</strong> ${customerLabel}
            </div>
            <div>
              <strong>حالة الدفعات:</strong> ${statusLabel}
            </div>
            <div>
              <strong>عدد الدفعات:</strong> ${filteredPayments.length}
            </div>
            <div>
              <strong>تاريخ الإصدار:</strong> ${currentDate}
            </div>
          </div>
        </div>
        
        <div class="summary-cards">
          <div class="summary-card">
            <div class="summary-value">${filteredPayments.length}</div>
            <div class="summary-label">عدد الدفعات</div>
          </div>
          <div class="summary-card">
            <div class="summary-value">${totalAmount.toFixed(2)} $</div>
            <div class="summary-label">المبلغ المدفوع</div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>رقم الدفعة</th>
              <th>رقم الحجز</th>
              <th>اسم العميل</th>
              <th>المبلغ المدفوع</th>
              <th>تاريخ الدفع</th>
              <th>الموظف</th>
            </tr>
          </thead>
          <tbody>
    `;

    filteredPayments.forEach((payment, index) => {
      const paymentDate = formatArabicDate(payment.date || payment.created_at);
      const customerName = payment.customer?.company_name || 
                         payment.customer?.full_name || 
                         'غير محدد';
      const employeeName = payment.user?.full_name || 
                         payment.employee?.name || 
                         'غير محدد';
      
      wordContent += `
        <tr>
          <td>${payment.payment_number || payment.id || index + 1}</td>
          <td>${payment.booking_id || 'غير محدد'}</td>
          <td>${customerName}</td>
          <td class="amount-cell">${parseFloat(payment.paid || 0).toFixed(2)} $</td>
          <td>${paymentDate}</td>
          <td>${employeeName}</td>
        </tr>
      `;
    });

    wordContent += `
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="3"><strong>الإجمالي</strong></td>
              <td class="amount-cell"><strong>${totalAmount.toFixed(2)} $</strong></td>
              <td colspan="2"></td>
            </tr>
          </tfoot>
        </table>
        
        <div class="footer">
          <p>نظام إدارة المدفوعات - الشركة السورية للإعلان</p>
          <p>تم الإنشاء آلياً بتاريخ ${currentDate}</p>
          <p>العنوان: دمشق 09393333336 - حلب 0992400040</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([wordContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Error exporting to Word:', error);
    alert('حدث خطأ أثناء التصدير إلى Word');
  }
};



  return (
    <>
      <Tabs
        dir="rtl"
        defaultValue="payments"
        onValueChange={setActiveTab}
        className="w-full p-4"
      >
        <TabsList className={`grid w-full ${showPaymentTabs ? 'grid-cols-3' : 'grid-cols-1'} bg-card rounded-lg border border-border`}>
          <TabsTrigger value="payments" className="text-xs md:text-sm font-medium">
            جميع الدفعات
          </TabsTrigger>
          
          {showPaymentTabs && (
            <TabsTrigger value="received" className="text-xs md:text-sm font-medium">
              الدفعات المستلمة
            </TabsTrigger>
          )}
          
          {showPaymentTabs && (
            <TabsTrigger value="not-received" className="text-xs md:text-sm font-medium relative">
              <div className="flex items-center gap-2">
                <span>الدفعات غير المستلمة</span>
                <RemainingBalanceBadge 
                  count={displayNotifications.pendingBookings} 
                  overdueCount={displayNotifications.overdueBookings}
                />
                {displayNotifications.isFiltered && (
                  <Icon 
                    icon="mdi:filter" 
                    className="text-blue-500 w-4 h-4"
                    title="إشعارات مصفاة حسب العميل"
                  />
                )}
              </div>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="payments">
          <div className="p-0 w-full mx-auto space-y-6 overflow-x-auto">
            <HeaderComponent
              title={"المدفوعات"}
              titleBtn={"إضافة دفعة"}
              setShow={setOpenAdd}
              permission={Permissions.CreatePayments}
            />
            
            <div className="flex gap-3 justify-start">
              <InvoicePdf
                customer={pdfCustomerData}
                showCustomerTable={!!selectedCustomerData}
                showCustomerPaymentsTable={true}
                disabled={!filteredPayments.length}
                title={selectedCustomerData ? `دفعات ${selectedCustomerData.company_name || selectedCustomerData.full_name}` : "دفعات جميع العملاء"}
              />
              
              <InvoiceExcel
                customer={pdfCustomerData}
                showCustomerTable={false}
                showCustomerPaymentsTable={true}
                disabled={!filteredPayments.length}
              />
              
              <Button
                onClick={handleExportWord}
                disabled={!filteredPayments.length}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              >
                <Icon icon="mdi:microsoft-word" className="w-4 h-4" />
                <span>تصدير Word</span>
              </Button>

              <Button
                onClick={() => setShowCustomerModal(true)}
                className={`flex items-center gap-2 relative overflow-hidden group ${
                  statistics.customersWithRemainingCount > 0 
                    ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800' 
                    : 'bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600'
                } text-white cursor-pointer`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <Icon icon="mdi:account-cash" className="w-4 h-4 relative z-10" />
                <span className="relative z-10">العملاء عليهم متبقي</span>
                {statistics.customersWithRemainingCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="relative z-10 h-5 min-w-5 px-1 flex items-center justify-center text-xs font-bold ml-2 animate-pulse"
                  >
                    {statistics.customersWithRemainingCount > 99 ? "99+" : statistics.customersWithRemainingCount}
                  </Badge>
                )}
              </Button>
            </div>

            <div className="flex gap-4 justify-end mb-4 flex-wrap">
              <div className="min-w-[200px]">
                <Select
                  value={customerFilter}
                  onValueChange={(val) => setCustomerFilter(val)}
                  disabled={isFetchingCustomers}
                >
                  <SelectTrigger className="w-full bg-white border text-right">
                    <SelectValue placeholder="تصفية حسب العميل" />
                  </SelectTrigger>
                  <SelectContent>
                    {customerOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[180px]">
                <Select
                  value={statusFilter}
                  onValueChange={(val) => setStatusFilter(val)}
                >
                  <SelectTrigger className="w-full bg-white border text-right">
                    <SelectValue placeholder="تصفية حسب الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_FILTER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {(statusFilter !== "all" || customerFilter !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStatusFilter("all");
                    setCustomerFilter("all");
                  }}
                  className="h-10"
                >
                  مسح الفلاتر
                </Button>
              )}
            </div>

            {(statusFilter !== "all" || customerFilter !== "all") && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Icon 
                      icon="mdi:filter" 
                      className="text-blue-500 dark:text-blue-400" 
                    />
                    <span className="font-medium text-blue-800 dark:text-blue-300">
                      التصفية الحالية:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {statusFilter !== "all" && (
                        <span className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-full text-xs font-medium">
                          <Icon icon="mdi:flag" className="w-3 h-3" />
                          {STATUS_FILTER_OPTIONS.find(opt => opt.value === statusFilter)?.label}
                        </span>
                      )}
                      {customerFilter !== "all" && (
                        <span className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 px-3 py-1.5 rounded-full text-xs font-medium">
                          <Icon icon="mdi:account" className="w-3 h-3" />
                          {customerOptions.find(opt => opt.value === customerFilter)?.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStatusFilter("all");
                      setCustomerFilter("all");
                    }}
                    className="h-8 px-3 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    <Icon icon="mdi:close-circle" className="ml-1 w-4 h-4" />
                    مسح الفلاتر
                  </Button>
                </div>
              </div>
            )}

            <DynamicTable
              data={filteredPayments}
              columns={PaymentsColumns}
              isLoading={isFetchingPayments || isFetchingCustomers}
              onShow={onShow}
              permissions={permissions}
              onDelete={handleDelete}
              onReceipt={(payment) => handleReceipt(payment.id)}
 

            />

            <DialogAddPayments
              show={openAdd}
              handleClose={() => setOpenAdd(false)}
            />
          </div>
        </TabsContent>


        {showPaymentTabs && (
          <TabsContent value="not-received">
            <div className="w-full mx-auto space-y-6 overflow-x-auto">
              {displayNotifications.pendingBookings > 0 && (
                <div className="mb-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-full">
                        <Icon icon="mdi:cash-clock" className="text-amber-600 dark:text-amber-400 w-6 h-6" />
                      </div>
                      
                      
                      <div>
                        <h3 className="font-bold text-amber-800 dark:text-amber-300">
                          {displayNotifications.isFiltered ? 'إشعارات العميل المحدد' : 'تنبيه: هناك حجوزات باقية'}
                        </h3>
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                          {displayNotifications.pendingBookings} حجز لا يزال متبقيًا 
                          ({displayNotifications.completedBookings} مكتمل)
                          {displayNotifications.isFiltered && ' (مصفاة حسب العميل)'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {displayNotifications.overdueBookings > 0 && (
                        <Badge variant="destructive" className="animate-pulse">
                          <Icon icon="mdi:alert" className="ml-1 w-4 h-4" />
                          {displayNotifications.overdueBookings} متأخرة
                        </Badge>
                      )}
                      {displayNotifications.isFiltered && (
                        <Badge variant="outline" className="text-blue-600 border-blue-300">
                          <Icon icon="mdi:account-filter" className="ml-1 w-3 h-3" />
                          مصفاة
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              <DynamicTable
                data={filteredNotReceivedPayments}
                columns={PaymentsColumns}
                isLoading={isFetchingPaymentsNotReceived}
                onShow={onShow}
                onDelete={handleDelete}
                onConfirmOrder={onConfirmPayment}
                permissions={permissions}
                onReceipt={(payment) => handleReceipt(payment.id)}
 
              />
            </div>
          </TabsContent>
        )}

        {showPaymentTabs && (
          <TabsContent value="received">
            <div className="w-full mx-auto space-y-6 overflow-x-auto">
              <DynamicTable
                data={paymentIsReceived || []}
                columns={PaymentsColumns}
                isLoading={isFetchingPaymentsReceived}
                onShow={onShow}
                permissions={permissions}
                onDelete={handleDelete}
                onReceipt={(payment) => handleReceipt(payment.id)}
 
              />
            </div>
          </TabsContent>
        )}
      </Tabs>

      <DeleteDialog
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        title={"عملية تأكيد استلام الدفعة"}
        description="هل تريد تأكيد العملية"
        confirmText="نعم"
        titleLoading="جاري التأكيد"
        onConfirm={handleConfirm}
        loading={isLoadingConfirm}
      />

      <ViewImageDialog
        show={openViewImage}
        handleClose={() => setOpenViewImage(false)}
        payment={
          selectedPayment
            ? {
                ...selectedPayment,
                payment_image: selectedPayment.payment_image || null,
              }
            : null
        }
      />
      
      <DeleteDialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={onConfirmDelete}
        loading={isLoadingDelete}
      />

      {showCustomerModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
          onClick={() => setShowCustomerModal(false)}
        >
          <div 
            className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-[95vw] sm:max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden mx-2 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 text-white p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-white/20 rounded-full">
                    <Icon icon="mdi:account-cash" className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold">جميع العملاء والرصيد المتبقي لهم</h2>
                    <p className="text-blue-100 text-xs sm:text-sm mt-1">
                      {statistics.totalCustomers} عميل • {statistics.customersWithRemainingCount} عميل لديهم رصيد متبقي • إجمالي المبلغ المتبقي: {statistics.totalOutstandingBalance.toFixed(2)} $
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCustomerModal(false)}
                  className="p-1.5 sm:p-2 hover:bg-white/20 rounded-full transition-colors"
                  aria-label="إغلاق"
                >
                  <Icon icon="mdi:close" className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mt-4 sm:mt-6">
                <div className="bg-white/10 p-2 sm:p-4 rounded-lg backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-xs sm:text-sm">إجمالي العملاء</p>
                      <p className="text-lg sm:text-2xl font-bold mt-1">
                        {statistics.totalCustomers}
                      </p>
                    </div>
                    <Icon icon="mdi:account-group" className="w-5 h-5 sm:w-8 sm:h-8 text-white/80" />
                  </div>
                </div>
                
                <div className="bg-white/10 p-2 sm:p-4 rounded-lg backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-xs sm:text-sm">عملاء لديهم متبقي</p>
                      <p className="text-lg sm:text-2xl font-bold mt-1">
                        {statistics.customersWithRemainingCount}
                      </p>
                    </div>
                    <Icon icon="mdi:account-cash" className="w-5 h-5 sm:w-8 sm:h-8 text-white/80" />
                  </div>
                </div>
                
                <div className="bg-white/10 p-2 sm:p-4 rounded-lg backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-xs sm:text-sm">إجمالي المتبقي</p>
                      <p className="text-lg sm:text-2xl font-bold mt-1">
                        {statistics.totalOutstandingBalance.toFixed(2)} $
                      </p>
                    </div>
                    <Icon icon="mdi:cash-multiple" className="w-5 h-5 sm:w-8 sm:h-8 text-white/80" />
                  </div>
                </div>
                
                <div className="bg-white/10 p-2 sm:p-4 rounded-lg backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-xs sm:text-sm">متوسط الرصيد</p>
                      <p className="text-lg sm:text-2xl font-bold mt-1">
                        {statistics.averageRemaining.toFixed(2)} $
                      </p>
                    </div>
                    <Icon icon="mdi:chart-bar" className="w-5 h-5 sm:w-8 sm:h-8 text-white/80" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="p-3 sm:p-6">
                {customersWithRemainingBalance.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <Icon 
                      icon="mdi:database" 
                      className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4"
                    />
                    <h3 className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      لا توجد بيانات للعملاء
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      لم يتم تحميل بيانات العملاء بعد
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4 pb-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon icon="mdi:sort" className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">مرتب حسب الرصيد المتبقي (من الأعلى إلى الأقل)</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        إظهار {customersWithRemainingBalance.length} عميل
                      </div>
                    </div>
                    
                    {customersWithRemainingBalance.map((customer, index) => (
                      <div 
                        key={customer.id}
                        className={`rounded-lg p-3 sm:p-4 border transition-all duration-200 ${
                          customer.hasRemaining 
                            ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700' 
                            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="relative shrink-0">
                              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg ${
                                customer.hasRemaining 
                                  ? 'bg-gradient-to-br from-red-500 to-red-600' 
                                  : 'bg-gradient-to-br from-green-500 to-green-600'
                              }`}>
                                {customer.companyName?.charAt(0) || customer.name?.charAt(0) || "?"}
                              </div>
                              {customer.hasRemaining && index < 3 && (
                                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 sm:w-6 sm:h-6 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                  #{index + 1}
                                </div>
                              )}
                              {!customer.hasRemaining && (
                                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                  <Icon icon="mdi:check" className="w-3 h-3" />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
                                {customer.companyName || customer.name || `عميل #${customer.id}`}
                                {customer.hasRemaining && (
                                  <Icon icon="mdi:alert-circle" className="inline-block w-4 h-4 text-red-500 ml-1" />
                                )}
                              </h3>
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 mt-1">
                                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                  {customer.phone}
                                </span>
                                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                  {customer.email}
                                </span>
                                {customer.paymentCount > 0 && (
                                  <span className="text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-300">
                                    {customer.paymentCount} دفعة
                                  </span>
                                )}

                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 sm:gap-6">
                            <div className="text-right">
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">الرصيد المتبقي</p>
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <span className={`font-bold text-base sm:text-lg ${
                                  customer.remaining > 0 
                                    ? 'text-red-600 dark:text-red-400' 
                                    : 'text-green-600 dark:text-green-400'
                                }`}>
                                  {customer.remaining.toFixed(2)} $
                                </span>
                                {customer.totalPaid > 0 && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    (دفع {customer.totalPaid.toFixed(2)} $)
                                  </span>
                                )}
                              </div>
                              {customer.totalAmount > 0 && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                 
                                </p>
                              )}
                              {customer.latestPaymentDate && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  آخر دفعة: {new Date(customer.latestPaymentDate).toLocaleDateString('ar-SA')}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => {
                                  setCustomerFilter(customer.id.toString());
                                  setShowCustomerModal(false);
                                }}
                                className="p-1.5 sm:p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
                                title="تصفية حسب هذا العميل"
                              >
                                <Icon icon="mdi:filter" className="w-4 h-4 sm:w-5 sm:h-5" />
                              </button>
                        
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-2 sm:p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  <Icon icon="mdi:information" className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>انقر على أيقونة الفلتر لعرض دفعات العميل المحدد</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>رصيد متبقي</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>مدفوع بالكامل</span>
                  </div>
                </div>
                
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">تم التحديث:</span> {new Date().toLocaleDateString('ar-SA')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PaymentsContainer;