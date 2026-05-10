// PublicMapPage.jsx - UPDATED VERSION
import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useGetOneBookingsQuery } from "../../RtkQuery/Slice/Booking/BookingApi";

// Fix for default markers
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
      const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [locations, map]);
  
  return null;
}

const PublicMapPage = () => {
  const { id: bookingId } = useParams();
  const navigate = useNavigate();
  
  // Debug logging
  useEffect(() => {
    console.log("PublicMapPage mounted with bookingId:", bookingId);
    console.log("Current URL:", window.location.href);
    
    // Check if bookingId is missing
    if (!bookingId) {
      console.error("No booking ID found in URL params");
      // Try to get from URL path as fallback
      const pathParts = window.location.pathname.split('/');
      const possibleId = pathParts[pathParts.length - 1];
      if (possibleId && possibleId !== 'public-map') {
        console.log("Extracted possible ID from path:", possibleId);
        // You could redirect here if needed
        // navigate(`/public-map/${possibleId}`);
      }
    }
  }, [bookingId, navigate]);
  
  // Don't fetch if bookingId is missing
  const { data: getBooking, isLoading, error, refetch } = useGetOneBookingsQuery(bookingId, {
    skip: !bookingId, // Skip if no bookingId
  });
  
  // Force refetch when component mounts and bookingId exists
  useEffect(() => {
    if (bookingId) {
      console.log("Refetching data for bookingId:", bookingId);
      refetch();
    }
  }, [bookingId, refetch]);
  
  const validLocations = getBooking?.roadsigns?.filter(rs => rs?.latitudeX && rs?.longitudeY) || [];
  
  console.log("Valid locations count:", validLocations.length);
  console.log("GetBooking data:", getBooking);
  
  const markers = validLocations.map(rs => ({
    id: rs.id,
    lat: parseFloat(rs.latitudeX), // Ensure numbers
    lng: parseFloat(rs.longitudeY), // Ensure numbers
    place: rs.place || "موقع إعلاني",
    directions: rs.directions || "",
    template: rs.template?.model || "",
    region: rs.region?.name || ""
  }));
  
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
        ">
          📍
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
    });
  };
  
  if (!bookingId) {
    return (
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        height: "100vh",
        flexDirection: "column",
        fontFamily: "Arial, sans-serif",
        textAlign: "center",
        padding: "20px"
      }}>
        <div style={{ color: "red", marginBottom: "20px" }}>❌ خطأ: لم يتم العثور على معرف الحجز</div>
        <button 
          onClick={() => window.history.back()}
          style={{
            padding: "10px 20px",
            backgroundColor: "#0066cc",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          العودة
        </button>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        height: "100vh",
        fontFamily: "Arial, sans-serif"
      }}>
        <div>جاري تحميل الخريطة...</div>
      </div>
    );
  }
  
  if (error) {
    console.error("Error fetching booking:", error);
    return (
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        height: "100vh",
        flexDirection: "column",
        fontFamily: "Arial, sans-serif",
        textAlign: "center",
        padding: "20px"
      }}>
        <div style={{ color: "red", marginBottom: "20px" }}>
          ❌ خطأ في تحميل البيانات: {error?.message || "حدث خطأ غير متوقع"}
        </div>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: "10px 20px",
            backgroundColor: "#0066cc",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }
  
  if (!getBooking || validLocations.length === 0) {
    return (
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        height: "100vh",
        flexDirection: "column",
        fontFamily: "Arial, sans-serif",
        textAlign: "center",
        padding: "20px"
      }}>
        <div style={{ color: "orange", marginBottom: "20px" }}>⚠️ لا توجد مواقع للعرض</div>
        <div style={{ fontSize: "14px", color: "#666" }}>
          {getBooking ? "لم يتم العثور على مواقع إعلانية في هذا العقد" : "لم يتم العثور على بيانات العقد"}
        </div>
        <button 
          onClick={() => window.history.back()}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            backgroundColor: "#0066cc",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          العودة
        </button>
      </div>
    );
  }
  
  return (
    <div style={{ width: "100%", height: "100vh", margin: 0, padding: 0 }}>
      {/* Clean header - only title, no sidebar */}
      <div style={{ 
        position: "absolute", 
        top: "20px", 
        left: "20px", 
        zIndex: 1000, 
        backgroundColor: "rgba(255,255,255,0.95)", 
        padding: "10px 15px",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        fontSize: "14px",
        fontWeight: "bold",
        pointerEvents: "none"
      }}>
        🗺️ مواقع اللوحات الإعلانية (عدد: {markers.length})
      </div>
      
      <MapContainer
        key={bookingId} // Force remount when bookingId changes
        center={[markers[0]?.lat || 36.2021, markers[0]?.lng || 37.1343]}
        zoom={12}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <FitBounds locations={markers} />
        
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.lat, marker.lng]}
            icon={createRedMarkerIcon()}
          >
            <Popup>
              <div dir="rtl" style={{ minWidth: "200px" }}>
                <strong style={{ fontSize: "16px", color: "#ef4444" }}>{marker.template || "لوحة إعلانية"}</strong>
                <p style={{ margin: "5px 0" }}><strong>📍 المكان:</strong> {marker.place}</p>
                {marker.directions && <p style={{ margin: "5px 0" }}><strong>🧭 الاتجاه:</strong> {marker.directions}</p>}
                <p style={{ margin: "5px 0" }}><strong>🗺️ المنطقة:</strong> {marker.region}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default PublicMapPage;