// src/RtkQuery/Slice/SearchApi/SearchApi.js
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../Global";

export const SearchSlice = createApi({
  reducerPath: "search",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["search"],
  endpoints: (builder) => ({
    // ✅ Global Search - supports pagination (page, per_page) and date filters
    globalSearch: builder.query({
      query: ({ 
        model, 
        query, 
        page = 1, 
        per_page = 15,
        start_date,
        end_date,
        customer_id,
        booking_type,
        periods,
        product_type,
        printing_type
      }) => {
        const modelArray = Array.isArray(model) ? model : [model];

        const searchParams = new URLSearchParams();
        modelArray.forEach((m) => searchParams.append("model[]", m));
        searchParams.append("query", query.trim());
        
        // Add pagination query parameters
        if (page) searchParams.append("page", page);
        if (per_page) searchParams.append("per_page", per_page);
        
        // Add date filters
        if (start_date) searchParams.append("start_date", start_date);
        if (end_date) searchParams.append("end_date", end_date);
        
        // Add road signs filters
        if (customer_id && customer_id !== "all") searchParams.append("customer_id", customer_id);
        if (booking_type && booking_type !== "all") searchParams.append("booking_type", booking_type);
        if (periods && periods !== "all") searchParams.append("periods", periods);
        if (product_type && product_type !== "all") searchParams.append("product_type", product_type);
        if (printing_type && printing_type !== "all") searchParams.append("printing_type", printing_type);

        return {
          url: `/search?${searchParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: (result, error, { model, query, page }) => [
        { type: "search", id: `${model}-${query}-page-${page || 1}` },
      ],
    }),
  }),
});

export const { useGlobalSearchQuery, useLazyGlobalSearchQuery } = SearchSlice;