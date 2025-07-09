import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../Global";
import { BASE_URL } from "../../../Api/baseUrl";



export const TemplateSlice = createApi({
  reducerPath: "TemplateSlice",
  baseQuery:baseQueryWithReauth,
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
      query: ({ id, data }) => ({
        url: `/templates/${id}`,
        method: "POST",
        body: { ...data, _method: "PUT" },
      }),
      invalidatesTags: ["Templates"],
    }),
  }),
});

export const {
  useGetTemplatesModelQuery,
  useGetTemplatesQuery,
  useCreateTemplateMutation,
  useDeleteTemplateMutation,
  useGetTemplatesByIdMutation,
  useUpdataTemplateMutation,
} = TemplateSlice;