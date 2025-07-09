// Inline styles are used due to conflicts between html2pdf.js and the oklch color system in shadcn
export const styles = {
  contractPageContainer: {
    maxWidth: "800px",
    margin: "20px auto",
    padding: "0",
    position: "relative",
  },
  logo: {
    width: "100px",
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
    padding: "30px",
    boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
    backgroundColor: "#fff",
    lineHeight: "1.6",
    color: "#333",
    direction: "rtl",
    textAlign: "right",
    marginTop: "40px",
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
  adTable: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "15px",
    fontSize: "0.7em",
    pageBreakInside: "avoid",
    breakInside: "avoid",
  },
  adTableThTd: {
    border: "1px solid #ddd",
    padding: "6px",
    textAlign: "center",
    width: "400px",
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
