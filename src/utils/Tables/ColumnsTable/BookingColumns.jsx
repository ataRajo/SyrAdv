import React, { useEffect, useState } from "react";
import { useUpdateBookingStatusMutation, useCalculateReservationMutation } from "../../../../src/RtkQuery/Slice/Booking/BookingApi";
import { BookingType } from "../../../Static/StaticData";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button"; // Add this import

export const statusBookings = {
  1: "انتظار",
  2: "موافقة",
  3: "مرفوض",
};

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

        console.log("Sending calculation data:", calculationData);

        const result = await calculateReservation(calculationData).unwrap();
        
        console.log("Calculation result:", result);
        
        // Adjust this based on your API response structure
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
        console.error("Error details:", err.data);
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

  if (error) {
    return (
      <div className="text-red-500 text-sm">
        {error}
      </div>
    );
  }

  if (price == null) {
    return (
      <div className="text-gray-400 text-sm">
        —
      </div>
    );
  }

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
      await updateBookingStatus({
        id: booking.id,
        status: selectedStatus,
        reject_reason: selectedStatus === 3 ? rejectReason : undefined,
      }).unwrap();

      // Update UI immediately
      if (onLocalUpdate) {
        onLocalUpdate(booking.id, selectedStatus, rejectReason);
      }

      console.log("تم تحديث حالة الحجز بنجاح");
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Status select dropdown */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="border rounded px-2 py-1 text-sm text-gray-700 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700 min-w-[100px]"
        >
          {Object.entries(statusBookings).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

      <Button
  onClick={handleUpdateStatus}
  disabled={isLoading}
  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400 min-h-[32px] flex items-center justify-center border-2 border-red-500" // Added red border
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

      {/* Reject reason input */}
      {selectedStatus === 3 && (
        <div className="mt-2">
          <input
            type="text"
            placeholder="أدخل سبب الرفض"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full border rounded px-2 py-1 text-sm text-gray-700 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
      )}

      {/* Show current status badge */}
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
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
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
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    },
    prefixIcon: "mdi:calendar-end",
    className: "min-w-[120px]",
  },
  {
    header: "المتبقي",
    accessor: "remaining",
    prefixIcon: "mdi:counter",
    format: (value) => (value != null ? value : "—"),
    className: "min-w-[100px]",
  },
  {
    header: "نوع الحجز",
    accessor: "type",
    prefixIcon: "mdi:tag",
    format: (value) => BookingType[value] || "غير معروف",
    className: "min-w-[120px]",
  },
  {
    header: "السعر",
    accessor: "total_price", // CHANGED from "price" to "total_price"
    prefixIcon: "mdi:cash",
    format: (value) => {
      if (value == null) return "—";
      return `${parseFloat(value).toFixed(2)} $`;
    },
    className: "min-w-[120px]",
  },
  {
    header: "حالة الموافقة",
    accessor: "approvement_status",
    cell: ({ row }) => (
      <div className="py-2">
        <StatusSelectorWithButton booking={row} onLocalUpdate={(id, status, reason) => {
          row.approvement_status = status;
          row.reject_reason = reason;
        }} />
        
        {/* Rejection reason display */}
        {row.approvement_status === 3 && row.reject_reason && (
          <p className="text-xs text-red-500 mt-2 p-1 bg-red-50 rounded">سبب الرفض: {row.reject_reason}</p>
        )}
      </div>
    ),
    className: "min-w-[250px]",
  },
];