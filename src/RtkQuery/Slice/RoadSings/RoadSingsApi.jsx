import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../Global";

export const RoadSignsSlice = createApi({
  reducerPath: "roadSigns",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["RoadSigns"],
  endpoints: (builder) => ({
   // Updated RoadSignsSlice.js - Only the getRoadSigns endpoint
// In RoadSignsSlice.js - update the getRoadSigns endpoint
getRoadSigns: builder.query({
  query: ({ 
    start_date, 
    end_date, 
    city_id, 
    region_id, 
    direction, 
    model, 
    customer_id,
    page = 1,
    per_page = 50 
  } = {}) => {
    const params = new URLSearchParams();
    if (start_date) params.append("start_date", start_date);
    if (end_date) params.append("end_date", end_date);
    if (city_id) params.append("city_id", city_id);
    if (region_id) params.append("region_id", region_id);
    if (model) params.append("model", model);
    if (customer_id) params.append("customer_id", customer_id);
    if (direction) params.append("direction", direction);
    
    // ✅ Always send page and per_page
    params.append("page", page);
    params.append("per_page", per_page);

    const queryString = params.toString();
    console.log("📡 API Request URL:", `/road-signs${queryString ? `?${queryString}` : ""}`);
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

    // تصحيح اسم الـ endpoint هنا
    getRoadSignsDirections: builder.query({
      query: () => "/road-signs/directions", // أو "/road-signs-directions" حسب API الفعلي
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
} = RoadSignsSlice;