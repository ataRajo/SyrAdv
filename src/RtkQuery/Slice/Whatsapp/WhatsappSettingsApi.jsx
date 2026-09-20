import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../Global";

// لوحة تحكم السوبر أدمن بإشعارات واتساب (طلب صريح): تفعيل/تعطيل كل نوع
// رسالة تلقائية/جماعية وتعديل نصها دون نشر كود جديد. راجع
// App\Http\Controllers\Api\V1\WhatsappSettingsController على الباك-إند.
export const WhatsappSettingsSlice = createApi({
  reducerPath: "whatsappSettings",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["WhatsappSettings"],
  endpoints: (builder) => ({
    getWhatsappSettings: builder.query({
      query: () => "/whatsapp-settings",
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: "WhatsappSettings", id })),
              { type: "WhatsappSettings", id: "LIST" },
            ]
          : [{ type: "WhatsappSettings", id: "LIST" }],
    }),

    updateWhatsappSetting: builder.mutation({
      query: ({ key, ...data }) => ({
        url: `/whatsapp-settings/${key}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "WhatsappSettings", id: "LIST" }],
    }),
  }),
});

export const {
  useGetWhatsappSettingsQuery,
  useUpdateWhatsappSettingMutation,
} = WhatsappSettingsSlice;
