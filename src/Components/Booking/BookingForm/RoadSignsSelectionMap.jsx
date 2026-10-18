// RoadSignsSelectionMap.jsx
//
// صفحة خريطة تُفتح من زر "عرض على الخريطة" في صفحة إضافة/تعديل الحجز
// (BookingTable.jsx). تعرض دبابيس (markers) لمواقع اللوحات الطرقية
// الظاهرة حالياً في الجدول، بالاعتماد على إحداثيات كل لوحة القادمة من
// استجابة الـ API (حقول latitudeX / longitudeY لكل عنصر roadsign) - دون
// الحاجة لوجود حجز محفوظ مسبقاً (بعكس صفحة /public-map/:id الموجودة
// أصلاً والتي تتطلب bookingId).
//
// تستخدم نفس مكتبة الخريطة المستخدمة في باقي المشروع: Leaflet + react-leaflet
// (انظر ContractMap.jsx / ContractMapPage.jsx / RoadSignsMapView.jsx لنفس النمط).
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Link as LinkIcon } from "lucide-react";
import {
  roadSignsToMarkers,
  decodeMarkers,
  buildSignsMapUrl,
} from "../../../utils/signsMapShare";

// إصلاح أيقونات Leaflet الافتراضية (نفس الإصلاح المستخدم في كل مكان آخر
// بالمشروع يستخدم فيه react-leaflet).
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

// مفتاح تخزين مؤقت (sessionStorage) لقائمة اللوحات، كخطة بديلة في حال
// أعاد المستخدم تحميل الصفحة (F5) فتُفقد بيانات location.state.
const STORAGE_KEY = "booking_road_signs_map_data";

function FitBounds({ locations }) {
  const map = useMap();

  useEffect(() => {
    if (locations && locations.length > 0) {
      const bounds = L.latLngBounds(locations.map((loc) => [loc.lat, loc.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [locations, map]);

  return null;
}

const createRedMarkerIcon = () =>
  L.divIcon({
    html: `
      <div style="
        background-color: #ef4444;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 20px;
        border: 3px solid white;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      ">
        📍
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
    className: "roadsign-selection-marker",
  });

// isPublic: نسخة عامة بلا تسجيل دخول (/public-signs-map#...) تقرأ اللوحات من
// الرابط نفسه بدل location.state، وتخفي زر الرجوع ونسخ الرابط.
const RoadSignsSelectionMap = ({ isPublic = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const markerIcon = useRef(createRedMarkerIcon()).current;

  // 1) البيانات القادمة مباشرة من زر "عرض على الخريطة" عبر navigate(state).
  // 2) نسخة احتياطية من sessionStorage تدعم إعادة تحميل الصفحة أو الرجوع إليها.
  const roadSigns = useMemo(() => {
    if (location.state?.roadSigns?.length) {
      try {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(location.state.roadSigns)
        );
      } catch (e) {
        // تجاهل أي خطأ تخزين (مثلاً حجم البيانات كبير جداً)
      }
      return location.state.roadSigns;
    }

    try {
      const cached = sessionStorage.getItem(STORAGE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  }, [location.state]);

  const stateMarkers = useMemo(
    () => (isPublic ? [] : roadSignsToMarkers(roadSigns)),
    [roadSigns, isPublic]
  );

  const [hashMarkers, setHashMarkers] = useState([]);
  const [hashError, setHashError] = useState(false);
  useEffect(() => {
    if (!isPublic) return;
    const encoded = window.location.hash.replace(/^#/, "");
    if (!encoded) {
      setHashError(true);
      return;
    }
    decodeMarkers(encoded).then(setHashMarkers).catch(() => setHashError(true));
  }, [isPublic]);

  const markers = isPublic ? hashMarkers : stateMarkers;

  const [linkCopied, setLinkCopied] = useState(false);
  const handleCopyLink = async () => {
    try {
      const url = await buildSignsMapUrl(markers);
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    } catch (e) {
      alert("تعذر نسخ الرابط");
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-[2000] flex flex-col" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b bg-white shadow-sm shrink-0">
        <h2 className="text-lg font-bold flex items-center gap-2 text-red-600">
          <MapPin className="w-5 h-5" />
          مواقع اللوحات على الخريطة ({markers.length})
        </h2>
        {!isPublic && (
          <div className="flex gap-2">
            <Button
              onClick={handleCopyLink}
              disabled={markers.length === 0}
              className={`gap-2 text-white ${
                linkCopied
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              <LinkIcon className="w-4 h-4" />
              {linkCopied ? "تم نسخ الرابط ✓" : "نسخ رابط عام"}
            </Button>
            <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
              <ArrowRight className="w-4 h-4" />
              رجوع
            </Button>
          </div>
        )}
      </div>

      {/* Map / Empty state */}
      <div className="flex-1 relative min-h-0">
        {markers.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center p-4 text-center">
            <p className="text-gray-500">
              {isPublic && hashError
                ? "الرابط غير صالح."
                : "لا توجد لوحات تحتوي على إحداثيات صالحة للعرض على الخريطة ضمن الفلاتر الحالية."}
            </p>
          </div>
        ) : (
          <MapContainer
            center={[markers[0].lat, markers[0].lng]}
            zoom={12}
            className="w-full h-full"
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <FitBounds locations={markers} />

            {markers.map((marker) => (
              <Marker
                key={marker.id}
                position={[marker.lat, marker.lng]}
                icon={markerIcon}
              >
                <Popup>
                  <div className="min-w-[220px] p-1" dir="rtl">
                    <h3 className="font-bold text-red-600 mb-1">
                      {marker.model || "لوحة إعلانية"}
                    </h3>
                    {marker.roadsign_code && (
                      <p className="text-sm">
                        <b>الكود:</b> {marker.roadsign_code}
                      </p>
                    )}
                    <p className="text-sm">
                      <b>المكان:</b> {marker.place}
                    </p>
                    {marker.directions && (
                      <p className="text-sm">
                        <b>الاتجاه:</b> {marker.directions}
                      </p>
                    )}
                    <p className="text-sm">
                      <b>المدينة:</b> {marker.city} - {marker.region}
                    </p>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${marker.lat},${marker.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 text-xs block mt-2"
                    >
                      فتح في خرائط جوجل
                    </a>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
};

export default RoadSignsSelectionMap;
