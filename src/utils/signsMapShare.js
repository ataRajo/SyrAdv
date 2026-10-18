// signsMapShare.js
//
// رابط عام (بلا تسجيل دخول) لمشاركة اللوحات الظاهرة في جدول إضافة الحجز مع
// الزبون.
//
// الطريقة الحالية (رابط قصير): نرسل أرقام اللوحات فقط إلى
//   POST /api/signs-maps  (يتطلب تسجيل دخول الموظف)
// فيعيد رمزًا من 8 أحرف، والرابط يصبح  /public-signs-map/{code}  وتقرأ الصفحة
// العامة بياناتها من
//   GET /api/public/signs-maps/{code}  (بلا توكن).
//
// الطريقة القديمة (روابط مرسلة سابقًا): بيانات اللوحات مضغوطة داخل الجزء #hash
// من الرابط. ما زالت دوال encode/decodeMarkers موجودة فقط لتبقى الروابط
// القديمة تعمل، لكن لم تعد تُستخدم لإنشاء روابط جديدة.

import { BASE_URL, FRONTEND_URL } from "../Api/baseUrl";

const FIELDS = [
  "id", "lat", "lng", "place", "directions",
  "model", "type", "size", "city", "region", "roadsign_code",
];

const toBase64Url = (bytes) => {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const fromBase64Url = (str) => {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

const pipe = async (bytes, stream) => {
  const out = new Blob([bytes]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
};

// يحوّل roadSigns القادمة من useGetRoadSignsByFilter إلى صفوف مضغوطة.
export const roadSignsToMarkers = (roadSigns = []) =>
  roadSigns
    .filter((rs) => rs?.latitudeX && rs?.longitudeY)
    .map((rs) => ({
      id: rs.id,
      lat: parseFloat(rs.latitudeX),
      lng: parseFloat(rs.longitudeY),
      place: rs.place || "موقع إعلاني",
      directions: rs.directions || "",
      model: rs.template?.model || "",
      type: rs.template?.type || "",
      size: rs.template?.size || "",
      city: rs.city?.name || "",
      region: rs.region?.name || "",
      roadsign_code: rs.roadsign_code || "",
      image: rs.image || "",
    }))
    .filter((m) => !Number.isNaN(m.lat) && !Number.isNaN(m.lng));

// حقول متكررة (موديل/نوع/مقاس/مدينة/منطقة) تُخزَّن مرة واحدة في جدول نصوص
// وتُشار إليها بالفهرس، والإحداثيات تُقرَّب لـ 5 خانات (~1م) لتقصير الرابط.
const REPEATED = ["model", "type", "size", "city", "region"];
const round5 = (n) => Math.round(n * 1e5) / 1e5;

export const encodeMarkers = async (markers) => {
  const table = [];
  const index = new Map();
  const ref = (v) => {
    const key = v ?? "";
    if (!index.has(key)) {
      index.set(key, table.length);
      table.push(key);
    }
    return index.get(key);
  };
  const rows = markers.map((m) =>
    FIELDS.map((f) => {
      if (f === "lat" || f === "lng") return round5(m[f]);
      if (REPEATED.includes(f)) return ref(m[f]);
      return m[f] ?? "";
    })
  );
  const json = new TextEncoder().encode(JSON.stringify({ s: table, r: rows }));
  const packed = await pipe(json, new CompressionStream("deflate-raw"));
  return toBase64Url(packed);
};

export const decodeMarkers = async (encoded) => {
  const packed = fromBase64Url(encoded);
  const json = await pipe(packed, new DecompressionStream("deflate-raw"));
  const data = JSON.parse(new TextDecoder().decode(json));
  // الصيغة القديمة: مصفوفة صفوف مباشرة
  const rows = Array.isArray(data) ? data : data.r;
  const table = Array.isArray(data) ? null : data.s;
  return rows.map((row) =>
    Object.fromEntries(
      FIELDS.map((f, i) => [
        f,
        table && REPEATED.includes(f) ? table[row[i]] : row[i],
      ])
    )
  );
};

const getToken = () => {
  try {
    const raw = localStorage.getItem("SuperAdminInfo");
    const info = raw ? JSON.parse(raw) : null;
    return info?.user?.token || info?.token || localStorage.getItem("token");
  } catch (error) {
    return localStorage.getItem("token");
  }
};

/**
 * ينشئ رابطًا عامًا قصيرًا للوحات (markers القادمة من roadSignsToMarkers).
 * يرسل أرقام اللوحات فقط - المواقع تُقرأ من السيرفر عند فتح الرابط.
 */
export const buildSignsMapUrl = async (markers) => {
  const ids = [...new Set((markers || []).map((m) => m?.id).filter(Boolean))];
  if (ids.length === 0) throw new Error("لا توجد لوحات لمشاركتها");

  const token = getToken();
  const res = await fetch(`${BASE_URL}/signs-maps`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ road_sign_ids: ids }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.data?.code) {
    throw new Error(json?.message || `تعذر إنشاء الرابط (${res.status})`);
  }
  return `${FRONTEND_URL || window.location.origin}/public-signs-map/${json.data.code}`;
};

/**
 * يقرأ لوحات رابط قصير من الـ API العام - بلا أي Authorization عمدًا (الصفحة
 * عامة، ولا نرسل رمز دخول الموظف لو كان الزبون/الموظف مسجلًا في نفس المتصفح).
 */
export const fetchSharedMarkers = async (code) => {
  const res = await fetch(`${BASE_URL}/public/signs-maps/${encodeURIComponent(code)}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return Array.isArray(json?.data?.markers) ? json.data.markers : [];
};
