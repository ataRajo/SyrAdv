import { createApi } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "../../../Api/baseUrl";
import { baseQueryWithReauth } from "../Global";


export const CitiesAndRegionsSlice = createApi({
  reducerPath: "cities-and-regions",
  baseQuery:baseQueryWithReauth,
  tagTypes: ["Cities", "Regions"],
  endpoints: (builder) => ({
    getCities: builder.query({
      query: () => "/cities",
      providesTags: ["Cities"],
    }),
    addNewCity: builder.mutation({
      query: (data) => ({
        url: "/cities",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Cities"],
    }),
    updateCity: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/cities/${id}`,
        method: "POST",
        body: { ...data, _method: "PUT" },
      }),
      invalidatesTags: ["Cities"],
    }),
    deleteCity: builder.mutation({
      query: (id) => ({
        url: `/cities/${id}`,
        method: "POST",
        body: { _method: "DELETE" },
      }),
      invalidatesTags: ["Cities"],
    }),

    getRegions: builder.query({
      query: () => "/regions",
      providesTags: ["Regions"],
    }),
    addNewRegion: builder.mutation({
      query: (data) => ({
        url: "/regions",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Regions"],
    }),
    updateRegion: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/regions/${id}`,
        method: "POST",
        body: { ...data, _method: "PUT" },
      }),
      invalidatesTags: ["Regions"],
    }),
    deleteRegion: builder.mutation({
      query: (id) => ({
        url: `/regions/${id}`,
        method: "POST",
        body: { _method: "DELETE" },
      }),
      invalidatesTags: ["Regions"],
    }),
    getActiveRegionsByCity: builder.mutation({
      query: (id) => ({
        url: `/get-active-regions-by-city?city_id=${id}`,
        method: "GET",
      }),
      invalidatesTags: ["Regions"],
    }),
  }),
});

export const {
  useGetCitiesQuery,
  useAddNewCityMutation,
  useUpdateCityMutation,
  useDeleteCityMutation,
  useGetRegionsQuery,
  useAddNewRegionMutation,
  useUpdateRegionMutation,
  useDeleteRegionMutation,
  useGetActiveRegionsByCityMutation,
} = CitiesAndRegionsSlice;
