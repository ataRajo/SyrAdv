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
import { NavigationIcon, FilterIcon, LocateIcon, Loader2, Calendar, MapPin, Type, Ruler } from "lucide-react";
import { showToast } from "../../utils/Notifictions/showToast";

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

// Custom icons for road signs
const RoadSignIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const UserLocationIcon = L.icon({
  iconUrl: "data:image/svg+xml;base64," + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#2563eb" width="24" height="24">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/>
    </svg>
  `),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Component to handle user location
function UserLocation() {
  const map = useMap();
  const [userPosition, setUserPosition] = useState(null);
  const locationFoundRef = useRef(false);
  const locationAttemptRef = useRef(false);

  // Improved location reasonableness check - much more permissive
  const checkLocationReasonableness = (latlng) => {
    const inaccurateLocations = [
      { lat: 48.8566, lng: 2.3522, name: "Paris" },
      { lat: 40.7128, lng: -74.0060, name: "New York" },
      { lat: 51.5074, lng: -0.1278, name: "London" },
      { lat: 0, lng: 0, name: "Null Island" },
      { lat: 37.7749, lng: -122.4194, name: "San Francisco" },
    ];
    
    // Check if it's one of the known inaccurate locations (with tighter bounds)
    const isInaccurate = inaccurateLocations.some(inaccurate => 
      Math.abs(latlng.lat - inaccurate.lat) < 0.5 && // Reduced from 1.0 to 0.5
      Math.abs(latlng.lng - inaccurate.lng) < 0.5
    );
    
    // Allow any valid coordinates except inaccurate ones
    const isValidCoordinate = 
      latlng.lat >= -90 && latlng.lat <= 90 && 
      latlng.lng >= -180 && latlng.lng <= 180;
    
    return !isInaccurate && isValidCoordinate;
  };

  // Improved IP location services
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
    
    // Fallback to default position
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
      timeout: 15000, // Increased timeout
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
    }, 8000); // Increased fallback timeout

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
        <Marker position={userPosition} icon={UserLocationIcon}>
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

// Component to display road sign details in popup
const RoadSignDetails = ({ roadSignId }) => {
  const { data: roadSignDetails, isLoading, error } = useGetRoadSignByIdQuery(roadSignId);

  // Helper function to get the latest end date from bookings
  const getLatestEndDate = (details) => {
    if (!details?.bookings || details.bookings.length === 0) return null;
    
    // Get the latest end date from all bookings
    const latestBooking = details.bookings.reduce((latest, booking) => {
      const bookingDate = new Date(booking.end_date);
      const latestDate = latest ? new Date(latest.end_date) : null;
      return !latestDate || bookingDate > latestDate ? booking : latest;
    }, null);
    
    // Extract just the date part (YYYY-MM-DD)
    if (latestBooking?.end_date) {
      return latestBooking.end_date.split('T')[0]; // Get only "2026-11-19"
    }
    return null;
  };

  // Helper function to check if road sign is available
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
      {/* Header */}
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
      
      {/* Road Sign Image */}
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
      
      {/* Main Information */}
      <div className="space-y-2">
        {/* Model Type */}
        {roadSignDetails.template?.type && (
          <div className="flex items-start gap-2">
            <Type className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-gray-700">النوع:</span>
              <span className="text-xs text-gray-900 mr-1"> {roadSignDetails.template.type}</span>
            </div>
          </div>
        )}

        {/* Size */}
        {roadSignDetails.template?.size && (
          <div className="flex items-start gap-2">
            <Ruler className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-gray-700">الحجم:</span>
              <span className="text-xs text-gray-900 mr-1"> {roadSignDetails.template.size}</span>
            </div>
          </div>
        )}

        {/* End Date */}
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

        {/* City */}
        <div className="flex items-start gap-2">
          <MapPin className="w-3 h-3 text-purple-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-gray-700">المدينة:</span>
            <span className="text-xs text-gray-900 mr-1">
              {roadSignDetails.city?.name || "غير محدد"}
            </span>
          </div>
        </div>

        {/* Region */}
        {roadSignDetails.region?.name && (
          <div className="flex items-start gap-2 ml-5">
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-gray-700">المنطقة:</span>
              <span className="text-xs text-gray-900 mr-1"> {roadSignDetails.region.name}</span>
            </div>
          </div>
        )}

        {/* Location Details */}
        {roadSignDetails.place && (
          <div className="mt-2 p-2 bg-gray-50 rounded border">
            <span className="text-xs font-medium text-gray-700 block mb-1">الموقع:</span>
            <p className="text-xs text-gray-600 leading-relaxed break-words">{roadSignDetails.place}</p>
          </div>
        )}

        {/* Advertising Space */}
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

const RoadSignsMapView = ({ viewType }) => {
  const { data: roadSignsResponse, isLoading, error } = useGetRoadSignsQuery();
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [selectedRoadSignId, setSelectedRoadSignId] = useState(null);

  // Debug: Log the raw response
  useEffect(() => {
    if (roadSignsResponse) {
      console.log("🚨 RAW ROAD SIGNS RESPONSE:", roadSignsResponse);
      console.log("📊 Response type:", typeof roadSignsResponse);
      console.log("🔍 Is array?", Array.isArray(roadSignsResponse));
      
      if (Array.isArray(roadSignsResponse)) {
        console.log("📍 First road sign sample:", roadSignsResponse[0]);
        console.log("📈 Total road signs:", roadSignsResponse.length);
        
        // Check coordinates for first few items
        roadSignsResponse.slice(0, 3).forEach((sign, index) => {
          console.log(`📍 Road Sign ${index + 1} coordinates:`, {
            id: sign.id,
            latitudeX: sign.latitudeX,
            longitudeY: sign.longitudeY,
            latitude: sign.latitude,
            longitude: sign.longitude,
            lat: sign.lat,
            lng: sign.lng,
            latX: sign.latX,
            lngY: sign.lngY,
          });
        });
      } else if (typeof roadSignsResponse === 'object') {
        console.log("🔑 Object keys:", Object.keys(roadSignsResponse));
      }
    }
  }, [roadSignsResponse]);

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

  // Enhanced coordinate parsing with more field names
  const getCoordinates = (roadSign) => {
    try {
      // Try all possible coordinate field names
      const coordinateFields = [
        'latitudeX', 'longitudeY',
        'latitude', 'longitude', 
        'lat', 'lng',
        'latX', 'lngY',
        'x', 'y',
        'coord_x', 'coord_y',
        'location_x', 'location_y',
        'position_lat', 'position_lng'
      ];

      let lat, lng;

      for (let i = 0; i < coordinateFields.length; i += 2) {
        const latField = coordinateFields[i];
        const lngField = coordinateFields[i + 1];
        
        if (roadSign[latField] !== undefined && roadSign[lngField] !== undefined) {
          lat = roadSign[latField];
          lng = roadSign[lngField];
          console.log(`📍 Found coordinates in fields: ${latField}=${lat}, ${lngField}=${lng}`);
          break;
        }
      }

      // If no coordinates found, log it for debugging
      if (!lat || !lng) {
        console.log("❌ No coordinates found for road sign:", {
          id: roadSign.id,
          model: roadSign.model,
          availableFields: Object.keys(roadSign).filter(key => 
            key.toLowerCase().includes('lat') || key.toLowerCase().includes('lng') || 
            key.toLowerCase().includes('x') || key.toLowerCase().includes('y')
          )
        });
        return null;
      }

      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      
      // Validate coordinates
      if (isNaN(latNum) || isNaN(lngNum)) {
        console.log("❌ Invalid coordinates (NaN):", lat, lng);
        return null;
      }
      if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
        console.log("❌ Coordinates out of range:", latNum, lngNum);
        return null;
      }
      
      console.log("✅ Valid coordinates:", latNum, lngNum);
      return [latNum, lngNum];
      
    } catch (error) {
      console.warn("❌ Error parsing coordinates for road sign:", roadSign.id, error);
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
    console.log("📊 Road signs with coordinates:", signsWithCoords.length, "out of", filteredRoadSigns.length);
    return signsWithCoords;
  }, [filteredRoadSigns]);

  // Get unique cities and regions for filters
  const cities = useMemo(() => {
    if (!roadSigns || !Array.isArray(roadSigns)) return [];
    const uniqueCities = [];
    const seen = new Set();
    
    roadSigns.forEach(sign => {
      const city = sign.city || sign.city_id;
      if (city && city.id && !seen.has(city.id)) {
        seen.add(city.id);
        uniqueCities.push(city);
      } else if (typeof city === 'number' && !seen.has(city)) {
        seen.add(city);
        uniqueCities.push({ id: city, name: `City ${city}` });
      }
    });
    
    console.log("🏙️ Cities found:", uniqueCities);
    return uniqueCities;
  }, [roadSigns]);

  const regions = useMemo(() => {
    if (!roadSigns || !Array.isArray(roadSigns)) return [];
    const uniqueRegions = [];
    const seen = new Set();
    
    roadSigns.forEach(sign => {
      const region = sign.region || sign.region_id;
      if (region && region.id && !seen.has(region.id)) {
        seen.add(region.id);
        uniqueRegions.push(region);
      } else if (typeof region === 'number' && !seen.has(region)) {
        seen.add(region);
        uniqueRegions.push({ id: region, name: `Region ${region}` });
      }
    });
    
    console.log("🗺️ Regions found:", uniqueRegions);
    return uniqueRegions;
  }, [roadSigns]);

  // Handle marker click
  const handleMarkerClick = (roadSignId) => {
    setSelectedRoadSignId(roadSignId);
    console.log("📍 Marker clicked, fetching details for road sign ID:", roadSignId);
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
      {/* Map */}
      <div className="h-96 rounded-lg overflow-hidden border shadow-sm">
        <MapContainer
          center={[24.7136, 46.6753]}
          zoom={10}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
        >
          {viewType === "satellite" ? (
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
              attribution='&copy; <a href="https://maps.google.com">Google</a>'
              maxZoom={20}
            />
          ) : (
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              maxZoom={19}
            />
          )}

          <UserLocation />

          {roadSignsWithCoordinates.map((roadSign) => {
            const coordinates = getCoordinates(roadSign);
            if (!coordinates) return null;

            return (
              <Marker
                key={roadSign.id}
                position={coordinates}
                icon={RoadSignIcon}
                eventHandlers={{
                  click: () => handleMarkerClick(roadSign.id)
                }}
              >
                <Popup>
                  <RoadSignDetails roadSignId={selectedRoadSignId} />
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Statistics */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{roadSignsWithCoordinates.length}</p>
              <p className="text-sm text-gray-600">اللوحات على الخريطة</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {roadSignsWithCoordinates.filter(sign => !sign.bookings || sign.bookings.length === 0).length}
              </p>
              <p className="text-sm text-gray-600">اللوحات المتاحة</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">
                {cities.length}
              </p>
              <p className="text-sm text-gray-600">عدد المدن</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {regions.length}
              </p>
              <p className="text-sm text-gray-600">عدد المناطق</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-semibold mb-2">مفتاح الخريطة:</h4>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <span>موقعك الحالي</span>
            </div>
            
            <div className="flex items-center gap-2">
              <img 
                src="https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png" 
                alt="Road Sign" 
                className="w-4 h-6"
              />
              <span>اللوحات الطرقية</span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-6 w-6 p-0">
                <LocateIcon className="w-3 h-3" />
              </Button>
              <span>زر تحديد الموقع</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoadSignsMapView;