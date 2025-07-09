import React, { useState, useEffect, useCallback } from 'react';
import { useGetRoadSignBookingByDateQuery, useGetRoadSignBookingByWeekQuery, useGetSoadSignDontHaveBookingQuery } from '../RtkQuery/Slice/Report/ReportApi';
import { useGetRoadSignsModelQuery } from '../RtkQuery/Slice/RoadSings/RoadSingsApi';
import { useGetActiveRegionsByCityMutation, useGetCitiesQuery } from '../RtkQuery/Slice/CitiesAndRegions/CitiesAndRegionsApi';

const useReports = () => {
  const [activeTab, setActiveTab] = useState("bookings");
  const [cityId, setCityId] = useState();
  const [regionId, setRegionId] = useState();
  const [model, setModel] = useState();
  const [fromDate, setFromDate] = useState();
  const [toDate, setToDate] = useState();
  const [productId, setProductId] = useState();
  
    // Fetch data for bookings this Date
    const {
      data,
      isLoading: isBookingsDateLoading,
      isFetching: isBookingsDateFetching,
    } = useGetRoadSignBookingByDateQuery({
      from_date: fromDate,
      to_date: toDate,
      product_type: productId,
    });
  

  const { data: cities, isLoading: isCitiesLoading } = useGetCitiesQuery();
  const [
    getActiveRegionsByCity,
    { data: regions, isLoading: isRegionsLoading },
  ] = useGetActiveRegionsByCityMutation();
  const { data: getRoadSignsModel, isLoading: isGetRoadSignsModel } =
    useGetRoadSignsModelQuery();

  // Fetches active regions when cityId changes
  useEffect(() => {
    if (cityId) { // Only call if cityId is set
      getActiveRegionsByCity(cityId);
    }
  }, [cityId, getActiveRegionsByCity]);

  // Fetch data for bookings this week
  const {
    data: bookingsData,
    isLoading: isBookingsLoading,
    isFetching: isBookingsFetching,
  } = useGetRoadSignBookingByWeekQuery({
    city_id: cityId,
    region_id: regionId,
    model: model,
  });

  // Fetch data for unbooked signs
  const {
    data: unbookedSignsData,
    isLoading: isUnbookedLoading,
    isFetching: isUnbookedFetching,
  } = useGetSoadSignDontHaveBookingQuery({
    city_id: cityId,
    region_id: regionId,
    model: model,
    from_date: fromDate,
    to_date: toDate,
  });

  // Handles city selection change
  const handleCityChange = useCallback((e) => {
    setCityId(e.target.value);
    setRegionId(""); // Reset region when city changes
  }, []); // Setters are stable, no dependencies

  // Handles region selection change
  const handleRegionChange = useCallback((e) => {
    setRegionId(e.target.value);
  }, []); // Setters are stable, no dependencies

  // Handles model selection change
  const handleModelChange = useCallback((e) => {
    setModel(e.target.value);
  }, []); // Setters are stable, no dependencies

  return {
    activeTab,
    setActiveTab,
    cityId,
    setCityId,
    regionId,
    setRegionId,
    model,
    setModel,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    cities,
    isCitiesLoading,
    regions,
    isRegionsLoading,
    getRoadSignsModel,
    isGetRoadSignsModel,
    bookingsData,
    isBookingsLoading,
    isBookingsFetching,
    unbookedSignsData,
    isUnbookedLoading,
    isUnbookedFetching,
    handleCityChange,
    handleRegionChange,
    handleModelChange,
    data ,
    isBookingsDateLoading ,
    isBookingsDateFetching ,
    productId ,
    setProductId 
  };
};

export default useReports;