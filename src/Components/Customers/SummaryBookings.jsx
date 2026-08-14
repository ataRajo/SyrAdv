// pages/SummaryBookings.jsx - FIXED VERSION (IndexedDB storage, no more quota failures)

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, MapPin, Building, Maximize, FileText, Copy, Hash, Plus, Trash2 } from "lucide-react";
import firstPage from "../../assets/images/new.jpeg";
import { idbSet, idbGet, idbClearAllBookingImages } from "./idbStorage";

// ============================================================
// HELPERS
// ============================================================

const areSignsIdentical = (s1, s2) => {
  if (!s1 || !s2) return false;
  return (
    s1.template?.model === s2.template?.model &&
    s1.template?.type === s2.template?.type &&
    s1.region?.name === s2.region?.name &&
    s1.place === s2.place &&
    s1.directions === s2.directions &&
    s1.city?.name === s2.city?.name &&
    s1.template?.size === s2.template?.size &&
    s1.template?.advertising_space === s2.template?.advertising_space
  );
};

const getOrderTypeText = (type) => (type === 1 ? "فك" : type === 2 ? "تركيب" : "---");

const groupIdenticalSigns = (signs) => {
  if (!signs || signs.length === 0) return [];
  const groups = [];
  const used = new Set();
  for (let i = 0; i < signs.length; i++) {
    if (used.has(i)) continue;
    const group = { sign: signs[i], count: 1, indices: [i], signIds: [signs[i].id] };
    for (let j = i + 1; j < signs.length; j++) {
      if (!used.has(j) && areSignsIdentical(signs[i], signs[j])) {
        group.count++;
        group.indices.push(j);
        group.signIds.push(signs[j].id);
        used.add(j);
      }
    }
    groups.push(group);
    used.add(i);
  }
  return groups;
};

const getStatistics = (signs) => {
  const stats = {
    total: signs.length,
    byCity: {},
    byModel: {},
    byType: {},
    byRegion: {},
    byRegionWithDetails: {},
    modelSummary: {},
  };
  signs.forEach((sign) => {
    const cityName = sign.city?.name || "غير محدد";
    stats.byCity[cityName] = (stats.byCity[cityName] || 0) + 1;
    const modelName = sign.template?.model || "غير محدد";
    stats.byModel[modelName] = (stats.byModel[modelName] || 0) + 1;
    stats.modelSummary[modelName] = (stats.modelSummary[modelName] || 0) + 1;
    const typeName = sign.template?.type || "غير محدد";
    stats.byType[typeName] = (stats.byType[typeName] || 0) + 1;
    const regionName = sign.region?.name || "غير محدد";
    stats.byRegion[regionName] = (stats.byRegion[regionName] || 0) + 1;
    const key = regionName;
    if (!stats.byRegionWithDetails[key]) {
      stats.byRegionWithDetails[key] = { region: regionName, models: new Set(), modelCounts: {}, count: 0 };
    }
    stats.byRegionWithDetails[key].models.add(modelName);
    stats.byRegionWithDetails[key].modelCounts[modelName] = (stats.byRegionWithDetails[key].modelCounts[modelName] || 0) + 1;
    stats.byRegionWithDetails[key].count++;
  });
  Object.keys(stats.byRegionWithDetails).forEach((key) => {
    const entry = stats.byRegionWithDetails[key];
    const modelEntries = Object.entries(entry.modelCounts);
    entry.modelsString = modelEntries.map(([model, count]) => `${model} (${count})`).join(" + ");
  });
  return stats;
};

const DetailItem = ({ icon, label, value }) => (
  <div className="flex items-start gap-2">
    <div className="mt-0.5 no-print">{icon}</div>
    <div>
      <p className="text-[10px] text-gray-400 font-bold uppercase">{label}</p>
      <p className="text-sm font-black text-gray-800">{value || "---"}</p>
    </div>
  </div>
);

// ============================================================
// STORAGE HELPERS (IndexedDB-backed, large quota, no more failures)
// ============================================================

const imageStorageKey = (bookingId, signId) => `booking_images_${bookingId}_sign_${signId}`;

const readSignImages = async (bookingId, signId) => {
  try {
    const saved = await idbGet(imageStorageKey(bookingId, signId));
    return saved || [];
  } catch {
    return [];
  }
};

// Returns { ok: boolean, error?: string }
const writeSignImages = async (bookingId, signId, images) => {
  try {
    await idbSet(imageStorageKey(bookingId, signId), images);
    return { ok: true };
  } catch (e) {
    console.error("Failed to save image:", e);
    return { ok: false, error: "فشل حفظ الصورة، حاول مرة أخرى." };
  }
};

// Light resize/compress so images stay reasonably sized for the PDF/print output
const compressImage = (file, maxWidth = 1200, quality = 0.7) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Image failed to load"));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });

// ============================================================
// SIGN IMAGE UPLOADER
// ============================================================

const SignImageUploader = ({ bookingId, signId }) => {
  const [images, setImages] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoaded(false);
    readSignImages(bookingId, signId).then((imgs) => {
      if (!cancelled) {
        setImages(imgs);
        setIsLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [bookingId, signId]);

  const handleAddImage = () => {
    setErrorMsg("");
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsProcessing(true);
      try {
        const dataUrl = await compressImage(file);
        const updated = [dataUrl];
        const result = await writeSignImages(bookingId, signId, updated);
        if (result.ok) {
          setImages(updated);
        } else {
          setErrorMsg(result.error);
        }
      } catch (err) {
        console.error("Image processing failed:", err);
        setErrorMsg("فشل معالجة الصورة، جرّب صورة أخرى.");
      } finally {
        setIsProcessing(false);
      }
    };
    input.click();
  };

  const handleDeleteImage = async (index) => {
    setErrorMsg("");
    const updated = images.filter((_, i) => i !== index);
    const result = await writeSignImages(bookingId, signId, updated);
    if (result.ok) {
      setImages(updated);
    } else {
      setErrorMsg(result.error);
    }
  };

  return (
    <div
      style={{
        height: "50%",
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f9fafb",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      {errorMsg && (
        <div
          className="no-print"
          style={{
            width: "100%",
            marginBottom: "0.5rem",
            padding: "0.5rem 0.75rem",
            backgroundColor: "#fee2e2",
            color: "#b91c1c",
            borderRadius: "0.5rem",
            fontSize: "0.75rem",
            fontWeight: 700,
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          {errorMsg}
        </div>
      )}

      {!isLoaded ? (
        <p className="no-print" style={{ fontSize: "0.8rem", color: "#9ca3af" }}>جاري التحميل...</p>
      ) : images.length > 0 ? (
        <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ position: "relative", width: "100%", maxWidth: "32rem" }}>
            <img
              src={images[0]}
              style={{
                width: "100%",
                height: "auto",
                borderRadius: "1.5rem",
                border: "1px solid #e5e7eb",
                maxHeight: "200px",
                objectFit: "contain",
                backgroundColor: "white",
              }}
              alt="uploaded-photo"
            />
            <button
              onClick={() => handleDeleteImage(0)}
              className="no-print absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
              title="حذف الصورة"
              type="button"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <button
            onClick={handleAddImage}
            disabled={isProcessing}
            className="no-print text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 disabled:opacity-50"
            type="button"
          >
            <Plus size={16} /> {isProcessing ? "جاري المعالجة..." : "تغيير الصورة"}
          </button>
        </div>
      ) : (
        <div className="w-full text-center no-print">
          <div
            onClick={!isProcessing ? handleAddImage : undefined}
            style={{
              width: "100%",
              height: "160px",
              border: "3px dashed #d1d5db",
              borderRadius: "1.5rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: isProcessing ? "wait" : "pointer",
              backgroundColor: "rgba(255,255,255,0.5)",
              transition: "all 0.2s",
              opacity: isProcessing ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (isProcessing) return;
              e.currentTarget.style.borderColor = "#4f46e5";
              e.currentTarget.style.backgroundColor = "rgba(79, 70, 229, 0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#d1d5db";
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.5)";
            }}
          >
            <div style={{ backgroundColor: "#eef2ff", padding: "0.75rem", borderRadius: "9999px", color: "#4f46e5" }}>
              <Plus size={28} />
            </div>
            <p style={{ marginTop: "0.75rem", fontSize: "0.875rem", color: "#6b7280", fontWeight: 500 }}>
              {isProcessing ? "جاري المعالجة..." : "اضغط لإضافة صورة"}
            </p>
            <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.25rem" }}>سيتم حفظها محلياً للطباعة</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// SINGLE BOOKING PDF SECTION
// ============================================================

const SingleBookingPdfSection = ({ bookingData, isFirstBooking, bookingId }) => {
  const roadSigns = bookingData?.roadsigns || [];
  const groupedSigns = groupIdenticalSigns(roadSigns);
  const totalSigns = roadSigns.length;
  const statistics = getStatistics(roadSigns);
  const statsEntries = Object.values(statistics.byRegionWithDetails);

  if (!bookingData || roadSigns.length === 0) {
    return (
      <div className="text-center p-10 text-gray-500">
        لا توجد بيانات للحجز #{bookingId}
      </div>
    );
  }

  return (
    <>
      {/* PAGE 0 — First Page with Photo */}
      <div
        className="max-w-6xl mx-auto bg-white rounded-[2.5rem] shadow-xl mb-8 print:!max-w-full print:!mx-0 print:!rounded-none print:!shadow-none print:!mb-0"
        style={{ overflow: "visible", pageBreakBefore: isFirstBooking ? "auto" : "always" }}
      >
        <div
          className="flex flex-col items-center justify-center p-8 print:!p-0"
          style={{ minHeight: "95vh" }}
        >
          <img
            src={firstPage}
            alt="First Page"
            className="w-full h-auto object-contain rounded-lg shadow-xl print:!w-full print:!h-[100vh] print:!max-h-[100vh] print:!object-contain print:!rounded-none print:!shadow-none"
            style={{ maxHeight: "90vh" }}
          />
        </div>
      </div>

      {/* PAGE 1 — Statistics */}
      <div className="statistics-page max-w-6xl mx-auto bg-white rounded-[2.5rem] shadow-xl mb-8 print:!max-w-full print:!mx-0 print:!rounded-none print:!shadow-none print:!mb-0">
        <div className="stats-header-band hidden print:flex w-full h-20 shrink-0" style={{ borderRadius: "2.5rem 2.5rem 0 0", overflow: "hidden" }}>
          <div className="bg-[#1a1a1a] w-1/2 flex items-center justify-end px-8 border-b-[6px] border-[#DAA520]">
            <span className="text-white text-3xl font-extrabold tracking-widest">الشركة</span>
          </div>
          <div className="bg-[#DAA520] w-1/2 flex items-center justify-start px-8 border-b-[6px] border-[#DAA520]">
            <span className="text-white text-3xl font-extrabold tracking-widest">السورية للإعلان</span>
          </div>
        </div>

        <div className="stats-body-print p-6 md:p-10" dir="rtl">
          <h2 className="stats-title-print text-base md:text-lg font-bold text-gray-500 mb-5 pb-3 border-b border-gray-200 text-center tracking-widest uppercase">
            ملخص اللوحات الإعلانية - حجز #{bookingId}
          </h2>

          <div className="stats-grid-print grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {statsEntries.map((item, idx) => (
              <div
                key={`stat-${bookingId}-${idx}`}
                className="stat-card-print flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="stat-region text-sm md:text-base font-bold text-gray-800 truncate leading-tight">
                    {item.region}
                  </span>
                  <span className="stat-model shrink-0 text-[11px] md:text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">
                    {item.modelsString}
                  </span>
                </div>
                <span className="stat-count shrink-0 w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full bg-white border-2 border-gray-200 text-sm md:text-base font-black text-gray-900">
                  {item.count}
                </span>
              </div>
            ))}
          </div>

          <div className="stats-total-print mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
            <span className="total-label text-sm text-gray-500 font-medium">إجمالي اللوحات</span>
            <span className="total-value text-2xl md:text-3xl font-black text-gray-800">{totalSigns}</span>
          </div>
        </div>
      </div>

      {/* PAGE 2 — Model Summary */}
      <div className="statistics-page max-w-6xl mx-auto bg-white rounded-[2.5rem] shadow-xl mb-8 print:!max-w-full print:!mx-0 print:!rounded-none print:!shadow-none print:!mb-0">
        <div className="stats-header-band hidden print:flex w-full h-20 shrink-0" style={{ borderRadius: "2.5rem 2.5rem 0 0", overflow: "hidden" }}>
          <div className="bg-[#1a1a1a] w-1/2 flex items-center justify-end px-8 border-b-[6px] border-[#DAA520]">
            <span className="text-white text-3xl font-extrabold tracking-widest">الشركة</span>
          </div>
          <div className="bg-[#DAA520] w-1/2 flex items-center justify-start px-8 border-b-[6px] border-[#DAA520]">
            <span className="text-white text-3xl font-extrabold tracking-widest">السورية للإعلان</span>
          </div>
        </div>

        <div className="stats-body-print p-6 md:p-10" dir="rtl">
          <h2 className="stats-title-print text-base md:text-lg font-bold text-gray-500 mb-5 pb-3 border-b border-gray-200 text-center tracking-widest uppercase">
            ملخص النماذج - حجز #{bookingId}
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {Object.entries(statistics.modelSummary).map(([model, count]) => (
              <div
                key={`model-${bookingId}-${model}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.5rem",
                  padding: "0.75rem 1rem",
                  borderRadius: "0.75rem",
                  backgroundColor: "#f9fafb",
                  border: "1px solid #f3f4f6",
                }}
              >
                <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#374151", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {model}
                </span>
                <span
                  style={{
                    flexShrink: 0,
                    width: "2rem",
                    height: "2rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "9999px",
                    backgroundColor: "#eef2ff",
                    color: "#4f46e5",
                    fontSize: "0.875rem",
                    fontWeight: 900,
                  }}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>

          <div className="stats-total-print mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
            <span className="total-label text-sm text-gray-500 font-medium">إجمالي النماذج</span>
            <span className="total-value text-2xl md:text-3xl font-black text-gray-800">
              {Object.keys(statistics.modelSummary).length}
            </span>
          </div>
        </div>
      </div>

      {/* Sign detail cards */}
      {groupedSigns.map((group, groupIdx) => {
        const groupSign = group.sign;
        const signCount = group.count;
        const signIds = group.signIds;
        const primarySignId = signIds[0];

        return (
          <div key={`sign-${bookingId}-${groupIdx}`} className="print-full-card max-w-6xl mx-auto bg-white rounded-[2.5rem] shadow-xl overflow-hidden mb-8">

            {/* Split header */}
            <div className="hidden print:flex w-full h-24 z-10 shrink-0">
              <div style={{ backgroundColor: "#1a1a1a", width: "50%", display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 2rem", borderBottom: "6px solid #DAA520", position: "relative" }}>
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, transparent, rgba(255,255,255,0.05))", pointerEvents: "none" }} />
                <span style={{ color: "white", fontSize: "2.25rem", fontWeight: 800, letterSpacing: "0.1em", filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.3))", position: "relative", zIndex: 10 }}>الشركة</span>
              </div>
              <div style={{ backgroundColor: "#DAA520", width: "50%", display: "flex", alignItems: "center", justifyContent: "flex-start", padding: "0 2rem", borderBottom: "6px solid #DAA520", position: "relative" }}>
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to left, transparent, rgba(0,0,0,0.1))", pointerEvents: "none" }} />
                <span style={{ color: "white", fontSize: "2.25rem", fontWeight: 800, letterSpacing: "0.1em", filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.3))", position: "relative", zIndex: 10 }}>السورية للإعلان</span>
              </div>
            </div>

            {signCount > 1 && (
              <div className="no-print bg-indigo-600 text-white px-4 py-2 text-center">
                <p className="text-sm font-bold">🖨️ {signCount} لوحات متطابقة - سيتم طباعة صفحة واحدة</p>
              </div>
            )}

            {/* Main layout: Left (Uploaded Photo | Location Photo) | Right (Info) */}
            <div style={{ display: "flex", height: "calc(100% - 6rem)", minHeight: "500px" }}>

              {/* LEFT SIDE: Stacked - Uploaded Photo on Top, Location Photo on Bottom */}
              <div style={{ display: "flex", flexDirection: "column", width: "50%" }}>

                {/* TOP LEFT: Uploaded Photo — IndexedDB-backed component */}
                <SignImageUploader bookingId={bookingId} signId={primarySignId} />

                {/* BOTTOM LEFT: Location Photo (FIXED - from API) */}
                <div style={{
                  height: "50%",
                  padding: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#ffffff"
                }}>
                  <div style={{ width: "100%", height: "100%", maxHeight: "280px", borderRadius: "1.5rem", overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", border: "1px solid #f3f4f6" }}>
                    <div style={{ position: "relative", width: "100%", height: "100%" }}>
                      <img
                        src={groupSign?.location_image1 || "/api/placeholder/400/300"}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        alt="Location"
                      />
                      <div style={{ position: "absolute", bottom: "0.5rem", right: "0.5rem", backgroundColor: "rgba(0,0,0,0.5)", color: "white", fontSize: "10px", padding: "0.25rem 0.5rem", borderRadius: "0.25rem" }}>
                        صورة الموقع
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT SIDE: All Information */}
              <div style={{
                width: "50%",
                padding: "2rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                borderRight: "1px solid #e5e7eb",
                backgroundColor: "#ffffff"
              }}>
                {signCount > 1 && (
                  <div style={{ marginBottom: "1rem", padding: "0.75rem", backgroundColor: "#eef2ff", borderRadius: "0.5rem", textAlign: "center", border: "1px solid #c7d2fe" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                      <Copy size={16} style={{ color: "#4f46e5" }} />
                      <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#4f46e5" }}>{signCount} لوحات متطابقة</p>
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "#6366f1", marginTop: "0.25rem" }}>جميع المواصفات متطابقة</p>
                  </div>
                )}

                <div style={{ borderBottom: "1px solid #f3f4f6", paddingBottom: "1rem", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", marginTop: "0.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Building size={16} style={{ color: "#9ca3af" }} />
                      <span style={{ fontSize: "1rem", marginTop: "0.25rem", fontWeight: 700, color: "#374151" }}>
                        نموذج: {groupSign?.template?.model || "---"}
                      </span>
                    </div>
                    <p style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#6b7280", fontSize: "0.875rem" }}>
                      <MapPin size={16} style={{ color: "#9ca3af" }} />
                      {groupSign?.city?.name || "---"} - {groupSign?.region?.name || "---"}
                      {groupSign?.city?.country && <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>({groupSign.city.country})</span>}
                    </p>
                    {groupSign?.orders && groupSign.orders.length > 0 && (
                      <div style={{ marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid #f3f4f6" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: "0.75rem", rowGap: "0.25rem" }}>
                          {groupSign.orders.map((order, idx) => (
                            <div key={`order-${bookingId}-${groupIdx}-${idx}`} style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                              <span style={{ fontSize: "12px", fontWeight: 700, color: order.type === 1 ? "#dc2626" : "#16a34a" }}>
                                {getOrderTypeText(order.type)}
                              </span>
                              <span style={{ fontSize: "9px", color: "#6b7280" }}>{order.action_date}</span>
                              {idx < groupSign.orders.length - 1 && <span style={{ color: "#d1d5db", margin: "0 0.25rem" }}>•</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 style={{ color: "#9ca3af", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "0.75rem", letterSpacing: "0.1em" }}>
                    المواصفات الفنية والمالية
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <DetailItem icon={<Maximize style={{ color: "#4f46e5" }} />} label="القياس" value={groupSign?.template?.size} />
                    <DetailItem icon={<FileText style={{ color: "#4f46e5" }} />} label="المساحة" value={groupSign?.template?.printing_space ? `${groupSign.template.printing_space} م²` : "---"} />
                    <DetailItem icon={<Hash style={{ color: "#4f46e5" }} />} label="النوع" value={groupSign?.template?.type} />
                    <DetailItem icon={<MapPin style={{ color: "#4f46e5" }} />} label="الاتجاه" value={groupSign?.directions} />
                    <div style={{ gridColumn: "span 2", padding: "0.75rem", backgroundColor: "#f9fafb", borderRadius: "0.75rem", border: "1px solid #f3f4f6" }}>
                      <p style={{ fontSize: "10px", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.25rem" }}>مكان التموضع</p>
                      <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", lineHeight: 1.625 }}>{groupSign?.place || "---"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {signCount > 1 && (
              <div className="no-print" style={{ padding: "1.5rem", background: "linear-gradient(to right, #eef2ff, #eff6ff)", borderTop: "1px solid #e5e7eb" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#4b5563" }}>عدد اللوحات في هذه المجموعة:</h3>
                  <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "#4f46e5" }}>{signCount}</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================

const SummaryBookings = () => {
  const [bookingsData, setBookingsData] = useState([]);

  useEffect(() => {
    const storedData = sessionStorage.getItem('summaryBookingsData');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setBookingsData(parsedData);
        sessionStorage.removeItem('summaryBookingsData');
      } catch (e) {
        console.error('Failed to parse data:', e);
      }
    }
  }, []);

  const handleBack = () => {
    window.history.back();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleClearAllImages = async () => {
    if (!window.confirm("سيتم حذف جميع الصور المحفوظة محلياً لكل الحجوزات. هل أنت متأكد؟")) return;
    try {
      await idbClearAllBookingImages();
      window.location.reload();
    } catch (e) {
      console.error("Failed to clear storage:", e);
    }
  };

  if (!bookingsData || bookingsData.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
          <div className="text-6xl text-gray-300 mx-auto mb-4">📄</div>
          <p className="text-xl text-gray-500">لا توجد بيانات للعرض</p>
          <p className="text-sm text-gray-400 mt-2">يرجى اختيار حجوزات من صفحة العميل</p>
          <Button onClick={handleBack} className="mt-6">رجوع</Button>
        </div>
      </div>
    );
  }

  const printStyles = `
    @media print {
      body * { visibility: hidden; }
      .print-container, .print-container * { visibility: visible; }
      .print-container {
        position: absolute !important;
        left: 0 !important; top: 0 !important;
        width: 100% !important; margin: 0 !important; padding: 0 !important;
      }
      html, body {
        background-color: white !important;
        margin: 0 !important; padding: 0 !important;
        height: auto !important; overflow: visible !important;
      }
      .no-print, .no-print * {
        display: none !important; visibility: hidden !important;
        height: 0 !important; margin: 0 !important; padding: 0 !important;
      }

      .max-w-6xl {
        max-width: 100% !important;
        margin: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
      }

      .print-full-card {
        box-shadow: none !important;
        border: 2px solid #e5e7eb !important;
        border-radius: 2.5rem !important;
        margin: 0 auto !important;
        page-break-after: always !important;
        break-inside: avoid !important;
        width: 100% !important; max-width: 100% !important;
        height: 95vh !important;
        display: flex !important; flex-direction: column !important;
        overflow: hidden !important;
      }
      .print-full-card:last-child { page-break-after: auto !important; }

      .statistics-page {
        height: auto !important;
        min-height: 0 !important;
        page-break-after: always !important;
        break-after: always !important;
        break-inside: auto !important;
        box-shadow: none !important;
        border: 2px solid #e5e7eb !important;
        border-radius: 2.5rem !important;
        margin: 0 auto !important;
        width: 100% !important; max-width: 100% !important;
        overflow: visible !important;
        display: block !important;
      }

      .stats-grid-print { 
        display: grid !important; 
        grid-template-columns: repeat(4, 1fr) !important; 
        gap: 5px !important; 
      }
      .stat-card-print { 
        padding: 5px 8px !important; 
        border-radius: 8px !important; 
        gap: 6px !important; 
      }
      .stat-region { font-size: 10px !important; font-weight: 700 !important; }
      .stat-model  { font-size: 9px !important; padding: 1px 4px !important; border-radius: 4px !important; }
      .stat-count  { width: 20px !important; height: 20px !important; font-size: 10px !important; min-width: 20px !important; }
      .stats-title-print   { font-size: 12px !important; padding: 10px 16px 8px !important; margin-bottom: 10px !important; }
      .stats-body-print    { padding: 0 14px 14px !important; }
      .stats-total-print   { margin-top: 8px !important; padding-top: 6px !important; }
      .stats-total-print .total-label { font-size: 11px !important; }
      .stats-total-print .total-value { font-size: 18px !important; }
      .stats-header-band { display: flex !important; height: 56px !important; }
      .stats-header-band span { font-size: 22px !important; }

      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      img { max-width: 100% !important; page-break-inside: avoid !important; object-fit: contain !important; }
      @page { size: A4 landscape; margin: 0.5cm; }
    }
  `;

  return (
    <div dir="rtl" className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans">
      <style>{printStyles}</style>

      <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-3 mb-6 no-print">
        <Button 
          onClick={handleBack} 
          variant="outline" 
          className="rounded-xl bg-white shadow-sm text-black"
        >
          <span className="ml-2">→</span> العودة
        </Button>
        <div className="flex gap-2 items-center">
          <span className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-xl shadow-sm font-bold">
            {bookingsData.length} حجزات مختارة
          </span>
          <button
            onClick={handleClearAllImages}
            type="button"
            className="text-xs text-red-500 hover:text-red-700 underline"
          >
            حذف كل الصور المحفوظة
          </button>
        </div>
        <Button
          onClick={handlePrint}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-2 shadow-lg"
        >
          <Download size={18} /> حفظ / طباعة PDF
        </Button>
      </div>

      <div className="print-container">
        {bookingsData.map((booking, idx) => (
          <SingleBookingPdfSection
            key={booking.id}
            bookingData={booking}
            bookingId={booking.id}
            isFirstBooking={idx === 0}
          />
        ))}
      </div>
    </div>
  );
};

export default SummaryBookings;