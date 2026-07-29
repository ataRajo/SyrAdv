import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../Global.jsx";
import { BASE_URL } from "../../../Api/baseUrl.jsx";

export const OrdersSlice = createApi({
  reducerPath: "orders",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["orders"],
  endpoints: (builder) => ({
    getOrders: builder.query({
      query: (params) => {
        const queryParams = new URLSearchParams();
        
        // ✅ Only append status ONCE
        queryParams.append("status", params?.status ?? false);

        if (params?.type) {
          params.type.forEach((type, index) => {
            queryParams.append(`type[${index}]`, type);
          });
        }
        if (params?.city_id) {
          queryParams.append("city_id", params.city_id);
        }
        if (params?.region_id) {
          queryParams.append("region_id", params.region_id);
        }
        if (params?.action_date) {
          queryParams.append("action_date", params.action_date);
        }
        // ❌ REMOVED: duplicate status append
        // if (params?.status) {
        //   queryParams.append("status", params.status);
        // }
        
        return `/orders?${queryParams.toString()}`;
      },
      providesTags: ["orders"],
    }),
    
   
  // OrdersApi.jsx
confirmOneOrder: builder.mutation({
  query: (data) => {
    return {
      url: `update-status-order`,
      method: "POST",
      body: {
        ids: Array.isArray(data.id) ? data.id : [data.id], // Support single or array
        status: data.status,
      },
    };
  },
  invalidatesTags: ["orders"],
}),
    
    updateOrder: builder.mutation({
      query: (data) => {
        return {
          url: `orders/${data.id}`,
          method: "POST",
          body: { ...data.data, _method: "PUT" },
        };
      },
      invalidatesTags: ["orders"],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useUpdateOrderMutation,
  useConfirmOneOrderMutation,
} = OrdersSlice;