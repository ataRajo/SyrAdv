import { createApi } from "@reduxjs/toolkit/query/react";

import { baseQueryWithReauth } from "../Global.jsx";

export const ReportSlice = createApi({
  reducerPath: "report",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["report"],
  endpoints: (builder) => ({
    getSoadSignDontHaveBooking: builder.query({
      query: ({ city_id, region_id, place, model ,from_date , to_date } = {}) => {
        const params = new URLSearchParams();
        if (city_id) params.append("city_id", city_id);
        if (region_id) params.append("region_id", region_id);
        if (place) params.append("place", place);
        if (model) params.append("model", model);
        if (from_date) params.append("from_date", from_date);
        if (to_date) params.append("to_date", to_date);

        const queryParams = params.toString();

        return `/get-road-sign-dont-have-booking${
          queryParams ? "?" + queryParams : ""
        }`;
      },
    }),
    getRoadSignBookingByWeek: builder.query({
      query: ({ city_id, region_id, place, model } = {}) => {
        const params = new URLSearchParams();
        if (city_id) params.append("city_id", city_id);
        if (region_id) params.append("region_id", region_id);
        if (place) params.append("place", place);
        if (model) params.append("model", model);
        const queryParams = params.toString();

        return `/get-road-signs-booking-by-week${
          queryParams ? "?" + queryParams : ""
        }`;
      },
    }),
    getRoadSignBookingByDate: builder.query({
      query: ({ from_date, to_date , product_type } = {}) => {
        const params = new URLSearchParams();
        if (from_date) params.append("from_date", from_date);
        if (to_date) params.append("to_date", to_date);
        if (product_type) params.append("product_type", product_type);


        const queryParams = params.toString();
        return `/get-roadSigns-bookings-by-customer-with-templates-model${
          queryParams ? "?" + queryParams : ""
        }`;
      },
    }),
  }),
});

export const {
  useGetRoadSignBookingByWeekQuery,
  useGetSoadSignDontHaveBookingQuery,
  useGetRoadSignBookingByDateQuery,
} = ReportSlice;
