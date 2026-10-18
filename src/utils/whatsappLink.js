// src/utils/whatsappLink.js
//
// رسائل واتساب مجانية بالكامل (طلب صريح: "بدون استخدام أي شيء مدفوع") -
// لا API ولا WAHA ولا أي خدمة خارجية: مجرد رابط wa.me الرسمي يفتح واتساب
// (تطبيق الموبايل / واتساب ويب / واتساب ديسكتوب) على محادثة الزبون مع نص
// الرسالة جاهزًا، والموظف يضغط "إرسال" بنفسه.

const DEFAULT_COUNTRY_CODE = "963"; // سوريا

/**
 * يحوّل رقم الهاتف لصيغة دولية بلا "+" كما يطلبها wa.me:
 *   0933 123 456   -> 963933123456
 *   +963933123456  -> 963933123456
 *   00963933123456 -> 963933123456
 *   933123456      -> 963933123456
 * يعيد null إن لم يكن الرقم صالحًا.
 */
export const normalizeWhatsappPhone = (phone, countryCode = DEFAULT_COUNTRY_CODE) => {
  if (!phone) return null;
  let digits = String(phone)
    // أرقام عربية/فارسية -> لاتينية
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/\D/g, "");

  if (!digits) return null;
  if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = countryCode + digits.slice(1);
  else if (digits.length <= 9) digits = countryCode + digits;

  return digits.length >= 10 && digits.length <= 15 ? digits : null;
};

export const buildWhatsappUrl = (phone, message = "") => {
  const normalized = normalizeWhatsappPhone(phone);
  if (!normalized) return null;
  return `https://wa.me/${normalized}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
};

const fmtAmount = (n) =>
  Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/** نص رسالة "عليك دفع" - تذكير بالمبلغ المتبقي على الزبون. */
export const buildPaymentReminderMessage = ({ name, remaining }) =>
  [
    `السادة ${name || "الزبون الكريم"} المحترمين،`,
    "تحية طيبة من الشركة السورية للإعلان.",
    `نود تذكيركم بأن عليكم مبلغًا مستحق الدفع قدره ${fmtAmount(remaining)} $.`,
    "نرجو التكرم بتسديده في أقرب وقت ممكن.",
    "شاكرين حسن تعاونكم.",
  ].join("\n");

/**
 * يفتح واتساب برسالة تذكير بالدفع. يعيد false إن لم يكن للزبون رقم صالح
 * (ليعرض المستدعي رسالة خطأ مناسبة).
 */
export const openPaymentReminderWhatsapp = ({ phone, name, remaining }) => {
  const url = buildWhatsappUrl(phone, buildPaymentReminderMessage({ name, remaining }));
  if (!url) return false;
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
};
