import React, { useState, useEffect, useRef } from "react";
import {
  Download, MapPin, Building, Maximize, FileText,
  Plus, Trash2, ArrowRight, Hash, Copy,
  Loader2, RotateCw, X, Check, ZoomIn, ZoomOut, Edit2, Crop
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetOneBookingsQuery, useUploadBookingPdfMutation } from "../../RtkQuery/Slice/Booking/BookingApi";
import toast from "react-hot-toast";

const BookingDetails = ({ bookingId: propBookingId }) => {
  const [imagesPerSign, setImagesPerSign] = useState({});
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [currentEditingSignId, setCurrentEditingSignId] = useState(null);
  const [currentEditingIndex, setCurrentEditingIndex] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isCropping, setIsCropping] = useState(false);
  const [cropStart, setCropStart] = useState({ x: 0, y: 0 });
  const [cropEnd, setCropEnd] = useState({ x: 0, y: 0 });
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const imgRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  const bookingId = propBookingId || window.location.pathname.split("/").pop();
  const { data: bookingData, isLoading, error } = useGetOneBookingsQuery(bookingId, { skip: !bookingId });
  const [uploadBookingPdf] = useUploadBookingPdfMutation();

  useEffect(() => {
    if (bookingData?.roadsigns) {
      const loadedImages = {};
      bookingData.roadsigns.forEach((sign) => {
        const saved = localStorage.getItem(`booking_images_${bookingId}_sign_${sign.id}`);
        loadedImages[sign.id] = saved ? JSON.parse(saved) : [];
      });
      setImagesPerSign(loadedImages);
    }
  }, [bookingId, bookingData]);

  const handleDeleteImage = (signId, index) => {
    setImagesPerSign((prev) => {
      const updated = (prev[signId] || []).filter((_, i) => i !== index);
      localStorage.setItem(`booking_images_${bookingId}_sign_${signId}`, JSON.stringify(updated));
      return { ...prev, [signId]: updated };
    });
    toast.success("تم حذف الصورة");
  };

  const handleEditImage = (signId, index, image) => {
    setCurrentEditingSignId(signId);
    setCurrentEditingIndex(index);
    setEditingImage(image);
    setScale(1); setRotation(0); setIsCropping(false);
    setCropStart({ x: 0, y: 0 }); setCropEnd({ x: 0, y: 0 });
    setShowCropModal(true);
  };

  const handleMouseDown = (e) => {
    if (!isCropping || !containerRef.current) return;
    const img = imgRef.current;
    const imgRect = img.getBoundingClientRect();
    const x = Math.max(0, Math.min(imgRect.width, e.clientX - imgRect.left));
    const y = Math.max(0, Math.min(imgRect.height, e.clientY - imgRect.top));
    setCropStart({ x, y }); setCropEnd({ x, y }); setIsDraggingCrop(true);
  };

  const handleMouseMove = (e) => {
    if (!isDraggingCrop || !isCropping || !containerRef.current) return;
    const img = imgRef.current;
    const imgRect = img.getBoundingClientRect();
    const x = Math.max(0, Math.min(imgRect.width, e.clientX - imgRect.left));
    const y = Math.max(0, Math.min(imgRect.height, e.clientY - imgRect.top));
    setCropEnd({ x, y });
  };

  const handleMouseUp = () => setIsDraggingCrop(false);

  const applyCrop = () => {
    if (!imgRef.current) return;
    const img = imgRef.current;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const cropX = Math.min(cropStart.x, cropEnd.x);
    const cropY = Math.min(cropStart.y, cropEnd.y);
    const cropWidth = Math.abs(cropEnd.x - cropStart.x);
    const cropHeight = Math.abs(cropEnd.y - cropStart.y);
    if (cropWidth < 10 || cropHeight < 10) { toast.error("منطقة القص صغيرة جداً"); return; }
    canvas.width = cropWidth; canvas.height = cropHeight;
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;
    ctx.drawImage(img, cropX * scaleX, cropY * scaleY, cropWidth * scaleX, cropHeight * scaleY, 0, 0, cropWidth, cropHeight);
    setEditingImage(canvas.toDataURL("image/jpeg", 0.9));
    setScale(1); setRotation(0); setIsCropping(false);
    setCropStart({ x: 0, y: 0 }); setCropEnd({ x: 0, y: 0 });
    toast.success("تم قص الصورة");
  };

  const handleSaveEditedImage = () => {
    if (!imgRef.current) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = imgRef.current;
    canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    const editedImage = canvas.toDataURL("image/jpeg", 0.9);
    if (currentEditingSignId && currentEditingIndex !== null) {
      setImagesPerSign((prev) => {
        const updatedImages = [...(prev[currentEditingSignId] || [])];
        updatedImages[currentEditingIndex] = editedImage;
        localStorage.setItem(`booking_images_${bookingId}_sign_${currentEditingSignId}`, JSON.stringify(updatedImages));
        return { ...prev, [currentEditingSignId]: updatedImages };
      });
    }
    setShowCropModal(false); setEditingImage(null); setIsCropping(false);
    toast.success("تم حفظ الصورة بعد التعديل");
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") { toast.error("يرجى اختيار ملف بصيغة PDF فقط"); return; }
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("pdf", file);
      formData.append("id", bookingId);
      const result = await uploadBookingPdf({ id: bookingId, body: formData }).unwrap();
      if (result.status) {
        toast.success("تم رفع ملف PDF بنجاح");
        if (result.data) window.open(result.data, "_blank");
      } else { toast.error("فشل رفع ملف PDF"); }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("حدث خطأ أثناء رفع الملف");
    } finally {
      setIsUploading(false);
      e.target.value = null;
    }
  };

  const handleNextGroup = () => { if (currentGroupIndex < groupedSigns.length - 1) setCurrentGroupIndex(currentGroupIndex + 1); };
  const handlePrevGroup = () => { if (currentGroupIndex > 0) setCurrentGroupIndex(currentGroupIndex - 1); };

  if (isLoading) return <div className="p-10 text-center">جاري التحميل...</div>;
  if (error) return <div className="p-10 text-center text-red-500">حدث خطأ في جلب البيانات</div>;

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
          group.count++; group.indices.push(j); group.signIds.push(signs[j].id); used.add(j);
        }
      }
      groups.push(group); used.add(i);
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
    modelSummary: {}  // New: for model totals
  };
  
  signs.forEach((sign) => {
    const cityName = sign.city?.name || "غير محدد";
    stats.byCity[cityName] = (stats.byCity[cityName] || 0) + 1;
    
    const modelName = sign.template?.model || "غير محدد";
    stats.byModel[modelName] = (stats.byModel[modelName] || 0) + 1;
    
    // Add to model summary
    stats.modelSummary[modelName] = (stats.modelSummary[modelName] || 0) + 1;
    
    const typeName = sign.template?.type || "غير محدد";
    stats.byType[typeName] = (stats.byType[typeName] || 0) + 1;
    
    const regionName = sign.region?.name || "غير محدد";
    stats.byRegion[regionName] = (stats.byRegion[regionName] || 0) + 1;
    
    // Group by region ONLY, and collect all models
    const key = regionName;
    if (!stats.byRegionWithDetails[key]) {
      stats.byRegionWithDetails[key] = { 
        region: regionName, 
        models: new Set(),
        modelCounts: {},
        count: 0 
      };
    }
    stats.byRegionWithDetails[key].models.add(modelName);
    stats.byRegionWithDetails[key].modelCounts[modelName] = (stats.byRegionWithDetails[key].modelCounts[modelName] || 0) + 1;
    stats.byRegionWithDetails[key].count++;
  });
  
  // Convert Sets to strings with counts
  Object.keys(stats.byRegionWithDetails).forEach(key => {
    const entry = stats.byRegionWithDetails[key];
    const modelEntries = Object.entries(entry.modelCounts);
    entry.modelsString = modelEntries
      .map(([model, count]) => `${model} (${count})`)
      .join(" + ");
  });
  
  return stats;
};

  const roadSigns = bookingData?.roadsigns || [];
  const groupedSigns = groupIdenticalSigns(roadSigns);
  const totalGroups = groupedSigns.length;
  const totalSigns = roadSigns.length;
  const statistics = getStatistics(roadSigns);
  const statsEntries = Object.values(statistics.byRegionWithDetails);

  const getCropOverlayStyle = () => {
    if (!isCropping || !cropStart || !cropEnd) return null;
    return {
      left: `${Math.min(cropStart.x, cropEnd.x)}px`,
      top: `${Math.min(cropStart.y, cropEnd.y)}px`,
      width: `${Math.abs(cropEnd.x - cropStart.x)}px`,
      height: `${Math.abs(cropEnd.y - cropStart.y)}px`,
    };
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans" dir="rtl">
      <style>{`
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

          /* ── Sign detail cards: fixed one-per-page ── */
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

          .grid-print-2x2 {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            grid-template-rows: 1fr 1fr !important;
            width: 100% !important; flex: 1 !important;
            height: calc(100% - 6rem) !important;
            overflow: hidden !important;
          }
          .section-print {
            min-height: 0 !important; height: 100% !important;
            page-break-inside: avoid !important; padding: 1rem !important;
            display: flex !important; flex-direction: column !important;
            justify-content: center !important; overflow: hidden !important;
          }

          /* ── Statistics page ──────────────────────────────────────
             KEY FIXES:
             1. height: auto  → never clips content, spills to next
                               A4 page automatically
             2. break-inside: auto → allows internal page breaks
             3. page-break-after: always → still separates from signs
          ──────────────────────────────────────────────────────── */
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

          /* Compact 4-column grid for print — fits ~40 entries/page */
          .stats-grid-print {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 5px !important;
          }

          /* Shrink cards to pack more per page */
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

          /* Print header strip inside stats page */
          .stats-header-band { display: flex !important; height: 56px !important; }
          .stats-header-band span { font-size: 22px !important; }

          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          img { max-width: 100% !important; page-break-inside: avoid !important; object-fit: contain !important; }

          .added-photos-print {
            display: flex !important; flex-direction: column !important;
            justify-content: center !important; align-items: center !important;
            height: 100% !important; width: 100% !important; padding: 1rem !important;
          }
          .added-photos-print > div { width: 100% !important; max-width: 512px !important; margin: 0 auto !important; }
          .added-photos-print img {
            width: 100% !important; height: auto !important; max-height: 280px !important;
            object-fit: contain !important; border-radius: 1.5rem !important;
            display: block !important; margin: 0 auto !important;
          }
          .photos-large-view {
            display: flex !important; flex-direction: column !important;
            height: 100% !important; width: 100% !important; overflow: hidden !important;
          }
          .section-print:has(.photos-large-view) {
            justify-content: center !important; align-items: center !important; padding: 1.5rem !important;
          }
          .photos-grid-view { display: none !important; }

          @page { size: A4 landscape; margin: 0.5cm; }
        }

        .photos-large-view { display: none; }
      `}</style>

      {/* ── Crop / Edit Modal ── */}
      {showCropModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 no-print" onClick={() => setShowCropModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">تعديل الصورة</h3>
              <button onClick={() => setShowCropModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="flex gap-2 mb-4 flex-wrap text-black">
              <Button size="sm" variant="outline" onClick={() => setScale((s) => Math.min(s + 0.1, 3))} className="gap-1" disabled={isCropping}><ZoomIn size={16} /> تكبير</Button>
              <Button size="sm" variant="outline" onClick={() => setScale((s) => Math.max(s - 0.1, 0.5))} className="gap-1" disabled={isCropping}><ZoomOut size={16} /> تصغير</Button>
              <Button size="sm" variant="outline" onClick={() => setRotation((r) => (r + 90) % 360)} className="gap-1" disabled={isCropping}><RotateCw size={16} /> تدوير</Button>
              <Button size="sm" variant={isCropping ? "default" : "outline"}
                onClick={() => { setIsCropping(!isCropping); if (!isCropping) { setScale(1); setRotation(0); } setCropStart({ x: 0, y: 0 }); setCropEnd({ x: 0, y: 0 }); }}
                className="gap-1">
                <Crop size={16} /> {isCropping ? "إلغاء القص" : "قص الصورة"}
              </Button>
              {isCropping && cropStart.x !== cropEnd.x && cropStart.y !== cropEnd.y && (
                <Button size="sm" onClick={applyCrop} className="gap-1 bg-green-600 hover:bg-green-700 text-white"><Check size={16} /> تطبيق القص</Button>
              )}
            </div>
            <div ref={containerRef} className="bg-gray-100 rounded-xl p-4 flex justify-center overflow-auto relative"
              style={{ maxHeight: "400px", cursor: isCropping ? "crosshair" : "default" }}
              onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
              <div className="relative inline-block">
                <img ref={imgRef} src={editingImage} alt="Edit preview"
                  style={{ transform: `scale(${scale}) rotate(${rotation}deg)`, transition: isCropping ? "none" : "transform 0.2s", maxWidth: "100%", maxHeight: "350px", objectFit: "contain", display: "block" }}
                  draggable={false} />
                {isCropping && (
                  <>
                    <div className="absolute inset-0 bg-black/30 pointer-events-none" style={{ transform: `scale(${scale}) rotate(${rotation}deg)`, transformOrigin: "center" }} />
                    {getCropOverlayStyle() && (
                      <div className="absolute border-2 border-blue-500 bg-transparent pointer-events-none"
                        style={{ ...getCropOverlayStyle(), transform: `scale(${scale}) rotate(${rotation}deg)`, transformOrigin: "top left", boxShadow: "0 0 0 9999px rgba(0,0,0,0.3)" }} />
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4 text-black">
              <Button variant="outline" onClick={() => setShowCropModal(false)}>إلغاء</Button>
              <Button onClick={handleSaveEditedImage} className="gap-2" disabled={isCropping}><Check size={16} /> حفظ التعديلات</Button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              {isCropping ? "اسحب لتحديد المنطقة المراد قصها" : "استخدم الأزرار للتكبير والتدوير والقص، ثم احفظ التعديلات"}
            </p>
          </div>
        </div>
      )}

      {/* ── Top action bar ── */}
      <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-3 mb-6 no-print">
        <Button variant="outline" onClick={() => window.history.back()} className="rounded-xl bg-white shadow-sm text-black">
          <ArrowRight className="ml-2 h-4 w-4" /> العودة
        </Button>
        {totalGroups > 1 && (
          <div className="flex gap-2">
            <Button onClick={handlePrevGroup} disabled={currentGroupIndex === 0} className="rounded-xl bg-gray-600 hover:bg-gray-700 text-white disabled:opacity-50">السابق</Button>
            <span className="px-4 py-2 bg-gray-600 rounded-xl shadow-sm text-white">{currentGroupIndex + 1} / {totalGroups}</span>
            <Button onClick={handleNextGroup} disabled={currentGroupIndex === totalGroups - 1} className="rounded-xl bg-gray-600 hover:bg-gray-700 text-white disabled:opacity-50">التالي</Button>
          </div>
        )}
        <div className="flex gap-2">
          <Button
            onClick={() => {
              toast.success("يرجى حفظ الصفحة كملف PDF ثم إعادة رفعها", { duration: 6000 });
              const isIPad = /iPad|MacIntel/.test(navigator.userAgent) && navigator.maxTouchPoints > 1;
              if (isIPad) {
                setTimeout(() => { toast("اضغط على زر المشاركة ثم 'حفظ في الملفات' أو 'طباعة'", { icon: "📱", duration: 8000 }); window.print(); }, 500);
              } else { setTimeout(() => window.print(), 100); }
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-2 shadow-lg">
            <Download size={18} /> 1. حفظ كـ PDF
          </Button>
          <input type="file" accept=".pdf" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          <Button onClick={() => fileInputRef.current.click()} disabled={isUploading} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 shadow-lg">
            {isUploading ? (<><Loader2 size={18} className="animate-spin" /> جاري الرفع...</>) : (<><Plus size={18} /> 2. رفع الملف المحفوظ</>)}
          </Button>
        </div>
      </div>

      {/* ── Existing PDF notice ── */}
      {bookingData?.pdf && (
        <div className="max-w-6xl mx-auto mb-6 p-4 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 no-print">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg"><FileText size={24} /></div>
            <div>
              <p className="font-bold text-gray-800">يوجد ملف عقد PDF مرفوع مسبقاً</p>
              <p className="text-xs text-amber-600 font-semibold mt-0.5">⚠️ تنبيه: إذا قمت برفع ملف جديد، سيتم استبدال الملف القديم ولن تتمكن من استعادته.</p>
            </div>
          </div>
          <Button asChild className="bg-gray-800 hover:bg-gray-900 text-white rounded-xl gap-2">
            <a href={bookingData.pdf} target="_blank" rel="noopener noreferrer"><Download size={18} /> عرض وتحميل العقد الحالي</a>
          </Button>
        </div>
      )}

      {/* ══════════════════════════════════════
          PRINT CONTAINER
      ══════════════════════════════════════ */}
      <div className="print-container">

        {/* ─────────────────────────────────────
            PAGE 1 — Statistics
            · height: auto in print → never clips
            · 4-column grid in print → dense layout
            · break-inside: auto → wraps to extra
              A4 pages if there are 40+ entries
        ───────────────────────────────────── */}
        <div className="statistics-page max-w-6xl mx-auto bg-white rounded-[2.5rem] shadow-xl mb-8" style={{ overflow: "visible" }}>

          {/* Split header (print only) */}
          <div className="stats-header-band hidden print:flex w-full h-20 shrink-0" style={{ borderRadius: "2.5rem 2.5rem 0 0", overflow: "hidden" }}>
            <div className="bg-[#1a1a1a] w-1/2 flex items-center justify-end px-8 border-b-[6px] border-amber-500">
              <span className="text-white text-3xl font-extrabold tracking-widest">الشركة</span>
            </div>
            <div className="bg-[#cc0000] w-1/2 flex items-center justify-start px-8 border-b-[6px] border-amber-500">
              <span className="text-white text-3xl font-extrabold tracking-widest">السورية للإعلان</span>
            </div>
          </div>

          <div className="stats-body-print p-6 md:p-10" dir="rtl">

            {/* Title */}
            <h2 className="stats-title-print text-base md:text-lg font-bold text-gray-500 mb-5 pb-3 border-b border-gray-200 text-center tracking-widest uppercase">
              ملخص اللوحات الإعلانية
            </h2>

            {/* ── Stats grid ──────────────────────────────────────────
                Screen : 1 col (mobile) → 2 col (sm) → 3 col (lg)
                Print  : 4 columns, minimal padding → ~40 cards/page,
                         extra rows flow naturally onto the next sheet
            ──────────────────────────────────────────────────────── */}
            <div className="stats-grid-print grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {statsEntries.map((item, idx) => (
  <div
    key={idx}
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


{/* Model Summary */}
<div className="mt-6 pt-4 border-t border-gray-200">
  <h3 className="text-sm font-bold text-gray-500 mb-3 tracking-widest uppercase">ملخص النماذج</h3>
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
    {Object.entries(statistics.modelSummary).map(([model, count]) => (
      <div key={model} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100">
        <span className="text-xs font-bold text-gray-700 truncate">{model}</span>
        <span className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-black">
          {count}
        </span>
      </div>
    ))}
  </div>
</div>

            {/* Total */}
            <div className="stats-total-print mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
              <span className="total-label text-sm text-gray-500 font-medium">إجمالي اللوحات</span>
              <span className="total-value text-2xl md:text-3xl font-black text-gray-800">{totalSigns}</span>
            </div>
          </div>
        </div>
        {/* ── END PAGE 1 ── */}

        {/* ─────────────────────────────────────
            PAGES 2 … n — Sign detail cards
        ───────────────────────────────────── */}
        {groupedSigns.map((group, groupIdx) => {
          const groupSign = group.sign;
          const signCount = group.count;
          const signIds = group.signIds;
          const primarySignId = signIds[0];
          const groupImages = imagesPerSign[primarySignId] || [];

          return (
            <div key={groupIdx} className="print-full-card max-w-6xl mx-auto bg-white rounded-[2.5rem] shadow-xl overflow-hidden mb-8">

              {/* Split header (print only) */}
              <div className="hidden print:flex w-full h-24 z-10 shrink-0">
                <div className="bg-[#1a1a1a] w-1/2 flex items-center justify-end px-8 border-b-[6px] border-amber-500 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/5 pointer-events-none" />
                  <span className="text-white text-4xl font-extrabold tracking-widest drop-shadow-md relative z-10">الشركة</span>
                </div>
                <div className="bg-[#cc0000] w-1/2 flex items-center justify-start px-8 border-b-[6px] border-amber-500 relative">
                  <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/10 pointer-events-none" />
                  <span className="text-white text-4xl font-extrabold tracking-widest drop-shadow-md relative z-10">السورية للإعلان</span>
                </div>
              </div>

              {signCount > 1 && (
                <div className="no-print bg-indigo-600 text-white px-4 py-2 text-center">
                  <p className="text-sm font-bold">🖨️ {signCount} لوحات متطابقة - سيتم طباعة صفحة واحدة</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 grid-print-2x2 divide-x divide-y divide-gray-200 divide-x-reverse">

                {/* Q1 – uploaded photo */}
                <div className="section-print p-4 md:p-8 flex flex-col items-center justify-center min-h-[350px] bg-gray-50/50">
                  <div className="w-full text-center no-print">
                    <h3 className="text-sm md:text-base font-bold text-gray-400 mb-4 flex items-center justify-center gap-2 uppercase tracking-widest">
                      <Plus size={18} /> إضافة صورة
                    </h3>
                    <div className="relative w-full h-40 md:h-52 lg:h-56 border-4 border-dashed border-gray-200 rounded-[2rem] flex flex-col items-center justify-center group hover:border-indigo-400 transition-all cursor-pointer mb-4 bg-white/50">
                      <input type="file" accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setImagesPerSign((prev) => ({ ...prev, [primarySignId]: [reader.result] }));
                              localStorage.setItem(`booking_images_${bookingId}_sign_${primarySignId}`, JSON.stringify([reader.result]));
                              toast.success("تم حفظ الصورة محلياً");
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                      <div className="bg-indigo-50 p-4 md:p-5 rounded-full text-indigo-600 group-hover:scale-110 transition-transform"><Plus size={28} /></div>
                      <p className="mt-3 text-base md:text-lg text-gray-500 font-medium">اضغط لرفع الصورة</p>
                      <p className="text-xs text-gray-400 mt-1">أو اسحب وأفلت الصورة هنا</p>
                    </div>
                  </div>

                  {groupImages.length > 0 ? (
                    <>
                      <div className="w-full photos-grid-view no-print">
                        <div className="w-full flex justify-center p-2">
                          <div className="relative group w-full max-w-xl rounded-2xl overflow-hidden border-2 border-white shadow-lg hover:shadow-xl transition-shadow">
                            <img src={groupImages[0]} className="w-full h-auto object-contain bg-gray-50" alt="uploaded" />
                            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleEditImage(primarySignId, 0, groupImages[0])} className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 shadow-lg"><Edit2 size={16} /></button>
                              <button onClick={() => handleDeleteImage(primarySignId, 0)} className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-lg"><Trash2 size={16} /></button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="w-full photos-large-view print:block">
                        <div className="added-photos-print w-full h-full flex items-center justify-center">
                          <div className="w-full max-w-lg mx-auto">
                            <img src={groupImages[0]} className="w-full h-auto rounded-2xl shadow-xl border border-gray-200 print:rounded-3xl print:max-h-[280px] print:object-contain print:mx-auto" alt="uploaded-photo" />
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full flex flex-col items-center justify-center py-12 md:py-14 print:py-16">
                      <div className="bg-gray-100 p-5 md:p-6 rounded-full mb-3"><FileText size={40} className="text-gray-400" /></div>
                      <p className="text-gray-400 italic hidden print:block print:not-italic print:font-medium">لم يتم إرفاق صورة</p>
                      <p className="text-gray-400 text-base text-center no-print">لا توجد صورة مضافة</p>
                    </div>
                  )}
                </div>

                {/* Q2 – location photo */}
                <div className="section-print p-8 flex items-center justify-center min-h-[350px]">
                  <div className="w-full h-full max-h-[280px] rounded-3xl overflow-hidden shadow-sm border border-gray-100">
                    <div className="relative w-full h-full">
                      <img src={groupSign?.location_image1 || "/api/placeholder/400/300"} className="w-full h-full object-cover" alt="Location" />
                      <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded">صورة الموقع</div>
                    </div>
                  </div>
                </div>

                {/* Q3 – template image */}
                <div className="section-print p-8 flex flex-col items-center justify-center min-h-[350px] bg-white">
                  <h3 className="text-xs text-gray-400 font-black uppercase mb-4 tracking-widest text-center">شكل نموذج اللوحة</h3>
                  <div className="w-full h-full max-h-[250px] rounded-2xl overflow-hidden border border-gray-100 shadow-inner">
                    <img src={groupSign?.template?.image || "/api/placeholder/400/300"} className="w-full h-full object-contain bg-gray-50" alt="Template" />
                  </div>
                </div>

                {/* Q4 – sign details */}
                <div className="section-print p-8 bg-white min-h-[350px] flex flex-col justify-center">
                  {signCount > 1 && (
                    <div className="mb-4 p-3 bg-indigo-50 rounded-lg text-center border border-indigo-200">
                      <div className="flex items-center justify-center gap-2">
                        <Copy size={16} className="text-indigo-600" />
                        <p className="text-sm font-bold text-indigo-600">{signCount} لوحات متطابقة</p>
                      </div>
                      <p className="text-xs text-indigo-500 mt-1">جميع المواصفات متطابقة</p>
                    </div>
                  )}
                  <div className="border-b border-gray-100 pb-4 mb-4">
                    <div className="flex flex-col mt-1">
                      <div className="flex items-center gap-2">
                        <Building size={16} className="text-gray-400" />
                        <span className="text-base mt-1 font-bold text-gray-700">نموذج: {groupSign?.template?.model || "---"}</span>
                      </div>
                      <p className="flex items-center gap-2 text-gray-500 text-sm">
                        <MapPin size={16} className="text-gray-400" />
                        {groupSign?.city?.name || "---"} - {groupSign?.region?.name || "---"}
                        {groupSign?.city?.country && <span className="text-xs text-gray-400">({groupSign.city.country})</span>}
                      </p>
                      {groupSign?.orders && groupSign.orders.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            {groupSign.orders.map((order, idx) => (
                              <div key={idx} className="flex items-center gap-1">
                                <span className={`text-[12px] font-bold ${order.type === 1 ? "text-red-600" : "text-green-600"}`}>{getOrderTypeText(order.type)}</span>
                                <span className="text-[9px] text-gray-500">{order.action_date}</span>
                                {idx < groupSign.orders.length - 1 && <span className="text-gray-300 mx-1">•</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-gray-400 text-xs font-black uppercase mb-3 tracking-widest">المواصفات الفنية والمالية</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <DetailItem icon={<Maximize className="text-indigo-600" />} label="القياس" value={groupSign?.template?.size} />
                      <DetailItem icon={<FileText className="text-indigo-600" />} label="المساحة" value={groupSign?.template?.printing_space ? `${groupSign.template.printing_space} م²` : "---"} />
                      <DetailItem icon={<Hash className="text-indigo-600" />} label="النوع" value={groupSign?.template?.type} />
                      <DetailItem icon={<MapPin className="text-indigo-600" />} label="الاتجاه" value={groupSign?.directions} />
                      <div className="col-span-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">مكان التموضع</p>
                        <p className="text-xs font-bold text-gray-700 leading-relaxed">{groupSign?.place || "---"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {signCount > 1 && (
                <div className="no-print p-6 bg-gradient-to-r from-indigo-50 to-blue-50 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-gray-600">عدد اللوحات في هذه المجموعة:</h3>
                    <span className="text-2xl font-bold text-indigo-600">{signCount}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Screen-only summary */}
      {groupedSigns.length > 1 && (
        <div className="no-print max-w-6xl mx-auto mt-6 p-4 bg-white rounded-xl shadow-md border border-gray-200">
          <h3 className="font-bold text-gray-700 mb-2">ملخص الحجز:</h3>
          <p className="text-sm text-gray-600">📊 إجمالي اللوحات: {totalSigns} لوحة</p>
          <p className="text-sm text-gray-600">📄 عدد صفحات PDF: {groupedSigns.length + 1} صفحة (صفحة إحصائيات + {groupedSigns.length} صفحة للوحات)</p>
        </div>
      )}
    </div>
  );
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

export default BookingDetails;