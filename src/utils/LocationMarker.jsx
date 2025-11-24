import { useEffect, useMemo, useRef, useState } from "react";
import { Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { showToast } from "./Notifictions/showToast";
import { Button } from "@/components/ui/button";

// Fix Leaflet default icons (keep as in your original)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
});

const reverseGeocode = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=ar`
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json;
  } catch (err) {
    return null;
  }
};

function LocationPicker({
  onLocationSelect,
  initialLocation = null, // { lat, lng, address, city, region, country, fullAddress }
  autoDetect = true, // whether to try browser geolocation on mount
  markerIcon = null,
}) {
  const map = useMap();
  const markerRef = useRef(null);

  const [position, setPosition] = useState(
    initialLocation ? { lat: initialLocation.lat, lng: initialLocation.lng } : null
  );
  const [address, setAddress] = useState(initialLocation?.address || "جاري تحديد الموقع...");
  const [loading, setLoading] = useState(false);
  const [locationDetected, setLocationDetected] = useState(Boolean(initialLocation));
  const [accuracy, setAccuracy] = useState(initialLocation?.accuracy || null);

  // Keep position in sync when parent provides a new initialLocation
  useEffect(() => {
    if (initialLocation) {
      setPosition({ lat: initialLocation.lat, lng: initialLocation.lng });
      setAddress(initialLocation.address || "");
      setLocationDetected(true);
      setAccuracy(initialLocation.accuracy || null);
      // center map if available
      try {
        map?.setView([initialLocation.lat, initialLocation.lng], 16);
      } catch (e) {}
    }
  }, [initialLocation, map]);

  const getAddressFromCoordinates = async (lat, lng) => {
    setLoading(true);
    try {
      const data = await reverseGeocode(lat, lng);
      if (data && data.address) {
        const {
          city,
          state,
          country,
          road,
          house_number,
          suburb,
          town,
          village,
          neighbourhood,
        } = data.address;

        const cityName = city || town || village || suburb || neighbourhood || state || "";
        const formattedAddress = `${
          house_number ? house_number + ", " : ""
        }${road || ""}, ${cityName}, ${country || ""}`.replace(/,\s*,/g, ",").trim();

        setAddress(formattedAddress);

        onLocationSelect?.({
          lat,
          lng,
          address: formattedAddress,
          city: cityName,
          region: state || "غير متوفر",
          country: country || "",
          fullAddress: data.address,
        });

        return formattedAddress;
      } else {
        const errorMsg = "العنوان غير موجود";
        setAddress(errorMsg);
        return errorMsg;
      }
    } catch (error) {
      console.error("Error fetching address:", error);
      const errorMsg = "خطأ في جلب العنوان";
      setAddress(errorMsg);
      return errorMsg;
    } finally {
      setLoading(false);
    }
  };

  // High accuracy geolocation
  const detectHighAccuracyLocation = () => {
    if (!map) return;
    try {
      map.locate({
        setView: true,
        maxZoom: 16,
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });
    } catch (err) {
      // ignore
    }
  };

  // IP-based fallback
  const detectIPLocation = async () => {
    try {
      const response = await fetch("https://ipapi.co/json/");
      const data = await response.json();
      if (data.latitude && data.longitude) {
        const lat = parseFloat(data.latitude);
        const lng = parseFloat(data.longitude);
        setPosition({ lat, lng });
        map?.flyTo([lat, lng], 12);
        await getAddressFromCoordinates(lat, lng);
        setLocationDetected(true);
        showToast("info", "تم تحديد الموقع بناءً على عنوان IP");
        return true;
      }
    } catch (err) {
      console.error("IP location failed:", err);
    }
    return false;
  };

  // If autoDetect is enabled and no initialLocation, try to detect on mount
  useEffect(() => {
    if (autoDetect && !initialLocation && !locationDetected) {
      detectHighAccuracyLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, autoDetect, initialLocation, locationDetected]);

  useMapEvents({
    click: async (e) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      setPosition({ lat, lng });
      map?.flyTo([lat, lng], map.getZoom());
      setLocationDetected(true);
      setAccuracy("manual");
      await getAddressFromCoordinates(lat, lng);
    },
    locationfound: async (e) => {
      // ignore if parent provided initialLocation
      if (initialLocation) return;
      const isReasonable = checkLocationReasonableness(e.latlng);
      if (isReasonable) {
        setPosition(e.latlng);
        map?.flyTo([e.latlng.lat, e.latlng.lng], 15);
        await getAddressFromCoordinates(e.latlng.lat, e.latlng.lng);
        setLocationDetected(true);
        setAccuracy(e.accuracy);
        showToast("success", `تم تحديد موقعك بدقة ${Math.round(e.accuracy)} متر`);
      } else {
        showToast("warning", "الموقع غير دقيق، جاري المحاولة بطريقة أخرى...");
        const ok = await detectIPLocation();
        if (!ok) {
          showToast("info", "الرجاء اختيار الموقع يدوياً على الخريطة");
        }
      }
    },
    locationerror: async () => {
      if (initialLocation) return;
      const ok = await detectIPLocation();
      if (!ok) {
        showToast("info", "الرجاء اختيار الموقع يدوياً على الخريطة");
      }
    },
  });

  const checkLocationReasonableness = (latlng) => {
    const inaccurateLocations = [
      { lat: 48.8566, lng: 2.3522 },
      { lat: 40.7128, lng: -74.0060 },
      { lat: 51.5074, lng: -0.1278 },
      { lat: 0, lng: 0 },
      { lat: 37.7749, lng: -122.4194 },
    ];
    const isInaccurate = inaccurateLocations.some(
      (inaccurate) =>
        Math.abs(latlng.lat - inaccurate.lat) < 0.1 &&
        Math.abs(latlng.lng - inaccurate.lng) < 0.1
    );
    return !isInaccurate;
  };

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker) {
          const newPos = marker.getLatLng();
          setPosition({ lat: newPos.lat, lng: newPos.lng });
          map?.flyTo([newPos.lat, newPos.lng], map.getZoom());
          getAddressFromCoordinates(newPos.lat, newPos.lng);
          setAccuracy("manual");
        }
      },
    }),
    [map]
  );

  // Marker icon fallback
  const icon = markerIcon || DefaultIcon;

  return (
    <>
      {position && (
        <Marker
          draggable
          eventHandlers={eventHandlers}
          icon={icon}
          position={[position.lat, position.lng]}
          ref={markerRef}
        >
          <Popup>
            <div className="text-center min-w-[200px]">
              <h3 className="font-bold mb-2">الموقع المحدد</h3>
              <p className="text-sm mb-2 text-right">{address}</p>
              {accuracy && accuracy !== "manual" && (
                <p className="text-xs text-gray-500 mb-2">
                  الدقة: ±{Math.round(accuracy)} متر
                </p>
              )}
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                  <p className="text-xs text-gray-500">جاري تحديث العنوان...</p>
                </div>
              ) : (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    onLocationSelect?.({
                      lat: position.lat,
                      lng: position.lng,
                      address,
                      accuracy: accuracy || "manual",
                    });
                  }}
                >
                  تأكيد هذا الموقع
                </Button>
              )}
            </div>
          </Popup>
        </Marker>
      )}

      {/* Status control */}
      <div className="leaflet-top leaflet-right">
        <div className="leaflet-control leaflet-bar p-2 bg-white shadow-lg rounded">
          <p className="text-sm text-gray-700">
            {locationDetected ? (
              <span className="flex items-center space-x-1">
                <span>📍</span>
                <span>تم تحديد الموقع</span>
                {accuracy && accuracy !== "manual" && (
                  <span className="text-xs">(دقة: ±{Math.round(accuracy)}م)</span>
                )}
              </span>
            ) : (
              <span className="flex items-center space-x-1">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                <span>جاري البحث عن موقعك...</span>
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Retry button */}
      <div className="leaflet-top leaflet-left">
        <div className="leaflet-control leaflet-bar">
          <button
            className="p-2 bg-white hover:bg-gray-100 text-sm text-gray-700 rounded"
            onClick={() => {
              setLocationDetected(false);
              setPosition(null);
              detectHighAccuracyLocation();
            }}
            title="إعادة اكتشاف الموقع"
          >
            🔄 إعادة المحاولة
          </button>
        </div>
      </div>
    </>
  );
}

export default LocationPicker;
