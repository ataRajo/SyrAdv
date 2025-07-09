import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../Global";

export const AuthSlice = createApi({
  reducerPath: "auth",
  baseQuery:baseQueryWithReauth,
  tagTypes: ["profile", "companies"],
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (data) => ({
        url: "/login",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["profile"],
    }),
    logout: builder.mutation({
      query: () => ({
        url: "/logout",
        method: "POST",
      }),
      invalidatesTags: ["profile"],
    }),
    getProfile: builder.query({
      query: () => "/profile",
      providesTags: ["profile"],
    }),
    updateProfile: builder.mutation({
      query: (data) => {
        data["_method"] = "PUT";

        return {
          url: "/update-profile",
          method: "POST",
          body: data,
        };
      },
      invalidatesTags: ["profile"],
    }),
    getCompany: builder.query({
      query: () => "/companies/1",
      providesTags: ["companies"],
    }),
    updateCompany: builder.mutation({
      query: (data) => {
        data["_method"] = "PUT";
        return {
          url: "/companies/1",
          method: "POST",
          body: data,
        };
      },
      invalidatesTags: ["companies"],
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useGetCompanyQuery,
  useUpdateCompanyMutation,
} = AuthSlice;
