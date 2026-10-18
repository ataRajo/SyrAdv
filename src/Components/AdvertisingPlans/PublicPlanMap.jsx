// PublicPlanMap.jsx
//
// خريطة عرض (بدون تسجيل دخول) لتوزّع لوحات خطة إعلانية واحدة - تُستخدم من
// PublicAdvertisingPlanView.jsx. نفس نمط ContractMapPage.jsx (القراءة فقط،
// لا اختيار) لكن تأخذ مصفوفة اللوحات مباشرة كـ prop بدل جلبها عبر bookingId.
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

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

const markerIcon = L.divIcon({
  html: `
    <div style="
      background-color: #315fa8; width: 40px; height: 40px; border-radius: 50%;
      display:flex; align-items:center; justify-content:center; color:white;
      font-size: 20px; border: 3px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    ">📍</div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

export default function PublicPlanMap({ roadSigns = [] }) {
  const markers = (roadSigns || [])
    .filter((rs) => rs?.latitudeX && rs?.longitudeY)
    .map((rs) => ({
      id: rs.id,
      lat: parseFloat(rs.latitudeX),
      lng: parseFloat(rs.longitudeY),
      place: rs.place || "موقع إعلاني",
      model: rs.template?.model || "",
      city: rs.city?.name || "",
      region: rs.region?.name || "",
      image: rs.image || null,
    }))
    .filter((m) => !Number.isNaN(m.lat) && !Number.isNaN(m.lng));

  if (markers.length === 0) {
    return (
      <div className="w-full h-full min-h-[320px] flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/30 rounded-lg">
        <MapPin className="h-8 w-8" />
        <p className="text-sm">لا تتوفر إحداثيات لعرض اللوحات على الخريطة</p>
      </div>
    );
  }

  return (
    <MapContainer
      center={[markers[0].lat, markers[0].lng]}
      zoom={12}
      className="w-full h-full min-h-[320px] rounded-lg"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds locations={markers} />
      {markers.map((marker) => (
        <Marker key={marker.id} position={[marker.lat, marker.lng]} icon={markerIcon}>
          <Popup minWidth={220} maxWidth={260}>
            <div dir="rtl" style={{ minWidth: 200 }}>
              {marker.image && (
                <a href={marker.image} target="_blank" rel="noopener noreferrer" title="عرض الصورة بالحجم الكامل">
                  <img
                    src={marker.image}
                    alt={marker.place}
                    loading="lazy"
                    style={{ width: "100%", height: 128, objectFit: "cover", borderRadius: 6, marginBottom: 6, display: "block" }}
                  />
                </a>
              )}
              <strong>{marker.model || "لوحة إعلانية"}</strong>
              <p style={{ margin: "4px 0" }}>📍 {marker.place}</p>
              <p style={{ margin: "4px 0" }}>{marker.city} - {marker.region}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
