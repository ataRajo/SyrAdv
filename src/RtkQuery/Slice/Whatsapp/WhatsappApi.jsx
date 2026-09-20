import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "../../../Api/baseUrl";

// إرسال واتساب عام (موظف مُصادَق عليه عبر توكن SuperAdminInfo) - يستبدل كل
// window.open(`https://wa.me/...`) اليدوي في شاشات الإدارة (مثلًا
// ContactCustomerModal لمراسلة عميل عن عرض): نفس نص الرسالة الذي كان يُبنى
// في الواجهة سابقًا يُرسَل الآن تلقائيًا عبر الباك-إند (WahaService) بدل
// فتح تطبيق واتساب ليضغط المستخدم "إرسال" يدويًا. راجع
// App\Http\Controllers\Api\V1\WhatsappController على الباك-إند.
const baseQueryWithAuth = fetchBaseQuery({
  baseUrl: `${BASE_URL}`,
  prepareHeaders: (headers) => {
    const raw = localStorage.getItem("SuperAdminInfo");
    const info = raw ? JSON.parse(raw) : null;
    const token = info?.user?.token || info?.token || null;

    headers.set("Accept", "application/json");
    headers.set("Content-Type", "application/json");

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  },
});

export const whatsappApiSlice = createApi({
  reducerPath: "whatsapp",
  baseQuery: baseQueryWithAuth,
  endpoints: (builder) => ({
    // POST إرسال رسالة واتساب فورية لرقم هاتف مُحدَّد - نفس مضمون الرسالة
    // الذي كانت تبنيه الواجهة لرابط wa.me، يُرسَل الآن تلقائيًا عبر الباك-إند.
    sendWhatsappMessage: builder.mutation({
      query: ({ phoneNumber, message }) => ({
        url: "/whatsapp/send",
        method: "POST",
        body: { phone_number: phoneNumber, message },
      }),
      transformResponse: (response) => ({
        success: true,
        message: response?.message || "تم إرسال الرسالة عبر واتساب بنجاح",
      }),
      transformErrorResponse: (error) => ({
        success: false,
        message: error.data?.message || "فشل في إرسال الرسالة عبر واتساب",
      }),
    }),
  }),
});

export const { useSendWhatsappMessageMutation } = whatsappApiSlice;
