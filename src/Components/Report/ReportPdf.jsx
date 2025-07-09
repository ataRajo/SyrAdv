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

    const title = "تقرير الحجز الأسبوعي";
    doc.setFontSize(18);
    doc.text(title, pageWidth / 2, margin + 5, { align: "center" });

    doc.setFontSize(10);
    doc.text(
      `من تاريخ: ${
        new Date(from_date).toLocaleDateString("en-US") || "غير متوفر"
      }`,
      pageWidth - margin,
      margin + 15,
      { align: "right" }
    );
    doc.text(
      `إلى تاريخ: ${
        new Date(to_date).toLocaleDateString("en-US") || "غير متوفر"
      }`,
      pageWidth - margin,
      margin + 20,
      { align: "right" }
    );
    doc.text(
      ` المنتج: ${product || "غير متوفر"}`,
      pageWidth - margin,
      margin + 25,
      { align: "right" }
    );

    let currentY = margin + 35;

    customers.forEach((customer) => {
      doc.setFontSize(14);
      doc.text(
        `${customer.full_name || "غير متوفر"} :اسم الزبون`,
        pageWidth - margin,
        currentY,
        { align: "right" }
      );
      currentY += 10;

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
        sign.template.advertising_space || "غير متوفر",
        sign.pivot.booking_faces || "غير متوفر",
        sign.place || "غير متوفر",
        sign.template.model || "غير متوفر",
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
    });

    if (globalModelCounts && globalModelCounts.length > 0) {
      doc.addPage();
      currentY = margin;
      doc.setFontSize(16);
      doc.text("ملخص النماذج", pageWidth / 2, currentY, { align: "center" });
      currentY += 10;

      const modelSummaryHeaders = [
        ["عدد اللوحات الكلي من هذا النموذج","عدد اللوحات المتاحة من هذا النموذج", "عدد اللوحات المحجوزة من هذا النموذج", "النموذج"],
      ];

      const modelSummaryData = globalModelCounts.map((model) => [
        model?.total_panels || "0.00",
        model?.available_panels || "0.00",
        model?.reserved_panels || "0",
        model?.model || "غير متوفر",
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
    }

    doc.setFontSize(12);
    doc.text(
      `إجمالي الأمتار الإعلانية لجميع الزبائن: ${
        total_advertising_space_all_customers || "0.00"
      }`,
      pageWidth - margin,
      currentY,
      { align: "right" }
    );

    doc.save("التقرير_الأسبوعي.pdf");
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
