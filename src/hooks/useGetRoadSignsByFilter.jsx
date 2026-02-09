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
  const [direction, setDirection] = useState(""); // ✅ إضافة direction
  const [place, setPlace] = useState(""); // ✅ إضافة place

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

  const queryParams = {
    start_date: startDate,
    end_date: endDate,
    city_id: cityId,
    region_id: regionId,
    model: model,
    customer_id: customerId || "",
    direction: direction || "", // ✅ إضافة direction هنا
    place: place || "", // ✅ إضافة place هنا
  };


  const {
    data: roadSigns,
    isError,
    isFetching: isRoadSignsFetching,
  } = useGetRoadSignsQuery(queryParams, {
    refetchOnMountOrArgChange: true,
  });

  const navigate = useNavigate();

  useEffect(() => {
    roadSigns?.length == 0
      ? showToast("error", "لا توجد بيانات في هذا المكان الرجاء اختار مكان آخر")
      : null;
    roadSigns?.length == 0 && routeBooking != "booking"
      ? setTimeout(() => navigate("/dashboard/road_signs"), 1000)
      : null;
  }, [roadSigns]);

  useEffect(() => {
    if (cityId) {
      getActiveRegionsByCity(cityId);
    }
  }, [cityId, getActiveRegionsByCity]);

  const handleCityChange = (e) => {
    setCityId(e.target.value);
    setRegionId("");
  };

  const handleRegionChange = (e) => {
    setRegionId(e.target.value);
  };

  const handleModelChange = (e) => {
    setModel(e.target.value);
  };

  // ✅ دالة جديدة لمعالجة تغيير الاتجاه
  const handleDirectionChange = (value) => {
    setDirection(value);
  };

  // ✅ دالة جديدة لمعالجة تغيير المكان
  const handlePlaceChange = (value) => {
    setPlace(value);
  };

  return {
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    cityId,
    setCityId,
    regionId,
    setRegionId,
    roadSigns: roadSigns?.data,
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
    direction, // ✅ تصدير direction
    setDirection, // ✅ تصدير setDirection
    place, // ✅ تصدير place
    setPlace, // ✅ تصدير setPlace
    handleCityChange,
    handleRegionChange,
    handleModelChange,
    handleDirectionChange, // ✅ تصدير handleDirectionChange
    handlePlaceChange, // ✅ تصدير handlePlaceChange
  };
};

export default useGetRoadSignsByFilter;