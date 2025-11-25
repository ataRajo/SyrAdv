// MapDialog.jsx - UPDATED VERSION WITH SATELLITE MAP
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

// ✅ FIXED MARKER ICON
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
  buttonVariant = "default",
  className = "",
  initialLocation = null,
  enableSatelliteView = false, // ✅ NEW: Enable satellite view
  defaultMapType = "roadmap" // ✅ NEW: Default map type
}) {
  const [open, setOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [cityQuery, setCityQuery] = useState("");
  const [cityResults, setCityResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mapType, setMapType] = useState(defaultMapType); // ✅ NEW: Map type state
  const mapRef = useRef(null);
  const markerIcon = useRef(createMarkerIcon()).current;

  // ✅ SATELLITE MAP TILES
  const satelliteTiles = {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DigitalGlobe, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community'
  };

  // ✅ STANDARD MAP TILES
  const standardTiles = {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; OpenStreetMap contributors'
  };

  // ✅ TOGGLE BETWEEN MAP TYPES
  const toggleMapType = () => {
    setMapType(prev => prev === "roadmap" ? "satellite" : "roadmap");
  };

  const handleCitySearch = async () => {
    if (!cityQuery.trim()) {
      showToast("error", "الرجاء إدخال اسم المدينة أو المنطقة");
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&` +
        `q=${encodeURIComponent(cityQuery)}&` +
        `addressdetails=1&` +
        `limit=10&` +
        `accept-language=ar&` +
        `countrycodes=SY,SA,JO,LB,EG,AE,QA,BH,OM,KW,IQ&` +
        `featureType=city|town|suburb|neighbourhood`
      );
      
      const results = await response.json();
      
      console.log("Search results for:", cityQuery, results);
      
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
  }, [open, mapType]); // ✅ Added mapType dependency to refresh on change

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
        <Button variant={buttonVariant} className={className}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4 ml-2"
          >
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {buttonText}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>اختر الموقع على الخريطة</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* ✅ UPDATED: MAP CONTROLS SECTION */}
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex-shrink-0">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold text-blue-800">🗺️ تحكم في الخريطة:</h4>
              
              {/* ✅ MAP TYPE TOGGLE BUTTON */}
              {enableSatelliteView && (
                <Button 
                  onClick={toggleMapType}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {mapType === "satellite" ? (
                    <>
                      <span className="text-md text-gray-500">🌍 عرض عادي</span>
                    </>
                  ) : (
                    <>
                      <span className="text-md text-gray-500">🛰️ عرض ساتلايت</span>
                    </>
                  )}
                </Button>
              )}
            </div>
            
            {/* SEARCH INPUT */}
            <div className="flex gap-2">
              <input
                type="text"
                value={cityQuery}
                onChange={(e) => setCityQuery(e.target.value)}
                placeholder="ابحث عن مدينة أو منطقة..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm text-gray-800"
                onKeyPress={(e) => e.key === 'Enter' && handleCitySearch()}
              />
              <Button 
                onClick={handleCitySearch}
                disabled={isSearching}
                className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
              >
                {isSearching ? "جاري البحث..." : "بحث"}
              </Button>
            </div>
            
            {/* SEARCH RESULTS */}
            {cityResults.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-blue-700 mb-2">النتائج:</p>
                <div className="max-h-32 overflow-y-auto border border-gray-200 rounded bg-white">
                  {cityResults.map((city, index) => (
                    <div
                      key={index}
                      className="p-2 border-b border-gray-200 cursor-pointer hover:bg-blue-50 text-sm"
                      onClick={() => handleSelectCity(city)}
                    >
                      <div className="font-medium text-gray-800">
                        {city.display_name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SELECTED LOCATION PREVIEW */}
          {selectedLocation && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex-shrink-0">
              <h4 className="font-semibold text-green-800">📍 الموقع المختار:</h4>
              <p className="text-sm text-green-700">
                <strong>الموقع:</strong> {selectedLocation.cityName}
              </p>
              <p className="text-sm text-green-700">
                <strong>العنوان:</strong> {selectedLocation.address}
              </p>
              <p className="text-xs text-green-600">
                <strong>الإحداثيات:</strong> {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
              </p>
            </div>
          )}

          <div className="mb-4 flex justify-between items-center flex-shrink-0">
            <Button
              onClick={handleConfirmLocation}
              disabled={!selectedLocation}
              className="bg-green-600 hover:bg-green-700"
            >
              تأكيد الموقع المختار
            </Button>

            <p className="text-sm text-gray-600 text-center">
              💡 {mapType === "satellite" ? "استخدم الخريطة الساتلايتية للتحديد الدقيق" : "انقر على الخريطة للتحديد الدقيق"}
            </p>
          </div>

          {/* ✅ UPDATED: MAP CONTAINER */}
          <div className="flex-1 rounded-lg overflow-hidden border border-gray-300 min-h-0">
            <MapContainer
              whenCreated={(mapInstance) => {
                mapRef.current = mapInstance;
                setTimeout(() => {
                  mapInstance.invalidateSize();
                }, 100);
              }}
              center={initialLocation ? [initialLocation.lat, initialLocation.lng] : [33.5138, 36.2765]}
              zoom={initialLocation ? 16 : 10}
              style={{ height: "100%", width: "100%" }}
              className="z-0"
            >
              <TileLayer
                url={mapType === "satellite" ? satelliteTiles.url : standardTiles.url}
                attribution={mapType === "satellite" ? satelliteTiles.attribution : standardTiles.attribution}
              />
              <LocationPicker
                onLocationSelect={handleLocationSelect}
                initialLocation={selectedLocation || initialLocation}
                markerIcon={markerIcon}
              />
            </MapContainer>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default MapDialog;