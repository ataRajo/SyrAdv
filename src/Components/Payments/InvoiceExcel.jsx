import React, { useState } from "react";
import * as XLSX from "xlsx"; // Import the xlsx library
import { saveAs } from "file-saver"; // Import saveAs from file-saver
import { withSacExcelBanner } from "../../utils/branding/excelBrand";
import { normalizeList } from "../../utils/export/fetchAllPages";

const InvoiceExcel = ({
  customer: customerProp,
  showCustomerTable = false,
  showCustomerPaymentsTable = false,
  showCustomerRemainingTable = false,
  // ⚠️ FIXED (الملف كان يخرج فارغًا): دالة اختيارية تجلب كل البيانات (كل
  // الصفحات) لحظة التصدير - نفس InvoicePdf.
  loadData,
  disabled = false,
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const generateExcel = async () => {
    setIsExporting(true);
    try {
      let customer = loadData ? await loadData() : customerProp;
      // الباك-إند يُرجِع قوائم مُرقَّمة ({ data: [...] }) لا مصفوفات مباشرة.
      if (showCustomerRemainingTable) {
        customer = normalizeList(customer);
      } else if (customer && showCustomerPaymentsTable && !Array.isArray(customer.payments)) {
        customer = { ...customer, payments: normalizeList(customer.payments) };
      }
      buildExcel(customer);
    } catch (error) {
      console.error("Excel export failed:", error);
      alert(error?.message || "تعذر تصدير الملف");
    } finally {
      setIsExporting(false);
    }
  };

  const buildExcel = (customer) => {
    const workbook = XLSX.utils.book_new(); // Create a new workbook

    // Helper function to prepare data for SheetJS, with the SAC company /
    // contact banner prepended above the header row.
    const prepareSheetData = (headers, data) => {
      return withSacExcelBanner(headers, data);
    };

    // Customer Info Table
    if (showCustomerTable && customer) {
      const customerHeaders = [
        "المبلغ المتبقي",
        "المبلغ المدفوع",
        "المبلغ الكلي",
        "رقم الهاتف",
        "اسم الشركة",
        "اسم الزبون",
      ];
      const customerData = [
        [
          customer?.remaining || "0.00",
          customer?.total_paid || "0.00",
          customer?.total || "0.00",
          customer.phone_number || "غير متوفر",
          customer.company_name || "غير متوفر",
          customer.full_name || "غير متوفر",
        ],
      ];
      const ws = XLSX.utils.aoa_to_sheet(
        prepareSheetData(customerHeaders, customerData)
      );
      XLSX.utils.book_append_sheet(workbook, ws, "بيانات الزبون"); // Add sheet to workbook
    }

    // Customer Remaining Table (assuming 'customer' is an array here based on your original code)
    if (showCustomerRemainingTable && Array.isArray(customer) && customer.length) {
      const customerRemainingHeaders = [
        "المبلغ المتبقي",
        "المبلغ المدفوع",
        "المبلغ الكلي",
        "العنوان",
        "رقم الهاتف",
        "اسم الشركة",
        "اسم الزبون",
      ];
      const customerRemainingData = customer.map((c) => [
        c?.remaining || "0.00",
        c?.total_paid || "0.00",
        c?.total || "0.00",
        c?.address,
        c?.phone_number || "غير متوفر",
        c.company_name || "غير متوفر",
        c.full_name || "غير متوفر",
      ]);
      const ws = XLSX.utils.aoa_to_sheet(
        prepareSheetData(customerRemainingHeaders, customerRemainingData)
      );
      XLSX.utils.book_append_sheet(workbook, ws, "الزبائن المتبقي");
    }

    // Customer Payments Table
    if (showCustomerPaymentsTable && customer?.payments?.length) {
      let paymentHeaders;
      let tableData;

      if (!showCustomerTable) {
        // Full payment details for all customers
        paymentHeaders = [
          "الرصيد المتبقي",
          "المبلغ المدفوع",
          "تاريخ الدفع",
          "المبلغ الكلي",
          "اسم الموظف",
          "رقم الهاتف (الزبون)",
          "اسم الزبون",
          "رقم الدفعة",
        ];
        tableData = customer.payments.map((payment) => [
          payment.remaining || "0.00",
          payment.paid || "0.00",
          payment.date || "غير متوفر",
          payment.total || "غير متوفر",
          payment?.user?.full_name || "غير متوفر",
          payment?.customer?.phone_number || "غير متوفر",
          payment?.customer?.full_name || "غير متوفر",
          payment.payment_number || "غير متوفر",
        ]);
      } else {
        // Simplified payment details for a single customer
        paymentHeaders = [
          "الموظف ",
          "الرصيد المتبقي",
          "المبلغ المدفوع",
          "المبلغ الكلي",
          "تاريخ الدفع",
          "رقم الدفعة",
        ];
        tableData = customer.payments.map((payment) => [
        payment?.user?.full_name || "0.00",
          payment.remaining || "0.00",
          payment.paid || "0.00",
          payment.total || "غير متوفر",
          payment.date || "غير متوفر",
          payment.payment_number || "غير متوفر",
        ]);
      }

      const ws = XLSX.utils.aoa_to_sheet(
        prepareSheetData(paymentHeaders, tableData)
      );
      XLSX.utils.book_append_sheet(workbook, ws, "تفاصيل الدفعات");
    }

    // Generate and download the Excel file
    if (workbook.SheetNames.length > 0) {
      // Check if any sheet was added
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const data = new Blob([excelBuffer], {
        type: "application/octet-stream",
      });

      // Construct filename dynamically
      const fileName = showCustomerTable
        ? `كشف_حساب_الزبون_${customer?.full_name || ""}.xlsx`
        : `كشف_حساب_الزبائن.xlsx`;

      saveAs(data, fileName);
    } else {
      console.warn("لا توجد بيانات لتصديرها إلى Excel.");
      alert("لا توجد بيانات لتصديرها إلى Excel.");
    }
  };

  return (
    <button
      onClick={generateExcel}
      type="button"
      dir="rtl"
      disabled={disabled || isExporting}
      className="bg-gray-800 text-white px-4 py-2 cursor-pointer rounded-lg shadow-sm hover:bg-gray-700 transition-colors duration-200 disabled:opacity-60 disabled:cursor-wait"
    >
      {isExporting ? "جارٍ تجهيز الملف..." : "تصدير كملف Excel"}
    </button>
  );
};

export default InvoiceExcel;