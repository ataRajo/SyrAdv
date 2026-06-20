import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "../../../Api/baseUrl";

// Custom baseQuery with auth + Accept header for ALL requests
const baseQueryWithAuth = fetchBaseQuery({
  baseUrl: `${BASE_URL}`,
  prepareHeaders: (headers, { getState }) => {
    const token = localStorage.getItem("broker_token");
    
    // Always set Accept header
    headers.set("Accept", "application/json");
    
    // Set Authorization if token exists
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    
    return headers;
  },
});

export const MediatorSlice = createApi({
  reducerPath: "mediator",
  baseQuery: baseQueryWithAuth,
  tagTypes: [
    "broker-profile", 
    "broker-bookings", 
    "broker-payments",
    "broker-clients",
    "cities",
    "broker-booking-details"
  ],
  
  endpoints: (builder) => ({
    // Broker Login
    brokerLogin: builder.mutation({
      query: (credentials) => ({
        url: "/customer/login",
        method: "POST",
        body: credentials,
      }),
      transformResponse: (response) => {
        return {
          token: response.token || response.user?.token,
          user: response.user,
          guard: response.guard,
        };
      },
      invalidatesTags: ["broker-profile"],
    }),

    // Get Broker Profile
    getBrokerProfile: builder.query({
      query: () => "/customer/profile",
      providesTags: ["broker-profile"],
    }),

    getBrokerBookings: builder.query({
      query: (params) => {
        // Remove empty values from params
        const cleanParams = Object.fromEntries(
          Object.entries(params).filter(([_, v]) => v !== "" && v !== null && v !== undefined)
        );
        return {
          url: "/customer/booking",
          params: cleanParams,
        };
      },
      providesTags: ["broker-bookings"],
    }),

    
     brokerLogout: builder.mutation({
      query: () => ({
        url: '/customer/logout', // Or '/api/broker/logout' based on your backend
        method: 'POST',
      }),
    }),

    // Create Broker Booking
    createBrokerBooking: builder.mutation({
      query: (data) => ({
        url: "/customer/bookings",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["broker-bookings", "broker-booking-details"],
    }),

    // Get Broker Payments
    getBrokerPayments: builder.query({
      query: (params) => ({
        url: "/customer/payments",
        params,
      }),
      providesTags: ["broker-payments"],
    }),

    // Add Broker Customer
    addBrokerCustomer: builder.mutation({
      query: (data) => ({
        url: "/customers",
        method: "POST",
        body: data,
      }),
      transformResponse: (response) => {
        console.log("Add customer response:", response);
        return response;
      },
      transformErrorResponse: (error) => {
        console.error("Add customer error:", error);
        return error.data || { message: "فشل في إضافة العميل" };
      },
      invalidatesTags: ["broker-clients"],
    }),

    // Create Broker Payment
    createBrokerPayment: builder.mutation({
      query: (data) => ({
        url: "/customer/payments",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["broker-payments"],
    }),

    // Get Broker Clients
    getBrokerClients: builder.query({
      query: (params = {}) => ({
        url: "/customer/get-broker-client",
        params: {
          page: params.page || 1,
          per_page: params.per_page || 15,
          search: params.search || "",
          ...params,
        },
      }),
      transformResponse: (response) => {
        return {
          clients: response.data || [],
          meta: response.meta || {},
          status: response.status,
          message: response.message,
        };
      },
      providesTags: (result) => 
        result?.clients
          ? [
              ...result.clients.map(({ id }) => ({ type: "broker-clients", id })),
              { type: "broker-clients", id: "LIST" },
            ]
          : [{ type: "broker-clients", id: "LIST" }],
    }),

    // Get All Cities with Regions
    getCitiesWithRegions: builder.query({
      query: () => "/customer/cities",
      transformResponse: (response) => {
        const activeCities = (response || [])
          .filter(city => city.is_active === 1)
          .map(city => ({
            ...city,
            regions: (city.regions || []).filter(region => region.is_active === 1),
          }));
        
        activeCities.sort((a, b) => a.name.localeCompare(b.name));
        
        return activeCities;
      },
      providesTags: ["cities"],
    }),

    // Get Booking Details by ID or Customer ID
    getBookingDetails: builder.query({
      query: ({ customer_id, booking_id }) => {
        if (booking_id) {
          return `/customer/booking/${booking_id}`;
        }
        if (customer_id) {
          return `/customer/booking?customer_id=${customer_id}`;
        }
        return "/customer/booking";
      },
      providesTags: (result, error, arg) => 
        arg?.booking_id 
          ? [{ type: "broker-booking-details", id: arg.booking_id }]
          : [{ type: "broker-booking-details", id: "LIST" }],
    }),

// Submit Broker Activity (Create activity for broker)
submitBrokerActivity: builder.mutation({
  query: ({ activityId, customerInformations }) => ({
    url: `/broker/activities/${activityId}`,
    method: "POST",
    body: {
      customer_informations: customerInformations
    },
  }),
  transformResponse: (response) => {
    console.log("Activity submission response:", response);
    return {
      success: true,
      data: response,
      message: "تم إرسال البيانات بنجاح",
    };
  },
  transformErrorResponse: (error) => {
    console.error("Activity submission error:", error);
    return {
      success: false,
      message: error.data?.message || "فشل في إرسال البيانات",
    };
  },
}),



    // Create New Booking (Customer Booking) - uses /bookings endpoint
    createCustomerBooking: builder.mutation({
      query: (bookingData) => ({
        url: "/bookings",
        method: "POST",
        body: bookingData,
      }),
      transformResponse: (response) => {
        return {
          success: true,
          data: response,
          message: "تم إنشاء الحجز بنجاح",
        };
      },
      invalidatesTags: ["broker-bookings", "broker-booking-details"],
    }),

    // Update Booking
    updateBooking: builder.mutation({
      query: ({ id, data }) => ({
        url: `/bookings/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        "broker-bookings",
        { type: "broker-booking-details", id },
      ],
    }),

    // Delete Booking
    deleteBooking: builder.mutation({
      query: (id) => ({
        url: `/bookings/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["broker-bookings", "broker-booking-details"],
    }),

    // ❌ REMOVED: getBookingStatistics - no more /bookings/statistics calls
  }),
});

export const {
  useBrokerLoginMutation,
  useGetBrokerProfileQuery,
  useGetBrokerBookingsQuery,
  useCreateBrokerBookingMutation,
  useGetBrokerPaymentsQuery,
  useCreateBrokerPaymentMutation,
  useGetBrokerClientsQuery,
  useGetCitiesWithRegionsQuery,
  useGetBookingDetailsQuery,
  useCreateCustomerBookingMutation,
  useUpdateBookingMutation,
  useDeleteBookingMutation,
  useAddBrokerCustomerMutation,
  useBrokerLogoutMutation  ,
  useSubmitBrokerActivityMutation,
} = MediatorSlice;