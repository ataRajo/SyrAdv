// MapDialog.jsx - UPDATED WITH AUTO-NAVIGATION FROM FORM DATA
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import LocationPicker from "./LocationMarker";
import L from "leaflet";
import { showToast } from "./Notifictions/showToast";

// ✅ USE THE SAME MARKER ICON AS YOUR WORKING SECTION
const createMarkerIcon = () => {
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 21s-8-6-8-12a8 8 0 0 1 16 0c0 6-8 12-8 12z" fill="#ef4444"/>
      <circle cx="12" cy="9" r="2.5" fill="white"/>
    </svg>`
  );
  return L.icon({
    iconUrl: `data:image/svg+xml;charset=UTF-8,${svg}`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
};

export function MapDialog({
  onLocationSelect,
  buttonText = "اختر الموقع على الخريطة",
  buttonVariant = "outline",
  className = "",
  initialLocation = null,
  enableSatelliteView = false,
  defaultMapType = "roadmap",
  // ✅ NEW PROPS FOR FORM DATA
  formData = null // { city_id, region_id, place, etc. }
}) {
  const [open, setOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [cityQuery, setCityQuery] = useState("");
  const [cityResults, setCityResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mapType, setMapType] = useState(defaultMapType);
  const mapRef = useRef(null);
  const markerIcon = useRef(createMarkerIcon()).current;

  // ✅ USE THE SAME TILE CONFIGURATION AS YOUR WORKING SATELLITE SECTION
  const tileProviders = {
    roadmap: {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '&copy; OpenStreetMap contributors',
      name: "الخريطة العادية"
    },
    satellite: {
      // ✅ USE THE EXACT SAME URL AS YOUR WORKING SATELLITE SECTION
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: 'Tiles &copy; Esri',
      name: "القمر الاصطناعي"
    }
  };

  // ✅ AUTO-SEARCH BASED ON FORM DATA WHEN DIALOG OPENS
  useEffect(() => {
    if (open && formData) {
      // If we have form data, use it to search automatically
      const searchFromFormData = async () => {
        const searchTerms = [];
        
        // Add place if available
        if (formData.place && formData.place.trim()) {
          searchTerms.push(formData.place);
        }
        
        // Add city name if available (you might need to map city_id to city name)
        if (formData.city_id) {
          // You'll need to get city name from city_id - this depends on your data structure
          const cityName = await getCityNameById(formData.city_id);
          if (cityName) searchTerms.push(cityName);
        }
        
        // Add region name if available
        if (formData.region_id) {
          const regionName = await getRegionNameById(formData.region_id);
          if (regionName) searchTerms.push(regionName);
        }

        if (searchTerms.length > 0) {
          const searchQuery = searchTerms.join(", ");
          setCityQuery(searchQuery);
          await performSearch(searchQuery);
        }
      };

      searchFromFormData();
    }
  }, [open, formData]);

  // ✅ HELPER FUNCTION TO GET CITY NAME BY ID
  const getCityNameById = async (cityId) => {
    // You'll need to implement this based on your cities data
    // This could come from your selectData or a separate API call
    try {
      // Example - you might have cities data available globally
      const cities = JSON.parse(localStorage.getItem('cities') || '[]');
      const city = cities.find(c => c.id == cityId);
      return city ? city.name : null;
    } catch (error) {
      console.error("Error getting city name:", error);
      return null;
    }
  };

  // ✅ HELPER FUNCTION TO GET REGION NAME BY ID
  const getRegionNameById = async (regionId) => {
    // Similar to city name lookup
    try {
      const regions = JSON.parse(localStorage.getItem('regions') || '[]');
      const region = regions.find(r => r.id == regionId);
      return region ? region.name : null;
    } catch (error) {
      console.error("Error getting region name:", error);
      return null;
    }
  };

  // ✅ EXTRACTED SEARCH FUNCTION
  const performSearch = async (query) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&` +
        `q=${encodeURIComponent(query)}&` +
        `addressdetails=1&` +
        `limit=10&` +
        `accept-language=ar&` +
        `countrycodes=SY,SA,JO,LB,EG,AE,QA,BH,OM,KW,IQ&` +
        `featureType=city|town|suburb|neighbourhood`
      );
      
      const results = await response.json();
      setCityResults(results);
      
      if (results.length > 0) {
        showToast("success", `تم العثور على ${results.length} نتيجة`);
        const firstResult = results[0];
        handleSelectCity(firstResult);
      } else {
        showToast("warning", "لم يتم العثور على نتائج. جرب اسم آخر");
      }
    } catch (error) {
      console.error("City search error:", error);
      showToast("error", "حدث خطأ في البحث");
    } finally {
      setIsSearching(false);
    }
  };

  // ✅ SIMPLE TOGGLE - NO COMPLEX ERROR HANDLING
  const toggleMapType = () => {
    if (!enableSatelliteView) return;
    
    const newType = mapType === "roadmap" ? "satellite" : "roadmap";
    setMapType(newType);
    
    showToast("info", `تم التبديل إلى ${newType === "satellite" ? "القمر الاصطناعي" : "الخريطة العادية"}`);
  };

  const handleCitySearch = async () => {
    if (!cityQuery.trim()) {
      showToast("error", "الرجاء إدخال اسم المدينة أو المنطقة");
      return;
    }
    await performSearch(cityQuery);
  };

  const handleSelectCity = (city) => {
    const lat = parseFloat(city.lat);
    const lng = parseFloat(city.lon);
    
    const locationData = {
      lat,
      lng,
      address: city.display_name,
      cityName: city.name || city.display_name.split(',')[0]
    };
    
    setSelectedLocation(locationData);
    
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 13);
    }
    
    setCityResults([]);
    setCityQuery(city.display_name);
    
    showToast("success", `تم تحديد موقع ${locationData.cityName}`);
  };

  const handleLocationSelect = (locationData) => {
    setSelectedLocation(locationData);
  };

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      onLocationSelect?.(selectedLocation);
      setOpen(false);
      showToast("success", "تم اختيار الموقع بنجاح");
    } else {
      showToast("error", "الرجاء اختيار موقع أولاً");
    }
  };

  useEffect(() => {
    if (open && mapRef.current) {
      setTimeout(() => {
        mapRef.current.invalidateSize();
      }, 100);
    }
  }, [open, mapType]);

  useEffect(() => {
    if (initialLocation) {
      setSelectedLocation(initialLocation);
      if (mapRef.current) {
        try {
          mapRef.current.setView([initialLocation.lat, initialLocation.lng], 16);
        } catch (err) {
          console.error("Map view error:", err);
        }
      }
    }
  }, [initialLocation]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={buttonVariant} 
          className={`p-3 h-auto bg-transparent hover:bg-gray-100 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-all duration-200 ${className}`}
          title="اختر موقع اللوحة"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-blue-600"
          >
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-[98vw] w-[98vw] max-h-[98vh] h-[98vh] flex flex-col p-0 overflow-hidden bg-white">
        <DialogHeader className="p-4 flex-shrink-0 bg-white border-b border-gray-200">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-lg font-semibold text-gray-800">
              🗺️ تحديد موقع اللوحة
            </DialogTitle>
            <div className="flex items-center gap-2">
              {/* ✅ SIMPLE SATELLITE TOGGLE - LIKE YOUR WORKING SECTION */}
              {enableSatelliteView && (
                <Button 
                  onClick={toggleMapType}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 transition-colors duration-200"
                >
                  {mapType === "satellite" ? (
                    <>
                      <span className="text-lg">🌍</span>
                      <span className="text-xs">عرض عادي</span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg">🛰️</span>
                      <span className="text-xs">القمر الاصطناعي</span>
                    </>
                  )}
                </Button>
              )}
              
              <Button
                onClick={handleConfirmLocation}
                disabled={!selectedLocation}
                className="bg-green-600 hover:bg-green-700 text-white px-4"
                size="sm"
              >
                تأكيد الموقع
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* SEARCH SECTION */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 flex-shrink-0">
            {/* ✅ SHOW FORM DATA STATUS */}
            {formData && (
              <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-700 text-center">
                  📍 جاري البحث بناءً على البيانات المدخلة...
                </p>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
              <div className="flex-1 w-full md:w-auto">
                <div className="relative">
                  <input
                    type="text"
                    value={cityQuery}
                    onChange={(e) => setCityQuery(e.target.value)}
                    placeholder="🔍 ابحث عن مدينة أو منطقة..."
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    onKeyPress={(e) => e.key === 'Enter' && handleCitySearch()}
                  />
                  <Button 
                    onClick={handleCitySearch}
                    disabled={isSearching}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs"
                    size="sm"
                  >
                    {isSearching ? "..." : "بحث"}
                  </Button>
                </div>
              </div>

              {selectedLocation && (
                <div className="bg-white border border-green-200 rounded-lg px-3 py-2 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 text-lg">📍</span>
                    <div className="text-xs">
                      <div className="font-semibold text-green-800">{selectedLocation.cityName}</div>
                      <div className="text-gray-600">
                        {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {cityResults.length > 0 && (
              <div className="mt-3 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                {cityResults.map((city, index) => (
                  <div
                    key={index}
                    className="p-3 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors"
                    onClick={() => handleSelectCity(city)}
                  >
                    <div className="font-medium text-gray-800 text-sm">
                      {city.display_name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ✅ SIMPLE MAP - NO COMPLEX ERROR HANDLING */}
          <div className="flex-1 min-h-0 relative">
            <MapContainer
              whenCreated={(mapInstance) => {
                mapRef.current = mapInstance;
                setTimeout(() => {
                  mapInstance.invalidateSize();
                }, 100);
              }}
              center={initialLocation ? [initialLocation.lat, initialLocation.lng] : [33.5138, 36.2765]}
              zoom={initialLocation ? 16 : 12}
              style={{ height: "100%", width: "100%" }}
              className="z-0"
            >
              <TileLayer
                url={tileProviders[mapType].url}
                attribution={tileProviders[mapType].attribution}
              />
              <LocationPicker
                onLocationSelect={handleLocationSelect}
                initialLocation={selectedLocation || initialLocation}
                markerIcon={markerIcon}
              />
            </MapContainer>

            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm">
              💡 انقر على الخريطة لتحديد موقع اللوحة
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default MapDialog;