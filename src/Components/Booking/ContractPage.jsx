import { useRef } from "react";
import html2pdf from "html2pdf.js";
import logo from "../../assets/images/adv_syrian.png";
import { useParams } from "react-router";
import { useGetOneBookingsQuery } from "../../RtkQuery/Slice/Booking/BookingApi";
import { styles } from "./ContractStyle";
import DOMPurify from "dompurify";

/**
 * ContractPage Component
 * Displays a detailed advertising contract and provides functionality to export it as a PDF.
 */
const ContractPage = () => {
  // Reference to the content div that will be converted to PDF.
  const contentRef = useRef(null);
  // Get booking ID from URL parameters.
  const { id: bookingId } = useParams();

  // Fetch booking data using RTK Query.
  const { data: getBooking, isSuccess } = useGetOneBookingsQuery(bookingId);

 
  // Prepare contract details for display.
  const contractDetails = {
    firstParty: {
      name: getBooking?.user.full_name,
      company: getBooking?.user?.company?.name,
      commercialRegister: getBooking?.user?.company?.commercial_registration_number,
      address: getBooking?.user?.company?.address,
      phone: getBooking?.user.phone_number,
      role: " مدير مبيعات",
    },
    secondParty: {
      name: getBooking?.customer.full_name,
      company: getBooking?.customer.company_name,
      commercialRegister: getBooking?.customer.commercial_registration_number,
      address: getBooking?.customer.address,
      phone: getBooking?.customer.phone_number,
    },
    introduction: {
      secondPartyDesire: "يرغب في الترويج للمنتجات العائدة للشركة من خلال الإعلانات الطرقية",
      firstPartyPossession:
        "يمتلك لوحات إعلانية طرقية بموجب ترخيص المؤسسة العربية للإعلان رقم / 4 / تاريخ 9/5/2012 ويملك حق الاعلان لذا اتفق الفريقان على ما يلي  ",
    },
  };

  /**
   * Generates and downloads the contract as a PDF file.
   */
  const generatePdf = () => {
    const element = contentRef.current; // Get the content element.

    // Define PDF generation options for html2pdf.js.
    const pdfOptions = {
      margin: [10, 10, 10, 10], // Page margins in mm.
      filename: `عقد_إعلاني_${new Date().toISOString().slice(0, 10)}.pdf`, // Dynamic filename with current date.
      image: { type: "jpeg", quality: 0.95 }, // Image quality for embedded images.
      html2canvas: {
        scale: 3, // Higher scale for better resolution of HTML content.
        logging: false, // Disable console logging for html2canvas.
        dpi: 300, // Dots per inch for high-quality print output.
        letterRendering: true, // Improve text rendering quality.
        useCORS: true, // Allow cross-origin image loading.
        allowTaint: false, // Prevent tainting canvas with cross-origin content (more secure).
        ignoreElements: (element) => {
          // Exclude specific HTML tags from the PDF capture.
          return (
            element.tagName === "STYLE" ||
            element.tagName === "LINK" ||
            element.tagName === "SCRIPT"
          );
        },
        onclone: (document) => {
          // Callback to modify the cloned DOM before rendering to canvas.
          // Hides the PDF export button from the generated PDF.
          const button = document.getElementById("pdf-export-button");
          if (button) {
            button.style.display = "none";
          }
        },
      },
      jsPDF: {
        unit: "mm", // Unit for jsPDF calculations.
        format: "a4", // Page format.
        orientation: "portrait", // Page orientation.
        putTotalPages: true, // Add "Page X of Y" to the PDF.
        // encryption: {
        //   // PDF encryption settings.
        //   userPermissions: ["print", "modify"],
        //   userPassword: "super",
        // },
      },
      pagebreak: {
        // Control page breaks in the PDF.
        mode: ["css", "legacy"],
        before: ".break-before",
        after: ".break-after",
      },
    };

    // Execute PDF generation.
    html2pdf()
      .set(pdfOptions)  
      .from(element) 
      .save() 
      .then(() => {
        console.log("PDF generated successfully!");
      })
      .catch((error) => {
        console.error("Error generating PDF:", error);
        alert("حدث خطأ أثناء إنشاء ملف PDF. يرجى مراجعة وحدة التحكم (F12).");
      });
  };



  // Show loading state while data is being fetched.
  if (!isSuccess) {
    return <div className="text-center mt-5">...جاري توليد العقد </div>;
  }

  // Render the contract page with fetched data.
  return (
    <div style={styles.contractPageContainer}>
      <button id="pdf-export-button" style={styles.pdfExportButton} onClick={generatePdf}>
        تصدير إلى PDF
      </button>

      <div style={styles.contractPage} ref={contentRef}>
        <div style={styles.header}>
          <img style={styles.logo} src={logo} alt="logo" />
          <h1 style={styles.headerH1}>عقد إعلاني</h1>
        </div>

        <div style={styles.partiesInfo}>
          <div style={styles.party}>
            <strong style={styles.partyH2}>الطرف الأول:</strong>
            {contractDetails.firstParty.company} المسجلة بالسجل التجاري رقم{" "}
            {contractDetails.firstParty.commercialRegister} الممثلة بالسيد{" "}
            {contractDetails.firstParty.name} بصفة {contractDetails.firstParty.role} و
            المتخذ عنوانا - {contractDetails.firstParty.address} - هاتف :{" "}
            {contractDetails.firstParty.phone}
          </div>

          <div style={styles.party}>
            <strong style={styles.partyH2}>الطرف الثاني:</strong> شركة{" "}
            {contractDetails.secondParty.company} المسجلة بالسجل التجاري رقم{" "}
            {contractDetails.secondParty.commercialRegister} الممثلة بالسيد{" "}
            {contractDetails.secondParty.name} و المتخذ عنوانا -{" "}
            {contractDetails.secondParty.address} - هاتف :{" "}
            {contractDetails.secondParty.phone}
          </div>
        </div>

        <div style={styles.introduction}>
          <h2 style={styles.introductionH2}>مقدمة:</h2>
          <p>
            حيث الفريق الثاني {contractDetails.introduction.secondPartyDesire} وبما أن
            الفريق الأول {contractDetails.introduction.firstPartyPossession} .
          </p>
        </div>

        <div style={styles.adDetailsSection}>
          <h2 style={styles.adDetailsSectionH2}>
            1- يتم الإعلان من خلال اللوحات المبنية بالجدول التالي:
          </h2>
          <table style={styles.adTable}>
            <thead>
              <tr>
                <th style={{ ...styles.adTableThTd, ...styles.adTableTh }}>النموذج</th>
                <th style={{ ...styles.adTableThTd, ...styles.adTableTh }}>النوع</th>
                <th style={{ ...styles.adTableThTd, ...styles.adTableTh }}>
                  مكان التموضع
                </th>
                <th style={{ ...styles.adTableThTd, ...styles.adTableTh }}>الإتجاه</th>
                <th style={{ ...styles.adTableThTd, ...styles.adTableTh }}>
                  عدد الأوجه
                </th>
                <th style={{ ...styles.adTableThTd, ...styles.adTableTh }}>
                   من تاريخ
                </th>
                <th style={{ ...styles.adTableThTd, ...styles.adTableTh }}>
                  الى تاريخ
                </th>

                <th style={{ ...styles.adTableThTd, ...styles.adTableTh }}>
                  المدة الإعلانية (بالايام)
                </th>
                <th style={{ ...styles.adTableThTd, ...styles.adTableTh }}>
                  السعر الإفرادي للأوجه شامل الطباعة لمرة واحدة
                </th>
              </tr>
            </thead>
            <tbody>
              {getBooking?.roadsigns?.map((ad, index) => (
                <tr key={index}>
                  <td style={styles.adTableThTd}>{ad.template?.model}</td>
                  <td style={styles.adTableThTd}>{ad.template?.type}</td>
                  <td style={styles.adTableThTd}>{ad?.place}</td>
                  <td style={styles.adTableThTd}>{ad?.directions}</td>
                  <td style={styles.adTableThTd}>{ad?.pivot.booking_faces} وجه اعلاني</td>
                  <td style={styles.adTableThTd}>{ad?.pivot.start_date}  </td>
                  <td style={styles.adTableThTd}>{ad?.pivot.end_date}  </td>

                  <td style={styles.adTableThTd}>{ad?.pivot.days_of_reservation} يوم</td>
                  <td style={styles.adTableThTd}>
                  
                    {ad?.pivot.total_faces_price}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <table style={styles.adTable}>
          <tbody>
            <tr>
              <th style={{ ...styles.adTableThTd, ...styles.adTableTh }}>
                القيمة الكلية قبل الحسم عن {getBooking?.duration_of_days} يوم فترة إعلانية  
              </th>
              <td style={styles.adTableThTd}>{getBooking?.total_price_befor_discount} $</td>
            </tr>
            {getBooking?.value && (
              <tr>
                <th style={{ ...styles.adTableThTd, ...styles.adTableTh }}>
                  حسم خاص مقدم من الشركة السورية
                </th>
                <td style={styles.adTableThTd}>
                  {getBooking.discount_type === 1 ? (
                    <span>{getBooking.value} $ </span>
                  ) : (
                    <span>{getBooking.value} %</span>
                  )}
                </td>
              </tr>
            )}
            <tr>
              <th style={{ ...styles.adTableThTd, ...styles.adTableTh }}>
                القيمة الكلية بعد الحسم عن {getBooking?.duration_of_days} يوم فترة إعلانية  
              </th>
              <td style={styles.adTableThTd}>{getBooking?.total_price} $ </td>
            </tr>
          </tbody>
        </table>

        <div style={{ margin: "20px 0" }}>
          <strong>
            - السعر يشمل أجور الطباعة لمرة واحدة فقط و تكاليف الرسوم الإعلانية.
          </strong>
          {getBooking?.groupedTemplates.map((tem, ind) => (
            <div key={ind}>
              <p>
                العدد الكلي لنموذج {tem?.model} بعدد{" "}
                <span>{tem?.total_faces} وجه إعلاني</span>
              </p>
            </div>
          ))}

          <div>
            إجمالي الأمتار الطباعية :{" "}

          {getBooking?.total_printing_space}

          </div>

        </div>

        <div>
          {getBooking?.notes ? (
            <div className="list-decimal pr-6">
              {(() => {
                const cleanText = DOMPurify.sanitize(getBooking.notes, {
                  ALLOWED_TAGS: [],
                });
                return cleanText.split(/(?=\d+-\s)/).map((item, index) => (
                  <p key={index} className="mb-2">
                    {item.trim()}
                  </p>
                ));
              })()}
            </div>
          ) : (
            <p>لا توجد ملاحظات</p>
          )}
        </div>

        <div style={{ margin: "20px 0" }}>
          <strong>
            - تبدأ الحملة الإعلانية بتاريخ{" "}
            {new Date(getBooking?.start_date).toLocaleDateString("en-US")} و تنتهي بتاريخ{" "}
            {new Date(getBooking?.end_date).toLocaleDateString("en-US")}
          </strong>
        </div>

        <div style={styles.signatures}>
          <div style={styles.signatureParty}>
            <h3 style={styles.signaturePartyH3}>
              {contractDetails.firstParty.company}
            </h3>
            <p>الفريق الأول: {contractDetails.firstParty.name}</p>
          </div>
          <div style={styles.signatureParty}>
            <h3 style={styles.signaturePartyH3}>
              {contractDetails.secondParty.company}
            </h3>
            <p>الفريق الثاني: {contractDetails.secondParty.name}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractPage;