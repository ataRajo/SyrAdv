import React, { useEffect, useState } from "react";
import { useUpdateBookingStatusMutation } from "../../../../src/RtkQuery/Slice/Booking/BookingApi";
import { BookingType } from "../../../Static/StaticData";

export const statusBookings = {
  1: "Waiting",
  2: "Accepted",
  3: "Rejected",
};

const StatusSelectorWithButton = ({ booking, onLocalUpdate }) => {
  const [selectedStatus, setSelectedStatus] = useState(booking?.approvement_status ?? 1);
  const [rejectReason, setRejectReason] = useState(booking?.reject_reason || "");
  const [updateBookingStatus, { isLoading }] = useUpdateBookingStatusMutation();

  // Sync local state if booking changes
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
      <div className="flex items-center gap-2">
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(Number(e.target.value))}
          className="border rounded px-2 py-1 text-sm font-semibold text-gray-500"
        >
          {Object.entries(statusBookings).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        <button
          onClick={handleUpdateStatus}
          disabled={isLoading}
          className="bg-gray-700 text-white px-2 py-1 rounded text-sm hover:bg-gray-800"
        >
          {isLoading ? "Updating..." : "Update"}
        </button>
      </div>

      {selectedStatus === 3 && (
        <input
          type="text"
          placeholder="Enter reject reason"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          className="border rounded px-2 py-1 text-sm text-gray-700"
        />
      )}
    </div>
  );
};

export default StatusSelectorWithButton;

// ✅ Table column definitions
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
    format: (value) => new Date(value).toLocaleDateString("en-US"),
    prefixIcon: "mdi:calendar-start",
    className: "min-w-[120px]",
  },
  {
    header: "إلى",
    accessor: "end_date",
    format: (value) => new Date(value).toLocaleDateString("en-US"),
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
    header: "الحالة",
    accessor: "approvement_status",
    cell: ({ row }) => (
      <div>
        <StatusSelectorWithButton booking={row} onLocalUpdate={(id, status, reason) => {
          // Optional: update your table state here if needed
          row.approvement_status = status;
          row.reject_reason = reason;
        }} />
        {row.approvement_status === 3 && row.reject_reason && (
          <p className="text-xs text-red-500 mt-1">سبب الرفض: {row.reject_reason}</p>
        )}
      </div>
    ),
    className: "min-w-[200px]",
  },
];
