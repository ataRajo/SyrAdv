import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import "../../assets/fonts/Amiri-Regular.js"; // Import the Amiri font file

const RoadSignsPdf = ({ roadSigns, endDate, startDate }) => {
  const generatePDF = () => {
    // Initialize jsPDF with A4 landscape settings
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // Register Amiri font
    doc.setFont("Amiri-Regular", "normal");

    // Add title in the center
    const title = "بيانات اللوحات الطرقية";

    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(16);
    doc.text(title, pageWidth / 2, 15, { align: "center" });

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
    const tableData = roadSigns.map((item) => [
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
        textColor: [0, 0, 0],
        fontStyle: "normal",
      },
      headStyles: {
        font: "Amiri-Regular",
        halign: "center",
        fontSize: 8,
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: "normal",
      },
      margin: { top: 25, left: 10, right: 10 },
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
      startY: 25,
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

    // Save the PDF
    doc.save("لوحات_طرقية.pdf");
  };

  return { generatePDF };
};

export default RoadSignsPdf;
