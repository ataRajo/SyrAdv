import React, { useEffect, useState } from "react";
import {
  useGetRoadSignsModelQuery,
  useGetRoadSignsQuery,
} from "../RtkQuery/Slice/RoadSings/RoadSingsApi";
import {
  useGetActiveRegionsByCityMutation,
  useGetCitiesQuery,
} from "../RtkQuery/Slice/CitiesAndRegions/CitiesAndRegionsApi";
import { useLocation, useNavigate } from "react-router";
import { showToast } from "../utils/Notifictions/showToast";

const useGetRoadSignsByFilter = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [cityId, setCityId] = useState("");
  const [regionId, setRegionId] = useState("");
  const [model, setModel] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [direction, setDirection] = useState("");
  const [place, setPlace] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);

  const local = useLocation();
  const pathnameSplit = local?.pathname.split("/");
  const routeBooking = pathnameSplit[2];

  const { data: cities, isLoading: isCitiesLoading } = useGetCitiesQuery();
  const [
    getActiveRegionsByCity,
    {
      data: regions,
      isLoading: isRegionsLoading,
      isFetching: isRegionsFetching,
    },
  ] = useGetActiveRegionsByCityMutation();
  const { data: getRoadSignsModel, isLoading: isGetRoadSignsModel } =
    useGetRoadSignsModelQuery();

  // Query parameters
  const queryParams = {
    start_date: startDate,
    end_date: endDate,
    city_id: cityId,
    region_id: regionId,
    model: model,
    customer_id: customerId || "",
    direction: direction || "",
    place: place || "",
    page: page,
    per_page: perPage,
  };

  console.log("🚀 SENDING TO API:", queryParams);

  // ✅ Force refetch every time page or perPage changes
  const {
    data: apiResponse,
    isError,
    isFetching: isRoadSignsFetching,
    refetch, // Get refetch function
  } = useGetRoadSignsQuery(queryParams, {
    refetchOnMountOrArgChange: true,
  });

  // ✅ Manually trigger refetch when page changes
  useEffect(() => {
    console.log("🔄 Page changed to:", page, "Refetching...");
    refetch();
  }, [page, perPage, refetch]);

  // ✅ Debug the API response
  useEffect(() => {
    if (apiResponse) {
      console.log("📦 API RESPONSE:", {
        response: apiResponse,
        isArray: Array.isArray(apiResponse),
        keys: Object.keys(apiResponse),
        dataLength: apiResponse?.data?.length || apiResponse?.length || 0,
        hasMeta: !!apiResponse?.meta,
        hasPagination: !!apiResponse?.pagination
      });
    }
  }, [apiResponse]);

  const navigate = useNavigate();

  useEffect(() => {
    const roadSignsArray = apiResponse?.data || apiResponse || [];
    if (roadSignsArray.length === 0) {
      showToast("error", "لا توجد بيانات في هذا المكان الرجاء اختار مكان آخر");
    }
    if (roadSignsArray.length === 0 && routeBooking !== "booking") {
      setTimeout(() => navigate("/dashboard/road_signs"), 1000);
    }
  }, [apiResponse, routeBooking, navigate]);

  useEffect(() => {
    if (cityId) {
      getActiveRegionsByCity(cityId);
    }
  }, [cityId, getActiveRegionsByCity]);

  const handleCityChange = (e) => {
    const value = e.target.value;
    console.log("🌆 City changed to:", value);
    setCityId(value);
    setRegionId("");
    setPage(1); // Reset to page 1
  };

  const handleRegionChange = (e) => {
    const value = e.target.value;
    console.log("📍 Region changed to:", value);
    setRegionId(value);
    setPage(1); // Reset to page 1
  };

  const handleModelChange = (e) => {
    const value = e.target.value;
    console.log("📏 Model changed to:", value);
    setModel(value);
    setPage(1); // Reset to page 1
  };

  const handleDirectionChange = (value) => {
    console.log("🧭 Direction changed to:", value);
    setDirection(value);
    setPage(1); // Reset to page 1
  };

  const handlePlaceChange = (value) => {
    console.log("📍 Place changed to:", value);
    setPlace(value);
    setPage(1); // Reset to page 1
  };

  // ✅ FIXED: Simple page change function
  const handlePageChange = (newPage) => {
    console.log("📄 Page change requested:", newPage, "Current page:", page);
    if (newPage !== page && newPage >= 1) {
      setPage(newPage);
    }
  };

  // ✅ FIXED: Simple per page change function
  const handlePerPageChange = (value) => {
    console.log("📊 Per page change requested:", value, "Current perPage:", perPage);
    const newPerPage = parseInt(value);
    if (newPerPage !== perPage && newPerPage > 0) {
      setPerPage(newPerPage);
      setPage(1); // Reset to page 1
    }
  };

  // Extract road signs data
  const roadSignsData = apiResponse?.data || apiResponse || [];

  // Calculate pagination info
  const totalItems = apiResponse?.total || apiResponse?.meta?.total || roadSignsData.length;
  const lastPage = apiResponse?.last_page || apiResponse?.meta?.last_page || Math.ceil(totalItems / perPage);
  
  const paginationData = {
    current_page: page,
    last_page: lastPage,
    per_page: perPage,
    total: totalItems,
    from: (page - 1) * perPage + 1,
    to: Math.min(page * perPage, totalItems),
  };

  console.log("📊 CALCULATED PAGINATION:", paginationData);

  return {
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    cityId,
    setCityId,
    regionId,
    setRegionId,
    roadSigns: roadSignsData,
    pagination: paginationData,
    isError,
    cities,
    isCitiesLoading,
    getActiveRegionsByCity,
    regions,
    isRegionsLoading,
    isRegionsFetching,
    model,
    setModel,
    getRoadSignsModel,
    isGetRoadSignsModel,
    isRoadSignsFetching,
    customerId,
    setCustomerId,
    direction,
    setDirection,
    place,
    setPlace,
    page,
    perPage,
    handleCityChange,
    handleRegionChange,
    handleModelChange,
    handleDirectionChange,
    handlePlaceChange,
    handlePageChange,
    handlePerPageChange,
  };
};

export default useGetRoadSignsByFilter;