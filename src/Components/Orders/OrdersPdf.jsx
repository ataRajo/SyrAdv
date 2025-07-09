import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import "../../assets/fonts/Amiri-Regular.js";

const OrdersPdf = ({ orders }) => {
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
    const title = "بيانات الطلبات";
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(16);
    doc.text(title, pageWidth / 2, 15, { align: "center" });

    // Define table headers (in reverse order for RTL)
    const headers = [
      [
        "الملاحظات",
        "تاريخ العملية",
        "المنطقة",

        "المكان",

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
        item.road_sign.place,
        item.road_sign.region.name,
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
        0: { cellWidth: 20 },
        1: { cellWidth: 40 },
        2: { cellWidth: 50 },
        3: { cellWidth: 30 },
        4: { cellWidth: 30 },
        5: { cellWidth: 40 },
        6: { cellWidth: 40 },
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
