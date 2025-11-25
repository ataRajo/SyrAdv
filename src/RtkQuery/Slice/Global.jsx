// global.jsx (baseQueryWithReauth + prepareHeaders)
import { fetchBaseQuery } from "@reduxjs/toolkit/query";
import { BASE_URL } from "../../Api/baseUrl";
import { showToast } from "../../utils/Notifictions/showToast";

const prepareHeaders = (headers) => {
  try {
    const raw = localStorage.getItem("SuperAdminInfo");
    const info = raw ? JSON.parse(raw) : null;

    // Support both shapes: { user: { token } } and { token }
    const token = info?.user?.token || info?.token || null;

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
      headers.set("Accept", "application/json");
      console.log("✅ Authorization set");
    } else {
      console.warn("⚠️ No token in SuperAdminInfo");
    }
  } catch (error) {
    console.error("❌ Error preparing headers:", error);
  }
  return headers;
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders,
});

export const baseQueryWithReauth = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  console.log("API Result:", result);

  if (result?.error?.status === 401) {
    if (api?.endpoint !== "logout" && api?.endpoint !== "getProfile") {
      showToast("error", "Received 401 Unauthorized response from API. Please login again.");
    }
    localStorage.removeItem("SuperAdminInfo");
    // Optional: redirect handled elsewhere
  }

  return result;
};
