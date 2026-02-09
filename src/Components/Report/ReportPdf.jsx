import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import "../../assets/fonts/Amiri-Regular.js";
import logo from "../../assets/images/adv_syrian.png";

// Helper function to get region name
const getRegionName = (sign) => {
  if (sign?.region_object?.name) {
    return sign.region_object.name;
  }
  if (sign?.region) {
    return sign.region;
  }
  return sign?.region_id ? `المنطقة ${sign.region_id}` : 'غير محدد';
};

// Helper function to get printing meters
const getPrintingMeters = (sign) => {
  if (sign?.template?.printing_space) {
    return `${sign.template.printing_space}`;
  }
  if (sign?.template?.advertising_space) {
    return `${sign.template.advertising_space}`;
  }
  return "0";
};

// Helper function to get template size
const getTemplateSize = (sign) => {
  if (sign?.template?.size) {
    return sign.template.size;
  }
  return "غير محدد";
};

export const ReportPdf = ({
  customers,
  from_date,
  to_date,
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
    const margin = 10; // Reduced margin for more space

    // Add logo at the top - smaller logo
    try {
      const logoWidth = 30; // Smaller width
      const logoHeight = 26; // Proportional height
      const logoX = margin;
      const logoY = margin;
      
      doc.addImage(logo, 'PNG', logoX, logoY, logoWidth, logoHeight);
    } catch (error) {
      console.error("Error adding logo:", error);
    }

    // Dynamic title based on filter
    const title = isFilteredByCustomer 
      ? "تقرير حجوزات زبون"
      : "تقرير لوحات الزبائن";
    
    // Move title text to the right to accommodate logo
    doc.setFontSize(16); // Smaller title
    doc.text(title, pageWidth / 2, margin + 8, { align: "center" });

    doc.setFontSize(9); // Smaller font for info
    
    // Helper function to format date in English
    const formatDate = (dateString) => {
      if (!dateString) return "غير محدد";
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "غير صحيح";
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch {
        return "غير صحيح";
      }
    };
    
    // Add customer name if filtered
    let infoY = margin + 15; // Closer spacing
    
    if (isFilteredByCustomer && selectedCustomer) {
      const customerName = selectedCustomer.company_name || selectedCustomer.full_name || "غير معروف";
      doc.text(
        `الزبون: ${customerName}`,
        pageWidth - margin,
        infoY,
        { align: "right" }
      );
      infoY += 4; // Tighter spacing
    }

    let currentY = infoY + 8; // Reduced spacing

    // Check if there are customers to display
    if (customers && customers.length > 0) {
      customers.forEach((customer, index) => {
        // Add new page for each customer after the first one
        if (index > 0) {
          doc.addPage();
          try {
            doc.addImage(logo, 'PNG', margin, margin, 30, 26);
          } catch (error) {
            console.error("Error adding logo to new page:", error);
          }
          currentY = margin + 15;
        }

        // Show customer name
        doc.setFontSize(12); // Smaller font
        const customerName = customer.full_name || customer.company_name || "غير معروف";
        
        doc.text(
          `اسم الزبون: ${customerName}`,
          pageWidth - margin,
          currentY,
          { align: "right" }
        );
        currentY += 6; // Reduced spacing

        // Check if customer has roadSigns
        if (customer.roadSigns && customer.roadSigns.length > 0) {
          // UPDATED: Optimized table columns with smaller widths
          const roadSignsHeaders = [
            [
              "م",
              "المنطقة",
              "الموقع",
              "النموذج",
              "القياس",
              "أمتار",
              "الاتجاه",
              "من",
              "إلى",
              "عدد الأوجه",
            ],
          ];

          const roadSignsData = customer.roadSigns.map((sign, idx) => [
            (idx + 1).toString(),
            getRegionName(sign),
            sign.place || "غير معروف",
            sign.template?.model || "غير معروف",
            getTemplateSize(sign),
            getPrintingMeters(sign), // أمتار الطباعة
            sign.direction || "-", // REMOVED TRUNCATION
            sign.pivot?.start_date ? formatDate(sign.pivot.start_date) : "-",
            sign.pivot?.end_date ? formatDate(sign.pivot.end_date) : "-",
            (sign.pivot?.booking_faces || "0").toString(), // CONVERT TO STRING
          ]);

          autoTable(doc, {
            head: roadSignsHeaders,
            body: roadSignsData,
            startY: currentY,
            margin: { top: margin, left: margin, right: margin, bottom: margin },
            styles: {
              font: "Amiri-Regular",
              halign: "center",
              valign: "middle",
              fontSize: 7,
              textColor: [0, 0, 0],
              fontStyle: "normal",
              cellPadding: 1.5,
              lineWidth: 0.1,
            },
            headStyles: {
              font: "Amiri-Regular",
              halign: "center",
              valign: "middle",
              fontSize: 8,
              fillColor: [59, 130, 246],
              textColor: [255, 255, 255],
              fontStyle: "bold",
              cellPadding: 2,
              lineWidth: 0.1,
            },
            alternateRowStyles: {
              fillColor: [248, 250, 252], // Light gray for alternate rows
            },
            columnStyles: {
              0: { cellWidth: 8, halign: "center", valign: "middle" }, // م
              1: { cellWidth: 22, halign: "right", valign: "middle" }, // المنطقة
              2: { cellWidth: 25, halign: "right", valign: "middle" }, // التموضع
              3: { cellWidth: 18, halign: "center", valign: "middle" }, // النموذج
              4: { cellWidth: 15, halign: "center", valign: "middle" }, // القياس
              5: { cellWidth: 12, halign: "center", valign: "middle" }, // الطباعة (م²)
              6: { cellWidth: 45, halign: "right", valign: "middle" }, // الاتجاه - WIDER
              7: { cellWidth: 15, halign: "center", valign: "middle" }, // من
              8: { cellWidth: 15, halign: "center", valign: "middle" }, // إلى
              9: { cellWidth: 12, halign: "center", valign: "middle" }, // الأوجه
            },
            tableWidth: 'wrap',
            theme: 'grid',
            didParseCell: (data) => {
              data.cell.styles.font = "Amiri-Regular";
              data.cell.styles.fontStyle = "normal";
              data.cell.styles.lineWidth = 0.1;
              data.cell.styles.lineColor = [200, 200, 200];
              
              // ADD vertical alignment for all cells
              data.cell.styles.valign = "middle";
              
              // Ensure numbers are properly aligned
              if (data.column.index === 5 || data.column.index === 9) { // الطباعة and الأوجه columns
                data.cell.styles.halign = "center";
              }
            },
            didDrawCell: (data) => {
              if (data.section === "head") {
                data.cell.styles.font = "Amiri-Regular";
                data.cell.styles.fontStyle = "bold";
              }
            },
            willDrawCell: (data) => {
              // Alternate row colors
              if (data.section === 'body' && data.row.index % 2 === 0) {
                doc.setFillColor(248, 250, 252);
                doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
              }
            },
          });
          currentY = doc.lastAutoTable.finalY + 6; // Reduced spacing
          
          // Add summary for this customer
          doc.setFontSize(9);
          
          const totalFaces = customer.roadSigns.reduce((sum, sign) => 
            sum + (parseInt(sign.pivot?.booking_faces) || 0), 0
          );
          
          // Calculate total printing meters
          const totalPrintingMeters = customer.roadSigns.reduce((sum, sign) => {
            const printingSpace = parseFloat(sign.template?.printing_space) || 
                                 parseFloat(sign.template?.advertising_space) || 0;
            const faces = parseInt(sign.pivot?.booking_faces) || 0;
            return sum + (printingSpace * faces);
          }, 0);
          
          const totalSigns = customer.roadSigns.length;
          
          doc.setFillColor(59, 130, 246); // Blue background
          doc.setTextColor(255, 255, 255); // White text
          doc.rect(margin, currentY, pageWidth - (margin * 2), 8, 'F');
          doc.text(
            `الملخص: ${totalSigns} لوحة | ${totalFaces} وجه | ${totalPrintingMeters.toFixed(1)} م² طباعة`,
            pageWidth - margin,
            currentY + 5,
            { align: "right" }
          );
          
          // Reset text color
          doc.setTextColor(0, 0, 0);
          currentY += 12; // Extra space after summary
        } else {
          doc.setFontSize(10);
          doc.text("لا توجد لوحات إعلانية لهذا الزبون", pageWidth - margin, currentY, { align: "right" });
          currentY += 10;
        }
      });
    } else {
      doc.setFontSize(12);
      doc.text("لا توجد بيانات للعرض", pageWidth / 2, currentY, { align: "center" });
      currentY += 20;
    }

    // Add footer with company name on all pages
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      
      // Add horizontal line
      doc.setLineWidth(0.1);
      doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
      
      doc.text("شركة الإعلانات السورية", pageWidth / 2, pageHeight - 10, { align: "center" });
      
      // Add page number and date in footer
      doc.text(
        `الصفحة ${i} من ${totalPages} | ${new Date().toLocaleDateString('ar-EG')}`,
        pageWidth - margin,
        pageHeight - 10,
        { align: "right" }
      );
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