import { useState, useEffect, useMemo, useRef , useCallback } from "react";
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  useMap,
  LayersControl 
} from "react-leaflet";
import { 
  useGetRoadSignsQuery,
  useGetRoadSignByIdQuery 
} from "../../RtkQuery/Slice/RoadSings/RoadSingsApi";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  NavigationIcon, 
  FilterIcon, 
  LocateIcon, 
  Loader2, 
  Calendar, 
  MapPin, 
  Type, 
  Ruler, 
  Search, 
  X,
  Satellite,
  Map
} from "lucide-react";
import { showToast } from "../../utils/Notifictions/showToast";
import RoadSignsExport from "./RoadSignsExport";

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});


function UserLocation() {
  const map = useMap();
  const [userPosition, setUserPosition] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [hasFoundLocation, setHasFoundLocation] = useState(false);
  const timeoutRef = useRef(null);
  
  const getIPBasedLocation = useCallback(async () => {
    try {
      const response = await fetch('https://ipapi.co/json/', {
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.latitude && data.longitude) {
          const ipPosition = { 
            lat: parseFloat(data.latitude), 
            lng: parseFloat(data.longitude) 
          };
          
          setUserPosition(ipPosition);
          map.flyTo(ipPosition, 10);
          setAccuracy(5000);
          showToast("info", "تم تحديد موقعك تقريبياً");
          setHasFoundLocation(true);
          return true;
        }
      }
    } catch (error) {
      console.warn("IP location failed:", error);
    }
    
    // الموقع الافتراضي لحلب
    const aleppoPosition = { lat: 36.2021, lng: 37.1343 };
    setUserPosition(aleppoPosition);
    map.flyTo(aleppoPosition, 12);
    setAccuracy(10000);
    setHasFoundLocation(true);
    
    showToast("info", "تم التوجه إلى حلب");
    return false;
  }, [map]);

  const locateUser = useCallback(() => {
    if (isLocating) return;
    
    // تنظيف أي عمليات سابقة
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setIsLocating(true);
    showToast("info", "جاري تحديد موقعك...");

    const handleLocationFound = (e) => {
      console.log("موقع المستخدم:", e.latlng, "الدقة:", e.accuracy);
      
      setUserPosition(e.latlng);
      setAccuracy(e.accuracy);
      
      // تحديد مستوى التكبير بناءً على الدقة
      let zoomLevel = 15;
      if (e.accuracy > 100) zoomLevel = 14;
      if (e.accuracy > 500) zoomLevel = 13;
      if (e.accuracy > 1000) zoomLevel = 12;
      if (e.accuracy > 5000) zoomLevel = 10;
      
      map.flyTo(e.latlng, zoomLevel, {
        duration: 1.5,
        animate: true
      });
      
      // إضافة دائرة توضح دقة الموقع
      if (e.accuracy < 10000) {
        const accuracyCircle = L.circle(e.latlng, {
          radius: e.accuracy,
          color: '#3b82f6',
          fillColor: '#60a5fa',
          fillOpacity: 0.15,
          weight: 1
        }).addTo(map);
        
        accuracyCircle.bindPopup(`دقة الموقع: ${Math.round(e.accuracy)} متر`).openPopup();
      }
      
      const accuracyText = e.accuracy < 50 ? "دقيقة جداً" :
                          e.accuracy < 200 ? "دقيقة" :
                          e.accuracy < 1000 ? "جيدة" : "تقريبية";
      
      showToast("success", `تم تحديد موقعك (${accuracyText})`);
      setHasFoundLocation(true);
      setIsLocating(false);
      
      // تنظيف event listeners
      map.off('locationfound', handleLocationFound);
      map.off('locationerror', handleLocationError);
      
      // تنظيف timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const handleLocationError = (e) => {
      console.log("خطأ في تحديد الموقع:", e.message);
      
      let errorMessage = "تعذر تحديد موقعك";
      switch(e.code) {
        case 1:
          errorMessage = "الرجاء السماح بالوصول إلى الموقع";
          break;
        case 2:
          errorMessage = "جهازك لا يدعم خدمة الموقع";
          break;
        case 3:
          errorMessage = "انتهى وقت الانتظار";
          break;
      }
      
      showToast("warning", errorMessage);
      
      // استخدام الموقع التقريبي
      getIPBasedLocation();
      
      // تنظيف event listeners
      map.off('locationfound', handleLocationFound);
      map.off('locationerror', handleLocationError);
      
      // تنظيف timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    // إضافة event listeners
    map.on('locationfound', handleLocationFound);
    map.on('locationerror', handleLocationError);

    // محاولة تحديد الموقع
    map.locate({
      setView: false,
      maxZoom: 15,
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      watch: false
    });

    // وقت الانتظار الاحتياطي
    timeoutRef.current = setTimeout(() => {
      if (!hasFoundLocation) {
        getIPBasedLocation();
      }
      map.off('locationfound', handleLocationFound);
      map.off('locationerror', handleLocationError);
      setIsLocating(false);
    }, 11000);

  }, [map, isLocating, hasFoundLocation, getIPBasedLocation]);

  useEffect(() => {
    // عند التحميل الأول، التوجه مباشرة إلى حلب
    const aleppoPosition = { lat: 36.2021, lng: 37.1343 };
    setUserPosition(aleppoPosition);
    map.flyTo(aleppoPosition, 12);
    setAccuracy(10000);
    setHasFoundLocation(true);
    
    // تنظيف عند unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [map]);

  const handleManualLocate = () => {
    setHasFoundLocation(false);
    locateUser();
  };

  return (
    <>
      {userPosition && (
        <Marker position={userPosition} icon={L.icon({
          iconUrl: "data:image/svg+xml;base64," + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3b82f6">
              <circle cx="12" cy="12" r="10" fill="#3b82f6" opacity="0.8"/>
              <circle cx="12" cy="12" r="5" fill="white"/>
              <path d="M12 2a10 10 0 0 0-10 10 10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2zm0 14a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" fill="none" stroke="white" stroke-width="1"/>
            </svg>
          `),
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        })}>
          <Popup>
            <div className="text-center min-w-[180px]">
              <p className="font-bold text-blue-700">موقعك الحالي</p>
              <p className="text-sm text-gray-600 mt-1">
                {userPosition.lat.toFixed(5)}, {userPosition.lng.toFixed(5)}
              </p>
              {accuracy && (
                <p className="text-xs mt-1">
                  <span className="font-semibold">الدقة:</span> 
                  <span className="text-blue-600 ml-1">
                    {accuracy < 1000 ? `${Math.round(accuracy)} م` : `${(accuracy/1000).toFixed(1)} كم`}
                  </span>
                </p>
              )}
              <Button 
                size="sm" 
                variant="outline" 
                className="mt-2 w-full"
                onClick={handleManualLocate}
                disabled={isLocating}
              >
                {isLocating ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin ml-2" />
                    جاري التحديث...
                  </>
                ) : 'تحديث الموقع'}
              </Button>
            </div>
          </Popup>
        </Marker>
      )}
      
      {/* زر تحديد الموقع */}
      <div className="leaflet-top leaflet-right">
        <div className="leaflet-control leaflet-bar" style={{ marginTop: '70px' }}>
          <button
            className="p-3 bg-white hover:bg-blue-50 text-blue-600 rounded-full shadow-lg border border-blue-300"
            onClick={handleManualLocate}
            title="حدد موقعي"
            disabled={isLocating}
            style={{
              width: '44px',
              height: '44px',
              animation: !hasFoundLocation ? 'pulse 1.5s infinite' : 'none'
            }}
          >
            {isLocating ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              <LocateIcon className="w-5 h-5 mx-auto" />
            )}
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
       <div className="mb-3 flex justify-center">
  <img 
    src={roadSignDetails.image} 
    alt={`Road sign ${roadSignDetails.id}`}
    className="max-w-full max-h-32 w-auto h-auto rounded border"
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
                            <span className="text-xs text-gray-900 mr-1"> {roadSignDetails.template.size}</span>

              <span className="text-xs font-medium text-gray-700">الحجم:</span>
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

          {roadSignDetails.directions && (
          <div className="flex items-start gap-2">
            <NavigationIcon className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-gray-700">الاتجاه:</span>
              <span className="text-xs text-gray-900 mr-1"> {roadSignDetails.directions}</span>
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
           
          </div>
        )}
      </div>
    </div>
  );
};

// 1. دالة مبسطة للتحقق إذا كان الوجه محجوزاً
const isFaceBooked = (roadSign) => {
  // الاستخدام الأمثل: استخدام is_booked من الاستجابة مباشرة
  if (roadSign.is_booked !== undefined) {
    return roadSign.is_booked === true;
  }
  
  // Fallback: التحقق من الحجوزات السابقة
  if (!roadSign.bookings || !Array.isArray(roadSign.bookings) || roadSign.bookings.length === 0) {
    return false;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // البحث عن حجز نشط اليوم
  for (const booking of roadSign.bookings) {
    if (!booking.start_date || !booking.end_date) continue;
    
    try {
      // التحقق من حالة الموافقة
      const isApproved = booking.approvement_status === 2;
      
      if (!isApproved) continue;
      
      const startDate = new Date(booking.start_date);
      const endDate = new Date(booking.end_date);
      
      // إعادة ضبط الساعات للمقارنة الصحيحة
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      
      // التحقق إذا كان اليوم ضمن فترة الحجز
      if (today >= startDate && today <= endDate) {
        return true;
      }
    } catch (error) {
      console.error(`Error parsing dates for booking ${booking.id}:`, error);
      continue;
    }
  }
  
  return false;
};

// 2. دالة للتحقق من الحالة الخاصة (وجه محجوز ووجه متاح)
const checkSpecialDualFaceCase = (roadSign, allRoadSigns) => {
  // التحقق من وجود direction_code للوحات ذات الوجهين
  if (roadSign.direction_code !== null && roadSign.direction_code !== undefined) {
    const roadSignCode = roadSign.roadsign_code;
    
    if (!roadSignCode) return false;
    
    // البحث عن الوجه الآخر بنفس الكود
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
  if (!roadSignCode) return null;
  
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



const RoadSignsMapView = ({ viewType = "map" }) => {
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
  
  // State for satellite view control
  const [mapType, setMapType] = useState(viewType);

  // ✅ SELECTION MODE STATE
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedRoadSigns, setSelectedRoadSigns] = useState([]);
  const [isExporting, setIsExporting] = useState(false);


const [markerFilter, setMarkerFilter] = useState("all"); // "all", "booked", "available"

// Filter functions
const handleFilterAll = () => {
  setMarkerFilter("all");
  showToast("info", "عرض جميع اللوحات");
};

const handleFilterBooked = () => {
  setMarkerFilter("booked");
  showToast("info", "عرض اللوحات المحجوزة فقط");
};

const handleFilterAvailable = () => {
  setMarkerFilter("available");
  showToast("info", "عرض اللوحات المتاحة فقط");
};

  // ✅ SELECTION MODE FUNCTIONS
  const handleMarkerSelect = (roadSign) => {
    if (!selectionMode) return;
    
    setSelectedRoadSigns(prev => {
      const isAlreadySelected = prev.some(item => item.id === roadSign.id);
      if (isAlreadySelected) {
        return prev.filter(item => item.id !== roadSign.id);
      } else {
        return [...prev, {
          id: roadSign.id,
          name: roadSign.template?.model || `لوحة ${roadSign.id}`,
          place: roadSign.place,
          coords: getCoordinates(roadSign)
        }];
      }
    });
  };

  const clearSelections = () => {
    setSelectedRoadSigns([]);
    showToast("info", "تم إلغاء تحديد جميع اللوحات");
  };

  const cancelSelectionMode = () => {
    setSelectionMode(false);
    setSelectedRoadSigns([]);
    showToast("info", "تم إلغاء وضع الاختيار");
  };

  // ✅ Selection Toolbar Component
  const SelectionToolbar = () => {
    if (!selectionMode) return null;
    
    return (
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-white rounded-lg shadow-lg border p-3 min-w-[300px]">
        <RoadSignsExport 
          selectedRoadSigns={selectedRoadSigns}
          onClearSelections={clearSelections}
          onCancelMode={cancelSelectionMode}
          isExporting={isExporting}
          setIsExporting={setIsExporting}
        />
      </div>
    );
  };

  // Update map type when viewType prop changes
  useEffect(() => {
    setMapType(viewType);
  }, [viewType]);

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
  let signsWithCoords = filteredRoadSigns.filter(sign => getCoordinates(sign) !== null);
  
  // Apply marker filter
  if (markerFilter === "booked") {
    signsWithCoords = signsWithCoords.filter(sign => isFaceBooked(sign) === true);
  } else if (markerFilter === "available") {
    signsWithCoords = signsWithCoords.filter(sign => isFaceBooked(sign) === false && checkSpecialDualFaceCase(sign, roadSigns) === false);
  }
  
  return signsWithCoords;
}, [filteredRoadSigns, markerFilter, roadSigns]);

  // Handle marker click
  const handleMarkerClick = (roadSignId) => {
    setSelectedRoadSignId(roadSignId);
  };

  // Toggle between map and satellite view
  const toggleMapType = () => {
    setMapType(prev => prev === "map" ? "satellite" : "map");
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
              {/* Base Layers */}
              <LayersControl position="topright">
                {/* Standard Map Layer */}
                <LayersControl.BaseLayer 
                  checked={mapType === "map"} 
                  name="الخريطة العادية"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={19}
                    detectRetina={true}
                  />
                </LayersControl.BaseLayer>
                
                {/* Satellite Layer */}
                <LayersControl.BaseLayer 
                  checked={mapType === "satellite"} 
                  name="القمر الاصطناعي"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.esri.com/">Esri</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    maxZoom={19}
                    detectRetina={true}
                  />
                </LayersControl.BaseLayer>
                
                {/* Hybrid Satellite Layer (with labels) */}
                <LayersControl.BaseLayer 
                  checked={false} 
                  name="القمر الاصطناعي مع التسميات"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.esri.com/">Esri</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    maxZoom={19}
                    detectRetina={true}
                  />
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={19}
                    opacity={0.5}
                    detectRetina={true}
                  />
                </LayersControl.BaseLayer>
                
                {/* Topographic Map */}
                <LayersControl.BaseLayer 
                  checked={false} 
                  name="الخريطة الطبوغرافية"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
                    maxZoom={19}
                    detectRetina={true}
                  />
                </LayersControl.BaseLayer>
                
                {/* Dark Mode Map */}
                <LayersControl.BaseLayer 
                  checked={false} 
                  name="الوضع المظلم"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    maxZoom={19}
                    detectRetina={true}
                  />
                </LayersControl.BaseLayer>
              </LayersControl>

              {/* User Location Component */}
              <UserLocation />

              {/* Map Zoom to Selected Location */}
              {selectedLocation && <MapZoomToLocation location={selectedLocation} />}

              {/* Road Sign Markers */}
           {roadSignsWithCoordinates.map((roadSign) => {
  const coords = getCoordinates(roadSign);
  if (!coords) return null;

  // استخدام is_booked مباشرة من الاستجابة
  const isBooked = isFaceBooked(roadSign);
  
  // الحصول على معلومات الوجهين
  const dualFaceInfo = getDualFaceInfo(roadSign, roadSigns);
  const isSpecialDualFace = checkSpecialDualFaceCase(roadSign, roadSigns);
  
  // ✅ Check if this road sign is selected
  const isSelected = selectedRoadSigns.some(item => item.id === roadSign.id);
  
  // تحديد لون ورمز الماركر بناءً على الحالة
  let markerColor, markerIcon, markerText;
  
  if (selectionMode && isSelected) {
    // Selected marker in selection mode - Purple
    markerColor = "#8b5cf6";
    markerIcon = "✓";
    markerText = "مختار";
  } else if (isBooked) {
    // محجوز - أحمر
    markerColor = "#ef4444";
    markerIcon = "🔴";
    markerText = "محجوز";
  } else if (isSpecialDualFace) {
    // حالة خاصة: وجه محجوز ووجه متاح - برتقالي
    markerColor = "#f59e0b";
    markerIcon = "⚡";
    markerText = "وجهين";
  } else {
    // متاح - أخضر
    markerColor = "#10b981";
    markerIcon = "🟢";
    markerText = "متاح";
  }

  return (

    <Marker
      key={roadSign.id}
      position={coords}
      icon={L.divIcon({
        html: `
          <div style="
            background-color: ${markerColor};
            width: ${selectionMode && isSelected ? '48px' : '40px'};
            height: ${selectionMode && isSelected ? '48px' : '40px'};
            border-radius: 50%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: ${selectionMode && isSelected ? '20px' : '16px'};
            border: ${selectionMode && isSelected ? '4px solid #fbbf24' : '3px solid white'};
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            cursor: ${selectionMode ? 'pointer' : 'default'};
            position: relative;
            font-weight: bold;
            text-align: center;
            line-height: 1;
            padding-top: 2px;
            transition: all 0.2s ease;
          ">
            <div style="font-size: ${selectionMode && isSelected ? '22px' : '18px'}; margin-bottom: 2px;">${selectionMode && isSelected ? '✓' : markerIcon}</div>
            <div style="font-size: 9px; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">${selectionMode && isSelected ? 'مختار' : markerText}</div>
            ${dualFaceInfo && !selectionMode ? `
              <div style="
                position: absolute;
                top: -5px;
                right: -5px;
                background: ${dualFaceInfo.otherFace.isBooked ? '#ef4444' : '#10b981'};
                width: 16px;
                height: 16px;
                border-radius: 50%;
                border: 2px solid white;
                font-size: 9px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
              ">
                ${dualFaceInfo.otherFace.direction || ''}
              </div>
            ` : ''}
          </div>
        `,
        iconSize: [selectionMode && isSelected ? 48 : 40, selectionMode && isSelected ? 48 : 40],
        iconAnchor: [selectionMode && isSelected ? 24 : 20, selectionMode && isSelected ? 48 : 40],
        popupAnchor: [0, selectionMode && isSelected ? -48 : -40],
        className: 'road-sign-marker'
      })}
      eventHandlers={{
        click: () => {
          if (selectionMode) {
            handleMarkerSelect(roadSign);
          } else {
            handleMarkerClick(roadSign.id);
          }
        },
      }}
    >
      {/* Only show popup when NOT in selection mode */}
      {!selectionMode && (
        <Popup
          onClose={() => setSelectedRoadSignId(null)}
          className="custom-popup"
          minWidth={300}
          maxWidth={400}
        >
          <RoadSignDetails roadSignId={roadSign.id} />
          
   <div className="mt-3 pt-3 border-t">
    <Button
      onClick={() => {
        const roadSignCoords = getCoordinates(roadSign);
        if (roadSignCoords) {
          const url = `https://www.google.com/maps/search/?api=1&query=${roadSignCoords[0]},${roadSignCoords[1]}`;
          window.open(url, '_blank');
        } else {
          showToast("error", "لا توجد إحداثيات صالحة لهذه اللوحة");
        }
      }}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      size="sm"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="w-4 h-4 ml-2" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" 
        />
      </svg>
      فتح الموقع في خرائط جوجل
    </Button>
  </div>


        {/* Booking Status Section */}
        <div className="mt-4">
          <div className={`p-3 rounded-lg text-center font-bold ${isBooked ? 'bg-red-50 border-2 border-red-200' : 'bg-green-50 border-2 border-green-200'}`}>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">{isBooked ? '🔴' : '🟢'}</span>
              <span className={`text-lg ${isBooked ? 'text-red-700' : 'text-green-700'}`}>
                {isBooked ? 'محجوز حالياً' : 'متاح للحجز'}
              </span>
            </div>
            
            {isBooked && roadSign.bookings && roadSign.bookings.length > 0 && (
              <div className="mt-2 text-sm text-gray-700">
                <div className="font-medium mb-1">تفاصيل الحجز:</div>
                {roadSign.bookings
                  .filter(booking => booking.approvement_status === 2)
                  .slice(0, 1) // عرض آخر حجز فقط
                  .map(booking => (
                    <div key={booking.id} className="bg-white p-2 rounded border">
                      <div className="flex justify-between">
                        <span className="text-gray-600">من:</span>
                        <span className="font-semibold">{booking.start_date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">إلى:</span>
                        <span className="font-semibold">{booking.end_date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">العميل:</span>
                        <span className="font-semibold">{booking.customer?.full_name || 'غير معروف'}</span>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
          
          {/* Dual Face Information */}
 {dualFaceInfo && (
  <div className="mt-4 p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
    <h4 className="font-bold text-sm mb-3 text-center text-blue-800">
      ⚡ معلومات الوجهين
    </h4>
    <div className="grid grid-cols-2 gap-3">
      {/* Current Face */}
      <div className={`text-center p-3 rounded-lg ${dualFaceInfo.currentFace.isBooked ? 'bg-red-100 border border-red-300' : 'bg-green-100 border border-green-300'}`}>
        <div className="font-semibold text-sm mb-1">الوجه الحالي</div>
        <div className="text-xs text-gray-600 mb-1">اتجاه: {dualFaceInfo.currentFace.direction || '---'}</div>
        
        {/* الاتجاه for current face */}
        {dualFaceInfo.currentFace.data?.directions && (
          <div className="text-xs text-gray-700 mb-1">
            <span className="font-medium">الاتجاه:</span><br/>
            {dualFaceInfo.currentFace.data.directions}
          </div>
        )}
        
        <div className={`text-sm font-bold py-1 rounded ${dualFaceInfo.currentFace.isBooked ? 'text-red-700' : 'text-green-700'}`}>
          {dualFaceInfo.currentFace.isBooked ? '🔒 محجوز' : '🔓 متاح'}
        </div>
      </div>
      
      <div className={`text-center p-3 rounded-lg ${dualFaceInfo.otherFace.isBooked ? 'bg-red-100 border border-red-300' : 'bg-green-100 border border-green-300'}`}>
        <div className="font-semibold text-sm mb-1">الوجه الآخر</div>
        <div className="text-xs text-gray-600 mb-1">اتجاه: {dualFaceInfo.otherFace.direction || '---'}</div>
        
        {dualFaceInfo.otherFace.data?.directions && (
          <div className="text-xs text-gray-700 mb-1">
            <span className="font-medium">الاتجاه:</span><br/>
            {dualFaceInfo.otherFace.data.directions}
          </div>
        )}
        
        <div className={`text-sm font-bold py-1 rounded ${dualFaceInfo.otherFace.isBooked ? 'text-red-700' : 'text-green-700'}`}>
          {dualFaceInfo.otherFace.isBooked ? '🔒 محجوز' : '🔓 متاح'}
        </div>
      </div>
    </div>
              
              {isSpecialDualFace && (
                <div className="mt-3 p-2 bg-amber-100 border border-amber-300 rounded text-center">
                  <span className="text-xs font-bold text-amber-800">
                    ⚡ حالة خاصة: وجه محجوز ووجه متاح
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </Popup>
      )}
    </Marker>
  );
})}
            </MapContainer>

            {/* Selection Toolbar */}
            <SelectionToolbar />

            {/* Map Type Toggle Button */}
            <div className="absolute top-20 right-4 z-[1000]">
              <Button
                variant="outline"
                className="bg-white hover:bg-gray-100 shadow-lg border"
                onClick={toggleMapType}
                size="sm"
              >
                {mapType === "map" ? (
                  <>
                    <Satellite className="w-4 h-4 ml-2" />
                    عرض القمر الاصطناعي
                  </>
                ) : (
                  <>
                    <Map className="w-4 h-4 ml-2" />
                    عرض الخريطة العادية
                  </>
                )}
              </Button>
            </div>

            {/* Selection Mode Button */}
            <div className="absolute top-4 left-4 z-[1000]">
              {!selectionMode ? (
                <Button
                  onClick={() => {
                    setSelectionMode(true);
                    showToast("info", "وضع الاختيار مفعل - اضغط على اللوحات لاختيارها");
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
                  size="sm"
                >
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  اختيار
                </Button>
              ) : (
                <Button
                  onClick={cancelSelectionMode}
                  variant="outline"
                  className="bg-white shadow-lg"
                  size="sm"
                >
                  <X className="w-4 h-4 ml-2" />
                  إلغاء الاختيار
                </Button>
              )}
            </div>

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
                  <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                  <span className="text-xs">لوحات مختارة</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  <span className="text-xs">موقعك الحالي</span>
                </div>
                {mapType === "satellite" && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-600">
                    <Satellite className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs text-yellow-300">وضع القمر الاصطناعي</span>
                  </div>
                )}
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
<div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
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

  {/* Filter Buttons */}
  <Card>
    <CardContent className="p-4">
      <div className="flex flex-col gap-2">
        <p className="text-xs text-gray-500 text-center">تصفية اللوحات</p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={markerFilter === "all" ? "default" : "outline"}
            onClick={handleFilterAll}
            className="flex-1 text-xs h-8"
          >
            الكل
          </Button>
          <Button
            size="sm"
            variant={markerFilter === "booked" ? "default" : "outline"}
            onClick={handleFilterBooked}
            className="flex-1 text-xs h-8 bg-red-500 hover:bg-red-600 text-white"
          >
            محجوز
          </Button>
          <Button
            size="sm"
            variant={markerFilter === "available" ? "default" : "outline"}
            onClick={handleFilterAvailable}
            className="flex-1 text-xs h-8 bg-green-500 hover:bg-green-600 text-white"
          >
            متاح
          </Button>
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