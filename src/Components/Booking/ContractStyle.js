// Inline styles are used due to conflicts between html2pdf.js and the oklch color system in shadcn
export const styles = {
  contractPageContainer: {
    maxWidth: "800px",
    width: "100%",
    boxSizing: "border-box",
    margin: "20px auto",
    padding: "0 8px",
    position: "relative",
  },
  // شريط الأزرار/اللغة: في تدفق الصفحة (لا absolute) كي لا يتداخل مع العقد على الشاشات الصغيرة
  toolbar: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "10px",
    marginBottom: "12px",
  },
  logo: {
    width: "100px",
    maxWidth: "100%",
    height: "auto",
    margin: "0 auto",
    display: "block",
  },
  pdfExportButton: {
    position: "absolute",
    top: "10px",
    right: "10px",
    backgroundColor: "#007bff",
    color: "white",
    padding: "10px 20px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "1em",
    zIndex: "100",
    boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
  },
  contractPage: {
    fontFamily: "Arial, sans-serif",
    padding: "clamp(12px, 4vw, 30px)",
    boxSizing: "border-box",
    width: "100%",
    maxWidth: "100%",
    overflowWrap: "anywhere",
    wordBreak: "break-word",
    boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
    backgroundColor: "#fff",
    lineHeight: "1.6",
    color: "#333",
    direction: "rtl",
    textAlign: "right",
    marginTop: "0",
    fontSize: "16px",
  },
  header: {
    textAlign: "center",
    marginBottom: "30px",
    pageBreakInside: "avoid",
    breakInside: "avoid",
  },
  headerH1: {
    fontSize: "1em",
    marginTop: "15px",
    color: "#000",
  },
  partiesInfo: {
    pageBreakInside: "avoid",
    breakInside: "avoid",
  },
  party: {
    flex: "1",
    padding: "0 15px",
    marginBottom: "20px",
  },
  partyH2: {
    fontSize: "1.19em",
  },
  introduction: {
    padding: "8px 15px",
    pageBreakInside: "avoid",
    breakInside: "avoid",
  },
  introductionH2: {
    fontSize: "1.3em",
    marginBottom: "10px",
  },
  adDetailsSection: {
    paddingBottom: "20px",
  },
  adDetailsSectionH2: {
    fontSize: "1.3em",
    marginBottom: "15px",
  },
  // غلاف الجدول: على الشاشات الضيقة يتمرر أفقيًا بدل أن يُقَصّ أو يتداخل.
  // أثناء تصدير PDF يُلغى التمرير ويُثبَّت عرض الصفحة (راجع generatePdf).
  tableScroll: {
    width: "100%",
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
  },
  adTable: {
    width: "100%",
    maxWidth: "100%",
    borderCollapse: "collapse",
    marginTop: "15px",
    fontSize: "0.7em",
    tableLayout: "auto",
  },
  // الصف الواحد لا يُقسَم بين صفحتين، والجدول نفسه قد يمتد لعدة صفحات
  adTableRow: {
    pageBreakInside: "avoid",
    breakInside: "avoid",
  },
  adTableThTd: {
    border: "1px solid #ddd",
    padding: "6px",
    textAlign: "center",
    verticalAlign: "middle",
    overflowWrap: "anywhere",
    wordBreak: "break-word",
    boxSizing: "border-box",
  },
  adTableTh: {
    backgroundColor: "#f2f2f2",
    fontWeight: "bold",
  },
  signatures: {
    display: "flex",
    justifyContent: "space-around",
    pageBreakInside: "avoid",
    breakInside: "avoid",
  },
  signatureParty: {
    textAlign: "center",
    width: "100%",
    paddingTop: "10px",
  },
  signaturePartyH3: {
    fontSize: "1.1em",
    marginBottom: "5px",
  },
};
