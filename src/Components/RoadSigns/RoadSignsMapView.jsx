import { useState, useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { 
  useGetRoadSignsQuery,
  useGetRoadSignByIdQuery 
} from "../../RtkQuery/Slice/RoadSings/RoadSingsApi";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NavigationIcon, FilterIcon, LocateIcon, Loader2, Calendar, MapPin, Type, Ruler, Search, X } from "lucide-react";
import { showToast } from "../../utils/Notifictions/showToast";

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

// Component to handle user location
function UserLocation() {
  const map = useMap();
  const [userPosition, setUserPosition] = useState(null);
  const locationFoundRef = useRef(false);
  const locationAttemptRef = useRef(false);

  const checkLocationReasonableness = (latlng) => {
    const inaccurateLocations = [
      { lat: 48.8566, lng: 2.3522, name: "Paris" },
      { lat: 40.7128, lng: -74.0060, name: "New York" },
      { lat: 51.5074, lng: -0.1278, name: "London" },
      { lat: 0, lng: 0, name: "Null Island" },
      { lat: 37.7749, lng: -122.4194, name: "San Francisco" },
    ];
    
    const isInaccurate = inaccurateLocations.some(inaccurate => 
      Math.abs(latlng.lat - inaccurate.lat) < 0.5 &&
      Math.abs(latlng.lng - inaccurate.lng) < 0.5
    );
    
    const isValidCoordinate = 
      latlng.lat >= -90 && latlng.lat <= 90 && 
      latlng.lng >= -180 && latlng.lng <= 180;
    
    return !isInaccurate && isValidCoordinate;
  };

  const getIPBasedLocation = async () => {
    const services = [
      'https://ipapi.co/json/',
      'https://ipwho.is/',
      'https://json.geoiplookup.io/',
    ];

    for (const service of services) {
      try {
        const response = await fetch(service, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });
        
        if (response.ok) {
          const data = await response.json();
          
          let lat, lng;
          
          if (service.includes('ipapi.co')) {
            lat = data.latitude;
            lng = data.longitude;
          } else if (service.includes('ipwho') || service.includes('json.geoiplookup')) {
            lat = data.latitude;
            lng = data.longitude;
          } else if (service.includes('db-ip')) {
            lat = data.latitude;
            lng = data.longitude;
          }
          
          if (lat && lng) {
            const ipPosition = { lat: parseFloat(lat), lng: parseFloat(lng) };
            
            if (checkLocationReasonableness(ipPosition)) {
              setUserPosition(ipPosition);
              map.flyTo(ipPosition, 12);
              if (!locationFoundRef.current) {
                showToast("success", "تم تحديد موقعك بنجاح");
                locationFoundRef.current = true;
              }
              return true;
            }
          }
        }
      } catch (error) {
        console.warn(`IP location service failed: ${service}`, error);
        continue;
      }
    }
    
    const defaultPosition = { lat: 24.7136, lng: 46.6753 };
    setUserPosition(defaultPosition);
    map.flyTo(defaultPosition, 10);
    if (!locationFoundRef.current) {
      showToast("info", "استخدم زر تحديد الموقع للحصول على موقعك الدقيق");
    }
    return false;
  };

  const locateUser = () => {
    if (locationFoundRef.current && locationAttemptRef.current) return;

    locationAttemptRef.current = true;
    showToast("info", "جاري تحديد موقعك...");

    map.locate({
      setView: true,
      maxZoom: 14,
      enableHighAccuracy: true,
      timeout: 15000,
      watch: false
    });

    const handleLocationFound = (e) => {
      console.log("GPS location found:", e.latlng);
      
      const isReasonableLocation = checkLocationReasonableness(e.latlng);
      
      if (isReasonableLocation) {
        setUserPosition(e.latlng);
        map.flyTo(e.latlng, 14);
        if (!locationFoundRef.current) {
          showToast("success", "تم تحديد موقعك بنجاح");
          locationFoundRef.current = true;
        }
      } else {
        console.log("Unreasonable GPS location detected, trying IP-based...");
        getIPBasedLocation();
      }
    };

    const handleLocationError = (e) => {
      console.log("GPS location error:", e.message);
      getIPBasedLocation();
    };

    map.on('locationfound', handleLocationFound);
    map.on('locationerror', handleLocationError);

    const fallbackTimeout = setTimeout(() => {
      if (!locationFoundRef.current) {
        console.log("GPS timeout, trying IP location...");
        getIPBasedLocation();
      }
    }, 8000);

    return () => {
      clearTimeout(fallbackTimeout);
      map.off('locationfound', handleLocationFound);
      map.off('locationerror', handleLocationError);
    };
  };

  useEffect(() => {
    if (!locationFoundRef.current && !locationAttemptRef.current) {
      locateUser();
    }
  }, [map]);

  const handleManualLocate = () => {
    locationFoundRef.current = false;
    locationAttemptRef.current = false;
    showToast("info", "جاري إعادة تحديد موقعك...");
    locateUser();
  };

  return (
    <>
      {userPosition && (
        <Marker position={userPosition} icon={L.icon({
          iconUrl: "data:image/svg+xml;base64," + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#2563eb" width="24" height="24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/>
            </svg>
          `),
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })}>
          <Popup>
            <div className="text-center">
              <p className="font-semibold">موقعك الحالي</p>
              <p className="text-sm text-gray-600">
                {userPosition.lat.toFixed(6)}, {userPosition.lng.toFixed(6)}
              </p>
              <Button 
                size="sm" 
                variant="outline" 
                className="mt-2"
                onClick={handleManualLocate}
              >
                تحديث الموقع
              </Button>
            </div>
          </Popup>
        </Marker>
      )}
      
      <div className="leaflet-top leaflet-right">
        <div className="leaflet-control leaflet-bar">
          <button
            className="p-2 bg-white hover:bg-gray-100 text-gray-700 rounded shadow-md border"
            onClick={handleManualLocate}
            title="تحديد موقعي"
          >
            <LocateIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}

// Component to handle map zoom for search results
function MapZoomToLocation({ location }) {
  const map = useMap();

  useEffect(() => {
    if (location) {
      let finalZoom = location.zoom;
      
      if (location.type === "دولة") {
        finalZoom = Math.max(finalZoom, 9);
      } else if (location.type === "مدينة") {
        finalZoom = Math.max(finalZoom, 14);
      } else {
        finalZoom = Math.max(finalZoom, 12);
      }
      
      map.flyTo([location.coords[0], location.coords[1]], finalZoom, {
        duration: 2,
        easeLinearity: 0.25,
        animate: true
      });
      
      const marker = L.marker([location.coords[0], location.coords[1]], {
        icon: L.icon({
          iconUrl: "data:image/svg+xml;base64," + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ef4444" width="28" height="28">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/>
            </svg>
          `),
          iconSize: [28, 28],
          iconAnchor: [14, 28],
          popupAnchor: [0, -28]
        })
      }).addTo(map);
      
      marker.bindPopup(`
        <div class="text-center p-2 min-w-[200px]">
          <b class="text-lg">${location.name}</b><br/>
          <span class="text-sm text-gray-600">${location.type}</span><br/>
          <span class="text-xs text-gray-500">${location.coords[0].toFixed(4)}°, ${location.coords[1].toFixed(4)}°</span>
        </div>
      `).openPopup();
      
      setTimeout(() => {
        if (marker && map.hasLayer(marker)) {
          marker.remove();
        }
      }, 15000);
    }
  }, [location, map]);

  return null;
}

// Component to display road sign details in popup
const RoadSignDetails = ({ roadSignId }) => {
  const { data: roadSignDetails, isLoading, error } = useGetRoadSignByIdQuery(roadSignId);

  const getLatestEndDate = (details) => {
    if (!details?.bookings || details.bookings.length === 0) return null;
    
    const latestBooking = details.bookings.reduce((latest, booking) => {
      const bookingDate = new Date(booking.end_date);
      const latestDate = latest ? new Date(latest.end_date) : null;
      return !latestDate || bookingDate > latestDate ? booking : latest;
    }, null);
    
    if (latestBooking?.end_date) {
      return latestBooking.end_date.split('T')[0];
    }
    return null;
  };

  const isRoadSignAvailable = (details) => {
    const latestEndDate = getLatestEndDate(details);
    if (!latestEndDate) return true;
    
    const endDate = new Date(latestEndDate);
    const today = new Date();
    return endDate < today;
  };

  if (isLoading) {
    return (
      <div className="min-w-[250px] max-w-[80vw] p-3 text-center">
        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
        <p className="text-sm text-gray-600">جاري تحميل التفاصيل...</p>
      </div>
    );
  }

  if (error || !roadSignDetails) {
    return (
      <div className="min-w-[250px] max-w-[80vw] p-3 text-center">
        <p className="text-red-600 text-sm">حدث خطأ في تحميل التفاصيل</p>
      </div>
    );
  }

  const latestEndDate = getLatestEndDate(roadSignDetails);
  const isAvailable = isRoadSignAvailable(roadSignDetails);

  return (
    <div className="min-w-[250px] max-w-[80vw] w-auto">
      <div className="flex justify-between items-start mb-3 pb-2 border-b">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base text-gray-800 truncate">
            {roadSignDetails.template?.model || "لوحة طرقية"}
          </h3>
          <p className="text-xs text-gray-500">ID: {roadSignDetails.id}</p>
        </div>
        <Badge variant={isAvailable ? "default" : "destructive"} className="flex-shrink-0 ml-2 text-xs">
          {isAvailable ? "متاح" : "محجوز"}
        </Badge>
      </div>
      
      {roadSignDetails.image ? (
        <div className="mb-3">
          <img 
            src={roadSignDetails.image} 
            alt={`Road sign ${roadSignDetails.id}`}
            className="w-full h-32 object-cover rounded border"
          />
        </div>
      ) : (
        <div className="mb-3 bg-gray-100 rounded border h-20 flex items-center justify-center">
          <span className="text-xs text-gray-500">لا توجد صورة</span>
        </div>
      )}
      
      <div className="space-y-2">
        {roadSignDetails.template?.type && (
          <div className="flex items-start gap-2">
            <Type className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-gray-700">النوع:</span>
              <span className="text-xs text-gray-900 mr-1"> {roadSignDetails.template.type}</span>
            </div>
          </div>
        )}

        {roadSignDetails.template?.size && (
          <div className="flex items-start gap-2">
            <Ruler className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-gray-700">الحجم:</span>
              <span className="text-xs text-gray-900 mr-1"> {roadSignDetails.template.size}</span>
            </div>
          </div>
        )}

        {latestEndDate && (
          <div className="flex items-start gap-2">
            <Calendar className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-gray-700">تاريخ الانتهاء:</span>
              <div className="bg-red-50 border border-red-200 rounded px-2 py-1 mt-1">
                <span className="text-xs font-bold text-red-700">
                  {latestEndDate}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-start gap-2">
          <MapPin className="w-3 h-3 text-purple-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-gray-700">المدينة:</span>
            <span className="text-xs text-gray-900 mr-1">
              {roadSignDetails.city?.name || "غير محدد"}
            </span>
          </div>
        </div>

        {roadSignDetails.region?.name && (
          <div className="flex items-start gap-2 ml-5">
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-gray-700">المنطقة:</span>
              <span className="text-xs text-gray-900 mr-1"> {roadSignDetails.region.name}</span>
            </div>
          </div>
        )}

        {roadSignDetails.place && (
          <div className="mt-2 p-2 bg-gray-50 rounded border">
            <span className="text-xs font-medium text-gray-700 block mb-1">الموقع:</span>
            <p className="text-xs text-gray-600 leading-relaxed break-words">{roadSignDetails.place}</p>
          </div>
        )}

        {roadSignDetails.template?.advertising_space && (
          <div className="text-center pt-2 border-t">
            <span className="text-xs font-medium text-gray-700 block">مساحة الإعلان</span>
            <span className="text-sm font-semibold text-orange-600">
              {roadSignDetails.template.advertising_space} م²
            </span>
          </div>
        )}
      </div>
    </div>
  );
};


// 1. دالة للتحقق إذا كان الوجه محجوزاً
const isFaceBooked = (roadSign) => {
  if (!roadSign.bookings || !Array.isArray(roadSign.bookings) || roadSign.bookings.length === 0) {
    return false;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day
  
  for (const booking of roadSign.bookings) {
    if (!booking.start_date || !booking.end_date) continue;
    
    try {
      // Parse dates and normalize to start of day
      const startDate = new Date(booking.start_date);
      const endDate = new Date(booking.end_date);
      
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      // Check if today is within booking period
      if (today >= startDate && today <= endDate) {
        return true;
      }
    } catch (error) {
      console.error(`Error parsing dates for booking:`, error);
      continue;
    }
  }
  
  return false;
};

// 2. دالة للتحقق من الحالة الخاصة (وجه محجوز ووجه متاح)
const checkSpecialDualFaceCase = (roadSign, allRoadSigns) => {
  // فقط للوحات ذات وجهين (لها direction_code)
  if (roadSign.direction_code !== null && roadSign.direction_code !== undefined) {
    const roadSignCode = roadSign.roadsign_code;
    
    // ابحث عن الوجه الآخر بنفس الكود
    const otherFace = allRoadSigns.find(sign => 
      sign.roadsign_code === roadSignCode && 
      sign.direction_code !== roadSign.direction_code &&
      sign.id !== roadSign.id
    );
    
    if (otherFace) {
      const currentFaceBooked = isFaceBooked(roadSign);
      const otherFaceBooked = isFaceBooked(otherFace);
      
      // الحالة المطلوبة: وجه محجوز ووجه متاح
      return (currentFaceBooked && !otherFaceBooked) || (!currentFaceBooked && otherFaceBooked);
    }
  }
  return false;
};

// 3. دالة للحصول على معلومات الوجهين
const getDualFaceInfo = (roadSign, allRoadSigns) => {
  if (roadSign.direction_code === null || roadSign.direction_code === undefined) return null;
  
  const roadSignCode = roadSign.roadsign_code;
  const otherFace = allRoadSigns.find(sign => 
    sign.roadsign_code === roadSignCode && 
    sign.direction_code !== roadSign.direction_code
  );
  
  if (!otherFace) return null;
  
  return {
    currentFace: {
      direction: roadSign.direction_code,
      isBooked: isFaceBooked(roadSign),
      data: roadSign
    },
    otherFace: {
      direction: otherFace.direction_code,
      isBooked: isFaceBooked(otherFace),
      data: otherFace
    }
  };
};

const RoadSignsMapView = ({ viewType }) => {
  const { data: roadSignsResponse, isLoading, error } = useGetRoadSignsQuery();
  
  // Search functionality state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  
  // Existing state
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [selectedRoadSignId, setSelectedRoadSignId] = useState(null);

  // Function to search ANY location using OpenStreetMap Nominatim API
  const searchLocation = async (query) => {
    if (!query.trim()) return [];
    
    setIsSearching(true);
    showToast("info", "جاري البحث...");
    
    try {
      const encodedQuery = encodeURIComponent(query);
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&accept-language=ar&limit=10`
      );
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      
      const formattedResults = data.map((item, index) => {
        let locationType = "موقع";
        let displayName = item.display_name;
        
        if (item.class === "boundary" && item.type === "administrative") {
          locationType = item.type.includes("city") ? "مدينة" : 
                        item.type.includes("state") ? "ولاية" : 
                        item.type.includes("country") ? "دولة" : "منطقة";
        } else if (item.class === "place") {
          locationType = item.type === "city" ? "مدينة" :
                        item.type === "town" ? "بلدة" :
                        item.type === "village" ? "قرية" :
                        item.type === "hamlet" ? "حي" : "مكان";
        } else if (item.class === "highway") {
          locationType = "طريق";
        } else if (item.class === "amenity") {
          locationType = "مركز";
        }
        
        const arabicMatch = displayName.match(/[\u0600-\u06FF\s]+/g);
        const arabicName = arabicMatch ? arabicMatch.join(' ') : item.display_name.split(',')[0];
        
        let zoomLevel;
        
        switch(locationType) {
          case "دولة":
            zoomLevel = 9;
            break;
          case "ولاية":
          case "منطقة":
            zoomLevel = 10;
            break;
          case "مدينة":
            zoomLevel = 14;
            break;
          case "بلدة":
            zoomLevel = 15;
            break;
          case "قرية":
          case "حي":
            zoomLevel = 16;
            break;
          case "طريق":
            zoomLevel = 18;
            break;
          case "مركز":
          case "مكان":
            zoomLevel = 17;
            break;
          default:
            zoomLevel = item.importance > 0.7 ? 15 : item.importance > 0.5 ? 13 : 11;
        }
        
        const importantCities = [
          "paris", "london", "new york", "tokyo", "dubai", "riyadh",
          "دمشق", "حلب", "القاهرة", "الرياض", "دبي", "بيروت", "عمان"
        ];
        
        const lowerName = (arabicName || item.display_name).toLowerCase();
        if (importantCities.some(city => lowerName.includes(city))) {
          zoomLevel = Math.max(zoomLevel, 15);
        }
        
        if (item.boundingbox) {
          const [south, north, west, east] = item.boundingbox.map(parseFloat);
          const latDiff = north - south;
          const lonDiff = east - west;
          
          if (latDiff > 20 || lonDiff > 20) {
            zoomLevel = 8;
          } else if (latDiff > 10 || lonDiff > 10) {
            zoomLevel = 10;
          } else if (latDiff > 5 || lonDiff > 5) {
            zoomLevel = 12;
          } else if (latDiff > 2 || lonDiff > 2) {
            zoomLevel = 14;
          } else {
            zoomLevel = 16;
          }
        }
        
        return {
          id: index,
          name: arabicName || item.display_name.split(',')[0],
          fullName: item.display_name,
          coords: [parseFloat(item.lat), parseFloat(item.lon)],
          type: locationType,
          importance: item.importance,
          country: item.address?.country || "",
          city: item.address?.city || item.address?.town || "",
          zoom: zoomLevel,
          boundingbox: item.boundingbox
        };
      });
      
      formattedResults.sort((a, b) => {
        const aScore = b.importance + (a.zoom / 20);
        const bScore = a.importance + (b.zoom / 20);
        return bScore - aScore;
      });
      
      setSearchResults(formattedResults);
      
      if (formattedResults.length > 0) {
        const newSearch = {
          query,
          timestamp: new Date().toISOString(),
          results: formattedResults.length
        };
        
        setSearchHistory(prev => {
          const filtered = prev.filter(item => item.query !== query);
          return [newSearch, ...filtered].slice(0, 10);
        });
        
        showToast("success", `تم العثور على ${formattedResults.length} نتيجة`);
        
        if (formattedResults.length === 1) {
          handleResultClick(formattedResults[0]);
        }
      } else {
        showToast("warning", "لم يتم العثور على نتائج");
      }
      
      return formattedResults;
    } catch (error) {
      console.error("Error searching location:", error);
      showToast("error", "حدث خطأ في البحث");
      return [];
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      showToast("warning", "الرجاء إدخال كلمة البحث");
      return;
    }
    
    await searchLocation(searchQuery);
  };

  // Handle search result click
  const handleResultClick = (location) => {
    setSelectedLocation(location);
    setSearchQuery(location.name);
    setIsSearching(false);
    
    let message = `تم التوجه إلى ${location.name}`;
    if (location.type === "دولة") {
      message = `تم التوجه إلى ${location.name} (البلد)`;
    } else if (location.type === "مدينة") {
      message = `تم التوجه إلى ${location.name} (المدينة)`;
    } else if (location.type === "طريق") {
      message = `تم التوجه إلى ${location.name} (الطريق)`;
    }
    
    showToast("success", message);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setIsSearching(false);
    setSelectedLocation(null);
  };

  // Handle Enter key press in search
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Handle search from history
  const handleSearchFromHistory = async (query) => {
    setSearchQuery(query);
    await searchLocation(query);
  };

  // Safely extract road signs array from response
  const roadSigns = useMemo(() => {
    if (!roadSignsResponse) return [];
    
    if (Array.isArray(roadSignsResponse)) {
      return roadSignsResponse;
    } else if (roadSignsResponse?.data && Array.isArray(roadSignsResponse.data)) {
      return roadSignsResponse.data;
    } else if (roadSignsResponse?.results && Array.isArray(roadSignsResponse.results)) {
      return roadSignsResponse.results;
    } else if (typeof roadSignsResponse === 'object') {
      const arrayKeys = Object.keys(roadSignsResponse).filter(key => 
        Array.isArray(roadSignsResponse[key])
      );
      if (arrayKeys.length > 0) {
        return roadSignsResponse[arrayKeys[0]];
      }
    }
    
    console.warn("Unexpected road signs response structure:", roadSignsResponse);
    return [];
  }, [roadSignsResponse]);

  // Enhanced coordinate parsing
  const getCoordinates = (roadSign) => {
    try {
      const coordinateCandidates = [
        [roadSign.latitudeX, roadSign.longitudeY],
        [roadSign.lat, roadSign.lng],
        [roadSign.latitude, roadSign.longitude],
        [roadSign.x, roadSign.y],
        [roadSign.coord_x, roadSign.coord_y],
        [roadSign.location_x, roadSign.location_y],
        [roadSign.position_lat, roadSign.position_lng],
        [roadSign.location?.latitude, roadSign.location?.longitude],
        [roadSign.coordinates?.lat, roadSign.coordinates?.lng],
        [roadSign.position?.latitude, roadSign.position?.longitude],
      ];

      for (const [lat, lng] of coordinateCandidates) {
        if (lat !== undefined && lng !== undefined) {
          const latNum = parseFloat(lat);
          const lngNum = parseFloat(lng);
          
          if (!isNaN(latNum) && !isNaN(lngNum) && 
              latNum >= -90 && latNum <= 90 && 
              lngNum >= -180 && lngNum <= 180) {
            return [latNum, lngNum];
          }
        }
      }

      return null;
      
    } catch (error) {
      console.error(`Error parsing coordinates for road sign ${roadSign.id}:`, error);
      return null;
    }
  };

  // Filter road signs based on selection
  const filteredRoadSigns = useMemo(() => {
    if (!roadSigns || !Array.isArray(roadSigns)) return [];
    
    let filtered = roadSigns;
    
    if (selectedCity) {
      filtered = filtered.filter(sign => sign.city_id == selectedCity);
    }
    
    if (selectedRegion) {
      filtered = filtered.filter(sign => sign.region_id == selectedRegion);
    }
    
    return filtered;
  }, [roadSigns, selectedCity, selectedRegion]);

  // Get road signs with valid coordinates
  const roadSignsWithCoordinates = useMemo(() => {
    const signsWithCoords = filteredRoadSigns.filter(sign => getCoordinates(sign) !== null);
    return signsWithCoords;
  }, [filteredRoadSigns]);

  // Handle marker click
  const handleMarkerClick = (roadSignId) => {
    setSelectedRoadSignId(roadSignId);
  };

  if (isLoading) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">جاري تحميل اللوحات الطرقية...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>حدث خطأ في تحميل البيانات</p>
          <p className="text-sm">تأكد من اتصال الإنترنت وحاول مرة أخرى</p>
        </div>
      </div>
    );
  }

  if (!roadSigns || roadSigns.length === 0) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p>لا توجد لوحات طرقية متاحة</p>
          <p className="text-sm">قم بإضافة لوحات طرقية أولاً</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="ابحث عن أي دولة، مدينة، منطقة، شارع... (مثال: حلب، دمشق، فرنسا، نيويورك)"
                  className="w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-right text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {/* Search History */}
              {searchHistory.length > 0 && !searchQuery && (
                <div className="mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">عمليات البحث السابقة:</span>
                    <button 
                      onClick={() => setSearchHistory([])}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      مسح السجل
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {searchHistory.slice(0, 5).map((item, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearchFromHistory(item.query)}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded"
                      >
                        {item.query}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSearch}
                disabled={!searchQuery.trim() || isSearching}
                className="flex items-center gap-2"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                {isSearching ? "جاري البحث..." : "بحث"}
              </Button>
              <Button
                variant="outline"
                onClick={clearSearch}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                إعادة تعيين
              </Button>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-gray-700">نتائج البحث:</h3>
                <span className="text-xs text-gray-500">{searchResults.length} نتيجة</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="text-xs">
                        {result.type}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {result.importance.toFixed(2)}
                      </span>
                    </div>
                    <h4 className="font-medium text-sm mt-1 truncate">{result.name}</h4>
                    <p className="text-xs text-gray-600 truncate">{result.fullName}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">
                        {result.coords[0].toFixed(4)}, {result.coords[1].toFixed(4)}
                      </span>
                      <NavigationIcon className="w-3 h-3 text-blue-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters and Map Container */}
      <div className="flex flex-col lg:flex-row gap-4">
    

        {/* Map Container */}
        <div className={`flex-1 ${showFilters ? 'lg:w-[calc(100%-320px)]' : 'w-full'}`}>
          {/* Show Filters Button when hidden */}
          {!showFilters && (
            <Button
              variant="outline"
              className="mb-4"
              onClick={() => setShowFilters(true)}
            >
              <FilterIcon className="w-4 h-4 ml-2" />
              إظهار الفلاتر
            </Button>
          )}

          <div className="relative h-[600px] rounded-lg overflow-hidden border">
            <MapContainer
              center={[24.7136, 46.6753]}
              zoom={10}
              className="w-full h-full"
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* User Location Component */}
              <UserLocation />

              {/* Map Zoom to Selected Location */}
              {selectedLocation && <MapZoomToLocation location={selectedLocation} />}

              {/* Road Sign Markers */}
              {roadSignsWithCoordinates.map((roadSign) => {
                const coords = getCoordinates(roadSign);
                if (!coords) return null;

                // Check if this road sign has special dual face case
                const isSpecialDualFace = checkSpecialDualFaceCase(roadSign, roadSigns);
                
                // Get dual face info if available
                const dualFaceInfo = getDualFaceInfo(roadSign, roadSigns);
                
                let markerColor = "#6b7280"; 
                let markerIcon = "🚦"; 
                let isBooked = isFaceBooked(roadSign);
                
                if (isSpecialDualFace) {
                  // Special case: one face booked, one available
                  markerColor = "#f59e0b"; // Amber
                  markerIcon = "⚡"; // Special icon
                } else if (isBooked) {
                  markerColor = "#ef4444"; 
                 markerIcon = "📍";
                } else {
                  markerColor = "#10b981"; 
                  markerIcon = "📍"; // green pin
                }

                return (
                  <Marker
                    key={roadSign.id}
                    position={coords}
                    icon={L.divIcon({
                      html: `
                        <div style="
                          background-color: ${markerColor};
                          width: 32px;
                          height: 32px;
                          border-radius: 50%;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          color: white;
                          font-size: 16px;
                          border: 2px solid white;
                          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                          cursor: pointer;
                          position: relative;
                        ">
                          ${markerIcon}
                          ${dualFaceInfo ? `
                            <div style="
                              position: absolute;
                              top: -5px;
                              right: -5px;
                              background: ${dualFaceInfo.otherFace.isBooked ? '#ef4444' : '#10b981'};
                              width: 12px;
                              height: 12px;
                              border-radius: 50%;
                              border: 1px solid white;
                            "></div>
                          ` : ''}
                        </div>
                      `,
                      iconSize: [32, 32],
                      iconAnchor: [16, 16],
                      className: 'road-sign-marker'
                    })}
                    eventHandlers={{
                      click: () => handleMarkerClick(roadSign.id),
                    }}
                  >
                    <Popup
                      onClose={() => setSelectedRoadSignId(null)}
                      className="custom-popup"
                    >
                      <RoadSignDetails roadSignId={roadSign.id} />
                      
                      {/* Dual Face Information */}
                      {dualFaceInfo && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                          <h4 className="font-medium text-sm mb-2 text-center">
                            معلومات الوجهين
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            <div className={`text-center p-2 rounded ${dualFaceInfo.currentFace.isBooked ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                              <div className="text-xs font-semibold">الوجه الحالي</div>
                              <div className="text-xs">الاتجاه: {dualFaceInfo.currentFace.direction}</div>
                              <div className={`text-xs font-bold ${dualFaceInfo.currentFace.isBooked ? 'text-red-600' : 'text-green-600'}`}>
                                {dualFaceInfo.currentFace.isBooked ? 'محجوز' : 'متاح'}
                              </div>
                            </div>
                            <div className={`text-center p-2 rounded ${dualFaceInfo.otherFace.isBooked ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                              <div className="text-xs font-semibold">الوجه الآخر</div>
                              <div className="text-xs">الاتجاه: {dualFaceInfo.otherFace.direction}</div>
                              <div className={`text-xs font-bold ${dualFaceInfo.otherFace.isBooked ? 'text-red-600' : 'text-green-600'}`}>
                                {dualFaceInfo.otherFace.isBooked ? 'محجوز' : 'متاح'}
                              </div>
                            </div>
                          </div>
                          
                          {isSpecialDualFace && (
                            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-center">
                              <span className="text-xs font-semibold text-amber-700">
                                ⚡ حالة خاصة: وجه محجوز ووجه متاح
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>

            {/* Map Legend */}
            <div className="absolute bottom-4 left-4 bg-gray-700 p-3 rounded-lg shadow-lg z-[1000] border">
              <h4 className="font-semibold text-sm mb-2">مفتاح الخريطة</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <span className="text-xs">لوحات متاحة</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                  <span className="text-xs">لوحات محجوزة</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-amber-500"></div>
                  <span className="text-xs">وجه محجوز ووجه متاح</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  <span className="text-xs">موقعك الحالي</span>
                </div>
              </div>
            </div>

            {/* Current Location Display */}
            <div className="absolute top-4 right-4 bg-white p-2 rounded-lg shadow-lg z-[1000] border">
              {selectedLocation ? (
                <div className="text-xs">
                  <div className="font-semibold">الموقع المحدد:</div>
                  <div>{selectedLocation.name}</div>
                  <div className="text-gray-500 text-[10px]">
                    {selectedLocation.coords[0].toFixed(4)}, {selectedLocation.coords[1].toFixed(4)}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-500">لم يتم تحديد موقع</div>
              )}
            </div>
          </div>

          {/* Road Sign Summary */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">إجمالي اللوحات</p>
                    <p className="text-2xl font-bold">{roadSigns.length}</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-full">
                    <NavigationIcon className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">اللوحات المعروضة</p>
                    <p className="text-2xl font-bold">{filteredRoadSigns.length}</p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-full">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">بإحداثيات صالحة</p>
                    <p className="text-2xl font-bold">{roadSignsWithCoordinates.length}</p>
                  </div>
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Ruler className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoadSignsMapView;