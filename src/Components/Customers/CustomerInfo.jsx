import { useParams } from "react-router";
import {
  useShowOneCustomerQuery,
} from "../../RtkQuery/Slice/Customers/CustomersApi";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { DeleteDialog } from "../../utils/Dialogs/DeleteDialog/DeleteDialog";
import { DynamicTable } from "../../utils/Tables/DynamicTable";
import { BookingCustomerColumns } from "../../utils/Tables/ColumnsTable/BookingByCustomerColumns";
import { PaymentsCustomerColumns } from "../../utils/Tables/ColumnsTable/PaymentsCustomerColumns";
import { ViewImageDialog } from "../Payments/ViewImageDialog";
import InvoicePdf from "../Payments/InvoicePdf";
import { Permissions } from "../../Static/StaticData";
import { DialogAddPayments } from "../../utils/Dialogs/EditAddDialog/Add/DialogAddPayments";
import HeaderComponent from "../../utils/HeaderComponent";
import InvoiceExcel from "../Payments/InvoiceExcel";
import CustomerFormDialog from "../../Pages/Customers/CustomerFormDialog";
import { Toaster } from "react-hot-toast";
import AddDiscountDialog from "./AddDiscountDialog";  
import { BookingCustomerDiscounts } from "../../utils/Tables/ColumnsTable/BookingCustomerDiscounts";
import useCustomers from "../../hooks/useCustomers";
import SkeletonLoader from "../../utils/SkeletonLoader";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CustomerInfo = () => {
  const { id } = useParams();
  const [showAccountStatement, setShowAccountStatement] = useState(false);
  const [selectedPdfType, setSelectedPdfType] = useState("summary");

  const {
    data: customer,
    isFetching,
    isLoading: isLoadingCustomer, 
    refetch, 
  } = useShowOneCustomerQuery(id);

  const {
    setOpenAddPayment,
    showBookings,
    setShowBooking,
    showPayments,
    setShowPayments,
    showDiscounts,
    setShowDiscounts,
    openViewImage,
    setOpenViewImage,
    selectedPayment,
    openDel,
    setOpenDel,
    isFormDialogOpen,
    setIsFormDialogOpen,
    isAddDiscountDialogOpen,
    setIsAddDiscountDialogOpen,
    updateCustomer,
    isUpdating,
    addDiscount,
    isAddingDiscount,
    hasPermission, 
    isDeleting,
    handleFormSuccess,
    handleDiscountSuccess,
    handelDelete,
    onShowBookingDetails,
    onShowPaymentImage,
    openAddPayment
  } = useCustomers({refetch , id});

  const printCustomerSummaryReport = () => {
    if (!customer) return;
    
    const customerData = customer;
    const currentDate = new Date().toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });

    const formatCurrency = (val) => {
      if (val == null || isNaN(Number(val))) return "0.00 $";
      return Number(val).toFixed(2) + " $";
    };

    const getPaymentStatusText = (status) => {
      switch(status) {
        case 1: return "معلق";
        case 2: return "مقبول";
        case 3: return "مرفوض";
        default: return "غير محدد";
      }
    };

    const getPaymentStatusClass = (status) => {
      switch(status) {
        case 1: return "status-waiting";
        case 2: return "status-accepted";
        case 3: return "status-rejected";
        default: return "";
      }
    };

    // Calculate totals
    const totalPayments = customerData?.payments?.length || 0;
    const totalPaidAmount = customerData?.payments?.reduce((sum, p) => sum + (parseFloat(p.paid) || 0), 0) || 0;
    const totalRemaining = customerData?.remaining || 0;
    const totalAmount = customerData?.total || 0;

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>كشف حساب الزبون - ${customerData.full_name}</title>
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
            line-height: 1.6;
            color: #333;
            padding: 20px;
            background-color: #fff;
          }
          
          .print-container {
            max-width: 1000px;
            margin: 0 auto;
            border: 3px solid #1e40af;
            border-radius: 15px;
            padding: 30px;
            background-color: #fff;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
          }
          
          .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 25px;
            border-bottom: 4px solid #1e40af;
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            border-radius: 12px;
            padding: 35px;
          }
          
          .header h1 {
            font-size: 36px;
            margin-bottom: 15px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
          }
          
          .header p {
            font-size: 18px;
            opacity: 0.95;
            margin-top: 10px;
          }
          
          .customer-header {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin: 30px 0;
            background-color: #f8fafc;
            padding: 25px;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
          }
          
          .customer-basic-info, .customer-contact-info {
            padding: 20px;
          }
          
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            padding: 10px;
            background-color: white;
            border-radius: 8px;
            border: 1px solid #f1f5f9;
          }
          
          .info-label {
            font-weight: bold;
            color: #4b5563;
            font-size: 16px;
          }
          
          .info-value {
            color: #1f2937;
            font-weight: 600;
            font-size: 16px;
            text-align: left;
          }
          
          .financial-summary {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border-radius: 15px;
            padding: 30px;
            margin: 40px 0;
            border: 2px solid #bae6fd;
          }
          
          .financial-title {
            text-align: center;
            font-size: 28px;
            color: #1e40af;
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 3px solid #93c5fd;
          }
          
          .financial-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
          }
          
          .financial-card {
            background-color: white;
            padding: 25px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            border: 1px solid #dbeafe;
          }
          
          .financial-value {
            font-size: 32px;
            font-weight: bold;
            color: #1e40af;
            margin: 15px 0;
            direction: ltr;
          }
          
          .financial-label {
            font-size: 16px;
            color: #6b7280;
            font-weight: 600;
          }
          
          .section-title {
            font-size: 26px;
            color: #1e40af;
            margin: 40px 0 25px 0;
            padding-bottom: 15px;
            border-bottom: 3px solid #e5e7eb;
            text-align: center;
          }
          
          .payments-section, .bookings-section, .discounts-section {
            margin-bottom: 40px;
            padding: 25px;
            background-color: white;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            border: 1px solid #e5e7eb;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          
          table th {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            padding: 18px;
            text-align: center;
            font-weight: bold;
            font-size: 18px;
            border: none;
          }
          
          table td {
            padding: 15px;
            text-align: center;
            border: 1px solid #e5e7eb;
            font-size: 16px;
          }
          
          table tr:nth-child(even) {
            background-color: #f8fafc;
          }
          
          .status-badge {
            padding: 8px 20px;
            border-radius: 25px;
            font-weight: bold;
            font-size: 14px;
            display: inline-block;
            min-width: 100px;
          }
          
          .status-waiting {
            background-color: #fef3c7;
            color: #92400e;
            border: 2px solid #fbbf24;
          }
          
          .status-accepted {
            background-color: #d1fae5;
            color: #065f46;
            border: 2px solid #10b981;
          }
          
          .status-rejected {
            background-color: #fee2e2;
            color: #991b1b;
            border: 2px solid #ef4444;
          }
          
          .amount-cell {
            font-weight: bold;
            color: #1e40af;
            direction: ltr;
          }
          
          .total-row {
            background-color: #1e40af !important;
            color: white !important;
            font-weight: bold;
            font-size: 18px;
          }
          
          .no-data {
            text-align: center;
            padding: 30px;
            color: #6b7280;
            font-size: 18px;
            font-style: italic;
          }
          
          .summary-row {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin: 30px 0;
            padding: 20px;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-radius: 12px;
            border: 2px solid #e5e7eb;
          }
          
          .summary-item {
            text-align: center;
            padding: 15px;
          }
          
          .summary-value {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
            margin: 10px 0;
          }
          
          .summary-label {
            font-size: 14px;
            color: #6b7280;
          }
          
          .footer {
            margin-top: 50px;
            padding-top: 25px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            background-color: #f8fafc;
            padding: 25px;
            border-radius: 12px;
          }
          
          @media print {
            body {
              padding: 0;
            }
            
            .print-container {
              border: none;
              padding: 0;
              box-shadow: none;
            }
            
            .no-print {
              display: none;
            }
            
            table {
              page-break-inside: avoid;
            }
          }
          
          .print-button {
            position: fixed;
            top: 20px;
            left: 20px;
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            padding: 12px 25px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-family: 'Amiri', serif;
            font-size: 16px;
            font-weight: bold;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <div class="header">
            <h1>كشف حساب الزبون</h1>
            <p>${customerData.full_name}</p>
            <p>تاريخ الإصدار: ${currentDate}</p>
          </div>
          
          <div class="customer-header">
            <div class="customer-basic-info">
              <div class="info-row">
                <span class="info-label">اسم الشركة:</span>
                <span class="info-value">${customerData.company_name || "غير محدد"}</span>
              </div>
              <div class="info-row">
                <span class="info-label">رقم الهاتف:</span>
                <span class="info-value">${customerData.phone_number || "غير محدد"}</span>
              </div>
              <div class="info-row">
                <span class="info-label">البريد الإلكتروني:</span>
                <span class="info-value">${customerData.email || "غير محدد"}</span>
              </div>
              <div class="info-row">
                <span class="info-label">رقم السجل التجاري:</span>
                <span class="info-value">${customerData.commercial_registration_number || "غير محدد"}</span>
              </div>
            </div>
            
            <div class="customer-contact-info">
              <div class="info-row">
                <span class="info-label">العنوان:</span>
                <span class="info-value">${customerData.address || "غير محدد"}</span>
              </div>
              <div class="info-row">
                <span class="info-label">تاريخ الإنشاء:</span>
                <span class="info-value">${new Date(customerData.created_at).toLocaleDateString('ar-EG')}</span>
              </div>
              <div class="info-row">
                <span class="info-label">آخر تحديث:</span>
                <span class="info-value">${new Date(customerData.updated_at).toLocaleDateString('ar-EG')}</span>
              </div>
              <div class="info-row">
                <span class="info-label">كود الزبون:</span>
                <span class="info-value">${customerData.id || "غير محدد"}</span>
              </div>
            </div>
          </div>
          
          <div class="financial-summary">
            <h2 class="financial-title">الملخص المالي</h2>
            <div class="financial-grid">
              <div class="financial-card">
                <div class="financial-value">${formatCurrency(customerData.total)}</div>
                <div class="financial-label">إجمالي المستحق</div>
              </div>
              <div class="financial-card">
                <div class="financial-value">${formatCurrency(customerData.total_paid)}</div>
                <div class="financial-label">إجمالي المدفوع</div>
              </div>
              <div class="financial-card">
                <div class="financial-value">${formatCurrency(customerData.remaining)}</div>
                <div class="financial-label">الرصيد المتبقي</div>
              </div>
              <div class="financial-card">
                <div class="financial-value">${customerData.customer_account || "غير محدد"}</div>
                <div class="financial-label">رصيد الزبون</div>
              </div>
            </div>
          </div>
          
         <!-- المدفوعات -->
<div class="payments-section">
  <h2 class="section-title">تفاصيل المدفوعات</h2>
  
  ${customerData?.payments && customerData.payments.length > 0 ? `
    <div class="summary-row">
      <div class="summary-item">
        <div class="summary-value">${totalPayments}</div>
        <div class="summary-label">عدد المدفوعات</div>
      </div>
      <div class="summary-item">
        <div class="summary-value">${formatCurrency(totalPaidAmount)}</div>
        <div class="summary-label">مجموع المدفوع</div>
      </div>
      <div class="summary-item">
        <div class="summary-value">${formatCurrency(totalRemaining)}</div>
        <div class="summary-label">المتبقي الإجمالي</div>
      </div>
      <div class="summary-item">
        <div class="summary-value">${formatCurrency(totalAmount)}</div>
        <div class="summary-label">المبلغ الإجمالي</div>
      </div>
    </div>
    
    <table>
      <thead>
        <tr>
          <th>رقم الدفعة</th>
          <th>المبلغ المدفوع</th>
          <th>المبلغ المتبقي</th>
          <th>المبلغ الكلي</th>
          <th>تاريخ الدفع</th>
          <th>الموظف</th>
        </tr>
      </thead>
      <tbody>
        ${customerData.payments.map(payment => `
          <tr>
            <td>${payment.payment_number || "غير محدد"}</td>
            <td class="amount-cell">${parseFloat(payment.paid || 0).toFixed(2)} $</td>
            <td class="amount-cell">${parseFloat(payment.remaining || 0).toFixed(2)} $</td>
            <td class="amount-cell">${parseFloat(payment.total || 0).toFixed(2)} $</td>
            <td>${payment.date || "غير محدد"}</td>
            <td>${payment.user?.full_name || "غير محدد"}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : `
    <div class="no-data">
      <p>لا توجد مدفوعات مسجلة لهذا الزبون</p>
    </div>
  `}
</div>

<!-- فاصل بين القسمين -->
<div style="margin: 50px 0; height: 4px; background: linear-gradient(90deg, transparent, #1e40af, transparent); border-radius: 2px;"></div>

<!-- الحجوزات - الكود النهائي المصحح -->
<div class="bookings-section">
  <h2 class="section-title">تفاصيل الحجوزات</h2>
  
  ${customerData?.bookings && customerData.bookings.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th>رقم الحجز</th>
          <!-- تم حذف: نوع اللوحة -->
          <th>العنوان</th>
          <th>تاريخ البدء</th>
          <th>تاريخ الانتهاء</th>
          <th>الإجمالي</th>
        </tr>
      </thead>
      <tbody>
        ${customerData.bookings.map(booking => {
          // الحصول على العنوان من بيانات الزبون المرتبطة
          // هذه هي النقطة المهمة: استخدام booking.customer?.address
          const address = booking.customer?.address || 
                         booking.customer_address || 
                         customerData.address || // إذا فشل الأول جرب عنوان الزبون الرئيسي
                         "غير محدد";
          
          // استخدام السعر الإجمالي
          const total = booking.total_price || 0;
          
          return `
            <tr>
              <td>${booking.id || "غير محدد"}</td>
              <!-- تم حذف: نوع اللوحة -->
              <td>${address}</td>
              <td>${booking.start_date ? new Date(booking.start_date).toLocaleDateString('ar-EG') : "غير محدد"}</td>
              <td>${booking.end_date ? new Date(booking.end_date).toLocaleDateString('ar-EG') : "غير محدد"}</td>
              <td class="amount-cell">${total.toFixed(2)} $</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  ` : `
    <div class="no-data">
      <p>لا توجد حجوزات مسجلة لهذا الزبون</p>
    </div>
  `}
</div>
          
        
          
          <div class="footer">
            <p>نظام إدارة العملاء - Syrian Advertising</p>
            <p>تم الإنشاء آلياً بتاريخ ${currentDate}</p>
            <p>رقم الزبون: ${customerData.id} | التاريخ: ${currentDate}</p>
          </div>
        </div>
        
        <button class="print-button no-print" onclick="window.print()">🖨️ طباعة كشف الحساب</button>
        
        <script>
          setTimeout(() => {
            window.print();
          }, 1000);
          
          window.onafterprint = function() {
            window.close();
          };
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleDownloadPDF = () => {
    if (!customer) {
      alert("لا يوجد بيانات للزبون");
      return;
    }
    
    switch(selectedPdfType) {
      case "summary":
        printCustomerSummaryReport();
        break;
      case "detailed":
        printCustomerSummaryReport(); // Using same detailed report for now
        break;
      default:
        printCustomerSummaryReport();
    }
  };

  if (isFetching) {
    return <SkeletonLoader />;
  }

  if (!customer) {
    return (
      <div className="p-4 text-center text-red-500 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl border border-red-200 dark:border-red-800">
        الزبون غير متوفر
      </div>
    );
  }


{/*
  
  <!-- الحجوزات -->
<div class="bookings-section">
  <h2 class="section-title">تفاصيل الحجوزات</h2>
  
  ${customerData?.bookings && customerData.bookings.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th>رقم الحجز</th>
          <th>نوع اللوحة</th>
          <th>الحجم</th>
          <th>المدينة</th>
          <th>تاريخ البدء</th>
          <th>تاريخ الانتهاء</th>
          <!-- تم حذف: الحالة -->
          <th>السعر</th>
        </tr>
      </thead>
      <tbody>
        ${customerData.bookings.map(booking => {
          // استخراج قيم من الإستجابة الجديدة
          const city = booking.roadsigns && booking.roadsigns.length > 0 
            ? booking.roadsigns[0].city?.name 
            : "غير محدد";
          
          const template = booking.roadsigns && booking.roadsigns.length > 0
            ? booking.roadsigns[0].template?.model
            : "غير محدد";
          
          const size = booking.roadsigns && booking.roadsigns.length > 0
            ? booking.roadsigns[0].template?.size
            : "غير محدد";
          
          // استخدام السعر من booking.total_price بدلاً من booking.price
          const price = booking.total_price || booking.total_price_per_month || 0;
          
          return `
            <tr>
              <td>${booking.id || "غير محدد"}</td>
              <td>${template}</td>
              <td>${size}</td>
              <td>${city}</td>
              <td>${booking.start_date ? new Date(booking.start_date).toLocaleDateString('ar-EG') : "غير محدد"}</td>
              <td>${booking.end_date ? new Date(booking.end_date).toLocaleDateString('ar-EG') : "غير محدد"}</td>
              <!-- تم حذف: الحالة -->
              <td class="amount-cell">${price.toFixed(2)} $</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  ` : `
    <div class="no-data">
      <p>لا توجد حجوزات مسجلة لهذا الزبون</p>
    </div>
  `}
</div>
  */}

  return (
    <div dir="rtl" className="p-3 sm:p-4 md:p-6 max-w-7xl w-full mx-auto">
      <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-800 dark:via-gray-900 dark:to-blue-900/30 rounded-2xl p-4 sm:p-6 mb-6 border border-blue-100 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
              معلومات الزبون
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
              تفاصيل كاملة عن الزبون وحسابه
            </p>
          </div>
          
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-2 w-full lg:w-auto">
            <Button
              onClick={() => setShowAccountStatement(true)}
              className="gap-1 sm:gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white cursor-pointer col-span-2 xs:col-span-3 sm:col-span-4 lg:col-span-2 shadow-md hover:shadow-lg transition-all duration-200"
              size="sm"
            >
              <Icon icon="mdi:file-document" className="text-lg sm:text-xl" />
              <span className="text-xs sm:text-sm">كشف حساب الزبون</span>
            </Button>

            {hasPermission(Permissions.EditCustomers) && (
              <Button
                onClick={() => setIsFormDialogOpen(true)}
                variant="outline"
                className="gap-1 sm:gap-2 cursor-pointer border-blue-200 hover:bg-blue-50 hover:border-blue-300 dark:border-blue-700 dark:hover:bg-blue-900/30 transition-all duration-200"
                size="sm"
              >
                <Icon icon="mdi:pencil" className="text-base sm:text-lg text-blue-600 dark:text-blue-400" />
                <span className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">تعديل</span>
              </Button>
            )}

            {hasPermission(Permissions.EditCustomers) && (
              <Button
                onClick={() => setIsAddDiscountDialogOpen(true)}
                variant="outline"
                className="gap-1 sm:gap-2 cursor-pointer border-green-200 hover:bg-green-50 hover:border-green-300 dark:border-green-700 dark:hover:bg-green-900/30 transition-all duration-200"
                size="sm"
              >
                <Icon icon="mdi:percent" className="text-base sm:text-lg text-green-600 dark:text-green-400" />
                <span className="text-xs sm:text-sm text-green-600 dark:text-green-400">حسم</span>
              </Button>
            )}

            <Button
              onClick={() => setShowBooking((prev) => !prev)}
              className="gap-1 sm:gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white cursor-pointer shadow-md hover:shadow-lg transition-all duration-200"
              size="sm"
            >
              <Icon 
                icon={showBookings ? "mdi:eye-off" : "mdi:eye"} 
                className="text-base sm:text-lg" 
              />
              <span className="text-xs sm:text-sm">{showBookings ? "إخفاء" : "عرض الحجوزات"}</span>
            </Button>

            <Button
              onClick={() => setShowPayments((prev) => !prev)}
              className="gap-1 sm:gap-2 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white cursor-pointer shadow-md hover:shadow-lg transition-all duration-200"
              size="sm"
            >
              <Icon 
                icon={showPayments ? "mdi:eye-off" : "mdi:eye"} 
                className="text-base sm:text-lg" 
              />
              <span className="text-xs sm:text-sm">{showPayments ? "إخفاء" : " عرض الدفعات"}</span>
            </Button>

            <Button
              onClick={() => setShowDiscounts((prev) => !prev)}
              className="gap-1 sm:gap-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white cursor-pointer shadow-md hover:shadow-lg transition-all duration-200"
              size="sm"
            >
              <Icon 
                icon={showDiscounts ? "mdi:eye-off" : "mdi:eye"} 
                className="text-base sm:text-lg" 
              />
              <span className="text-xs sm:text-sm">{showDiscounts ? "إخفاء" : "عرض الخصومات"}</span>
            </Button>

            {hasPermission(Permissions.DeleteCustomers) && (
              <Button
                onClick={() => setOpenDel(true)}
                className="gap-1 sm:gap-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white cursor-pointer shadow-md hover:shadow-lg transition-all duration-200"
                size="sm"
              >
                <Icon icon="mdi:trash" className="text-base sm:text-lg" />
                <span className="text-xs sm:text-sm">حذف</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-800 dark:via-gray-900 dark:to-blue-900/20 border-0 shadow-xl rounded-2xl overflow-hidden mb-6 transition-all duration-300 hover:shadow-2xl">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-lg opacity-30 animate-pulse"></div>
              <Avatar className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 border-4 border-white dark:border-gray-800 shadow-lg relative z-10">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-2xl sm:text-3xl text-white font-bold">
                  {customer.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <div className="text-center space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                {customer.full_name}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                <span className="font-semibold text-gray-700 dark:text-gray-200">الشركة: </span>
                {customer.company_name}
              </p>
            </div>

            <Badge className={`text-lg px-6 py-3 bg-gradient-to-r border-0 shadow-lg animate-pulse ${
              customer?.remaining > 0 
                ? 'from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700' 
                : 'from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
            } text-white`}>
              <Icon icon="mdi:currency-usd" className="ml-2 text-xl" />
              الرصيد المتبقي : {customer?.remaining?.toFixed(2)} $
            </Badge>
          </div>
        </CardContent>
      </Card>

     <Dialog open={showAccountStatement} onOpenChange={setShowAccountStatement}>
  <DialogContent className="max-w-[95vw] w-[95vw] sm:max-w-[90vw] sm:w-[90vw] md:max-w-[800px] md:w-[800px] lg:max-w-[900px] lg:w-[900px] max-h-[95vh] overflow-y-auto p-3 sm:p-4 md:p-6 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20">
    <DialogHeader>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <DialogTitle className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-center sm:text-right mb-2">
            📊 كشف حساب الزبون - {customer.full_name} (رقم: {customer.id})
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 dark:text-gray-400 text-center sm:text-right">
            تفاصيل كاملة عن الزبون وحسابه المالي
          </DialogDescription>
        </div>
        <Badge className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
          التاريخ: {new Date().toLocaleDateString('ar-EG')}
        </Badge>
      </div>
    </DialogHeader>

    <div className="space-y-6">
      {/* Customer Information Section */}
      <Card className="border border-blue-200 dark:border-blue-700 bg-white/50 dark:bg-gray-800/50">
        <CardContent className="p-4 sm:p-6">
          <h3 className="text-lg font-semibold mb-4 text-blue-700 dark:text-blue-300 flex items-center gap-2">
            <Icon icon="mdi:account-details" className="text-xl" />
            معلومات الزبون
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400 font-medium">الاسم الكامل:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{customer.full_name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400 font-medium">اسم الشركة:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{customer.company_name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400 font-medium">رقم الهاتف:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{customer.phone_number}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400 font-medium">البريد الإلكتروني:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{customer.email}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400 font-medium">رقم السجل التجاري:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{customer.commercial_registration_number || "غير محدد"}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                {/*
                                <span className="font-semibold text-gray-800 dark:text-gray-200">{customer.address || "غير محدد"}</span>
                                <span className="text-gray-600 dark:text-gray-400 font-medium">العنوان:</span>

                */}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary Section */}
      <Card className="border border-green-200 dark:border-green-700 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
        <CardContent className="p-4 sm:p-6">
          <h3 className="text-lg font-semibold mb-4 text-green-700 dark:text-green-300 flex items-center gap-2">
            <Icon icon="mdi:finance" className="text-xl" />
            الملخص المالي
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-center shadow-sm">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {customer?.total?.toFixed(2) || "0.00"} $
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                إجمالي المستحق
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-center shadow-sm">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {customer?.total_paid?.toFixed(2) || "0.00"} $
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                إجمالي المدفوع
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-center shadow-sm">
              <div className={`text-2xl font-bold ${
                customer?.remaining > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
              }`}>
                {customer?.remaining?.toFixed(2) || "0.00"} $
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                الرصيد المتبقي
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-center shadow-sm">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {customer?.customer_account || "0"}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                رصيد الحساب
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Summary */}
      <Card className="border border-blue-200 dark:border-blue-700">
        <CardContent className="p-4 sm:p-6">
          <h3 className="text-lg font-semibold mb-4 text-blue-700 dark:text-blue-300 flex items-center gap-2">
            <Icon icon="mdi:cash-multiple" className="text-xl" />
            ملخص المدفوعات
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">عدد المدفوعات:</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{customer?.payments?.length || 0}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">إجمالي المدفوع</div>
                <div className="text-lg font-bold text-green-600 dark:text-green-400">{customer?.total_paid?.toFixed(2)} $</div>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">المبلغ المتبقي</div>
                <div className={`text-lg font-bold ${
                  customer?.remaining > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                }`}>
                  {customer?.remaining?.toFixed(2)} $
                </div>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">إجمالي المستحق</div>
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{customer?.total?.toFixed(2)} $</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <div className="flex flex-col sm:flex-row gap-3 justify-between items-center pt-4 border-t mt-6">
      <div className="text-sm text-gray-500 dark:text-gray-400">
        <p>تم إنشاء كشف الحساب في: {new Date().toLocaleString('ar-EG')}</p>
        <p>رقم الزبون: {customer.id}</p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => setShowAccountStatement(false)}
          className="border-gray-300 dark:border-gray-600"
        >
          إغلاق
        </Button>
        <Button
          onClick={printCustomerSummaryReport}
          className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
        >
          <Icon icon="mdi:printer" className="text-lg" />
          <span>طباعة كشف الحساب</span>
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>

      {showBookings && (
        <Card className="mt-6 sm:mt-8 border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-emerald-900/20 shadow-xl rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
          <CardContent className="p-4 sm:p-6">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              📅 الحجوزات الخاصة بالزبون
            </h1>
            <DynamicTable
              data={customer?.bookings || []}
              columns={BookingCustomerColumns}
              isLoading={isLoadingCustomer}
              onShow={onShowBookingDetails}
              permissions={{
                show: Permissions.ViewBookings,
              }}
            />
          </CardContent>
        </Card>
      )}

      {showPayments && (
        <Card className="mt-6 sm:mt-8 border-0 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-cyan-900/20 shadow-xl rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
          <CardContent className="p-4 sm:p-6">
            <HeaderComponent
              title={"💳 المدفوعات الخاصة بالزبون"}
              titleBtn={"إضافة دفعة"}
              setShow={setOpenAddPayment}
              permission={Permissions.CreatePayments}
            />
            <div className="my-4 flex flex-col xs:flex-row gap-3 justify-between items-center">
              <InvoicePdf
                customer={customer}
                showCustomerTable={true}
                showCustomerPaymentsTable={true}
              />
              <InvoiceExcel
                customer={customer}
                showCustomerTable={true}
                showCustomerPaymentsTable={true}
              />
            </div>
            <DynamicTable
              data={customer?.payments || []}
              columns={PaymentsCustomerColumns}
              isLoading={isLoadingCustomer}
              onShow={onShowPaymentImage}
              permissions={{
                show: Permissions.ViewPayments,
              }}
            />
          </CardContent>
        </Card>
      )}

      {showDiscounts && (
        <Card className="mt-6 sm:mt-8 border-0 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-800 dark:to-amber-900/20 shadow-xl rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
          <CardContent className="p-4 sm:p-6">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-4 bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              🎯 الخصومات الخاصة بالزبون
            </h1>
            <DynamicTable
              data={customer?.discounts || []}
              columns={BookingCustomerDiscounts}
              isLoading={isLoadingCustomer}
            />
          </CardContent>
        </Card>
      )}

      <ViewImageDialog
        show={openViewImage}
        handleClose={() => setOpenViewImage(false)}
        imageUrl={
          selectedPayment?.payment_image
            ? `https://road.levantmenu.ae/storage/${selectedPayment.payment_image}`
            : null
        }
        paymentNumber={selectedPayment?.payment_number}
      />

      <DeleteDialog
        open={openDel}
        loading={isDeleting}
        onClose={() => setOpenDel(false)}
        onConfirm={handelDelete}
      />

      <DialogAddPayments
        show={openAddPayment}
        handleClose={() => {
          setOpenAddPayment(false);
          refetch();
        }}
        id={id}
      />

      <CustomerFormDialog
        open={isFormDialogOpen}
        onOpenChange={(isOpen) => {
          setIsFormDialogOpen(isOpen);
        }}
        initialData={customer}
        onSuccess={handleFormSuccess}
        updateCustomerMutation={updateCustomer}
        isUpdating={isUpdating}
      />

      <AddDiscountDialog
        open={isAddDiscountDialogOpen}
        onOpenChange={(isOpen) => setIsAddDiscountDialogOpen(isOpen)}
        customerId={id}
        onSuccess={handleDiscountSuccess}
        addDiscountMutation={addDiscount}
        isAdding={isAddingDiscount}
        remainingBalance={customer?.remaining || 0}
      />
      <Toaster />
    </div>
  );
};

export default CustomerInfo;