import React, { useState, useEffect, useRef } from "react";
import {
  Download, MapPin, Building, Maximize, FileText,
  Plus, Trash2, ArrowRight, Hash, Copy,
  Loader2, RotateCw, X, Check, ZoomIn, ZoomOut, Edit2, Crop
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetOneBookingsQuery, useUploadBookingPdfMutation } from "../../RtkQuery/Slice/Booking/BookingApi";
import toast from "react-hot-toast";
import firstPage from "../../assets/images/new.jpeg"

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
      PAGE 0 — First Page with Photo
  ───────────────────────────────────── */}
<div
  className="max-w-6xl mx-auto bg-white rounded-[2.5rem] shadow-xl mb-8 print:!max-w-full print:!mx-0 print:!rounded-none print:!shadow-none print:!mb-0"
  style={{ overflow: "visible" }}
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

  {/* ─────────────────────────────────────
      PAGE 1 — Statistics
  ───────────────────────────────────── */}
  <div className="statistics-page max-w-6xl mx-auto bg-white rounded-[2.5rem] shadow-xl mb-8" style={{ overflow: "visible" }}>

   {/* Split header (print only) */}
<div className="stats-header-band hidden print:flex w-full h-20 shrink-0" style={{ borderRadius: "2.5rem 2.5rem 0 0", overflow: "hidden" }}>
  <div className="bg-[#1a1a1a] w-1/2 flex items-center justify-end px-8 border-b-[6px] border-[#DAA520]">
    <span className="text-white text-3xl font-extrabold tracking-widest">الشركة</span>
  </div>
  <div className="bg-[#DAA520] w-1/2 flex items-center justify-start px-8 border-b-[6px] border-[#DAA520]">
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
<div key={idx}
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

      {/* Total */}
      <div className="stats-total-print mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
        <span className="total-label text-sm text-gray-500 font-medium">إجمالي اللوحات</span>
        <span className="total-value text-2xl md:text-3xl font-black text-gray-800">{totalSigns}</span>
      </div>
    </div>
  </div>
  {/* ── END PAGE 1 ── */}

  {/* ─────────────────────────────────────
      PAGE 2 — Model Summary (ملخص النماذج) - Separate Page
  ───────────────────────────────────── */}
  <div className="statistics-page max-w-6xl mx-auto bg-white rounded-[2.5rem] shadow-xl mb-8" style={{ overflow: "visible" }}>

    {/* Split header (print only) */}
    <div className="stats-header-band hidden print:flex w-full h-20 shrink-0" style={{ borderRadius: "2.5rem 2.5rem 0 0", overflow: "hidden" }}>
      <div className="bg-[#1a1a1a] w-1/2 flex items-center justify-end px-8 border-b-[6px] border-[#DAA520]">
        <span className="text-white text-3xl font-extrabold tracking-widest">الشركة</span>
      </div>
      <div className="bg-[#DAA520] w-1/2 flex items-center justify-start px-8 border-b-[6px] border-[#DAA520]">
        <span className="text-white text-3xl font-extrabold tracking-widest">السورية للإعلان</span>
      </div>
    </div>

    <div className="stats-body-print p-6 md:p-10" dir="rtl">

      {/* Title */}
      <h2 className="stats-title-print text-base md:text-lg font-bold text-gray-500 mb-5 pb-3 border-b border-gray-200 text-center tracking-widest uppercase">
        ملخص النماذج
      </h2>

      {/* Model Summary - Displayed vertically grouped by template */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {Object.entries(statistics.modelSummary).map(([model, count]) => (
          <div key={model} style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between", 
            gap: "0.5rem", 
            padding: "0.75rem 1rem", 
            borderRadius: "0.75rem", 
            backgroundColor: "#f9fafb", 
            border: "1px solid #f3f4f6" 
          }}>
            <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#374151", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{model}</span>
            <span style={{ 
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
              fontWeight: 900 
            }}>
              {count}
            </span>
          </div>
        ))}
      </div>

      {/* Total Models */}
      <div className="stats-total-print mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
        <span className="total-label text-sm text-gray-500 font-medium">إجمالي النماذج</span>
        <span className="total-value text-2xl md:text-3xl font-black text-gray-800">{Object.keys(statistics.modelSummary).length}</span>
      </div>
    </div>
  </div>
  {/* ── END PAGE 2 ── */}


 
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

      {/* Main layout: Left (add photo top + location bottom) | Right (full info) */}
      <div style={{ display: "flex", height: "calc(100% - 6rem)", minHeight: "500px" }}>

        {/* ─── LEFT SIDE: Stacked (Add Photo Top + Location Bottom) ─── */}
        <div style={{ display: "flex", flexDirection: "column", width: "50%" }}>

                  {/* Top Left: Add Photo / Uploaded Photo */}
          <div style={{ 
            height: "50%", 
            padding: "1.5rem", 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            justifyContent: "center",
            backgroundColor: "#f9fafb",
            borderBottom: "1px solid #e5e7eb"
          }}>
            {groupImages.length === 0 ? (
              /* NO PHOTO — show upload dropzone */
              <div className="w-full text-center no-print">
                <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#9ca3af", marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  <Plus size={18} /> إضافة صورة
                </h3>
                <div style={{ 
                  position: "relative", 
                  width: "100%", 
                  height: "140px", 
                  border: "4px dashed #e5e7eb", 
                  borderRadius: "2rem", 
                  display: "flex", 
                  flexDirection: "column", 
                  alignItems: "center", 
                  justifyContent: "center",
                  cursor: "pointer",
                  backgroundColor: "rgba(255,255,255,0.5)"
                }}>
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
                    style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }} />
                  <div style={{ backgroundColor: "#eef2ff", padding: "0.75rem", borderRadius: "9999px", color: "#4f46e5" }}><Plus size={24} /></div>
                  <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#6b7280", fontWeight: 500 }}>اضغط لرفع الصورة</p>
                  <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.125rem" }}>أو اسحب وأفلت الصورة هنا</p>
                </div>
              </div>
            ) : (
              /* PHOTO EXISTS — show photo with hover delete icon */
              <>
                {/* Screen view */}
                <div className="no-print" style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                  <div className="group" style={{ position: "relative", width: "100%", maxWidth: "36rem", borderRadius: "1rem", overflow: "hidden", border: "2px solid white", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}>
                    <img src={groupImages[0]} style={{ width: "100%", height: "auto", objectFit: "contain", backgroundColor: "#f9fafb", display: "block" }} alt="uploaded" />
                    {/* HOVER OVERLAY WITH DELETE ICON */}
                    <div className="group-hover:opacity-100" style={{ 
                      position: "absolute", 
                      inset: 0, 
                      backgroundColor: "rgba(0,0,0,0.5)", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      opacity: 0, 
                      transition: "opacity 0.2s",
                      cursor: "pointer"
                    }} onClick={() => handleDeleteImage(primarySignId, 0)}>
                      <div style={{ 
                        backgroundColor: "#ef4444", 
                        color: "white", 
                        padding: "0.75rem", 
                        borderRadius: "9999px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <Trash2 size={24} />
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "#9ca3af" }}>اضغط على الصورة لحذفها</p>
                </div>
                {/* Print view */}
                <div className="photos-large-view" style={{ display: "none", width: "100%", flex: 1, alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "0.5rem" }}>
                    <div style={{ width: "100%", maxWidth: "32rem", margin: "0 auto" }}>
                      <img src={groupImages[0]} style={{ width: "100%", height: "auto", borderRadius: "1.5rem", border: "1px solid #e5e7eb", maxHeight: "200px", objectFit: "contain" }} alt="uploaded-photo" />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          

          {/* Bottom Left: Location Photo (صورة الموقع) */}
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
                <img src={groupSign?.location_image1 || "/api/placeholder/400/300"} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Location" />
                <div style={{ position: "absolute", bottom: "0.5rem", right: "0.5rem", backgroundColor: "rgba(0,0,0,0.5)", color: "white", fontSize: "10px", padding: "0.25rem 0.5rem", borderRadius: "0.25rem" }}>صورة الموقع</div>
              </div>
            </div>
          </div>

        </div>

        {/* ─── RIGHT SIDE: All Information (Full Height, No Empty Space) ─── */}
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
                <span style={{ fontSize: "1rem", marginTop: "0.25rem", fontWeight: 700, color: "#374151" }}>نموذج: {groupSign?.template?.model || "---"}</span>
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
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: order.type === 1 ? "#dc2626" : "#16a34a" }}>{getOrderTypeText(order.type)}</span>
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
            <h3 style={{ color: "#9ca3af", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "0.75rem", letterSpacing: "0.1em" }}>المواصفات الفنية والمالية</h3>
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
</div>
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