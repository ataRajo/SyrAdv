import React, { useState, useMemo , useEffect } from "react";
import { 
  useGetOneBookingsQuery, 
  useMoveBookingMutation 
} from "../../RtkQuery/Slice/Booking/BookingApi";
import { 
  useGetRoadSignsQuery 
} from "../../RtkQuery/Slice/RoadSings/RoadSingsApi";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, Info, ArrowRightLeft, Calendar, Package, CheckCircle, XCircle, AlertCircle ,ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react"

export const BookingDetailsAction = ({ booking }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOldSign, setSelectedOldSign] = useState("");
  const [selectedTargetSign, setSelectedTargetSign] = useState("");
  const [isTempMoving, setIsTempMoving] = useState(false);
  const [tempEndDate, setTempEndDate] = useState("");
  const [paginationPage, setPaginationPage] = useState(1);
  const [paginationPerPage, setPaginationPerPage] = useState(50);


  const { data: fullDetails, isLoading: isFetching  } = useGetOneBookingsQuery(booking.id, {
    skip: !isOpen,
  });

  useEffect(() => {
    if (isOpen) {
      setSelectedOldSign("");
      setSelectedTargetSign("");
            setIsTempMoving(false);
      setTempEndDate("");

    }
  }, [isOpen]);

  // Get selected old sign details
  const selectedOldSignDetails = useMemo(() => {
    return fullDetails?.roadsigns?.find(sign => sign.id.toString() === selectedOldSign);
  }, [selectedOldSign, fullDetails]);

  // Fetch available road signs based on template_size of selected old sign
  const { 
    data: availableSignsData, 
    isLoading: isLoadingSigns,
    isFetching: isFetchingSigns
  } = useGetRoadSignsQuery(
    {
      template_size: selectedOldSignDetails?.template?.size,
      start_date: booking?.start_date,
      end_date: booking?.end_date ,
      page : paginationPage ,
      per_page : paginationPerPage 
    },
    { 
      skip: !isOpen || !selectedOldSignDetails?.template?.size
    }
  );

  const [moveBooking, { isLoading: isMoving }] = useMoveBookingMutation();

  // Get available signs (all road signs with same template size)
  const allSignsWithSameTemplate = useMemo(() => {
    if (!availableSignsData) return [];
    
    // Handle different response structures
    if (Array.isArray(availableSignsData)) {
      return availableSignsData;
    }
    if (availableSignsData.data && Array.isArray(availableSignsData.data)) {
      return availableSignsData.data;
    }
    if (availableSignsData.roadSigns && Array.isArray(availableSignsData.roadSigns)) {
      return availableSignsData.roadSigns;
    }
    // Handle the actual response structure with status and data
    if (availableSignsData.status === true && Array.isArray(availableSignsData.data)) {
      return availableSignsData.data;
    }
    return [];
  }, [availableSignsData]);

    const totalItems = availableSignsData?.meta?.total || allSignsWithSameTemplate.length;
  const totalPages = availableSignsData?.meta?.total_pages || 1;



   const availableTargetSigns = useMemo(() => {
    if (!allSignsWithSameTemplate.length || !selectedOldSignDetails) return [];

    return allSignsWithSameTemplate.filter(sign => {
      // Don't include the selected old sign itself
      if (sign.id.toString() === selectedOldSign) return false;
      
     
      return true;
    });
  }, [allSignsWithSameTemplate, selectedOldSignDetails, selectedOldSign]);

  // Validate temp end date against booking end date
  const isTempEndDateValid = useMemo(() => {
    if (!isTempMoving || !tempEndDate || !booking?.end_date) return true;
    const bookingEnd = new Date(booking.end_date);
    const tempEnd = new Date(tempEndDate);
    return tempEnd <= bookingEnd;
  }, [isTempMoving, tempEndDate, booking?.end_date]);


   const handleSwap = async () => {
    if (!selectedOldSign || !selectedTargetSign) {
      toast.error("يرجى اختيار اللوحة القديمة واللوحة الجديدة");
      return;
    }
    if (isTempMoving && !tempEndDate) {
      toast.error("يرجى تحديد تاريخ نهاية النقل المؤقت");
      return;
    }
    if (isTempMoving && !isTempEndDateValid) {
      toast.error("تاريخ نهاية النقل المؤقت يجب أن لا يتجاوز تاريخ نهاية الحجز");
      return;
    }

    try {
      await moveBooking({
        booking_id: booking.id,
        old_roadsign_id: selectedOldSign,
        new_roadsign_id: selectedTargetSign,
        isTempMoving,                         
        ...(isTempMoving && { end_date: tempEndDate }), 
      }).unwrap();
      
      toast.success("تم نقل الحجز بنجاح");
      window.location.reload();
    } catch (err) {
      toast.error(err?.data?.message || "فشل في عملية النقل");
    }
  };

  // Check if we're loading signs
  const isLoadingSignsData = isLoadingSigns || isFetchingSigns;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={cn(
            "text-orange-600 dark:text-orange-400",
            "border-orange-200 dark:border-orange-800",
            "hover:bg-orange-50 dark:hover:bg-orange-950/50",
            "transition-all duration-200"
          )}
        >
          <RefreshCw className="h-4 w-4 ml-1" />
          رؤية التفاصيل / تبديل
        </Button>
      </DialogTrigger>
      
      <DialogContent className={cn(
        "rtl w-[95vw] max-w-[600px]",
        "sm:max-w-[600px]",
        "max-h-[90vh] overflow-y-auto"
      )} dir="rtl">
        <DialogHeader className={cn(
          "border-b pb-4 sticky top-0 bg-white dark:bg-gray-900 z-10",
          "border-gray-200 dark:border-gray-700"
        )}>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-xl">
            <div className="p-1.5 sm:p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Info className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="bg-gradient-to-r from-orange-600 to-orange-500 dark:from-orange-400 dark:to-orange-500 bg-clip-text text-transparent text-sm sm:text-base">
              تفاصيل الحجز وطلب تبديل
            </span>
          </DialogTitle>
        </DialogHeader>

        {isFetching ? (
          <div className="flex flex-col items-center justify-center p-8 sm:p-12 gap-3">
            <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-orange-500 dark:text-orange-400" />
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">جاري تحميل البيانات...</p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6 py-2">
            {/* Current Booking Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className={cn(
                "p-2 sm:p-3 rounded-xl border",
                "bg-blue-50 dark:bg-blue-950/30",
                "border-blue-200 dark:border-blue-800"
              )}>
                <div className="flex items-center gap-1.5 sm:gap-2 text-blue-700 dark:text-blue-400 mb-1">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-[11px] sm:text-xs font-semibold">مدة الحجز</span>
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 break-words">
                  {booking.start_date} → {booking.end_date}
                </p>
              </div>
              <div className={cn(
                "p-2 sm:p-3 rounded-xl border",
                "bg-purple-50 dark:bg-purple-950/30",
                "border-purple-200 dark:border-purple-800"
              )}>
                <div className="flex items-center gap-1.5 sm:gap-2 text-purple-700 dark:text-purple-400 mb-1">
                  <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-[11px] sm:text-xs font-semibold">نوع المنتج</span>
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 break-words">
                  {booking.product_type || "غير محدد"}
                </p>
              </div>
            </div>

            {/* Step 1: Select Old Sign */}
            <div className="space-y-2 sm:space-y-3">
              <label className="text-xs sm:text-sm font-bold block text-gray-700 dark:text-gray-300">
                اللوحة الحالية في هذا الحجز
              </label>
              <select 
                className={cn(
                  "w-full border rounded-lg p-2 sm:p-2.5 text-xs sm:text-sm",
                  "bg-white dark:bg-gray-800",
                  "border-gray-300 dark:border-gray-600",
                  "text-gray-900 dark:text-gray-100",
                  "focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400",
                  "focus:border-transparent transition-all duration-200"
                )}
                value={selectedOldSign}
                onChange={(e) => {
                  setSelectedOldSign(e.target.value);
                  setSelectedTargetSign("");
                }}
              >
                <option value="" className="text-gray-500 dark:text-gray-400">
                  اختر اللوحة المراد استبدالها
                </option>
                {fullDetails?.roadsigns?.map((sign) => (
                  <option key={sign.id} value={sign.id}>
                    {`${sign.roadsign_code || `RS-${sign.id}`} | ${sign.template?.model || 'No Template'} | ${sign.city?.name || 'No City'} | ${sign.place || 'No Place'} | Direction: ${sign.directions || sign.direction || 'N/A'}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Show Selected Sign Details and Target Selection */}
            {selectedOldSign && selectedOldSignDetails && (
              <>
                {/* Template Info */}
                <div className="bg-purple-50 dark:bg-purple-950/20 p-2 sm:p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-purple-700 dark:text-purple-300">قالب اللوحة:</span>
                    <span className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 break-words">
                      {selectedOldSignDetails.template?.model || 'غير محدد'}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                    <span className="text-xs sm:text-sm font-semibold text-purple-700 dark:text-purple-300">مقاس القالب:</span>
                    <span className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 break-words">
                      {selectedOldSignDetails.template?.size || 'غير محدد'}
                    </span>
                  </div>
                </div>

                                {/* Temporary Moving Toggle */}
                <div className={cn(
                  "p-3 sm:p-4 rounded-lg border transition-all duration-200",
                  isTempMoving
                    ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700"
                    : "bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700"
                )}>
                  <label className="flex items-center gap-2 sm:gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isTempMoving}
                      onChange={(e) => {
                        setIsTempMoving(e.target.checked);
                        if (!e.target.checked) setTempEndDate("");
                      }}
                      className="h-4 w-4 sm:h-5 sm:w-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Clock className={cn(
                        "h-4 w-4 sm:h-5 sm:w-5",
                        isTempMoving ? "text-amber-600 dark:text-amber-400" : "text-gray-500 dark:text-gray-400"
                      )} />
                      <div>
                        <span className={cn(
                          "text-xs sm:text-sm font-semibold block",
                          isTempMoving ? "text-amber-700 dark:text-amber-300" : "text-gray-700 dark:text-gray-300"
                        )}>
                          نقل مؤقت
                        </span>
                        <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                          {isTempMoving
                            ? "سيتم إرجاع اللوحة الأصلية تلقائياً بعد انتهاء المدة"
                            : "انقر لتمكين النقل المؤقت مع تحديد تاريخ انتهاء"}
                        </span>
                      </div>
                    </div>
                  </label>

                  {/* End Date Input (only when temp moving) */}
                  {isTempMoving && (
                    <div className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2">
                      <label className="text-[11px] sm:text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                        تاريخ نهاية النقل المؤقت
                      </label>
                                         <input
                        type="date"
                        value={tempEndDate}
                        onChange={(e) => setTempEndDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        max={booking?.end_date || ""}
                        className={cn(
                          "w-full border rounded-lg p-2 sm:p-2.5 text-xs sm:text-sm",
                          "bg-white dark:bg-gray-800",
                          !isTempEndDateValid && tempEndDate
                            ? "border-red-400 dark:border-red-600 focus:ring-red-500"
                            : "border-amber-300 dark:border-amber-700 focus:ring-amber-500",
                          "text-gray-900 dark:text-gray-100",
                          "focus:ring-2 dark:focus:ring-amber-400",
                          "focus:border-transparent transition-all duration-200"
                        )}
                      />
                                          {!isTempEndDateValid && tempEndDate && (
                        <p className="text-[10px] sm:text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          تاريخ النقل المؤقت يجب أن يكون قبل أو يساوي {booking.end_date}
                        </p>
                      )}
                      <p className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400">
                        ⚠️ بعد هذا التاريخ، ستعود اللوحة الأصلية ({selectedOldSignDetails.roadsign_code || `RS-${selectedOldSignDetails.id}`}) للحجز
                      </p>
                      
                    </div>
                  )}
                </div>
                

                {/* Info Box */}
                <div className={cn(
                  "p-3 sm:p-4 rounded-lg border",
                  "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                )}>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300 font-semibold">
                        معلومات اللوحة
                      </p>
                      <p className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 mt-0.5 sm:mt-1">
                        سيتم نقل الحجز من هذه اللوحة إلى لوحة جديدة
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 2: Select New Sign Dropdown */}
                <div className={cn(
                  "p-3 sm:p-5 rounded-xl border-2 border-dashed transition-all duration-200",
                  "bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800",
                  "border-orange-200 dark:border-orange-800"
                )}>
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                    <div className="p-1 sm:p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                      <ArrowRightLeft className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <label className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300">
                      نقل إلى لوحة جديدة (نفس المقاس - غير محجوزة)
                    </label>
                  </div>
                                          {/* Pagination Controls */}
                        {availableTargetSigns.length > 0 && (
                          <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                              عرض {availableTargetSigns.length} من {totalItems} لوحة
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => setPaginationPage(p => Math.max(1, p - 1))}
                                disabled={paginationPage <= 1}
                              >
                                <ChevronRight className="h-3 w-3" />
                              </Button>
                              <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-300 px-2">
                                {paginationPage} / {totalPages}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => setPaginationPage(p => Math.min(totalPages, p + 1))}
                                disabled={paginationPage >= totalPages}
                              >
                                <ChevronLeft className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}

                  
                  <div className="space-y-2 sm:space-y-3">
                    {isLoadingSignsData ? (
                      <div className="flex justify-center py-3 sm:py-4">
                        <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-orange-500" />
                      </div>
                    ) : (
                      <>
                        <select
                          className={cn(
                            "w-full border rounded-lg p-2 sm:p-2.5 text-xs sm:text-sm",
                            "bg-white dark:bg-gray-800",
                            "border-gray-300 dark:border-gray-600",
                            "text-gray-900 dark:text-gray-100",
                            "focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400",
                            "focus:border-transparent transition-all duration-200"
                          )}
                          value={selectedTargetSign}
                          onChange={(e) => setSelectedTargetSign(e.target.value)}
                        >
                          <option value="">-- اختر لوحة بديلة --</option>
                          {availableTargetSigns.map(sign => (
                            <option key={sign.id} value={sign.id}>
                              {sign.roadsign_code || `RS-${sign.id}`} | 
                              {sign.city?.name || 'غير محدد'} | 
                              {sign.place || 'موقع غير محدد'} -
                              الاتجاه: {sign.directions || 'غير محدد'}
                            </option>
                          ))}
                        </select>

                        {/* Show count of available signs */}
                        {availableTargetSigns.length > 0 && (
                          <div className="text-[10px] sm:text-xs text-green-600 dark:text-green-400">
                            ✓ متاح {availableTargetSigns.length} لوحة غير محجوزة بنفس المقاس
                          </div>
                        )}

                        {/* Show selected sign details */}
                        {selectedTargetSign && (
                          <div className={cn(
                            "p-2 sm:p-3 rounded-lg",
                            "bg-purple-50 dark:bg-purple-950/20",
                            "border border-purple-200 dark:border-purple-800"
                          )}>
                            <div className="text-xs sm:text-sm text-purple-700 dark:text-purple-300">
                              <span className="font-semibold">اللوحة المختارة:</span>
                              <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 text-[10px] sm:text-xs">
                                {(() => {
                                  const selected = availableTargetSigns.find(s => s.id == selectedTargetSign);
                                  if (!selected) return null;
                                  
                                  return (
                                    <>
                                      <div>الكود: {selected.roadsign_code || `RS-${selected.id}`}</div>
                                      <div>المدينة: {selected.city?.name || 'غير محدد'}</div>
                                      <div>المنطقة: {selected.region?.name || 'غير محدد'}</div>
                                      <div>المقاس: {selected.template?.size || 'غير محدد'}</div>
                                      <div>الموقع: {selected.place || 'غير محدد'}</div>
                                      <div>الاتجاه: {selected.directions || selected.direction || 'غير محدد'}</div>
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* No available signs message */}
                        {availableTargetSigns.length === 0 && !isLoadingSignsData && (
                          <div className={cn(
                            "flex items-start gap-1.5 p-2 sm:p-3 rounded-lg",
                            "bg-red-50 dark:bg-red-950/20",
                            "border border-red-200 dark:border-red-800"
                          )}>
                            <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                            <p className="text-[10px] sm:text-xs text-red-700 dark:text-red-400">
                              ⚠️ لا توجد لوحات غير محجوزة متاحة للتبديل بنفس المقاس ({selectedOldSignDetails.template?.size || 'هذا المقاس'})
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 sm:gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setIsOpen(false)} 
                className={cn(
                  "flex-1 text-xs sm:text-sm",
                  "border-gray-300 dark:border-gray-600",
                  "hover:bg-gray-50 dark:hover:bg-gray-800"
                )}
              >
                إلغاء
              </Button>
              <Button 
                onClick={handleSwap} 
                disabled={isMoving || !selectedOldSign || !selectedTargetSign || availableTargetSigns.length === 0 || (isTempMoving && !tempEndDate) || (isTempMoving && !isTempEndDateValid)}
              >
                {isMoving ? (
                  <>
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin ml-1 sm:ml-2" />
                    جاري التبديل...
                  </>
                ) : (
                  isTempMoving ? "تأكيد النقل المؤقت" : "تأكيد التبديل"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};