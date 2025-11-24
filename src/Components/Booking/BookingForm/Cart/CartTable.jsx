import React, { memo, useContext } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Calculator, Loader2 } from "lucide-react";
import { BookingContext } from "../../../../Context/BookingContext";
import { showToast } from "../../../../utils/Notifictions/showToast";
import { Toaster } from "react-hot-toast";

const colorPalette = [
  "bg-blue-100 dark:bg-blue-900",
  "bg-green-100 dark:bg-green-900",
  "bg-yellow-100 dark:bg-yellow-900",
  "bg-red-100 dark:bg-red-900",
  "bg-purple-100 dark:bg-purple-900",
  "bg-pink-100 dark:bg-pink-900",
  "bg-indigo-100 dark:bg-indigo-900",
  "bg-teal-100 dark:bg-teal-900",
];

const CartTable = () => {
  const {
    selectedSigns,
    roadSigns,
    updateSignFaces,
    removeFromCart,
    calculateTotal,
    calculateBookingPrice,
    isEditMode,
    bookingData,
    groupedBookings,
    isLoadingCalculateReservation,
  } = useContext(BookingContext);

  const getSignColor = (roadSignId) => {
    const index = roadSignId % colorPalette.length;
    return colorPalette[index];
  };

  const getDatesInRange = (startDate, endDate) => {
    const dates = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
      dates.push(currentDate.toDateString());
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  };

  const getMaxAvailablePanels = (sign, startDate, endDate, rangeIndex) => {
    const roadSign = roadSigns?.data?.find((rs) => rs.id === sign.road_sign_id);
    if (!roadSign || !startDate || !endDate) return 0;

    let maxPanels = roadSign.panels_number;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check availability ranges
    for (const range of roadSign.available_date_ranges) {
      const rangeStart = new Date(range.start_date);
      const rangeEnd = new Date(range.end_date);

      if (start <= rangeEnd && end >= rangeStart) {
        maxPanels = Math.min(maxPanels, range.available_panels);
      }
    }

    // Check existing bookings
    for (const booked of roadSign.booking_dates) {
      const bookedStart = new Date(booked.start_date);
      const bookedEnd = new Date(booked.end_date);

      const currentBookedSignInEditMode =
        isEditMode &&
        bookingData?.roadsigns?.some(
          (rs) =>
            rs.id === sign.road_sign_id &&
            new Date(rs.pivot.start_date).getTime() === bookedStart.getTime() &&
            new Date(rs.pivot.end_date).getTime() === bookedEnd.getTime()
        );

      if (!currentBookedSignInEditMode) {
        if (
          (start >= bookedStart && start < bookedEnd) ||
          (end > bookedStart && end <= bookedEnd) ||
          (start <= bookedStart && end >= bookedEnd)
        ) {
          maxPanels = 0;
          break;
        }
      }
    }

    // Add existing booking panels in edit mode
    if (isEditMode) {
      const existingBooking = bookingData?.roadsigns?.find(
        (rs) =>
          rs.id === sign.road_sign_id &&
          new Date(rs.pivot.start_date).toDateString() ===
            new Date(sign.dateRanges[rangeIndex]?.startDate).toDateString() &&
          new Date(rs.pivot.end_date).toDateString() ===
            new Date(sign.dateRanges[rangeIndex]?.endDate).toDateString()
      );
      if (existingBooking) {
        maxPanels += existingBooking?.pivot?.number_of_reserved_panels;
      }
    }

    return maxPanels;
  };

  const validateDateRange = (sign, newStartDate, newEndDate, rangeIndex) => {
    const roadSign = roadSigns?.data?.find((rs) => rs.id === sign.road_sign_id);
    if (!roadSign || !newStartDate || !newEndDate) {
      showToast("error", "الرجاء تحديد تاريخ بداية ونهاية.");
      return false;
    }

    const start = new Date(newStartDate);
    const end = new Date(newEndDate);

    if (start.getTime() > end.getTime()) {
      showToast("error", "تاريخ البداية يجب أن يكون قبل أو يساوي تاريخ النهاية.");
      return false;
    }

    // Check conflicts with booked dates
    for (const booked of roadSign.booking_dates) {
      const bookedStart = new Date(booked.start_date);
      const bookedEnd = new Date(booked.end_date);

      const isCurrentBookingOriginal =
        isEditMode &&
        bookingData?.roadsigns.some(
          (rs) =>
            rs.id === sign.road_sign_id &&
            new Date(rs.pivot.start_date).getTime() === bookedStart.getTime() &&
            new Date(rs.pivot.end_date).getTime() === bookedEnd.getTime()
        );

      if (isCurrentBookingOriginal) continue;

      if (
        (start >= bookedStart && start < bookedEnd) ||
        (end > bookedStart && end <= bookedEnd) ||
        (start <= bookedStart && end >= bookedEnd)
      ) {
        showToast(
          "error",
          `تاريخ الحجز يتعارض مع حجز موجود من ${booked.start_date} إلى ${booked.end_date}.`
        );
        return false;
      }
    }

    // Check availability ranges
    const availableDatesSet = new Set();
    for (const range of roadSign.available_date_ranges) {
      getDatesInRange(range.start_date, range.end_date).forEach((date) =>
        availableDatesSet.add(date)
      );
    }

    let currentCheckDate = new Date(newStartDate);
    const finalEndDateInclusive = new Date(newEndDate);

    while (currentCheckDate <= finalEndDateInclusive) {
      if (!availableDatesSet.has(currentCheckDate.toDateString())) {
        showToast(
          "error",
          "الفترة المطلوبة غير متاحة بالكامل ضمن النطاقات المعلنة."
        );
        return false;
      }
      currentCheckDate.setDate(currentCheckDate.getDate() + 1);
    }

    return true;
  };

  if (groupedBookings.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        لا توجد حجوزات في السلة
      </div>
    );
  }

  return (
    <div>
      <Button
        type="button"
        onClick={calculateTotal}
        disabled={isLoadingCalculateReservation}
        className="mb-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
      >
        {isLoadingCalculateReservation ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            جاري حساب التكلفة...
          </>
        ) : (
          "حساب التكلفة الإجمالية"
        )}
      </Button>

      {groupedBookings.map((bookingGroup, groupIndex) => {
        const roadSign = bookingGroup.roadSign;
        const rowColor = getSignColor(bookingGroup.road_sign_id);
        const individualCalculation = bookingGroup.individualCalculation;
        const isBookingLoading = bookingGroup.isLoading; // Individual loading state
        
        return (
          <div key={bookingGroup.road_sign_id} className="mb-8 border rounded-lg overflow-hidden">
            {/* Booking Header */}
            <div className={`${rowColor} p-4 border-b`}>
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    الحجز {groupIndex + 1}: {roadSign?.template?.model || "غير متوفر"} - {roadSign?.template?.type || "غير محدد"}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    المنطقة: {roadSign?.region.name || "غير متوفر"} | المكان: {roadSign?.place || "غير متوفر"}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    إجمالي اللوحات: {bookingGroup.totalFaces} | إجمالي الدورات: {bookingGroup.totalUnits}
                  </p>
                  
                  {/* Individual Booking Calculation Result */}
                  {individualCalculation && (
                    <div className="mt-2 p-2 bg-green-50 dark:bg-green-900 rounded border border-green-200 dark:border-green-700">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-green-800 dark:text-green-200">
                          سعر هذا الحجز:
                        </span>
                        <span className="text-lg font-bold text-green-900 dark:text-green-100">
                          {individualCalculation.price_per_period?.toFixed(2)} $
                        </span>
                      </div>
                      <div className="text-xs text-green-700 dark:text-green-300 mt-1">
                        مساحة الإعلان: {individualCalculation.amount?.total_advertising_space.toFixed(2)} متر | 
                        مساحة الطباعة: {individualCalculation.amount?.total_printing_space.toFixed(2)} متر
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    onClick={() => calculateBookingPrice(bookingGroup.road_sign_id)}
                    disabled={isBookingLoading || isLoadingCalculateReservation}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    {isBookingLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        جاري الحساب...
                      </>
                    ) : (
                      <>
                        <Calculator className="h-4 w-4" />
                        حساب سعر الحجز
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeFromCart(bookingGroup.road_sign_id)}
                    disabled={isBookingLoading || isLoadingCalculateReservation}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    حذف الحجز
                  </Button>
                </div>
              </div>
            </div>

            {/* Booking Details Table */}
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-gray-800">
                  <TableHead className="text-right w-auto">تاريخ البداية</TableHead>
                  <TableHead className="text-right w-auto">تاريخ النهاية</TableHead>
                  <TableHead className="text-right w-20">عدد اللوحات المطلوب</TableHead>
                  <TableHead className="text-right w-16">عدد الدورات</TableHead>
                  <TableHead className="text-right w-16">إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookingGroup.dateRanges.map((range, index) => {
                  const maxPanels = getMaxAvailablePanels(
                    { road_sign_id: bookingGroup.road_sign_id },
                    range.startDate,
                    range.endDate,
                    index
                  );

                  return (
                    <TableRow
                      key={`${bookingGroup.road_sign_id}-${index}`}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${rowColor}`}
                    >
                      <TableCell>
                        <Input
                          type="date"
                          value={range.startDate}
                          onChange={(e) => {
                            if (
                              validateDateRange(
                                { road_sign_id: bookingGroup.road_sign_id },
                                e.target.value,
                                range.endDate,
                                index
                              )
                            ) {
                              updateSignFaces(bookingGroup.road_sign_id, index, {
                                booking_faces: range.booking_faces,
                                startDate: e.target.value,
                                endDate: range.endDate,
                                units: range.units,
                              });
                            }
                          }}
                          disabled={isBookingLoading || isLoadingCalculateReservation}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          value={range.endDate}
                          onChange={(e) => {
                            if (
                              validateDateRange(
                                { road_sign_id: bookingGroup.road_sign_id },
                                range.startDate,
                                e.target.value,
                                index
                              )
                            ) {
                              updateSignFaces(bookingGroup.road_sign_id, index, {
                                booking_faces: range.booking_faces,
                                startDate: range.startDate,
                                endDate: e.target.value,
                                units: range.units,
                              });
                            }
                          }}
                          disabled={isBookingLoading || isLoadingCalculateReservation}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          max={maxPanels}
                          value={range.booking_faces}
                          onChange={(e) =>
                            updateSignFaces(bookingGroup.road_sign_id, index, {
                              booking_faces: parseInt(e.target.value) || 1,
                              startDate: range.startDate,
                              endDate: range.endDate,
                              units: range.units,
                            })
                          }
                          disabled={isBookingLoading || isLoadingCalculateReservation}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={range.units || 1}
                          onChange={(e) =>
                            updateSignFaces(bookingGroup.road_sign_id, index, {
                              units: parseInt(e.target.value) || 1,
                              startDate: range.startDate,
                              endDate: range.endDate,
                              booking_faces: range.booking_faces,
                            })
                          }
                          disabled={isBookingLoading || isLoadingCalculateReservation}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeFromCart(bookingGroup.road_sign_id, index)}
                          disabled={isBookingLoading || isLoadingCalculateReservation}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        );
      })}
      <Toaster />
    </div>
  );
};

export default memo(CartTable);