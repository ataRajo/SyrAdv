import React, { useState, useMemo } from "react";
import { DynamicTable } from "../../utils/Tables/DynamicTable";
import { BookingColumns } from "../../utils/Tables/ColumnsTable/BookingColumns";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Permissions } from "../../Static/StaticData";
import { DeleteDialog } from "../../utils/Dialogs/DeleteDialog/DeleteDialog";
import useGetBookings from "../../hooks/useGetBookings";

const statusMap = {
  "1": "Waiting",
  "2": "Accepted",
  "3": "Rejected",
};

const BookingContainer = () => {
  const {
    permissions,
    data,
    isLoading,
    navigate,
    hasPermission,
    openDelete,
    setOpenDelete,
    openCancelBooking,
    setOpenCancelBooking,
    isLoadingDelete,
    isLoadingCancel,
    handleDelete,
    onCancelBooking,
    onConfirmDelete,
    handelCancelBooking,
  } = useGetBookings();

  // ✅ Filter state
  const [statusFilter, setStatusFilter] = useState("");

  // ✅ Filtered data
  const filteredData = useMemo(() => {
    if (!statusFilter) return data;
    return data.filter((booking) => String(booking.approvement_status) === statusFilter);
  }, [data, statusFilter]);

  return (
    <div className="p-4 sm:p-6 w-full mx-auto space-y-6 overflow-x-auto">
      <div className="flex my-6 px-3 flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Icon icon="mdi:template" className="text-blue-500" />
          {"الحجوزات"}
        </h1>
        {hasPermission(Permissions.CreateBookings) && (
          <Button
            onClick={() => navigate("/dashboard/booking/add")}
            className="gap-2 text-sm sm:text-base"
          >
            <Icon icon="mdi:plus" />
            {"إضافة حجز"}
          </Button>
        )}
      </div>

      {/* ✅ Filter dropdown */}
      <div className="flex items-center gap-2 mb-4">
        <label className="font-medium">Filter by status:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded px-2 py-1 text-gray-600 font-semibold outline-none cursor-pointer"
        >
          <option value="">All</option>
          {Object.entries(statusMap).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <DynamicTable
        data={filteredData || []} // ✅ pass filtered data
        columns={BookingColumns}
        isLoading={isLoading}
        onShow={(row) => navigate(`/dashboard/booking/${row.id}`)}
        onEditBooking={(row) => navigate(`/dashboard/booking/edit/${row.id}`)}
        permissions={permissions}
        onDeleteBooking={handleDelete}
        onUnconfirmOrder={onCancelBooking}
  //    onDelete={handleDelete}
      />

      {/* Delete dialogs */}
      <DeleteDialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={onConfirmDelete}
        loading={isLoadingDelete}
      />

      <DeleteDialog
        open={openCancelBooking}
        onClose={() => setOpenCancelBooking(false)}
        title={"إيقاف الحجز"}
        description="هل تريد تأكيد العملية"
        confirmText="نعم"
        titleLoading="جاري التأكيد"
        onConfirm={handelCancelBooking}
        loading={isLoadingCancel}
      />
    </div>
  );
};

export default BookingContainer;
