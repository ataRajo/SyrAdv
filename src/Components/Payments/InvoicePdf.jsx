import React from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import "../../assets/fonts/Amiri-Regular.js"; 

const InvoicePdf = ({
  customer,
  showCustomerTable = false,
  showCustomerPaymentsTable = false,
  showCustomerRemainingTable = false,
}) => {
  const generatePDF = () => {
    // Initialize jsPDF with A4 landscape settings
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // Register Amiri font
    doc.setFont("Amiri-Regular", "normal");

    // Define page dimensions for easier calculations
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Set consistent margins
    const margin = 15; // All-around margin for better visual balance
    const contentWidth = pageWidth - 2 * margin;

    // Add title in the center

    const title = showCustomerTable
      ? `  كشف حساب الزبون`
      : `  كشف حساب الزبائن`;
    doc.setFontSize(18); // Slightly larger title for emphasis

    doc.text(title, pageWidth / 2, margin + 5, { align: "center" });
    doc.text(
      new Date().toLocaleDateString("en-US"),
      pageWidth / 2,
      margin + 15,
      { align: "center" }
    );

    // متغير لتحديد موضع بدء الجدول التالي
    let currentY = margin + 20;

    // Conditionally render customer info table
    if (showCustomerTable) {
      // Define customer info table headers and data
      const customerHeaders = [
        [
          "المبلغ المتبقي",
          "المبلغ المدفوع",
          "المبلغ الكلي",
          // "تاريخ الكشف",
          "رقم الهاتف",
          "اسم الشركة",
          "اسم الزبون",
        ],
      ];

      const customerData = [
        [
          customer?.remaining || "0.00",
          customer?.total_paid.toFixed(2) || "0.00",

          customer?.total.toFixed(2) || "0.00",
          // new Date().toLocaleDateString("en-US"),
          customer.phone_number || "غير متوفر",
          customer.company_name || "غير متوفر",
          customer.full_name || "غير متوفر",
        ],
      ];

      // Calculate optimal column widths for customer table
      const numCustomerColumns = customerHeaders[0].length;
      const customerColumnWidth = contentWidth / numCustomerColumns;
      const customerColumnStyles = {};
      for (let i = 0; i < numCustomerColumns; i++) {
        customerColumnStyles[i] = { cellWidth: customerColumnWidth };
      }

      // Generate customer info table
      autoTable(doc, {
        head: customerHeaders,
        body: customerData,
        startY: currentY, // Start table below title
        margin: { top: margin, left: margin, right: margin, bottom: margin },
        styles: {
          font: "Amiri-Regular",
          halign: "center",
          fontSize: 10,
          textColor: [0, 0, 0],
          fontStyle: "normal",
          cellPadding: 2,
        },
        headStyles: {
          font: "Amiri-Regular",
          halign: "center",
          fontSize: 10,
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255],
          fontStyle: "normal",
          cellPadding: 3,
        },
        columnStyles: customerColumnStyles,
        tableWidth: "wrap",
        theme: "grid",
        didParseCell: (data) => {
          data.cell.styles.font = "Amiri-Regular";
          data.cell.styles.fontStyle = "normal";
        },
        didDrawCell: (data) => {
          if (data.section === "head") {
            data.cell.styles.font = "Amiri-Regular";
            data.cell.styles.fontStyle = "normal";
          }
        },
      });
      currentY = doc.lastAutoTable.finalY + 10; // Update starting Y for the next table

      
    const paymentInfo = "تفاصيل الدفعات"
    doc.setFontSize(18); // Slightly larger title for emphasis

    doc.text(paymentInfo, pageWidth / 2, margin + 45, { align: "center" });
    }

  

    // Conditionally render customer Remaining  table
    if (showCustomerRemainingTable) {
      // Define customer info table headers and data
      const customerHeaders = [
        [
          "المبلغ المتبقي",
          "المبلغ المدفوع",
          "المبلغ الكلي",

          " العنوان",
          "رقم الهاتف",
          "اسم الشركة",
          "اسم الزبون",
        ],
      ];

      const customerData = customer?.map((c) => [
        c?.remaining || "0.00",
        c?.total_paid.toFixed(2) || "0.00",
        c?.total.toFixed(2) || "0.00",

        c?.address,
        c?.phone_number || "غير متوفر",
        c.company_name || "غير متوفر",
        c.full_name || "غير متوفر",
      ]);

      // Calculate optimal column widths for customer table
      const numCustomerColumns = customerHeaders[0].length;
      const customerColumnWidth = contentWidth / numCustomerColumns;
      const customerColumnStyles = {};
      for (let i = 0; i < numCustomerColumns; i++) {
        customerColumnStyles[i] = { cellWidth: customerColumnWidth };
      }

      // Generate customer info table
      autoTable(doc, {
        head: customerHeaders,
        body: customerData,
        startY: currentY, // Start table below title
        margin: { top: margin, left: margin, right: margin, bottom: margin },
        styles: {
          font: "Amiri-Regular",
          halign: "center",
          fontSize: 10,
          textColor: [0, 0, 0],
          fontStyle: "normal",
          cellPadding: 2,
        },
        headStyles: {
          font: "Amiri-Regular",
          halign: "center",
          fontSize: 10,
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255],
          fontStyle: "normal",
          cellPadding: 3,
        },
        columnStyles: customerColumnStyles,
        tableWidth: "wrap",
        theme: "grid",
        didParseCell: (data) => {
          data.cell.styles.font = "Amiri-Regular";
          data.cell.styles.fontStyle = "normal";
        },
        didDrawCell: (data) => {
          if (data.section === "head") {
            data.cell.styles.font = "Amiri-Regular";
            data.cell.styles.fontStyle = "normal";
          }
        },
      });
      currentY = doc.lastAutoTable.finalY + 10; // Update starting Y for the next table
    }

    if (showCustomerPaymentsTable) {
      // Define payment table headers
      const paymentHeaders = !showCustomerTable
        ? [
            [
              "الرصيد المتبقي",
              "المبلغ المدفوع",
              "تاريخ الدفع",
              " المبلغ الكلي",
              " اسم الموظف",
              "رقم الهاتف",
              " اسم الزبون",
              "رقم الدفعة",

            ],
          ]
        : [["الموظف ","الرصيد المتبقي", "المبلغ المدفوع",  "المبلغ الكلي",  "تاريخ الدفع", "رقم الدفعة"]];

      // Map payment data to table rows
      const tableData = !showCustomerTable ? customer.payments.map((payment) => [
        payment.remaining.toFixed(2) || "0.00",
        payment.paid.toFixed(2) || "0.00",
        payment.date || "غير متوفر",
        payment.total.toFixed(2) || "غير متوفر",
        payment?.user?.full_name || customer?.phone_number || "غير متوفر",
        payment?.customer?.phone_number || customer?.phone_number || "غير متوفر",
        payment?.customer?.full_name || customer?.full_name || "غير متوفر",
        payment.payment_number || "غير متوفر",

      ]) : customer.payments.map((payment) => [
        payment?.user?.full_name || "0.00",
        payment.remaining.toFixed(2) || "0.00",
        payment.paid.toFixed(2) || "0.00",
        payment.total.toFixed(2) || "غير متوفر",
        payment.date || "غير متوفر",
        payment.payment_number || "غير متوفر",
      ])

      // Calculate optimal column widths for payment table
      const numPaymentColumns = paymentHeaders[0].length;
      const paymentColumnWidth = contentWidth / numPaymentColumns;
      const paymentColumnStyles = {};
      for (let i = 0; i < numPaymentColumns; i++) {
        paymentColumnStyles[i] = { cellWidth: paymentColumnWidth };
      }

      // Generate payment table
      autoTable(doc, {
        head: paymentHeaders,
        body: tableData,
        startY: currentY, // Use the updated currentY
        margin: { top: margin, left: margin, right: margin, bottom: margin },
        styles: {
          font: "Amiri-Regular",
          halign: "center",
          fontSize: 10,
          textColor: [0, 0, 0],
          fontStyle: "normal",
          cellPadding: 2,
        },
        headStyles: {
          font: "Amiri-Regular",
          halign: "center",
          fontSize: 10,
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255],
          fontStyle: "normal",
          cellPadding: 3,
        },
        columnStyles: paymentColumnStyles,
        tableWidth: "wrap",
        theme: "grid",
        didParseCell: (data) => {
          data.cell.styles.font = "Amiri-Regular";
          data.cell.styles.fontStyle = "normal";
        },
        didDrawCell: (data) => {
          if (data.section === "head") {
            data.cell.styles.font = "Amiri-Regular";
            data.cell.styles.fontStyle = "normal";
          }
        },
      });
    }

    // Save the PDF
    doc.save("كشف_حساب.pdf");
  };

  return (
    <button
      onClick={generatePDF}
      type="button"
      dir="rtl"
      className="bg-primary text-background px-4 py-2 cursor-pointer rounded-lg shadow-sm hover:bg-primary-dark transition-colors duration-200"
    >
      تصدير كملف PDF
    </button>
  );
};

export default InvoicePdf;
