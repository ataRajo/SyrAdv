import React, { memo, useContext, useEffect, useState,useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShoppingCart, Trash2, ChevronDown, ChevronUp , FileText  } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { BookingContext } from "../../../Context/BookingContext";
import useGetRoadSignsByFilter from "../../../hooks/useGetRoadSignsByFilter";
import html2pdf from "html2pdf.js"; // أضف هذا السطر


const BookingTable = () => {
  const { formik, addToCart, addedSignIds } = useContext(BookingContext);
  const {
    setStartDate,
    setEndDate,
    cityId,
    regionId,
    roadSigns,
    cities,
    isCitiesLoading,
    regions,
    isRegionsLoading,
    model,
    getRoadSignsModel,
    isGetRoadSignsModel,
    isRoadSignsFetching,
    handleCityChange,
    handleRegionChange,
    handleModelChange,
    direction,
    setDirection,
    handleDirectionChange,
    place,
    setPlace,
    handlePlaceChange,
  } = useGetRoadSignsByFilter();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [uniqueDirections, setUniqueDirections] = useState([]);
  const [uniquePlaces, setUniquePlaces] = useState([]);

  const pdfRef = useRef(null); // ← أضف هذا السطر

  useEffect(() => {
    setStartDate(formik.values.start_date);
    setEndDate(formik.values.end_date);
    
    if (formik.values.direction !== undefined && formik.values.direction !== direction) {
      setDirection(formik.values.direction);
    }
    
    if (formik.values.place !== undefined && formik.values.place !== place) {
      setPlace(formik.values.place);
    }
  }, [formik.values.start_date, formik.values.end_date, formik.values.direction, formik.values.place]);

  useEffect(() => {
    if (roadSigns && roadSigns.length > 0) {
      const directions = new Set();
      const places = new Set();
      
      roadSigns.forEach(sign => {
        if (sign.directions && sign.directions.trim() !== "") {
          directions.add(sign.directions);
        }
        if (sign.place && sign.place.trim() !== "") {
          places.add(sign.place);
        }
      });
      
      setUniqueDirections(Array.from(directions).sort());
      setUniquePlaces(Array.from(places).sort());
    } else {
      setUniqueDirections([]);
      setUniquePlaces([]);
    }
  }, [roadSigns]);

  const groupedRoadSigns = React.useMemo(() => {
    if (!roadSigns) return [];

    const groups = {};
    
    roadSigns.forEach(sign => {
      const key = `${sign.city?.name}_${sign.template?.model}_${sign.place}_${sign.region?.name}_${sign.directions || "غير_محدد"}`;
      
      if (!groups[key]) {
        groups[key] = {
          id: key,
          city: sign.city,
          template: sign.template,
          place: sign.place,
          region: sign.region,
          directions: sign.directions || "غير محدد",
          roadsign_code: sign.roadsign_code || "غير متوفر",  
          direction_code: sign.direction_code || "------- ",    
          signs: [],
          totalAvailable: 0,
          totalPanels: 0,
          similarSignsCount: 0
        };
      }
      
      groups[key].signs.push(sign);
      
      // حساب التوفر مع السماح بالحجز في نفس يوم انتهاء الحجز السابق
      const bookings = sign.bookings || [];
      let occupiedPanels = 0;
      
      bookings.forEach(booking => {
        const bookingStart = new Date(booking.start_date);
        const bookingEnd = new Date(booking.end_date);
        const requestedStart = formik.values.start_date ? new Date(formik.values.start_date) : null;
        
        if (!requestedStart) {
          // إذا لم يتم تحديد تاريخ بداية، تعتبر كل اللوحات متاحة
          return;
        }
        
        // التحقق مما إذا كان تاريخ البداية المطلوب يقع ضمن فترة حجز سابقة
        // نسمح بالحجز إذا كان تاريخ البداية يساوي تاريخ نهاية الحجز السابق
        const isStartDateDuringBooking = 
          requestedStart >= bookingStart && 
          requestedStart <= bookingEnd;
        
        if (isStartDateDuringBooking) {
          // إذا كان تاريخ البداية يساوي تاريخ نهاية الحجز السابق تماماً، نعتبره متاحاً
          if (requestedStart.getTime() === bookingEnd.getTime()) {
            // متاح - يمكن الحجز في نفس يوم انتهاء الحجز السابق
            return;
          } else {
            // غير متاح - التاريخ داخل فترة الحجز (وليس في اليوم الأخير)
            occupiedPanels += (booking.number_of_reserved_panels || booking.booking_faces || 0);
          }
        }
        
        // أيضاً نتحقق من تواريخ النهاية
        const requestedEnd = formik.values.end_date ? new Date(formik.values.end_date) : null;
        if (requestedEnd) {
          const isEndDateDuringBooking = 
            requestedEnd >= bookingStart && 
            requestedEnd <= bookingEnd;
          
          if (isEndDateDuringBooking) {
            // إذا كان تاريخ النهاية يساوي تاريخ بداية الحجز السابق، يمكن قبوله
            if (requestedEnd.getTime() === bookingStart.getTime()) {
              return;
            } else {
              occupiedPanels += (booking.number_of_reserved_panels || booking.booking_faces || 0);
            }
          }
        }
      });
      
      const availablePanels = Math.max(0, sign.panels_number - occupiedPanels);
      groups[key].totalAvailable += availablePanels;
      groups[key].totalPanels += sign.panels_number;
      groups[key].similarSignsCount += 1;
    });

    return Object.values(groups);
  }, [roadSigns, formik.values.start_date, formik.values.end_date]);

  const toggleGroup = (groupId) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const handleShowDialog = (group) => {
    setSelectedGroup(group);
    setSelectedQuantity(1);
    setIsDialogOpen(true);
  };

  const handleAddToCart = () => {
    if (!selectedGroup) return;

    // فلترة اللوحات غير المضافة سابقاً
    const availableSigns = selectedGroup.signs.filter(sign => 
      !addedSignIds?.has?.(sign.id)
    );

    // حساب العدد المتاح فعلياً مع مراعاة الحجوزات السابقة
    let actuallyAvailable = 0;
    const signsWithAvailability = [];
    
    availableSigns.forEach(sign => {
      const bookings = sign.bookings || [];
      let occupiedPanels = 0;
      
      if (formik.values.start_date) {
        const requestedStart = new Date(formik.values.start_date);
        
        bookings.forEach(booking => {
          const bookingStart = new Date(booking.start_date);
          const bookingEnd = new Date(booking.end_date);
          
          const isStartDateDuringBooking = 
            requestedStart >= bookingStart && 
            requestedStart <= bookingEnd;
          
          if (isStartDateDuringBooking) {
            // إذا كان تاريخ البداية يساوي تاريخ نهاية الحجز السابق تماماً، نعتبره متاحاً
            if (requestedStart.getTime() !== bookingEnd.getTime()) {
              // غير متاح فقط إذا لم يكن في نفس يوم النهاية
              occupiedPanels += (booking.number_of_reserved_panels || booking.booking_faces || 0);
            }
          }
        });
      }
      
      const signAvailability = Math.max(0, sign.panels_number - occupiedPanels);
      
      if (signAvailability > 0) {
        actuallyAvailable += signAvailability;
        signsWithAvailability.push({
          sign,
          availability: signAvailability
        });
      }
    });

    if (selectedQuantity > actuallyAvailable) {
      alert(`عذراً، لا يتوفر ${selectedQuantity} لوحات. العدد المتاح الفعلي هو ${actuallyAvailable}`);
      return;
    }

    if (selectedQuantity < 1) {
      alert("يرجى اختيار عدد صحيح من اللوحات");
      return;
    }

    // إضافة اللوحات مع مراعاة التوافر الفعلي
    let remainingQuantity = selectedQuantity;
    const signsToAdd = [];
    
    for (const item of signsWithAvailability) {
      if (remainingQuantity <= 0) break;
      
      const addCount = Math.min(item.availability, remainingQuantity);
      for (let i = 0; i < addCount; i++) {
        signsToAdd.push(item.sign);
      }
      remainingQuantity -= addCount;
    }

    signsToAdd.forEach((sign, index) => {
      const uniqueBooking = {
        ...sign,
        cartId: `sign-${sign.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        customDateRanges: [
          {
            startDate: formik.values.start_date,
            endDate: formik.values.end_date,
            booking_faces: 1,
          },
        ],
      };
      
      addToCart(uniqueBooking);
    });

    setIsDialogOpen(false);
    setSelectedQuantity(1);
  };

  const isSignAdded = (signId) => {
    return addedSignIds?.has?.(signId);
  };

  const isGroupAdded = (groupId) => {
    const group = groupedRoadSigns.find(g => g.id === groupId);
    if (!group) return false;
    return group.signs.some(sign => addedSignIds?.has?.(sign.id));
  };

  const handleDirectionFilterChange = (e) => {
    const value = e.target.value;
    handleDirectionChange(value);
    formik.setFieldValue("direction", value);
  };

  const handlePlaceFilterChange = (e) => {
    const value = e.target.value;
    handlePlaceChange(value);
    formik.setFieldValue("place", value);
  };

  const handleResetFilters = () => {
    setDirection("");
    setPlace("");
    formik.setFieldValue("direction", "");
    formik.setFieldValue("place", "");
  };

  const getActiveFiltersText = () => {
    const filters = [];
    if (direction) filters.push(`الاتجاه: ${direction}`);
    if (place) filters.push(`المكان: ${place}`);
    return filters.join("، ");
  };


const generateFilteredPDF = () => {
  if (!roadSigns || roadSigns.length === 0) {
    alert("لا توجد بيانات لطباعتها بعد تطبيق الفلاتر الحالية");
    return;
  }

  // إنشاء HTML بسيط
  const createHTMLReport = () => {
    let html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تقرير اللوحات الطرقية</title>
        <style>
          @media print {
            @page {
              size: A4;
              margin: 15mm;
            }
            body {
              margin: 0;
              padding: 0;
            }
            .no-print {
              display: none !important;
            }
          }
          
          body {
            font-family: 'Arial', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            direction: rtl;
            text-align: right;
            margin: 0;
            padding: 20px;
            background-color: #fff;
            color: #333;
            line-height: 1.6;
          }
          
          .print-header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #2c3e50;
          }
          
          .print-header h1 {
            color: #2c3e50;
            margin: 0 0 10px 0;
            font-size: 28px;
          }
          
          .print-header .date {
            color: #7f8c8d;
            font-size: 16px;
          }
          
          .filters-section {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 25px;
            border: 1px solid #dee2e6;
          }
          
          .filters-section h3 {
            color: #2c3e50;
            margin-top: 0;
            margin-bottom: 10px;
          }
          
          .filter-item {
            display: inline-block;
            background-color: #e9ecef;
            padding: 5px 12px;
            margin: 0 5px 5px 0;
            border-radius: 4px;
            font-size: 14px;
          }
          
          .summary {
            background-color: #e3f2fd;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 25px;
            border: 1px solid #bbdefb;
          }
          
          .summary h3 {
            color: #1565c0;
            margin-top: 0;
          }
          
          .summary-item {
            display: inline-block;
            margin: 0 15px 5px 0;
            font-weight: bold;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 13px;
          }
          
          table th {
            background-color: #2c3e50;
            color: white;
            padding: 12px 8px;
            text-align: center;
            border: 1px solid #34495e;
            font-weight: bold;
          }
          
          table td {
            padding: 10px 8px;
            text-align: center;
            border: 1px solid #ddd;
            vertical-align: middle;
          }
          
          table tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          
          table tr:hover {
            background-color: #f5f5f5;
          }
          
          .controls {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: white;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            z-index: 1000;
            display: flex;
            gap: 15px;
            border: 1px solid #ddd;
          }
          
          .btn {
            padding: 12px 25px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            text-decoration: none;
            color: white;
          }
          
          .btn-print {
            background-color: #3498db;
          }
          
          .btn-print:hover {
            background-color: #2980b9;
          }
          
          .btn-download {
            background-color: #27ae60;
          }
          
          .btn-download:hover {
            background-color: #219653;
          }
          
          .btn-close {
            background-color: #e74c3c;
          }
          
          .btn-close:hover {
            background-color: #c0392b;
          }
          
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #7f8c8d;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <h1>📋 تقرير اللوحات الطرقية</h1>
          <div class="date">
            تم إنشاؤه في: ${new Date().toLocaleDateString('ar-SA')} الساعة ${new Date().toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit'})}
          </div>
        </div>
        
        <div class="filters-section">
          <h3>🔍 الفلاتر المطبقة:</h3>
    `;

    // معلومات الفلاتر
    const filters = [];
    if (cityId) {
      const cityName = cities?.find(c => c.id === parseInt(cityId))?.name || cityId;
      filters.push(`<span class="filter-item">المدينة: ${cityName}</span>`);
    }
    if (regionId) {
      const regionName = regions?.find(r => r.id === parseInt(regionId))?.name || regionId;
      filters.push(`<span class="filter-item">المنطقة: ${regionName}</span>`);
    }
    if (model) filters.push(`<span class="filter-item">النموذج: ${model}</span>`);
    if (direction) filters.push(`<span class="filter-item">الاتجاه: ${direction}</span>`);
    if (place) filters.push(`<span class="filter-item">مكان التموضع: ${place}</span>`);
    if (formik.values.start_date) filters.push(`<span class="filter-item">تاريخ البداية: ${formik.values.start_date}</span>`);
    if (formik.values.end_date) filters.push(`<span class="filter-item">تاريخ النهاية: ${formik.values.end_date}</span>`);

    html += filters.length > 0 ? filters.join('') : '<span class="filter-item">جميع اللوحات</span>';
    
    html += `
        </div>
        
        <div class="summary">
          <h3>📊 إحصائيات التقرير:</h3>
          <div class="summary-item">• عدد اللوحات: ${roadSigns.length} لوحة</div>
          <div class="summary-item">• عدد المجموعات: ${groupedRoadSigns.length} مجموعة</div>
          <div class="summary-item">• اللوحات المتاحة: ${groupedRoadSigns.reduce((sum, group) => sum + group.totalAvailable, 0)}</div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>المدينة</th>
              <th>النموذج</th>
              <th>النوع</th>
              <th>عدد الوجوه</th>
              <th>الأمتار</th>
              <th>القياس</th>
              <th>كود اللوحة</th>
              <th>المنطقة</th>
              <th>مكان التموضع</th>
              <th>الاتجاه</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
    `;

    // إضافة البيانات
    let counter = 1;
    groupedRoadSigns.forEach((group) => {
      // صف المجموعة
      html += `
        <tr style="background-color: #e8f4fd;">
          <td colspan="12" style="text-align: right; padding: 15px; font-weight: bold; color: #2c3e50;">
            🏷️ المجموعة: ${group.similarSignsCount} لوحة متماثلة | متاحة: ${group.totalAvailable} | إجمالي: ${group.totalPanels}
          </td>
        </tr>
      `;

      // اللوحات في المجموعة
      group.signs.forEach((sign) => {
        const bookingDates = getBookingDates(sign);
        const isAdded = isSignAdded(sign.id);
        const status = isAdded ? '🟢 مضاف' : (sign.panels_number === 0 ? '🔴 غير متاح' : '🟡 متاح');
        
        html += `
          <tr>
            <td>${counter++}</td>
            <td>${sign.city?.name || "غير متوفر"}</td>
            <td><strong>${sign.template?.model || "غير متوفر"}</strong></td>
            <td>${sign.template?.type || "غير محدد"}</td>
            <td>${sign.panels_number || 0}</td>
            <td>${sign.template?.printing_space || 0}</td>
            <td>${sign.template?.size || "غير متوفر"}</td>
            <td style="font-family: monospace; font-weight: bold;">${sign.roadsign_code || "غير متوفر"}</td>
            <td>${sign.region?.name || "غير متوفر"}</td>
            <td>${sign.place || "غير متوفر"}</td>
            <td>${sign.directions || "غير متوفر"}</td>
            <td style="font-weight: bold; color: ${
              isAdded ? '#27ae60' : (sign.panels_number === 0 ? '#e74c3c' : '#f39c12')
            };">${status}
              ${bookingDates ? `<br><small style="color: #7f8c8d; font-size: 11px;">محجوز حتى: ${new Date(bookingDates.end).toLocaleDateString('ar-EG')}</small>` : ''}
            </td>
          </tr>
        `;
      });
    });

    html += `
          </tbody>
        </table>
        
        <div class="footer">
          <p>تم إنشاء هذا التقرير تلقائياً من نظام إدارة اللوحات الإعلانية</p>
          <p>© ${new Date().getFullYear()} - جميع الحقوق محفوظة</p>
        </div>
        
        <div class="controls no-print">
          <button class="btn btn-print" onclick="window.print()">
            🖨️ طباعة
          </button>
          <a href="#" class="btn btn-download" onclick="downloadAsPDF()" id="downloadBtn">
            📥 تنزيل PDF
          </a>
          <button class="btn btn-close" onclick="window.close()">
            ❌ إغلاق
          </button>
        </div>
        
  <script>
  // دالة للتنزيل كـ PDF - نسخة مبسطة
  async function downloadAsPDF() {
    try {
      const downloadBtn = document.getElementById('downloadBtn');
      const originalText = downloadBtn.innerHTML;
      downloadBtn.innerHTML = '⏳ جاري التحميل...';
      downloadBtn.disabled = true;
      
      // إنشاء نسخة من الـ body وإخفاء الأزرار
      const bodyClone = document.body.cloneNode(true);
      const controls = bodyClone.querySelector('.controls');
      if (controls) {
        controls.style.display = 'none';
        controls.classList.add('hide-for-pdf');
      }
      
      // إضافة كلاس لإخفاء الأزرار في النسخة المستنسخة
      const buttons = bodyClone.querySelectorAll('.btn, .controls, .no-print');
      buttons.forEach(btn => {
        btn.style.display = 'none';
        btn.classList.add('hide-for-pdf');
      });
      
      // إنشاء عنصر مؤقت
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'fixed';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.appendChild(bodyClone);
      document.body.appendChild(tempDiv);
      
      const options = {
        margin: [10, 10, 10, 10],
        filename: 'تقرير_اللوحات_' + new Date().toISOString().slice(0,10) + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          dpi: 192,
          letterRendering: true,
          backgroundColor: '#ffffff',
          ignoreElements: function(element) {
            // تجاهل أي عنصر به كلاس hide-for-pdf
            return element.classList && element.classList.contains('hide-for-pdf');
          }
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
          compress: true
        }
      };
      
      // إنشاء PDF
      await html2pdf().set(options).from(bodyClone).save();
      
      // تنظيف العنصر المؤقت
      document.body.removeChild(tempDiv);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('حدث خطأ أثناء إنشاء PDF. يمكنك استخدام خيار الطباعة ثم اختيار "Save as PDF" من طابعتك.');
    } finally {
      const downloadBtn = document.getElementById('downloadBtn');
      if (downloadBtn) {
        downloadBtn.innerHTML = originalText;
        downloadBtn.disabled = false;
      }
    }
  }
  
  // تحميل مكتبة html2pdf
  if (typeof html2pdf === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    document.head.appendChild(script);
  }
</script>
      </body>
      </html>
    `;
    
    return html;
  };

  // فتح في نافذة جديدة مع إمكانية التنزيل
  const htmlContent = createHTMLReport();
  const printWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes');
  
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // تركيز النافذة
  printWindow.focus();
};

  const getBookingDates = (sign) => {
    if (!sign.bookings || sign.bookings.length === 0) return null;
    
    const lastBooking = sign.bookings[sign.bookings.length - 1];
    return {
      start: lastBooking.start_date,
      end: lastBooking.end_date
    };
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
        اللوحات الطرقية
      </h2>
   <Button
        type="button"
        variant="outline"
        onClick={generateFilteredPDF}
        disabled={!roadSigns || roadSigns.length === 0}
        className="flex items-center gap-2"
      >
        <FileText className="h-4 w-4" />
        طباعة PDF ({roadSigns?.length || 0})
      </Button>



      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            المدينة
          </Label>
          <select
            id="city"
            value={cityId}
            onChange={handleCityChange}
            disabled={isCitiesLoading}
            className="w-full p-2 border dark:bg-gray-900 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">اختر مدينة</option>
            {isCitiesLoading && <option>جاري تحميل المدن ...</option>}
            {cities?.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex-1">
          <Label htmlFor="region" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            المنطقة
          </Label>
          <select
            id="region"
            value={regionId}
            onChange={handleRegionChange}
            disabled={isRegionsLoading || !cityId}
            className={`w-full ${
              isRegionsLoading || !cityId ? `dark:bg-gray-700` : `dark:bg-gray-900`
            } p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 `}
          >
            {isRegionsLoading || !cityId ? (
              <option>اختر مدينة لإظهار المناطق</option>
            ) : (
              <>
                <option value="">كل المناطق</option>
                {regions?.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>
        
        <div className="flex-1">
          <Label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            القياس
          </Label>
          <select
            id="model"
            value={model}
            onChange={handleModelChange}
            disabled={isGetRoadSignsModel}
            className={`w-full ${
              isGetRoadSignsModel ? `dark:bg-gray-700` : `dark:bg-gray-900`
            } p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 `}
          >
            <option value="">اختر القياس</option>
            {isGetRoadSignsModel && <option>جاري تحميل القياس ...</option>}
            {getRoadSignsModel?.map((model) => (
              <option key={model.model} value={model.model}>
                {`${model.model} (${model.count} نماذج متوفرة من هذا القياس)`}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex-1">
          <Label htmlFor="direction-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            تصفية حسب الاتجاه
          </Label>
          <select
            id="direction-filter"
            value={direction}
            onChange={handleDirectionFilterChange}
            className="w-full p-2 border dark:bg-gray-900 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">كل الاتجاهات</option>
            {uniqueDirections.map((directionName, index) => (
              <option key={index} value={directionName}>
                {directionName.length > 30 ? `${directionName.substring(0, 30)}...` : directionName}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex-1">
          <Label htmlFor="place-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            تصفية حسب مكان التموضع
          </Label>
          <select
            id="place-filter"
            value={place}
            onChange={handlePlaceFilterChange}
            className="w-full p-2 border dark:bg-gray-900 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">كل الأماكن</option>
            {uniquePlaces.map((placeName, index) => (
              <option key={index} value={placeName}>
                {placeName.length > 30 ? `${placeName.substring(0, 30)}...` : placeName}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleResetFilters}
            className="h-10 px-4"
          >
            إعادة تعيين الفلاتر
          </Button>
        </div>
      </div>

      {(direction || place) && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                فلتر نشط:
              </span>
              <span className="text-sm text-blue-600 dark:text-blue-400">
                {getActiveFiltersText()}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-6 px-2 text-xs"
            >
              إلغاء الفلاتر
            </Button>
          </div>
        </div>
      )}

      <div ref={pdfRef} className="rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100 dark:bg-gray-800">
              <TableHead className="text-right">عدد اللوحات المتماثلة</TableHead>
              <TableHead className="text-right">المدينة</TableHead>
              <TableHead className="text-right">نموذج</TableHead>
              <TableHead className="text-right">نوع النموذج</TableHead>
              <TableHead className="text-right">عدد الوجوه</TableHead>
              <TableHead className="text-right">عدد الأمتار</TableHead>
              <TableHead className="text-right">القياس</TableHead>
              <TableHead className="text-right">كود اللوحة</TableHead>
              <TableHead className="text-right">كود الاتجاه</TableHead>
              <TableHead className="text-right">المنطقة</TableHead>
              <TableHead className="text-right">مكان التموضع</TableHead>
              <TableHead className="text-right">الاتجاه</TableHead>
              <TableHead className="text-right">إجراء</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isRoadSignsFetching ? (
              <TableRow>
                <TableCell colSpan={13} className="text-center py-4">
                  جاري التحميل...
                </TableCell>
              </TableRow>
            ) : !groupedRoadSigns || groupedRoadSigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} className="text-center py-4">
                  {getActiveFiltersText() 
                    ? `لا توجد لوحات متوفرة للبحث "${getActiveFiltersText()}" في هذه الفترة`
                    : "لا توجد لوحات متوفرة لهذه الفترة"
                  }
                </TableCell>
              </TableRow>
            ) : (
              groupedRoadSigns.map((group) => (
                <React.Fragment key={group.id}>
                  <TableRow
                    className={`${
                      isGroupAdded(group.id)
                        ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700"
                    } cursor-pointer`}
                    onClick={() => toggleGroup(group.id)}
                  >
                    <TableCell className="font-semibold">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span>{group.similarSignsCount} لوحة متماثلة</span>
                          {group.totalAvailable > 0 && (
                            <span className="text-sm text-green-600 dark:text-green-400">
                              متاح: {group.totalAvailable} لوحة
                            </span>
                          )}
                          {group.totalAvailable === 0 && (
                            <span className="text-sm text-red-600 dark:text-red-400">
                              غير متاح
                            </span>
                          )}
                        </div>
                        {expandedGroups.has(group.id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="truncate max-w-[100px] sm:max-w-[120px]">
                      {group.city?.name || "غير متوفر"}
                    </TableCell>
                    <TableCell className="truncate max-w-[120px] sm:max-w-[150px]">
                      {group.template?.model || "غير متوفر"}
                    </TableCell>
                    <TableCell className="truncate max-w-[120px] sm:max-w-[150px]">
                      {group.template?.type || "غير محدد"}
                    </TableCell>
                    <TableCell>{group.totalPanels || 0}</TableCell>
                    <TableCell>{group.template?.printing_space || 0}</TableCell>
                    <TableCell>{group.template?.size || "غير متوفر"}</TableCell>
                    <TableCell className="truncate max-w-[100px] sm:max-w-[120px] text-xs font-mono">
                      {group.roadsign_code || "غير متوفر"}
                    </TableCell>
                    <TableCell className="truncate max-w-[80px] sm:max-w-[100px] text-xs font-mono text-center">
                      {group.direction_code || "غير متوفر"}
                    </TableCell>
                    <TableCell className="truncate max-w-[120px] sm:max-w-[150px]">
                      {group.region?.name || "غير متوفر"}
                    </TableCell>
                    <TableCell className="truncate max-w-[120px] sm:max-w-[150px]">
                      {group.place || "غير متوفر"}
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const textElement = e.currentTarget.querySelector('.direction-text');
                            textElement.classList.toggle('line-clamp-2');
                            textElement.classList.toggle('whitespace-normal');
                          }}
                          className="text-right w-full hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded transition-colors"
                        >
                          <div className="direction-text line-clamp-2 text-sm text-gray-800 dark:text-gray-200">
                            {group.directions || "غير متوفر"}
                          </div>
                          {group.directions && group.directions.length > 60 && (
                            <span className="text-xs text-blue-600 dark:text-blue-400 mt-1 block">
                              عرض المزيد
                            </span>
                          )}
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShowDialog(group);
                        }}
                        disabled={group.totalAvailable === 0}
                        className={`flex items-center gap-2 ${
                          isGroupAdded(group.id)
                            ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300"
                            : group.totalAvailable === 0
                            ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                            : "bg-white dark:bg-gray-700"
                        }`}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        <span>{group.totalAvailable === 0 ? "غير متاح" : "إضافة"}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                  
                  {expandedGroups.has(group.id) && (
                    <>
                      {group.signs.map((sign, index) => {
                        const isAdded = isSignAdded(sign.id);
                        const bookingDates = getBookingDates(sign);
                        
                        return (
                          <TableRow
                            key={sign.id}
                            className={`bg-gray-50 dark:bg-gray-800 ${
                              isAdded ? "bg-green-50 dark:bg-green-900/20" : ""
                            }`}
                          >
                            <TableCell className="text-center text-sm text-gray-500">
                              <div className="flex flex-col items-center">
                                <span>#{index + 1}</span>
                                {bookingDates && (
                                  <span className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                                    محجوز حتى: {new Date(bookingDates.end).toLocaleDateString('ar-EG')}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="truncate max-w-[100px] sm:max-w-[120px] text-sm">
                              {sign.city?.name || "غير متوفر"}
                            </TableCell>
                            <TableCell className="truncate max-w-[120px] sm:max-w-[150px] text-sm">
                              {sign.template?.model || "غير متوفر"}
                            </TableCell>
                            <TableCell className="truncate max-w-[120px] sm:max-w-[150px] text-sm">
                              {sign.template?.type || "غير محدد"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {sign.panels_number || 0}
                            </TableCell>
                            <TableCell className="text-sm">
                              {sign.template?.printing_space || 0}
                            </TableCell>
                            <TableCell className="text-sm">
                              {sign.template?.size || "غير متوفر"}
                            </TableCell>
                            <TableCell className="truncate max-w-[100px] sm:max-w-[120px] text-xs font-mono">
                              {sign.roadsign_code || "غير متوفر"}
                            </TableCell>
                            <TableCell className="truncate max-w-[80px] sm:max-w-[100px] text-xs font-mono text-center">
                              {sign.direction_code || "غير متوفر"}
                            </TableCell>
                            <TableCell className="truncate max-w-[120px] sm:max-w-[150px] text-sm">
                              {sign.region?.name || "غير متوفر"}
                            </TableCell>
                            <TableCell className="truncate max-w-[120px] sm:max-w-[150px] text-sm">
                              {sign.place || "غير متوفر"}
                            </TableCell>
                            <TableCell className="truncate max-w-[120px] sm:max-w-[150px] text-sm">
                              {sign.directions || "غير متوفر"}
                            </TableCell>
                            <TableCell className="text-sm">
                              <span className={`px-2 py-1 rounded ${
                                isAdded
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                  : sign.panels_number === 0
                                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                              }`}>
                                {isAdded ? "مضاف" : sign.panels_number === 0 ? "غير متاح" : "غير مضاف"}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent dir="rtl" className="sm:max-w-[500px] dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="text-right text-gray-800 dark:text-gray-100">
              اختيار عدد اللوحات
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                معلومات المجموعة:
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                <strong>المدينة:</strong> {selectedGroup?.city?.name || "غير متوفر"}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                <strong>النموذج:</strong> {selectedGroup?.template?.model}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                <strong>كود اللوحة:</strong> {selectedGroup?.roadsign_code}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                <strong>كود الاتجاه:</strong> {selectedGroup?.direction_code}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                <strong>المنطقة:</strong> {selectedGroup?.region?.name}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                <strong>مكان التموضع:</strong> {selectedGroup?.place}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                <strong>الاتجاه:</strong> {selectedGroup?.directions}
              </p>
            </div>

            <div>
              <Label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                عدد اللوحات المطلوبة
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={selectedGroup?.totalAvailable || 0}
                value={selectedQuantity}
                onChange={(e) => setSelectedQuantity(parseInt(e.target.value) || 1)}
                className="w-full text-right"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                العدد المتاح: <strong>{selectedGroup?.totalAvailable || 0}</strong> لوحة
              </p>
              {selectedQuantity > (selectedGroup?.totalAvailable || 0) && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  ⚠️ العدد المطلوب يتجاوز العدد المتاح
                </p>
              )}
              {selectedGroup?.totalAvailable === 0 && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  ⚠️ لا توجد لوحات متاحة في هذه الفترة
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={handleAddToCart}
              disabled={selectedQuantity > (selectedGroup?.totalAvailable || 0) || selectedQuantity < 1 || selectedGroup?.totalAvailable === 0}
            >
              إضافة إلى السلة ({selectedQuantity} لوحة)
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default memo(BookingTable);