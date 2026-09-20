import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../Global";

// رسائل واتساب الجماعية (ترحيب/عروض/مناسبات - طلب صريح). راجع
// App\Http\Controllers\Api\V1\WhatsappBulkController على الباك-إند - كل
// رسالة تُرسَل عبر طابور بفاصل عشوائي 10-15 ثانية لتجنب حظر واتساب، لا
// إرسال فوري دفعة واحدة.
export const WhatsappBulkSlice = createApi({
  reducerPath: "whatsappBulk",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["WhatsappBulkCampaigns"],
  endpoints: (builder) => ({
    getRecipientsPreview: builder.query({
      query: ({ segment, workTypeId }) => ({
        url: "/whatsapp-bulk/recipients-preview",
        params: {
          segment,
          ...(workTypeId ? { work_type_id: workTypeId } : {}),
        },
      }),
    }),

    sendBulkWhatsappMessage: builder.mutation({
      query: (data) => ({
        url: "/whatsapp-bulk/send",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "WhatsappBulkCampaigns", id: "LIST" }],
    }),

    getWhatsappCampaigns: builder.query({
      query: () => "/whatsapp-bulk/campaigns",
      providesTags: [{ type: "WhatsappBulkCampaigns", id: "LIST" }],
    }),
  }),
});

export const {
  useGetRecipientsPreviewQuery,
  useLazyGetRecipientsPreviewQuery,
  useSendBulkWhatsappMessageMutation,
  useGetWhatsappCampaignsQuery,
} = WhatsappBulkSlice;
