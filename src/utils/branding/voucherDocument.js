// src/utils/branding/voucherDocument.js
//
// السندات (سند قبض / سند صرف / سند فاتورة / إيصال دفع / سند سلفة / سند خصم)
// بالتصميم الرسمي للشركة ("invoice sac.pdf"): الشعار أعلى اليسار مع الخطوط
// الذهبية المائلة، العلامة المائية SAC، شريط التواصل الذهبي أسفل السند،
// والأسطر المنقّطة (التاريخ / رقم / وصلني من / مبلغ وقدره / وذلك عن /
// التواقيع). الخلفية مقتطعة مباشرة من ملف التصميم الأصلي
// (assets/branding/sac-voucher-bg.jpg) - نفس أسلوب الترويسة في بقية الـ PDF.
//
// يُبنى السند بالكامل في الواجهة من بيانات JSON الموجودة أصلًا (القيد
// المحاسبي أو الدفعة) - بلا أي تعديل على الباك-إند. يُفتح في نافذة جديدة
// بمقاس السند نفسه (253.6 × 94.5 مم) مع زر "طباعة / حفظ PDF".
//
// نص السند الديناميكي (طلب صريح: "جملة (وذلك عن) ديناميكية تُملأ من قبل
// الأدمن" + "كتابة بالأسطر: دفعنا إلى / مبلغ وقدره"): كل أسطر السند قابلة
// للتعديل مباشرة على السند قبل الطباعة:
//   العنوان (مع قائمة عناوين جاهزة: سند فاتورة / سند قبض / ...)،
//   وصلني من / دفعنا إلى (الاسم)، ممثلاً عن شركة، مبلغ وقدره، و ذلك عن.
// من يملك الصلاحية يضغط "حفظ النص" فيُخزَّن على الدفعة/القيد (voucher_title /
// voucher_reason / voucher_person / voucher_company / voucher_amount_text)
// وتُطبع كل نسخة لاحقة به. هي نصوص عرض فقط - لا تغيّر المبلغ المحاسبي. الحفظ يمرّ عبر النافذة الأصلية
// (window.opener.__sacVoucherSave) كي لا يُكتب رمز الدخول داخل صفحة السند.

import voucherBgUrl from "../../assets/branding/sac-voucher-bg.jpg";
import { BASE_URL } from "../../Api/baseUrl";
import { arabicNumberToWords } from "./arabicNumberToWords";

const getToken = () => {
  try {
    const raw = localStorage.getItem("SuperAdminInfo");
    const info = raw ? JSON.parse(raw) : null;
    return info?.user?.token || info?.token || localStorage.getItem("token");
  } catch (error) {
    return localStorage.getItem("token");
  }
};

/** صلاحيات المستخدم المخزَّنة عند الدخول (راجع AuthProvider). */
const storedPermissionNames = () => {
  try {
    const list = JSON.parse(localStorage.getItem("permissions") || "[]");
    return new Set((Array.isArray(list) ? list : []).map((p) => (typeof p === "string" ? p : p?.name)));
  } catch (error) {
    return new Set();
  }
};

const storedIsSuperAdmin = () => {
  try {
    const info = JSON.parse(localStorage.getItem("SuperAdminInfo") || "null");
    const roles = info?.user?.roles || [];
    return roles.some((r) => (typeof r === "string" ? r : r?.name) === "super admin");
  } catch (error) {
    return false;
  }
};

/** هل يستطيع المستخدم حفظ نص السند؟ (الباك-إند يتحقق مجددًا على كل حال). */
const canSaveVoucherText = (permission) => storedIsSuperAdmin() || storedPermissionNames().has(permission);

/** عناوين جاهزة للسند (قائمة في شريط الأدوات - يمكن كتابة أي عنوان آخر). */
export const VOUCHER_TITLE_PRESETS = ["سند فاتورة", "سند قبض", "سند صرف", "إيصال دفع", "سند سلفة", "سند خصم"];

// تعديلات حُفظت في هذه الجلسة - تُطبَّق فورًا عند إعادة فتح السند حتى لو كانت
// بيانات القائمة (كاش RTK Query) لم تُحدَّث بعد.
const savedVoucherTexts = new Map();

/**
 * يحفظ نص السند على الباك-إند. يُستدعى من صفحة السند نفسها عبر
 * window.opener.__sacVoucherSave(key, data) - key بالشكل "payment:12" أو
 * "entry:34".
 */
const saveVoucherText = async (key, data) => {
  const [kind, id] = String(key || "").split(":");
  const url =
    kind === "payment"
      ? `${BASE_URL}/payments/${id}/voucher-text`
      : kind === "entry"
      ? `${BASE_URL}/accounting/transactions/${id}/voucher-text`
      : null;
  if (!url || !id) throw new Error("هذا السند لا يدعم حفظ النص");

  const token = getToken();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      voucher_title: data?.voucher_title ?? null,
      voucher_reason: data?.voucher_reason ?? null,
      voucher_person: data?.voucher_person ?? null,
      voucher_company: data?.voucher_company ?? null,
      voucher_amount_text: data?.voucher_amount_text ?? null,
    }),
  });
  if (!res.ok) {
    let message = `تعذّر حفظ نص السند (${res.status})`;
    try {
      const json = await res.json();
      message = json?.message || message;
    } catch (error) {
      // ignore
    }
    if (res.status === 403) message = "ليس لديك صلاحية تعديل نص السند";
    throw new Error(message);
  }
  savedVoucherTexts.set(key, {
    voucher_title: data?.voucher_title ?? null,
    voucher_reason: data?.voucher_reason ?? null,
    voucher_person: data?.voucher_person ?? null,
    voucher_company: data?.voucher_company ?? null,
    voucher_amount_text: data?.voucher_amount_text ?? null,
  });
  return "تم حفظ نص السند - سيُطبع به في كل مرة";
};

if (typeof window !== "undefined") {
  window.__sacVoucherSave = saveVoucherText;
}

let bgDataUrlPromise = null;
/** الخلفية كـ data URL (النافذة الجديدة لا تصل دائمًا للمسارات النسبية). */
const loadVoucherBackground = () => {
  if (!bgDataUrlPromise) {
    bgDataUrlPromise = fetch(voucherBgUrl)
      .then((res) => res.blob())
      .then(
        (blob) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result || voucherBgUrl);
            reader.onerror = () => resolve(voucherBgUrl);
            reader.readAsDataURL(blob);
          })
      )
      .catch(() => voucherBgUrl);
  }
  return bgDataUrlPromise;
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const currencyLabel = (currency) => {
  switch (String(currency || "USD").toUpperCase()) {
    case "SYP":
    case "SP":
    case "LS":
      return "ل.س";
    case "EUR":
      return "يورو";
    case "TRY":
      return "ليرة تركية";
    case "USD":
    default:
      return "دولار أمريكي";
  }
};

const formatAmount = (value) => {
  const num = parseFloat(value) || 0;
  return Number.isInteger(num)
    ? num.toLocaleString("en-US")
    : num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd} / ${mm} / ${d.getFullYear()}`;
};

/** JSON آمن داخل <script>. */
const jsonForScript = (value) => JSON.stringify(value ?? null).replace(/</g, "\\u003c");

/**
 * يبني صفحة HTML للسند.
 * @param {object} v
 *  title, isIncoming, number, date, amount, currency, amountWords,
 *  personLabel ("وصلني من" / "دفعنا إلى" / ...), person, company,
 *  showCompany, reason, partySignLabel, preparedBy, extraLines[],
 *  amountText (سطر «مبلغ وقدره» المكتوب يدويًا - يحل محل الرقم + التفقيط),
 *  saveKey ("payment:ID" | "entry:ID" - لحفظ النص), canSave,
 *  defaultTitle / defaultReason / defaultPerson / defaultCompany /
 *  defaultAmountText (النص الافتراضي - "استعادة الافتراضي")
 */
export const buildVoucherHtml = (v, bg) => {
  const isIncoming = v.isIncoming !== false;
  const amountText = formatAmount(v.amount);
  const words = v.amountWords ?? arabicNumberToWords(v.amount);
  const defaultAmountLine = words ? `${amountText} (${words})` : amountText;
  // سطر «مبلغ وقدره»: النص المكتوب/المحفوظ يدويًا يتقدم على المحسوب تلقائيًا.
  const amountLine = v.amountText || defaultAmountLine;
  const reason = [v.reason, ...(v.extraLines || [])].filter(Boolean).join(" - ");
  const showCompany = v.showCompany ?? !!v.company;
  const personLabel = v.personLabel || (isIncoming ? "وصلني من" : "دفعنا إلى");
  const partySign =
    v.partySignLabel || (isIncoming ? "اسم و توقيع المعلن" : "اسم و توقيع المستلم");
  const canSave = !!(v.canSave && v.saveKey);
  const titleOptions = [...new Set([v.title, ...VOUCHER_TITLE_PRESETS].filter(Boolean))];

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(v.title)}${v.number ? " - " + escapeHtml(v.number) : ""}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&display=swap" rel="stylesheet">
<style>
  /* مقاس السند كما في ملف التصميم الأصلي: 253.6 × 94.5 مم */
  @page { size: 253.6mm 94.5mm; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    background: #e9e6df;
    font-family: 'Almarai', 'Tajawal', 'Segoe UI', Tahoma, Arial, sans-serif;
    color: #1A1817;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .toolbar { display: flex; justify-content: center; gap: 10px; padding: 16px; }
  .toolbar button {
    font-family: inherit; font-size: 14px; font-weight: 700;
    padding: 9px 22px; border-radius: 8px; border: 0; cursor: pointer;
    background: #D5A225; color: #fff; box-shadow: 0 2px 6px rgba(0,0,0,.15);
  }
  .toolbar button.secondary { background: #1A1817; }
  .voucher {
    position: relative; width: 253.6mm; height: 94.5mm; margin: 0 auto 24px;
    background: #fff url('${bg}') no-repeat 0 0; background-size: 100% 100%;
    box-shadow: 0 6px 24px rgba(0,0,0,.18); overflow: hidden;
  }
  .v-title {
    position: absolute; top: 8.6mm; left: 0; right: 0; text-align: center;
    font-size: 25pt; font-weight: 400; line-height: 1;
  }
  .v-row {
    position: absolute; right: 20.2mm; left: 27mm; height: 7mm;
    display: flex; align-items: flex-end; gap: 1.6mm;
    font-size: 12.5pt; line-height: 1.25; white-space: nowrap;
  }
  .v-row.r1 { top: 27.6mm; } .v-row.r2 { top: 36.9mm; }
  .v-row.r3 { top: 48.3mm; } .v-row.r4 { top: 57.7mm; }
  .lbl { flex: 0 0 auto; }
  .fill {
    flex: 1 1 auto; min-width: 12mm; border-bottom: 1.4px dotted #3a3a3a;
    text-align: center; font-weight: 700; padding: 0 2mm .4mm;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .fill.ltr { direction: ltr; unicode-bidi: embed; }
  .fill.date { flex: 0 0 46mm; } .fill.number { flex: 0 0 44mm; }
  .fill.small { font-size: 10.5pt; }
  .gap { flex: 1 1 auto; }
  .toolbar { flex-wrap: wrap; align-items: center; }
  .toolbar select {
    font-family: inherit; font-size: 13px; padding: 7px 10px; border-radius: 8px;
    border: 1px solid #cfc8b8; background: #fff;
  }
  .toolbar button.ghost { background: #fff; color: #1A1817; border: 1px solid #cfc8b8; box-shadow: none; }
  .hint { width: 100%; text-align: center; font-size: 12px; color: #6B5B2E; }
  #save-status { font-size: 12px; font-weight: 700; color: #1f7a3a; min-height: 16px; }
  #save-status.err { color: #b42318; }
  @media screen {
    [contenteditable="true"] { outline: 1.5px dashed rgba(213,162,37,.75); outline-offset: 1mm; cursor: text; border-radius: 1mm; }
    [contenteditable="true"]:focus { outline: 2px solid #D5A225; background: rgba(213,162,37,.08); }
  }
  .v-sign { position: absolute; top: 69.2mm; text-align: center; font-size: 10pt; line-height: 1.3; }
  .v-sign.party { right: 20.2mm; width: 62mm; }
  .v-sign.company { left: 27mm; width: 88mm; }
  .v-sign .by { display: block; margin-top: 1mm; font-size: 7.5pt; color: #6B7280; }
  @media print {
    html, body { background: #fff; }
    .toolbar, .hint { display: none !important; }
    .voucher { margin: 0; box-shadow: none; }
  }
</style>
</head>
<body>
  <div class="toolbar">
    <button type="button" onclick="window.print()">طباعة / حفظ PDF</button>
    <select id="title-preset" title="عنوان السند" onchange="sacSetTitle(this.value)">
      ${titleOptions
        .map((t) => `<option value="${escapeHtml(t)}"${t === v.title ? " selected" : ""}>${escapeHtml(t)}</option>`)
        .join("")}
    </select>
    ${canSave ? `<button type="button" onclick="sacSave()">حفظ النص</button>` : ""}
    <button type="button" class="ghost" onclick="sacReset()">النص الافتراضي</button>
    <button type="button" class="secondary" onclick="window.close()">إغلاق</button>
    <div class="hint">اضغط على أي سطر (العنوان، الاسم، الشركة، "مبلغ و قدره"، "و ذلك عن") لتعديله قبل الطباعة${
      canSave ? '، ثم "حفظ النص" ليُطبع به دائمًا' : ""
    }.</div>
    <div id="save-status"></div>
  </div>
  <div class="voucher">
    <div class="v-title" id="v-title" contenteditable="true" spellcheck="false">${escapeHtml(v.title)}</div>

    <div class="v-row r1">
      <span class="lbl">التاريخ</span>
      <span class="fill date ltr">${escapeHtml(formatDate(v.date))}</span>
      <span class="gap"></span>
      <span class="lbl">رقم</span>
      <span class="fill number ltr">${escapeHtml(v.number || "")}</span>
    </div>

    <div class="v-row r2">
      <span class="lbl">${escapeHtml(personLabel)}</span>
      <span class="fill" id="v-person" contenteditable="true" spellcheck="false">${escapeHtml(v.person || "")}</span>
      ${
        showCompany
          ? `<span class="lbl">ممثلاً عن شركة</span>
      <span class="fill" id="v-company" contenteditable="true" spellcheck="false">${escapeHtml(v.company || "")}</span>
      <span class="lbl">المحترمين</span>`
          : `<span class="lbl">المحترم</span>`
      }
    </div>

    <div class="v-row r3">
      <span class="lbl">مبلغ و قدره</span>
      <span class="fill ${amountLine.length > 70 ? "small" : ""}" id="v-amount" contenteditable="true" spellcheck="false">${escapeHtml(amountLine)}</span>
      <span class="lbl">${escapeHtml(currencyLabel(v.currency))} فقط لا غير</span>
    </div>

    <div class="v-row r4">
      <span class="lbl">و ذلك عن</span>
      <span class="fill ${reason.length > 80 ? "small" : ""}" id="v-reason" contenteditable="true" spellcheck="false">${escapeHtml(reason)}</span>
    </div>

    <div class="v-sign party">${escapeHtml(partySign)}</div>
    <div class="v-sign company">
      اسم و توقيع ممثل الشركة السورية للإعلان
      ${v.preparedBy ? `<span class="by">حُرِّر بواسطة: ${escapeHtml(v.preparedBy)}</span>` : ""}
    </div>
  </div>
<script>
  (function () {
    var SAVE_KEY = ${jsonForScript(canSave ? v.saveKey : null)};
    var DEFAULTS = ${jsonForScript({
      title: v.defaultTitle ?? v.title,
      reason: v.defaultReason ?? reason,
      person: v.defaultPerson ?? v.person ?? "",
      company: v.defaultCompany ?? v.company ?? "",
      amount: v.defaultAmountText ?? defaultAmountLine,
    })};
    var titleEl = document.getElementById("v-title");
    var reasonEl = document.getElementById("v-reason");
    var personEl = document.getElementById("v-person");
    var companyEl = document.getElementById("v-company"); // قد لا يوجد (سند بلا شركة)
    var amountEl = document.getElementById("v-amount");
    var statusEl = document.getElementById("save-status");
    var text = function (el) { return (el.innerText || "").replace(/\s+/g, " ").trim(); };
    var setStatus = function (msg, isErr) { statusEl.textContent = msg || ""; statusEl.className = isErr ? "err" : ""; };
    var fit = function () {
      reasonEl.classList.toggle("small", text(reasonEl).length > 80);
      amountEl.classList.toggle("small", text(amountEl).length > 70);
    };
    // سطر واحد: Enter لا يُضيف سطرًا جديدًا.
    [titleEl, reasonEl, personEl, companyEl, amountEl].filter(Boolean).forEach(function (el) {
      el.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); el.blur(); } });
      el.addEventListener("input", function () { fit(); setStatus(""); });
      // لصق نص عادي فقط (بلا تنسيق).
      el.addEventListener("paste", function (e) {
        e.preventDefault();
        var t = (e.clipboardData || window.clipboardData).getData("text") || "";
        document.execCommand("insertText", false, t.replace(/\s+/g, " "));
      });
    });
    window.sacSetTitle = function (value) { titleEl.textContent = value; setStatus(""); };
    window.sacReset = function () {
      titleEl.textContent = DEFAULTS.title || "";
      reasonEl.textContent = DEFAULTS.reason || "";
      personEl.textContent = DEFAULTS.person || "";
      if (companyEl) companyEl.textContent = DEFAULTS.company || "";
      amountEl.textContent = DEFAULTS.amount || "";
      fit();
      setStatus("");
    };
    window.sacSave = function () {
      if (!SAVE_KEY) return;
      var opener = window.opener;
      if (!opener || opener.closed || typeof opener.__sacVoucherSave !== "function") {
        setStatus("تعذّر الحفظ: أُغلقت صفحة النظام التي فتحت هذا السند", true);
        return;
      }
      var t = text(titleEl), r = text(reasonEl);
      var p = text(personEl), a = text(amountEl);
      var c = companyEl ? text(companyEl) : "";
      setStatus("جارٍ الحفظ...");
      opener.__sacVoucherSave(SAVE_KEY, {
        // مطابق للافتراضي => null (يبقى يتبع الافتراضي مستقبلًا).
        voucher_title: t && t !== DEFAULTS.title ? t : null,
        voucher_reason: r && r !== DEFAULTS.reason ? r : null,
        voucher_person: p && p !== DEFAULTS.person ? p : null,
        voucher_company: c && c !== DEFAULTS.company ? c : null,
        voucher_amount_text: a && a !== DEFAULTS.amount ? a : null
      }).then(function (msg) { setStatus(msg || "تم الحفظ"); })
        .catch(function (err) { setStatus((err && err.message) || "تعذّر الحفظ", true); });
    };
    fit();
  })();
</script>
</body>
</html>`;
};

/** نافذة "جارٍ التحميل" تُفتح فورًا عند الضغط (كي لا يحجبها المتصفح). */
const openPendingWindow = () => {
  const win = window.open("", "_blank");
  if (win) {
    win.document.open();
    win.document.write(
      `<html dir="rtl"><body style="font-family:Tahoma;padding:40px;text-align:center;color:#555">جارٍ تجهيز السند...</body></html>`
    );
    win.document.close();
  }
  return win;
};

const writeToWindow = (win, html) => {
  if (!win || win.closed) {
    // النافذة حُجبت - نفتح Blob كبديل.
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    const w = window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return !!w;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  return true;
};

/** يفتح سندًا جاهز البيانات. */
export const openVoucher = async (voucher, existingWindow = null) => {
  const win = existingWindow || openPendingWindow();
  const bg = await loadVoucherBackground();
  return writeToWindow(win, buildVoucherHtml(voucher, bg));
};

// ---------------------------------------------------------------------------
// من قيد محاسبي (JournalEntryResource) - سندات القبض/الصرف/الفاتورة/السلفة/الخصم
// ---------------------------------------------------------------------------

/** عنوان السند من السياق: عنوان صريح > كلمات الوصف > نوع القيد. */
const detectTitle = (entry, explicitTitle) => {
  if (explicitTitle) return explicitTitle;
  const text = `${entry?.description || ""}`.toLowerCase();
  const isIncoming = entry?.type === "incoming";
  if (/خصم|deduction|discount/.test(text)) return "سند خصم";
  if (/سلف|advance/.test(text)) return isIncoming ? "سند قبض سلفة" : "سند سلفة";
  if (/فاتورة|invoice|purchase/.test(text)) return "سند فاتورة";
  if (/راتب|رواتب|salary|payroll/.test(text)) return "سند صرف راتب";
  return entry?.voucher_type_label || (isIncoming ? "سند قبض" : "سند صرف");
};

/**
 * يحوّل قيدًا محاسبيًا إلى بيانات سند. سطر الصندوق/البنك هو المدين في سند
 * القبض والدائن في سند الصرف (المبلغ الفعلي بعملة الصندوق)؛ والطرف الآخر
 * هو الحساب المقابل.
 */
export const voucherFromJournalEntry = (entry, { title } = {}) => {
  const isIncoming = entry?.type !== "outgoing";
  const lines = Array.isArray(entry?.lines) ? entry.lines : [];

  const cashSide = isIncoming ? "debit" : "credit";
  const partySide = isIncoming ? "credit" : "debit";
  const byAmount = (side) =>
    [...lines].filter((l) => (parseFloat(l[side]) || 0) > 0).sort((a, b) => b[side] - a[side]);

  const cashLine = byAmount(cashSide)[0];
  const partyLine = byAmount(partySide)[0];

  const amount = cashLine ? parseFloat(cashLine[cashSide]) : parseFloat(entry?.total_debit) || 0;

  const adjustments = Array.isArray(entry?.payroll_adjustments) ? entry.payroll_adjustments : [];
  const extraLines = adjustments.map((a) => {
    const label = a.type === "deduction" ? "خصم" : a.type === "bonus" ? "مكافأة" : a.type;
    return `${label}: ${formatAmount(a.amount)}${a.reason ? ` (${a.reason})` : ""}`;
  });

  const defaultTitle = detectTitle(entry, title);
  const defaultReason = [entry?.description || "", ...extraLines].filter(Boolean).join(" - ");
  const key = entry?.id ? `entry:${entry.id}` : null;
  // النص المحفوظ (من الأدمن) يتقدَّم على الافتراضي - راجع saveVoucherText.
  const saved = (key && savedVoucherTexts.get(key)) || {};
  const savedTitle = saved.voucher_title !== undefined ? saved.voucher_title : entry?.voucher_title;
  const savedReason = saved.voucher_reason !== undefined ? saved.voucher_reason : entry?.voucher_reason;
  const savedPerson = saved.voucher_person !== undefined ? saved.voucher_person : entry?.voucher_person;
  const savedCompany = saved.voucher_company !== undefined ? saved.voucher_company : entry?.voucher_company;
  const savedAmountText =
    saved.voucher_amount_text !== undefined ? saved.voucher_amount_text : entry?.voucher_amount_text;
  const defaultPerson = partyLine?.account?.name || "";

  return {
    title: savedTitle || defaultTitle,
    isIncoming,
    number: entry?.voucher_number || entry?.entry_number || "",
    date: entry?.entry_date,
    amount,
    currency: cashLine?.currency || "USD",
    person: savedPerson || defaultPerson,
    company: savedCompany || null,
    // سند بلا شركة افتراضيًا؛ يظهر سطر الشركة فقط إن كُتب/حُفظ اسم شركة.
    showCompany: !!savedCompany,
    amountText: savedAmountText || undefined,
    reason: savedReason || defaultReason,
    extraLines: [],
    preparedBy: entry?.created_by_name,
    saveKey: key,
    canSave: !!key && canSaveVoucherText("edit-financials"),
    defaultTitle,
    defaultReason,
    defaultPerson,
    defaultCompany: "",
  };
};

/**
 * يفتح سند قيد محاسبي بالتصميم الرسمي. عند تعذّر جلب بيانات القيد، يعود
 * لصفحة السند التي يولّدها الباك-إند كما كان سابقًا.
 */
export const openJournalEntryVoucher = async (journalEntryId, { title } = {}) => {
  const win = openPendingWindow();
  const token = getToken();
  const headers = {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    const res = await fetch(`${BASE_URL}/accounting/transactions/${journalEntryId}`, { headers });
    if (!res.ok) throw new Error(`تعذر جلب بيانات السند (${res.status})`);
    const json = await res.json();
    const entry = json?.data ?? json;
    return await openVoucher(voucherFromJournalEntry(entry, { title }), win);
  } catch (error) {
    // بديل: صفحة السند من الباك-إند (السلوك السابق).
    try {
      const res = await fetch(`${BASE_URL}/accounting/transactions/${journalEntryId}/voucher`, {
        headers: { ...headers, Accept: "text/html" },
      });
      if (!res.ok) throw new Error(`تعذر عرض السند (${res.status})`);
      return writeToWindow(win, await res.text());
    } catch (fallbackError) {
      if (win && !win.closed) win.close();
      throw fallbackError;
    }
  }
};

// ---------------------------------------------------------------------------
// من دفعة زبون (Payment) - "إيصال دفع"
// ---------------------------------------------------------------------------

export const voucherFromPayment = (payment) => {
  const customer = payment?.customer || {};
  const defaultTitle = "إيصال دفع";
  const defaultReason = [
    payment?.booking_id ? `دفعة على الحجز رقم ${payment.booking_id}` : "دفعة على الحساب",
    payment?.remaining != null && payment?.remaining !== ""
      ? `الرصيد المتبقي: ${formatAmount(payment.remaining)} $`
      : null,
  ]
    .filter(Boolean)
    .join(" - ");
  const key = payment?.id ? `payment:${payment.id}` : null;
  const saved = (key && savedVoucherTexts.get(key)) || {};
  const savedTitle = saved.voucher_title !== undefined ? saved.voucher_title : payment?.voucher_title;
  const savedReason = saved.voucher_reason !== undefined ? saved.voucher_reason : payment?.voucher_reason;
  const savedPerson = saved.voucher_person !== undefined ? saved.voucher_person : payment?.voucher_person;
  const savedCompany = saved.voucher_company !== undefined ? saved.voucher_company : payment?.voucher_company;
  const savedAmountText =
    saved.voucher_amount_text !== undefined ? saved.voucher_amount_text : payment?.voucher_amount_text;
  const defaultPerson = customer.full_name || customer.company_name || "";
  const defaultCompany = customer.company_name || "";

  return {
    title: savedTitle || defaultTitle,
    isIncoming: true,
    number: payment?.payment_number || payment?.id,
    date: payment?.date || payment?.created_at,
    amount: payment?.paid,
    currency: "USD",
    // الباك-إند يُرسل التفقيط الجاهز مع كل دفعة (paidToString).
    amountWords: payment?.paidToString || undefined,
    person: savedPerson || defaultPerson,
    company: savedCompany || defaultCompany,
    showCompany: true,
    amountText: savedAmountText || undefined,
    // "و ذلك عن": نص الأدمن المحفوظ، وإلا الافتراضي.
    reason: savedReason || defaultReason,
    extraLines: [],
    preparedBy: payment?.user?.full_name || payment?.user?.username,
    saveKey: key,
    canSave: !!key && canSaveVoucherText("edit-payments"),
    defaultTitle,
    defaultReason,
    defaultPerson,
    defaultCompany,
  };
};

export const openPaymentReceipt = (payment) => openVoucher(voucherFromPayment(payment));

export default {
  buildVoucherHtml,
  openVoucher,
  openJournalEntryVoucher,
  openPaymentReceipt,
  voucherFromJournalEntry,
  voucherFromPayment,
  VOUCHER_TITLE_PRESETS,
};
