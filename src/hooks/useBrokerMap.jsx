import { useState, useMemo, useCallback } from "react";
import { useGetRoadSignsQuery } from "../RtkQuery/Slice/RoadSings/RoadSingsApi";
import { useGetCitiesWithRegionsQuery } from "../RtkQuery/Slice/mediatorapis/MediatorApi";
import { showToast } from "../utils/Notifictions/showToast";

export const useBrokerMap = () => {
  const [filters, setFilters] = useState({
    city_id: "",
    region_id: "",
    direction: "",
    model: "",
    template_id: "",
    template_size: "",
  });
  
  const [selectedSign, setSelectedSign] = useState(null);
  const [mapCenter, setMapCenter] = useState([36.2127, 37.1258]);
  const [mapZoom, setMapZoom] = useState(13);
  const [lastClickedCoords, setLastClickedCoords] = useState(null);

  // Fetch all road signs data
  const { 
    data: roadSignsResponse, 
    isLoading, 
    isFetching, 
    error, 
    refetch 
  } = useGetRoadSignsQuery(filters);

  // Safely get road signs data (handle undefined)
  const roadSignsData = roadSignsResponse?.data || [];

  // Fetch cities for filter
  const { data: cities = [], isLoading: citiesLoading } = useGetCitiesWithRegionsQuery();

  const selectedCity = useMemo(() => 
    cities.find(c => c.id === parseInt(filters.city_id)), 
    [cities, filters.city_id]
  );
  
  const regions = selectedCity?.regions || [];

  // Prepare all markers data
  const markers = useMemo(() => {
    if (!roadSignsData || roadSignsData.length === 0) return [];
    
    return roadSignsData
      .filter(sign => sign.latitudeX && sign.longitudeY)
      .map(sign => {
        let status = "available";
        if (sign.is_booked === true) {
          status = "booked";
        } else if (sign.is_booked === "partial" || (sign.total_faces_on_date > 0 && sign.total_faces_on_date < sign.faces_number)) {
          status = "partial";
        }
        
        return {
          id: sign.id,
          lat: parseFloat(sign.latitudeX),
          lng: parseFloat(sign.longitudeY),
          status: status,
          roadsign_code: sign.roadsign_code,
          place: sign.place,
          directions: sign.directions,
          panels_number: sign.panels_number,
          faces_number: sign.faces_number,
          image: sign.image,
          location_image1: sign.location_image1,
          template: sign.template,
          city: sign.city,
          region: sign.region,
          bookings: sign.bookings || [],
        };
      });
  }, [roadSignsData]);

  const getMarkerStatus = useCallback((status) => {
    switch (status) {
      case "available":
        return { color: "#22c55e", label: "متاح", icon: "✓" };
      case "booked":
        return { color: "#ef4444", label: "محجوز", icon: "✗" };
      case "partial":
        return { color: "#f59e0b", label: "محجوز جزئياً", icon: "!" };
      default:
        return { color: "#6b7280", label: "غير معروف", icon: "?" };
    }
  }, []);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      if (key === "city_id") {
        newFilters.region_id = "";
      }
      return newFilters;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      city_id: "",
      region_id: "",
      direction: "",
      model: "",
      template_id: "",
      template_size: "",
    });
    showToast("info", "تم مسح جميع الفلاتر");
  }, []);

  const handleMarkerClick = useCallback((sign) => {
    setSelectedSign(sign);
    setMapCenter([sign.lat, sign.lng]);
    setMapZoom(18);
  }, []);

  const handleMapClick = useCallback((latlng) => {
    setLastClickedCoords({
      lat: latlng.lat.toFixed(6),
      lng: latlng.lng.toFixed(6)
    });
    setTimeout(() => setLastClickedCoords(null), 3000);
  }, []);

  const closeDetails = useCallback(() => {
    setSelectedSign(null);
  }, []);

  const refreshData = useCallback(() => {
    refetch();
    showToast("success", "تم تحديث البيانات");
  }, [refetch]);

  const stats = useMemo(() => {
    const total = markers.length;
    const available = markers.filter(m => m.status === "available").length;
    const booked = markers.filter(m => m.status === "booked").length;
    const partial = markers.filter(m => m.status === "partial").length;
    
    return { total, available, booked, partial };
  }, [markers]);

  return {
    filters,
    selectedSign,
    mapCenter,
    mapZoom,
    lastClickedCoords,
    markers,
    cities,
    regions,
    stats,
    isLoading: isLoading || isFetching,
    citiesLoading,
    error,
    handleFilterChange,
    clearFilters,
    handleMarkerClick,
    handleMapClick,
    closeDetails,
    refreshData,
    setMapCenter,
    setMapZoom,
    getMarkerStatus,
  };
};