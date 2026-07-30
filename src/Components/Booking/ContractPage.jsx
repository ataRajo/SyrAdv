import { useRef, useMemo  } from "react";
import html2pdf from "html2pdf.js";
import logo from "../../assets/images/adv_syrian.png";
import { useParams } from "react-router";
import { useGetOneBookingsQuery } from "../../RtkQuery/Slice/Booking/BookingApi";
import { styles } from "./ContractStyle";
import DOMPurify from "dompurify";
import BookingDocumentButtons from "./BookingDocumentButtons";

const BookingType = {
  1: "مؤقت",  
  2: "دائم",  
};

const getBase64FromUrl = (url) => {
  return fetch(url)
    .then(res => res.blob())
    .then(blob => new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    }));
};

const ContractPage = () => {
  const contentRef = useRef(null);
  const { id: bookingId } = useParams();

  const { data: getBooking, isSuccess, isLoading, error } = useGetOneBookingsQuery(bookingId);

  // ✅ 1. GROUP SIMILAR ROADSIGNS
  const groupedRoadsigns = useMemo(() => {
    if (!getBooking?.roadsigns) return [];

    const groups = {};
    
    getBooking.roadsigns.forEach(roadsign => {
      const key = [
        roadsign.template?.model || "غير محدد",
        roadsign.template?.type || "غير محدد",
        roadsign?.place || "غير محدد",
        roadsign?.directions || "غير محدد",
        roadsign?.pivot?.days_of_reservation || "غير محدد"
      ].join("|");

      if (!groups[key]) {
        groups[key] = {
          template_model: roadsign.template?.model,
          template_type: roadsign.template?.type,
          place: roadsign?.place,
          directions: roadsign?.directions,
          days_of_reservation: roadsign?.pivot?.days_of_reservation,
          booking_faces: roadsign?.pivot?.booking_faces || 0,
          total_faces_price: roadsign?.pivot?.total_faces_price || 0,
          count: 1,
          items: [roadsign],
          region_name: roadsign?.region?.name || "غير محدد"
        };
      } else {
        groups[key].booking_faces += roadsign?.pivot?.booking_faces || 0;
        groups[key].total_faces_price += roadsign?.pivot?.total_faces_price || 0;
        groups[key].count += 1;
        groups[key].items.push(roadsign);
      }
    });

    return Object.values(groups);
  }, [getBooking]);

  // ✅ 2. CALCULATE PRINTING TOTAL PRICE
  const printingTotalPrice = useMemo(() => {
    if (!getBooking?.printing_price || !getBooking?.total_printing_space) return 0;
    return getBooking.printing_price * getBooking.total_printing_space;
  }, [getBooking]);

  // ✅ 3. CALCULATE ADVERTISING PERIODS
  const calculateAdvertisingPeriods = useMemo(() => {
    if (!getBooking) return 1;
    
    const bookingType = getBooking.type;
    const roadsigns = getBooking.roadsigns || [];
    
    if (bookingType === 1) {
      let totalPeriods = 0;
      roadsigns.forEach(roadsign => {
        const periods = roadsign.pivot?.booking_faces || 1;
        totalPeriods += periods;
      });
      return totalPeriods;
    } else {
      return getBooking.units || 1;
    }
  }, [getBooking]);

  // ✅ 4. FORMAT PERIOD TEXT
  const periodText = useMemo(() => {
    const periods = calculateAdvertisingPeriods;
    if (periods === 1) return "1 فترة إعلانية";
    if (periods === 2) return "فترتين إعلانيتين";
    if (periods >= 3 && periods <= 10) return `${periods} فترات إعلانية`;
    return `${periods} فترة إعلانية`;
  }, [calculateAdvertisingPeriods]);

  // Prepare contract details
  const contractDetails = {
    firstParty: {
      name: getBooking?.user?.full_name || "غير محدد",
      company: getBooking?.user?.company?.name || "",
      commercialRegister: getBooking?.user?.company?.commercial_registration_number || "غير محدد",
      address: getBooking?.user?.address || "غير محدد", 
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

  // Determine booking type
  const bookingType = getBooking?.type;
  const isTemporaryBooking = bookingType === 1;
  const bookingTypeText = BookingType[bookingType] || "غير محدد";

  const formatDMY = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const s = `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
    return `\u200E${s}\u200E`;
  };

  const generateWord = async () => {
    const element = contentRef.current;
    if (!element) {
      console.error("No content element found");
      return;
    }

    const logoBase64 = await getBase64FromUrl(logo);
    const contentClone = element.cloneNode(true);
    const exportButtons = contentClone.querySelectorAll("button[id*='export-button']");
    exportButtons.forEach(button => button.remove());

    contentClone.querySelectorAll("img").forEach(img => {
      img.src = logoBase64;
    });

    const htmlContent = contentClone.innerHTML;

    const fullHtml = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>عقد إعلاني ${bookingTypeText}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          direction: rtl;
          text-align: right;
          margin: 40px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        th, td {
          border: 1px solid #000;
          padding: 6px;
          text-align: center;
        }
        img {
          max-width: 120px;
          height: auto;
        }
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
    `;

    const blob = new Blob([fullHtml], { type: "application/msword" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `عقد_إعلاني_${bookingTypeText}_${new Date().toISOString().slice(0, 10)}.doc`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

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
          const exportButtons = document.querySelectorAll("button[id*='export-button']");
          exportButtons.forEach(button => {
            button.style.display = "none";
          });
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

  // ✅ تحديد متى نخفي سعر الطباعة - الشرط الجديد: إذا كان printing_price > 0 نظهر
  const showPrintingPrice = getBooking?.printing_price > 0;

// ✅ COMMON TABLE ROWS
const CommonTableRows = () => {
  return (
    <>
      <tr>
        <th style={{ ...styles.adTableThTd, ...styles.adTableTh }}>
          قيمة الفترات الاعلانية    
        </th>
        <td style={styles.adTableThTd}>{getBooking?.total_price_befor_discount} $</td>
      </tr>
      
      {/* ✅ نخبّي سعر الطباعة إذا كان printing_price > 0 */}
      {showPrintingPrice && getBooking?.total_printing_space && (
        <tr>
          <th style={{ ...styles.adTableThTd, ...styles.adTableTh }}>
            سعر الطباعة ({getBooking.printing_price}$ × {getBooking.total_printing_space} م²)
          </th>
          <td style={styles.adTableThTd}>{printingTotalPrice} $</td>
        </tr>
      )}
      
      {getBooking?.value && (
        <tr>
          <th style={{ ...styles.adTableThTd, ...styles.adTableTh }}>
            الحسم المقدم من الشركة السورية   
          </th>
          <td style={styles.adTableThTd}>
            {getBooking.discount_type === 1 ? (
              <span>{getBooking.value} $</span>
            ) : (
              <span>{getBooking.value} %</span>
            )}
          </td>
        </tr>
      )}
      
      <tr>
        <th style={{ ...styles.adTableThTd, ...styles.adTableTh }}>
          القيمة الكلية للعقد
        </th>
        <td style={styles.adTableThTd}>{getBooking?.total_price} $</td>
      </tr>
    </>
  );
};


const CommonPrintingInfo = () => {
  const totalPrintingCost = useMemo(() => {
    const totalPrice = parseFloat(getBooking?.total_price) || 0;
    const addedPrice = parseFloat(getBooking?.added_price) || 0;
    return totalPrice + addedPrice;
  }, [getBooking?.total_price, getBooking?.added_price]);

  return (
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

      <p>مدة الدورة الاعلانية الواحدة هي 14 يوم </p>

      <div>
        إجمالي الأمتار الطباعية : {getBooking?.total_printing_space} م²
      </div>
      
      {showPrintingPrice && getBooking?.printing?.price && getBooking?.total_printing_space && (
        <div style={{ marginTop: "10px", padding: "8px", backgroundColor: "#f0f8ff", border: "1px solid #d1e7ff" }}>
          <small>
            <strong>ملاحظة:</strong> سعر الطباعة محسوب كالتالي: 
            {getBooking.printing_price}$ (سعر المتر) × {getBooking.total_printing_space} م² (إجمالي المساحة) = {printingTotalPrice}$
          </small>
          
          {/* ✅ Only show added price lines if added_price exists and is > 0 */}
          {getBooking?.added_price && parseFloat(getBooking.added_price) > 0 && (
            <>
              <br/>
              <small>كلفة تغيير التصميم هي: {getBooking.added_price}$</small>
              <br/>
              <small>
                الكلفة الكلية هي= {totalPrintingCost}$ 
                ({getBooking.total_price} + {getBooking.added_price})
              </small>
            </>
          )}
        </div>
      )}
    </div>
  );
};

  // ✅ COMMON TABLE ROW FOR GROUPED ROADSIGNS - UPDATED TO INCLUDE REGION
  const GroupedRoadsignsTable = () => (
    <table style={styles.adTable}>
      <thead>
        <tr>
          <th style={{ ...styles.adTableThTd, ...styles.adTableTh }}>النموذج</th>
          <th style={{ ...styles.adTableThTd, ...styles.adTableTh }}>النوع</th>
          <th style={{ ...styles.adTableThTd, ...styles.adTableTh }}>المنطقة</th>
          <th style={{ ...styles.adTableThTd, ...styles.adTableTh }}>مكان التموضع</th>
          <th style={{ ...styles.adTableThTd, ...styles.adTableTh }}>الإتجاه</th>
          <th style={{ ...styles.adTableThTd, ...styles.adTableTh }}>عدد الأوجه</th>
          <th style={{ ...styles.adTableThTd, ...styles.adTableTh }}>المدة الإعلانية (بالايام)</th>
          <th style={{ ...styles.adTableThTd, ...styles.adTableTh }}>السعر الإفرادي</th>
        </tr>
      </thead>
      <tbody>
        {groupedRoadsigns.map((group, index) => (
          <tr key={index}>
            <td style={styles.adTableThTd}>{group.template_model}</td>
            <td style={styles.adTableThTd}>{group.template_type}</td>
            <td style={styles.adTableThTd}>
              {group.region_name}
            </td>
            <td style={styles.adTableThTd}>{group.place}</td>
            <td style={styles.adTableThTd}>{group.directions}</td>
            <td style={styles.adTableThTd}>
              {group.booking_faces} وجه اعلاني
              {group.count > 1 && (
                <div style={{ fontSize: '12px', color: '#666' }}>
                </div>
              )}
            </td>
            <td style={styles.adTableThTd}>{group.days_of_reservation} يوم</td>
            <td style={styles.adTableThTd}>
              {group.total_faces_price} $
              {group.count > 1 && (
                <div style={{ fontSize: '12px', color: '#666' }}>
                  ({group.total_faces_price / group.count}$ لكل وجه)
                </div>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

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
          الشركة السورية للاعلان المسجلة بالسجل التجاري رقم{" "}
          20895
          و المتخذة عنوانا - {contractDetails.firstParty.address} - هاتف :{" "}
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
          <li className="text-red-500">لديك 48 ساعة للتأكيد اذا كنت تريد تأكيد هذا الحجز أم لا </li>
        </ul>
      </div>

      {/* Advertising details table - NOW GROUPED */}
      <div style={styles.adDetailsSection}>
        <h2 style={styles.adDetailsSectionH2}>
          1- يتم الإعلان المؤقت من خلال اللوحات المبنية بالجدول التالي:
          {groupedRoadsigns.length !== getBooking?.roadsigns?.length && (
            <span style={{ fontSize: '14px', color: '#666', marginRight: '10px' }}>
              (تم تجميع {getBooking?.roadsigns?.length} لوحة في {groupedRoadsigns.length} مجموعة)
            </span>
          )}
        </h2>
        <GroupedRoadsignsTable />
      </div>

      {/* Price summary table */}
      <table style={styles.adTable}>
        <tbody>
          <CommonTableRows />
        </tbody>
      </table>

      {/* Printing and additional info */}
      <CommonPrintingInfo />

      {/* Notes section */}
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

      {/* Dates section */}
      <div style={{ margin: "20px 0" }}>
        <strong>
          - تبدأ الحملة الإعلانية بتاريخ{" "}
          {new Date(getBooking?.start_date).getFullYear()}-
          {new Date(getBooking?.start_date).getMonth() + 1}-
          {new Date(getBooking?.start_date).getDate()}

          {" "}و تنتهي بتاريخ{" "}
          {new Date(getBooking?.end_date).getFullYear()}-
          {new Date(getBooking?.end_date).getMonth() + 1}-
          {new Date(getBooking?.end_date).getDate()}
        </strong>
      </div>

      {/* Signatures */}
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
          الشركة السورية للاعلان المسجلة بالسجل التجاري رقم{" "}
          20895 
          و المتخذة عنوانا - 
          {contractDetails.firstParty.address}
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

      {/* Advertising details table - NOW GROUPED */}
      <div style={styles.adDetailsSection}>
        <h2 style={styles.adDetailsSectionH2}>
          1- يتم الإعلان من خلال اللوحات المبنية بالجدول التالي:
          {groupedRoadsigns.length !== getBooking?.roadsigns?.length && (
            <span style={{ fontSize: '14px', color: '#666', marginRight: '10px' }}>
              (تم تجميع {getBooking?.roadsigns?.length} لوحة في {groupedRoadsigns.length} مجموعة)
            </span>
          )}
        </h2>
        <GroupedRoadsignsTable />
      </div>

      {/* Price summary table */}
      <table style={styles.adTable}>
        <tbody>
          <CommonTableRows />
        </tbody>
      </table>

      {/* Printing and additional info */}
      <CommonPrintingInfo />

      {/* Notes section */}
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

      {/* Dates section */}
      <div style={{ margin: "20px 0" }}>
        <strong>
          - تبدأ الحملة الإعلانية بتاريخ{" "}
          {new Date(getBooking?.start_date).getFullYear()} 
          -{new Date(getBooking?.start_date).getMonth() + 1}-
          {new Date(getBooking?.start_date).getDate()}
          
          و  تنتهي بتاريخ   {" "} 

          {new Date(getBooking?.end_date).getFullYear()}-
          {new Date(getBooking?.end_date).getMonth() + 1}-
          {new Date(getBooking?.end_date).getDate()}
        </strong>
      </div>

      {/* Signatures */}
      <div style={styles.signatures}>
        <div style={styles.signatureParty}>
          <h3 style={styles.signaturePartyH3}>
            {contractDetails.firstParty.company}
          </h3>
          <p>الشركة السورية للاعلان</p>
          <p>الفريق الأول : قسم المبيعات </p>
        </div>
        <div style={styles.signatureParty}>
          <h3 style={styles.signaturePartyH3}>
            {contractDetails.secondParty.company}
          </h3>
          <p>الفريق الثاني: {contractDetails.secondParty.name}</p>
        </div>
      </div>
      
      {/* Footer contact info */}
      <p className="mt-6">دمشق 09393333336 - حلب 0992400040</p>
      <span>www.syrianco.com /</span> 
      <span>info@syrianco.com</span> 
      <p>الشركة السورية للإعلان</p>
    </div>
  );

  return (
    <div style={styles.contractPageContainer}>
      {/* Export Buttons positioned absolutely */}
      <div style={{
        position: "absolute",
        top: "10px",
        right: "10px",
        display: "flex",
        gap: "10px",
        zIndex: 100
      }}>
        <button 
          id="pdf-export-button" 
          style={{
            ...styles.pdfExportButton,
            backgroundColor: "#007bff",
            right: "auto",
            position: "relative",
            top: "auto",
            margin: 0
          }} 
          onClick={generatePdf}
        >
          تصدير إلى PDF ({bookingTypeText})
          {groupedRoadsigns.length !== getBooking?.roadsigns?.length && (
            <span style={{ fontSize: '12px', marginRight: '5px' }}>
              (مجمعة: {groupedRoadsigns.length} من أصل {getBooking?.roadsigns?.length})
            </span>
          )}
        </button>
        
        <button 
          id="word-export-button" 
          style={{
            ...styles.pdfExportButton,
            backgroundColor: "#28a745",
            borderColor: "#218838",
            right: "auto",
            position: "relative",
            top: "auto",
            margin: 0
          }} 
          onClick={generateWord}
        >
          تصدير إلى Word ({bookingTypeText})
          {groupedRoadsigns.length !== getBooking?.roadsigns?.length && (
            <span style={{ fontSize: '12px', marginRight: '5px' }}>
              (مجمعة: {groupedRoadsigns.length} من أصل {getBooking?.roadsigns?.length})
            </span>
          )}
        </button>
      </div>

      {/* Server-generated documents (signed, secure links) - includes the
          itemized road-sign price list, which isn't produced by the
          client-side export above. See BookingDocumentButtons.jsx /
          BOOKING_ACCOUNTING_COORDINATION.md. */}
      <div style={{
        position: "absolute",
        top: "60px",
        right: "10px",
        zIndex: 100,
        background: "#fff",
        border: "1px solid #ddd",
        borderRadius: "6px",
        padding: "8px",
      }}>
        <div style={{ fontSize: "11px", color: "#666", marginBottom: "6px" }}>
          مستندات من الخادم (روابط موقّعة وآمنة):
        </div>
        <BookingDocumentButtons bookingId={bookingId} />
      </div>

      {isTemporaryBooking ? <TemporaryContract /> : <PermanentContract />}
    </div>
  );
};

export default ContractPage;