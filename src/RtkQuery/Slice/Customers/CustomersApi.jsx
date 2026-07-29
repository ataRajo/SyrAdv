import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../Global.jsx";
import { BASE_URL } from "../../../Api/baseUrl.jsx";

export const CustomersSlice = createApi({
  reducerPath: "customers",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["customers"],
  endpoints: (builder) => ({
     getCustomers: builder.query({
      query: (params) => {
        if (!params) return "/customers";

       const queryString = new URLSearchParams(
  Object.entries({ page: params.page, per_page: params.per_page, ...params }).filter(([_, v]) => v !== undefined && v !== "" && v !== null)
).toString();

        return `/customers${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: "Customers", id })),
              { type: "Customers", id: "LIST" },
            ]
          : [{ type: "Customers", id: "LIST" }],
    }),

    
    addNewCustomer: builder.mutation({
      query: (data) => ({
        url: "customers",
        method: "POST",
        headers :{ 
      'Accept': 'application/json',

        } ,
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

    getCustomersByWorkType: builder.query({
  query: (workTypeId) => `customers?work_type_id=${workTypeId}`,
  providesTags: (result) =>
    result?.data
      ? [
          ...result.data.map(({ id }) => ({ type: "Customers", id })),
          { type: "Customers", id: "LIST" },
        ]
      : [{ type: "Customers", id: "LIST" }],
}),


    // 🆕  endpoint for updating status
   updateCustomerStatus: builder.mutation({
  query: ({ id, status }) => ({
    url: `customers/${id}/update-status`,
    method: "POST",
    body: { status }, 
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
  useGetCustomersByWorkTypeQuery, // ← add this
  useUpdateCustomerStatusMutation, // <-- 🆕 Export hook here
} = CustomersSlice;
