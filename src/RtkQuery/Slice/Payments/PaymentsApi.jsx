import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../Global";
import { BASE_URL } from "../../../Api/baseUrl";

export const PaymentsSlice = createApi({
  reducerPath: "payments",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["payments"],
  endpoints: (builder) => ({
    getPayments: builder.query({
      query: ({ is_received } = {}) => {
        const params = new URLSearchParams();
        if (typeof is_received === "boolean") params.append("is_received", is_received);

        const queryString = params.toString();
        return `/payments${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: ["payments"],
    }),
   getTotalPaymentAndRemaining: builder.query({
  query: ({ from_date, to_date } = {}) => {
    const params = new URLSearchParams();
    if (from_date) params.append("from_date", from_date);
    if (to_date) params.append("to_date", to_date); 

    const queryString = params.toString();
    return `/get-total-payment-and-remaining${
      queryString ? `?${queryString}` : ""
    }`;
  },
  providesTags: ["payments"],
}),
    addNewPayment: builder.mutation({
      query: (data) => {
        return {
          url: "payments",
          method: "POST",
          body: data,
        };
      },
      invalidatesTags: ["payments"],
    }),

    confirmOnePayment: builder.mutation({
      query: (id) => ({
        url: `/payment-is-Received/${id}`,
        method: "GET",
      }),
      invalidatesTags: ["payments"],
    }),
     deletePayment: builder.mutation({
      query: (id) => {
        return({
        url: `payments/${id}`,
        method: "POST",
        body:{"_method": "DELETE"}
      })},
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
} = PaymentsSlice;
