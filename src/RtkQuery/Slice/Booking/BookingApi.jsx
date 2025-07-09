import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../Global";
import { BASE_URL } from "../../../Api/baseUrl";

export const BookingSlice = createApi({
  reducerPath: "booking",
  baseQuery:baseQueryWithReauth,
  tagTypes: ["bookings"],
  endpoints: (builder) => ({
    getBooking: builder.query({
      query: () => "/bookings",
      providesTags: ["bookings"],
    }),
    addNewBooking: builder.mutation({
      query: (data) => {
        return {
          url: "bookings",
          method: "POST",
          body: data,
        };
      },
      invalidatesTags: ["bookings"],
    }),
    calculateReservation: builder.mutation({
      query: (data) => {
        
        return {
          url: "get-calculate-Amount",
          method: "POST",
          body: data,
        };
      },
      invalidatesTags: ["reservations"],
    }),
    getOneBookings: builder.query({
      query: (id) => `bookings/${id}`,
      providesTags: ["bookings"],

    }),

    updateBookings: builder.mutation({
      query: (data) => {
        return {
          url: `bookings/${data.id}`,
          method: "POST",
          body: { ...data, "_method": "PUT" },
        };
      },
      invalidatesTags: ["bookings"],
    }),
    deleteBooking: builder.mutation({
      query: (id) => {
        return({
        url: `bookings/${id}`,
        method: "POST",
        body:{"_method": "DELETE"}
      })},
      invalidatesTags: ["bookings"],
    }),
  cancelBooking: builder.mutation({
      query: (id) => {
        return({
        url: `cancel-booking/${id}`,
        method: "POST",
        body:{}
      })},
      invalidatesTags: ["bookings"],
    }),
  }),
});

export const {
  useGetBookingQuery,
  useAddNewBookingMutation,
  useCalculateReservationMutation,
  useUpdateBookingsMutation,
  useGetOneBookingsQuery,
  useDeleteBookingMutation,
  useCancelBookingMutation,
} = BookingSlice;
