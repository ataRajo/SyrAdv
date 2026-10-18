import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../Global";

export const BookingSlice = createApi({
  reducerPath: "booking",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["bookings", "notifications", "contract-documents"],
  endpoints: (builder) => ({
    
    getBooking: builder.query({
  // customer_id/is_archived أُضيفا (بجانب page/per_page الأصليين) لدعم
  // اختيار "العقد المرتبط" عند تسجيل سند قبض - راجع TransactionsTab
  // (IncomingForm) وBookingService::getAll() على الباك-إند الذي يدعم هذه
  // الفلاتر أصلًا. أي مستدعٍ قديم يمرر {page, per_page} فقط يستمر يعمل
  // بلا تغيير.
  query: ({ page, per_page, customer_id, is_archived } = {}) => {
    const params = new URLSearchParams();
    if (page) params.append("page", page);
    if (per_page) params.append("per_page", per_page);
    if (customer_id !== undefined && customer_id !== null && customer_id !== "") {
      params.append("customer_id", customer_id);
    }
    if (is_archived !== undefined && is_archived !== null) {
      params.append("is_archived", is_archived ? 1 : 0);
    }
    const queryString = params.toString();
    return `/bookings${queryString ? `?${queryString}` : ""}`;
  },
  providesTags: (result) =>
    result?.data
      ? [
          ...result.data.map(({ id }) => ({ type: "bookings", id })),
          { type: "bookings", id: "LIST" },
        ]
      : [{ type: "bookings", id: "LIST" }],
}),

    // ✅ Add booking (no forced status)
    addNewBooking: builder.mutation({
      query: (data) => {
        const { status, ...rest } = data; // strip status if present
        return {
          url: "bookings",
          method: "POST",
          body: rest,
        };
      },
      invalidatesTags: [{ type: "bookings", id: "LIST" }],
    }),

    // ⚠️ FIXED (backend/frontend mismatch found during this review):
    // `GET bookings/{id}` used to be reachable directly with just the
    // Bearer token. The backend now protects the public "show" route with
    // a signed-URL requirement (real PII leak it used to have - anyone
    // could enumerate booking ids with no auth at all), and that public
    // route's URI was also renamed to `public/bookings/{id}` to stop
    // colliding with the authenticated route of the same name (see
    // DEVELOPER_GUIDE.md, "route collision" section, for the full story).
    // A plain `fetch('bookings/${id}')` with only a Bearer token now gets
    // rejected - so this endpoint first asks the backend for a short-lived
    // signed link, then fetches that exact link. BookingController::show()
    // still returns the bare booking object either way (no `{data: ...}`
    // wrapper), so every existing consumer of `bookingData.xxx` in this
    // codebase keeps working unchanged.
    getOneBookings: builder.query({
      async queryFn(id, _queryApi, _extraOptions, baseQuery) {
        const linkResult = await baseQuery(`bookings/${id}/public-show-link`);
        if (linkResult.error) return { error: linkResult.error };

        const signedUrl = linkResult.data?.data?.url;
        if (!signedUrl) {
          return {
            error: {
              status: 500,
              data: { message: "تعذر الحصول على رابط آمن لعرض الحجز" },
            },
          };
        }

        const result = await baseQuery(signedUrl);
        return result.error ? { error: result.error } : { data: result.data };
      },
      providesTags: (result, error, id) => [{ type: "bookings", id }],
    }),

    // ✅ Update booking 
    updateBookings: builder.mutation({
      query: (data) => ({
        url: `bookings/${data.id}`,
        method: "POST",
        body: { ...data, _method: "PUT" },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "bookings", id }],
    }),

    // ✅ Delete booking
    deleteBooking: builder.mutation({
      query: (id) => ({
        url: `bookings/${id}`,
        method: "POST",
        body: { _method: "DELETE" },
      }),
      invalidatesTags: [{ type: "bookings", id: "LIST" }],
    }),

    // ✅ Cancel booking
    cancelBooking: builder.mutation({
      query: (id) => ({
        url: `cancel-booking/${id}`,
        method: "POST",
        body: {},
      }),
      invalidatesTags: (result, error, { id }) => [
    { type: "bookings", id },
    { type: "bookings", id: "LIST" }, 
  ],
}),


 //==================== ADD MOVE BOOKING API ==============

  // BookingApi.js
moveBooking: builder.mutation({
  query: ({ booking_id, old_roadsign_id, new_roadsign_id, isTempMoving = false, end_date }) => {
    const body = {
      booking_id,
      old_roadsign_id,
      new_roadsign_id,
      isTempMoving,
    };

    // Only include end_date if isTempMoving is true
    if (isTempMoving === true) {
      body.end_date = end_date;
    }

    return {
      url: "/customer/move-booking",
      method: "POST",
      body,
    };
  },
  invalidatesTags: (result, error, { booking_id }) => [
    { type: "bookings", id: "LIST" },
    { type: "bookings", id: booking_id },
  ],
}),

    // ==================== SWAP ROAD SIGNS BETWEEN TWO BOOKINGS ====================
    // تبديل لوحة بين عقدين حتى لو كانت اللوحة الهدف محجوزة ضمن عقد آخر.
    // أول نداء بلا confirm_swap: إن كانت اللوحة الهدف محجوزة يعود خطأ
    // 409 يحمل تفاصيل العقد المتعارض (conflicting_booking) لتعرضها
    // الواجهة كتنبيه؛ الفرونت-إند يعيد النداء بـ confirm_swap:true بعد
    // موافقة المستخدم لإتمام التبديل الفعلي.
    swapRoadSigns: builder.mutation({
      query: ({ booking_id, old_roadsign_id, new_roadsign_id, confirm_swap = false }) => ({
        url: "/bookings/swap-road-signs",
        method: "POST",
        body: { booking_id, old_roadsign_id, new_roadsign_id, confirm_swap },
      }),
      invalidatesTags: (result, error, { booking_id }) => [
        { type: "bookings", id: "LIST" },
        { type: "bookings", id: booking_id },
      ],
    }),

    // ✅ Update status (with reject reason if needed)
    
    updateBookingStatus: builder.mutation({
      query: ({ id, status, reject_reason }) => ({
        url: `bookings/${id}/update-approvment-status`,
        method: "POST",
        body: { status, reject_reason },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "bookings", id }],
    }),

 extendBooking: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `bookings/${id}/extendBooking`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['bookings'],
    }),

      
 calculateReservation: builder.mutation({
  query: ({ is_extend = false, ...restData }) => ({
    url: "get-calculate-Amount",
    method: "POST",
    body: {
      ...restData,
      is_extend,
    },
  }),
  invalidatesTags: ["reservations"],
}),


uploadBookingPdf: builder.mutation({
  query: ({ id, body }) => ({
    url: `bookings/${id}/uploadPdf`,
    method: 'POST',
    body: body, // Pass the FormData object directly here
  }),
  invalidatesTags: (result, error, { id }) => [{ type: "bookings", id }],
}),

// "حفظ وإرسال عبر واتساب" - إرسال تلقائي لملف PDF مواقع اللوحات (المرفوع
// عبر uploadBookingPdf أعلاه لنفس الحجز) لرقم العميل عبر WAHA، بدل تنزيله
// وإرفاقه يدويًا في واتساب. راجع BookingService::sendPdfWhatsapp() على
// الباك-إند.
// يقبل bookingId مباشرة (السلوك القديم) أو { bookingId, force } - force:
// إرسال يدوي رغم وجود لوحات بحالة صيانة (مسؤول الورشات فقط، يتحقق منه
// الباك-إند). عند الرفض بسبب الصيانة يعود reason='maintenance_pending'
// مع قائمة اللوحات و can_force.
sendBookingPdfWhatsapp: builder.mutation({
  query: (arg) => {
    const bookingId = typeof arg === "object" && arg !== null ? arg.bookingId : arg;
    const force = typeof arg === "object" && arg !== null ? !!arg.force : false;
    return {
      url: `bookings/${bookingId}/send-pdf-whatsapp`,
      method: 'POST',
      ...(force ? { body: { force: true } } : {}),
    };
  },
  transformResponse: (response) => ({
    success: true,
    message: response?.message || "تم إرسال الملف للعميل عبر واتساب بنجاح",
  }),
  transformErrorResponse: (error) => ({
    success: false,
    message: error.data?.message || "تعذّر إرسال الملف عبر واتساب",
    reason: error.data?.data?.reason,
    canForce: !!error.data?.data?.can_force,
    pending: error.data?.data?.pending ?? [],
  }),
}),

// لوحات الحجز بحالة صيانة لم تُحسَم - تنبيه في صفحة ملف الـ PDF.
getBookingMaintenanceHolds: builder.query({
  query: (bookingId) => `bookings/${bookingId}/maintenance-holds`,
  transformResponse: (response) => ({
    pending: response?.data?.pending ?? [],
    canForce: !!response?.data?.can_force,
  }),
}),

    // توثيق توقيع العقد (طلب العميل) - رفع صورة المستند الموقَّع. نفس نمط
    // uploadBookingPdf تمامًا: FormData يُمرَّر مباشرة كـ body (حقل الصورة
    // اسمه "image" - يطابق BookingController::signContract() الذي يتحقق
    // من حقل "image").
    signContract: builder.mutation({
      query: ({ id, body }) => ({
        url: `bookings/${id}/sign`,
        method: 'POST',
        body: body, // FormData يحمل حقل "image"
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "bookings", id },
        { type: "bookings", id: "LIST" },
      ],
    }),

    // "مستودع موحَّد لمستندات العقد" (طلب صريح) - راجع
    // BookingDocumentController::documents()/storeDocument()/destroyDocument().
    getContractDocuments: builder.query({
      query: (id) => `bookings/${id}/documents`,
      providesTags: (result, error, id) => [{ type: "contract-documents", id }],
    }),

    uploadContractDocument: builder.mutation({
      query: ({ id, body }) => ({
        url: `bookings/${id}/documents`,
        method: "POST",
        body: body, // FormData: file (+ document_type, label اختياريان)
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "contract-documents", id }],
    }),

    deleteContractDocument: builder.mutation({
      query: ({ id, mediaId }) => ({
        url: `bookings/${id}/documents/${mediaId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "contract-documents", id }],
    }),

    // تنبيهات الرصيد المتأخر (قبل منتصف مدة العقد) - كل عنصر يحمل نص
    // الرسالة ورابط wa.me احتياطي (راجع BookingOverdueBalanceAlertService
    // على الباك-إند). الإرسال الفعلي أصبح تلقائيًا عبر
    // sendOverdueBalanceWhatsapp أدناه.
    getOverdueBalanceAlerts: builder.query({
      query: () => `bookings/overdue-balance-alerts`,
      providesTags: [{ type: "bookings", id: "OVERDUE_BALANCE_ALERTS" }],
    }),

    // إرسال تلقائي وفوري لرسالة "رصيد متأخر" عبر واتساب (WAHA) لعقد واحد -
    // يستبدل رابط wa.me اليدوي الذي كان يُفتَح من NotificationsModal.
    sendOverdueBalanceWhatsapp: builder.mutation({
      query: (bookingId) => ({
        url: `bookings/${bookingId}/send-overdue-balance-whatsapp`,
        method: "POST",
      }),
      transformResponse: (response) => ({
        success: true,
        message: response?.message || "تم إرسال رسالة واتساب للعميل بنجاح",
      }),
      transformErrorResponse: (error) => ({
        success: false,
        message: error.data?.message || "تعذّر إرسال رسالة واتساب",
      }),
      invalidatesTags: [{ type: "bookings", id: "OVERDUE_BALANCE_ALERTS" }],
    }),

    changeAdvertisementDesign: builder.mutation({
      query: ({ id, roadsignIds }) => ({
        url: `bookings/${id}/changeAdvertisementDesign`,
        method: "POST",
        body: { roadsignIds },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "bookings", id },
        { type: "bookings", id: "LIST" },
      ],
    }),


    confirmBooking: builder.mutation({
  query: (id) => ({
    url: `bookings/${id}/confirm-booking`,
    method: "POST",
    body: {},
  }),
  invalidatesTags: (result, error, id) => [
    { type: "bookings", id },
    { type: "bookings", id: "LIST" },
  ],
}),

    getNotifications: builder.query({
      // type: فلترة اختيارية حسب نوع المحتوى ("general" | "order" |
      // "financial") - راجع NotificationType على الباك-إند. فلترة الأدوار
      // (من يرى إشعارات الطلبات) تُطبَّق دومًا من طرف السيرفر بصرف النظر
      // عن هذا الباراميتر.
      query: ({ page, per_page, type } = {}) => {
        const params = new URLSearchParams();
        if (page) params.append("page", page);
        if (per_page) params.append("per_page", per_page);
        if (type) params.append("type", type);
        const queryString = params.toString();
        return `/notifications${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: ["notifications"],
    }),

        // ✅ Add discount to booking
    addDiscount: builder.mutation({
      query: ({ id, discount_type, value }) => ({
        url: `bookings/${id}/add_discount`,
        method: "POST",
        body: { discount_type, value },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "bookings", id },
        { type: "bookings", id: "LIST" },
      ],
    }),

  }),
  

  
});


export const {
  useGetBookingQuery,
  useAddNewBookingMutation,
  useGetOneBookingsQuery,
  useUpdateBookingsMutation,
  useDeleteBookingMutation,
  useCancelBookingMutation,
  useCalculateReservationMutation,
  useUpdateBookingStatusMutation,
  useMoveBookingMutation ,
  useSwapRoadSignsMutation,
  useExtendBookingMutation,
  useConfirmBookingMutation,
  useUploadBookingPdfMutation,
  useSendBookingPdfWhatsappMutation,
  useGetBookingMaintenanceHoldsQuery,
  useChangeAdvertisementDesignMutation,
    useGetNotificationsQuery,
useAddDiscountMutation ,
useLazyGetOneBookingsQuery,
  useSignContractMutation,
  useGetOverdueBalanceAlertsQuery,
  useSendOverdueBalanceWhatsappMutation,
  useGetContractDocumentsQuery,
  useUploadContractDocumentMutation,
  useDeleteContractDocumentMutation,
  //useCalculateExtendedPriceMutation
} = BookingSlice;
