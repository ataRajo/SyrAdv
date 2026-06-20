import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../Global";

export const WorkTypesSlice = createApi({
  reducerPath: "workTypes",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["WorkTypes"],
  endpoints: (builder) => ({
    
    getWorkTypes: builder.query({
      query: () => "/work-types",
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: "WorkTypes", id })),
              { type: "WorkTypes", id: "LIST" },
            ]
          : [{ type: "WorkTypes", id: "LIST" }],
    }),

    addWorkType: builder.mutation({
      query: (data) => ({
        url: "/work-types",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "WorkTypes", id: "LIST" }],
    }),

    updateWorkType: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/work-types/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "WorkTypes", id },
        { type: "WorkTypes", id: "LIST" },
      ],
    }),

    deleteWorkType: builder.mutation({
      query: (id) => ({
        url: `/work-types/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "WorkTypes", id: "LIST" }],
    }),
  }),
});

export const {
  useGetWorkTypesQuery,
  useAddWorkTypeMutation,
  useUpdateWorkTypeMutation,
  useDeleteWorkTypeMutation,
} = WorkTypesSlice;