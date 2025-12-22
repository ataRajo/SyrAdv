import React, { memo, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Calculator, Loader2 } from "lucide-react";
import { BookingContext } from "../../../../Context/BookingContext";
import { Toaster } from "react-hot-toast";

const colorPalette = [
  "bg-blue-100 dark:bg-blue-900",
  "bg-green-100 dark:bg-green-900",
];

const CartTable = () => {
  const {
    selectedSigns,
    removeFromCart,
    calculateBookingPrice,
    isLoadingCalculateReservation,
  } = useContext(BookingContext);

  const getSignColor = (index) => {
    return colorPalette[index % colorPalette.length];
  };

  // SIMPLE - just use selectedSigns directly
  const individualBookings = selectedSigns || [];

  const handleRemoveBooking = (cartId) => {
    console.log("Removing:", cartId);
    removeFromCart(cartId);
  };

  const handleCalculatePrice = (cartId) => {
    console.log("Calculating:", cartId);
    calculateBookingPrice(cartId);
  };

  if (individualBookings.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        لا توجد حجوزات في السلة
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {individualBookings.map((booking, index) => {
        const rowColor = getSignColor(index);
        
        return (
          <div key={booking.cartId} className="border rounded-lg overflow-hidden">
            <div className={`${rowColor} p-4 border-b`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    حجز {index + 1}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">النموذج: </span>
                      <span className="font-medium">{booking.template?.model || "غير متوفر"}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">المنطقة: </span>
                      <span className="font-medium">{booking.region?.name || "غير متوفر"}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">المكان: </span>
                      <span className="font-medium">{booking.place || "غير متوفر"}</span>
                    </div>
                  </div>

                  {/* Date Ranges - SIMPLIFIED */}
                  {booking.dateRanges?.map((range, rangeIndex) => (
                    <div key={rangeIndex} className="mt-2 p-2 bg-white dark:bg-gray-800 rounded border">
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex justify-between">
                          <span>من: {range.startDate ? new Date(range.startDate).toLocaleDateString('ar-EG') : "غير محدد"}</span>
                          <span>إلى: {range.endDate ? new Date(range.endDate).toLocaleDateString('ar-EG') : "غير محدد"}</span>
                        </div>
                        <div className="text-center mt-1">
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-xs">
                            {range.booking_faces} لوحة
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Calculation Result - SIMPLIFIED */}
               {booking.individualCalculation && (
  <div className="mt-2 p-2 bg-green-50 dark:bg-green-900 rounded border border-green-200 dark:border-green-700">
    <div className="flex justify-between items-center">
      <span className="text-sm font-medium text-green-800 dark:text-green-200">
        سعر الحجز:
      </span>
      <span className="text-lg font-bold text-green-900 dark:text-green-100">
        {booking.individualCalculation.price_per_period?.toFixed(2)} $
      </span>
    </div>
    <div className="text-xs text-green-700 dark:text-green-300 mt-1">
      (رقم الطباعة: {/* Add printing_id display here */})
    </div>
  </div>
)}
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    onClick={() => handleCalculatePrice(booking.cartId)}
                    disabled={isLoadingCalculateReservation}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    {isLoadingCalculateReservation ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        جاري الحساب...
                      </>
                    ) : (
                      <>
                        <Calculator className="h-4 w-4" />
                        حساب السعر
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveBooking(booking.cartId)}
                    disabled={isLoadingCalculateReservation}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    حذف
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <Toaster />
    </div>
  );
};

export default memo(CartTable);