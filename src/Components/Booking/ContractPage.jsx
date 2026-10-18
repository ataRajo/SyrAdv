import { useRef, useMemo, useState } from "react";
import html2pdf from "html2pdf.js";
import { SAC_LOGO_PATH as logo, loadSacLetterheadAssets } from "../../utils/branding/sacBrand";
import {
  SAC_HTML2PDF_MARGIN,
  stampSacLetterheadOnAllPages,
} from "../../utils/branding/pdfLetterheadJsPdf";
import {
  sacLetterheadStyles,
  sacLetterheadWatermark,
  sacLetterheadFooter,
} from "../../utils/branding/pdfLetterheadHtml";
import { useParams } from "react-router";
import { useGetOneBookingsQuery } from "../../RtkQuery/Slice/Booking/BookingApi";
import { styles } from "./ContractStyle";
import DOMPurify from "dompurify";
import BookingDocumentButtons from "./BookingDocumentButtons";
import startImg from "../../assets/images/start.jpg";
import endImg from "../../assets/images/end.jpg";
import { CONTRACT_LANGUAGES, getContractTexts } from "./contractI18n";
const BookingType = {
  1: "مؤقت",  
  2: "دائم",  
};

// ---------------------------------------------------------------------------
// PDF export helpers
// ---------------------------------------------------------------------------
// html2pdf.js renders the contract inside its own container whose width is the
// A4 width minus the letterhead side margins. Anything wider than that
// container is cut off in the PDF - so the export copy of the contract must
// simply fill the container (width: 100%), NOT be pinned to a fixed pixel
// width (the old 794px pin made the right edge disappear).
//
// html2pdf also rasterises everything into one tall image and slices it every
// A4 page height, which cuts lines of text / table rows in half at the page
// boundary. These selectors tell it to move such blocks whole to the next page.
const PDF_AVOID_BREAK_SELECTORS = [
  "tr",
  "p",
  "li",
  "h1",
  "h2",
  "h3",
  "[data-pdf-avoid]",
];

// Width html2pdf gives its render container (A4 minus the letterhead margins).
const PDF_CONTENT_WIDTH_MM = 210 - SAC_HTML2PDF_MARGIN[1] - SAC_HTML2PDF_MARGIN[3];

// Properties that decide how tall / wide every element is.
const PDF_LAYOUT_PROPS = [
  "display", "boxSizing",
  "marginTop", "marginRight", "marginBottom", "marginLeft",
  "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
  "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth",
  "borderTopStyle", "borderRightStyle", "borderBottomStyle", "borderLeftStyle",
  "borderCollapse", "borderSpacing",
  "fontFamily", "fontSize", "fontWeight", "fontStyle", "lineHeight", "letterSpacing",
  "textAlign", "direction", "verticalAlign", "whiteSpace",
  "listStyleType", "listStylePosition",
];

// WHY THIS EXISTS (the real cause of the "conflicted" PDF):
// html2pdf decides where to break pages by measuring the contract inside the
// LIVE page, where the app's CSS (Tailwind: p/h1/ul margins = 0, classes such
// as text-2xl, ...) applies. But the picture itself is taken by html2canvas in
// a clone WITHOUT any stylesheet (see ignoreElements: STYLE/LINK). Paragraph
// margins, heading sizes and line heights therefore differ between the two
// phases, so the page-break padding lands in the wrong place and rows / lines
// get cut in half.
// Fix: measure every element in a clean, stylesheet-free iframe (exactly what
// html2canvas will draw) and write those values inline on the export copy.
// From then on both phases lay out identically, whatever the app CSS is.
const freezeCaptureLayout = (node) => {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    `position:fixed;left:-10000px;top:0;border:0;visibility:hidden;` +
    `width:${PDF_CONTENT_WIDTH_MM}mm;height:1200px;`;
  document.body.appendChild(iframe);
  try {
    const doc = iframe.contentDocument;
    doc.open();
    doc.write(
      '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0"></body></html>'
    );
    doc.close();

    const ref = doc.importNode(node, true);
    doc.body.appendChild(ref);

    const win = iframe.contentWindow;
    const refEls = [ref, ...ref.querySelectorAll("*")];
    const dstEls = [node, ...node.querySelectorAll("*")];
    refEls.forEach((refEl, i) => {
      const cs = win.getComputedStyle(refEl);
      PDF_LAYOUT_PROPS.forEach((prop) => {
        const value = cs[prop];
        if (value) dstEls[i].style[prop] = value;
      });
    });
  } finally {
    document.body.removeChild(iframe);
  }
};

// Builds a detached, export-only copy of the contract so the on-screen page is
// never touched (no resizing/flicker, nothing to restore afterwards).
const buildPdfNode = (element) => {
  const node = element.cloneNode(true);

  // Covers + small in-page logo: the logo is already part of the letterhead
  // corner, and the buttons must never reach the PDF.
  node
    .querySelectorAll('[data-sac-cover], img[alt="logo"], button[id*="export-button"]')
    .forEach((el) => el.remove());

  // The capture has no stylesheet, so CSS classes never reach the PDF anyway;
  // dropping them keeps the measuring phase identical to the drawing phase.
  [node, ...node.querySelectorAll("*")].forEach((el) => el.removeAttribute("class"));

  Object.assign(node.style, {
    width: "100%",
    minWidth: "0",
    maxWidth: "none",
    margin: "0",
    padding: "0",
    boxShadow: "none",
    overflow: "visible",
    boxSizing: "border-box",
  });

  // Tables scroll horizontally on small screens; in the PDF they must simply
  // fit the page width.
  node.querySelectorAll("[data-table-scroll]").forEach((el) => {
    el.style.overflow = "visible";
    el.style.overflowX = "visible";
    el.style.width = "100%";
  });
  node.querySelectorAll("[data-table-scroll] table").forEach((tb) => {
    tb.style.minWidth = "0";
    tb.style.width = "100%";
  });

  // On screen words may break anywhere (narrow phones). In the PDF that makes
  // the small columns split words in the middle ("القيا|س"); break only when a
  // single word really does not fit.
  node.style.overflowWrap = "break-word";
  node.style.wordBreak = "normal";
  node.querySelectorAll("th, td").forEach((cell) => {
    cell.style.overflowWrap = "break-word";
    cell.style.wordBreak = "normal";
  });

  freezeCaptureLayout(node);
  return node;
};

// Notes come from a rich-text field. Turn paragraph / line breaks into real
// line breaks BEFORE stripping the tags (otherwise "<p>a</p><p>b</p>" glues
// into "ab"), then split them into numbered items. Returns [] when there is
// nothing to print so the whole notes block can be left out.
const getNoteItems = (rawNotes) => {
  if (!rawNotes) return [];
  const withBreaks = String(rawNotes)
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/\s*(p|div|li|h[1-6]|tr)\s*>/gi, "\n");
  const stripped = DOMPurify.sanitize(withBreaks, { ALLOWED_TAGS: [] });
  const decoder = document.createElement("textarea");
  decoder.innerHTML = stripped;
  return decoder.value
    .split(/\r?\n|(?=\d+-\s)/)
    .map((item) => item.replace(/\u00A0/g, " ").trim())
    .filter(Boolean);
};

const ContractPage = () => {
  const contentRef = useRef(null);
  const { id: bookingId } = useParams();

  // لغة العقد (عربي / إنكليزي / تركي) - طلب صريح: توليد العقد بثلاث لغات
  // من الواجهة فقط. كل نصوص العقد تأتي من contractI18n.js حسب اللغة.
  const [lang, setLang] = useState("ar");
  const t = getContractTexts(lang);
  const isRtl = t.dir === "rtl";

  const { data: getBooking, isSuccess, isLoading, error } = useGetOneBookingsQuery(bookingId);

  // ✅ 1. GROUP SIMILAR ROADSIGNS
  const groupedRoadsigns = useMemo(() => {
    if (!getBooking?.roadsigns) return [];

    const groups = {};
    
    getBooking.roadsigns.forEach(roadsign => {
      const key = [
        roadsign.template?.model || "غير محدد",
        roadsign.template?.type || "غير محدد",
        roadsign.template?.size || "غير محدد",
        roadsign?.place || "غير محدد",
        roadsign?.directions || "غير محدد",
        roadsign?.pivot?.days_of_reservation || "غير محدد"
      ].join("|");

      if (!groups[key]) {
        groups[key] = {
          template_model: roadsign.template?.model,
          template_type: roadsign.template?.type,
          template_size: roadsign.template?.size,
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
      secondPartyDesire: t.secondPartyDesire,
      firstPartyPossession: t.firstPartyPossession,
    },
  };

  // Determine booking type
  const bookingType = getBooking?.type;
  const isTemporaryBooking = bookingType === 1;
  const bookingTypeText = t.bookingType[bookingType] || t.bookingType.unknown;
  // اسم ملف لاتيني/آمن حسب اللغة
  const exportFileBase = `${t.fileSlug}_${bookingTypeText}_${new Date().toISOString().slice(0, 10)}`;
  const pageDirStyle = { direction: t.dir, textAlign: isRtl ? "right" : "left" };

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

    await loadSacLetterheadAssets();
    // Same export copy the PDF uses (covers/logo/buttons removed, layout
    // frozen inline), so the Word file looks like the PDF.
    const contentClone = buildPdfNode(element);

    const htmlContent = contentClone.outerHTML;

    const fullHtml = `
    <!DOCTYPE html>
    <html dir="${t.dir}" lang="${t.code}">
    <head>
      <meta charset="UTF-8">
      <title>${t.fileSlug.replace(/_/g, " ")} ${bookingTypeText}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          direction: ${t.dir};
          text-align: ${isRtl ? "right" : "left"};
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
        @page WordSection1 {
          size: 21cm 29.7cm;
          mso-page-orientation: portrait;
          margin: 1.5cm 1.5cm 1.5cm 1.5cm;
        }
        div.WordSection1 { page: WordSection1; }
        ${sacLetterheadStyles({ mode: "word", brandTables: false })}
      </style>
    </head>
    <body>
      <div class="WordSection1">
      ${sacLetterheadWatermark({ mode: "word" })}
      ${htmlContent}
      ${sacLetterheadFooter({ mode: "word" })}
      </div>
    </body>
    </html>
    `;

    const blob = new Blob([fullHtml], { type: "application/msword" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${exportFileBase}.doc`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const generatePdf = async () => {
    const element = contentRef.current;
    if (!element) {
      console.error("No content element found");
      return;
    }

    // html2canvas measures positions relative to the document, so a scrolled
    // page shifts / crops the capture. Capture from the top, then put the
    // user back where they were.
    const prevScroll = { x: window.scrollX, y: window.scrollY };

    try {
      // Official SAC letterhead (logo corner, watermark, footer bar) is
      // stamped on every inner page.
      await loadSacLetterheadAssets();
      if (document.fonts?.ready) await document.fonts.ready;
      window.scrollTo(0, 0);

      // Export-only copy: fills the PDF page width exactly, so nothing is cut.
      const exportNode = buildPdfNode(element);

      const pdfOptions = {
        margin: SAC_HTML2PDF_MARGIN,
        filename: `${exportFileBase}.pdf`,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: {
          scale: 3,
          windowWidth: 794,
          scrollX: 0,
          scrollY: 0,
          logging: false,
          dpi: 300,
          letterRendering: true,
          useCORS: true,
          allowTaint: false,
          ignoreElements: (el) => {
            return (
              el.tagName === "STYLE" ||
              el.tagName === "LINK" ||
              el.tagName === "SCRIPT"
            );
          },
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait",
          putTotalPages: true,
        },
        // Never cut a line of text / table row / block in half between two
        // pages: such blocks move whole to the next page.
        pagebreak: {
          mode: ["css", "legacy"],
          before: ".break-before",
          after: ".break-after",
          avoid: PDF_AVOID_BREAK_SELECTORS,
        },
      };

      await html2pdf()
        .set(pdfOptions)
        .from(exportNode)
        .toPdf()
        .get("pdf")
        .then((pdf) => {
          stampSacLetterheadOnAllPages(pdf);
        })
        .save();
      console.log("PDF generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("حدث خطأ أثناء إنشاء ملف PDF. يرجى مراجعة وحدة التحكم (F12).");
    } finally {
      window.scrollTo(prevScroll.x, prevScroll.y);
    }
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
const th = { ...styles.adTableThTd, ...styles.adTableTh };
const td = styles.adTableThTd;

const ymd = (date) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

const CommonTableRows = () => {
  return (
    <>
      <tr>
        <th style={th}>{t.prices.periods}</th>
        <td style={td}>{getBooking?.total_price_befor_discount} $</td>
      </tr>

      {/* ✅ نخبّي سعر الطباعة إذا كان printing_price > 0 */}
      {showPrintingPrice && getBooking?.total_printing_space && (
        <tr>
          <th style={th}>{t.prices.printing(getBooking.printing_price, getBooking.total_printing_space)}</th>
          <td style={td}>{printingTotalPrice} $</td>
        </tr>
      )}

      {getBooking?.value && (
        <tr>
          <th style={th}>{t.prices.discount}</th>
          <td style={td}>
            {getBooking.discount_type === 1 ? (
              <span>{getBooking.value} $</span>
            ) : (
              <span>{getBooking.value} %</span>
            )}
          </td>
        </tr>
      )}

      <tr>
        <th style={th}>{t.prices.total}</th>
        <td style={td}>{getBooking?.total_price} $</td>
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
    <div style={{ margin: "20px 0" }} data-pdf-avoid>
      <strong>{t.printing.includes}</strong>
      {getBooking?.groupedTemplates?.map((tem, ind) => (
        <div key={ind}>
          <p>{t.printing.modelTotal(tem?.model, tem?.total_faces)}</p>
        </div>
      ))}

      <p>{t.printing.cycle}</p>

      <div>{t.printing.totalSpace(getBooking?.total_printing_space)}</div>

      {showPrintingPrice && getBooking?.printing?.price && getBooking?.total_printing_space && (
        <div style={{ marginTop: "10px", padding: "8px", backgroundColor: "#f0f8ff", border: "1px solid #d1e7ff" }}>
          <small>
            <strong>{t.printing.noteLabel}</strong>
            {t.printing.note(getBooking.printing_price, getBooking.total_printing_space, printingTotalPrice)}
          </small>

          {/* ✅ Only show added price lines if added_price exists and is > 0 */}
          {getBooking?.added_price && parseFloat(getBooking.added_price) > 0 && (
            <>
              <br/>
              <small>{t.printing.designChange(getBooking.added_price)}</small>
              <br/>
              <small>{t.printing.totalCost(totalPrintingCost, getBooking.total_price, getBooking.added_price)}</small>
            </>
          )}
        </div>
      )}
    </div>
  );
};

  // ✅ COMMON TABLE ROW FOR GROUPED ROADSIGNS - UPDATED TO INCLUDE REGION
  const GroupedRoadsignsTable = () => (
    <div style={styles.tableScroll} data-table-scroll>
    <table style={{ ...styles.adTable, minWidth: "560px" }}>
      <thead style={{ display: "table-header-group" }}>
        <tr style={styles.adTableRow}>
          <th style={th}>{t.table.model}</th>
          <th style={th}>{t.table.type}</th>
          <th style={th}>{t.table.size}</th>
          <th style={th}>{t.table.region}</th>
          <th style={th}>{t.table.place}</th>
          <th style={th}>{t.table.direction}</th>
          <th style={th}>{t.table.faces}</th>
          <th style={th}>{t.table.days}</th>
          <th style={th}>{t.table.unitPrice}</th>
        </tr>
      </thead>
      <tbody>
        {groupedRoadsigns.map((group, index) => (
          <tr key={index} style={styles.adTableRow}>
            <td style={td}>{group.template_model}</td>
            <td style={td}>{group.template_type}</td>
            <td style={td}>{group.template_size || "-"}</td>
            <td style={td}>{group.region_name}</td>
            <td style={td}>{group.place}</td>
            <td style={td}>{group.directions}</td>
            <td style={td}>{t.facesValue(group.booking_faces)}</td>
            <td style={td}>{t.daysValue(group.days_of_reservation)}</td>
            <td style={td}>
              {group.total_faces_price} $
              {group.count > 1 && (
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {t.perFace(group.total_faces_price / group.count)}
                </div>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );

  const isGrouped = groupedRoadsigns.length !== getBooking?.roadsigns?.length;
  const groupedNote = isGrouped && (
    <span style={{ fontSize: '14px', color: '#666', [isRtl ? "marginRight" : "marginLeft"]: '10px' }}>
      {t.groupedNote(getBooking?.roadsigns?.length, groupedRoadsigns.length)}
    </span>
  );

  // Notes block: printed only when there is something to print.
  // (No "لا توجد ملاحظات" placeholder any more.)
  const noteItems = getNoteItems(getBooking?.notes);
  const NotesSection = () => {
    if (noteItems.length === 0) return null;
    return (
      <div style={{ margin: "10px 0" }}>
        {noteItems.map((item, index) => (
          <p key={index} style={{ marginBottom: "8px" }}>
            {item}
          </p>
        ))}
      </div>
    );
  };

  const DatesSection = () => (
    <div style={{ margin: "20px 0" }} data-pdf-avoid>
      <strong>
        <bdi>{t.dates(ymd(getBooking?.start_date), ymd(getBooking?.end_date))}</bdi>
      </strong>
    </div>
  );

  const secondPartyText = t.secondParty({
    company: contractDetails.secondParty.company,
    register: contractDetails.secondParty.commercialRegister,
    name: contractDetails.secondParty.name,
    address: contractDetails.secondParty.address,
    phone: contractDetails.secondParty.phone,
  });

  const contractPageStyle = { ...styles.contractPage, ...pageDirStyle };





  // Temporary Contract Component
  const TemporaryContract = () => {
    const [introBefore, introStrong, introAfter] = t.introTemporary(
      contractDetails.introduction.secondPartyDesire,
      contractDetails.introduction.firstPartyPossession
    );
    return (
    <div style={contractPageStyle} ref={contentRef} dir={t.dir} lang={t.code}>

      <div style={styles.header}>
        <img style={styles.logo} src={logo} alt="logo" />
        <h1 className="text-2xl" style={styles.headerH1}>{t.titleTemporary}</h1>
      </div>

      <div style={styles.partiesInfo}>
        <div style={styles.party}>
          <strong style={styles.partyH2}>{t.firstPartyLabel}</strong>{" "}
          {t.firstPartyTemporary(contractDetails.firstParty.address, contractDetails.firstParty.phone)}
        </div>

        <div style={styles.party}>
          <strong style={styles.partyH2}>{t.secondPartyLabel}</strong>{" "}
          {secondPartyText}
        </div>
      </div>

      <div style={styles.introduction}>
        <h2 style={styles.introductionH2}>{t.introHeading}</h2>
        <p>
          {introBefore}<strong>{introStrong}</strong>{introAfter}
        </p>
      </div>

      {/* Temporary-specific content */}
      <div style={{ margin: "20px 0", padding: "15px", backgroundColor: "#f5f5f5", border: "1px solid #ddd" }} data-pdf-avoid>
        <h3 style={styles.introductionH2}>{t.temporaryTermsHeading}</h3>
        <ul style={{ listStyle: "decimal", [isRtl ? "paddingRight" : "paddingLeft"]: "20px" }}>
          <li>{t.temporaryTerms[0]}</li>
          <li>{t.temporaryTerms[1]}</li>
          <li style={{ color: "#ef4444" }}>{t.temporaryTerms[2]}</li>
        </ul>
      </div>

      {/* Advertising details table - NOW GROUPED */}
      <div style={styles.adDetailsSection}>
        <h2 style={styles.adDetailsSectionH2}>
          {t.sectionTemporary}
          {groupedNote}
        </h2>
        <GroupedRoadsignsTable />
      </div>

      {/* Price summary table */}
      <table style={styles.adTable} data-pdf-avoid>
        <tbody>
          <CommonTableRows />
        </tbody>
      </table>

      {/* Printing and additional info */}
      <CommonPrintingInfo />

      {/* Notes section */}
      <NotesSection />

      {/* Dates section */}
      <DatesSection />

      {/* Signatures */}
      <div style={styles.signatures}>
        <div style={styles.signatureParty}>
          <h3 style={styles.signaturePartyH3}>
            {contractDetails.firstParty.company}
          </h3>
          <p>{t.firstPartySign(contractDetails.firstParty.name)}</p>
        </div>
        <div style={styles.signatureParty}>
          <h3 style={styles.signaturePartyH3}>
            {contractDetails.secondParty.company}
          </h3>
          <p>{t.secondPartySign(contractDetails.secondParty.name)}</p>
        </div>
      </div>
    </div>
    );
  };

  // Permanent Contract Component
  const PermanentContract = () => (
    <div style={contractPageStyle} ref={contentRef} dir={t.dir} lang={t.code}>
      <div style={styles.header}>
        <img style={styles.logo} src={logo} alt="logo" />
        <h1 style={styles.headerH1}>{t.titlePermanent}</h1>
      </div>

      <div style={styles.partiesInfo}>
        <div style={styles.party}>
          <strong style={styles.partyH2}>{t.firstPartyLabel}</strong>{" "}
          {t.firstPartyPermanent(contractDetails.firstParty.address)}
        </div>

        <div style={styles.party}>
          <strong style={styles.partyH2}>{t.secondPartyLabel}</strong>{" "}
          {secondPartyText}
        </div>
      </div>

      <div style={styles.introduction}>
        <h2 style={styles.introductionH2}>{t.introHeading}</h2>
        <p>
          {t.introPermanent(
            contractDetails.introduction.secondPartyDesire,
            contractDetails.introduction.firstPartyPossession
          )}
        </p>
      </div>

      {/* Advertising details table - NOW GROUPED */}
      <div style={styles.adDetailsSection}>
        <h2 style={styles.adDetailsSectionH2}>
          {t.sectionPermanent}
          {groupedNote}
        </h2>
        <GroupedRoadsignsTable />
      </div>

      {/* Price summary table */}
      <table style={styles.adTable} data-pdf-avoid>
        <tbody>
          <CommonTableRows />
        </tbody>
      </table>

      {/* Printing and additional info */}
      <CommonPrintingInfo />

      {/* Notes section */}
      <NotesSection />

      {/* Dates section */}
      <DatesSection />

      {/* Signatures */}
      <div style={styles.signatures}>
        <div style={styles.signatureParty}>
          <h3 style={styles.signaturePartyH3}>
            {contractDetails.firstParty.company}
          </h3>
          <p>{t.companyName}</p>
          <p>{t.salesDepartmentSign}</p>
        </div>
        <div style={styles.signatureParty}>
          <h3 style={styles.signaturePartyH3}>
            {contractDetails.secondParty.company}
          </h3>
          <p>{t.secondPartySign(contractDetails.secondParty.name)}</p>
        </div>
      </div>
      {/* Footer contact info */}
      <p className="mt-6">{t.footerPhones}</p>
      <p>
        <span>www.syrianco.com /</span>{" "}
        <span>info@syrianco.com</span>
      </p>
      <p>{t.footerCompany}</p>

    </div>
  );

  const exportButtonBase = {
    ...styles.pdfExportButton,
    right: "auto",
    position: "relative",
    top: "auto",
    margin: 0,
  };

  return (
    <div style={styles.contractPageContainer}>
      {/* Export Buttons positioned absolutely */}
      <div style={styles.toolbar}>
        {/* اختيار لغة العقد - يُطبَّق على المعاينة وعلى ملفي PDF وWord معًا */}
        <div
          id="language-export-button-group"
          dir="rtl"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: "6px",
            padding: "4px 6px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          }}
        >
          <span style={{ fontSize: "13px", color: "#444", margin: "0 4px" }}>{t.ui.language}</span>
          {CONTRACT_LANGUAGES.map((l) => (
            <button
              key={l.code}
              id={`lang-${l.code}-export-button`}
              type="button"
              onClick={() => setLang(l.code)}
              style={{
                border: "1px solid " + (lang === l.code ? "#D5A225" : "#ddd"),
                background: lang === l.code ? "#D5A225" : "#fff",
                color: lang === l.code ? "#fff" : "#333",
                borderRadius: "4px",
                padding: "4px 10px",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              {l.label}
            </button>
          ))}
        </div>

        <button
          id="pdf-export-button"
          style={{ ...exportButtonBase, backgroundColor: "#007bff" }}
          onClick={generatePdf}
        >
          {t.ui.exportPdf(bookingTypeText)}
          {isGrouped && (
            <span style={{ fontSize: '12px', margin: '0 5px' }}>
              {t.ui.grouped(groupedRoadsigns.length, getBooking?.roadsigns?.length)}
            </span>
          )}
        </button>

        <button
          id="word-export-button"
          style={{ ...exportButtonBase, backgroundColor: "#28a745", borderColor: "#218838" }}
          onClick={generateWord}
        >
          {t.ui.exportWord(bookingTypeText)}
          {isGrouped && (
            <span style={{ fontSize: '12px', margin: '0 5px' }}>
              {t.ui.grouped(groupedRoadsigns.length, getBooking?.roadsigns?.length)}
            </span>
          )}
        </button>
      </div>

      {isTemporaryBooking ? <TemporaryContract /> : <PermanentContract />}
    </div>
  );
};

export default ContractPage;