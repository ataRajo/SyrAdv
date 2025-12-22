import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import "../../assets/fonts/Amiri-Regular.js";

export const ReportPdf = ({
  customers,
  from_date,
  to_date,
  globalModelCounts,
  total_advertising_space_all_customers,
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
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;

    // Dynamic title based on filter
    const title = isFilteredByCustomer 
      ? "تقرير حجوزات زبون"
      : "تقرير الحجز الأسبوعي";
    
    doc.setFontSize(18);
    doc.text(title, pageWidth / 2, margin + 5, { align: "center" });

    doc.setFontSize(10);
    
    // Add customer name if filtered
    if (isFilteredByCustomer && selectedCustomer) {
      const customerName = selectedCustomer.company_name || selectedCustomer.full_name || "غير معروف";
      doc.text(
        `الزبون: ${customerName}`,
        pageWidth - margin,
        margin + 15,
        { align: "right" }
      );
      doc.text(
        `من تاريخ: ${from_date ? new Date(from_date).toLocaleDateString("en-US") : "غير محدد"}`,
        pageWidth - margin,
        margin + 25,
        { align: "right" }
      );
      doc.text(
        `إلى تاريخ: ${to_date ? new Date(to_date).toLocaleDateString("en-US") : "غير محدد"}`,
        pageWidth - margin,
        margin + 30,
        { align: "right" }
      );
    } else {
      doc.text(
        `من تاريخ: ${from_date ? new Date(from_date).toLocaleDateString("en-US") : "غير محدد"}`,
        pageWidth - margin,
        margin + 15,
        { align: "right" }
      );
      doc.text(
        `إلى تاريخ: ${to_date ? new Date(to_date).toLocaleDateString("en-US") : "غير محدد"}`,
        pageWidth - margin,
        margin + 20,
        { align: "right" }
      );
    }
    
    doc.text(
      `المنتج: ${product || "غير محدد"}`,
      pageWidth - margin,
      margin + (isFilteredByCustomer ? 35 : 25),
      { align: "right" }
    );

    let currentY = margin + (isFilteredByCustomer ? 45 : 35);

    // Check if there are customers to display
    if (customers && customers.length > 0) {
      customers.forEach((customer, index) => {
        // Calculate this customer's total advertising space
        let customerTotalSpace = 0;
        if (customer.roadSigns && customer.roadSigns.length > 0) {
          customerTotalSpace = customer.roadSigns.reduce((total, sign) => {
            const space = parseFloat(sign.total_advertising_space) || 0;
            return total + space;
          }, 0);
        }

        // Add new page for each customer after the first one
        if (index > 0) {
          doc.addPage();
          currentY = margin;
        }

        // Show customer name and their total
        doc.setFontSize(14);
        const customerName = customer.full_name || customer.company_name || "غير معروف";
        
        if (isFilteredByCustomer) {
          // When filtered by customer, show name and total on same line
          doc.text(
            `اسم الزبون: ${customerName}`,
            pageWidth - margin,
            currentY,
            { align: "right" }
          );
          currentY += 10;
        } else {
          // When showing all customers, show name and total separately
          doc.text(
            `اسم الزبون: ${customerName}`,
            pageWidth - margin,
            currentY,
            { align: "right" }
          );
          currentY += 7;
          
          // Show customer-specific total
          doc.setFontSize(12);
          doc.text(
            `إجمالي الأمتار الإعلانية لهذا الزبون: ${customerTotalSpace.toFixed(2)}`,
            pageWidth - margin,
            currentY,
            { align: "right" }
          );
          currentY += 10;
        }

        // Check if customer has roadSigns
        if (customer.roadSigns && customer.roadSigns.length > 0) {
          const roadSignsHeaders = [
            [
              "عدد الأمتار الإعلانية",
              "القياس",
              "عدد الأوجه",
              "التموضع",
              "ترميز اللوحة",
            ],
          ];

          const roadSignsData = customer.roadSigns.map((sign) => [
            sign.total_advertising_space || "0.00",
            sign.template?.advertising_space || "غير معروف",
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
          currentY = doc.lastAutoTable.finalY + 10;
          
          // When filtered by single customer, show their total at the end
          if (isFilteredByCustomer) {
            doc.setFontSize(12);
            doc.text(
              `إجمالي الأمتار الإعلانية للزبون: ${customerTotalSpace.toFixed(2)}`,
              pageWidth - margin,
              currentY,
              { align: "right" }
            );
            currentY += 10;
          }
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
      currentY = margin;
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
      currentY = doc.lastAutoTable.finalY + 10;
      
      // Show global total when viewing all customers
      if (total_advertising_space_all_customers) {
        doc.setFontSize(12);
        doc.text(
          `إجمالي الأمتار الإعلانية لجميع الزبائن: ${total_advertising_space_all_customers || "0.00"}`,
          pageWidth - margin,
          currentY,
          { align: "right" }
        );
      }
    }

    // Dynamic filename based on filter
    const fileName = isFilteredByCustomer && selectedCustomer
      ? `تقرير_${selectedCustomer.company_name || selectedCustomer.full_name || "زبون"}_${new Date().toLocaleDateString('ar-EG')}.pdf`
      : "التقرير_الأسبوعي.pdf";

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