import { fetchBaseQuery } from "@reduxjs/toolkit/query";
import { BASE_URL } from "../../Api/baseUrl";
import { showToast } from "../../utils/Notifictions/showToast";

const prepareHeaders = (headers) => {
  try {
    const superAdminInfo = JSON.parse(localStorage.getItem("SuperAdminInfo")) || {};
    
    console.log("🔍 Full SuperAdminInfo:", superAdminInfo);
    
    // The token is at the ROOT level, not inside user!
    const token = superAdminInfo?.token; // ✅ This is the correct path
    
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
      console.log("✅ Token set in header from superAdminInfo.token");
    } else {
      console.warn("⚠️ No token found at superAdminInfo.token");
    }
    
    headers.set("Accept", "application/json");
    return headers;
  } catch (error) {
    console.error("❌ Error preparing headers:", error);
    return headers;
  }
};
const rawBaseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: prepareHeaders,
});

export const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  console.log("API Result:", result);

  if (result.error && result.error.status === 401) {
    if (api?.endpoint === "logout" || api?.endpoint === "getProfile") {
      return;
    } else {
      showToast(
        "error",
        "Received 401 Unauthorized response from API. Please login again."
      );
    }
    
    localStorage.removeItem("SuperAdminInfo");
    
    // Temporarily comment out the redirect for debugging
    // api?.endpoint === "logout" || api?.endpoint === "getProfile"
    //   ? null
    //   : (window.location.href = "/");
  }
  return result;
};
