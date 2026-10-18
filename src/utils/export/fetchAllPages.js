// src/utils/export/fetchAllPages.js
//
// تصدير PDF/Excel للدفعات والزبائن كان يُخرج ملفًا فارغًا: الباك-إند يُرجِع
// هذه القوائم مُرقَّمة (Laravel paginator: { data: [...], current_page,
// last_page, ... }) بينما المُصدِّرات كانت تتوقع مصفوفة مباشرة
// (Array.isArray) فتتجاهل البيانات بصمت. هنا:
//   - normalizeList(): يستخرج المصفوفة من أي شكل (مصفوفة / paginator /
//     { data: { data: [] } }).
//   - fetchAllPages(): يجلب *كل* الصفحات (لا الصفحة المعروضة فقط) كي
//     يحتوي الملف المُصدَّر كامل البيانات.

import { BASE_URL } from "../../Api/baseUrl";

const getToken = () => {
  try {
    const raw = localStorage.getItem("SuperAdminInfo");
    const info = raw ? JSON.parse(raw) : null;
    return info?.user?.token || info?.token || localStorage.getItem("token");
  } catch (error) {
    return localStorage.getItem("token");
  }
};

/** مصفوفة من أي شكل استجابة شائع في هذا المشروع. */
export const normalizeList = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;
  return [];
};

const lastPageOf = (json) =>
  json?.last_page ?? json?.meta?.total_pages ?? json?.meta?.last_page ?? json?.data?.last_page ?? 1;

/**
 * يجلب كل صفحات مسار مُرقَّم ويعيد مصفوفة واحدة.
 * @param {string} path  مثال: "/payments"
 * @param {object} params فلاتر إضافية (تُتجاهل القيم الفارغة)
 */
export const fetchAllPages = async (path, params = {}, { perPage = 200, maxPages = 100 } = {}) => {
  const token = getToken();
  const all = [];
  let page = 1;
  let last = 1;

  do {
    const query = new URLSearchParams(
      Object.entries({ ...params, page, per_page: perPage }).filter(
        ([, v]) => v !== undefined && v !== null && v !== "" && v !== "all"
      )
    ).toString();

    const res = await fetch(`${BASE_URL}${path}?${query}`, {
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error(`تعذر جلب البيانات (${res.status})`);
    const json = await res.json();

    all.push(...normalizeList(json));
    last = Number(lastPageOf(json)) || 1;
    page += 1;
  } while (page <= last && page <= maxPages);

  return all;
};

export default { fetchAllPages, normalizeList };
