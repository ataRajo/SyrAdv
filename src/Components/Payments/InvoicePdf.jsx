import React, { useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import "../../assets/fonts/Amiri-Regular.js";
import { loadSacLetterheadAssets } from "../../utils/branding/sacBrand";
import {
  applySacLetterhead,
  drawSacTitle,
  sacAutoTableMargin,
  sacAutoTableStyles,
  stampSacLetterheadOnAllPages,
} from "../../utils/branding/pdfLetterheadJsPdf";
import { normalizeList } from "../../utils/export/fetchAllPages";

const InvoicePdf = ({
  customer: customerProp,
  showCustomerTable = false,
  showCustomerPaymentsTable = false,
  showCustomerRemainingTable = false,
  // ⚠️ FIXED (الملف كان يخرج فارغًا): دالة اختيارية تجلب *كل* البيانات
  // (كل الصفحات) لحظة التصدير بدل الصفحة المعروضة فقط - راجع
  // utils/export/fetchAllPages.js. بدونها يُستخدم customer كما هو.
  loadData,
  title: titleProp,
  disabled = false,
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const generatePDF = async () => {
    setIsExporting(true);
    try {
      await buildPDF();
    } catch (error) {
      console.error("PDF export failed:", error);
      alert(error?.message || "تعذر تصدير الملف");
    } finally {
      setIsExporting(false);
    }
  };

  // ⚠️ FIXED: الباك-إند يُرسل المبالغ أحيانًا كنصوص ("150.00") - كان
  // (value || 0).toFixed() يرمي خطأً فيتوقف التصدير.
  const money = (v) => (parseFloat(v) || 0).toFixed(2);

  const buildPDF = async () => {
    let customer = loadData ? await loadData() : customerProp;

    // ⚠️ FIXED: الباك-إند يُرجِع القوائم مُرقَّمة ({ data: [...] }) لا
    // مصفوفات مباشرة، فكانت الجداول تُتخطّى بصمت (Array.isArray = false)
    // ويخرج الملف فارغًا. نطبّع الشكلين هنا.
    if (showCustomerRemainingTable) {
      customer = normalizeList(customer);
    } else if (customer && showCustomerPaymentsTable && !Array.isArray(customer.payments)) {
      customer = { ...customer, payments: normalizeList(customer.payments) };
    }

    const hasRows =
      (showCustomerRemainingTable && customer.length > 0) ||
      (showCustomerPaymentsTable && (customer?.payments?.length ?? 0) > 0) ||
      (showCustomerTable && customer && !Array.isArray(customer));
    if (!hasRows) {
      alert("لا توجد بيانات لتصديرها");
      return;
    }

    // Letterhead art (logo corner, watermark, footer bar) - loaded once.
    await loadSacLetterheadAssets();

    // Initialize jsPDF
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    doc.setFont("Amiri-Regular", "normal");

    // Paints the official SAC letterhead behind the content of this page and
    // of every page autoTable adds later; returns the safe content box.
    const box = applySacLetterhead(doc);
    const tableMargin = sacAutoTableMargin(doc);
    const tableStyles = sacAutoTableStyles("Amiri-Regular");

    const title =
      titleProp ||
      (showCustomerRemainingTable
        ? `كشف الزبائن`
        : showCustomerTable
        ? `كشف دفعات الزبون`
        : `كشف دفعات الزبائن`);

    drawSacTitle(
      doc,
      title,
      `تاريخ التقرير: ${new Date().toLocaleDateString("en-GB")}`
    );
    doc.setFont("Amiri-Regular", "normal");

    let currentY = box.top;

    // Conditionally render customer info table
    if (showCustomerTable && customer) {
      const customerHeaders = [
        [
          "المبلغ المدفوع",
          "رقم الهاتف",
          "اسم الشركة",
          "اسم الزبون",
        ],
      ];

      const customerData = [
        [
          money(customer?.total_paid),
          customer?.phone_number || "غير متوفر",
          customer?.company_name || "غير متوفر",
          customer?.full_name || "غير متوفر",
        ],
      ];

      autoTable(doc, {
        head: customerHeaders,
        body: customerData,
        startY: currentY,
        ...tableStyles,
        margin: tableMargin,
      });
      
      currentY = doc.lastAutoTable.finalY + 15;
      
      // Add payments title
      doc.setFontSize(14);
      doc.setTextColor(26, 24, 23);
      doc.text("تفاصيل الدفعات", box.pageWidth / 2, currentY - 5, { align: "center" });
    }

    // Conditionally render customer remaining table
    if (showCustomerRemainingTable && Array.isArray(customer)) {
      const customerHeaders = [
        [
          "المبلغ المتبقي",
          "المبلغ المدفوع",
          "المبلغ الكلي",
          "العنوان",
          "رقم الهاتف",
          "اسم الشركة",
          "اسم الزبون",
        ],
      ];

      const customerData = customer.map((c) => [
        money(c?.remaining),
        money(c?.total_paid),
        money(c?.total),
        c?.address || "غير متوفر",
        c?.phone_number || "غير متوفر",
        c?.company_name || "غير متوفر",
        c?.full_name || "غير متوفر",
      ]);

      autoTable(doc, {
        head: customerHeaders,
        body: customerData,
        startY: currentY,
        ...tableStyles,
        margin: tableMargin,
      });
      
      currentY = doc.lastAutoTable.finalY + 10;
    }

    // Conditionally render payments table
    if (showCustomerPaymentsTable && Array.isArray(customer?.payments)) {
      // Define headers WITHOUT الرصيد المتبقي والمبلغ الكلي
      const paymentHeaders = showCustomerTable
        ? [["الموظف", "المبلغ المدفوع", "تاريخ الدفع", "رقم الدفعة"]]
        : [["الموظف", "المبلغ المدفوع", "تاريخ الدفع", "رقم الهاتف", "اسم الزبون", "رقم الدفعة"]];

      // Map payment data WITHOUT الرصيد المتبقي والمبلغ الكلي
      const tableData = customer.payments.map((payment) => {
        if (showCustomerTable) {
          return [
            payment?.user?.full_name || "غير معروف",
            money(payment?.paid),
            payment?.date || "غير محدد",
            payment?.payment_number || "غير محدد",
          ];
        } else {
          return [
            payment?.user?.full_name || "غير معروف",
            money(payment?.paid),
            payment?.date || "غير محدد",
            payment?.customer?.phone_number || "غير محدد",
            payment?.customer?.full_name || "غير محدد",
            payment?.payment_number || "غير محدد",
          ];
        }
      });

      autoTable(doc, {
        head: paymentHeaders,
        body: tableData,
        startY: currentY,
        ...tableStyles,
        margin: tableMargin,
      });
    }

    // Page numbers (the letterhead art itself is already behind every page)
    stampSacLetterheadOnAllPages(doc);

    // Save the PDF
    doc.save(`كشف_حساب_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <button
      onClick={generatePDF}
      type="button"
      dir="rtl"
      disabled={disabled || isExporting}
      className="bg-primary text-background px-4 py-2 cursor-pointer rounded-lg shadow-sm hover:bg-primary-dark transition-colors duration-200 disabled:opacity-60 disabled:cursor-wait"
    >
      {isExporting ? "جارٍ تجهيز الملف..." : "تصدير كملف PDF"}
    </button>
  );
};

export default InvoicePdf;