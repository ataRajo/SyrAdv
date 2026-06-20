import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../Global";

export const BookingSlice = createApi({
  reducerPath: "booking",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["bookings"],
  endpoints: (builder) => ({
    
    getBooking: builder.query({
  query: ({ page, per_page } = {}) => {
    const params = new URLSearchParams();
    if (page) params.append("page", page);
    if (per_page) params.append("per_page", per_page);
    const queryString = params.toString();
    return `/bookings${queryString ? `?${queryString}` : ""}`;
  },
  providesTags: (result) =>
    result?.data
      ? [
          ...result.data.map(({ id }) => ({ type: "bookings", id })),
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

    // ✅ Update booking 
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
    { type: "bookings", id: "LIST" }, 
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
invalidatesTags: (result, error, { booking_id }) => [
        { type: "bookings", id: "LIST" },
        { type: "bookings", id: booking_id },
      ],    }),

    // ✅ Update status (with reject reason if needed)
    
    updateBookingStatus: builder.mutation({
      query: ({ id, status, reject_reason }) => ({
        url: `bookings/${id}/update-approvment-status`,
        method: "POST",
        body: { status, reject_reason },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "bookings", id }],
    }),

 extendBooking: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `bookings/${id}/extendBooking`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['bookings'],
    }),

      
 calculateReservation: builder.mutation({
  query: ({ is_extend = false, ...restData }) => ({
    url: "get-calculate-Amount",
    method: "POST",
    body: {
      ...restData,
      is_extend,
    },
  }),
  invalidatesTags: ["reservations"],
}),


uploadBookingPdf: builder.mutation({
  query: ({ id, body }) => ({
    url: `bookings/${id}/uploadPdf`,
    method: 'POST',
    body: body, // Pass the FormData object directly here
  }),
  invalidatesTags: (result, error, { id }) => [{ type: "bookings", id }],
}),


    confirmBooking: builder.mutation({
  query: (id) => ({
    url: `bookings/${id}/confirm-booking`,
    method: "POST",
    body: {},
  }),
  invalidatesTags: (result, error, id) => [
    { type: "bookings", id },
    { type: "bookings", id: "LIST" },
  ],
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
  useMoveBookingMutation ,
  useExtendBookingMutation,
  useConfirmBookingMutation,
  useUploadBookingPdfMutation,
  //useCalculateExtendedPriceMutation
} = BookingSlice;
