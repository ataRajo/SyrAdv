import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import "../../assets/fonts/Amiri-Regular.js"; // Import the Amiri font file
import { loadSacLetterheadAssets } from "../../utils/branding/sacBrand";
import {
  SAC_RGB,
  applySacLetterhead,
  drawSacTitle,
  sacAutoTableMargin,
  stampSacLetterheadOnAllPages,
} from "../../utils/branding/pdfLetterheadJsPdf";

const RoadSignsPdf = ({ roadSigns, endDate, startDate }) => {
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
    const title = "بيانات اللوحات الطرقية";

    drawSacTitle(doc, title, `تاريخ التقرير: ${new Date().toLocaleDateString("en-GB")}`);
    doc.setFont("Amiri-Regular", "normal");

    // Define table headers (in reverse order for RTL)
    const headers = [
      [
        "المكان",
        "المنطقة",
        "المدينة",
        "عدد اللوحات ",
        "شكل اللوحة",
        "القياس",
        "نموذج اللوحة",
      ],
    ];

    // Map data to table rows
    const tableData = roadSigns?.data?.map((item) => [
      item.place,
      item.region.name,
      item.city.name,
      item.panels_number,
      item.template.type,
      item.template.size,
      item.template.model,
    ]);

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
        0: { cellWidth: 40 },
        1: { cellWidth: 35 },
        2: { cellWidth: 35 },
        3: { cellWidth: 45 },
        4: { cellWidth: 40 },
        5: { cellWidth: 40 },
        6: { cellWidth: "auto" },
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
    doc.save("لوحات_طرقية.pdf");
  };

  return { generatePDF };
};

export default RoadSignsPdf;
