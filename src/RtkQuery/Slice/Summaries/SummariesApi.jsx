import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from '../Global'



export const SummariesSlice = createApi({
    reducerPath: 'summaries',
    baseQuery:baseQueryWithReauth,
    tagTypes: ["summaries"],
    endpoints: (builder) => ({
        getSummaries: builder.query({
            query: () => "/summaries"
        }),
       
    })
});

export const { useGetSummariesQuery  } = SummariesSlice;