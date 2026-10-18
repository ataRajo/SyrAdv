// src/utils/branding/arabicNumberToWords.js
//
// تفقيط المبالغ بالعربية ("مبلغ وقدره ... فقط لا غير") للسندات المولَّدة في
// الواجهة - نفس غرض NumberToWordsService في الباك-إند.

const ONES = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"];
const TENS = ["", "عشرة", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
const HUNDREDS = [
  "",
  "مائة",
  "مئتان",
  "ثلاثمائة",
  "أربعمائة",
  "خمسمائة",
  "ستمائة",
  "سبعمائة",
  "ثمانمائة",
  "تسعمائة",
];

// [مفرد، مثنى، جمع (3-10)، تمييز (11+)]
const SCALES = [
  null,
  ["ألف", "ألفان", "آلاف", "ألف"],
  ["مليون", "مليونان", "ملايين", "مليون"],
  ["مليار", "ملياران", "مليارات", "مليار"],
  ["تريليون", "تريليونان", "تريليونات", "تريليون"],
];

const belowHundred = (n) => {
  if (n === 0) return "";
  if (n < 10) return ONES[n];
  if (n === 10) return "عشرة";
  if (n === 11) return "أحد عشر";
  if (n === 12) return "اثنا عشر";
  if (n < 20) return `${ONES[n - 10]} عشر`;
  const t = Math.floor(n / 10);
  const o = n % 10;
  return o ? `${ONES[o]} و${TENS[t]}` : TENS[t];
};

const belowThousand = (n) => {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const parts = [];
  if (h) parts.push(HUNDREDS[h]);
  if (rest) parts.push(belowHundred(rest));
  return parts.join(" و");
};

const scaleWords = (group, scale) => {
  const [single, dual, plural, many] = SCALES[scale];
  if (group === 1) return single;
  if (group === 2) return dual;
  if (group >= 3 && group <= 10) return `${belowThousand(group)} ${plural}`;
  return `${belowThousand(group)} ${many}`;
};

const integerToWords = (n) => {
  if (n === 0) return "صفر";
  const groups = [];
  let x = n;
  while (x > 0) {
    groups.push(x % 1000);
    x = Math.floor(x / 1000);
  }
  const parts = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    if (!g) continue;
    parts.push(i === 0 ? belowThousand(g) : scaleWords(g, Math.min(i, SCALES.length - 1)));
  }
  return parts.join(" و");
};

/**
 * @param {number|string} value المبلغ
 * @returns {string} مثال: 1500.5 => "ألف وخمسمائة و50/100"
 */
export const arabicNumberToWords = (value) => {
  const num = Math.abs(parseFloat(value) || 0);
  const integer = Math.floor(num);
  const fraction = Math.round((num - integer) * 100);
  const words = integerToWords(integer);
  return fraction ? `${words} و${fraction}/100` : words;
};

export default arabicNumberToWords;
