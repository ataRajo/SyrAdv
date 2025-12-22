import { useRef } from "react";
import html2pdf from "html2pdf.js";
import logo from "../../assets/images/adv_syrian.png";
import { useParams } from "react-router";
import { useGetOneBookingsQuery } from "../../RtkQuery/Slice/Booking/BookingApi";
import { styles } from "./ContractStyle";
import DOMPurify from "dompurify";

// Define booking type mappings (same as in your BookingColumns)
const BookingType = {
  1: "مؤقت",  // Temporary
  2: "دائم",  // Permanent
  // Add other types if they exist
};

// Helper function to get period text - just show the number
const getPeriodText = (units) => {
  if (!units) return "1";
  return `${units}`;
};

const ContractPage = () => {
  const contentRef = useRef(null);
  const { id: bookingId } = useParams();

  const { data: getBooking, isSuccess, isLoading, error } = useGetOneBookingsQuery(bookingId);

  // Debug: Log the data to see what we're getting
  console.log("Booking Data:", getBooking);
  console.log("Booking Units:", getBooking?.units);
  console.log("Period Text:", getPeriodText(getBooking?.units));

  // Prepare contract details for display.
  const contractDetails = {
    firstParty: {
      name: getBooking?.user?.full_name || "غير محدد",
      company: getBooking?.user?.company?.name || "غير محدد",
      commercialRegister: getBooking?.user?.company?.commercial_registration_number || "غير محدد",
      address: getBooking?.user?.company?.address || "غير محدد",
      phone: getBooking?.user?.phone_number || "غير محدد",
      role: "مدير مبيعات",
    },
    secondParty: {
      name: getBooking?.customer?.full_name || "غير محدد",
      company: getBooking?.customer?.company_name || "غير محدد",
      commercialRegister: getBooking?.customer?.commercial_registration_number || "غير محدد",
      address: getBooking?.customer?.address || "غير محدد",
      phone: getBooking?.customer?.phone_number || "غير محدد",
    },
    introduction: {
      secondPartyDesire: "يرغب في الترويج للمنتجات العائدة للشركة من خلال الإعلانات الطرقية",
      firstPartyPossession:
        "يمتلك لوحات إعلانية طرقية بموجب ترخيص المؤسسة العربية للإعلان رقم / 4 / تاريخ 9/5/2012 ويملك حق الاعلان لذا اتفق الفريقان على ما يلي",
    },
  };

  // Determine booking type with numeric check
  const bookingType = getBooking?.type;
  const isTemporaryBooking = bookingType === 1; // Check for numeric 1
  const bookingTypeText = BookingType[bookingType] || "غير محدد";
  
  // Get period text from units
  const periodText = getPeriodText(getBooking?.units);

  const generatePdf = () => {
    const element = contentRef.current;
    if (!element) {
      console.error("No content element found");
      return;
    }

    const pdfOptions = {
      margin: [10, 10, 10, 10],
      filename: `عقد_إعلاني_${bookingTypeText}_${new Date().toISOString().slice(0, 10)}.pdf`,
      image: { type: "jpeg", quality: 0.95 },
      html2canvas: {
        scale: 3,
        logging: false,
        dpi: 300,
        letterRendering: true,
        useCORS: true,
        allowTaint: false,
        ignoreElements: (element) => {
          return (
            element.tagName === "STYLE" ||
            element.tagName === "LINK" ||
            element.tagName === "SCRIPT"
          );
        },
        onclone: (document) => {
          const button = document.getElementById("pdf-export-button");
          if (button) {
            button.style.display = "none";
          }
        },
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
        putTotalPages: true,
      },
      pagebreak: {
        mode: ["css", "legacy"],
        before: ".break-before",
        after: ".break-after",
      },
    };

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

  // Show loading state
  if (isLoading) {
    return <div className="text-center mt-5">...جاري تحميل بيانات العقد</div>;
  }

  // Show error state
  if (error) {
    return (
      <div className="text-center mt-5 text-red-500">
        خطأ في تحميل البيانات: {error.message || "حدث خطأ غير متوقع"}
      </div>
    );
  }

  // Show if no data
  if (!getBooking) {
    return <div className="text-center mt-5">لا توجد بيانات للعقد</div>;
  }

  // Temporary Contract Component
  const TemporaryContract = () => (
    <div style={styles.contractPage} ref={contentRef}>
      <div style={styles.header}>
        <img style={styles.logo} src={logo} alt="logo" />
        <h1 className="text-2xl" style={styles.headerH1}>عرض فني ومالي</h1>
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
          هذا عقد إعلاني <strong>مؤقت</strong> حيث الفريق الثاني {contractDetails.introduction.secondPartyDesire} 
          وبما أن الفريق الأول {contractDetails.introduction.firstPartyPossession} .
        </p>
      </div>

      {/* Temporary-specific content */}
      <div style={{ margin: "20px 0", padding: "15px", backgroundColor: "#f5f5f5", border: "1px solid #ddd" }}>
        <h3 style={styles.introductionH2}>شروط خاصة بالعقد المؤقت:</h3>
        <ul style={{ listStyle: "decimal", paddingRight: "20px" }}>
          <li>هذا العقد ساري المفعول للفترة المحددة في الجدول أدناه فقط</li>
          <li> قابل للتمديد بعد انتهاء المدة</li>
          <li className="text-red-500">لديك 24 ساعة للتأكيد اذا كنت تريد تأكيد هذا الحجز أم لا </li>
        </ul>
      </div>

      {/* Rest of your existing content */}
      <div style={styles.adDetailsSection}>
        <h2 style={styles.adDetailsSectionH2}>
          1- يتم الإعلان المؤقت من خلال اللوحات المبنية بالجدول التالي:
        </h2>
        <table style={styles.adTable}>
          <thead>
            <tr>
              <th style={{ ...styles.adTableThTd, ...styles.adTableTh }}>النموذج</th>
              <th style={{ ...styles.adTableThTd, ...styles.adTableTh }}>النوع</th>
              <th style={{ ...styles.adTableThTd, ...styles.adTableTh }}>مكان التموضع</th>
              <th style={{ ...styles.adTableThTd, ...styles.adTableTh }}>الإتجاه</th>
              <th style={{ ...styles.adTableThTd, ...styles.adTableTh }}>عدد الأوجه</th>
              <th style={{ ...styles.adTableThTd, ...styles.adTableTh }}>المدة الإعلانية (بالايام)</th>
              <th style={{ ...styles.adTableThTd, ...styles.adTableTh }}>السعر الإفرادي</th>
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
                <td style={styles.adTableThTd}>{ad?.pivot.days_of_reservation} يوم</td>
                <td style={styles.adTableThTd}>{ad?.pivot.total_faces_price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <table style={styles.adTable}>
        <tbody>
          <tr>
            <th style={{ ...styles.adTableThTd, ...styles.adTableTh }}>
              القيمة الكلية قبل الحسم عن {periodText} فترة إعلانية  
            </th>
            <td style={styles.adTableThTd}>{getBooking?.total_price_befor_discount} $</td>
          </tr>
          
          {/* ✅ NEW: Add printing price row in the table */}
          {getBooking?.printing?.price && (
            <tr>
              <th style={{ ...styles.adTableThTd, ...styles.adTableTh }}>
                سعر الطباعة
              </th>
              <td style={styles.adTableThTd}>{getBooking.printing.price} $</td>
            </tr>
          )}
          
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
              القيمة الكلية بعد الحسم عن {periodText} فترة إعلانية  
            </th>
            <td style={styles.adTableThTd}>{getBooking?.total_price} $ </td>
          </tr>
        </tbody>
      </table>

      <div style={{ margin: "20px 0" }}>
        <strong>
          - السعر يشمل أجور الطباعة لمرة واحدة فقط و تكاليف الرسوم الإعلانية.
        </strong>
        {getBooking?.groupedTemplates?.map((tem, ind) => (
          <div key={ind}>
            <p>
              العدد الكلي لنموذج {tem?.model} بعدد{" "}
              <span>{tem?.total_faces} وجه إعلاني</span>
            </p>
          </div>
        ))}

        <div>
          إجمالي الأمتار الطباعية : {getBooking?.total_printing_space}
        </div>
        
        {/* ❌ REMOVED: Printing price is now in the table above */}
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
  );

  // Permanent Contract Component
  const PermanentContract = () => (
    <div style={styles.contractPage} ref={contentRef}>
      <div style={styles.header}>
        <img style={styles.logo} src={logo} alt="logo" />
        <h1 style={styles.headerH1}>عقد إعلاني دائم</h1>
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
              <th style={{ ...styles.adTableThTd, ...styles.adTableTh }}>مكان التموضع</th>
              <th style={{ ...styles.adTableThTd, ...styles.adTableTh }}>الإتجاه</th>
              <th style={{ ...styles.adTableThTd, ...styles.adTableTh }}>عدد الأوجه</th>
              <th style={{ ...styles.adTableThTd, ...styles.adTableTh }}>المدة الإعلانية (بالايام)</th>
              <th style={{ ...styles.adTableThTd, ...styles.adTableTh }}>السعر الإفرادي</th>
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
                <td style={styles.adTableThTd}>{ad?.pivot.days_of_reservation} يوم</td>
                <td style={styles.adTableThTd}>{ad?.pivot.total_faces_price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <table style={styles.adTable}>
        <tbody>
          <tr>
            <th style={{ ...styles.adTableThTd, ...styles.adTableTh }}>
              القيمة الكلية قبل الحسم عن {periodText} فترة إعلانية  
            </th>
            <td style={styles.adTableThTd}>{getBooking?.total_price_befor_discount} $</td>
          </tr>
          
          {/* ✅ NEW: Add printing price row in the table */}
          {getBooking?.printing?.price && (
            <tr>
              <th style={{ ...styles.adTableThTd, ...styles.adTableTh }}>
                سعر الطباعة
              </th>
              <td style={styles.adTableThTd}>{getBooking.printing.price} $</td>
            </tr>
          )}
          
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
              القيمة الكلية بعد الحسم عن {periodText} فترة إعلانية  
            </th>
            <td style={styles.adTableThTd}>{getBooking?.total_price} $ </td>
          </tr>
        </tbody>
      </table>

      <div style={{ margin: "20px 0" }}>
        <strong>
          - السعر يشمل أجور الطباعة لمرة واحدة فقط و تكاليف الرسوم الإعلانية.
        </strong>
        {getBooking?.groupedTemplates?.map((tem, ind) => (
          <div key={ind}>
            <p>
              العدد الكلي لنموذج {tem?.model} بعدد{" "}
              <span>{tem?.total_faces} وجه إعلاني</span>
            </p>
          </div>
        ))}

        <div>
          إجمالي الأمتار الطباعية : {getBooking?.total_printing_space}
        </div>
        
        {/* ❌ REMOVED: Printing price is now in the table above */}
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
      <p className="mt-6">دمشق 09393333336 - حلب 0992400040</p>
      <span>www.syrianco.com /</span> 
      <span>info@syrianco.com</span> 
      <p>الشركة السورية للإعلان</p>
    </div>
  );

  return (
    <div style={styles.contractPageContainer}>
      <button id="pdf-export-button" style={styles.pdfExportButton} onClick={generatePdf}>
        تصدير إلى PDF ({bookingTypeText})
      </button>

      {isTemporaryBooking ? <TemporaryContract /> : <PermanentContract />}
    </div>
  );
};

export default ContractPage;