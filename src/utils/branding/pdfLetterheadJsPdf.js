// src/utils/branding/pdfLetterheadJsPdf.js
//
// Puts the official SAC letterhead (the real artwork cut from "sac pdf.pdf":
// logo corner + diagonal gold stripes, faint SAC watermark, gold contact
// footer bar) on jsPDF documents - used by the jsPDF / jspdf-autotable
// exporters (InvoicePdf, OrdersPdf, ReportPdf, RoadSignsPdf) and by the
// html2pdf.js exporters (which hand us their internal jsPDF instance).
//
// Recommended usage (art is painted BEHIND the content on every page,
// including pages autoTable adds by itself):
//
//   await loadSacLetterheadAssets();           // or: await getSacLogoBase64()
//   const doc = new jsPDF({ unit: "mm", format: "a4" });
//   const box = applySacLetterhead(doc);        // { top, bottom, left, right, width }
//   drawSacTitle(doc, "عنوان المستند", "سطر فرعي");
//   autoTable(doc, { ...sacAutoTableStyles(), startY: box.top, margin: sacAutoTableMargin(doc) });
//   stampSacLetterheadOnAllPages(doc);          // page numbers only (art already there)
//   doc.save("file.pdf");
//
// Old usage (stamp everything at the end) still works:
//   stampSacLetterheadOnAllPages(doc, { logoDataUrl });

import {
  SAC_COLORS,
  SAC_LETTERHEAD,
  getSacLetterheadAssetsSync,
} from "./sacBrand";

const hexToRgb = (hex) => {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
};

export const SAC_RGB = {
  gold: hexToRgb(SAC_COLORS.gold),
  goldDark: hexToRgb(SAC_COLORS.goldDark),
  goldLight: hexToRgb(SAC_COLORS.goldLight),
  goldPale: hexToRgb(SAC_COLORS.goldPale),
  dark: hexToRgb(SAC_COLORS.dark),
  gray: hexToRgb(SAC_COLORS.grayText),
  border: hexToRgb(SAC_COLORS.border),
};

// ---- unit helpers ----------------------------------------------------------
// All geometry is defined in mm; convert to whatever unit the doc uses.
const mmToUnit = (doc) => 72 / 25.4 / doc.internal.scaleFactor;

const pageSize = (doc) => ({
  width: doc.internal.pageSize.getWidth(),
  height: doc.internal.pageSize.getHeight(),
});

const isLandscape = (doc) => {
  const { width, height } = pageSize(doc);
  return width > height;
};

/** The area where a document's own content may be drawn, in doc units. */
export const getSacContentBox = (doc) => {
  const k = mmToUnit(doc);
  const { width, height } = pageSize(doc);
  const left = SAC_LETTERHEAD.sideMargin * k;
  const right = width - SAC_LETTERHEAD.sideMargin * k;
  return {
    top: SAC_LETTERHEAD.safeTop * k,
    bottom: height - SAC_LETTERHEAD.safeBottom * k,
    left,
    right,
    width: right - left,
    pageWidth: width,
    pageHeight: height,
  };
};

/** Margins object ready for jspdf-autotable so rows never run under the
 * logo or the footer bar on continuation pages. */
export const sacAutoTableMargin = (doc) => {
  const k = mmToUnit(doc);
  return {
    top: SAC_LETTERHEAD.safeTop * k,
    bottom: SAC_LETTERHEAD.safeBottom * k,
    left: SAC_LETTERHEAD.sideMargin * k,
    right: SAC_LETTERHEAD.sideMargin * k,
  };
};

/** Table look matching the letterhead (gold header, pale-gold zebra). */
export const sacAutoTableStyles = (font = "Amiri-Regular") => ({
  theme: "grid",
  styles: {
    font,
    fontStyle: "normal",
    halign: "center",
    valign: "middle",
    fontSize: 9,
    textColor: SAC_RGB.dark,
    lineColor: SAC_RGB.border,
    lineWidth: 0.2,
    cellPadding: 2,
  },
  headStyles: {
    font,
    fontStyle: "normal",
    halign: "center",
    fillColor: SAC_RGB.gold,
    textColor: [255, 255, 255],
    lineColor: SAC_RGB.goldDark,
    fontSize: 10,
    cellPadding: 3,
  },
  footStyles: {
    font,
    fontStyle: "normal",
    halign: "center",
    fillColor: SAC_RGB.dark,
    textColor: [255, 255, 255],
  },
  alternateRowStyles: {
    fillColor: SAC_RGB.goldPale,
  },
});

// ---- drawing the art ---------------------------------------------------------

const safeAddImage = (doc, data, x, y, w, h, alias) => {
  if (!data) return;
  try {
    doc.addImage(data, "PNG", x, y, w, h, alias, "FAST");
  } catch (error) {
    console.log("SAC letterhead image skipped:", alias);
  }
};

/** Paints watermark + logo corner + footer bar on the CURRENT page. */
export const drawSacLetterheadArt = (doc, assets = getSacLetterheadAssetsSync()) => {
  const k = mmToUnit(doc);
  const { width, height } = pageSize(doc);
  const landscape = isLandscape(doc);

  // 1) faint "SAC" watermark, centred
  const wmW = SAC_LETTERHEAD.watermark.width * k * (landscape ? 1.25 : 1);
  const wmH = wmW * (SAC_LETTERHEAD.watermark.height / SAC_LETTERHEAD.watermark.width);
  safeAddImage(doc, assets.watermark, (width - wmW) / 2, (height - wmH) / 2, wmW, wmH, "sac-lh-watermark");

  // 2) logo + diagonal gold stripes, top-left (exactly like the letterhead)
  safeAddImage(
    doc,
    assets.corner,
    0,
    0,
    SAC_LETTERHEAD.corner.width * k,
    SAC_LETTERHEAD.corner.height * k,
    "sac-lh-corner"
  );

  // 3) contact footer bar, full width
  if (landscape) {
    const fh = width / SAC_LETTERHEAD.footerWide.aspect;
    safeAddImage(doc, assets.footerWide, 0, height - fh - SAC_LETTERHEAD.footerWide.bottomGap * k, width, fh, "sac-lh-footer-wide");
  } else {
    const fh = width / SAC_LETTERHEAD.footer.aspect;
    safeAddImage(doc, assets.footer, 0, height - fh - SAC_LETTERHEAD.footer.bottomGap * k, width, fh, "sac-lh-footer");
  }
};

/**
 * Paints the letterhead behind the content of the current page and of every
 * page added afterwards (autoTable page breaks included). Call right after
 * `new jsPDF(...)`. Returns the safe content box.
 */
export const applySacLetterhead = (doc, { assets } = {}) => {
  const art = assets || getSacLetterheadAssetsSync();
  if (!doc.__sacLetterheadApplied) {
    doc.__sacLetterheadApplied = true;
    const total = doc.internal.getNumberOfPages();
    const current = doc.internal.getCurrentPageInfo?.().pageNumber || total;
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      drawSacLetterheadArt(doc, art);
    }
    doc.setPage(current);
    try {
      doc.internal.events.subscribe("addPage", () => drawSacLetterheadArt(doc, art));
    } catch (error) {
      // very old jsPDF without the pub/sub API: stampSacLetterheadOnAllPages
      // will draw the art at the end instead.
      doc.__sacLetterheadApplied = false;
    }
  }
  return getSacContentBox(doc);
};

/** Centred document title (and optional subtitle) in the top band next to
 * the logo - same position as "سند قبض" on the official voucher. */
export const drawSacTitle = (doc, title, subtitle = "", { font = "Amiri-Regular" } = {}) => {
  const k = mmToUnit(doc);
  const { width } = pageSize(doc);
  try {
    doc.setFont(font, "normal");
  } catch (e) {
    /* font not registered - keep current */
  }
  if (title) {
    doc.setFontSize(20);
    doc.setTextColor(...SAC_RGB.dark);
    doc.text(title, width / 2, 20 * k, { align: "center" });
    // thin gold rule under the title
    const ruleW = Math.min(doc.getTextWidth(title) + 16 * k, 110 * k);
    doc.setDrawColor(...SAC_RGB.gold);
    doc.setLineWidth(0.6 * k);
    doc.line((width - ruleW) / 2, 23.5 * k, (width + ruleW) / 2, 23.5 * k);
  }
  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(...SAC_RGB.gray);
    doc.text(subtitle, width / 2, 29.5 * k, { align: "center" });
  }
  doc.setTextColor(0, 0, 0);
};

/** Backwards-compatible: kept for any caller that used the old helper. */
export const drawSacHeader = (doc) => {
  const k = mmToUnit(doc);
  safeAddImage(
    doc,
    getSacLetterheadAssetsSync().corner,
    0,
    0,
    SAC_LETTERHEAD.corner.width * k,
    SAC_LETTERHEAD.corner.height * k,
    "sac-lh-corner"
  );
};
export const drawSacWatermark = () => {
  /* the watermark is part of drawSacLetterheadArt now */
};
export const drawSacFooter = () => {
  /* the footer is part of drawSacLetterheadArt now */
};

/**
 * Finishes a document: if applySacLetterhead() was used the art is already
 * behind the content, so only page numbers are added; otherwise (legacy
 * callers) the art is stamped on every page now.
 */
export const stampSacLetterheadOnAllPages = (doc, { withPageNumbers = true } = {}) => {
  const k = mmToUnit(doc);
  const { width, height } = pageSize(doc);
  const totalPages = doc.internal.getNumberOfPages();
  const landscape = isLandscape(doc);
  const footerTop = landscape
    ? height - width / SAC_LETTERHEAD.footerWide.aspect - SAC_LETTERHEAD.footerWide.bottomGap * k
    : height - width / SAC_LETTERHEAD.footer.aspect - SAC_LETTERHEAD.footer.bottomGap * k;

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    if (!doc.__sacLetterheadApplied) {
      drawSacLetterheadArt(doc);
    }
    if (withPageNumbers && totalPages > 1) {
      doc.setFontSize(8);
      doc.setTextColor(...SAC_RGB.gray);
      doc.text(`${i} / ${totalPages}`, width / 2, footerTop - 2 * k, { align: "center" });
    }
  }
  doc.setTextColor(0, 0, 0);
  doc.setPage(totalPages);
};

/** html2pdf.js `margin` option ([top, left, bottom, right], mm) that keeps
 * the rendered HTML clear of the logo and the footer bar on every page. */
export const SAC_HTML2PDF_MARGIN = [
  SAC_LETTERHEAD.safeTop,
  SAC_LETTERHEAD.sideMargin,
  SAC_LETTERHEAD.safeBottom,
  SAC_LETTERHEAD.sideMargin,
];

/**
 * For html2pdf.js exporters: renders `element` to PDF with the letterhead
 * stamped on every page, then saves it.
 *
 *   await saveHtml2PdfWithSacLetterhead(html2pdf, element, options);
 */
export const saveHtml2PdfWithSacLetterhead = async (html2pdf, element, options = {}) => {
  const worker = html2pdf()
    .set({ ...options, margin: SAC_HTML2PDF_MARGIN })
    .from(element)
    .toPdf()
    .get("pdf")
    .then((pdf) => {
      stampSacLetterheadOnAllPages(pdf);
    });
  return worker.save();
};

export default {
  SAC_HTML2PDF_MARGIN,
  saveHtml2PdfWithSacLetterhead,
  applySacLetterhead,
  drawSacLetterheadArt,
  drawSacTitle,
  getSacContentBox,
  sacAutoTableMargin,
  sacAutoTableStyles,
  stampSacLetterheadOnAllPages,
  drawSacHeader,
  drawSacFooter,
  drawSacWatermark,
};
