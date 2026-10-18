  import { createApi } from "@reduxjs/toolkit/query/react";
  import { baseQueryWithReauth } from "../Global";
  import { BASE_URL } from "../../../Api/baseUrl";

  export const PaymentsSlice = createApi({
    reducerPath: "payments",
    baseQuery: baseQueryWithReauth,
    tagTypes: ["payments"], // 👈 keep consistent lowercase
    endpoints: (builder) => ({
      getPayments: builder.query({
  query: ({ is_received, page, per_page, customer_id, status, is_documented } = {}) => {
    const params = new URLSearchParams();
    // فلترة من الخادم (كانت الفلترة بالزبون/الحالة تتم على الصفحة المحمَّلة فقط).
    if (customer_id) params.append("customer_id", customer_id);
    if (status !== undefined && status !== null && status !== "") params.append("status", status);
    if (is_documented !== undefined && is_documented !== null && is_documented !== "") {
      params.append("is_documented", is_documented ? 1 : 0);
    }
    if (typeof is_received === "boolean") {
      params.append("is_received", is_received);
    }
    if (page) {
      params.append("page", page);
    }
    if (per_page) {
      params.append("per_page", per_page);
    }
    const queryString = params.toString();
    return `/payments${queryString ? `?${queryString}` : ""}`;
  },
  providesTags: ["payments"],
}),

     getTotalPaymentAndRemaining: builder.query({
  query: ({ from_date, to_date, user_id, customer_id } = {}) => {
    const params = new URLSearchParams();
    if (from_date) params.append("from_date", from_date);
    if (to_date) params.append("to_date", to_date);
    if (user_id) params.append("user_id", user_id);
    if (customer_id) params.append("customer_id", customer_id);

    const queryString = params.toString();
    return `/get-total-payment-and-remaining${
      queryString ? `?${queryString}` : ""
    }`;
  },
  providesTags: ["payments"],
}),

      // فلترة يومية للصندوق (طلب صريح) - يجلب الدفعات والحجوزات المُنشأة في
      // يوم واحد محدَّد معًا، بقيم متكاملة (راجع تعليق
      // PaymentService::getDailyBoxReport() على الباك-إند لشرح الفرق عن
      // getTotalPaymentAndRemaining أعلاه).
      getBoxDailyReport: builder.query({
        query: ({ date, user_id, customer_id } = {}) => {
          const params = new URLSearchParams();
          if (date) params.append("date", date);
          if (user_id) params.append("user_id", user_id);
          if (customer_id) params.append("customer_id", customer_id);

          const queryString = params.toString();
          return `/get-box-daily-report${queryString ? `?${queryString}` : ""}`;
        },
        providesTags: ["payments"],
      }),

      addNewPayment: builder.mutation({
        query: (data) => ({
          url: "payments",
          method: "POST",
          body: data,
        }),
        invalidatesTags: ["payments"],
      }),

      updatePaymentStatus: builder.mutation({
        query: ({ id, status }) => ({
          url: `/payment/${id}/update-status`,
          method: "POST",
          body: { status },
        }),
        invalidatesTags: ["payments"], // 👈 fixed casing
      }),

      confirmOnePayment: builder.mutation({
        query: (id) => ({
          url: `/payment-is-Received/${id}`,
          method: "GET",
        }),
        invalidatesTags: ["payments"],
      }),

      // توثيق الدفعة برفع صورة سند القبض الموقَّع - لا تؤثر الدفعة على رصيد
      // الزبون ولا على شجرة الحسابات إلا بعده (PaymentService::document).
      documentPayment: builder.mutation({
        query: ({ id, body }) => ({
          url: `payments/${id}/document`,
          method: "POST",
          body, // FormData يحمل "image"
        }),
        invalidatesTags: ["payments"],
      }),

      deletePayment: builder.mutation({
        query: (id) => ({
          url: `payments/${id}`,
          method: "POST",
          body: { _method: "DELETE" },
        }),
        invalidatesTags: ["payments"],
      }),
    }),
  });

  export const {
    useGetPaymentsQuery,
    useAddNewPaymentMutation,
    useConfirmOnePaymentMutation,
    useGetTotalPaymentAndRemainingQuery,
    useGetBoxDailyReportQuery,
    useLazyGetBoxDailyReportQuery,
    useDeletePaymentMutation,
    useDocumentPaymentMutation,
    useUpdatePaymentStatusMutation, // 👈 now properly exported
  } = PaymentsSlice;
