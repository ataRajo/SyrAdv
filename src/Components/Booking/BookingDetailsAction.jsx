import React, { useState, useMemo } from "react";
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
import { RefreshCw, Loader2, Info, ArrowRightLeft, Calendar, Package, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

export const BookingDetailsAction = ({ booking }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOldSign, setSelectedOldSign] = useState("");
  const [selectedTargetSign, setSelectedTargetSign] = useState("");

  // Fetch current booking details
  const { data: fullDetails, isLoading: isFetching } = useGetOneBookingsQuery(booking.id, {
    skip: !isOpen,
  });

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
      template_size: selectedOldSignDetails?.template?.size, // Changed from template_id to template_size
    },
    { 
      skip: !isOpen || !selectedOldSignDetails?.template?.size // Changed to check template.size
    }
  );

  const [moveBooking, { isLoading: isMoving }] = useMoveBookingMutation();

  // Check if selected old sign has active bookings (status === 1)
  const hasActiveBookings = useMemo(() => {
    if (!selectedOldSignDetails) return false;
    return selectedOldSignDetails.bookings?.some(booking => booking.status === 1) || false;
  }, [selectedOldSignDetails]);

  // Get the first active booking from the selected sign
  const firstActiveBooking = useMemo(() => {
    if (!selectedOldSignDetails) return null;
    return selectedOldSignDetails.bookings?.find(booking => booking.status === 1);
  }, [selectedOldSignDetails]);

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
    return [];
  }, [availableSignsData]);

  // Calculate available target signs (unbooked only, same logic as ExchangeDialog)
  const availableTargetSigns = useMemo(() => {
    if (!allSignsWithSameTemplate.length || !selectedOldSignDetails) return [];

    return allSignsWithSameTemplate.filter(sign => {
      // Don't include the same road sign
      if (sign.id === selectedOldSignDetails.id) return false;
      
      // Filter by unbooked status (MOST IMPORTANT)
      const hasBookings = sign.bookings && 
                         Array.isArray(sign.bookings) && 
                         sign.bookings.some(b => b.status === 1);
      
      const hasPivotBookings = sign.pivot && 
                              sign.pivot.booking_faces && 
                              sign.pivot.booking_faces > 0;
      
      // Only return signs that are completely unbooked
      return !hasBookings && !hasPivotBookings;
    });
  }, [allSignsWithSameTemplate, selectedOldSignDetails]);

  const handleSwap = async () => {
    if (!selectedOldSign || !selectedTargetSign) {
      toast.error("يرجى اختيار اللوحة القديمة واللوحة الجديدة");
      return;
    }

    if (!firstActiveBooking) {
      toast.error("لا يوجد حجز نشط على هذه اللوحة");
      return;
    }

    try {
      await moveBooking({
        booking_id: firstActiveBooking.id,
        old_roadsign_id: selectedOldSign,
        new_roadsign_id: selectedTargetSign,
      }).unwrap();
      
      toast.success("تم نقل الحجز بنجاح");
      setIsOpen(false);
      setSelectedTargetSign("");
      setSelectedOldSign("");
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
            {/* Current Booking Summary - Responsive Grid */}
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

            {/* Show Selected Sign Details */}
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

                {/* Booking Status */}
                <div className={cn(
                  "p-3 sm:p-4 rounded-lg border",
                  hasActiveBookings 
                    ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                    : "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800"
                )}>
                  <div className="flex items-center gap-2 sm:gap-3">
                    {hasActiveBookings ? (
                      <>
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <div>
                          <p className="text-xs sm:text-sm text-green-800 dark:text-green-300 font-semibold">
                            ✅ اللوحة مؤهلة للتبديل
                          </p>
                          <p className="text-[10px] sm:text-xs text-green-600 dark:text-green-400 mt-0.5 sm:mt-1">
                            يوجد {selectedOldSignDetails.bookings?.filter(b => b.status === 1).length || 0} حجز نشط
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                        <div>
                          <p className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-300 font-semibold">
                            ⚠️ هذه اللوحة غير مؤهلة للتبديل
                          </p>
                          <p className="text-[10px] sm:text-xs text-yellow-600 dark:text-yellow-400 mt-0.5 sm:mt-1">
                            اللوحة يجب أن تحتوي على حجوزات نشطة
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Step 2: Select New Sign (Dropdown) */}
                {hasActiveBookings && (
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
                                {sign.place || 'موقع غير محدد'}
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
                )}
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
                disabled={isMoving || !hasActiveBookings || !selectedOldSign || !selectedTargetSign || availableTargetSigns.length === 0}
                className={cn(
                  "flex-1 bg-gradient-to-r from-orange-600 to-orange-500",
                  "hover:from-orange-700 hover:to-orange-600",
                  "dark:from-orange-500 dark:to-orange-600",
                  "dark:hover:from-orange-600 dark:hover:to-orange-700",
                  "text-white shadow-lg transition-all duration-200",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "text-xs sm:text-sm"
                )}
              >
                {isMoving ? (
                  <>
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin ml-1 sm:ml-2" />
                    جاري التبديل...
                  </>
                ) : (
                  "تأكيد التبديل"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};