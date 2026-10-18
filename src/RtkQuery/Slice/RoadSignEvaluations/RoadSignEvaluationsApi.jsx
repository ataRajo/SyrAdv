import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../Global";

// تقييم اللوحات بالذكاء الاصطناعي (نسبة المشاهدة + الجمهور المتوقع) - لوحة
// تحكم السوبر أدمن: توليد التقييم، تعديله، إخفاؤه/إظهاره. راجع
// App\Http\Controllers\Api\V1\RoadSignEvaluationController على الباك-إند.
export const RoadSignEvaluationsSlice = createApi({
  reducerPath: "roadSignEvaluations",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["RoadSignEvaluations", "RoadSignEvaluationStats"],
  endpoints: (builder) => ({
    // params: { search, status, page, per_page }
    getRoadSignEvaluations: builder.query({
      query: (params = {}) => ({ url: "/road-sign-evaluations", params }),
      providesTags: [{ type: "RoadSignEvaluations", id: "LIST" }],
    }),

    getRoadSignEvaluationStats: builder.query({
      query: () => "/road-sign-evaluations/stats",
      providesTags: [{ type: "RoadSignEvaluationStats", id: "STATS" }],
    }),

    // تعديل يدوي أو إظهار/إخفاء (is_visible وحدها لا تغيّر المصدر إلى manual)
    updateRoadSignEvaluation: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/road-sign-evaluations/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: [
        { type: "RoadSignEvaluations", id: "LIST" },
        { type: "RoadSignEvaluationStats", id: "STATS" },
      ],
    }),

    // توليد اقتراح لوحة واحدة فورًا (يكتب فوق التعديل اليدوي)
    evaluateRoadSign: builder.mutation({
      query: (id) => ({
        url: `/road-sign-evaluations/${id}/evaluate`,
        method: "POST",
      }),
      invalidatesTags: [
        { type: "RoadSignEvaluations", id: "LIST" },
        { type: "RoadSignEvaluationStats", id: "STATS" },
      ],
    }),

    // تقييم كل اللوحات المعلّقة عبر الطابور - النتائج تصل تباعًا
    evaluateAllRoadSigns: builder.mutation({
      query: (body = {}) => ({
        url: "/road-sign-evaluations/evaluate-all",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "RoadSignEvaluationStats", id: "STATS" }],
    }),

    approveAllRoadSignEvaluations: builder.mutation({
      query: () => ({
        url: "/road-sign-evaluations/approve-all",
        method: "POST",
      }),
      invalidatesTags: [
        { type: "RoadSignEvaluations", id: "LIST" },
        { type: "RoadSignEvaluationStats", id: "STATS" },
      ],
    }),

    // استيراد تقييمات من ملف JSON (يقرؤه المتصفح ويرسل المصفوفة).
    // body: { evaluations: [...], overwrite_manual?: boolean, is_visible?: boolean }
    // الرد: { status, data: { imported, skipped_manual, skipped_empty, missing_count, missing_ids }, message }
    importRoadSignEvaluations: builder.mutation({
      query: (body) => ({
        url: "/road-sign-evaluations/import",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "RoadSignEvaluations", id: "LIST" },
        { type: "RoadSignEvaluationStats", id: "STATS" },
      ],
    }),

    // تصفير كل التقييمات (حذف الصفوف) للبدء من الصفر.
    // body: { keep_manual?: boolean } - true يُبقي التعديلات اليدوية.
    // الرد: { status, data: { deleted }, message }
    resetRoadSignEvaluations: builder.mutation({
      query: (body = {}) => ({
        url: "/road-sign-evaluations/reset",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "RoadSignEvaluations", id: "LIST" },
        { type: "RoadSignEvaluationStats", id: "STATS" },
      ],
    }),
  }),
});

export const {
  useGetRoadSignEvaluationsQuery,
  useGetRoadSignEvaluationStatsQuery,
  useUpdateRoadSignEvaluationMutation,
  useEvaluateRoadSignMutation,
  useEvaluateAllRoadSignsMutation,
  useApproveAllRoadSignEvaluationsMutation,
  useResetRoadSignEvaluationsMutation,
  useImportRoadSignEvaluationsMutation,
} = RoadSignEvaluationsSlice;