// src/utils/branding/pdfLetterheadHtml.js
//
// HTML/CSS fragments that put the official SAC letterhead (the real artwork
// cut from "sac pdf.pdf": logo corner with diagonal gold stripes, faint
// "SAC" watermark, gold contact footer bar) on the HTML-string based
// exporters: window.print() PDFs, html2pdf.js PDFs and the "Word" .doc
// exports (styled HTML saved with a .doc extension).
//
// Usage (unchanged for existing generators):
//
//   const logoBase64 = await getSacLogoBase64();   // also pre-loads the art
//   const html = `
//     <style>${existingStyles} ${sacLetterheadStyles()}</style>
//     <body>
//       ${sacLetterheadWatermark()}                 // MUST be first in <body>
//       ${sacLetterheadHeader({ title: "...", subtitle: "..." })}
//       ...existing content...
//       ${sacLetterheadFooter()}                    // MUST be last in <body>
//     </body>`;
//
// Modes (pass the same `{ mode }` to all four helpers):
//   "print"  (default) - window.print() documents. The art is repeated on
//            EVERY printed page (position:fixed) and the content is wrapped
//            in a table whose <thead>/<tfoot> spacers repeat too, so rows
//            never run under the logo or the footer bar on page 2, 3, ...
//   "canvas" - html2pdf.js / html2canvas. No art in the HTML (it can't be
//            repeated per page there); save with
//            saveHtml2PdfWithSacLetterhead() from pdfLetterheadJsPdf.
//   "word"   - .doc exports: plain inline images (Word ignores fixed
//            positioning).

import { SAC_COLORS, SAC_COMPANY, SAC_LETTERHEAD, getSacLetterheadAssetsSync } from "./sacBrand";

const L = SAC_LETTERHEAD;

/** CSS shared by every letterhead-branded document. Everything is prefixed
 * with `sac-lh-` and forced with !important where a generator's own generic
 * `table/td/tr` rules could otherwise leak into the page frame. */
export const sacLetterheadStyles = ({ mode = "print", brandTables = true } = {}) => {
  // Table headers take the letterhead gold (instead of each generator's
  // blue/green/grey), so every document shares one identity.
  const th = mode === "print" ? ".sac-lh-body table th" : "table th";
  const tableBrand = brandTables
    ? `
  ${th} {
    background: ${SAC_COLORS.gold} !important;
    background-image: none !important;
    color: #fff !important;
    border-color: ${SAC_COLORS.goldDark} !important;
  }`
    : "";

  const common = `${tableBrand}
  .sac-lh-title { position: relative; z-index: 2; text-align: center; margin: 0 0 14px 0; }
  .sac-lh-title h1 {
    display: inline-block;
    margin: 0;
    padding: 0 18px 6px;
    font-size: 24px;
    font-weight: 700;
    color: ${SAC_COLORS.dark};
    border-bottom: 2px solid ${SAC_COLORS.gold};
    line-height: 1.3;
  }
  .sac-lh-title .sac-lh-subtitle { margin-top: 6px; font-size: 11px; color: ${SAC_COLORS.grayText}; }
  `;

  if (mode === "word" || mode === "canvas") return common;

  return `
  ${common}
  @page { margin: 0; }
  html, body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

  .sac-lh-art { pointer-events: none; user-select: none; border: 0 !important; box-shadow: none !important; }
  .sac-lh-corner { position: absolute; top: 0; left: 0; width: ${L.corner.width}mm; height: auto; z-index: 0; }
  .sac-lh-watermark {
    position: fixed; top: 50%; left: 50%;
    width: ${L.watermark.width}mm; height: auto;
    transform: translate(-50%, -50%);
    z-index: 0;
  }
  .sac-lh-footer, .sac-lh-footer-wide { display: block; width: 100%; height: auto; margin-top: 10mm; }
  .sac-lh-footer-wide { display: none; }

  /* page frame: repeating spacers keep content clear of the art */
  table.sac-lh-frame {
    position: relative; z-index: 1;
    width: 100% !important; margin: 0 !important; padding: 0 !important;
    border: 0 !important; border-collapse: collapse !important; border-spacing: 0 !important;
    background: transparent !important; box-shadow: none !important;
  }
  table.sac-lh-frame > thead, table.sac-lh-frame > tfoot { display: table-header-group; }
  table.sac-lh-frame > tfoot { display: table-footer-group; }
  table.sac-lh-frame > thead > tr, table.sac-lh-frame > tfoot > tr, table.sac-lh-frame > tbody > tr.sac-lh-row {
    background: transparent !important;
    page-break-inside: auto !important; break-inside: auto !important;
  }
  table.sac-lh-frame > thead > tr > td, table.sac-lh-frame > tfoot > tr > td {
    border: 0 !important; padding: 0 !important; background: transparent !important;
  }
  table.sac-lh-frame > tbody > tr > td.sac-lh-body {
    border: 0 !important; background: transparent !important;
    padding: 0 ${L.sideMargin}mm !important;
    vertical-align: top !important; text-align: inherit !important;
  }
  .sac-lh-space-top { height: ${L.safeTop}mm; }
  .sac-lh-space-bottom { height: ${L.safeBottom}mm; }
  /* first-page title sits in the top band beside the logo, like the voucher */
  table.sac-lh-frame .sac-lh-title { margin-top: -22mm; margin-bottom: 8mm; }

  @media print {
    html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
    .sac-lh-corner { position: fixed; }
    .sac-lh-footer { position: fixed; left: 0; right: 0; bottom: ${L.footer.bottomGap}mm; margin: 0; }
    .sac-lh-footer-wide { position: fixed; left: 0; right: 0; bottom: ${L.footerWide.bottomGap}mm; margin: 0; }
    .sac-lh-no-print { display: none !important; }
  }
  @media print and (orientation: landscape) {
    .sac-lh-footer { display: none !important; }
    .sac-lh-footer-wide { display: block !important; }
    .sac-lh-watermark { width: ${Math.round(L.watermark.width * 1.25)}mm; }
  }
  @media screen {
    body { position: relative; }
  }
  `;
};

/** Opening part of the letterhead: logo corner + watermark (+ the page
 * frame in print mode). Place it FIRST inside <body>. */
export const sacLetterheadWatermark = ({ mode = "print" } = {}) => {
  const art = getSacLetterheadAssetsSync();
  if (mode === "canvas") return "";
  if (mode === "word") {
    return `<p style="margin:0 0 6pt 0;"><img src="${art.corner}" width="288" alt="${SAC_COMPANY.nameAr}" /></p>`;
  }
  return `
    <img src="${art.corner}" class="sac-lh-art sac-lh-corner" alt="${SAC_COMPANY.nameAr}" />
    <img src="${art.watermark}" class="sac-lh-art sac-lh-watermark" alt="" />
    <table class="sac-lh-frame" role="presentation">
      <thead><tr><td><div class="sac-lh-space-top"></div></td></tr></thead>
      <tfoot><tr><td><div class="sac-lh-space-bottom"></div></td></tr></tfoot>
      <tbody><tr class="sac-lh-row"><td class="sac-lh-body">
  `;
};

/** Document title block, centred in the top band next to the logo. The
 * `logoBase64` argument is accepted for backwards compatibility only - the
 * logo is part of the letterhead corner now. */
// eslint-disable-next-line no-unused-vars
export const sacLetterheadHeader = ({ logoBase64, title = "", subtitle = "" } = {}) => {
  if (!title && !subtitle) return "";
  return `
  <div class="sac-lh-title">
    ${title ? `<h1>${title}</h1>` : ""}
    ${subtitle ? `<div class="sac-lh-subtitle">${subtitle}</div>` : ""}
  </div>
`;
};

/** Closing part: ends the page frame and adds the gold contact footer bar.
 * Place it LAST inside <body>. */
export const sacLetterheadFooter = ({ mode = "print" } = {}) => {
  const art = getSacLetterheadAssetsSync();
  if (mode === "canvas") return "";
  if (mode === "word") {
    return `<p style="margin:12pt 0 0 0;"><img src="${art.footer}" width="680" alt="" /></p>`;
  }
  return `
      </td></tr></tbody>
    </table>
    <img src="${art.footer}" class="sac-lh-art sac-lh-footer" alt="" />
    <img src="${art.footerWide}" class="sac-lh-art sac-lh-footer-wide" alt="" />
  `;
};

/**
 * Turns a generator's own coloured banner header (e.g. ".header",
 * ".report-header") into the letterhead's title band: white paper, dark
 * centred title with a gold rule - so the document reads like the official
 * SAC paper instead of having a second coloured banner under the
 * letterhead. Append AFTER the generator's own styles.
 */
export const sacRestyleHeader = (selector) => `
  ${selector} {
    background: transparent !important;
    background-image: none !important;
    color: ${SAC_COLORS.dark} !important;
    box-shadow: none !important;
    border: 0 !important;
    border-bottom: 2px solid ${SAC_COLORS.gold} !important;
    border-radius: 0 !important;
    padding: 0 0 8px 0 !important;
    margin: 0 auto 6mm auto !important;
    display: block !important;
    text-align: center !important;
    position: relative; z-index: 2;
    max-width: 170mm;
    overflow: visible !important;
  }
  ${selector} * { color: ${SAC_COLORS.dark} !important; text-shadow: none !important; }
  ${selector}::before, ${selector}::after { display: none !important; }
  ${selector} h1, ${selector} h2 { font-size: 22px !important; margin: 0 0 4px 0 !important; }
  ${selector} img, ${selector} .logo, ${selector} .logo-container, ${selector} .logo-placeholder { display: none !important; }
`;

/** Convenience wrapper for new generators: a complete branded document. */
export const sacLetterheadDocument = ({
  title = "",
  subtitle = "",
  body = "",
  styles = "",
  orientation = "portrait",
  autoPrint = false,
} = {}) => `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>${title || SAC_COMPANY.nameAr}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Almarai:wght@400;700;800&display=swap" rel="stylesheet" />
  <style>
    @page { size: A4 ${orientation}; }
    * { box-sizing: border-box; }
    body { font-family: 'Almarai', 'Tajawal', 'Segoe UI', Tahoma, sans-serif; direction: rtl; color: ${SAC_COLORS.dark}; background: #fff; margin: 0; }
    ${sacTableStyles()}
    ${styles}
    ${sacLetterheadStyles()}
  </style>
</head>
<body>
  ${sacLetterheadWatermark()}
  ${sacLetterheadHeader({ title, subtitle })}
  ${body}
  ${sacLetterheadFooter()}
  ${autoPrint ? `<script>window.onload=function(){setTimeout(function(){window.print();},600);};</script>` : ""}
</body>
</html>`;

/** Table look matching the letterhead (gold header, pale-gold zebra). Use
 * the class "sac-table" on a <table>. */
export const sacTableStyles = () => `
  table.sac-table { width: 100%; border-collapse: collapse; font-size: 12px; margin: 10px 0 16px; }
  table.sac-table th {
    background: ${SAC_COLORS.gold}; color: #fff; font-weight: 700;
    border: 1px solid ${SAC_COLORS.goldDark}; padding: 8px 6px; text-align: center;
  }
  table.sac-table td { border: 1px solid ${SAC_COLORS.border}; padding: 7px 6px; text-align: center; }
  table.sac-table tbody tr:nth-child(even) td { background: ${SAC_COLORS.goldPale}; }
  table.sac-table tfoot td { background: ${SAC_COLORS.dark}; color: #fff; font-weight: 700; }
  table.sac-table thead { display: table-header-group; }
  table.sac-table tr { page-break-inside: avoid; }
`;

export default {
  sacLetterheadStyles,
  sacLetterheadHeader,
  sacLetterheadFooter,
  sacLetterheadWatermark,
  sacLetterheadDocument,
  sacTableStyles,
};
