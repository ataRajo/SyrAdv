  import { createApi } from "@reduxjs/toolkit/query/react";
  import { baseQueryWithReauth } from "../Global";
  import { BASE_URL } from "../../../Api/baseUrl";

  export const PaymentsSlice = createApi({
    reducerPath: "payments",
    baseQuery: baseQueryWithReauth,
    tagTypes: ["payments"], // 👈 keep consistent lowercase
    endpoints: (builder) => ({
      getPayments: builder.query({
  query: ({ is_received, page, per_page } = {}) => {
    const params = new URLSearchParams();
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
    useDeletePaymentMutation,
    useUpdatePaymentStatusMutation, // 👈 now properly exported
  } = PaymentsSlice;
