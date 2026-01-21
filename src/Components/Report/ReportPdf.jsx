import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import "../../assets/fonts/Amiri-Regular.js";
import logo from "../../assets/images/adv_syrian.png"; // Import the logo

export const ReportPdf = ({
  customers,
  from_date,
  to_date,
  globalModelCounts,
  product,
  selectedCustomer,
  isFilteredByCustomer,
}) => {
  const generatePDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    doc.setFont("Amiri-Regular", "normal");

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // Add logo at the top
    try {
      // Add the logo image at top left
      const logoWidth = 40; // Width in mm
      const logoHeight = 35; // Height in mm
      const logoX = margin; // Left margin
      const logoY = margin; // Top margin
      
      // Add the logo image
      doc.addImage(logo, 'PNG', logoX, logoY, logoWidth, logoHeight);
    } catch (error) {
      console.error("Error adding logo:", error);
      // Continue without logo if there's an error
    }

    // Dynamic title based on filter
    const title = isFilteredByCustomer 
      ? "تقرير حجوزات زبون"
      : "تقرير الحجز الأسبوعي";
    
    // Move title text to the right to accommodate logo
    doc.setFontSize(18);
    doc.text(title, pageWidth / 2, margin + 10, { align: "center" });

    doc.setFontSize(10);
    
    // Helper function to format date in English
    const formatDate = (dateString) => {
      if (!dateString) return "غير محدد";
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    // Add customer name if filtered
    let infoY = margin + 25; // Adjusted for logo
    
    if (isFilteredByCustomer && selectedCustomer) {
      const customerName = selectedCustomer.company_name || selectedCustomer.full_name || "غير معروف";
      doc.text(
        `الزبون: ${customerName}`,
        pageWidth - margin,
        infoY,
        { align: "right" }
      );
      doc.text(
        `من تاريخ: ${formatDate(from_date)}`,
        pageWidth - margin,
        infoY + 5,
        { align: "right" }
      );
      doc.text(
        `إلى تاريخ: ${formatDate(to_date)}`,
        pageWidth - margin,
        infoY + 10,
        { align: "right" }
      );
      infoY += 15;
    } else {
      doc.text(
        `من تاريخ: ${formatDate(from_date)}`,
        pageWidth - margin,
        infoY,
        { align: "right" }
      );
      doc.text(
        `إلى تاريخ: ${formatDate(to_date)}`,
        pageWidth - margin,
        infoY + 5,
        { align: "right" }
      );
      infoY += 10;
    }
    
    doc.text(
      `المنتج: ${product || "غير محدد"}`,
      pageWidth - margin,
      infoY,
      { align: "right" }
    );

    let currentY = infoY + 15;

    // Check if there are customers to display
    if (customers && customers.length > 0) {
      customers.forEach((customer, index) => {
        // Add new page for each customer after the first one
        if (index > 0) {
          doc.addPage();
          // Add logo to new page
          try {
            doc.addImage(logo, 'PNG', margin, margin, 40, 15);
          } catch (error) {
            console.error("Error adding logo to new page:", error);
          }
          currentY = margin + 25;
        }

        // Show customer name
        doc.setFontSize(14);
        const customerName = customer.full_name || customer.company_name || "غير معروف";
        
        doc.text(
          `اسم الزبون: ${customerName}`,
          pageWidth - margin,
          currentY,
          { align: "right" }
        );
        currentY += 10;

        // Check if customer has roadSigns
        if (customer.roadSigns && customer.roadSigns.length > 0) {
          const roadSignsHeaders = [
            [
              "الاتجاه",
              "تاريخ الانتهاء",
              "تاريخ البدء",
              "عدد الأوجه",
              "التموضع",
              "ترميز اللوحة",
            ],
          ];

          const roadSignsData = customer.roadSigns.map((sign) => [
            sign.direction || "-",
            sign.pivot?.end_date ? formatDate(sign.pivot.end_date) : "-",
            sign.pivot?.start_date ? formatDate(sign.pivot.start_date) : "-",
            sign.pivot?.booking_faces || "غير معروف",
            sign.place || "غير معروف",
            sign.template?.model || "غير معروف",
          ]);

          autoTable(doc, {
            head: roadSignsHeaders,
            body: roadSignsData,
            startY: currentY,
            margin: { top: margin, left: margin, right: margin, bottom: margin },
            styles: {
              font: "Amiri-Regular",
              halign: "center",
              fontSize: 9,
              textColor: [0, 0, 0],
              fontStyle: "normal",
              cellPadding: 2,
              cellWidth: 'auto',
            },
            headStyles: {
              font: "Amiri-Regular",
              halign: "center",
              fontSize: 9,
              fillColor: [41, 128, 185],
              textColor: [255, 255, 255],
              fontStyle: "normal",
              cellPadding: 3,
            },
            columnStyles: {
              0: { cellWidth: 50 }, // الاتجاه - Wider for text
              1: { cellWidth: 25 }, // End date
              2: { cellWidth: 25 }, // Start date
              3: { cellWidth: 25 }, // Faces count
              4: { cellWidth: 40 }, // Place
              5: { cellWidth: 30 }, // Model
            },
            didParseCell: (data) => {
              data.cell.styles.font = "Amiri-Regular";
              data.cell.styles.fontStyle = "normal";
              // Word wrap for الاتجاه column
              if (data.column.index === 0 && data.cell.raw && data.cell.raw.length > 30) {
                data.cell.styles.fontSize = 8;
                data.cell.styles.cellWidth = 60;
              }
            },
            didDrawCell: (data) => {
              if (data.section === "head") {
                data.cell.styles.font = "Amiri-Regular";
                data.cell.styles.fontStyle = "normal";
              }
            },
          });
          currentY = doc.lastAutoTable.finalY + 10;
        } else {
          doc.setFontSize(12);
          doc.text("لا توجد لوحات إعلانية لهذا الزبون", pageWidth - margin, currentY, { align: "right" });
          currentY += 10;
        }
      });
    } else {
      doc.setFontSize(14);
      const message = isFilteredByCustomer 
        ? "لا توجد حجوزات لهذا الزبون في الفترة المحددة"
        : "لا توجد بيانات للزبائن";
      doc.text(message, pageWidth / 2, currentY, { align: "center" });
      currentY += 20;
    }

    // Add model summary section if not filtered by customer
    if (!isFilteredByCustomer && globalModelCounts && globalModelCounts.length > 0) {
      doc.addPage();
      // Add logo to summary page
      try {
        doc.addImage(logo, 'PNG', margin, margin, 40, 15);
      } catch (error) {
        console.error("Error adding logo to summary page:", error);
      }
      currentY = margin + 25;
      
      doc.setFontSize(16);
      doc.text("ملخص النماذج", pageWidth / 2, currentY, { align: "center" });
      currentY += 10;

      const modelSummaryHeaders = [
        ["عدد اللوحات الكلي من هذا النموذج", "عدد اللوحات المتاحة من هذا النموذج", "عدد اللوحات المحجوزة من هذا النموذج", "النموذج"],
      ];

      const modelSummaryData = globalModelCounts.map((model) => [
        model?.total_panels || "0.00",
        model?.available_panels || "0.00",
        model?.reserved_panels || "0",
        model?.model || "غير معروف",
      ]);

      autoTable(doc, {
        head: modelSummaryHeaders,
        body: modelSummaryData,
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

    // Add footer with company name on all pages
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("شركة الإعلانات السورية", pageWidth / 2, pageHeight - 10, { align: "center" });
      doc.text(`الصفحة ${i} من ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: "right" });
    }

    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Dynamic filename based on filter
    const fileName = isFilteredByCustomer && selectedCustomer
      ? `تقرير_${selectedCustomer.company_name || selectedCustomer.full_name || "زبون"}_${formatDate(new Date()).replace(/-/g, '_')}.pdf`
      : `التقرير_الأسبوعي_${formatDate(new Date()).replace(/-/g, '_')}.pdf`;

    doc.save(fileName);
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