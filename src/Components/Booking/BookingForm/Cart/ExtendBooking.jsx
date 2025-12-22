// components/ExtendBooking/ExtendBooking.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { 
  useGetOneBookingsQuery, 
  useExtendBookingMutation,
  useCalculateReservationMutation
} from "../../../../RtkQuery/Slice/Booking/BookingApi";
import { showToast } from "../../../../../src/utils/Notifictions/showToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@iconify/react";

const ExtendBooking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: booking, isLoading, error } = useGetOneBookingsQuery(id);
  const [extendBooking, { isLoading: isExtending }] = useExtendBookingMutation();
  const [calculateReservation, { isLoading: isCalculating }] = useCalculateReservationMutation();
  
  const [newEndDate, setNewEndDate] = useState("");
  const [calculatedAmount, setCalculatedAmount] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState("percentage");
  const [selectedRoadSigns, setSelectedRoadSigns] = useState([]);

  useEffect(() => {
    if (booking?.end_date) {
      setNewEndDate(booking.end_date.split('T')[0]);
    }
    if (booking?.roadsigns) {
      // Initialize with all road signs selected
      setSelectedRoadSigns(booking.roadsigns.map(sign => sign.id));
    }
  }, [booking]);

  const handleToggleRoadSign = (signId) => {
    setSelectedRoadSigns(prev => {
      const newSelected = prev.includes(signId)
        ? prev.filter(id => id !== signId)
        : [...prev, signId];
      
      // If calculation was already done, reset it when selection changes
      if (calculatedAmount) {
        setCalculatedAmount(null);
        setDiscount(0);
      }
      
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    if (booking?.roadsigns) {
      const allIds = booking.roadsigns.map(sign => sign.id);
      setSelectedRoadSigns(allIds);
      
      if (calculatedAmount) {
        setCalculatedAmount(null);
        setDiscount(0);
      }
    }
  };

  const handleDeselectAll = () => {
    setSelectedRoadSigns([]);
    
    if (calculatedAmount) {
      setCalculatedAmount(null);
      setDiscount(0);
    }
  };

  const calculateFinalPrice = (price) => {
    if (!price) return 0;
    
    let finalPrice = price;
    
    if (discount > 0) {
      if (discountType === "percentage") {
        finalPrice = price - (price * discount / 100);
      } else {
        finalPrice = price - discount;
      }
    }
    
    return Math.max(0, Math.round(finalPrice));
  };

  const handleCalculatePrice = async () => {
  if (!newEndDate) {
    showToast("error", "يرجى اختيار تاريخ نهاية جديد أولاً");
    return;
  }

  if (selectedRoadSigns.length === 0) {
    showToast("error", "يرجى اختيار لوحة إعلانية واحدة على الأقل");
    return;
  }

  const currentEndDate = new Date(booking.end_date);
  const extendedEndDate = new Date(newEndDate);
  
  if (extendedEndDate <= currentEndDate) {
    showToast("error", "يجب أن يكون التاريخ الجديد بعد تاريخ النهاية الحالي");
    return;
  }

  try {
    // Calculate the extension start date (current end date + 1 day)
    const extensionStartDate = new Date(currentEndDate);
    extensionStartDate.setDate(extensionStartDate.getDate() + 1);
    
    // Format date to YYYY-MM-DD
    const formatDate = (date) => {
      return date.toISOString().split('T')[0];
    };

    const startDateStr = formatDate(extensionStartDate);
    const endDateStr = formatDate(extendedEndDate);

    // Filter road signs to include only selected ones
    const selectedSignsData = booking.roadsigns.filter(sign => 
      selectedRoadSigns.includes(sign.id)
    );

    const calculateData = {
      start_date: startDateStr,
      end_date: endDateStr,
      roadsigns: selectedSignsData.map(sign => ({
        road_sign_id: sign.id,
        booking_faces: sign.pivot.booking_faces,
        number_of_reserved_panels: sign.pivot.number_of_reserved_panels,
        start_date: startDateStr,
        end_date: endDateStr
      })),
      product_type: booking.product_type,
      printing_id: booking.printing_id,
      is_extend: true 
    };

    const result = await calculateReservation(calculateData).unwrap();
    
    const amount = result?.amount?.total_price;
    setCalculatedAmount(amount);
    showToast("success", "تم حساب السعر الجديد بنجاح");
  } catch (error) {
    console.error("Calculation error:", error);
    showToast("error", error.data?.message || "حدث خطأ أثناء حساب السعر");
  }
};


 const handleExtendBooking = async () => {
  if (!newEndDate) {
    showToast("error", "يرجى اختيار تاريخ نهاية جديد");
    return;
  }

  if (selectedRoadSigns.length === 0) {
    showToast("error", "يرجى اختيار لوحة إعلانية واحدة على الأقل");
    return;
  }

  try {
    const finalPrice = calculateFinalPrice(calculatedAmount);

    // Filter road signs to include only selected ones
    const selectedSignsData = booking.roadsigns.filter(sign => 
      selectedRoadSigns.includes(sign.id)
    );

    // Calculate the extension start date (current end date + 1 day)
    const currentEndDate = new Date(booking.end_date);
    const extensionStartDate = new Date(currentEndDate);
    extensionStartDate.setDate(extensionStartDate.getDate() + 1);
    
    // Format date to YYYY-MM-DD
    const formatDate = (date) => {
      return date.toISOString().split('T')[0];
    };

    const startDateStr = formatDate(extensionStartDate);
    const endDateStr = formatDate(new Date(newEndDate));

    const extendData = {
      end_date: endDateStr,
      roadsigns: selectedSignsData.map(sign => ({
        road_sign_id: sign.id,
        booking_faces: sign.pivot.booking_faces,
        number_of_reserved_panels: sign.pivot.number_of_reserved_panels,
        start_date: startDateStr,
        end_date: endDateStr
      })),
      product_type: booking.product_type,
      printing_id: booking.printing_id,
      total_price: finalPrice,
      discount: discount > 0 ? {
        amount: discount,
        type: discountType,
        original_price: calculatedAmount
      } : null
    };

    await extendBooking({ id, ...extendData }).unwrap();
    showToast("success", `تم تمديد الحجز ${discount > 0 ? 'مع الخصم ' : ''}بنجاح`);
    navigate("/dashboard/bookings");
  } catch (error) {
    showToast("error", error.data?.message || "حدث خطأ أثناء تمديد الحجز");
  }
};

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 text-center">
        <div className="text-red-500 text-xl">خطأ في تحميل بيانات الحجز</div>
        <Button onClick={() => navigate("/dashboard/bookings")} className="mt-4">
          العودة إلى الحجوزات
        </Button>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto p-6 text-center">
        <div className="text-xl">الحجز غير موجود</div>
        <Button onClick={() => navigate("/dashboard/bookings")} className="mt-4">
          العودة إلى الحجوزات
        </Button>
      </div>
    );
  }

  const allSelected = selectedRoadSigns.length === booking.roadsigns?.length;
  const noneSelected = selectedRoadSigns.length === 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon icon="mdi:calendar-plus" className="text-2xl text-orange-500" />
          <h1 className="text-2xl font-bold">تمديد الحجز #{booking.id}</h1>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate("/dashboard/bookings")}
        >
          العودة للحجوزات
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="mdi:information" className="text-blue-500" />
              معلومات الحجز الحالية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">العميل</Label>
                <p className="text-lg">{booking.customer?.company_name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">نوع الحجز</Label>
                <p className="text-lg">{booking.type === 1 ? "مؤقت" : "دائم"}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">رقم الطباعة</Label>
                <p className="text-lg">{booking.printing_id || "غير محدد"}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">تاريخ البداية</Label>
                <p className="text-lg">{new Date(booking.start_date).toLocaleDateString('ar-EG')}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">تاريخ النهاية الحالي</Label>
                <p className="text-lg">{new Date(booking.end_date).toLocaleDateString('ar-EG')}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">المدة الحالية</Label>
                <p className="text-lg">{booking.duration_of_days} يوم</p>
              </div>
              <div>
                <Label className="text-sm font-medium">السعر الحالي</Label>
                <p className="text-lg">{booking.total_price} $</p>
              </div>
            </div>

            {/* Road Signs */}
           <div className="space-y-4">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <div className="p-1.5 rounded-md bg-indigo-100 dark:bg-indigo-900/30">
        <Icon icon="mdi:sign-direction" className="text-lg text-indigo-600 dark:text-indigo-400" />
      </div>
      <div>
        <Label className="text-base font-semibold text-gray-800 dark:text-gray-200">
          اللوحات الإعلانية
        </Label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          قم بتحديد اللوحات التي تريد تضمينها في التمديد
        </p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {selectedRoadSigns.length}<span className="text-gray-500 dark:text-gray-400">/</span>{booking.roadsigns?.length}
          </span>
        </div>
      </div>
      <div className="flex gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
          disabled={allSelected}
          className="h-9 px-3 text-xs border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/30"
        >
          <Icon icon="mdi:check-all" className="ml-1 text-green-600 dark:text-green-400" />
          تحديد الكل
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDeselectAll}
          disabled={noneSelected}
          className="h-9 px-3 text-xs border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30"
        >
          <Icon icon="mdi:close-box-multiple" className="ml-1 text-red-600 dark:text-red-400" />
          إلغاء الكل
        </Button>
      </div>
    </div>
  </div>
  
  <div className="space-y-3">
    {booking.roadsigns?.map((sign, index) => {
      const isSelected = selectedRoadSigns.includes(sign.id);
      
      return (
        <div 
          key={sign.id} 
          className={`group p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer hover:scale-[1.01] hover:shadow-lg ${
            isSelected 
              ? 'border-green-400 dark:border-green-600 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20' 
              : 'border-gray-300 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/40 dark:to-gray-900/40'
          }`}
          onClick={() => handleToggleRoadSign(sign.id)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  isSelected 
                    ? 'bg-green-100 dark:bg-green-900/50' 
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}>
                  <Icon 
                    icon="mdi:sign-real-estate" 
                    className={`text-lg ${
                      isSelected 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-lg text-gray-900 dark:text-gray-100">
                      {sign.place}
                    </p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      isSelected 
                        ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}>
                      لوحة #{index + 1}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {sign.directions}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <Icon icon="mdi:view-quilt" className="text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">النموذج:</span> {sign.template?.model || "غير محدد"}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <Icon icon="mdi:cube" className="text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">الأوجه:</span> {sign.pivot.booking_faces}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <Icon icon="mdi:cube-outline" className="text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">اللوحات:</span> {sign.pivot.number_of_reserved_panels}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-3 ml-4">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleRoadSign(sign.id);
                }}
                className={`p-3 rounded-full transition-all duration-300 ${
                  isSelected 
                    ? 'bg-green-500 hover:bg-green-600 shadow-lg shadow-green-200 dark:shadow-green-900/50' 
                    : 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200 dark:shadow-red-900/50'
                }`}
              >
                <Icon 
                  icon={isSelected ? "mdi:check-bold" : "mdi:close-thick"} 
                  className="text-xl text-white"
                />
              </button>
              
              <div className={`px-3 py-1.5 rounded-full border text-sm font-medium ${
                isSelected 
                  ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                  : 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              }`}>
                {isSelected ? 'محدد للتمديد' : 'غير محدد'}
              </div>
            </div>
          </div>
        </div>
      );
    })}
  </div>
  
  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
    <div className="flex items-center gap-3">
      <Icon icon="mdi:information-outline" className="text-blue-600 dark:text-blue-400 text-lg" />
      <div>
        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
          تم تحديد {selectedRoadSigns.length} من أصل {booking.roadsigns?.length || 0} لوحة
        </p>
        {selectedRoadSigns.length < booking.roadsigns?.length && (
          <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
            سيتم إزالة {booking.roadsigns?.length - selectedRoadSigns.length} لوحة من التمديد
          </p>
        )}
        {selectedRoadSigns.length === 0 && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
            ⚠️ يجب تحديد لوحة واحدة على الأقل للمتابعة
          </p>
        )}
      </div>
    </div>
  </div>
</div>
          </CardContent>
        </Card>

        {/* Extend Booking Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="mdi:calendar-edit" className="text-green-500" />
              تمديد الحجز
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* New End Date */}
            <div>
              <Label htmlFor="end_date" className="text-sm font-medium">
                تاريخ النهاية الجديد
              </Label>
              <Input
                id="end_date"
                type="date"
                value={newEndDate}
                onChange={(e) => {
                  setNewEndDate(e.target.value);
                  setCalculatedAmount(null);
                  setDiscount(0);
                }}
                min={booking.end_date.split('T')[0]}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                يجب أن يكون التاريخ الجديد بعد {new Date(booking.end_date).toLocaleDateString('ar-EG')}
              </p>
            </div>

            {/* Selection Summary */}
            {selectedRoadSigns.length < booking.roadsigns?.length && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Icon icon="mdi:alert-circle" className="text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">ملاحظة:</p>
                    <p>سيتم تمديد {selectedRoadSigns.length} لوحة فقط من أصل {booking.roadsigns?.length}</p>
                    <p className="mt-1">اللوحات غير المحددة سيتم إزالتها من التمديد</p>
                  </div>
                </div>
              </div>
            )}

            {/* Calculate Price Button */}
            <div className="flex gap-2">
              <Button
                onClick={handleCalculatePrice}
                disabled={isCalculating || !newEndDate || selectedRoadSigns.length === 0}
                className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
              >
                {isCalculating ? (
                  <>
                    <Icon icon="mdi:loading" className="animate-spin mr-2" />
                    جاري الحساب...
                  </>
                ) : (
                  <>
                    <Icon icon="mdi:calculator" className="mr-2" />
                    حساب السعر الجديد
                  </>
                )}
              </Button>
            </div>

            {calculatedAmount && (
              <div className="p-4 bg-transparent rounded-lg border">
                <h3 className="font-semibold text-green-800 mb-2">حساب السعر الدقيق</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>عدد اللوحات المحددة:</span>
                    <span>{selectedRoadSigns.length} لوحة</span>
                  </div>
                  <div className="flex justify-between">
                    <span>السعر الحالي:</span>
                    <span>{booking.total_price} $</span>
                  </div>
                  <div className="flex justify-between">
                    <span>السعر الجديد:</span>
                    <span className="text-green-600 font-bold text-lg">
                      {calculatedAmount} $
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Discount Section */}
            {calculatedAmount && (
              <div className="space-y-3 p-4 bg-transparent rounded-lg border">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">إضافة خصم</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={discountType === "percentage" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDiscountType("percentage")}
                    >
                      %
                    </Button>
                    <Button
                      type="button"
                      variant={discountType === "fixed" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDiscountType("fixed")}
                    >
                      $
                    </Button>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder={discountType === "percentage" ? "نسبة الخصم" : "مبلغ الخصم"}
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    min="0"
                    max={discountType === "percentage" ? "100" : undefined}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={() => setDiscount(0)}
                    disabled={discount === 0}
                  >
                    إلغاء
                  </Button>
                </div>
                
                {discount > 0 && (
                  <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                    <div className="flex justify-between items-center text-sm">
                      <span>السعر قبل الخصم:</span>
                      <span className="font-medium">
                        {calculatedAmount} $
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>قيمة الخصم:</span>
                      <span className="text-red-600 font-medium">
                        -{discountType === "percentage" ? `${discount}%` : `${discount}$`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-t pt-2 mt-2">
                      <span className="font-bold">السعر النهائي:</span>
                      <span className="text-green-600 font-bold text-lg">
                        {calculateFinalPrice(calculatedAmount)} $
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleExtendBooking}
                disabled={isExtending || !calculatedAmount || selectedRoadSigns.length === 0}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isExtending ? (
                  <>
                    <Icon icon="mdi:loading" className="animate-spin mr-2" />
                    جاري التمديد...
                  </>
                ) : (
                  <>
                    <Icon icon="mdi:calendar-plus" className="mr-2" />
                    تأكيد التمديد
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard/bookings")}
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExtendBooking;