// src/Components/Booking/contractI18n.js
//
// Contract texts in Arabic / English / Turkish (front-end only, طلب صريح:
// "عقد عربي، تركي، إنكليزي"). ContractPage.jsx reads everything it prints
// from here, so the PDF / Word export comes out entirely in the selected
// language. Data typed by users (company names, region names, notes...)
// is printed as stored.

export const CONTRACT_LANGUAGES = [
  { code: "ar", label: "العربية" },
  { code: "en", label: "English" },
  { code: "tr", label: "Türkçe" },
];

const ar = {
  code: "ar",
  dir: "rtl",
  fileSlug: "عقد_إعلاني",
  bookingType: { 1: "مؤقت", 2: "دائم", unknown: "غير محدد" },
  notSpecified: "غير محدد",
  titleTemporary: "عرض فني ومالي",
  titlePermanent: "عقد إعلاني دائم",
  firstPartyLabel: "الطرف الأول:",
  secondPartyLabel: "الطرف الثاني:",
  firstPartyTemporary: (address, phone) =>
    `الشركة السورية للاعلان المسجلة بالسجل التجاري رقم 20895 و المتخذة عنوانا - ${address} - هاتف : ${phone}`,
  firstPartyPermanent: (address) =>
    `الشركة السورية للاعلان المسجلة بالسجل التجاري رقم 20895 و المتخذة عنوانا - ${address}`,
  secondParty: ({ company, register, name, address, phone }) =>
    `شركة ${company} المسجلة بالسجل التجاري رقم ${register} الممثلة بالسيد ${name} و المتخذ عنوانا - ${address} - هاتف : ${phone}`,
  introHeading: "مقدمة:",
  secondPartyDesire: "يرغب في الترويج للمنتجات العائدة للشركة من خلال الإعلانات الطرقية",
  firstPartyPossession:
    "يمتلك لوحات إعلانية طرقية بموجب ترخيص المؤسسة العربية للإعلان رقم / 4 / تاريخ 9/5/2012 ويملك حق الاعلان لذا اتفق الفريقان على ما يلي",
  // [before-strong, strong word, after-strong]
  introTemporary: (desire, possession) => [
    "هذا عقد إعلاني ",
    "مؤقت",
    ` حيث الفريق الثاني ${desire} وبما أن الفريق الأول ${possession} .`,
  ],
  introPermanent: (desire, possession) =>
    `حيث الفريق الثاني ${desire} وبما أن الفريق الأول ${possession} .`,
  temporaryTermsHeading: "شروط خاصة بالعقد المؤقت:",
  temporaryTerms: [
    "هذا العقد ساري المفعول للفترة المحددة في الجدول أدناه فقط",
    "قابل للتمديد بعد انتهاء المدة",
    "لديك 48 ساعة للتأكيد اذا كنت تريد تأكيد هذا الحجز أم لا",
  ],
  sectionTemporary: "1- يتم الإعلان المؤقت من خلال اللوحات المبنية بالجدول التالي:",
  sectionPermanent: "1- يتم الإعلان من خلال اللوحات المبنية بالجدول التالي:",
  groupedNote: (total, groups) => `(تم تجميع ${total} لوحة في ${groups} مجموعة)`,
  table: {
    model: "النموذج",
    type: "النوع",
    size: "القياس",
    region: "المنطقة",
    place: "مكان التموضع",
    direction: "الإتجاه",
    faces: "عدد الأوجه",
    days: "المدة الإعلانية (بالايام)",
    unitPrice: "السعر الإفرادي",
  },
  facesValue: (n) => `${n} وجه اعلاني`,
  daysValue: (n) => `${n} يوم`,
  perFace: (v) => `(${v}$ لكل وجه)`,
  prices: {
    periods: "قيمة الفترات الاعلانية",
    printing: (price, space) => `سعر الطباعة (${price}$ × ${space} م²)`,
    discount: "الحسم المقدم من الشركة السورية",
    total: "القيمة الكلية للعقد",
  },
  printing: {
    includes: "- السعر يشمل أجور الطباعة لمرة واحدة فقط و تكاليف الرسوم الإعلانية.",
    modelTotal: (model, faces) => `العدد الكلي لنموذج ${model} بعدد ${faces} وجه إعلاني`,
    cycle: "مدة الدورة الاعلانية الواحدة هي 14 يوم",
    totalSpace: (space) => `إجمالي الأمتار الطباعية : ${space} م²`,
    noteLabel: "ملاحظة:",
    note: (price, space, total) =>
      ` سعر الطباعة محسوب كالتالي: ${price}$ (سعر المتر) × ${space} م² (إجمالي المساحة) = ${total}$`,
    designChange: (added) => `كلفة تغيير التصميم هي: ${added}$`,
    totalCost: (total, price, added) => `الكلفة الكلية هي= ${total}$ (${price} + ${added})`,
  },
  noNotes: "لا توجد ملاحظات",
  dates: (start, end) => `- تبدأ الحملة الإعلانية بتاريخ ${start} و تنتهي بتاريخ ${end}`,
  firstPartySign: (name) => `الفريق الأول: ${name}`,
  secondPartySign: (name) => `الفريق الثاني: ${name}`,
  companyName: "الشركة السورية للاعلان",
  salesDepartmentSign: "الفريق الأول : قسم المبيعات",
  footerPhones: "دمشق 09393333336 - حلب 0992400040",
  footerCompany: "الشركة السورية للإعلان",
  ui: {
    language: "لغة العقد:",
    exportPdf: (type) => `تصدير إلى PDF (${type})`,
    exportWord: (type) => `تصدير إلى Word (${type})`,
    grouped: (groups, total) => `(مجمعة: ${groups} من أصل ${total})`,
  },
};

const en = {
  code: "en",
  dir: "ltr",
  fileSlug: "Advertising_Contract",
  bookingType: { 1: "Temporary", 2: "Permanent", unknown: "Not specified" },
  notSpecified: "Not specified",
  titleTemporary: "Technical & Financial Offer",
  titlePermanent: "Permanent Advertising Contract",
  firstPartyLabel: "First Party:",
  secondPartyLabel: "Second Party:",
  firstPartyTemporary: (address, phone) =>
    ` Syrian Advertising Company, registered in the Commercial Register under No. 20895, with its address at ${address} - Phone: ${phone}`,
  firstPartyPermanent: (address) =>
    ` Syrian Advertising Company, registered in the Commercial Register under No. 20895, with its address at ${address}`,
  secondParty: ({ company, register, name, address, phone }) =>
    ` ${company} company, registered in the Commercial Register under No. ${register}, represented by Mr./Ms. ${name}, with its address at ${address} - Phone: ${phone}`,
  introHeading: "Preamble:",
  secondPartyDesire: "wishes to promote the company's products through roadside advertisements",
  firstPartyPossession:
    "owns roadside advertising billboards under license No. /4/ of the Arab Advertising Foundation dated 9/5/2012 and holds the right to advertise; therefore, both parties have agreed as follows",
  introTemporary: (desire, possession) => [
    "This is a ",
    "temporary",
    ` advertising contract whereby the Second Party ${desire}, and whereas the First Party ${possession}.`,
  ],
  introPermanent: (desire, possession) =>
    `Whereas the Second Party ${desire}, and whereas the First Party ${possession}.`,
  temporaryTermsHeading: "Special Terms of the Temporary Contract:",
  temporaryTerms: [
    "This contract is valid only for the period specified in the table below",
    "It may be extended after the end of the term",
    "You have 48 hours to confirm whether or not you wish to confirm this booking",
  ],
  sectionTemporary: "1- The temporary advertising shall be carried out through the billboards listed in the following table:",
  sectionPermanent: "1- The advertising shall be carried out through the billboards listed in the following table:",
  groupedNote: (total, groups) => `(${total} billboards grouped into ${groups} groups)`,
  table: {
    model: "Model",
    type: "Type",
    size: "Size",
    region: "Region",
    place: "Location",
    direction: "Direction",
    faces: "Number of Faces",
    days: "Advertising Period (days)",
    unitPrice: "Unit Price",
  },
  facesValue: (n) => `${n} advertising face${Number(n) === 1 ? "" : "s"}`,
  daysValue: (n) => `${n} day${Number(n) === 1 ? "" : "s"}`,
  perFace: (v) => `(${v}$ per face)`,
  prices: {
    periods: "Value of Advertising Periods",
    printing: (price, space) => `Printing Price (${price}$ × ${space} m²)`,
    discount: "Discount Granted by the Syrian Advertising Company",
    total: "Total Contract Value",
  },
  printing: {
    includes: "- The price includes one-time printing fees and advertising charges only.",
    modelTotal: (model, faces) => `Total for model ${model}: ${faces} advertising faces`,
    cycle: "One advertising cycle lasts 14 days",
    totalSpace: (space) => `Total printing area: ${space} m²`,
    noteLabel: "Note:",
    note: (price, space, total) =>
      ` The printing price is calculated as follows: ${price}$ (price per m²) × ${space} m² (total area) = ${total}$`,
    designChange: (added) => `Design change cost: ${added}$`,
    totalCost: (total, price, added) => `Total cost = ${total}$ (${price} + ${added})`,
  },
  noNotes: "No notes",
  dates: (start, end) => `- The advertising campaign starts on ${start} and ends on ${end}`,
  firstPartySign: (name) => `First Party: ${name}`,
  secondPartySign: (name) => `Second Party: ${name}`,
  companyName: "Syrian Advertising Company",
  salesDepartmentSign: "First Party: Sales Department",
  footerPhones: "Damascus 09393333336 - Aleppo 0992400040",
  footerCompany: "Syrian Advertising Company",
  ui: {
    language: "Contract language:",
    exportPdf: (type) => `Export to PDF (${type})`,
    exportWord: (type) => `Export to Word (${type})`,
    grouped: (groups, total) => `(grouped: ${groups} of ${total})`,
  },
};

const tr = {
  code: "tr",
  dir: "ltr",
  fileSlug: "Reklam_Sozlesmesi",
  bookingType: { 1: "Geçici", 2: "Kalıcı", unknown: "Belirtilmemiş" },
  notSpecified: "Belirtilmemiş",
  titleTemporary: "Teknik ve Mali Teklif",
  titlePermanent: "Kalıcı Reklam Sözleşmesi",
  firstPartyLabel: "Birinci Taraf:",
  secondPartyLabel: "İkinci Taraf:",
  firstPartyTemporary: (address, phone) =>
    ` 20895 numara ile ticaret siciline kayıtlı, adresi ${address} olan Suriye Reklam Şirketi (Syrian Advertising Company) - Telefon: ${phone}`,
  firstPartyPermanent: (address) =>
    ` 20895 numara ile ticaret siciline kayıtlı, adresi ${address} olan Suriye Reklam Şirketi (Syrian Advertising Company)`,
  secondParty: ({ company, register, name, address, phone }) =>
    ` ${register} numara ile ticaret siciline kayıtlı, ${name} tarafından temsil edilen, adresi ${address} olan ${company} şirketi - Telefon: ${phone}`,
  introHeading: "Giriş:",
  secondPartyDesire: "şirkete ait ürünlerin yol kenarı reklamları aracılığıyla tanıtımını yapmak istemektedir",
  firstPartyPossession:
    "Arap Reklam Kurumu'nun 9/5/2012 tarihli ve /4/ numaralı lisansı kapsamında yol kenarı reklam panolarına sahip olup reklam hakkını elinde bulundurmaktadır; bu nedenle taraflar aşağıdaki hususlarda anlaşmışlardır",
  introTemporary: (desire, possession) => [
    "Bu, ",
    "geçici",
    ` bir reklam sözleşmesidir; İkinci Taraf ${desire} ve Birinci Taraf ${possession}.`,
  ],
  introPermanent: (desire, possession) =>
    `İkinci Taraf ${desire} ve Birinci Taraf ${possession}.`,
  temporaryTermsHeading: "Geçici Sözleşmeye İlişkin Özel Şartlar:",
  temporaryTerms: [
    "Bu sözleşme yalnızca aşağıdaki tabloda belirtilen süre için geçerlidir",
    "Süre sona erdikten sonra uzatılabilir",
    "Bu rezervasyonu onaylayıp onaylamayacağınızı bildirmek için 48 saatiniz vardır",
  ],
  sectionTemporary: "1- Geçici reklam, aşağıdaki tabloda belirtilen panolar aracılığıyla yapılacaktır:",
  sectionPermanent: "1- Reklam, aşağıdaki tabloda belirtilen panolar aracılığıyla yapılacaktır:",
  groupedNote: (total, groups) => `(${total} pano ${groups} grup halinde toplandı)`,
  table: {
    model: "Model",
    type: "Tür",
    size: "Ölçü",
    region: "Bölge",
    place: "Konum",
    direction: "Yön",
    faces: "Yüz Sayısı",
    days: "Reklam Süresi (gün)",
    unitPrice: "Birim Fiyat",
  },
  facesValue: (n) => `${n} reklam yüzü`,
  daysValue: (n) => `${n} gün`,
  perFace: (v) => `(yüz başına ${v}$)`,
  prices: {
    periods: "Reklam Dönemleri Bedeli",
    printing: (price, space) => `Baskı Fiyatı (${price}$ × ${space} m²)`,
    discount: "Suriye Reklam Şirketi Tarafından Sağlanan İndirim",
    total: "Toplam Sözleşme Bedeli",
  },
  printing: {
    includes: "- Fiyata yalnızca tek seferlik baskı ücreti ve reklam harçları dahildir.",
    modelTotal: (model, faces) => `${model} modeli için toplam: ${faces} reklam yüzü`,
    cycle: "Bir reklam döngüsü 14 gündür",
    totalSpace: (space) => `Toplam baskı alanı: ${space} m²`,
    noteLabel: "Not:",
    note: (price, space, total) =>
      ` Baskı fiyatı şu şekilde hesaplanır: ${price}$ (m² fiyatı) × ${space} m² (toplam alan) = ${total}$`,
    designChange: (added) => `Tasarım değişikliği maliyeti: ${added}$`,
    totalCost: (total, price, added) => `Toplam maliyet = ${total}$ (${price} + ${added})`,
  },
  noNotes: "Not bulunmamaktadır",
  dates: (start, end) => `- Reklam kampanyası ${start} tarihinde başlar ve ${end} tarihinde sona erer`,
  firstPartySign: (name) => `Birinci Taraf: ${name}`,
  secondPartySign: (name) => `İkinci Taraf: ${name}`,
  companyName: "Suriye Reklam Şirketi",
  salesDepartmentSign: "Birinci Taraf: Satış Departmanı",
  footerPhones: "Şam 09393333336 - Halep 0992400040",
  footerCompany: "Suriye Reklam Şirketi",
  ui: {
    language: "Sözleşme dili:",
    exportPdf: (type) => `PDF olarak dışa aktar (${type})`,
    exportWord: (type) => `Word olarak dışa aktar (${type})`,
    grouped: (groups, total) => `(gruplandı: ${total} içinden ${groups})`,
  },
};

export const CONTRACT_I18N = { ar, en, tr };

export const getContractTexts = (lang) => CONTRACT_I18N[lang] || ar;
