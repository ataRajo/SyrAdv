//THIS ISFOR BROKER 

import { useState, useMemo, useCallback } from "react";
import { useGetRoadSignsQuery } from "../RtkQuery/Slice/RoadSings/RoadSingsApi";
import { useGetCitiesWithRegionsQuery } from "../RtkQuery/Slice/mediatorapis/MediatorApi";

const DEFAULT_SEARCH_FILTERS = {
  city_id: "",
  region_id: "",
  direction: "",
  model: "",
};

export const useRoadSignSearch = (startDate, endDate) => {
  const [searchFilters, setSearchFilters] = useState(DEFAULT_SEARCH_FILTERS);
  const [selectedRoadSigns, setSelectedRoadSigns] = useState([]);

  // Fetch cities & regions
  const { data: cities = [] } = useGetCitiesWithRegionsQuery();
  
  const selectedCity = useMemo(() => 
    cities.find(c => c.id === parseInt(searchFilters.city_id)),
    [cities, searchFilters.city_id]
  );
  
  const regions = selectedCity?.regions || [];

  // Fetch road signs with date range + filters
  const { 
    data: roadSignsData, 
    isLoading: roadSignsLoading,
    refetch: refetchRoadSigns,
  } = useGetRoadSignsQuery({
    ...searchFilters,
    start_date: startDate,
    end_date: endDate,
  });

  const roadSigns = roadSignsData?.data || [];

  // Filter out already selected signs
  const availableRoadSigns = useMemo(() => {
    const selectedIds = new Set(selectedRoadSigns.map(s => s.id));
    return roadSigns.filter(sign => !selectedIds.has(sign.id));
  }, [roadSigns, selectedRoadSigns]);

  // Calculate total price
  const totalPrice = useMemo(() => 
    selectedRoadSigns.reduce((total, sign) => {
      const facePrice = sign.template?.advertising_space || 0;
      return total + (facePrice * sign.booking_faces * sign.number_of_reserved_panels);
    }, 0),
    [selectedRoadSigns]
  );

  // Filter handlers
  const handleFilterChange = useCallback((key, value) => {
    setSearchFilters(prev => {
      const updated = { ...prev, [key]: value };
      if (key === 'city_id') updated.region_id = "";
      return updated;
    });
  }, []);

  const refetchWithDates = useCallback(() => {
    refetchRoadSigns();
  }, [refetchRoadSigns]);

  // Road sign selection handlers
  const addRoadSign = useCallback((sign, faceCount = 1, panelCount = 1, globalStartDate, globalEndDate) => {
    const newSign = {
      ...sign,
      road_sign_id: sign.id,
      booking_faces: faceCount,
      number_of_reserved_panels: panelCount,
      start_date: globalStartDate,
      end_date: globalEndDate,
    };
    setSelectedRoadSigns(prev => [...prev, newSign]);
  }, []);

  const removeRoadSign = useCallback((index) => {
    setSelectedRoadSigns(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateRoadSign = useCallback((index, field, value) => {
    const parsedValue = parseInt(value) || 1;
    setSelectedRoadSigns(prev => prev.map((sign, i) => 
      i === index ? { ...sign, [field]: parsedValue } : sign
    ));
  }, []);

  const clearAllSigns = useCallback(() => {
    setSelectedRoadSigns([]);
  }, []);

  const isSignSelected = useCallback((signId) => {
    return selectedRoadSigns.some(s => s.id === signId);
  }, [selectedRoadSigns]);

  return {
    // Data
    cities,
    regions,
    roadSigns,
    availableRoadSigns,
    selectedRoadSigns,
    totalPrice,
    
    // Loading
    roadSignsLoading,
    
    // Filters
    searchFilters,
    handleFilterChange,
    refetchWithDates,
    
    // Actions
    addRoadSign,
    removeRoadSign,
    updateRoadSign,
    clearAllSigns,
    isSignSelected,
  };
};