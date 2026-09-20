import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "../../../Api/baseUrl";

// نموذج "اطلب عرض سعر" العام في الصفحة التسويقية (LandingPage/ContactForm) -
// بلا توكن (زائر غير مسجَّل). كانت الواجهة تبني رسالة واتساب كاملة ثم تفتح
// wa.me برقم الشركة الثابت ليضغط الزائر "إرسال" يدويًا؛ الآن تُرسَل بيانات
// النموذج فقط إلى الباك-إند الذي يبني *نفس* نص الرسالة ويرسلها تلقائيًا عبر
// WahaService لرقم الشركة الثابت. راجع
// App\Http\Controllers\Api\V1\PublicContactController.
const baseQuery = fetchBaseQuery({
  baseUrl: `${BASE_URL}`,
  prepareHeaders: (headers) => {
    headers.set("Accept", "application/json");
    headers.set("Content-Type", "application/json");
    return headers;
  },
});

export const publicContactApiSlice = createApi({
  reducerPath: "publicContact",
  baseQuery,
  endpoints: (builder) => ({
    submitContactRequest: builder.mutation({
      query: ({ name, email, phone, serviceType, budget }) => ({
        url: "/public/contact-requests",
        method: "POST",
        body: {
          name,
          email,
          phone,
          service_type: serviceType,
          budget,
        },
      }),
      transformResponse: (response) => ({
        success: true,
        message: response?.message || "تم إرسال طلبك بنجاح",
      }),
      transformErrorResponse: (error) => ({
        success: false,
        message: error.data?.message || "تعذّر إرسال طلبك، حاول مرة أخرى",
      }),
    }),
  }),
});

export const { useSubmitContactRequestMutation } = publicContactApiSlice;
