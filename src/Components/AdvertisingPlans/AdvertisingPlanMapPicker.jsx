// AdvertisingPlanMapPicker.jsx
//
// خريطة تفاعلية لاختيار اللوحات ضمن خطة إعلانية (إنشاء/تعديل). نفس مكتبة
// الخريطة المستخدمة في كل المشروع: Leaflet + react-leaflet (راجع
// ContractMapPage.jsx / RoadSignsSelectionMap.jsx لنفس نمط الإصلاح
// والـ FitBounds). الفرق هنا أن الدبابيس قابلة للنقر لإضافة/حذف اللوحة من
// الخطة مباشرة (نفس اللوحة قد تكون مُضافة لخطة أخرى غير مؤرشفة في نفس
// الوقت - هذا مسموح به عمداً حسب طلب العميل، لذلك لا يوجد أي فلترة "توفر"
// هنا، فقط فلاتر مدينة/منطقة/نموذج (قوائم منسدلة) لتسهيل التصفح).
// نافذة الماركر تعرض صورة اللوحة (طلب صريح)، والضغط عليها يفتحها كاملة.
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2, MapPin, Plus, Check } from "lucide-react";
import { useGetRoadSignsQuery } from "../../RtkQuery/Slice/RoadSings/RoadSingsApi";
import { useGetCitiesQuery } from "../../RtkQuery/Slice/CitiesAndRegions/CitiesAndRegionsApi";

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
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [locations, map]);
  return null;
}

function makeIcon(selected) {
  const color = selected ? "#16a34a" : "#3b82f6";
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 34px; height: 34px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        color: white; font-size: 16px; border: 3px solid white;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3); cursor: pointer;
      ">${selected ? "✓" : "📍"}</div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34],
  });
}

// selectedIds: Set<number> | Array<number>
// onToggle(sign): يُستدعى عند الضغط على "إضافة للخطة" / "إزالة من الخطة"
export default function AdvertisingPlanMapPicker({ selectedIds, onToggle }) {
  const [cityId, setCityId] = useState("");
  const [regionId, setRegionId] = useState("");
  const [model, setModel] = useState("");
  const [search, setSearch] = useState("");
  const [previewImage, setPreviewImage] = useState(null);

  const { data: cities } = useGetCitiesQuery();
  const { data: roadSignsResponse, isFetching } = useGetRoadSignsQuery(
    { city_id: cityId || undefined, only_available: false },
    { refetchOnMountOrArgChange: true }
  );

  const selectedIdSet = useMemo(
    () => new Set(Array.isArray(selectedIds) ? selectedIds : Array.from(selectedIds || [])),
    [selectedIds]
  );

  const allSigns = useMemo(() => {
    const list = roadSignsResponse?.data || roadSignsResponse || [];
    return Array.isArray(list) ? list : [];
  }, [roadSignsResponse]);

  // خيارات "المنطقة" و"النموذج" (طلب صريح: فلترة مدينة + نماذج + منطقة
  // كقوائم منسدلة) تُشتَق من اللوحات المحمَّلة نفسها - فتعرض فقط المناطق/
  // النماذج الموجودة فعلًا ضمن المدينة المختارة، بلا أي خيار فارغ النتائج.
  const regionOptions = useMemo(() => {
    const map = new Map();
    allSigns.forEach((rs) => {
      const id = rs?.region?.id ?? rs?.region_id;
      if (id && !map.has(String(id))) map.set(String(id), rs?.region?.name || `منطقة #${id}`);
    });
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name, "ar"));
  }, [allSigns]);

  const modelOptions = useMemo(() => {
    const set = new Set();
    allSigns.forEach((rs) => {
      if (regionId && String(rs?.region?.id ?? rs?.region_id) !== regionId) return;
      if (rs?.template?.model) set.add(rs.template.model);
    });
    return Array.from(set).sort((a, b) => String(a).localeCompare(String(b), "ar"));
  }, [allSigns, regionId]);

  // تغيير المدينة يُصفّر المنطقة والنموذج (قد لا يكونان موجودين في المدينة الجديدة).
  const handleCityChange = (value) => {
    setCityId(value);
    setRegionId("");
    setModel("");
  };

  const handleRegionChange = (value) => {
    setRegionId(value);
    setModel("");
  };

  const markers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (allSigns || [])
      .filter((rs) => rs?.latitudeX && rs?.longitudeY)
      .filter((rs) => !regionId || String(rs?.region?.id ?? rs?.region_id) === regionId)
      .filter((rs) => !model || rs?.template?.model === model)
      .filter((rs) => {
        if (!term) return true;
        return (
          rs.place?.toLowerCase().includes(term) ||
          rs.roadsign_code?.toLowerCase().includes(term) ||
          rs.template?.model?.toLowerCase().includes(term)
        );
      })
      .map((rs) => ({
        id: rs.id,
        lat: parseFloat(rs.latitudeX),
        lng: parseFloat(rs.longitudeY),
        raw: rs,
      }))
      .filter((m) => !Number.isNaN(m.lat) && !Number.isNaN(m.lng));
  }, [allSigns, search, regionId, model]);

  const iconCache = useRef(new Map());
  const getIcon = (selected) => {
    const key = selected ? "sel" : "unsel";
    if (!iconCache.current.has(key)) iconCache.current.set(key, makeIcon(selected));
    return iconCache.current.get(key);
  };

  const center = markers[0] ? [markers[0].lat, markers[0].lng] : [36.2021, 37.1343];

  return (
    <div className="flex flex-col h-full border border-border rounded-lg overflow-hidden bg-card">
      {/* أدوات التصفية */}
      <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border bg-muted/40">
        <select
          value={cityId}
          onChange={(e) => handleCityChange(e.target.value)}
          className="px-2 py-1.5 text-sm rounded-md border border-input bg-background text-foreground"
          title="المدينة"
        >
          <option value="">كل المدن</option>
          {(Array.isArray(cities) ? cities : cities?.data || []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={regionId}
          onChange={(e) => handleRegionChange(e.target.value)}
          className="px-2 py-1.5 text-sm rounded-md border border-input bg-background text-foreground"
          title="المنطقة"
          disabled={regionOptions.length === 0}
        >
          <option value="">كل المناطق</option>
          {regionOptions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="px-2 py-1.5 text-sm rounded-md border border-input bg-background text-foreground"
          title="النموذج"
          disabled={modelOptions.length === 0}
        >
          <option value="">كل النماذج</option>
          {modelOptions.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        {(cityId || regionId || model) && (
          <button
            type="button"
            onClick={() => handleCityChange("")}
            className="px-2 py-1.5 text-xs rounded-md border border-input bg-background text-muted-foreground hover:text-foreground"
          >
            مسح الفلاتر
          </button>
        )}
        <input
          type="text"
          placeholder="بحث بالمكان أو الكود أو النموذج..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[160px] px-3 py-1.5 text-sm rounded-md border border-input bg-background text-foreground"
        />
        <span className="text-xs text-muted-foreground shrink-0">
          {selectedIdSet.size} لوحة مختارة
        </span>
        {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {/* الخريطة */}
      <div className="flex-1 relative min-h-[420px]">
        {markers.length === 0 && !isFetching ? (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground p-4 text-center">
            لا توجد لوحات تملك إحداثيات ضمن الفلاتر الحالية
          </div>
        ) : (
          <MapContainer center={center} zoom={12} className="w-full h-full" scrollWheelZoom={true}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitBounds locations={markers} />
            {markers.map((marker) => {
              const isSelected = selectedIdSet.has(marker.id);
              return (
                <Marker
                  key={marker.id}
                  position={[marker.lat, marker.lng]}
                  icon={getIcon(isSelected)}
                >
                  <Popup minWidth={230} maxWidth={260}>
                    <div className="min-w-[210px]" dir="rtl">
                      {(() => {
                        const img = marker.raw.image || marker.raw.location_image1;
                        return img ? (
                          <button
                            type="button"
                            onClick={() => setPreviewImage({ src: img, title: marker.raw.template?.model || marker.raw.place })}
                            className="block w-full mb-2 rounded-md overflow-hidden border border-border"
                            title="اضغط لعرض الصورة بالحجم الكامل"
                          >
                            <img
                              src={img}
                              alt={marker.raw.place || "صورة اللوحة"}
                              className="w-full h-32 object-cover"
                              loading="lazy"
                            />
                          </button>
                        ) : (
                          <div className="w-full h-20 mb-2 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">
                            لا توجد صورة للوحة
                          </div>
                        );
                      })()}
                      <h3 className="font-bold text-sm mb-1">
                        {marker.raw.template?.model || "لوحة إعلانية"}
                      </h3>
                      {marker.raw.roadsign_code && (
                        <p className="text-xs mb-0.5">
                          <b>الكود:</b> {marker.raw.roadsign_code}
                        </p>
                      )}
                      <p className="text-xs mb-0.5">
                        <b>المكان:</b> {marker.raw.place || "—"}
                      </p>
                      <p className="text-xs mb-2">
                        <b>المدينة:</b> {marker.raw.city?.name || "—"}
                        {marker.raw.region?.name ? ` - ${marker.raw.region.name}` : ""}
                      </p>
                      <button
                        type="button"
                        onClick={() => onToggle(marker.raw)}
                        className={`w-full flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-md transition-colors ${
                          isSelected
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                      >
                        {isSelected ? (
                          <>إزالة من الخطة</>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" /> إضافة للخطة
                          </>
                        )}
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}
      </div>

      {/* معاينة صورة اللوحة بالحجم الكامل */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[2000] bg-black/70 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -left-3 bg-white text-black rounded-full w-8 h-8 shadow flex items-center justify-center"
              aria-label="إغلاق"
            >
              ✕
            </button>
            <img src={previewImage.src} alt={previewImage.title || ""} className="w-full max-h-[80vh] object-contain rounded-lg bg-black" />
            {previewImage.title && <p className="text-center text-white text-sm mt-2">{previewImage.title}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
