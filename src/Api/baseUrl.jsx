
//export const BASE_URL = "https://tsyrback.addresses.sy/api"

//ata is here :)

//export const BASE_URL = "http://192.168.1.222:8000/api";



export const BASE_URL = "https://devsyrback.addresses.sy/api";

// رابط الواجهة (الفرونت) الديناميكي - يُؤخذ من النطاق الذي يعمل عليه التطبيق فعليًا
// (dev / test / production) بدل أي نطاق مكتوب يدويًا.
export const FRONTEND_URL =
  typeof window !== "undefined" ? window.location.origin : "";

// الرابط العام لعرض خطة/خطط إعلانية للزبون بلا تسجيل دخول (/plans/:token).
export const getPublicPlanUrl = (token) => `${FRONTEND_URL}/plans/${token}`;

// الرابط العام لخريطة توزيع لوحات حجز/حملة (/public-map/:id) بلا تسجيل دخول.
export const getPublicMapUrl = (id) => `${FRONTEND_URL}/public-map/${id}`;
