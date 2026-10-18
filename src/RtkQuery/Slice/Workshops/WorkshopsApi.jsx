import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "../../../Api/baseUrl";

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
 * كل نقاط نظام الورشات (workshops/workshop-orders) الموثَّقة في
 * DEVELOPER_GUIDE.md، الجزء الثالث. هذه واجهة "مسؤول الورشة" الإدارية
 * (React) - CRUD الورشات، إسناد الأوامر، بث الإنجاز الحي بالصور، وتقرير
 * المكافآت الأسبوعي. مسارات "عامل الورشة نفسه" (استلام/تنفيذ بصورة) ليست
 * هنا عمدًا - تلك لتطبيق الموبايل، لا لوحة الإدارة.
 */
export const workshopsApi = createApi({
  reducerPath: "workshopsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      const token = getToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      headers.set("Accept", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Workshop", "WorkshopActivity", "WorkshopReport", "MyWorkshopOrders", "ReassignmentQueue", "MaintenanceHolds"],
  endpoints: (builder) => ({
    getWorkshops: builder.query({
      query: (params = {}) => ({ url: "/workshops", params }),
      transformResponse: (response) => response?.data ?? [],
      providesTags: ["Workshop"],
    }),
    addWorkshop: builder.mutation({
      query: (body) => ({ url: "/workshops", method: "POST", body }),
      invalidatesTags: ["Workshop"],
    }),
    updateWorkshop: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/workshops/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Workshop"],
    }),
    deleteWorkshop: builder.mutation({
      query: (id) => ({ url: `/workshops/${id}`, method: "DELETE" }),
      invalidatesTags: ["Workshop"],
    }),

    // إسناد دفعة أوامر لورشة - نداء الإدارة الصباحي.
    assignOrdersToWorkshop: builder.mutation({
      query: ({ workshop_id, order_ids }) => ({
        url: "/workshops/assign-orders",
        method: "POST",
        body: { workshop_id, order_ids },
      }),
      invalidatesTags: ["Workshop", "WorkshopReport"],
    }),

    // بث الأوامر المُنفَّذة حديثًا مع الصور - فلاتر: workshop_id,
    // executed_by, type, from_date, to_date, per_page.
    //
    // ⚠️ FIXED (وُجد عند التحقق من التطابق مع الباك-إند): كانت تقرأ رقم
    // الصفحات/الإجمالي من response.meta الخارجية - وتلك كانت أصفارًا
    // دائمًا لأن الكنترولر كان يستخدم successResponse() لا
    // paginateSuccessResponse() (أُصلح الآن في WorkshopController::activityFeed()).
    // الأرقام الحقيقية موجودة داخل response.data نفسها (شكل paginator
    // القياسي من لارافيل: {data: [...], total, per_page, current_page,
    // last_page}) - نفس ما تتعامل معه parsePaginatedResponse في
    // AccountingApi.js لبقية نقاط النهاية المُرقَّمة.
    getWorkshopActivityFeed: builder.query({
      query: (params = {}) => ({ url: "/workshops-activity-feed", params }),
      transformResponse: (response) => {
        const paginator = response?.data ?? {};
        const items = Array.isArray(paginator?.data) ? paginator.data : [];
        return {
          data: items,
          meta: {
            total: paginator.total ?? items.length,
            per_page: paginator.per_page ?? 20,
            current_page: paginator.current_page ?? 1,
            total_pages: paginator.last_page ?? 1,
          },
        };
      },
      providesTags: ["WorkshopActivity"],
    }),

    // الأوامر المُسنَدة لورشة بعينها (طلب العميل: أيقونة عين في جدول
    // الورشات) - فلاتر: status (pending|executed), per_page.
    getWorkshopOrders: builder.query({
      query: ({ id, ...params } = {}) => ({ url: `/workshops/${id}/orders`, params }),
      transformResponse: (response) => {
        const paginator = response?.data ?? {};
        const items = Array.isArray(paginator?.data) ? paginator.data : [];
        return {
          data: items,
          meta: {
            total: paginator.total ?? items.length,
            per_page: paginator.per_page ?? 20,
            current_page: paginator.current_page ?? 1,
            total_pages: paginator.last_page ?? 1,
          },
        };
      },
      providesTags: ["Workshop"],
    }),

    // إعادة إسناد الأوامر المتأخرة (طلب صريح): أوامر لم تُنجَز حتى الساعة
    // 7 مساءً بتوقيت دمشق (علَّمها أمر الجدولة orders:flag-for-reassignment
    // في الباك-إند بحقل needs_reassignment_at). المسؤول يقرر هنا: نفس
    // الورشة أو ورشة جديدة - راجع OrderService::reassignOrders.
    getOrdersNeedingReassignment: builder.query({
      query: () => "/workshops-needs-reassignment",
      transformResponse: (response) => response?.data ?? [],
      providesTags: ["ReassignmentQueue"],
    }),
    reassignOrdersToWorkshop: builder.mutation({
      query: ({ workshop_id, order_ids }) => ({
        url: "/workshops-reassign-orders",
        method: "POST",
        body: { workshop_id, order_ids },
      }),
      invalidatesTags: ["ReassignmentQueue", "Workshop", "WorkshopReport"],
    }),

    getWorkshopWeeklyReport: builder.query({
      query: ({ id, week_start } = {}) => ({
        url: `/workshops/${id}/weekly-report`,
        params: week_start ? { week_start } : {},
      }),
      transformResponse: (response) => response?.data ?? response,
      providesTags: ["WorkshopReport"],
    }),
    getAllWorkshopsWeeklyReport: builder.query({
      query: (week_start) => ({
        url: "/workshops-weekly-report",
        params: week_start ? { week_start } : {},
      }),
      transformResponse: (response) => response?.data ?? response,
      providesTags: ["WorkshopReport"],
    }),

    // ===================== مسارات مدير الورشة =====================
    // راجع DEVELOPER_GUIDE.md، الجزء الثاني عشر. عمدًا منفصلة عن
    // assignOrdersToWorkshop (ذاك يُسنِد لورشة كاملة كفريق، هذا يُسنِد
    // لعامل بعينه ضمن ورشة المدير نفسه).
    getMyWorkshopTeamMembers: builder.query({
      query: () => "/workshops-my-team",
      transformResponse: (response) => response?.data ?? [],
      providesTags: ["Workshop"],
    }),
    assignOrdersToWorker: builder.mutation({
      query: ({ worker_id, order_ids }) => ({
        url: "/workshops-assign-to-worker",
        method: "POST",
        body: { worker_id, order_ids },
      }),
      invalidatesTags: ["WorkshopActivity", "MyWorkshopOrders"],
    }),

    // ===================== مسارات عامل الورشة نفسه =====================
    // راجع DEVELOPER_GUIDE.md، الجزء الثامن، لسياق فصل الصلاحيات:
    // view-workshop-orders / execute-workshop-orders (لا view-orders).
    // شكل الاستجابة أصبح كائنًا { orders, active_regions } لا مصفوفة مباشرة
    // (الباك-إند الآن): طلب صريح "قفل المنطقة" - active_regions تحمل
    // منطقة/مناطق الفاعل الحالي التي لديه فيها أوامر مُستلَمة ولم تُنفَّذ
    // بعد؛ كل أمر في orders يحمل أيضًا region_locked (true لأي أمر من
    // منطقة غير هذه) كي تُعطِّل الواجهة أزراره فورًا دون انتظار خطأ 422
    // من receive/complete. راجع useMyWorkshopOrders و MyOrdersTab.
    getMyWorkshopOrders: builder.query({
      query: (params = {}) => ({ url: "/workshop-orders/my-orders", params }),
      transformResponse: (response) => ({
        orders: response?.data?.orders ?? [],
        activeRegions: response?.data?.active_regions ?? [],
        // كم أمرًا مستحقًا بقي في المنطقة النشطة قبل السماح بالانتقال
        // (لا يُحتسب منها ما هو بحالة صيانة سارية).
        activeRegionRemaining: response?.data?.active_region_remaining ?? 0,
      }),
      providesTags: ["MyWorkshopOrders"],
    }),
    getMyWorkshopSizeBreakdown: builder.query({
      query: () => "/workshop-orders/size-breakdown",
      transformResponse: (response) => response?.data ?? { total: 0, by_size: {} },
      providesTags: ["MyWorkshopOrders"],
    }),
    getMyWorkshopDailySummary: builder.query({
      query: (date) => ({ url: "/workshop-orders/daily-summary", params: date ? { date } : {} }),
      transformResponse: (response) => response?.data ?? response,
      providesTags: ["MyWorkshopOrders"],
    }),
    getMyWorkshopAchievements: builder.query({
      query: (params = {}) => ({ url: "/workshop-orders/my-achievements", params }),
      transformResponse: (response) => response?.data ?? response,
    }),
    receiveWorkshopOrder: builder.mutation({
      query: ({ orderId, ...body }) => ({
        url: `/workshop-orders/${orderId}/receive`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["MyWorkshopOrders"],
    }),
    // multipart/form-data - photo إجبارية على الباك-إند
    // (CompleteOrderRequest). body هنا FormData حرفيًا، لا JSON - fetchBaseQuery
    // يكتشف ذلك تلقائيًا ويتجاوز أي Content-Type مضبوط يدويًا.
    completeWorkshopOrder: builder.mutation({
      query: ({ orderId, formData }) => ({
        url: `/workshop-orders/${orderId}/complete`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["MyWorkshopOrders", "WorkshopActivity", "WorkshopReport"],
    }),

    // ===================== حالة الصيانة - مدير الورشة (ورشته فقط) =====================
    // لوحة بحالة صيانة: يُمدَّد أمرها وحده (عدد أيام يحدده المسؤول)، فتخرج
    // من شرط "إنجاز المنطقة" ويُمنع إرسال ملف الـ PDF للزبون حتى تُحسَم.
    getMaintenanceHolds: builder.query({
      query: (params = {}) => ({ url: "/workshops-maintenance-holds", params }),
      transformResponse: (response) => response?.data ?? [],
      providesTags: ["MaintenanceHolds"],
    }),
    // أوامر فك/تركيب غير منفَّذة في ورشة المدير - لاختيار لوحة للصيانة.
    getMaintenanceCandidates: builder.query({
      query: (params = {}) => ({ url: "/workshops-maintenance-candidates", params }),
      transformResponse: (response) => response?.data ?? [],
      providesTags: ["MaintenanceHolds"],
    }),
    markMaintenanceHold: builder.mutation({
      query: ({ orderId, days, reason }) => ({
        url: `/workshop-orders/${orderId}/maintenance-hold`,
        method: "POST",
        body: { days, ...(reason ? { reason } : {}) },
      }),
      invalidatesTags: ["MaintenanceHolds", "Workshop", "MyWorkshopOrders", "ReassignmentQueue"],
    }),
    clearMaintenanceHold: builder.mutation({
      query: (orderId) => ({
        url: `/workshop-orders/${orderId}/maintenance-hold`,
        method: "DELETE",
      }),
      invalidatesTags: ["MaintenanceHolds", "Workshop", "MyWorkshopOrders"],
    }),
    // مدير الورشة ينفّذ الأمر بنفسه مع صور الإثبات (إنهاء الصيانة مبكرًا) -
    // body: FormData (after_photo إجبارية، before_photo اختيارية).
    managerCompleteOrder: builder.mutation({
      query: ({ orderId, formData }) => ({
        url: `/workshop-orders/${orderId}/manager-complete`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["MaintenanceHolds", "Workshop", "MyWorkshopOrders", "WorkshopActivity", "WorkshopReport"],
    }),
    // إرسال ملف الـ PDF (المرفوع للحجز) للزبون يدويًا رغم وجود لوحات بصيانة.
    managerSendBookingPdf: builder.mutation({
      query: (bookingId) => ({
        url: `/workshops-maintenance/bookings/${bookingId}/send-pdf`,
        method: "POST",
      }),
    }),
  }),
});

export const {
  useGetWorkshopsQuery,
  useAddWorkshopMutation,
  useUpdateWorkshopMutation,
  useDeleteWorkshopMutation,
  useAssignOrdersToWorkshopMutation,
  useGetOrdersNeedingReassignmentQuery,
  useReassignOrdersToWorkshopMutation,
  useGetWorkshopOrdersQuery,
  useGetWorkshopActivityFeedQuery,
  useGetWorkshopWeeklyReportQuery,
  useLazyGetWorkshopWeeklyReportQuery,
  useGetAllWorkshopsWeeklyReportQuery,
  useLazyGetAllWorkshopsWeeklyReportQuery,
  useGetMyWorkshopTeamMembersQuery,
  useAssignOrdersToWorkerMutation,
  useGetMyWorkshopOrdersQuery,
  useGetMyWorkshopSizeBreakdownQuery,
  useGetMyWorkshopDailySummaryQuery,
  useGetMyWorkshopAchievementsQuery,
  useReceiveWorkshopOrderMutation,
  useCompleteWorkshopOrderMutation,
  useGetMaintenanceHoldsQuery,
  useGetMaintenanceCandidatesQuery,
  useMarkMaintenanceHoldMutation,
  useClearMaintenanceHoldMutation,
  useManagerCompleteOrderMutation,
  useManagerSendBookingPdfMutation,
} = workshopsApi;
  