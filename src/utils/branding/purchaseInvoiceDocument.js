// src/utils/branding/purchaseInvoiceDocument.js
//
// طباعة فاتورة شراء (طلب صريح) على ورق الشركة الرسمي (SAC letterhead) -
// صفحة HTML تُفتح في تبويب جديد وتُطبع تلقائيًا (أو تُحفظ PDF من نافذة
// الطباعة). تعمل بنفس بيانات PurchaseInvoiceResource القادمة من القائمة
// أو من شاشة التفاصيل.

import { loadSacLetterheadAssets, SAC_COLORS } from "./sacBrand";
import { sacLetterheadDocument } from "./pdfLetterheadHtml";

const fmt = (n) =>
  Number(n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const buildPurchaseInvoiceHtml = (invoice) => {
  const items = invoice.items ?? [];
  const payments = invoice.payments ?? [];
  const isCredit = invoice.payment_type === "credit";
  const creator = invoice.creator?.full_name || invoice.creator?.username || "-";

  const itemsRows = items.length
    ? items
        .map(
          (it, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${esc(it.material_name || it.material?.name || "-")}</td>
          <td>${esc(it.unit || "-")}</td>
          <td>${esc(it.quantity)}</td>
          <td>${fmt(it.unit_price)}</td>
          <td>${fmt(it.subtotal)}</td>
        </tr>`
        )
        .join("")
    : `<tr><td colspan="6">فاتورة بمبلغ إجمالي بلا تفصيل مواد</td></tr>`;

  const itemsTotal = items.reduce((s, it) => s + Number(it.subtotal || 0), 0);

  const paymentsTable = payments.length
    ? `
      <h3 class="pi-section">الدفعات المسدَّدة</h3>
      <table class="sac-table">
        <thead><tr><th>#</th><th>التاريخ</th><th>المبلغ ($)</th></tr></thead>
        <tbody>
          ${payments
            .map(
              (p, i) =>
                `<tr><td>${i + 1}</td><td>${esc(String(p.created_at ?? "").slice(0, 10) || "-")}</td><td>${fmt(p.amount)}</td></tr>`
            )
            .join("")}
        </tbody>
      </table>`
    : "";

  const body = `
    <table class="pi-info">
      <tr>
        <td><span>رقم الفاتورة</span><b>${esc(invoice.invoice_number || `#${invoice.id}`)}</b></td>
        <td><span>التاريخ</span><b>${esc(invoice.date || "-")}</b></td>
        <td><span>المورد</span><b>${esc(invoice.supplier?.name || "-")}</b></td>
      </tr>
      <tr>
        <td><span>طريقة الدفع</span><b>${isCredit ? "آجل" : "نقدي"}</b></td>
        <td><span>حساب المصروف</span><b>${esc(invoice.expense_account?.name || "-")}</b></td>
        <td><span>أضيفت بواسطة</span><b>${esc(creator)}</b></td>
      </tr>
      ${
        isCredit
          ? `<tr>
        <td><span>تاريخ الاستحقاق</span><b>${esc(invoice.due_date || "-")}</b></td>
        <td><span>المدفوع</span><b>$${fmt(invoice.amount_paid)}</b></td>
        <td><span>المتبقي</span><b>$${fmt(invoice.remaining_amount)}</b></td>
      </tr>`
          : ""
      }
    </table>

    <h3 class="pi-section">بنود الفاتورة</h3>
    <table class="sac-table">
      <thead>
        <tr><th>#</th><th>المادة</th><th>الوحدة</th><th>الكمية</th><th>سعر الوحدة</th><th>المجموع</th></tr>
      </thead>
      <tbody>${itemsRows}</tbody>
      ${
        items.length
          ? `<tfoot><tr><td colspan="5">إجمالي البنود (بعملة الفاتورة)</td><td>${fmt(itemsTotal)}</td></tr></tfoot>`
          : ""
      }
    </table>

    <div class="pi-total">إجمالي الفاتورة: <b>$${fmt(invoice.amount)}</b></div>

    ${paymentsTable}

    ${invoice.description ? `<p class="pi-notes"><b>ملاحظات:</b> ${esc(invoice.description)}</p>` : ""}

    <table class="pi-sign">
      <tr><td>توقيع المستلم</td><td>توقيع المحاسب</td><td>توقيع المدير</td></tr>
      <tr><td></td><td></td><td></td></tr>
    </table>
  `;

  const styles = `
    .pi-info { width: 100%; border-collapse: separate; border-spacing: 6px; margin-bottom: 8px; }
    .pi-info td { background: ${SAC_COLORS.goldPale}; border: 1px solid ${SAC_COLORS.border}; border-radius: 6px; padding: 7px 10px; width: 33%; }
    .pi-info td span { display: block; font-size: 10px; color: ${SAC_COLORS.grayText}; }
    .pi-info td b { font-size: 13px; }
    .pi-section { font-size: 14px; margin: 14px 0 4px; color: ${SAC_COLORS.dark}; }
    .pi-total { text-align: left; font-size: 16px; margin: 6px 0 12px; padding: 8px 12px; border-top: 2px solid ${SAC_COLORS.gold}; }
    .pi-notes { font-size: 12px; margin: 8px 0; }
    .pi-sign { width: 100%; margin-top: 36px; border-collapse: collapse; font-size: 12px; text-align: center; }
    .pi-sign td { width: 33%; padding: 6px; }
    .pi-sign tr:last-child td { height: 50px; border-bottom: 1px dotted #999; }
  `;

  return sacLetterheadDocument({
    title: "فاتورة شراء",
    subtitle: `رقم ${invoice.invoice_number || `#${invoice.id}`} - ${invoice.date || ""}`,
    body,
    styles,
    autoPrint: true,
  });
};

/** يفتح فاتورة الشراء للطباعة. النافذة تُفتح فورًا (قبل أي await) كي لا يحجبها المتصفح. */
export const openPurchaseInvoicePrint = async (invoice) => {
  if (!invoice) return;
  const win = window.open("", "_blank");
  await loadSacLetterheadAssets();
  const html = buildPurchaseInvoiceHtml(invoice);
  if (win) {
    win.document.open();
    win.document.write(html);
    win.document.close();
  } else {
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
};

export default openPurchaseInvoicePrint;
