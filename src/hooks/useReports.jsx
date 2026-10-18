import React, { useState, useEffect, useCallback } from 'react';
import { useGetRoadSignBookingByDateQuery, useGetRoadSignBookingByWeekQuery, useGetSoadSignDontHaveBookingQuery } from '../RtkQuery/Slice/Report/ReportApi';
import { useGetRoadSignsModelQuery } from '../RtkQuery/Slice/RoadSings/RoadSingsApi';
import { useGetActiveRegionsByCityMutation, useGetCitiesQuery } from '../RtkQuery/Slice/CitiesAndRegions/CitiesAndRegionsApi';

const useReports = () => {
  const getDefaultDates = () => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 6); // +6 أيام للأمام
    
    return {
    fromDate: today.toISOString().split('T')[0], // اليوم
    toDate: nextWeek.toISOString().split('T')[0] // اليوم + 6 أيام
    };
  };

  const [activeTab, setActiveTab] = useState("bookings");
  const [cityId, setCityId] = useState("");
  const [regionId, setRegionId] = useState("");
  const [model, setModel] = useState("");
  
  // Set default dates (today to today+7 days)
  const defaultDates = getDefaultDates();
  const [fromDate, setFromDate] = useState(defaultDates.fromDate);
  const [toDate, setToDate] = useState(defaultDates.toDate);
  
  const [productId, setProductId] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerType, setCustomerType] = useState("");

  const handleCustomerTypeChange = useCallback((e) => {
    setCustomerType(e.target.value);
  }, []);

  // فلتر الزبون عبر CustomerSearchSelect (بحث من الخادم + تمرير لا نهائي) -
  // كان يجلب الصفحة الأولى فقط (20 زبونًا) فلا يظهر باقي الزبائن إطلاقًا.
  const [selectedCustomerObj, setSelectedCustomerObj] = useState(null);
  const isCustomersLoading = false;
  const customersError = null;
  const getCustomersArray = () => (selectedCustomerObj ? [selectedCustomerObj] : []);

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


  // Fetch data for bookings this week WITH DATES
  const {
    data: bookingsData,
    isLoading: isBookingsLoading,
    isFetching: isBookingsFetching,
  } = useGetRoadSignBookingByWeekQuery({
    city_id: cityId,
    region_id: regionId,
    model: model,
    from_date: fromDate, // TODAY
    to_date: toDate,     // TODAY + 7 DAYS
    customer_id: selectedCustomerId,
  });

  useEffect(() => {
    // احسب تاريخ اليوم + 7 أيام للتحقق
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
  }, [fromDate, toDate]);


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

  // يقبل حدث select تقليدي أو (id, customer) من CustomerSearchSelect.
  const handleCustomerChange = useCallback((eOrId, customer) => {
    const id = eOrId && typeof eOrId === "object" && "target" in eOrId ? eOrId.target.value : eOrId;
    setSelectedCustomerId(id || "");
    setSelectedCustomerObj(customer || null);
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
    customersData: getCustomersArray(),
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
    bookingsData: bookingsData || [],
    isBookingsLoading,
    isBookingsFetching,
    unbookedSignsData: unbookedSignsData || [],
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