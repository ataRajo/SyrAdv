import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  X,
  Navigation,
  CheckCircle,
  AlertTriangle,
  MapPin
} from "lucide-react";
import { showToast } from "../../../utils/Notifictions/showToast";

const ROAD_SIGNS_API_URL = "https://devsyrback.addresses.sy/api/road-signs";

const MoveSignDialog = ({
  isOpen,
  onClose,
  booking,
  newEndDate, // ✅ NEW PROP — pass this from ExtendBooking.jsx (the selected extension end date)
  selectedRoadSigns,
  currentMoveSignId,
  setCurrentMoveSignId,
  onAddMove,
  pendingMoves
}) => {
  const [newRoadSignId, setNewRoadSignId] = useState("");
  const [availableRoadSigns, setAvailableRoadSigns] = useState([]);
  const [isRoadSignsFetching, setIsRoadSignsFetching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSignDetails, setSelectedSignDetails] = useState(null);
  // يزيد عند الضغط على «تحديث» أو دوريًا/عند العودة للتبويب فتُعاد جلب القائمة من السيرفر.
  const [reloadKey, setReloadKey] = useState(0);

  // Helper functions to safely extract values from objects
  const getAreaName = (sign) => {
    if (!sign) return 'غير محدد';
    const area = sign.area;
    if (typeof area === 'object' && area !== null) {
      return area?.name || area?.arabic_name || area?.title || 'غير محدد';
    }
    return area || sign.region?.name || 'غير محدد';
  };

  const getCityName = (sign) => {
    if (!sign) return 'غير محدد';
    const city = sign.city;
    if (typeof city === 'object' && city !== null) {
      return city?.name || city?.arabic_name || city?.title || 'غير محدد';
    }
    return city || 'غير محدد';
  };

  const getRegionName = (sign) => {
    if (!sign) return 'غير محدد';
    const region = sign.region;
    if (typeof region === 'object' && region !== null) {
      return region?.name || region?.arabic_name || region?.title || 'غير محدد';
    }
    return region || 'غير محدد';
  };

  // ✅ الحجز ضمن فترة التمديد نفسها: السيرفر يحسب is_booked_in_period بنفس منطق التوفر
  // المعتمد عند الحجز (حجوزات دائمة، غير مؤرشفة، تقاطع صارم على تواريخ اللوحة).
  // is_booked القديم يعني «يوجد حجز ساري اليوم أو أي حجز مستقبلي» فكان يُظهر لوحات
  // متاحة فعليًا في فترة التمديد على أنها محجوزة ضمن عقد آخر - لذلك هو مجرد احتياط
  // لو لم يرجع الحقل الجديد.
  const isSignBooked = (sign) =>
    typeof sign?.is_booked_in_period === "boolean" ? sign.is_booked_in_period : !!sign?.is_booked;

  // ✅ تفاصيل الحجز المتعارض ضمن الفترة (period_bookings من السيرفر)، وإلا الشكل القديم bookings[]
  const getActiveBookingInfo = (sign) => {
    const periodBooking = sign?.period_bookings?.[0];
    if (periodBooking) {
      const fmt = (d) => (d ? new Date(d).toLocaleDateString('ar-EG') : null);
      return {
        customer: periodBooking.customer || null,
        startDate: fmt(periodBooking.start_date),
        endDate: fmt(periodBooking.end_date),
      };
    }
    if (!sign?.bookings?.length) return null;
    const activeBooking = sign.bookings[0];
    return {
      customer: activeBooking.customer?.company_name || activeBooking.customer?.full_name || null,
      startDate: activeBooking.pivot?.start_date
        ? new Date(activeBooking.pivot.start_date).toLocaleDateString('ar-EG')
        : null,
      endDate: activeBooking.pivot?.end_date
        ? new Date(activeBooking.pivot.end_date).toLocaleDateString('ar-EG')
        : null,
    };
  };

  const showBookedSignAlert = (sign) => {
    const bookingInfo = getActiveBookingInfo(sign);
    const details = [];
    if (bookingInfo?.customer) details.push(`العميل: ${bookingInfo.customer}`);
    if (bookingInfo?.startDate && bookingInfo?.endDate) {
      details.push(`الفترة: من ${bookingInfo.startDate} إلى ${bookingInfo.endDate}`);
    }
    showToast(
      "error",
      `⚠️ اللوحة "${sign.place || `#${sign.id}`}" محجوزة حالياً${details.length ? ' — ' + details.join(' | ') : ''}`,
      { duration: 6000 }
    );
  };

  // ✅ Correctly handles month/year rollover (e.g. Aug 30 -> Aug 31, Aug 31 -> Sep 1)
  // JS Date normalizes an out-of-range day automatically, so no manual "how many days
  // does this month have" logic is needed.
  const formatDate = (date) => date.toISOString().split('T')[0];

  const getExtensionStartDate = (endDateString) => {
    if (!endDateString) return null;
    const date = new Date(endDateString);
    date.setDate(date.getDate() + 1);
    return formatDate(date);
  };

  // تحديث دوري للقائمة طالما النافذة مفتوحة (كل 5 دقائق) وعند العودة للتبويب، كي لا تبقى
  // حالة «محجوزة/متاحة» قديمة إن تغيّر شيء في الحجوزات أثناء فتح الصفحة.
  useEffect(() => {
    if (!isOpen) return undefined;
    const bump = () => setReloadKey((k) => k + 1);
    const timer = setInterval(bump, 5 * 60 * 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") bump();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [isOpen]);

  // Resolve the current sign being moved, and fetch same-size signs from the API
  useEffect(() => {
    if (!isOpen || !currentMoveSignId || !booking?.roadsigns) {
      setSelectedSignDetails(null);
      setAvailableRoadSigns([]);
      setSearchTerm("");
      setNewRoadSignId("");
      return;
    }

    const signDetails = booking.roadsigns.find(sign => sign.id == currentMoveSignId) || null;
    setSelectedSignDetails(signDetails);

    if (!signDetails) {
      setAvailableRoadSigns([]);
      return;
    }

    const templateSize = signDetails.template?.size ||
      (signDetails.width && signDetails.height ? `${signDetails.width}X${signDetails.height}` : null);

    const startDateStr = getExtensionStartDate(booking.end_date);
    const endDateStr = newEndDate; // already "YYYY-MM-DD" from the date input

    if (!templateSize || !startDateStr || !endDateStr) {
      setAvailableRoadSigns([]);
      return;
    }

    let cancelled = false;

    const fetchAvailableSigns = async () => {
      try {
        setIsRoadSignsFetching(true);

        const raw = localStorage.getItem("SuperAdminInfo");
        const info = raw ? JSON.parse(raw) : null;
        const token = info?.user?.token || info?.token || null;

        const response = await axios.get(ROAD_SIGNS_API_URL, {
          params: {
            start_date: startDateStr,
            end_date: endDateStr,
            template_size: templateSize,
            only_available: 0, // fetch BOTH booked and unbooked signs
          },
          headers: {
            Accept: 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (cancelled) return;

        const signs = response.data?.data || [];
        const filtered = signs.filter(sign => sign && sign.id != currentMoveSignId);
        setAvailableRoadSigns(filtered);
      } catch (error) {
        console.error("Error fetching available road signs:", error);
        if (!cancelled) {
          showToast("error", "حدث خطأ أثناء جلب اللوحات المتاحة");
          setAvailableRoadSigns([]);
        }
      } finally {
        if (!cancelled) setIsRoadSignsFetching(false);
      }
    };

    fetchAvailableSigns();

    return () => {
      cancelled = true;
    };
  }, [isOpen, currentMoveSignId, booking?.roadsigns, booking?.end_date, newEndDate, reloadKey]);

  // ✅ Uses the real is_booked field instead of a non-existent "status"
  const hasActiveBookings = useMemo(() => {
    return isSignBooked(selectedSignDetails);
  }, [selectedSignDetails]);

  const getPendingMoveForSign = (signId) => {
    return pendingMoves.find(move => move.oldSignId == signId);
  };

  const filteredAvailableSigns = useMemo(() => {
    if (!availableRoadSigns) return [];

    if (!searchTerm.trim()) {
      return availableRoadSigns;
    }

    const term = searchTerm.toLowerCase();
    return availableRoadSigns.filter(sign => {
      const areaName = getAreaName(sign);
      const cityName = getCityName(sign);
      const regionName = getRegionName(sign);

      return (
        (sign.place && sign.place.toLowerCase().includes(term)) ||
        (sign.roadsign_code && sign.roadsign_code.toLowerCase().includes(term)) ||
        (sign.directions && sign.directions.toLowerCase().includes(term)) ||
        (sign.direction && sign.direction.toLowerCase().includes(term)) ||
        (sign.template?.model && sign.template.model.toLowerCase().includes(term)) ||
        (areaName && areaName.toLowerCase().includes(term)) ||
        (cityName && cityName.toLowerCase().includes(term)) ||
        (regionName && regionName.toLowerCase().includes(term)) ||
        (sign.id && sign.id.toString().includes(term))
      );
    });
  }, [availableRoadSigns, searchTerm]);

  const handleAddPendingMove = () => {
    if (!currentMoveSignId || !newRoadSignId) {
      showToast("error", "يرجى اختيار اللوحة الحالية واللوحة الجديدة");
      return;
    }

    if (currentMoveSignId === newRoadSignId) {
      showToast("error", "يجب اختيار لوحة جديدة مختلفة عن اللوحة الحالية");
      return;
    }

    const newSign = availableRoadSigns.find(sign => sign.id == newRoadSignId);
    const currentSign = selectedSignDetails;

    if (!newSign) {
      showToast("error", "اللوحة المختارة غير متاحة");
      return;
    }

    if (newSign.template?.id !== currentSign.template?.id) {
      showToast("error", "اللوحة الجديدة لا تطابق النموذج");
      return;
    }

    onAddMove(currentMoveSignId, newRoadSignId, currentSign, newSign);

    if (isSignBooked(newSign)) {
      showToast(
        "info",
        "⚠️ تمت إضافة حركة النقل، لكن يرجى الانتباه أن اللوحة الجديدة محجوزة حالياً — تأكد من توفرها قبل تأكيد التمديد",
        { icon: "⚠️", duration: 5000 }
      );
    } else {
      showToast("success", "تمت إضافة حركة النقل للوحة (بانتظار التمديد)", {
        icon: "⏳",
        duration: 3000
      });
    }

    onClose();
  };

  const InfoField = ({ label, value }) => (
    <div>
      <span className="font-medium text-gray-600 dark:text-gray-400">{label}:</span>
      <span className="text-gray-800 dark:text-white mr-2">{value}</span>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <Navigation className="w-5 h-5" />
            إضافة حركة نقل للوحة
          </DialogTitle>
          <DialogDescription>
            اختر اللوحة التي تريد نقلها إلى موقع جديد (سيتم النقل عند تأكيد التمديد)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="current-sign">اختر اللوحة المراد نقلها</Label>
            <Select
              value={currentMoveSignId}
              onValueChange={(value) => {
                setCurrentMoveSignId(value);
                setNewRoadSignId("");
                setSearchTerm("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر اللوحة الحالية" />
              </SelectTrigger>
              <SelectContent>
                {booking?.roadsigns?.map((sign) => {
                  const isSelected = selectedRoadSigns.includes(sign.id);
                  const hasPendingMove = getPendingMoveForSign(sign.id);

                  return (
                    <SelectItem
                      key={sign.id}
                      value={sign.id.toString()}
                      disabled={!isSelected}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{sign.place || `اللوحة #${sign.id}`}</span>
                          {!isSelected && (
                            <Badge variant="outline" className="text-xs text-gray-500">
                              غير محددة
                            </Badge>
                          )}
                          {hasPendingMove && (
                            <Badge className="bg-purple-100 text-purple-700 text-xs">
                              <MapPin className="w-3 h-3 inline mr-1" />
                              مع نقل
                            </Badge>
                          )}
                        </div>
                        {!isSelected && (
                          <span className="text-xs text-red-500 mt-1">
                            يجب تحديد اللوحة أولاً في قائمة التمديد
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {selectedSignDetails && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-3">
                معلومات اللوحة الحالية
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <InfoField label="اسم اللوحة" value={selectedSignDetails.place || `اللوحة #${selectedSignDetails.id}`} />
                <InfoField label="كود اللوحة" value={selectedSignDetails.roadsign_code || 'غير محدد'} />
                <InfoField label="القالب" value={selectedSignDetails.template?.model || 'غير محدد'} />
                <InfoField label="معرف القالب" value={selectedSignDetails.template?.id || 'غير محدد'} />
                <InfoField label="المدينة" value={getCityName(selectedSignDetails)} />
                <InfoField label="المنطقة" value={getAreaName(selectedSignDetails)} />
                <InfoField label="الاتجاه" value={selectedSignDetails.directions || selectedSignDetails.direction || 'غير محدد'} />
                <InfoField label="الحالة" value={
                  <span className={`font-semibold ${hasActiveBookings ? 'text-yellow-600' : 'text-green-600'}`}>
                    {hasActiveBookings ? '⚠️ محجوزة حالياً' : '✅ بدون حجز نشط'}
                  </span>
                } />
              </div>
            </div>
          )}

          {selectedSignDetails && selectedRoadSigns.includes(parseInt(currentMoveSignId)) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  اختر اللوحة البديلة:
                </Label>
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReloadKey((k) => k + 1)}
                    disabled={isRoadSignsFetching}
                    className="px-2 py-0.5 rounded border text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                    title="تحديث حالة اللوحات من السيرفر"
                  >
                    ⟳ تحديث
                  </button>
                  {isRoadSignsFetching ? (
                    <span className="flex items-center gap-1">
                      <span className="animate-spin">⟳</span>
                      جاري التحميل...
                    </span>
                  ) : (
                    <span>
                      {availableRoadSigns.length} لوحة بنفس الحجم
                      {" "}(
                      <span className="text-green-600 font-medium">
                        {availableRoadSigns.filter(s => !isSignBooked(s)).length} متاحة
                      </span>
                      {" / "}
                      <span className="text-orange-600 font-medium">
                        {availableRoadSigns.filter(s => isSignBooked(s)).length} محجوزة
                      </span>
                      )
                    </span>
                  )}
                </div>
              </div>

              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="ابحث في اللوحات المتاحة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {isRoadSignsFetching ? (
                <div className="text-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">جاري تحميل اللوحات...</p>
                </div>
              ) : availableRoadSigns.length === 0 ? (
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg text-center">
                  <div className="text-3xl mb-2">🚫</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    لا توجد لوحات متاحة للتبديل
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="p-2 text-right">#</th>
                          <th className="p-2 text-right">اللوحة</th>
                          <th className="p-2 text-right">الكود</th>
                          <th className="p-2 text-right">المدينة</th>
                          <th className="p-2 text-right">المنطقة</th>
                          <th className="p-2 text-right">القالب</th>
                          <th className="p-2 text-right">الحالة</th>
                          <th className="p-2 text-right">اختيار</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAvailableSigns.map((sign, index) => {
                          const existingMoveForNewSign = pendingMoves.find(move =>
                            move.newSignId == sign.id
                          );
                          const signBooked = isSignBooked(sign);
                          return (
                            <tr
                              key={sign.id}
                              className={`border-t hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                                newRoadSignId == sign.id ? 'bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-300' : ''
                              } ${
                                existingMoveForNewSign ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
                              } ${
                                signBooked && newRoadSignId != sign.id && !existingMoveForNewSign
                                  ? 'bg-orange-50/60 dark:bg-orange-900/10'
                                  : ''
                              }`}
                            >
                              <td className="p-2">{index + 1}</td>
                              <td className="p-2">
                                <div>
                                  <div className="font-medium">{sign.place || `#${sign.id}`}</div>
                                  <div className="text-xs text-gray-500">{sign.directions || sign.direction || 'غير محدد'}</div>
                                </div>
                              </td>
                              <td className="p-2">{sign.roadsign_code || `RS-${sign.id}`}</td>
                              <td className="p-2">{getCityName(sign)}</td>
                              <td className="p-2">{getAreaName(sign)}</td>
                              <td className="p-2">
                                <Badge variant="outline" className="text-green-700 border-green-300">
                                  {sign.template?.model || 'غير محدد'}
                                </Badge>
                              </td>
                              <td className="p-2">
                                {signBooked ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      showBookedSignAlert(sign);
                                    }}
                                    title="اضغط لعرض تفاصيل الحجز"
                                    className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/40 dark:text-orange-300 transition-colors"
                                  >
                                    <AlertTriangle className="w-3 h-3" />
                                    محجوزة
                                  </button>
                                ) : (
                                  <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                                    <CheckCircle className="w-3 h-3" />
                                    متاحة
                                  </span>
                                )}
                              </td>
                              <td className="p-2">
                                <button
                                  onClick={() => {
                                    setNewRoadSignId(sign.id.toString());
                                    if (signBooked) {
                                      showBookedSignAlert(sign);
                                    }
                                  }}
                                  disabled={!!existingMoveForNewSign}
                                  className={`px-3 py-1 rounded text-xs transition-all ${
                                    newRoadSignId == sign.id
                                      ? 'bg-blue-500 text-white shadow-md'
                                      : existingMoveForNewSign
                                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 hover:shadow-sm'
                                  }`}
                                >
                                  {newRoadSignId == sign.id ? '✓ محددة' :
                                   existingMoveForNewSign ? 'محجوزة لنقل آخر' : 'اختر'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>

                      {filteredAvailableSigns.length === 0 && searchTerm && (
                        <tfoot>
                          <tr>
                            <td colSpan="8" className="text-center p-4 text-gray-500">
                              لا توجد نتائج للبحث "{searchTerm}"
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              )}

              {newRoadSignId && !isRoadSignsFetching && (() => {
                const selected = availableRoadSigns.find(s => s.id == newRoadSignId);
                if (!selected) return null;
                const selectedBooked = isSignBooked(selected);
                const selectedBookingInfo = selectedBooked ? getActiveBookingInfo(selected) : null;
                return (
                  <div className={`p-3 rounded-lg border animate-in fade-in ${
                    selectedBooked
                      ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                      : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className={`text-sm ${selectedBooked ? 'text-orange-700 dark:text-orange-300' : 'text-green-700 dark:text-green-300'}`}>
                        <span className="font-semibold">
                          {selectedBooked ? '⚠️ اللوحة المختارة (محجوزة حالياً):' : '✅ اللوحة المختارة:'}
                        </span>
                        <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                          <div>الاسم: {selected.place || `اللوحة #${selected.id}`}</div>
                          <div>الكود: {selected.roadsign_code || `RS-${selected.id}`}</div>
                          <div>المدينة: {getCityName(selected)}</div>
                          <div>المنطقة: {getAreaName(selected)}</div>
                          <div>القالب: {selected.template?.model || 'غير محدد'}</div>
                          <div>الاتجاه: {selected.directions || selected.direction || 'غير محدد'}</div>
                        </div>
                        {selectedBooked && (
                          <div className="mt-2 pt-2 border-t border-orange-200 dark:border-orange-800 text-xs space-y-0.5">
                            {selectedBookingInfo?.customer && (
                              <div>العميل الحالي: {selectedBookingInfo.customer}</div>
                            )}
                            {selectedBookingInfo?.startDate && selectedBookingInfo?.endDate && (
                              <div>فترة الحجز: من {selectedBookingInfo.startDate} إلى {selectedBookingInfo.endDate}</div>
                            )}
                            <div className="mt-1 font-medium">يرجى التأكد من توفر اللوحة قبل تأكيد النقل</div>
                          </div>
                        )}
                      </div>
                      {selectedBooked ? (
                        <AlertTriangle className="w-8 h-8 text-orange-600 flex-shrink-0" />
                      ) : (
                        <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {selectedSignDetails && !selectedRoadSigns.includes(parseInt(currentMoveSignId)) && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 font-semibold">
                    هذه اللوحة غير محددة للتمديد
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                    يجب تحديد اللوحة أولاً في قائمة اللوحات الممتدة لإضافة حركة نقل لها
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            إلغاء
          </Button>
          <Button
            onClick={handleAddPendingMove}
            disabled={!currentMoveSignId || !newRoadSignId || !selectedRoadSigns.includes(parseInt(currentMoveSignId))}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              إضافة حركة نقل
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MoveSignDialog;