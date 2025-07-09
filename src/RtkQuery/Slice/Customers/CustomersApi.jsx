import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../Global.jsx";
import { BASE_URL } from "../../../Api/baseUrl.jsx";

export const CustomersSlice = createApi({
  reducerPath: "customers",
  baseQuery:baseQueryWithReauth,
  tagTypes: ["customers"],
  endpoints: (builder) => ({
    getCustomers: builder.query({
      query: () => "customers",
      providesTags: ["customers"],
    }),
    addNewCustomer: builder.mutation({
      query: (data) => ({
        url: "customers",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["customers"],
    }),
    addDiscount: builder.mutation({
      query: (data) => ({
        url: "discounts",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["customers"],
    }),
    showOneCustomer: builder.query({
      query: (id) => `customers/${id}`,
      providesTags: ["customers"],
    }),
    deleteCustomer: builder.mutation({
      query: (id) => ({
        url: `customers/${id}`,
        method: "POST",
        body: { _method: "DELETE" },
      }),
      invalidatesTags: ["customers"],
    }),
    updateCustomer: builder.mutation({
      query: (data) => ({
        url: `customers/${data.id}`,
        method: "POST",
        body: { ...data, _method: "PUT" },
      }),
      invalidatesTags: ["customers"],
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useAddNewCustomerMutation,
  useShowOneCustomerQuery,
  useDeleteCustomerMutation,
  useUpdateCustomerMutation,
  useAddDiscountMutation,
} = CustomersSlice;
