import React, { useEffect, useState } from "react";
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
    const mapLink = `https://tsyr.addresses.sy/public-map/${bookingId}`;
    console.log("Opening map link:", mapLink);
    
    // Try multiple methods for mobile compatibility
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
    const mapLink = `https://tsyr.addresses.sy/public-map/${bookingId}`;
    
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
  accessor: "customer.work_type_id",
  prefixIcon: "mdi:briefcase",
  format: (value) => {
    // value here is customer.work_type_id
    if (value !== null && value !== undefined) {
      return value; // Display the ID number directly
    }
    return "—";
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