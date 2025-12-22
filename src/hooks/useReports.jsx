import React, { useState, useEffect, useCallback } from 'react';
import { useGetRoadSignBookingByDateQuery, useGetRoadSignBookingByWeekQuery, useGetSoadSignDontHaveBookingQuery } from '../RtkQuery/Slice/Report/ReportApi';
import { useGetRoadSignsModelQuery } from '../RtkQuery/Slice/RoadSings/RoadSingsApi';
import { useGetActiveRegionsByCityMutation, useGetCitiesQuery } from '../RtkQuery/Slice/CitiesAndRegions/CitiesAndRegionsApi';
import { useGetCustomersQuery } from '../RtkQuery/Slice/Customers/CustomersApi';

const useReports = () => {
  const [activeTab, setActiveTab] = useState("bookings");
  const [cityId, setCityId] = useState();
  const [regionId, setRegionId] = useState();
  const [model, setModel] = useState();
  const [fromDate, setFromDate] = useState();
  const [toDate, setToDate] = useState();
  const [productId, setProductId] = useState();
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerType, setCustomerType] = useState("");

const handleCustomerTypeChange = useCallback((e) => {
  setCustomerType(e.target.value);
}, []);

  const { 
    data: customersData, 
    isLoading: isCustomersLoading,
    error: customersError 
  } = useGetCustomersQuery();
  
  const getCustomersArray = () => {
    if (!customersData) return [];
    
    if (Array.isArray(customersData)) {
      return customersData;
    } else if (Array.isArray(customersData.data)) {
      return customersData.data;
    } else if (Array.isArray(customersData.customers)) {
      return customersData.customers;
    } else if (Array.isArray(customersData.items)) {
      return customersData.items;
    } else if (customersData.data && Array.isArray(customersData.data.data)) {
      return customersData.data.data; // Double nested
    }
    
    console.warn("Unknown customers data structure:", customersData);
    return [];
  };

  const {
    data,
    isLoading: isBookingsDateLoading,
    isFetching: isBookingsDateFetching,
  } = useGetRoadSignBookingByDateQuery({
    from_date: fromDate,
    to_date: toDate,
    product_type: productId,
    customer_id: selectedCustomerId,
  });

  const { data: cities, isLoading: isCitiesLoading } = useGetCitiesQuery();
  const [
    getActiveRegionsByCity,
    { data: regions, isLoading: isRegionsLoading },
  ] = useGetActiveRegionsByCityMutation();
  const { data: getRoadSignsModel, isLoading: isGetRoadSignsModel } =
    useGetRoadSignsModelQuery();

  useEffect(() => {
    if (cityId) {
      getActiveRegionsByCity(cityId);
    }
  }, [cityId, getActiveRegionsByCity]);

  useEffect(() => {
    if (customersData) {
      console.log("Customers API Response:", customersData);
      console.log("Extracted customers array:", getCustomersArray());
    }
    if (customersError) {
      console.error("Customers API Error:", customersError);
    }
  }, [customersData, customersError]);

  // Fetch data for bookings this week
  const {
    data: bookingsData,
    isLoading: isBookingsLoading,
    isFetching: isBookingsFetching,
  } = useGetRoadSignBookingByWeekQuery({
    city_id: cityId,
    region_id: regionId,
    model: model,
    customer_id: selectedCustomerId,
  });

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
    customer_id: selectedCustomerId,
  });

  // Handlers
  const handleCityChange = useCallback((e) => {
    setCityId(e.target.value);
    setRegionId("");
  }, []);

  const handleRegionChange = useCallback((e) => {
    setRegionId(e.target.value);
  }, []);

  const handleModelChange = useCallback((e) => {
    setModel(e.target.value);
  }, []);

  const handleCustomerChange = useCallback((e) => {
    setSelectedCustomerId(e.target.value);
  }, []);

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
    productId,
    setProductId,
    selectedCustomerId,
    setSelectedCustomerId,
    customersData: getCustomersArray(), // ✅ Return extracted array
    isCustomersLoading,
    customerType,
  setCustomerType,
  handleCustomerTypeChange,
    customersError,
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
    handleCustomerChange,
    data,
    isBookingsDateLoading,
    isBookingsDateFetching,
  };
};

export default useReports;