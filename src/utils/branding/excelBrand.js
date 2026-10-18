// src/utils/branding/excelBrand.js
//
// Adds the SAC company identity to sheets built with the (community/free)
// "xlsx" package. Note: the free SheetJS build used in this project has no
// cell-fill/color styling support (that's a Pro-only feature), so we can't
// reproduce the gold header/footer bars inside a spreadsheet the way we do
// for the PDF/Word exports — instead we prepend clearly labeled company +
// contact rows above the data, which is the closest equivalent Excel lets
// a plain aoa_to_sheet workbook offer.

import { SAC_COMPANY, SAC_CONTACT } from "./sacBrand";

/**
 * Prepends a company/contact banner (and a blank spacer row) above the
 * header + data rows already built by a generator.
 *
 * @param {string[]} headers
 * @param {any[][]} rows
 * @returns {any[][]} array-of-arrays ready for XLSX.utils.aoa_to_sheet
 */
export const withSacExcelBanner = (headers, rows) => {
  const width = headers.length;
  const pad = (cells) => {
    const row = [...cells];
    while (row.length < width) row.push("");
    return row;
  };

  const phonesLine = SAC_CONTACT.phones.map((p) => `${p.city}: ${p.number}`).join("   |   ");

  return [
    pad([SAC_COMPANY.nameAr]),
    pad([`${SAC_CONTACT.website}   |   ${SAC_CONTACT.email}   |   ${phonesLine}`]),
    pad([]),
    headers,
    ...rows,
  ];
};

export default { withSacExcelBanner };
