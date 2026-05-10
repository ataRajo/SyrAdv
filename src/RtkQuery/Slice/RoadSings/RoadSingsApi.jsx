// Your existing RoadSingsApi.js - DON'T CHANGE ANYTHING
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../Global";

export const RoadSignsSlice = createApi({
  reducerPath: "roadSigns",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["RoadSigns"],
  endpoints: (builder) => ({
    getRoadSigns: builder.query({
      query: ({ start_date, end_date, city_id, region_id, direction, model, customer_id , is_ai ,template_id,template_size  } = {}) => {
        const params = new URLSearchParams();
        if (start_date) params.append("start_date", start_date);
        if (end_date) params.append("end_date", end_date);
        if (city_id) params.append("city_id", city_id);
        if (region_id) params.append("region_id", region_id);
        if (model) params.append("model", model);
        if (customer_id) params.append("customer_id", customer_id);
        if (direction) params.append("direction", direction);
        if (is_ai !== undefined) params.append("is_ai", is_ai);
        if (template_id) params.append("template_id", template_id);
        if (template_size) params.append("template_size", template_size);

        const queryString = params.toString();
        return `/road-signs${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: ["RoadSigns"],
    }),
    getRoadSignsModel: builder.query({
      query: () => "/get-road-signs-template-by-model",
      providesTags: ["RoadSigns"],
    }),
    getTemplateProducts: builder.query({
      query: () => "/get-template-products",
    }),

    getRoadSignsDirections: builder.query({
      query: () => "/road-signs/directions",
      providesTags: ["RoadSigns"],
    }),
    
    deleteRoadSign: builder.mutation({
      query: (id) => ({
        url: `road-signs/${id}`,
        method: "POST",
        body: { _method: "DELETE" },
      }),
      invalidatesTags: ["RoadSigns"],
    }),
    getRoadSignById: builder.query({
      query: (id) => `road-signs/${id}`,
      providesTags: (result, error, id) => [{ type: "RoadSigns", id }],
    }),

    
    updateRoadSign: builder.mutation({
      query: ({ id, data }) => {
        console.log('Update data:', data);
        
        if (data instanceof FormData) {
          return {
            url: `road-signs/${id}`,
            method: "POST", 
            body: data,
          };
        } else {
          return {
            url: `road-signs/${id}`,
            method: "PUT",
            body: data,
            headers: {
              'Content-Type': 'application/json',
            },
          };
        }
      },
      invalidatesTags: ["RoadSigns"],
    }),
    addRoadSign: builder.mutation({
      query: (data) => ({
        url: `road-signs`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["RoadSigns"],
    }),

    getBoardReservationsStats: builder.query({
      query: ({ city_id, region_id , month, year, from_month, to_month, to_year } = {}) => {
        const params = new URLSearchParams();
        if (city_id)    params.append("city_id",    city_id);
        if(region_id) params.append("region_id" , region_id)
        if (month)      params.append("month",      month);
        if (year)       params.append("year",       year);
        if (from_month) params.append("from_month", from_month);
        if (to_month)   params.append("to_month",   to_month);
        if (to_year)    params.append("to_year",    to_year);
        const qs = params.toString();
        return `/road-signs/statistics/board-reservations${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["RoadSigns"],
    }),

getOccupancyRate: builder.query({
  query: ({ month, template_id, city_id } = {}) => {
    const params = new URLSearchParams();
    if (month) params.append("month", month);
    if (template_id) params.append("template_id", template_id);
    if (city_id) params.append("city_id", city_id);
    const qs = params.toString();
    return `/templates/occupancy-rate${qs ? `?${qs}` : ""}`;
  },
  providesTags: ["RoadSigns"],
}),


  }),

  
});

export const {
  useGetRoadSignsQuery,
  useDeleteRoadSignMutation,
  useGetRoadSignByIdQuery,
  useUpdateRoadSignMutation,
  useAddRoadSignMutation,
  useGetTemplateProductsQuery,
  useGetRoadSignsModelQuery,
  useGetRoadSignsDirectionsQuery,
  useGetBoardReservationsStatsQuery,
  useGetOccupancyRateQuery,
  
} = RoadSignsSlice;