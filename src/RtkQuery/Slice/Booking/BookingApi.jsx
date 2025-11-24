import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../Global";

export const BookingSlice = createApi({
  reducerPath: "booking",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["bookings"],
  endpoints: (builder) => ({
    
    getBooking: builder.query({
      query: () => "/bookings",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "bookings", id })),
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

    // ✅ Get single booking
    getOneBookings: builder.query({
      query: (id) => `bookings/${id}`,
      providesTags: (result, error, id) => [{ type: "bookings", id }],
    }),

    // ✅ Update booking (PUT via _method)
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
    { type: "bookings", id: "LIST" }, // 👈 force list refetch
  ],
}),


 //==================== ADD MOVE BOOKING API ==============

   moveBooking: builder.mutation({
      query: ({ booking_id, old_roadsign_id, new_roadsign_id }) => ({
        url: "/customer/move-booking",
        method: "POST",
        body: {
          booking_id,
          old_roadsign_id, 
          new_roadsign_id
        },
      }),
      invalidatesTags: [{ type: "bookings", id: "LIST" }],
    }),
    // ============   ============



    // ✅ Update status (with reject reason if needed)
    
    updateBookingStatus: builder.mutation({
      query: ({ id, status, reject_reason }) => ({
        url: `bookings/${id}/update-approvment-status`,
        method: "POST",
        body: { status, reject_reason },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "bookings", id }],
    }),

    // ✅ Calculate reservation
    calculateReservation: builder.mutation({
      query: (data) => ({
        url: "get-calculate-Amount",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["reservations"],
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
  useMoveBookingMutation
} = BookingSlice;
