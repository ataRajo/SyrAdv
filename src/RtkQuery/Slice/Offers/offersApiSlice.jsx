import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "../../../Api/baseUrl";

const baseQueryWithAuth = fetchBaseQuery({
  baseUrl: `${BASE_URL}`,
  prepareHeaders: (headers, { getState }) => {
    const raw = localStorage.getItem("SuperAdminInfo");
    const info = raw ? JSON.parse(raw) : null;
    const token = info?.user?.token || info?.token || null;
    
    headers.set("Accept", "application/json");
    headers.set("Content-Type", "application/json");
    
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    
    return headers;
  },
});

export const offersApiSlice = createApi({
  reducerPath: "offers",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["offers", "customer-offers"],

  endpoints: (builder) => ({
    // GET all offers
    getOffers: builder.query({
      query: (params = {}) => {
        const cleanParams = {};
        if (params.page) cleanParams.page = params.page;
        if (params.per_page) cleanParams.per_page = params.per_page;
        if (params.search) cleanParams.search = params.search;
        if (params.active !== undefined && params.active !== "") cleanParams.active = params.active;
        if (params.expired !== undefined && params.expired !== "") cleanParams.expired = params.expired;
        if (params.work_type_id !== undefined && params.work_type_id !== "") cleanParams.work_type_id = params.work_type_id;

        return {
          url: "/offer",
          params: Object.keys(cleanParams).length > 0 ? cleanParams : undefined,
        };
      },
      transformResponse: (response) => {
        return {
          offers: response.data || [],
          meta: response.meta || {},
          status: response.status,
          message: response.message,
        };
      },
      providesTags: (result) =>
        result?.offers
          ? [
              ...result.offers.map(({ id }) => ({ type: "offers", id })),
              { type: "offers", id: "LIST" },
            ]
          : [{ type: "offers", id: "LIST" }],
    }),

    // GET offers assigned to a specific customer
    getCustomerOffers: builder.query({
      query: (customerId) => `/offer/customer/${customerId}`,
      transformResponse: (response) => {
        return {
          offers: response.data || [],
          meta: response.meta || {},
          status: response.status,
          message: response.message,
        };
      },
      providesTags: (result, error, customerId) => [
        { type: "customer-offers", id: customerId },
      ],
    }),

    // POST create new offer
    createOffer: builder.mutation({
      query: (data) => ({
        url: "/offer",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["offers"],
    }),

    // 🆕 PUT update offer (تعديل عرض أو إعادة تفعيله)
    updateOffer: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/offer/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["offers"],
    }),

    // DELETE offer
    deleteOffer: builder.mutation({
      query: (id) => ({
        url: `/offer/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["offers"],
    }),

    // 🆕 POST assign offer to customer
    assignOfferToCustomer: builder.mutation({
      query: ({ offerId, customerId }) => ({
        url: `/offer/${offerId}/assign-to-customer`,
        method: "POST",
        body: { customer_id: customerId },
      }),
      transformResponse: (response) => {
        return {
          success: true,
          data: response,
          message: "تم تعيين العرض للعميل بنجاح",
        };
      },
      transformErrorResponse: (error) => {
        return {
          success: false,
          message: error.data?.message || "فشل في تعيين العرض للعميل",
        };
      },
      invalidatesTags: (result, error, { customerId }) => [
        { type: "customer-offers", id: customerId },
        "offers",
      ],
    }),
  }),
});

export const {
  useGetOffersQuery,
  useGetCustomerOffersQuery,
  useCreateOfferMutation,
  useUpdateOfferMutation,
  useDeleteOfferMutation,
  useAssignOfferToCustomerMutation,
} = offersApiSlice;