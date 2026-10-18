// AdvertisingPlansApi.jsx
//
// ميزة "الخطط الإعلانية" (طلب صريح من الزبون):
// خطة إعلانية = مجموعة لوحات (يمكن أن تتكرر نفس اللوحة في أكثر من خطة في
// نفس الوقت) + سعر نهائي + رابط عام (بلا تسجيل دخول) لعرضها على الزبون.
// تبقى الخطة "نشطة" لمدة 48 ساعة من إنشائها ثم تُؤرشف تلقائياً (الأرشفة
// الفعلية مهمة الباك-إند - راجع API_CONTRACT.md المرفق).
//
// هذا الملف هو واجهة الموظف (يتطلب تسجيل دخول) لإدارة الخطط: إنشاء، تعديل
// (إضافة/حذف لوحات)، أرشفة، مشاركة (توليد رابط عام لخطة أو عدة خطط معاً)،
// وتحويل خطة إلى حجز فعلي. راجع PublicAdvertisingPlansApi.jsx للواجهة
// العامة التي يستخدمها الزبون عبر الرابط المُرسَل له (بلا توكن).
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../Global";

export const AdvertisingPlansSlice = createApi({
  reducerPath: "advertisingPlans",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["AdvertisingPlans"],
  endpoints: (builder) => ({
    // status: "active" | "archived" (اختياري - بلا فلترة = الكل)
    getAdvertisingPlans: builder.query({
      query: ({ page, per_page, status, customer_id, search } = {}) => {
        const params = new URLSearchParams();
        if (page) params.append("page", page);
        if (per_page) params.append("per_page", per_page);
        if (status) params.append("status", status);
        if (customer_id) params.append("customer_id", customer_id);
        if (search) params.append("search", search);
        const qs = params.toString();
        return `/advertising-plans${qs ? `?${qs}` : ""}`;
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: "AdvertisingPlans", id })),
              { type: "AdvertisingPlans", id: "LIST" },
            ]
          : [{ type: "AdvertisingPlans", id: "LIST" }],
    }),

    getAdvertisingPlanById: builder.query({
      query: (id) => `advertising-plans/${id}`,
      providesTags: (result, error, id) => [{ type: "AdvertisingPlans", id }],
    }),

    // data: { name, customer_id?, notes?, start_date, end_date,
    //   road_signs: [{ road_sign_id, price? }],
    //   // ===== حقول التسعير التلقائي الجديدة (طلب صريح) - اختيارية، راجع
    //   // AdvertisingPlanForm.jsx وAdvertisingPlanService::calculatePlanPricing() =====
    //   product_type?, printing_id?, discount_type?, discount_value? }
    addAdvertisingPlan: builder.mutation({
      query: (data) => ({
        url: "advertising-plans",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "AdvertisingPlans", id: "LIST" }],
    }),

    updateAdvertisingPlan: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `advertising-plans/${id}`,
        method: "POST",
        body: { ...data, _method: "PUT" },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "AdvertisingPlans", id },
        { type: "AdvertisingPlans", id: "LIST" },
      ],
    }),

    deleteAdvertisingPlan: builder.mutation({
      query: (id) => ({
        url: `advertising-plans/${id}`,
        method: "POST",
        body: { _method: "DELETE" },
      }),
      invalidatesTags: [{ type: "AdvertisingPlans", id: "LIST" }],
    }),

    // إضافة لوحة/لوحات لخطة موجودة - road_signs: [{ road_sign_id, price }]
    addRoadSignsToPlan: builder.mutation({
      query: ({ id, road_signs }) => ({
        url: `advertising-plans/${id}/road-signs`,
        method: "POST",
        body: { road_signs },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "AdvertisingPlans", id }],
    }),

    // حذف لوحة واحدة من الخطة
    removeRoadSignFromPlan: builder.mutation({
      query: ({ id, roadSignId }) => ({
        url: `advertising-plans/${id}/road-signs/${roadSignId}`,
        method: "POST",
        body: { _method: "DELETE" },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "AdvertisingPlans", id }],
    }),

    // تحديث سعر لوحة داخل الخطة بدون حذف/إعادة إضافة
    updateRoadSignPriceInPlan: builder.mutation({
      query: ({ id, roadSignId, price }) => ({
        url: `advertising-plans/${id}/road-signs/${roadSignId}`,
        method: "POST",
        body: { _method: "PUT", price },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "AdvertisingPlans", id }],
    }),

    // أرشفة يدوية قبل انتهاء الـ 48 ساعة (مثلاً: الزبون رفض العرض)
    archiveAdvertisingPlan: builder.mutation({
      query: (id) => ({
        url: `advertising-plans/${id}/archive`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "AdvertisingPlans", id },
        { type: "AdvertisingPlans", id: "LIST" },
      ],
    }),

    // إعادة تنشيط خطة مؤرشفة (تمديد نافذة الـ 48 ساعة من جديد)
    restoreAdvertisingPlan: builder.mutation({
      query: (id) => ({
        url: `advertising-plans/${id}/restore`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "AdvertisingPlans", id },
        { type: "AdvertisingPlans", id: "LIST" },
      ],
    }),

    // توليد/تحديث رابط عام يجمع خطة واحدة أو أكثر (لإرسال أكثر من خطة
    // بنفس الرابط للزبون) - يعيد { share_token, url }
    shareAdvertisingPlans: builder.mutation({
      query: ({ plan_ids, send_whatsapp = false, customer_phone } = {}) => ({
        url: "advertising-plans/share",
        method: "POST",
        body: { plan_ids, send_whatsapp, customer_phone },
      }),
      invalidatesTags: (result, error, { plan_ids } = {}) =>
        (plan_ids || []).map((id) => ({ type: "AdvertisingPlans", id })),
    }),

    // ⚠️ لا يوجد endpoint "تحويل إلى حجز" في الباك-إند عمداً: إنشاء Booking
    // صالح يتطلب حقولاً (type "مؤقت/دائم"، booking_faces لكل لوحة...) بلا
    // قيمة افتراضية آمنة - "نوع الحجز" قرار عمل حقيقي لا تملكه الخطة
    // الإعلانية إطلاقًا. "تحويل إلى حجز" أصبح تنقّلاً بالفرونت إند فقط:
    // تعبئة مسبقة لشاشة إضافة حجز عادية عبر location.state - راجع
    // AdvertisingPlanDetails.jsx وBookingContext.jsx. جولة تعديلات جديدة
    // (طلب صريح): إن استُخدِم التسعير التلقائي الجديد على الخطة، تُنقَل
    // أيضًا قيم product_type/printing_id/discount_type/discount_value ضمن
    // نفس التعبئة (لم تعد تُترَك فارغة كسابقًا).
  }),
});

export const {
  useGetAdvertisingPlansQuery,
  useGetAdvertisingPlanByIdQuery,
  useAddAdvertisingPlanMutation,
  useUpdateAdvertisingPlanMutation,
  useDeleteAdvertisingPlanMutation,
  useAddRoadSignsToPlanMutation,
  useRemoveRoadSignFromPlanMutation,
  useUpdateRoadSignPriceInPlanMutation,
  useArchiveAdvertisingPlanMutation,
  useRestoreAdvertisingPlanMutation,
  useShareAdvertisingPlansMutation,
} = AdvertisingPlansSlice;
