// ContractMap.jsx
import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { MapPin, X } from "lucide-react";

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

// Component to fit bounds and show all markers
function FitBounds({ locations }) {
  const map = useMap();
  
  useEffect(() => {
    if (locations && locations.length > 0) {
      const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [locations, map]);
  
  return null;
}

const ContractMap = ({ roadsigns, onClose }) => {
  const mapRef = useRef(null);
  
  // Filter roadsigns with valid coordinates
  const validLocations = roadsigns?.filter(rs => rs?.latitudeX && rs?.longitudeY) || [];
  
  // Create marker data
  const markers = validLocations.map(rs => ({
    id: rs.id,
    lat: rs.latitudeX,
    lng: rs.longitudeY,
    place: rs.place || "موقع إعلاني",
    directions: rs.directions || "",
    template: rs.template?.model || "",
    region: rs.region?.name || "",
    days: rs.pivot?.days_of_reservation || 0,
    price: rs.pivot?.total_faces_price || 0
  }));
  
  // Create custom red marker icon
  const createRedMarkerIcon = () => {
    return L.divIcon({
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
          cursor: pointer;
          position: relative;
        ">
          📍
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
      className: 'contract-marker'
    });
  };
  
  if (validLocations.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 text-center">
          <p className="text-gray-500">لا توجد مواقع صالحة للعرض على الخريطة</p>
          <Button onClick={onClose} className="mt-4">إغلاق</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2 text-red-500">
            <MapPin className="w-5 h-5 text-red-800" />
            مواقع اللوحات الإعلانية في العقد
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors bg-black"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer
            ref={mapRef}
            center={[markers[0]?.lat || 36.2021, markers[0]?.lng || 37.1343]}
            zoom={12}
            className="w-full h-full"
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Fit bounds to show all markers */}
            <FitBounds locations={markers} />
            
            {/* Red Markers for each roadsign */}
            {markers.map((marker) => (
              <Marker
                key={marker.id}
                position={[marker.lat, marker.lng]}
                icon={createRedMarkerIcon()}
              >
                <Popup>
                  <div className="min-w-[250px] p-2" dir="rtl">
                    <h3 className="font-bold text-lg mb-2 text-red-600">
                      {marker.template || "لوحة إعلانية"}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-semibold">📍 المكان:</span>
                        <p className="text-gray-600 mt-1">{marker.place}</p>
                      </div>
                      {marker.directions && (
                        <div>
                          <span className="font-semibold">🧭 الاتجاه:</span>
                          <p className="text-gray-600 mt-1">{marker.directions}</p>
                        </div>
                      )}
                      <div>
                        <span className="font-semibold">🗺️ المنطقة:</span>
                        <span className="text-gray-600 mr-2">{marker.region}</span>
                      </div>
                      <div>
                        <span className="font-semibold">📅 المدة:</span>
                        <span className="text-gray-600 mr-2">{marker.days} يوم</span>
                      </div>
                      <div className="mt-3 pt-2 border-t">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${marker.lat},${marker.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                        >
                          <MapPin className="w-3 h-3" />
                          فتح في خرائط جوجل
                        </a>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        
        {/* Footer with count */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              عدد اللوحات المعروضة: {markers.length}
            </span>
            <Button onClick={onClose} variant="outline">
              إغلاق الخريطة
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractMap;