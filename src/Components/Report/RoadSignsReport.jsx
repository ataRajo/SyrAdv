import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Loader } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

import { useGetRoadSignsQuery } from "../../RtkQuery/Slice/RoadSings/RoadSingsApi";
import { useGetCitiesQuery } from "../../RtkQuery/Slice/CitiesAndRegions/CitiesAndRegionsApi";
import { useGetRoadSignBookingByWeekQuery } from "../../RtkQuery/Slice/Report/ReportApi";

import FiltersSection from './FiltersSection';
import ExportSection from './ExportSection';
import DataTableSection from './DataTableSection';
import { 
  formatArabicDate,
  calculateTotalAdvertisingSpace,
  calculateEndDate,
  getAllTemplateNames,
  getAllCustomers
} from './ReportUtils';

const RoadSignsReport = ({ isWeeklyReport = true }) => {
  // State for filters
  const [cityId, setCityId] = useState("");
  const [templateNameFilter, setTemplateNameFilter] = useState("");
  const [regionId, setRegionId] = useState("");
  const [placeFilter, setPlaceFilter] = useState("");
  const [productTypeFilter, setProductTypeFilter] = useState("");
  
  const [activeTab, setActiveTab] = useState(isWeeklyReport ? "unavailable" : "available");
  
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const printRef = useRef(null);
  const prevFiltersRef = useRef({});

  const { data: cities, isLoading: isCitiesLoading } = useGetCitiesQuery();

  const weeklyQueryParams = useMemo(() => {
    const params = {};
    
    if (isWeeklyReport) {
      if (startDate) params.from_date = startDate;
      if (endDate) params.to_date = endDate;
      if (cityId) params.city_id = cityId;
      if (regionId) params.region_id = regionId;
      if (placeFilter) params.place = placeFilter;
      if (templateNameFilter) params.model = templateNameFilter;
      if (productTypeFilter) params.product_type = productTypeFilter;
    }
    
    return params;
  }, [isWeeklyReport, startDate, endDate, cityId, regionId, placeFilter, templateNameFilter, productTypeFilter]);

  const detailsQueryParams = useMemo(() => {
    const params = {};
    
    if (!isWeeklyReport) {
      if (cityId) params.city_id = cityId;
      if (templateNameFilter) params.model = templateNameFilter;
    }
    
    return params;
  }, [isWeeklyReport, cityId, templateNameFilter]);

  // Use the appropriate API based on report type
  const { 
    data: weeklyReportData, 
    isLoading: isWeeklyReportLoading,
    isFetching: isWeeklyReportFetching,
    refetch: refetchWeeklyReport
  } = useGetRoadSignBookingByWeekQuery(
    isWeeklyReport ? weeklyQueryParams : {},
    { skip: !isWeeklyReport }
  );

  const { 
    data: roadSignsData, 
    isLoading: isRoadSignsLoading,
    isFetching: isRoadSignsFetching,
    refetch: refetchRoadSigns
  } = useGetRoadSignsQuery(
    !isWeeklyReport ? detailsQueryParams : {},
    { skip: isWeeklyReport }
  );



  
  {/*
 
    useEffect(() => {
    if (startDate && !endDate) {
      const calculatedEndDate = calculateEndDate(startDate, 6);
      setEndDate(calculatedEndDate);
    }
  }, [startDate]);


    */}


  

  // Set the loading states based on report type
  const isLoading = isWeeklyReport ? isWeeklyReportLoading : isRoadSignsLoading;
  const isFetching = isWeeklyReport ? isWeeklyReportFetching : isRoadSignsFetching;

  // Process weekly report data - optimized
  const processWeeklyData = useMemo(() => {
    if (!isWeeklyReport || !weeklyReportData) {
      return { data: [], total: 0, meta: {} };
    }
    
    let dataArray = [];
    let totalCount = 0;
    let meta = {};
    
    // Extract data from response - simplified
    if (Array.isArray(weeklyReportData)) {
      dataArray = weeklyReportData;
      totalCount = weeklyReportData.length;
    } 
    else if (weeklyReportData?.data && Array.isArray(weeklyReportData.data)) {
      dataArray = weeklyReportData.data;
      totalCount = weeklyReportData.total || weeklyReportData.data.length;
      meta = weeklyReportData.meta || {};
    }
    else if (weeklyReportData?.results && Array.isArray(weeklyReportData.results)) {
      dataArray = weeklyReportData.results;
      totalCount = weeklyReportData.count || weeklyReportData.results.length;
    }
    
    return {
      data: dataArray,
      total: totalCount,
      meta: meta
    };
  }, [weeklyReportData, isWeeklyReport]);

  // Process details data (available/unavailable) - OPTIMIZED
  const processDetailsData = useMemo(() => {
    if (isWeeklyReport) {
      return { available: [], unavailable: [], total: 0 };
    }
    
    if (!roadSignsData) {
      return { available: [], unavailable: [], total: 0 };
    }
    
    let dataArray = [];
    
    // Simplify data extraction logic
    if (Array.isArray(roadSignsData)) {
      dataArray = roadSignsData;
    } else if (roadSignsData?.data && Array.isArray(roadSignsData.data)) {
      dataArray = roadSignsData.data;
    } else if (roadSignsData?.results && Array.isArray(roadSignsData.results)) {
      dataArray = roadSignsData.results;
    } else if (roadSignsData?.items && Array.isArray(roadSignsData.items)) {
      dataArray = roadSignsData.items;
    }

    // Early return if no filtering needed
    if (!regionId && !placeFilter) {
      const available = dataArray.filter(item => !item.is_booked);
      const unavailable = dataArray.filter(item => item.is_booked === true);
      
      return { 
        available, 
        unavailable,
        total: dataArray.length
      };
    }

    // Apply filters in a single pass
    const filteredData = dataArray.filter(item => {
      // Apply region filter if selected
      if (regionId) {
        const itemRegionId = item.region?.id || item.region_id;
        if (itemRegionId != regionId) return false;
      }
      
      // Apply place filter if selected
      if (placeFilter) {
        const itemPlace = item.place || "";
        if (!itemPlace.toLowerCase().includes(placeFilter.toLowerCase())) return false;
      }
      
      return true;
    });

    
    const available = filteredData.filter(item => !item.is_booked);
    const unavailable = filteredData.filter(item => item.is_booked === true);


    return { 
      available, 
      unavailable,
      total: filteredData.length
    };
  }, [roadSignsData, isWeeklyReport, regionId, placeFilter]);

  // Get current data based on report type - optimized
  const currentData = useMemo(() => {
    if (isWeeklyReport) {
      return processWeeklyData.data || [];
    } else {
      const detailsData = processDetailsData;
      return activeTab === "available" ? 
        (detailsData.available || []) : 
        (detailsData.unavailable || []);
    }
  }, [
    isWeeklyReport,
    activeTab,
    processWeeklyData.data,
    processDetailsData.available,
    processDetailsData.unavailable
  ]);

  // Get all unique template names from data - optimized
  const templateOptions = useMemo(() => {
    if (isWeeklyReport) {
      if (!processWeeklyData.data || processWeeklyData.data.length === 0) {
        return [];
      }
      return getAllTemplateNames(processWeeklyData.data, true);
    }
    
    const allData = [
      ...(processDetailsData.available || []),
      ...(processDetailsData.unavailable || [])
    ];
    
    if (allData.length === 0) {
      return [];
    }
    
    return getAllTemplateNames(allData, false);
  }, [
    isWeeklyReport,
    processWeeklyData.data,
    processDetailsData.available,
    processDetailsData.unavailable
  ]);

  // Get unique customers from weekly data - optimized
  const customerOptions = useMemo(() => {
    if (!processWeeklyData.data || processWeeklyData.data.length === 0) {
      return [];
    }
    return getAllCustomers(processWeeklyData.data);
  }, [processWeeklyData.data]);

  // Memoize getRegionsForCity function
  const getRegionsForCity = useCallback(() => {
    if (!cityId || !cities) return [];
    const selectedCity = cities.find(city => city.id == cityId);
    return selectedCity?.regions || [];
  }, [cityId, cities]);

  // Refetch data when filters change - optimized to prevent unnecessary refetches
  useEffect(() => {
    const currentFilters = {
      cityId,
      templateNameFilter,
      startDate,
      endDate,
      regionId,
      placeFilter,
      productTypeFilter,
      isWeeklyReport
    };

    // Skip refetch if filters haven't changed
    if (JSON.stringify(prevFiltersRef.current) === JSON.stringify(currentFilters)) {
      return;
    }

    prevFiltersRef.current = currentFilters;

    if (isWeeklyReport) {
      refetchWeeklyReport();
    } else {
      refetchRoadSigns();
    }
  }, [
    cityId,
    templateNameFilter,
    startDate,
    endDate,
    regionId,
    placeFilter,
    productTypeFilter,
    isWeeklyReport,
    refetchWeeklyReport,
    refetchRoadSigns
  ]);

const clearAllFilters = useCallback(() => {
  setCityId("");
  setTemplateNameFilter("");
  setRegionId("");
  setPlaceFilter("");
  setProductTypeFilter("");
  setStartDate("");
  setEndDate("");
}, []);

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center">
        <Loader className="animate-spin" />
        <p className="text-muted-foreground text-sm">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-full mx-auto space-y-6 bg-background rounded-lg shadow-sm dark:shadow-gray-800">
      <h2 className="text-2xl font-bold text-foreground mb-4">
        {isWeeklyReport ? 'التقرير الأسبوعي للوحات المحجوزة' : 'تفاصيل اللوحات'}
      </h2>
      
      {/* Filters Section */}
      <FiltersSection
        isWeeklyReport={isWeeklyReport}
        cityId={cityId}
        setCityId={setCityId}
        regionId={regionId}
        setRegionId={setRegionId}
        templateNameFilter={templateNameFilter}
        setTemplateNameFilter={setTemplateNameFilter}
        productTypeFilter={productTypeFilter}
        setProductTypeFilter={setProductTypeFilter}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        placeFilter={placeFilter}
        setPlaceFilter={setPlaceFilter}
        cities={cities}
        isCitiesLoading={isCitiesLoading}
        getRegionsForCity={getRegionsForCity}
        templateOptions={templateOptions}
        customerOptions={customerOptions}
        clearAllFilters={clearAllFilters}
      />

      {/* Main Content */}
      <div className="space-y-4">
        {/* Export Buttons */}
        <ExportSection
          isWeeklyReport={isWeeklyReport}
          activeTab={activeTab}
          currentData={currentData}
          cities={cities}
          cityId={cityId}
          templateNameFilter={templateNameFilter}
          startDate={startDate}
          endDate={endDate}
          customerOptions={customerOptions}
          filterStartDate={startDate}
          filterEndDate={endDate}
        />

        {/* Data Table Section */}
        <DataTableSection
          isWeeklyReport={isWeeklyReport}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentData={currentData}
          processDetailsData={processDetailsData}
          isFetching={isFetching}
          templateNameFilter={templateNameFilter}
          formatArabicDate={formatArabicDate}
          startDate={startDate}
          endDate={endDate}
        />
      </div>
    </div>
  );
};

export default RoadSignsReport;