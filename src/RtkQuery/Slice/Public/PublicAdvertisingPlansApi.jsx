// PublicAdvertisingPlansApi.jsx
//
// واجهة عامة بلا تسجيل دخول (نفس نمط PublicContactApi.jsx) يستخدمها الزبون
// عند فتح الرابط المُرسَل له لعرض خطة إعلانية واحدة أو أكثر واختيار خطة
// والطلب من الشركة حجزها. لا Authorization header هنا إطلاقاً.
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "../../../Api/baseUrl";

const baseQuery = fetchBaseQuery({
  baseUrl: `${BASE_URL}`,
  prepareHeaders: (headers) => {
    headers.set("Accept", "application/json");
    headers.set("Content-Type", "application/json");
    return headers;
  },
});

export const publicAdvertisingPlansApiSlice = createApi({
  reducerPath: "publicAdvertisingPlans",
  baseQuery,
  tagTypes: ["PublicAdvertisingPlans"],
  endpoints: (builder) => ({
    // token = share_token الموجود ضمن رابط .../plans/:token - يعيد مصفوفة
    // خطط (قد تكون خطة واحدة أو عدة خطط أُرسلت معاً بنفس الرابط)
    getPublicAdvertisingPlans: builder.query({
      query: (token) => `/public/advertising-plans/${token}`,
      providesTags: (result, error, token) => [{ type: "PublicAdvertisingPlans", id: token }],
    }),

    // الزبون يضغط "أريد حجز هذه الخطة" - لا يُنشئ حجزاً مباشرة، فقط يُعلِم
    // الشركة (customer_requested_at) لتتواصل معه الموظفة وتؤكد/تعدّل قبل
    // التحويل الفعلي لحجز (راجع convertAdvertisingPlanToBooking في واجهة
    // الموظف).
    requestPlanBooking: builder.mutation({
      query: ({ token, planId, note }) => ({
        url: `/public/advertising-plans/${token}/plans/${planId}/request-booking`,
        method: "POST",
        body: { note },
      }),
      transformResponse: (response) => ({
        success: true,
        message: response?.message || "تم إرسال طلبك بنجاح، سيتواصل معك فريقنا قريباً",
      }),
      transformErrorResponse: (error) => ({
        success: false,
        message: error.data?.message || "تعذّر إرسال طلبك، حاول مرة أخرى",
      }),
      invalidatesTags: (result, error, { token }) => [
        { type: "PublicAdvertisingPlans", id: token },
      ],
    }),
  }),
});

export const {
  useGetPublicAdvertisingPlansQuery,
  useRequestPlanBookingMutation,
} = publicAdvertisingPlansApiSlice;
