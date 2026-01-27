import React from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import "../../assets/fonts/Amiri-Regular.js";
import logo from "../../assets/images/adv_syrian.png";

const InvoicePdf = ({
  customer,
  showCustomerTable = false,
  showCustomerPaymentsTable = false,
  showCustomerRemainingTable = false,
}) => {
  const generatePDF = async () => {
    // Initialize jsPDF
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    doc.setFont("Amiri-Regular", "normal");

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;

    // Add logo at top left
    try {
      const logoBase64 = await getImageBase64(logo);
      doc.addImage(logoBase64, 'PNG', margin, margin, 30, 15);
    } catch (error) {
      console.log("Could not load logo");
    }

    // Add title in the center
    const title = showCustomerTable
      ? `كشف دفعات الزبون`
      : `كشف دفعات الزبائن`;
    
    doc.setFontSize(18);
    doc.text(title, pageWidth / 2, margin + 10, { align: "center" });
    
    // Add date
    doc.setFontSize(10);
   doc.text(
      `Report Date: ${new Date().toLocaleDateString("en-US", {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}`,
      pageWidth / 2,
      margin + 18,
      { align: "center" }
    );

    // Helper function to convert image to base64
    async function getImageBase64(url) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = reject;
        img.src = url;
      });
    }

    let currentY = margin + 30;

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
          (customer?.total_paid || 0).toFixed(2),
          customer?.phone_number || "غير متوفر",
          customer?.company_name || "غير متوفر",
          customer?.full_name || "غير متوفر",
        ],
      ];

      autoTable(doc, {
        head: customerHeaders,
        body: customerData,
        startY: currentY,
        margin: { top: margin, left: margin, right: margin, bottom: margin },
        styles: {
          font: "Amiri-Regular",
          halign: "center",
          fontSize: 10,
          textColor: [0, 0, 0],
          fontStyle: "normal",
          cellPadding: 3,
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
        theme: "grid",
      });
      
      currentY = doc.lastAutoTable.finalY + 15;
      
      // Add payments title
      doc.setFontSize(16);
      doc.text("تفاصيل الدفعات", pageWidth / 2, currentY - 5, { align: "center" });
    }

    // Conditionally render customer remaining table
    if (showCustomerRemainingTable && Array.isArray(customer)) {
      const customerHeaders = [
        [
          "المبلغ المدفوع",
          "العنوان",
          "رقم الهاتف",
          "اسم الشركة",
          "اسم الزبون",
        ],
      ];

      const customerData = customer.map((c) => [
        (c?.total_paid || 0).toFixed(2),
        c?.address || "غير متوفر",
        c?.phone_number || "غير متوفر",
        c?.company_name || "غير متوفر",
        c?.full_name || "غير متوفر",
      ]);

      autoTable(doc, {
        head: customerHeaders,
        body: customerData,
        startY: currentY,
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
          fontSize: 8,
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255],
          fontStyle: "normal",
          cellPadding: 3,
        },
        theme: "grid",
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
            (payment?.paid || 0).toFixed(2),
            payment?.date || "غير محدد",
            payment?.payment_number || "غير محدد",
          ];
        } else {
          return [
            payment?.user?.full_name || "غير معروف",
            (payment?.paid || 0).toFixed(2),
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
        theme: "grid",
      });
    }

    // Add footer
    const footerY = pageHeight - 10;
    doc.setFontSize(8);
    doc.text("© الشركة السورية للإعلان", pageWidth / 2, footerY, { align: "center" });

    // Save the PDF
    doc.save(`كشف_حساب_${new Date().toISOString().split('T')[0]}.pdf`);
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