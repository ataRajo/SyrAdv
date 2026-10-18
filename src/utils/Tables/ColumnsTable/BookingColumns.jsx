import React, { useEffect, useState } from "react";
import { getPublicMapUrl } from "../../../Api/baseUrl";
import { useUpdateBookingStatusMutation, useCalculateReservationMutation } from "../../../../src/RtkQuery/Slice/Booking/BookingApi";
import { BookingType } from "../../../Static/StaticData";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
// قمنا باستيراد Link للتنقل بين الصفحات
import { Link } from "react-router-dom";
import { Eye , Share2  } from "lucide-react";
import { BookingDetailsAction } from "../../../Components/Booking/BookingDetailsAction";
import {toast} from "sonner";
import { PrintOrderButton } from "../../../Components/Booking/PrintOrderButton";
import { useAddDiscountMutation } from "../../../../src/RtkQuery/Slice/Booking/BookingApi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
export const statusBookings = {
  1: "انتظار",
  2: "موافقة",
  3: "مرفوض",
};



// تم تعديل هذا المكون ليصبح رابطاً ينقلك إلى صفحة جديدة بدلاً من فتح Modal
export const BookingDetailsButton = ({ bookingId }) => {
  return (
  <Button
      variant="ghost"
      size="sm"
      className="text-blue-600 hover:text-blue-800"
      onClick={() => {
        window.location.href = `/dashboard/bookings/${bookingId}`;
      }}
    >
      <Eye className="h-4 w-4 ml-1" />
    توليد pdf 
    </Button>
  );
};

export const ShareMapButton = ({ bookingId }) => {
  const [isSharing, setIsSharing] = useState(false);

 const handleOpenMap = () => {
    const mapLink = getPublicMapUrl(bookingId);
    console.log("Opening map link:", mapLink);
    
    try {
      // Method 1: Try to open in same tab (more reliable on mobile)
      window.location.href = mapLink;
    } catch (err) {
      console.error("Error opening map:", err);
      // Method 2: Fallback to alert with link
      alert(`رابط الخريطة: ${mapLink}\nالرجاء نسخ الرابط وفتحه في المتصفح`);
    }
  };

  const handleCopyLink = () => {
    const mapLink = getPublicMapUrl(bookingId);
    
    navigator.clipboard.writeText(mapLink).then(() => {
      toast.success("تم نسخ رابط الخريطة! ✅", {
        description: "يمكنك مشاركة الرابط مع الآخرين",
        duration: 3000,
      });
    }).catch(() => {
      alert(`رابط الخريطة: ${mapLink}`);
    });
  };

  
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="text-green-600 hover:text-green-800"
        onClick={handleOpenMap}
        title="عرض الخريطة"
      >
        <Share2 className="h-4 w-4 ml-1" />
        مشاركة
      </Button>
    </div>
  );
};

export const DiscountButton = ({ bookingId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [discountType, setDiscountType] = useState("");
  const [value, setValue] = useState("");
  const [addDiscount, { isLoading }] = useAddDiscountMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!discountType || value === "") {
      alert("يرجى ملء جميع الحقول");
      return;
    }
    try {
      await addDiscount({
        id: bookingId,
        discount_type: parseInt(discountType),
        value: parseFloat(value),
      }).unwrap();
      alert("تم إضافة الخصم بنجاح");
      setIsOpen(false);
      setDiscountType("");
      setValue("");
    } catch (error) {
      alert(error?.data?.message || "فشل في إضافة الخصم");
    }
  };

  const discountTypeLabel = discountType === "1" ? "مبلغ ثابت" : discountType === "2" ? "نسبة %" : "";

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-amber-600 hover:text-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/20"
        onClick={() => setIsOpen(true)}
        title="إضافة خصم"
      >
        <Icon icon="mdi:tag-percent" className="h-4 w-4 ml-1" />
        خصم ادارة
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md dark:bg-gray-900 dark:border-gray-700" dir="rtl">
          <DialogHeader className="border-b dark:border-gray-700 pb-4">
            <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Icon icon="mdi:tag-percent" className="w-5 h-5" />
              إضافة خصم للحجز #{bookingId}
            </DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              اختر نوع الخصم وأدخل القيمة المناسبة
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            {/* Discount Type Selection */}
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">نوع الخصم</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setDiscountType("1"); setValue(""); }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    discountType === "1"
                      ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
                      : "border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-800 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  <Icon icon="mdi:cash" className="w-6 h-6" />
                  <span className="text-sm font-medium">مبلغ ثابت</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setDiscountType("2"); setValue(""); }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    discountType === "2"
                      ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
                      : "border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-800 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  <Icon icon="mdi:percent" className="w-6 h-6" />
                  <span className="text-sm font-medium">نسبة %</span>
                </button>
              </div>
            </div>

            {/* Value Input */}
            {discountType && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <Label htmlFor="discountValue" className="text-gray-700 dark:text-gray-300">
                  قيمة الخصم <span className="text-amber-600 font-medium">({discountTypeLabel})</span>
                </Label>
                <div className="relative">
                  <Input
                    id="discountValue"
                    type="number"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    min="0"
                    max={discountType === "2" ? 100 : undefined}
                    step="0.01"
                    placeholder={discountType === "2" ? "مثال: 15" : "مثال: 5000"}
                    className="pr-10 text-lg font-semibold dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                    autoFocus
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {discountType === "2" ? <Icon icon="mdi:percent" /> : <Icon icon="mdi:cash" />}
                  </div>
                </div>
                {discountType === "2" && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Icon icon="mdi:information-outline" className="w-3 h-3" />
                    يجب أن تكون النسبة بين 0 و 100
                  </p>
                )}
              </div>
            )}

            {/* Summary Preview */}
            {value && !isNaN(parseFloat(value)) && parseFloat(value) > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-amber-700 dark:text-amber-300">الخصم المضاف:</span>
                  <span className="text-xl font-bold text-amber-700 dark:text-amber-300">
                    {parseFloat(value).toFixed(2)}
                    {discountType === "2" ? "%" : " $"}
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={isLoading || !discountType || value === ""}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    جاري التطبيق...
                  </>
                ) : (
                  <>
                    <Icon icon="mdi:check" className="h-4 w-4 ml-2" />
                    تأكيد الخصم
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <Icon icon="mdi:close" className="h-4 w-4 ml-2" />
                إلغاء
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};


// Booking Price Cell Component (كما هو بدون تعديل)
const BookingPriceCell = ({ booking }) => {
  const [calculateReservation, { isLoading }] = useCalculateReservationMutation();
  const [price, setPrice] = useState(null);
  const [error, setError] = useState(null);



  
  useEffect(() => {
    const fetchBookingPrice = async () => {
      if (!booking?.id) return;

      try {
        setError(null);
        
        const roadsigns = booking.roadsigns?.map(sign => ({
          road_sign_id: sign.id,
          booking_faces: sign.pivot?.number_of_reserved_panels || 1,
          number_of_reserved_panels: sign.pivot?.number_of_reserved_panels || 1,
          start_date: sign.pivot?.start_date || booking.start_date,
          end_date: sign.pivot?.end_date || booking.end_date,
          units: booking.units || 1
        })) || [];

        if (roadsigns.length === 0) {
          setError("No road signs");
          return;
        }

        const calculationData = {
          booking_id: booking.id,
          roadsigns: roadsigns,
          start_date: booking.start_date,
          end_date: booking.end_date,
          units: booking.units || 1,
          customer_id: booking.customer_id,
          type: booking.type,
          product_type: booking.product_type
        };

        const result = await calculateReservation(calculationData).unwrap();
        
        if (result?.price_per_period) {
          setPrice(result.price_per_period);
        } else if (result?.total_price) {
          setPrice(result.total_price);
        } else if (result?.amount?.total_price) {
          setPrice(result.amount.total_price);
        } else if (result?.data?.price_per_period) {
          setPrice(result.data.price_per_period);
        } else {
          setError("No price data");
        }
      } catch (err) {
        console.error("Error calculating price:", err);
        setError("Failed to load price");
      }
    };

    fetchBookingPrice();
  }, [booking, calculateReservation]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">جاري الحساب...</span>
      </div>
    );
  }

  if (error) return <div className="text-red-500 text-sm">{error}</div>;
  if (price == null) return <div className="text-gray-400 text-sm">—</div>;

  return (
    <div className="text-gray-500 font-semibold">
      {parseFloat(price).toFixed(2)} $
    </div>
  );
};

const StatusSelectorWithButton = ({ booking, onLocalUpdate }) => {
  const [selectedStatus, setSelectedStatus] = useState(booking?.approvement_status ?? 1);
  const [rejectReason, setRejectReason] = useState(booking?.reject_reason || "");
  const [updateBookingStatus, { isLoading }] = useUpdateBookingStatusMutation();

  useEffect(() => {
    setSelectedStatus(booking?.approvement_status ?? 1);
    setRejectReason(booking?.reject_reason || "");
  }, [booking?.approvement_status, booking?.reject_reason]);

  const handleUpdateStatus = async () => {
    try {
      // ✅ FIX: Always send reject_reason when status is 3, even if empty string
      const payload = {
        id: booking.id,
        status: selectedStatus,
      };

      // Only add reject_reason when status is 3 (rejected)
      if (String(selectedStatus) === "3") {
        payload.reject_reason = rejectReason.trim() || "—"; // Send at least something
      }

      await updateBookingStatus(payload).unwrap();

      if (onLocalUpdate) {
        onLocalUpdate(booking.id, selectedStatus, rejectReason);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error(err?.data?.message || "فشل في تحديث الحالة");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="border rounded px-2 py-1 text-sm text-gray-700 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700 min-w-[100px]"
        >
          {Object.entries(statusBookings).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        <Button
          onClick={handleUpdateStatus}
          disabled={isLoading}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400 min-h-[32px] flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              تحديث...
            </>
          ) : (
            "تحديث"
          )}
        </Button>
      </div>

      {/* ✅ FIX: Show reject reason input immediately when status is 3, with required indicator */}
      {String(selectedStatus) === "3" && (
        <div className="mt-2">
          <input
            type="text"
            placeholder="أدخل سبب الرفض *"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className={`w-full border rounded px-2 py-1 text-sm text-gray-700 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700 ${
              !rejectReason.trim() ? "border-red-300 bg-red-50 dark:bg-red-900/10" : ""
            }`}
            required
          />
          {!rejectReason.trim() && (
            <p className="text-xs text-red-500 mt-1">* سبب الرفض مطلوب</p>
          )}
        </div>
      )}

      <div className="mt-1">
        <span className="text-xs text-gray-500">الحالة الحالية:</span>
        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
          booking.approvement_status === 2 ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" :
          booking.approvement_status === 3 ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300" :
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
        }`}>
          {statusBookings[booking.approvement_status] || "غير معروف"}
        </span>
      </div>
    </div>
  );
};


export default StatusSelectorWithButton;

// Booking Columns Configuration
export const BookingColumns = [
  {
    header: "اسم الشركة",
    accessor: "customer.company_name",
    prefixIcon: "mdi:office-building",
    className: "min-w-[150px]",
  },
  {
    header: "من",
    accessor: "start_date",
    format: (value) => {
      if (!value) return "—";
      const date = new Date(value);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    },
    prefixIcon: "mdi:calendar-start",
    className: "min-w-[120px]",
  },
  {
    header: "إلى",
    accessor: "end_date",
    format: (value) => {
      if (!value) return "—";
      const date = new Date(value);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    },
    prefixIcon: "mdi:calendar-end",
    className: "min-w-[120px]",
  },
  /*
  {
    header: "المتبقي",
    accessor: "remaining",
    prefixIcon: "mdi:counter",
    format: (value) => (value != null ? value : "—"),
    className: "min-w-[100px]",
  },
*/
{
  header: "نوع العمل",
  accessor: "customer.work.type",
  prefixIcon: "mdi:briefcase",
  format: (value, row) => {
    if (row?.customer?.work?.type) {
      return row.customer.work.type;
    }
    return "—";
  },
  className: "min-w-[120px]",
},

{
  header: "اسم الموظف",
  accessor: "user.username",
  prefixIcon: "mdi:account",
  format: (value, row) => {
    if (row?.user?.username) {
      return row.user.username;
    }
    return "-----";
  },
  className: "min-w-[120px]",
},


  {
  header: "الوسيط",
  accessor: "broker.username",
  prefixIcon: "mdi:account",
  format: (value, row) => {
    if (row?.broker?.username) {
      return row.broker.username;
    }
    return "-----";
  },
  className: "min-w-[120px]",
},

  {
    header: "نوع الحجز",
    accessor: "type",
    prefixIcon: "mdi:tag",
    format: (value) => BookingType[value] || "غير معروف",
    className: "min-w-[120px]",
  },
  {
    header: "العمليات",
    accessor: "id",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <BookingDetailsButton bookingId={row.id} />
        <ShareMapButton bookingId={row.id} />
        <BookingDetailsAction booking={row} />
        <DiscountButton bookingId={row.id} />
        <PrintOrderButton bookingId={row.id} />
      </div>
    ),
    className: "min-w-[280px]",
  },
  {
    header: "السعر",
    accessor: "total_price",
    prefixIcon: "mdi:cash",
    format: (value) => (value == null ? "—" : `${parseFloat(value).toFixed(2)} $`),
    className: "min-w-[120px]",
  },
  {
    header: "حالة الموافقة",
    accessor: "approvement_status",
    cell: ({ row }) => (
      <div className="py-2">
        <StatusSelectorWithButton 
          booking={row} 
          onLocalUpdate={(id, status, reason) => {
            row.approvement_status = status;
            row.reject_reason = reason;
          }} 
        />
        {row.approvement_status === 3 && row.reject_reason && (
          <p className="text-xs text-red-500 mt-2 p-1 bg-red-50 rounded">
            سبب الرفض: {row.reject_reason}
          </p>
        )}
      </div>
    ),
    className: "min-w-[250px]",
  },
];