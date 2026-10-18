import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import "../../assets/fonts/Amiri-Regular.js";
import { loadSacLetterheadAssets } from "../../utils/branding/sacBrand";
import {
  SAC_RGB,
  applySacLetterhead,
  drawSacTitle,
  sacAutoTableMargin,
  stampSacLetterheadOnAllPages,
} from "../../utils/branding/pdfLetterheadJsPdf";

const OrdersPdf = ({ orders }) => {
  const generatePDF = async () => {
    // Official SAC letterhead art (logo corner, watermark, footer bar)
    await loadSacLetterheadAssets();

    // Initialize jsPDF with A4 landscape settings
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // Register Amiri font
    doc.setFont("Amiri-Regular", "normal");

    // Letterhead behind every page (autoTable page breaks included)
    const box = applySacLetterhead(doc);

    // Add title in the center
    const title = "بيانات الطلبات";
    drawSacTitle(doc, title, `تاريخ التقرير: ${new Date().toLocaleDateString("en-GB")}`);
    doc.setFont("Amiri-Regular", "normal");

    // Define table headers (in reverse order for RTL)
    const headers = [
      [
        "الملاحظات",
        "تاريخ العملية",
        "المكان",

        "المنطقة",

        "القياس",

        "نوع الطلب",
        "اسم الزبون الجديد",

        "اسم الزبون",
      ],
    ];

    // Map data to table rows
    const tableData = orders.map((item) => {
      // Convert type to human-readable text
      let orderType;
      switch (item.type) {
        case 1:
          orderType = "فك";
          break;
        case 2:
          orderType = "تركيب";
          break;
        case 3:
          orderType = "فك وتركيب";
          break;
        default:
          orderType = "غير معروف";
      }

      return [
        item.notes || " .......",

        item.action_date,
        item.road_sign?.place,
        item.road_sign?.region?.name,
        item.road_sign?.template?.size || "غير متوفر",
        orderType,
        item.customer_new?.company_name || "غير متوفر",
        item.customer?.company_name,
      ];
    });

    // Generate table using autoTable
    autoTable(doc, {
      head: headers,
      body: tableData,
      styles: {
        font: "Amiri-Regular",
        halign: "center",
        fontSize: 8,
        textColor: SAC_RGB.dark,
        lineColor: SAC_RGB.border,
        lineWidth: 0.2,
        fontStyle: "normal",
      },
      alternateRowStyles: { fillColor: SAC_RGB.goldPale },
      headStyles: {
        font: "Amiri-Regular",
        halign: "center",
        fontSize: 8,
        fillColor: SAC_RGB.gold,
        textColor: [255, 255, 255],
        fontStyle: "normal",
      },
      margin: sacAutoTableMargin(doc),
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 30 },
        2: { cellWidth: 45 },
        3: { cellWidth: 28 },
        4: { cellWidth: 22 },
        5: { cellWidth: 25 },
        6: { cellWidth: 35 },
        7: { cellWidth: 35 },
      },
      tableWidth: "auto",
      theme: "grid",
      startY: box.top,
      pageBreak: "auto",
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

    // Page numbers (the letterhead art is already behind every page)
    stampSacLetterheadOnAllPages(doc);

    // Save the PDF
    doc.save("طلبات.pdf");
  };

  return (
    <button
      onClick={generatePDF}
      type="button"
      className="bg-primary text-background px-4 py-2 cursor-pointer rounded-lg shadow-sm hover:bg-primary-dark transition-colors duration-200"
    >
      تصدير كملف PDF
    </button>
  );
};

export default OrdersPdf;
