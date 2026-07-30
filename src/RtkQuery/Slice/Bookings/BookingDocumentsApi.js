import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "../../../Api/baseUrl";

const getToken = () => {
  try {
    const raw = localStorage.getItem("SuperAdminInfo");
    const info = raw ? JSON.parse(raw) : null;
    return info?.user?.token || info?.token || localStorage.getItem("token");
  } catch (error) {
    return localStorage.getItem("token");
  }
};

/**
 * Obtains short-lived signed URLs for the three booking document routes
 * (contract PDF, contract preview, road-sign list DOCX) - see
 * BookingDocumentController and the "SECURITY FIX" note in routes/web.php.
 * The signature returned here is the auth for the actual document GET, so
 * once you have the `url`, just open it directly - no Bearer header needed
 * for that second request.
 */
export const bookingDocumentsApi = createApi({
  reducerPath: "bookingDocumentsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      const token = getToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      headers.set("Accept", "application/json");
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getContractPdfLink: builder.query({
      query: (bookingId) => `/bookings/${bookingId}/contract-pdf-link`,
      transformResponse: (response) => response?.data,
    }),
    getContractViewLink: builder.query({
      query: (bookingId) => `/bookings/${bookingId}/contract-view-link`,
      transformResponse: (response) => response?.data,
    }),
    getRoadSignListLink: builder.query({
      query: (bookingId) => `/bookings/${bookingId}/roadsign-list-link`,
      transformResponse: (response) => response?.data,
    }),
  }),
});

export const {
  useLazyGetContractPdfLinkQuery,
  useLazyGetContractViewLinkQuery,
  useLazyGetRoadSignListLinkQuery,
} = bookingDocumentsApi;
