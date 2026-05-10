import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../Global";

export const TemplateSlice = createApi({
  reducerPath: "TemplateSlice",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Templates"],
  endpoints: (builder) => ({
    getTemplatesModel: builder.query({
      query: () => "/get-templates-model",
      providesTags: ["Templates"],
    }),
    getTemplates: builder.query({
      query: (id) => `/templates?model=${id}`,
      providesTags: (result, error, id) => [{ type: "Templates", id }],
    }),

getTemplatesByLocation: builder.query({
      query: ({ city_id, region_id }) => {
        const params = new URLSearchParams();
        if (city_id) params.append('city_id', city_id);
        if (region_id) params.append('region_id', region_id);
        return `/templates?${params.toString()}`;
      },
      providesTags: (result, error, { city_id, region_id }) => 
        [{ type: "Templates", id: `location-${city_id}-${region_id}` }],
    }),


// Add this in the endpoints object of TemplateSlice:
getAllTemplates: builder.query({
  query: () => "/templates",
  providesTags: ["Templates"],
}),



    getTemplatesById: builder.mutation({
      query: (id) => ({
        url: `/templates/${id}`,
        method: "GET",
      }),
    }),
    createTemplate: builder.mutation({
      query: (data) => ({
        url: "/templates",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Templates"],
    }),
    deleteTemplate: builder.mutation({
      query: (id) => ({
        url: `/templates/${id}`,
        method: "POST",
        body: { _method: "DELETE" },
      }),
      invalidatesTags: ["Templates"],
    }),
    UpdataTemplate: builder.mutation({
      query: ({ id, data }) => {
        // Check if data is FormData (file upload)
        if (data instanceof FormData) {
          // Add _method to FormData
          data.append('_method', 'PUT');
          return {
            url: `/templates/${id}`,
            method: "POST",
            body: data,
          };
        }
        
        // Regular JSON data
        return {
          url: `/templates/${id}`,
          method: "POST",
          body: { ...data, _method: "PUT" },
        };
      },
      invalidatesTags: ["Templates"],
    }),
  }),
});

export const {
  useGetTemplatesModelQuery,
  useGetTemplatesQuery,
  useGetTemplatesByLocationQuery,
  useCreateTemplateMutation,
  useDeleteTemplateMutation,
  useGetTemplatesByIdMutation,
    useGetAllTemplatesQuery,
  useUpdataTemplateMutation,
} = TemplateSlice;