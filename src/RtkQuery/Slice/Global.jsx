import { fetchBaseQuery } from "@reduxjs/toolkit/query";
import { BASE_URL } from "../../Api/baseUrl";
import { showToast } from "../../utils/Notifictions/showToast";

const prepareHeaders = (headers) => {

    const superAdminInfo = JSON.parse(localStorage.getItem("SuperAdminInfo"))
  
    if (superAdminInfo && superAdminInfo.token) {
      headers.set("Authorization", `Bearer ${superAdminInfo.token}`);
    }
    headers.set("Accept", "application/json");
    return headers;
  };

const rawBaseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: prepareHeaders,
});

export const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401 ) {
    if((api?.endpoint == "logout" || api?.endpoint == "getProfile")){
      return
    }else{
    showToast("error",'Received 401 Unauthorized response from API. Redirecting to login.');

    }
    localStorage.removeItem("SuperAdminInfo");
    

    (api?.endpoint == "logout" || api?.endpoint == "getProfile")  ? null : window.location.href = '/' 
  }
  return result;
};