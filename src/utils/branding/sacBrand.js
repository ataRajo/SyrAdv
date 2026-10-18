// src/utils/branding/sacBrand.js
//
// Single source of truth for the SAC (الشركة السورية للإعلان) identity used
// by every exported document (PDF / print / Word / Excel).
//
// The letterhead artwork (logo corner with the diagonal gold stripes, the
// faint "SAC" watermark and the gold contact footer bar) is NOT redrawn
// with CSS/shapes anymore - it is cut directly from the official
// letterhead PDF ("sac pdf.pdf") into transparent PNGs, so every document
// looks exactly like the company's printed paper:
//
//   assets/branding/sac-lh-corner.png       top-left logo + diagonal stripes
//   assets/branding/sac-lh-watermark.png    big faint "SAC" watermark
//   assets/branding/sac-lh-footer.png       footer bar - portrait pages
//   assets/branding/sac-lh-footer-wide.png  footer bar - landscape pages
//
// Physical sizes below are in millimetres for an A4 page (the source
// letterhead is 216 x 303 mm, scaled to A4's 210 mm width).

import sacLogoUrl from "../../assets/images/sac-logo.png";
import cornerUrl from "../../assets/branding/sac-lh-corner.png";
import watermarkUrl from "../../assets/branding/sac-lh-watermark.png";
import footerUrl from "../../assets/branding/sac-lh-footer.png";
import footerWideUrl from "../../assets/branding/sac-lh-footer-wide.png";

export const SAC_LOGO_PATH = sacLogoUrl;

export const SAC_COLORS = {
  gold: "#D5A225",
  goldDark: "#A77D14",
  goldLight: "#F0DDAB",
  goldPale: "#FBF5E6",
  dark: "#1A1817",
  grayText: "#6B7280",
  border: "#E7D9B4",
};

export const SAC_COMPANY = {
  shortName: "SAC",
  nameAr: "الشركة السورية للإعلان",
  nameEn: "SAC Syrian",
};

export const SAC_CONTACT = {
  website: "www.sac.sy",
  email: "info@sac.sy",
  phones: [
    { city: "دمشق", number: "0981 888 977" },
    { city: "حلب", number: "0992 400 040" },
  ],
};

/** Letterhead geometry (mm). Content must stay inside the "safe" box. */
export const SAC_LETTERHEAD = {
  corner: { width: 76.2, height: 51.3 },
  watermark: { width: 106.7, height: 40.5 },
  footer: { aspect: 1701 / 126, bottomGap: 3 }, // portrait bar
  footerWide: { aspect: 1997 / 87, bottomGap: 0 }, // landscape bar
  safeTop: 36, // first line of content below the logo
  safeBottom: 22, // keep clear of the footer bar
  sideMargin: 12,
};

// ---------------------------------------------------------------------------
// Asset loading (converted to data: URLs once and cached, so they work in
// jsPDF, in window.open() print windows, in blobs and in html2canvas).
// ---------------------------------------------------------------------------

const cache = {};
let assetsPromise = null;

const toDataUrl = async (url) => {
  if (!url) return "";
  if (url.startsWith("data:")) return url;
  try {
    const res = await fetch(url);
    if (!res.ok) return "";
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result || "");
      reader.onerror = () => resolve("");
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.log("SAC brand asset could not be loaded:", url);
    return "";
  }
};

/** Loads (once) every letterhead image as a data URL. */
export const loadSacLetterheadAssets = async () => {
  if (!assetsPromise) {
    assetsPromise = Promise.all([
      toDataUrl(sacLogoUrl),
      toDataUrl(cornerUrl),
      toDataUrl(watermarkUrl),
      toDataUrl(footerUrl),
      toDataUrl(footerWideUrl),
    ]).then(([logo, corner, watermark, footer, footerWide]) => {
      Object.assign(cache, { logo, corner, watermark, footer, footerWide });
      return cache;
    });
  }
  return assetsPromise;
};

/** Synchronous access to the cached assets. Falls back to the bundled URLs
 * if loadSacLetterheadAssets() hasn't finished yet. */
export const getSacLetterheadAssetsSync = () => ({
  logo: cache.logo || sacLogoUrl,
  corner: cache.corner || cornerUrl,
  watermark: cache.watermark || watermarkUrl,
  footer: cache.footer || footerUrl,
  footerWide: cache.footerWide || footerWideUrl,
});

/** Kept for backwards compatibility with every existing exporter: returns
 * the logo as a data URL AND pre-loads the whole letterhead so the
 * synchronous HTML / jsPDF helpers can use it right after. */
export const getSacLogoBase64 = async () => {
  const assets = await loadSacLetterheadAssets();
  return assets.logo || "";
};

export default {
  SAC_COLORS,
  SAC_COMPANY,
  SAC_CONTACT,
  SAC_LETTERHEAD,
  SAC_LOGO_PATH,
  getSacLogoBase64,
  loadSacLetterheadAssets,
  getSacLetterheadAssetsSync,
};
