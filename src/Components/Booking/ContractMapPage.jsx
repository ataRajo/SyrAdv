// PublicMapPage.jsx - UPDATED VERSION
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BASE_URL } from "../../Api/baseUrl";
import { getStaticEvaluation } from "../../Static/staticEvaluations";

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
  
  // صفحة عامة بلا تسجيل دخول: تجلب من الراوت العام public/bookings/{id}/map (بيانات اللوحات فقط، بلا بيانات الزبون).
  // كانت تستخدم useGetOneBookingsQuery الذي يستدعي bookings/{id}/public-show-link
  // (يتطلب مصادقة) فيفشل 401 عند أي زائر غير مسجَّل. لا نرسل Authorization هنا عمدًا.
  const [getBooking, setGetBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(bookingId));
  const [error, setError] = useState(null);
  const [specSign, setSpecSign] = useState(null);

  useEffect(() => {
    if (!bookingId) return;
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);
    fetch(`${BASE_URL}/public/bookings/${bookingId}/map`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(res.status === 404 ? "العقد غير موجود" : `تعذر تحميل البيانات (${res.status})`);
        return res.json();
      })
      .then((data) => setGetBooking(data?.data ?? data))
      .catch((e) => { if (e.name !== "AbortError") setError(e); })
      .finally(() => { if (!controller.signal.aborted) setIsLoading(false); });
    return () => controller.abort();
  }, [bookingId]);
  
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
    region: rs.region?.name || "",
    image: rs.image || null,
    size: rs.template?.size || "",
    area: rs.template?.advertising_space,
    displayType: rs.template?.display_type,
    evaluation: rs.evaluation || getStaticEvaluation(rs.id),
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
              <div dir="rtl" style={{ minWidth: "220px", maxWidth: "260px" }}>
                {marker.image && (
                  <img
                    src={marker.image}
                    alt=""
                    style={{ width: "100%", height: "120px", objectFit: "cover", borderRadius: "6px", marginBottom: "6px" }}
                  />
                )}
                <strong style={{ fontSize: "16px", color: "#ef4444" }}>{marker.template || "لوحة إعلانية"}</strong>
                <p style={{ margin: "5px 0" }}><strong>📍 المكان:</strong> {marker.place}</p>
                {marker.directions && <p style={{ margin: "5px 0" }}><strong>🧭 الاتجاه:</strong> {marker.directions}</p>}
                <p style={{ margin: "5px 0" }}><strong>🗺️ المنطقة:</strong> {marker.region}</p>
                {marker.size && <p style={{ margin: "5px 0" }}><strong>📐 الأبعاد:</strong> {marker.size}</p>}
                {marker.area != null && marker.area !== "" && (
                  <p style={{ margin: "5px 0" }}><strong>📏 الحجم:</strong> {marker.area} م²</p>
                )}
                <p style={{ margin: "5px 0" }}>
                  <strong>🖥️ النوع:</strong> {marker.displayType === "digital" ? "شاشة" : "فيزيائي"}
                </p>
                <button
                  type="button"
                  onClick={() => setSpecSign(marker)}
                  style={{
                    marginTop: "6px", width: "100%", padding: "8px", border: "none",
                    borderRadius: "6px", backgroundColor: "#0066cc", color: "white",
                    cursor: "pointer", fontWeight: "bold",
                  }}
                >
                  المواصفات الفنية
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {specSign && (
        <div
          onClick={() => setSpecSign(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 2000, backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
          }}
        >
          <div
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white", borderRadius: "12px", padding: "20px", width: "100%",
              maxWidth: "420px", maxHeight: "90vh", overflowY: "auto", fontFamily: "Arial, sans-serif",
            }}
          >
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: "16px", paddingBottom: "12px", borderBottom: "2px solid #f3f4f6",
            }}>
              <strong style={{ fontSize: "18px", fontWeight: 700, color: "#111827" }}>📊 المواصفات الفنية</strong>
              <button
                type="button"
                onClick={() => setSpecSign(null)}
                style={{
                  border: "none", background: "#f3f4f6", width: "30px", height: "30px", borderRadius: "50%",
                  fontSize: "18px", lineHeight: 1, cursor: "pointer", color: "#4b5563",
                }}
                aria-label="إغلاق"
              >
                ×
              </button>
            </div>

            {specSign.evaluation ? (
              <>
                {[
                  ["👁️", "نسبة المشاهدة", specSign.evaluation.view_rate, "#2563eb"],
                  ["👥", "النسبة المتوقعة للجمهور", specSign.evaluation.expected_audience_rate, "#16a34a"],
                  ["🏙️", "الكثافة السكانية", specSign.evaluation.population_density_score, "#9333ea"],
                  ["🚗", "حركة المرور", specSign.evaluation.traffic_score, "#ea580c"],
                ]
                  .filter(([, , v]) => v !== null && v !== undefined)
                  .map(([icon, label, value, color]) => (
                    <div
                      key={label}
                      style={{
                        marginBottom: "10px", padding: "10px 12px", background: "#f9fafb",
                        border: "1px solid #eef0f3", borderRadius: "10px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontSize: "14px", fontWeight: 600, color: "#1f2937" }}>
                          <span style={{ marginLeft: "6px" }}>{icon}</span>{label}
                        </span>
                        <strong style={{ fontSize: "15px", color }}>{value}%</strong>
                      </div>
                      <div style={{ height: "8px", background: "#e5e7eb", borderRadius: "4px", overflow: "hidden" }}>
                        <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: "4px" }} />
                      </div>
                    </div>
                  ))}
                {specSign.evaluation.notes && (
                  <p style={{ fontSize: "13px", color: "#374151", margin: "8px 0" }}>{specSign.evaluation.notes}</p>
                )}
                <p style={{ fontSize: "11px", color: "#6b7280", marginTop: "12px" }}>
                  * هذه النسب تقديرات تقريبية مبنية على موقع اللوحة وليست قياسات فعلية.
                </p>
              </>
            ) : (
              <p style={{ fontSize: "14px", color: "#6b7280" }}>لا تتوفر مواصفات فنية لهذه اللوحة حاليًا.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicMapPage;