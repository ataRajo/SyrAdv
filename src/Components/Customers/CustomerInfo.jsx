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
import DetailCard from "../../utils/DetailCard";
import AddDiscountDialog from "./AddDiscountDialog";  
import { BookingCustomerDiscounts } from "../../utils/Tables/ColumnsTable/BookingCustomerDiscounts";
import useCustomers from "../../hooks/useCustomers";
import SkeletonLoader from "../../utils/SkeletonLoader";
import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "../../assets/fonts/Amiri-Regular.js";

const CustomerInfo = () => {
  const { id } = useParams();
  const [showAccountStatement, setShowAccountStatement] = useState(false);
  const pdfRef = useRef();
  
/**
 * Render customer data into a hidden HTML element, capture with html2canvas,
 * and save as PDF using jsPDF. Uses Google Fonts Amiri (injected at runtime).
 *
 * @param {Object} details  - customer object (same shape you used)
 */


  
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
  } =  useCustomers({refetch , id})

  // ✅ SIMPLIFIED PDF DOWNLOAD FUNCTION
// ✅ FIXED PDF DOWNLOAD FUNCTION - Using simple colors and better error handling
// import html2canvas from 'html2canvas';
// import jsPDF from 'jspdf';

// import jsPDF from 'jspdf';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const downloadCustomerPDF = async () => {
  try {
    // Get customer data safely
    const customerData = customer || {};
    const safe = (v) => (v === null || v === undefined || v === "" ? "غير محدد" : String(v));

    const formatCurrency = (val) => {
      if (val == null || isNaN(Number(val))) return "0.00 $";
      return (
        Number(val).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) + " $"
      );
    };

    const createdAt = customerData?.created_at
      ? new Date(customerData.created_at).toLocaleDateString("ar-EG")
      : "";
    const updatedAt = customerData?.updated_at
      ? new Date(customerData.updated_at).toLocaleDateString("ar-EG")
      : "";

    // Build HTML content as a string (safe inline styles only)
    const html = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <meta http-equiv="X-UA-Compatible" content="IE=edge" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>كشف حساب الزبون</title>
          <style>
            /* Minimal reset to avoid inheriting parent styles; no oklch, no external CSS */
            * { box-sizing: border-box; }
            html, body {
              margin: 0; padding: 0; background: #ffffff; color: #000000;
              font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6;
              direction: rtl; text-align: right;
            }
            .page {
              width: 210mm; padding: 20mm; background: #ffffff; color: #000000;
            }
            .header {
              text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000000; padding-bottom: 10px;
            }
            .header h1 { font-size: 24px; font-weight: bold; margin: 0; color: #000000; }
            .header p { font-size: 14px; margin: 5px 0 0 0; color: #000000; }
            .section { margin-bottom: 20px; }
            .section div { margin-bottom: 8px; }
            .summary {
              background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; border: 1px solid #dddddd; color: #000000;
            }
            .summary strong { color: #000000; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .footer {
              margin-top: 30px; text-align: center; border-top: 1px solid #000000; padding-top: 10px; color: #000000;
            }
            .footer div { font-size: 12px; color: #000000; }
          </style>
        </head>
        <body>
          <div class="page" id="pdf-root">
            <div class="header">
              <h1>كشف حساب الزبون</h1>
              <p>تاريخ الإصدار: ${new Date().toLocaleDateString("ar-EG")}</p>
            </div>

            <div class="section">
              <div><strong style="color:#000000;">الاسم الكامل:</strong> <span style="color:#000000;">${safe(customerData?.full_name)}</span></div>
              <div><strong style="color:#000000;">اسم الشركة:</strong> <span style="color:#000000;">${safe(customerData?.company_name)}</span></div>
              <div><strong style="color:#000000;">رقم الهاتف:</strong> <span style="color:#000000;">${safe(customerData?.phone_number)}</span></div>
              <div><strong style="color:#000000;">العنوان:</strong> <span style="color:#000000;">${safe(customerData?.address)}</span></div>
              ${customerData?.email ? `<div><strong style="color:#000000;">البريد الإلكتروني:</strong> <span style="color:#000000;">${safe(customerData.email)}</span></div>` : ""}
              ${customerData?.commercial_registration_number ? `<div><strong style="color:#000000;">رقم السجل التجاري:</strong> <span style="color:#000000;">${safe(customerData.commercial_registration_number)}</span></div>` : ""}
              ${createdAt ? `<div><strong style="color:#000000;">تاريخ الإنشاء:</strong> <span style="color:#000000;">${createdAt}</span></div>` : ""}
              ${updatedAt ? `<div><strong style="color:#000000;">آخر تحديث:</strong> <span style="color:#000000;">${updatedAt}</span></div>` : ""}
            </div>

            <div class="summary">
              <div style="text-align: center; margin-bottom: 10px;">
                <strong style="font-size: 18px; color:#000000;">الملخص المالي</strong>
              </div>
              <div class="grid">
                <div style="color:#000000;"><strong>الرصيد المتبقي:</strong> ${formatCurrency(customerData?.remaining)}</div>
                <div style="color:#000000;"><strong>إجمالي المدفوعات:</strong> ${formatCurrency(customerData?.total_paid)}</div>
                <div style="color:#000000;"><strong>إجمالي المستحق:</strong> ${formatCurrency(customerData?.total)}</div>
                <div style="color:#000000;"><strong>دفعة بدائية:</strong> ${formatCurrency(customerData?.customer_account)}</div>
              </div>
            </div>

            <div class="footer">
              <div><strong>تم إنشاء هذا الكشف بتاريخ ${new Date().toLocaleDateString("ar-EG")}</strong></div>
              <div>نظام إدارة العملاء - Syrian Advertising</div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Create an offscreen iframe (same-origin)
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.left = "-9999px";
    iframe.style.top = "0";
    iframe.style.width = "210mm";
    iframe.style.height = "297mm";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    // Write isolated HTML into the iframe
    const doc = iframe.contentDocument || iframe.ownerDocument;
    doc.open();
    doc.write(html);
    doc.close();

    // Wait for fonts/layout to settle
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Select root element inside iframe
    const root = doc.getElementById("pdf-root");

    // Capture with html2canvas inside the iframe, forcing a safe white background
    const canvas = await html2canvas(root, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      // Ensure we only render the iframe document, not parent styles
      windowWidth: root.scrollWidth,
      windowHeight: root.scrollHeight,
    });

    // Create PDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgData = canvas.toDataURL("image/jpeg", 1.0);
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = pageWidth - 20; // 10mm margin on each side
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Add image to PDF
    pdf.addImage(imgData, "JPEG", 10, 10, imgWidth, imgHeight);

    // Save the PDF
    const safeName = (customerData?.full_name || "زبون").replace(/[/\\?%*:|"<>]/g, "_");
    const fileName = `كشف_حساب_${safeName}_${new Date().toISOString().split("T")[0]}.pdf`;
    pdf.save(fileName);

    // Cleanup
    document.body.removeChild(iframe);
  } catch (error) {
    console.error("PDF generation error:", error);
    alert("حدث خطأ أثناء إنشاء PDF. يرجى المحاولة مرة أخرى.");
  }
};



// Helper function to format currency
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return "0.00 $";
  const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  return `${num.toFixed(2)} $`;
};

// ✅ ALTERNATIVE VISUAL PDF APPROACH
const downloadVisualPDF = async () => {
  try {
    const input = document.getElementById('account-statement-content');
    
    const canvas = await html2canvas(input, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      allowTaint: true,
      foreignObjectRendering: false,
      onclone: (clonedDoc) => {
        // Ensure Arabic text is properly rendered in the clone
        const clonedElement = clonedDoc.getElementById('account-statement-content');
        if (clonedElement) {
          clonedElement.style.direction = 'rtl';
          clonedElement.style.fontFamily = 'Arial, sans-serif';
        }
      }
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.9);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 190;
    const pageHeight = 280;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 10;

    pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight + 10;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`كشف_حساب_${customer.full_name}_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error("Visual PDF generation failed:", error);
    alert("فشل في إنشاء PDF بصري. يرجى المحاولة مرة أخرى.");
  }
};


// Fallback simple PDF function
const downloadSimplePDF = async () => {
  const input = pdfRef.current;
  const canvas = await html2canvas(input, {
    scale: 1,
    useCORS: true,
    backgroundColor: '#ffffff',
    ignoreElements: (element) => {
      // Ignore buttons and interactive elements
      return element.tagName === 'BUTTON' || element.classList.contains('cursor-pointer');
    }
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgWidth = 190;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
  pdf.save(`كشف_حساب_${customer.full_name}_${new Date().toISOString().split('T')[0]}.pdf`);
};

  if (isFetching) {
    return (
     <SkeletonLoader />
    );
  }

  if (!customer) {
    return (
      <div className="p-4 text-center text-red-500 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl border border-red-200 dark:border-red-800">
        الزبون غير متوفر
      </div>
    );
  }

  return (
    <div dir="rtl" className="p-3 sm:p-4 md:p-6 max-w-7xl w-full mx-auto">
      {/* ✅ ENHANCED HEADER WITH GRADIENT BACKGROUND */}
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
          
          {/* ✅ ENHANCED BUTTONS GRID */}
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

      {/* ✅ BEAUTIFUL CUSTOMER CARD WITH GRADIENT BACKGROUND */}
      <Card className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-800 dark:via-gray-900 dark:to-blue-900/20 border-0 shadow-xl rounded-2xl overflow-hidden mb-6 transition-all duration-300 hover:shadow-2xl">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col items-center space-y-6">
            {/* Avatar with Glow Effect */}
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
            
            {/* Customer Info */}
            <div className="text-center space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                {customer.full_name}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                <span className="font-semibold text-gray-700 dark:text-gray-200">الشركة: </span>
                {customer.company_name}
              </p>
            </div>

            {/* Balance Badge with Animation */}
           <Badge className={`text-lg px-6 py-3 bg-gradient-to-r border-0 shadow-lg animate-pulse ${
  customer?.remaining > 0 
    ? 'from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700' 
    : 'from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
} text-white`}>
  <Icon icon="mdi:currency-usd" className="ml-2 text-xl" />
  الرصيد المتبقي : {customer?.remaining?.toFixed(2)} $
</Badge>
            {/* Quick Stats */}

          
         
          </div>
        </CardContent>
      </Card>

      {/* ✅ ACCOUNT STATEMENT DIALOG */}
      <Dialog open={showAccountStatement} onOpenChange={setShowAccountStatement}>
        <DialogContent className="max-w-[95vw] w-[95vw] sm:max-w-[90vw] sm:w-[90vw] md:max-w-[800px] md:w-[800px] lg:max-w-[900px] lg:w-[900px] max-h-[95vh] overflow-y-auto p-3 sm:p-4 md:p-6 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20">
          <DialogHeader>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
              <DialogTitle className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-center sm:text-right">
                📊 كشف حساب الزبون - {customer.full_name}
              </DialogTitle>
              <Button
                onClick={downloadCustomerPDF}
                className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white w-full sm:w-auto shadow-md hover:shadow-lg transition-all duration-200"
                size="sm"
              >
                <Icon icon="mdi:download" className="text-lg" />
                <span className="text-sm sm:text-base">تحميل PDF</span>
              </Button>
            </div>
          </DialogHeader>

          {/* PDF CONTENT */}
          <div ref={pdfRef} className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-6 shadow-lg border border-gray-200 dark:border-gray-700">
            {/* Header for PDF */}
            <div className="text-center border-b-2 border-gray-300 pb-3 sm:pb-4 mb-4 sm:mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">كشف حساب الزبون</h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                تاريخ الإصدار: {new Date().toLocaleDateString('ar-EG')}
              </p>
            </div>

            {/* Customer Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-700 rounded-xl p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-center sm:text-right">
                  <div className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">{customer.full_name}</div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">{customer.company_name}</p>
                </div>
                <div className="bg-gradient-to-r from-red-500 to-red-800 text-white border-0 rounded-full px-4 py-2 text-sm sm:text-base font-bold shadow-lg">
                  الرصيد المتبقي: {customer?.remaining?.toFixed(2)} $
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl shadow-sm">
                <div className="text-xl sm:text-2xl font-bold text-green-600">+{customer.total_paid?.toFixed(2)}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">إجمالي المدفوعات</div>
              </div>
              <div className="text-center p-4 border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl shadow-sm">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{customer.total?.toFixed(2)}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">إجمالي المستحق</div>
              </div>
              <div className="text-center p-4 border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl shadow-sm">
                <div className="text-xl sm:text-2xl font-bold text-purple-600">{customer.customer_account}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">دفعة بدائية</div>
              </div>
            </div>

            <Separator className="my-6 bg-gray-300 dark:bg-gray-600" />

            {/* Customer Details */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 sm:p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Icon icon="mdi:account-details" className="text-blue-500 text-xl" />
                📋 المعلومات الشخصية
              </h3>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-700 dark:to-slate-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4 transition-all duration-200 hover:shadow-md">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon icon="mdi:phone" className="text-blue-500 text-lg" />
                    <span className="font-semibold text-gray-700 dark:text-gray-300">رقم الهاتف</span>
                  </div>
                  <p className="text-gray-800 dark:text-gray-200 text-lg">{customer.phone_number}</p>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-700 dark:to-slate-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4 transition-all duration-200 hover:shadow-md">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon icon="mdi:map-marker" className="text-green-500 text-lg" />
                    <span className="font-semibold text-gray-700 dark:text-gray-300">العنوان</span>
                  </div>
                  <p className="text-gray-800 dark:text-gray-200 text-lg">{customer.address}</p>
                </div>

                {customer.email && (
                  <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-700 dark:to-slate-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon icon="mdi:email" className="text-indigo-500 text-lg" />
                      <span className="font-semibold text-gray-700 dark:text-gray-300">البريد الإلكتروني</span>
                    </div>
                    <p className="text-gray-800 dark:text-gray-200 text-lg">{customer.email}</p>
                  </div>
                )}

                {customer.commercial_registration_number && (
                  <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-700 dark:to-slate-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon icon="mdi:file-document" className="text-yellow-500 text-lg" />
                      <span className="font-semibold text-gray-700 dark:text-gray-300">رقم السجل التجاري</span>
                    </div>
                    <p className="text-gray-800 dark:text-gray-200 text-lg">{customer.commercial_registration_number}</p>
                  </div>
                )}

                <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-700 dark:to-slate-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4 transition-all duration-200 hover:shadow-md">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon icon="mdi:calendar-plus" className="text-purple-500 text-lg" />
                    <span className="font-semibold text-gray-700 dark:text-gray-300">تاريخ الإنشاء</span>
                  </div>
                  <p className="text-gray-800 dark:text-gray-200 text-lg">{new Date(customer.created_at).toLocaleDateString("ar-EG")}</p>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-700 dark:to-slate-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4 transition-all duration-200 hover:shadow-md">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon icon="mdi:calendar-sync" className="text-orange-500 text-lg" />
                    <span className="font-semibold text-gray-700 dark:text-gray-300">آخر تعديل</span>
                  </div>
                  <p className="text-gray-800 dark:text-gray-200 text-lg">{new Date(customer.updated_at).toLocaleDateString("ar-EG")}</p>
                </div>
              </div>
            </div>

            {/* Business Manager Information */}
            {customer.customers && customer.customers.length > 0 && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                  <Icon icon="mdi:account-tie" className="text-blue-500 text-xl" />
                  معلومات مدير الأعمال
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm border border-white/20">
                    <p className="text-sm text-gray-600 dark:text-gray-400">الاسم</p>
                    <p className="font-semibold text-gray-800 dark:text-white text-lg">{customer.customers[0].full_name}</p>
                  </div>
                  {customer.customers[0].phone_number && (
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm border border-white/20">
                      <p className="text-sm text-gray-600 dark:text-gray-400">الهاتف</p>
                      <p className="font-semibold text-gray-800 dark:text-white text-lg">{customer.customers[0].phone_number}</p>
                    </div>
                  )}
                  {customer.customers[0].address && (
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm border border-white/20">
                      <p className="text-sm text-gray-600 dark:text-gray-400">العنوان</p>
                      <p className="font-semibold text-gray-800 dark:text-white text-lg">{customer.customers[0].address}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer for PDF */}
            <div className="text-center border-t-2 border-gray-300 dark:border-gray-600 pt-4 mt-6">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                تم إنشاء هذا الكشف بتاريخ {new Date().toLocaleDateString('ar-EG')} - نظام إدارة العملاء
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ✅ ENHANCED TABLES SECTIONS WITH GRADIENTS */}
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

      {/* Dialogs */}
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
          setOpenAddPayment(false) ;
          refetch()}}
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