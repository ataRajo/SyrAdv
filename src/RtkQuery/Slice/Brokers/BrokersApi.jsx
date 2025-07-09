import { createApi } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "../../../Api/baseUrl";
import { baseQueryWithReauth } from "../Global";

export const BrokersSlice = createApi({
  reducerPath: "brokers",
  baseQuery:baseQueryWithReauth,
  tagTypes: ["Brokers"],
  endpoints: (builder) => ({
    getBrokers: builder.query({
      query: () => "/brokers",
      providesTags: ["Brokers"],
    }),
    addNewBroker: builder.mutation({
      query: (data) => ({
        url: "brokers",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Brokers"],
    }),
    deleteBroker: builder.mutation({
      query: (id) => {
        return({
        url: `brokers/${id}`,
        method: "POST",
        body:{"_method": "DELETE"}
      })},
      invalidatesTags: ["Brokers"],
    }),
    UpdataBroker: builder.mutation({
      query: ({ data, id }) =>{
        
        return ({
        url: `brokers/${id}`,
        method: "POST",
        body: {...data,"_method": "PUT"} 
      })},
      invalidatesTags: ["Brokers"],
    }),
  }),
});

export const {
  useGetBrokersQuery,
  useAddNewBrokerMutation,
  useDeleteBrokerMutation,
  useUpdataBrokerMutation,
} = BrokersSlice;
