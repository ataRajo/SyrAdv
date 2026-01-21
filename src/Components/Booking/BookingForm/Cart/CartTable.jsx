import React, { memo, useContext, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Calculator, Loader2, Package, ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";
import { BookingContext } from "../../../../Context/BookingContext";
import { Toaster } from "react-hot-toast";

const colorPalette = [
  "bg-blue-100 dark:bg-blue-900",
  "bg-green-100 dark:bg-green-900",
  "bg-purple-100 dark:bg-purple-900",
  "bg-yellow-100 dark:bg-yellow-900",
];

const CartTable = () => {
  const {
    selectedSigns,
    removeFromCart,
    calculateBookingPrice,
    isLoadingCalculateReservation,
  } = useContext(BookingContext);

  const [expandedDirections, setExpandedDirections] = useState({});

  // Function to group bookings by النموذج, الاتجاه, المنطقة, المدينة
  const groupedBookings = useMemo(() => {
    if (!selectedSigns || selectedSigns.length === 0) return [];
    
    const groupedMap = {};
    
    selectedSigns.forEach((booking, index) => {
      // Get grouping values - FIX: Use correct field names
      const model = booking.template?.model || "غير محدد";
      const direction = booking.directions || booking.direction || booking.direction_code || "غير محدد";
      const region = booking.region?.name || "غير محدد";
    const city = booking.city?.name || "غير محدد";
const groupKey = `${model}|${direction}|${region}|${city}`;

      
      if (!groupedMap[groupKey]) {
        groupedMap[groupKey] = {
          id: `group-${index}`,
          model: model,
          direction: direction,
          region: region,
          city: city,
          bookings: [booking],
          dateRanges: booking.dateRanges || [],
          totalSigns: 1,
          // Collect all cart IDs for removal
          cartIds: [booking.cartId]
        };
      } else {
        // Add to existing group
        groupedMap[groupKey].bookings.push(booking);
        groupedMap[groupKey].totalSigns += 1;
        groupedMap[groupKey].cartIds.push(booking.cartId);
        
        // Merge date ranges
        if (booking.dateRanges && booking.dateRanges.length > 0) {
          groupedMap[groupKey].dateRanges = [
            ...groupedMap[groupKey].dateRanges,
            ...booking.dateRanges
          ];
        }
      }
    });
    
    // Process each group to calculate totals
    return Object.values(groupedMap).map(group => {
      // Calculate total booking faces
      let totalBookingFaces = 0;
      let totalPrice = 0;
      
      group.bookings.forEach(booking => {
        // Sum booking faces from date ranges
        if (booking.dateRanges) {
          booking.dateRanges.forEach(range => {
            totalBookingFaces += range.booking_faces || 0;
          });
        }
        
        // Sum individual calculations if available
        if (booking.individualCalculation) {
          totalPrice += booking.individualCalculation.price_per_period || 0;
        }
      });
      
      // Combine similar date ranges
      const uniqueDateRanges = [];
      if (group.dateRanges.length > 0) {
        const dateRangeMap = {};
        
        group.dateRanges.forEach(range => {
          const rangeKey = `${range.startDate}|${range.endDate}`;
          if (!dateRangeMap[rangeKey]) {
            dateRangeMap[rangeKey] = {
              ...range,
              booking_faces: range.booking_faces || 0
            };
          } else {
            dateRangeMap[rangeKey].booking_faces += range.booking_faces || 0;
          }
        });
        
        uniqueDateRanges.push(...Object.values(dateRangeMap));
      }
      
      return {
        ...group,
        totalBookingFaces,
        totalPrice,
        dateRanges: uniqueDateRanges,
        // Use the first booking's template for reference
        template: group.bookings[0]?.template,
        place: group.bookings[0]?.place || "غير محدد",
        // Get all unique direction values in case they differ slightly
        allDirections: [...new Set(group.bookings.map(b => 
          b.directions || b.direction || b.direction_code || "غير محدد"
        ))]
      };
    });
  }, [selectedSigns]);

  const getSignColor = (index) => {
    return colorPalette[index % colorPalette.length];
  };

  const toggleDirectionExpansion = (groupId) => {
    setExpandedDirections(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const handleRemoveGroup = (cartIds) => {
    console.log("Removing group with cart IDs:", cartIds);
    // Remove all cart IDs in the group
    cartIds.forEach(cartId => {
      removeFromCart(cartId);
    });
  };

  const handleCalculateGroupPrice = (cartIds) => {
    console.log("Calculating price for group:", cartIds);
    // Calculate price for the first cart in group
    if (cartIds.length > 0) {
      calculateBookingPrice(cartIds[0]);
    }
  };

  if (groupedBookings.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        لا توجد حجوزات في السلة
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupedBookings.map((group, index) => {
        const rowColor = getSignColor(index);
        const isGrouped = group.totalSigns > 1;
        const isDirectionExpanded = expandedDirections[group.id];
        const directionToShow = group.direction;
        const shouldTruncateDirection = directionToShow.length > 50;
        
        return (
          <div key={group.id} className="border rounded-lg overflow-hidden shadow-sm">
            <div className={`${rowColor} p-4 border-b`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {/* Group Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {isGrouped ? (
                        <span className="flex items-center gap-2">
                          <Package className="h-5 w-5" />
                          مجموعة حجوزات ({group.totalSigns} لوحة)
                        </span>
                      ) : (
                        "حجز فردي"
                      )}
                    </h3>
                    
                    {isGrouped && (
                      <span className="px-3 py-1 bg-blue-600 dark:bg-blue-700 text-white text-sm font-medium rounded-full">
                        {group.totalSigns} لوحات
                      </span>
                    )}
                  </div>
                  
                  {/* Group Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">النموذج</div>
                      <div className="font-medium">{group.model}</div>
                      {isGrouped && <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">(مشترك في {group.totalSigns} لوحة)</div>}
                    </div>
                    
                    {/* الاتجاه with expandable view */}
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">الاتجاه</div>
                      <div className="font-medium">
                        {group.direction !== "غير محدد" ? (
                          <div className="relative">
                            <div className={`${shouldTruncateDirection && !isDirectionExpanded ? 'line-clamp-2' : ''}`}>
                              {isDirectionExpanded ? directionToShow : 
                               (shouldTruncateDirection ? directionToShow.substring(0, 50) + '...' : directionToShow)}
                            </div>
                            {shouldTruncateDirection && (
                              <button
                                onClick={() => toggleDirectionExpansion(group.id)}
                                className="text-blue-600 dark:text-blue-400 text-xs mt-1 flex items-center gap-1 hover:underline"
                              >
                                {isDirectionExpanded ? (
                                  <>
                                    <ChevronUp className="h-3 w-3" />
                                    عرض أقل
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-3 w-3" />
                                    عرض المزيد
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="text-orange-600 dark:text-orange-400">
                            غير محدد
                            {group.allDirections.length > 1 && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                (هناك {group.allDirections.length} اتجاه مختلف)
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">المنطقة</div>
                      <div className="font-medium">{group.region}</div>
                    </div>
                    
                  
                  </div>

                  {/* Debug: Show where direction is coming from */}
                  {group.direction === "غير محدد" && (
                    <div className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded border border-yellow-200 dark:border-yellow-700">
                      <div className="text-xs text-yellow-700 dark:text-yellow-300">
                        <div className="font-medium mb-1">معلومات التصحيح:</div>
                        <div className="space-y-1">
                          <div>الحقول المتاحة للاتجاه:</div>
                          {group.bookings.slice(0, 3).map((booking, i) => (
                            <div key={i} className="text-xs">
                              <span className="font-medium">لوحة {i+1}:</span>
                              <span className="mr-2"> directions: "{booking.directions || 'غير موجود'}"</span>
                              <span className="mr-2"> direction: "{booking.direction || 'غير موجود'}"</span>
                              <span> direction_code: "{booking.direction_code || 'غير موجود'}"</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Place and additional info */}
                  <div className="mb-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">المكان:</div>
                    <div className="font-medium bg-white dark:bg-gray-800 p-2 rounded border">
                      {group.place}
                      {isGrouped && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          (نفس المكان لجميع اللوحات)
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Date Ranges - Grouped */}
                  {group.dateRanges.length > 0 && (
                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        فترات الحجز:
                      </div>
                      <div className="space-y-2">
                        {group.dateRanges.map((range, rangeIndex) => (
                          <div key={rangeIndex} className="bg-white dark:bg-gray-800 p-3 rounded border">
                            <div className="flex justify-between items-center mb-2">
                              <div className="text-sm">
                                <span className="text-gray-600 dark:text-gray-400">من: </span>
                                <span className="font-medium">
                                  {range.startDate ? new Date(range.startDate).toLocaleDateString('ar-EG') : "غير محدد"}
                                </span>
                              </div>
                              <div className="text-sm">
                                <span className="text-gray-600 dark:text-gray-400">إلى: </span>
                                <span className="font-medium">
                                  {range.endDate ? new Date(range.endDate).toLocaleDateString('ar-EG') : "غير محدد"}
                                </span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="text-sm">
                                <span className="text-gray-600 dark:text-gray-400">عدد اللوحات: </span>
                                <span className="font-medium">{range.booking_faces || 1}</span>
                              </div>
                              {isGrouped && (
                                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-xs">
                                  مجموع {range.booking_faces} لوحة
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Total Calculation Result */}
                  {group.bookings.some(b => b.individualCalculation) && (
                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900 rounded-lg border border-green-200 dark:border-green-700">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <div className="text-sm font-medium text-green-800 dark:text-green-200">
                            إجمالي سعر المجموعة:
                          </div>
                          {isGrouped && (
                            <div className="text-xs text-green-700 dark:text-green-300">
                              ({group.totalSigns} لوحة × السعر)
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                            {group.totalPrice.toFixed(2)} $
                          </div>
                          {isGrouped && (
                            <div className="text-sm text-green-700 dark:text-green-300">
                              ≈ {(group.totalPrice / group.totalSigns).toFixed(2)} $ لكل لوحة
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Show all printing IDs */}
                      {group.bookings.filter(b => b.individualCalculation).length > 0 && (
                        <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-700">
                          <div className="text-xs text-green-700 dark:text-green-300">
                            أرقام الطباعة:{" "}
                            {group.bookings
                              .filter(b => b.individualCalculation)
                              .map(b => b.individualCalculation.printing_id || "غير محدد")
                              .join("، ")}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  <Button
                    type="button"
                    onClick={() => handleCalculateGroupPrice(group.cartIds)}
                    disabled={isLoadingCalculateReservation}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 min-w-[140px]"
                  >
                    {isLoadingCalculateReservation ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        جاري الحساب...
                      </>
                    ) : (
                      <>
                        <Calculator className="h-4 w-4" />
                        {isGrouped ? "حساب المجموعة" : "حساب السعر"}
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveGroup(group.cartIds)}
                    disabled={isLoadingCalculateReservation}
                    className="flex items-center gap-2 min-w-[140px]"
                  >
                    <Trash2 className="h-4 w-4" />
                    {isGrouped ? "حذف المجموعة" : "حذف الحجز"}
                  </Button>
                  
                  {isGrouped && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      {group.totalSigns} لوحة في هذه المجموعة
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Show individual bookings in group if needed (collapsible) */}
            {isGrouped && (
              <div className="bg-gray-50 dark:bg-gray-800 p-4 border-t">
                <details className="group">
                  <summary className="flex justify-between items-center cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                    <span>عرض اللوحات الفردية ({group.totalSigns} لوحة)</span>
                    <span className="transition-transform group-open:rotate-180">▼</span>
                  </summary>
                  <div className="mt-3 space-y-3">
                    {group.bookings.map((booking, bookingIndex) => (
                      <div key={booking.cartId} className="bg-white dark:bg-gray-900 p-3 rounded border">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-sm font-medium">لوحة {bookingIndex + 1}</div>
                              <div className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                                كود: {booking.roadsign_code || "غير محدد"}
                              </div>
                            </div>
                            
                            {/* Show individual direction details */}
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                              <div className="font-medium mb-1">تفاصيل الاتجاه:</div>
                              <div className="space-y-1">
                                {booking.directions && (
                                  <div>directions: "{booking.directions}"</div>
                                )}
                                {booking.direction && (
                                  <div>direction: "{booking.direction}"</div>
                                )}
                                {booking.direction_code && (
                                  <div>direction_code: "{booking.direction_code}"</div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-sm">
                            {booking.individualCalculation ? (
                              <div className="text-right">
                                <div className="text-green-600 dark:text-green-400 font-medium">
                                  {booking.individualCalculation.price_per_period?.toFixed(2)} $
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  رقم: {booking.individualCalculation.printing_id || "غير محدد"}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">لم يحسب بعد</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}
          </div>
        );
      })}
      <Toaster />
    </div>
  );
};

export default memo(CartTable);