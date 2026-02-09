import React, { memo, useContext, useMemo, useState, useCallback, useRef, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShoppingCart, ChevronDown, ChevronUp, FileText, Eye } from "lucide-react";
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
import html2pdf from "html2pdf.js";
import { saveAs } from "file-saver";

// Helper functions outside component
const normalizeSize = (size) => {
  if (!size) return "غير متوفر";
  size = size.replace(/\s+/g, "");
  size = size.replace(/[^0-9]/g, "×");
  const parts = size.split("×").filter(Boolean);
  return parts.length === 2 ? `${parts[0]} × ${parts[1]}` : size;
};

const getActiveFiltersText = (direction, place) => {
  const filters = [];
  if (direction) filters.push(`الاتجاه: ${direction}`);
  if (place) filters.push(`المكان: ${place}`);
  return filters.join("، ");
};

// Image cache to prevent re-fetching
const imageCache = new Map();

// Memoized components for better performance
const DirectionCell = memo(({ directions }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleClick = useCallback((e) => {
    e.stopPropagation();
    setIsExpanded(prev => !prev);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      setIsExpanded(prev => !prev);
    }
  }, []);

  return (
    <div className="relative">
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className="text-right w-full hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <div className={`text-sm text-gray-800 dark:text-gray-200 ${isExpanded ? 'whitespace-normal' : 'line-clamp-2'}`}>
          {directions || "غير متوفر"}
        </div>
        {directions && directions.length > 60 && (
          <span className="text-xs text-blue-600 dark:text-blue-400 mt-1 block">
            {isExpanded ? "عرض أقل" : "عرض المزيد"}
          </span>
        )}
      </div>
    </div>
  );
});

const SignRow = memo(({ 
  sign, 
  index, 
  isAdded, 
  onViewImage,
  getBookingDates 
}) => {
  const bookingDates = getBookingDates(sign);
  
  return (
    <TableRow className={`bg-gray-50 dark:bg-gray-800 ${isAdded ? "bg-green-50 dark:bg-green-900/20" : ""}`}>
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
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onViewImage(sign)}
          title="عرض صورة اللوحة"
          className="h-8 w-8 p-0"
        >
          <Eye className="h-4 w-4" />
        </Button>
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
});

const GroupRow = memo(({ 
  group, 
  isExpanded, 
  isGroupAdded, 
  onToggle, 
  onShowDialog,
  onViewImage 
}) => {
  const handleToggle = useCallback(() => onToggle(group.id), [group.id, onToggle]);
  
  const handleShowDialog = useCallback((e) => {
    e.stopPropagation();
    onShowDialog(group);
  }, [group, onShowDialog]);

  const handleViewImage = useCallback((e) => {
    e.stopPropagation();
    if (group.signs && group.signs.length > 0) {
      onViewImage(group.signs[0]);
    }
  }, [group.signs, onViewImage]);

  return (
    <TableRow
      className={`${
        isGroupAdded
          ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300"
          : "hover:bg-gray-50 dark:hover:bg-gray-700"
      } cursor-pointer`}
      onClick={handleToggle}
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
          {isExpanded ? (
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
        <DirectionCell directions={group.directions} />
      </TableCell>
      <TableCell>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleViewImage}
          title="عرض صورة اللوحة"
          className="h-8 w-8 p-0"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </TableCell>
      <TableCell>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleShowDialog}
          disabled={group.totalAvailable === 0}
          className={`flex items-center gap-2 ${
            isGroupAdded
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
  );
});

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
  const [selectedSignImage, setSelectedSignImage] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  
  const pdfRef = useRef(null);
  
  // Memoize filter values
  const memoizedFiltersText = useMemo(() => 
    getActiveFiltersText(direction, place), 
    [direction, place]
  );

  // Memoize unique directions and places
  const [uniqueDirections, uniquePlaces] = useMemo(() => {
    if (!roadSigns || roadSigns.length === 0) return [[], []];
    
    const directions = new Set();
    const places = new Set();
    
    for (let i = 0; i < roadSigns.length; i++) {
      const sign = roadSigns[i];
      if (sign.directions) directions.add(sign.directions);
      if (sign.place) places.add(sign.place);
    }
    
    return [Array.from(directions).sort(), Array.from(places).sort()];
  }, [roadSigns]);

  // Optimize groupedRoadSigns calculation
  const groupedRoadSigns = useMemo(() => {
    if (!roadSigns || roadSigns.length === 0) return [];

    const groups = new Map();
    const startDate = formik.values.start_date;
    const endDate = formik.values.end_date;
    
    const requestedStart = startDate ? new Date(startDate) : null;
    const requestedEnd = endDate ? new Date(endDate) : null;

    for (let i = 0; i < roadSigns.length; i++) {
      const sign = roadSigns[i];
      const key = `${sign.city?.name}_${sign.template?.model}_${sign.place}_${sign.region?.name}_${sign.directions || "غير_محدد"}`;
      
      let group = groups.get(key);
      if (!group) {
        group = {
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
        groups.set(key, group);
      }
      
      group.signs.push(sign);
      
      // Calculate availability
      let occupiedPanels = 0;
      const bookings = sign.bookings || [];
      
      if (requestedStart) {
        for (let j = 0; j < bookings.length; j++) {
          const booking = bookings[j];
          const bookingStart = new Date(booking.start_date);
          const bookingEnd = new Date(booking.end_date);
          
          // Check start date
          if (requestedStart >= bookingStart && requestedStart <= bookingEnd) {
            if (requestedStart.getTime() !== bookingEnd.getTime()) {
              occupiedPanels += booking.pivot?.number_of_reserved_panels || 0;
            }
          }
          
          // Check end date
          if (requestedEnd && requestedEnd >= bookingStart && requestedEnd <= bookingEnd) {
            if (requestedEnd.getTime() !== bookingStart.getTime()) {
              occupiedPanels += booking.pivot?.number_of_reserved_panels || 0;
            }
          }
        }
      }
      
      const availablePanels = Math.max(0, sign.panels_number - occupiedPanels);
      group.totalAvailable += availablePanels;
      group.totalPanels += sign.panels_number;
      group.similarSignsCount += 1;
    }

    return Array.from(groups.values());
  }, [roadSigns, formik.values.start_date, formik.values.end_date]);

  // Optimize event handlers
  const toggleGroup = useCallback((groupId) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      newSet.has(groupId) ? newSet.delete(groupId) : newSet.add(groupId);
      return newSet;
    });
  }, []);

  const handleShowDialog = useCallback((group) => {
    setSelectedGroup(group);
    setSelectedQuantity(1);
    setIsDialogOpen(true);
  }, []);

  const handleAddToCart = useCallback(() => {
    if (!selectedGroup) return;

    // Calculate availability once
    let totalAvailable = 0;
    const availableSigns = [];
    
    for (let i = 0; i < selectedGroup.signs.length; i++) {
      const sign = selectedGroup.signs[i];
      if (!addedSignIds?.has?.(sign.id)) {
        // Recalculate availability for this sign
        let occupiedPanels = 0;
        const bookings = sign.bookings || [];
        const requestedStart = formik.values.start_date ? new Date(formik.values.start_date) : null;
        
        if (requestedStart) {
          for (let j = 0; j < bookings.length; j++) {
            const booking = bookings[j];
            const bookingStart = new Date(booking.start_date);
            const bookingEnd = new Date(booking.end_date);
            
            if (requestedStart >= bookingStart && requestedStart <= bookingEnd) {
              if (requestedStart.getTime() !== bookingEnd.getTime()) {
                occupiedPanels += booking.pivot?.number_of_reserved_panels || 0;
              }
            }
          }
        }
        
        const available = Math.max(0, sign.panels_number - occupiedPanels);
        if (available > 0) {
          totalAvailable += available;
          availableSigns.push({ sign, available });
        }
      }
    }

    if (selectedQuantity > totalAvailable) {
      alert(`عذراً، لا يتوفر ${selectedQuantity} لوحات. العدد المتاح الفعلي هو ${totalAvailable}`);
      return;
    }

    if (selectedQuantity < 1) {
      alert("يرجى اختيار عدد صحيح من اللوحات");
      return;
    }

    // Add panels to cart
    let remaining = selectedQuantity;
    const signsToAdd = [];
    
    for (let i = 0; i < availableSigns.length; i++) {
      if (remaining <= 0) break;
      const item = availableSigns[i];
      const addCount = Math.min(item.available, remaining);
      
      for (let j = 0; j < addCount; j++) {
        signsToAdd.push(item.sign);
      }
      remaining -= addCount;
    }

    signsToAdd.forEach((sign) => {
      const uniqueBooking = {
        ...sign,
        cartId: `sign-${sign.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        customDateRanges: [{
          startDate: formik.values.start_date,
          endDate: formik.values.end_date,
          booking_faces: 1,
        }],
      };
      addToCart(uniqueBooking);
    });

    setIsDialogOpen(false);
    setSelectedQuantity(1);
  }, [selectedGroup, selectedQuantity, addedSignIds, formik.values, addToCart]);

  const handleViewSignImage = useCallback((sign) => {
    // Use cached image if available
    const cacheKey = sign.id;
    if (imageCache.has(cacheKey)) {
      setSelectedSignImage(imageCache.get(cacheKey));
    } else {
      const imageData = {
        url: sign.image || sign.template?.image,
        signCode: sign.roadsign_code || "غير متوفر",
        model: sign.template?.model || "غير متوفر",
        city: sign.city?.name || "غير متوفر",
        place: sign.place || "غير متوفر",
        directions: sign.directions || "غير متوفر"
      };
      imageCache.set(cacheKey, imageData);
      setSelectedSignImage(imageData);
    }
    setIsImageModalOpen(true);
  }, []);

  const handleCloseImageModal = useCallback(() => {
    setIsImageModalOpen(false);
  }, []);

  const handleDirectionFilterChange = useCallback((e) => {
    const value = e.target.value;
    handleDirectionChange(value);
    formik.setFieldValue("direction", value);
  }, [handleDirectionChange, formik.setFieldValue]);

  const handlePlaceFilterChange = useCallback((e) => {
    const value = e.target.value;
    handlePlaceChange(value);
    formik.setFieldValue("place", value);
  }, [handlePlaceChange, formik.setFieldValue]);

  const handleResetFilters = useCallback(() => {
    setDirection("");
    setPlace("");
    formik.setFieldValue("direction", "");
    formik.setFieldValue("place", "");
  }, [setDirection, setPlace, formik.setFieldValue]);

  const isSignAdded = useCallback((signId) => {
    return addedSignIds?.has?.(signId);
  }, [addedSignIds]);

  const isGroupAdded = useCallback((groupId) => {
    const group = groupedRoadSigns.find(g => g.id === groupId);
    if (!group) return false;
    for (let i = 0; i < group.signs.length; i++) {
      if (addedSignIds?.has?.(group.signs[i].id)) return true;
    }
    return false;
  }, [groupedRoadSigns, addedSignIds]);

  const getBookingDates = useCallback((sign) => {
    if (!sign.bookings || sign.bookings.length === 0) return null;
    const lastBooking = sign.bookings[sign.bookings.length - 1];
    return {
      start: lastBooking.start_date,
      end: lastBooking.end_date
    };
  }, []);

const generateFilteredPDF = useCallback(() => {
  if (!roadSigns || roadSigns.length === 0) {
    alert("لا توجد بيانات لطباعتها بعد تطبيق الفلاتر الحالية");
    return;
  }

 const createPrintHTML = () => {
  const groups = groupedRoadSigns;
  
  // Build filters text
  const filters = [];
  if (cityId) {
    const cityName = cities?.find(c => c.id === parseInt(cityId))?.name || cityId;
    filters.push(`<span style="background:#e0e0e0; padding:4px 8px; margin:0 5px 5px 0; display:inline-block; border-radius:3px;">المدينة: ${cityName}</span>`);
  }
  if (regionId) {
    const regionName = regions?.find(r => r.id === parseInt(regionId))?.name || regionId;
    filters.push(`<span style="background:#e0e0e0; padding:4px 8px; margin:0 5px 5px 0; display:inline-block; border-radius:3px;">المنطقة: ${regionName}</span>`);
  }
  if (model) filters.push(`<span style="background:#e0e0e0; padding:4px 8px; margin:0 5px 5px 0; display:inline-block; border-radius:3px;">النموذج: ${model}</span>`);
  if (direction) filters.push(`<span style="background:#e0e0e0; padding:4px 8px; margin:0 5px 5px 0; display:inline-block; border-radius:3px;">الاتجاه: ${direction}</span>`);
  if (place) filters.push(`<span style="background:#e0e0e0; padding:4px 8px; margin:0 5px 5px 0; display:inline-block; border-radius:3px;">مكان التموضع: ${place}</span>`);
  if (formik.values.start_date) filters.push(`<span style="background:#e0e0e0; padding:4px 8px; margin:0 5px 5px 0; display:inline-block; border-radius:3px;">تاريخ البداية: ${formik.values.start_date}</span>`);
  if (formik.values.end_date) filters.push(`<span style="background:#e0e0e0; padding:4px 8px; margin:0 5px 5px 0; display:inline-block; border-radius:3px;">تاريخ النهاية: ${formik.values.end_date}</span>`);

  const totalAvailable = groups.reduce((sum, group) => sum + group.totalAvailable, 0);
  const totalPanels = groups.reduce((sum, group) => sum + group.totalPanels, 0);

  return `
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
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
        
        body {
          font-family: 'Arial', sans-serif;
          direction: rtl;
          text-align: right;
          margin: 0;
          padding: 20px;
          color: #000000;
          background-color: #ffffff;
          line-height: 1.6;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #2c3e50;
        }
        
        .header h1 {
          color: #2c3e50;
          margin: 0 0 10px 0;
          font-size: 24px;
        }
        
        .header .date {
          color: #7f8c8d;
          font-size: 14px;
        }
        
        .filters-section {
          background-color: #f8f9fa;
          padding: 15px;
          margin-bottom: 20px;
          border-radius: 5px;
          border: 1px solid #dee2e6;
        }
        
        .filters-section h3 {
          color: #2c3e50;
          margin-top: 0;
          margin-bottom: 10px;
          font-size: 16px;
        }
        
        .summary {
          background-color: #e3f2fd;
          padding: 15px;
          margin-bottom: 20px;
          border-radius: 5px;
          border: 1px solid #bbdefb;
        }
        
        .summary h3 {
          color: #1565c0;
          margin-top: 0;
          margin-bottom: 10px;
          font-size: 16px;
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
          font-size: 11px;
        }
        
        table th {
          background-color: #2c3e50;
          color: #ffffff;
          padding: 10px 8px;
          text-align: center;
          border: 1px solid #34495e;
          font-weight: bold;
        }
        
        table td {
          padding: 8px 6px;
          text-align: center;
          border: 1px solid #dddddd;
          vertical-align: middle;
        }
        
        table tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        
        .group-row {
          background-color: #e8f4fd !important;
          font-weight: bold;
        }
        
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #dddddd;
          color: #7f8c8d;
          font-size: 12px;
        }
        
        .available {
          color: #27ae60;
          font-weight: bold;
        }
        
        .not-available {
          color: #e74c3c;
          font-weight: bold;
        }
        
        .face-count {
          background-color: #e8f4fd;
          border: 1px solid #a8d4fd;
          border-radius: 4px;
          padding: 2px 8px;
          font-weight: bold;
          color: #2c5282;
          display: inline-block;
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
          background-color: #27ae60; /* Green color */
        }
        
        .btn-print:hover {
          background-color: #219653; /* Darker green on hover */
        }
        
        .btn-close {
          background-color: #e74c3c; /* Red color */
        }
        
        .btn-close:hover {
          background-color: #c0392b; /* Darker red on hover */
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>تقرير اللوحات الطرقية</h1>
        <div class="date">
          تم إنشاؤه في: ${new Date().toLocaleDateString('ar-SA')} الساعة ${new Date().toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit'})}
        </div>
      </div>
      
      <div class="filters-section">
        <h3>الفلاتر المطبقة:</h3>
        ${filters.length > 0 ? filters.join('') : '<span style="background:#e0e0e0; padding:4px 8px; margin:0 5px 5px 0; display:inline-block; border-radius:3px;">جميع اللوحات</span>'}
      </div>
      
      <div class="summary">
        <h3>إحصائيات التقرير:</h3>
        <div class="summary-item">• عدد اللوحات: ${roadSigns.length} لوحة</div>
        <div class="summary-item">• عدد المجموعات: ${groups.length} مجموعة</div>
        <div class="summary-item">• اللوحات المتاحة: ${totalAvailable}</div>
        <div class="summary-item">• إجمالي الوجوه: ${totalPanels}</div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>المدينة</th>
            <th>النموذج</th>
            <th>النوع</th>
            <th>عدد اللوحات</th>
            <th>القياس</th>
            <th>المنطقة</th>
            <th>مكان التموضع</th>
            <th>الاتجاه</th>
            <th>الحالة</th>
          </tr>
        </thead>
        <tbody>
          ${groups.map((group, index) => {
            const status = group.totalAvailable > 0 
              ? '<span class="available">🟢 متاح</span>' 
              : '<span class="not-available">🔴 غير متاح</span>';
            
            return `
            <tr class="group-row">
              <td>${index + 1}</td>
              <td>${group.city?.name || 'غير متوفر'}</td>
              <td><strong>${group.template?.model || 'غير متوفر'}</strong></td>
              <td>${group.template?.type || 'غير محدد'}</td>
              <td>
                <div class="face-count">
                  ${group.similarSignsCount} لوحة
                </div>
              </td>
              <td>${normalizeSize(group.template?.size)}</td>
              <td>${group.region?.name || 'غير متوفر'}</td>
              <td>${group.place || 'غير متوفر'}</td>
              <td>${group.directions || 'غير متوفر'}</td>
              <td><strong>${status}</strong></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
      
      <div class="footer">
        <h3>ملاحظات:</h3>
        <p>1. هذا التقرير تم إنشاؤه تلقائياً من نظام إدارة اللوحات الإعلانية</p>
        <p>2. يتم تحديث البيانات تلقائياً وفقاً للحجوزات الفعلية</p>
        <p>3. التواريخ المعتمدة: من ${formik.values.start_date || "غير محدد"} إلى ${formik.values.end_date || "غير محدد"}</p>
        <p style="margin-top: 20px;">
          <strong>© ${new Date().getFullYear()} - نظام إدارة اللوحات الإعلانية</strong><br>
          جميع الحقوق محفوظة
        </p>
      </div>
      
      <div class="controls no-print">
        <button class="btn btn-print" onclick="window.print()">
          🖨️ طباعة
        </button>
        <button class="btn btn-close" onclick="window.close()">
          ❌ إغلاق
        </button>
      </div>
      
      <script>
        window.onload = function() {
          // Add keyboard shortcut for printing (Ctrl+P)
          document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
              e.preventDefault();
              window.print();
            }
            if (e.key === 'Escape') {
              window.close();
            }
          });
        };
      </script>
    </body>
    </html>
  `;
};


  // Open in new window with print dialog
  const htmlContent = createPrintHTML();
  const printWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes');
  
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Focus the window
  printWindow.focus();
}, [roadSigns, direction, place, cityId, regionId, model, formik.values, groupedRoadSigns, cities, regions]);


  const generateFilteredWord = useCallback(() => {
    if (!roadSigns || roadSigns.length === 0) {
      alert("لا توجد بيانات لطباعتها بعد تطبيق الفلاتر الحالية");
      return;
    }

    try {
      const createWordContent = () => {
        const groups = groupedRoadSigns;
        
        let html = `<!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head>
            <meta charset="UTF-8">
            <title>تقرير اللوحات الطرقية</title>
            <style>
              body { font-family: Arial; direction: rtl; padding: 20px; }
              h1 { color: #2c3e50; text-align: center; }
              .filter-info { background: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 10px; text-align: center; }
              th { background-color: #2c3e50; color: white; }
              .group-row { background-color: #f0f8ff; }
            </style>
          </head>
          <body>
            <h1>تقرير اللوحات الطرقية</h1>
            <div class="filter-info">
              <strong>الفلاتر المطبقة:</strong> ${memoizedFiltersText || 'جميع اللوحات'}
            </div>
            <table>
              <thead>
                <tr>
                  <th>#</th><th>المدينة</th><th>النموذج</th><th>عدد اللوحات</th>
                  <th>القياس</th><th>المنطقة</th><th>مكان التموضع</th><th>الاتجاه</th>
                </tr>
              </thead>
              <tbody>`;

        groups.forEach((group, index) => {
          html += `
                <tr class="group-row">
                  <td>${index + 1}</td>
                  <td>${group.city?.name || 'غير متوفر'}</td>
                  <td>${group.template?.model || 'غير متوفر'}</td>
                  <td>${group.similarSignsCount}</td>
                  <td>${normalizeSize(group.template?.size)}</td>
                  <td>${group.region?.name || 'غير متوفر'}</td>
                  <td>${group.place || 'غير متوفر'}</td>
                  <td>${group.directions || 'غير متوفر'}</td>
                </tr>`;
        });

        html += `
              </tbody>
            </table>
            <p style="text-align: center; margin-top: 40px; color: #666;">
              تم إنشاء التقرير في ${new Date().toLocaleDateString('ar-SA')}
            </p>
          </body>
          </html>`;

        return html;
      };

      const htmlContent = createWordContent();
      const blob = new Blob([htmlContent], { type: 'application/msword' });
      const fileName = `تقرير_اللوحات_${new Date().toISOString().slice(0,10)}.doc`;
      saveAs(blob, fileName);
      
    } catch (error) {
      console.error('Error generating Word:', error);
      alert('حدث خطأ أثناء إنشاء ملف Word. يرجى المحاولة مرة أخرى.');
    }
  }, [roadSigns, groupedRoadSigns, memoizedFiltersText]);

  // Optimize useEffect
  useEffect(() => {
    setStartDate(formik.values.start_date);
    setEndDate(formik.values.end_date);
    
    if (formik.values.direction !== undefined && formik.values.direction !== direction) {
      setDirection(formik.values.direction);
    }
    
    if (formik.values.place !== undefined && formik.values.place !== place) {
      setPlace(formik.values.place);
    }
  }, [formik.values.start_date, formik.values.end_date, formik.values.direction, 
      formik.values.place, setStartDate, setEndDate, setDirection, setPlace, direction, place]);

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
        اللوحات الطرقية
      </h2>

      <div className="flex flex-wrap gap-4 mb-6">
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

        <Button
          type="button"
          variant="outline"
          onClick={generateFilteredWord}
          disabled={!roadSigns || roadSigns.length === 0}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          تصدير Word ({roadSigns?.length || 0})
        </Button>
      </div>

      {/* Filter controls */}
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
            className="w-full p-2 border dark:bg-gray-900 border-gray-300 rounded-md"
          >
            <option value="">اختر مدينة</option>
            {cities?.map((city) => (
              <option key={city.id} value={city.id}>{city.name}</option>
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
            className="w-full p-2 border dark:bg-gray-900 border-gray-300 rounded-md"
          >
            {isRegionsLoading || !cityId ? (
              <option>اختر مدينة لإظهار المناطق</option>
            ) : (
              <>
                <option value="">كل المناطق</option>
                {regions?.map((region) => (
                  <option key={region.id} value={region.id}>{region.name}</option>
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
            className="w-full p-2 border dark:bg-gray-900 border-gray-300 rounded-md"
          >
            <option value="">اختر القياس</option>
            {getRoadSignsModel?.map((modelItem) => (
              <option key={modelItem.model} value={modelItem.model}>
                {modelItem.model} ({modelItem.count} نماذج)
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
            className="w-full p-2 border dark:bg-gray-900 border-gray-300 rounded-md"
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
            className="w-full p-2 border dark:bg-gray-900 border-gray-300 rounded-md"
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
          <Button type="button" variant="outline" onClick={handleResetFilters} className="h-10 px-4">
            إعادة تعيين الفلاتر
          </Button>
        </div>
      </div>

      {(direction || place) && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">فلتر نشط:</span>
              <span className="text-sm text-blue-600 dark:text-blue-400">{memoizedFiltersText}</span>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={handleResetFilters} className="h-6 px-2 text-xs">
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
              <TableHead className="text-right">الصورة</TableHead>
              <TableHead className="text-right">إجراء</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isRoadSignsFetching ? (
              <TableRow>
                <TableCell colSpan={14} className="text-center py-4">جاري التحميل...</TableCell>
              </TableRow>
            ) : !groupedRoadSigns || groupedRoadSigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={14} className="text-center py-4">
                  {memoizedFiltersText 
                    ? `لا توجد لوحات متوفرة للبحث "${memoizedFiltersText}" في هذه الفترة`
                    : "لا توجد لوحات متوفرة لهذه الفترة"
                  }
                </TableCell>
              </TableRow>
            ) : (
              groupedRoadSigns.map((group) => (
                <React.Fragment key={group.id}>
                  <GroupRow
                    group={group}
                    isExpanded={expandedGroups.has(group.id)}
                    isGroupAdded={isGroupAdded(group.id)}
                    onToggle={toggleGroup}
                    onShowDialog={handleShowDialog}
                    onViewImage={handleViewSignImage}
                  />
                  
                  {expandedGroups.has(group.id) && (
                    <>
                      {group.signs.map((sign, index) => (
                        <SignRow
                          key={sign.id}
                          sign={sign}
                          index={index}
                          isAdded={isSignAdded(sign.id)}
                          onViewImage={handleViewSignImage}
                          getBookingDates={getBookingDates}
                        />
                      ))}
                    </>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Quantity Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent dir="rtl" className="sm:max-w-[500px] dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="text-right text-gray-800 dark:text-gray-100">
              اختيار عدد اللوحات
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">معلومات المجموعة:</h4>
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
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">⚠️ العدد المطلوب يتجاوز العدد المتاح</p>
              )}
              {selectedGroup?.totalAvailable === 0 && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">⚠️ لا توجد لوحات متاحة في هذه الفترة</p>
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
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={handleCloseImageModal}>
        <DialogContent dir="rtl" className="sm:max-w-[800px] dark:bg-gray-800 max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-right text-gray-800 dark:text-gray-100">
              صورة اللوحة الإعلانية
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto max-h-[70vh]">
            {selectedSignImage ? (
              <>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">معلومات اللوحة:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-400">كود اللوحة:</span>
                      <span className="text-gray-800 dark:text-gray-200 font-medium">{selectedSignImage.signCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-400">النموذج:</span>
                      <span className="text-gray-800 dark:text-gray-200 font-medium">{selectedSignImage.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-400">المدينة:</span>
                      <span className="text-gray-800 dark:text-gray-200 font-medium">{selectedSignImage.city}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-400">المكان:</span>
                      <span className="text-gray-800 dark:text-gray-200 font-medium">{selectedSignImage.place}</span>
                    </div>
                  </div>
                </div>
                
                {selectedSignImage.url ? (
                  <div className="flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
                    <div className="relative w-full max-w-2xl h-auto">
                      <img
                        src={selectedSignImage.url}
                        alt={`صورة اللوحة ${selectedSignImage.signCode}`}
                        className="w-full h-auto rounded-lg shadow-lg max-h-[400px] object-contain"
                        loading="lazy"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNlNWU1ZTUiLz48dGV4dCB4PSIxMDAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NiI+Tm8gSW1hZ2UgQXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==";
                        }}
                      />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                      يمكنك حفظ الصورة بالنقر بزر الماوس الأيمن واختيار "حفظ الصورة باسم"
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 bg-gray-100 dark:bg-gray-900 rounded-lg">
                    <div className="text-gray-400 dark:text-gray-500 mb-4">
                      <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">لا توجد صورة متاحة لهذه اللوحة</p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-64">
                <p className="text-gray-600 dark:text-gray-300">لا توجد بيانات للعرض</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCloseImageModal}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default memo(BookingTable);