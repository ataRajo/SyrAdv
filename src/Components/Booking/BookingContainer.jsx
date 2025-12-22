// BookingContainer.jsx - WITHOUT StatusSelectorWithButton
import React, { useState, useMemo, useEffect } from "react";
import { DynamicTable } from "../../utils/Tables/DynamicTable";
import { BookingColumns } from "../../utils/Tables/ColumnsTable/BookingColumns";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Permissions } from "../../Static/StaticData";
import { DeleteDialog } from "../../utils/Dialogs/DeleteDialog/DeleteDialog";
import useGetBookings from "../../hooks/useGetBookings";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateBookingStatusMutation } from "../../RtkQuery/Slice/Booking/BookingApi";
import { toast } from "sonner";

const approvementStatusMap = {
  "1": "انتظار",
  "2": "موافقة",
  "3": "مرفوض",
  "4": "متوقف مؤقت"
};

const bookingStatusMap = {
  1: "نشط",
  2: "مكتمل", 
  3: "ملغي",
  4: "متوقف مؤقت"
};

// Create enhanced columns with both status displays
const EnhancedBookingColumns = [...BookingColumns];

// Find and update the status column to show both statuses
const statusIndex = EnhancedBookingColumns.findIndex(col => col.accessor === "approvement_status");
if (statusIndex !== -1) {
  // Update the existing status cell to show both statuses WITHOUT StatusSelectorWithButton
  EnhancedBookingColumns[statusIndex] = {
    ...EnhancedBookingColumns[statusIndex],
    cell: ({ row }) => (
      <div className="flex flex-col gap-2">
        {/* Approval status display */}
        <div>
          <span className="text-xs text-gray-500">حالة الموافقة:</span>
          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
            row.approvement_status === 2 ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" :
            row.approvement_status === 3 ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300" :
            row.approvement_status === 4 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300" :
            "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
          }`}>
            {approvementStatusMap[row.approvement_status] || "غير معروف"}
          </span>
        </div>
        
        {/* Booking status display */}
        <div>
          <span className="text-xs text-gray-500">حالة الحجز:</span>
          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
            row.status === 1 ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" :
            row.status === 2 ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300" :
            row.status === 3 ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300" :
            row.status === 4 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300" :
            "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
          }`}>
            {bookingStatusMap[row.status] || "غير معروف"}
          </span>
        </div>
      </div>
    ),
  };
}

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
  
  // Pause booking state
  const [pauseStartDate, setPauseStartDate] = useState("");
  const [pauseEndDate, setPauseEndDate] = useState("");
  const [selectedBookingForPause, setSelectedBookingForPause] = useState(null);
  const [pauseDaysAvailable, setPauseDaysAvailable] = useState(0);
  const [pauseValidationError, setPauseValidationError] = useState("");

  // Status change state
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [selectedBookingForStatus, setSelectedBookingForStatus] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // RTK Query mutation for updating booking status
  const [updateBookingStatus] = useUpdateBookingStatusMutation();

  // Calculate pause duration dynamically
  const calculatePauseDuration = () => {
    if (!pauseStartDate || !pauseEndDate) return 0;
    const start = new Date(pauseStartDate);
    const end = new Date(pauseEndDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  };

  const pauseDuration = calculatePauseDuration();

  // Calculate available days when booking is selected for pause
  useEffect(() => {
    if (selectedBookingForPause) {
      const booking = selectedBookingForPause;
      const originalEndDate = new Date(booking.end_date);
      const today = new Date();
      const remainingDays = Math.ceil((originalEndDate - today) / (1000 * 60 * 60 * 24));
      setPauseDaysAvailable(Math.max(0, remainingDays));
      
      // Set default dates
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      setPauseStartDate(tomorrow.toISOString().split('T')[0]);
      
      const defaultEndDate = new Date(tomorrow);
      const maxPauseDays = Math.min(10, remainingDays);
      defaultEndDate.setDate(defaultEndDate.getDate() + maxPauseDays);
      setPauseEndDate(defaultEndDate.toISOString().split('T')[0]);
    }
  }, [selectedBookingForPause]);

  // Handle pause booking click
  const handlePauseBooking = (booking) => {
    setSelectedBookingForPause(booking);
    setPauseValidationError("");
    setOpenCancelBooking(true);
  };

  // Handle status change click
  const handleStatusChange = (booking) => {
    console.log("Opening status change dialog for booking:", booking);
    setSelectedBookingForStatus(booking);
    setNewStatus(booking.approvement_status?.toString() || "");
    setRejectReason("");
    setOpenStatusDialog(true);
  };

  // ✅ Handle extend booking - FIXED
  const handleExtendBooking = (booking) => {
    console.log("Extend booking clicked:", booking);
    // Navigate to the extend booking page
    navigate(`/dashboard/booking/extend/${booking.id}`);
  };

  // Handle status update
  const handleUpdateStatus = async () => {
    if (!selectedBookingForStatus || !newStatus) {
      toast.error("يرجى اختيار حالة جديدة");
      return;
    }

    if (newStatus === "3" && !rejectReason.trim()) {
      toast.error("يرجى إدخال سبب الرفض");
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const result = await updateBookingStatus({
        id: selectedBookingForStatus.id,
        status: newStatus,
        reject_reason: newStatus === "3" ? rejectReason : null
      }).unwrap();

      toast.success("تم تحديث حالة الحجز بنجاح");
      setOpenStatusDialog(false);
      setSelectedBookingForStatus(null);
      setNewStatus("");
      setRejectReason("");
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast.error(error?.data?.message || "فشل في تحديث حالة الحجز");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Validate pause dates
  const validatePauseDates = () => {
    if (!pauseStartDate || !pauseEndDate) {
      return "يجب تحديد تاريخ البداية والنهاية";
    }

    const start = new Date(pauseStartDate);
    const end = new Date(pauseEndDate);
    const today = new Date();
    
    // Start date must be at least tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    if (start < tomorrow) {
      return "تاريخ البداية يجب أن يكون غداً أو بعد";
    }

    // End date must be after start date
    if (end <= start) {
      return "تاريخ النهاية يجب أن يكون بعد تاريخ البداية";
    }

    // User can only take up to 10 days or remaining days, whichever is less
    const maxAllowedDays = Math.min(10, pauseDaysAvailable);
    
    if (pauseDuration > maxAllowedDays) {
      return `يمكنك إيقاف الحجز لمدة أقصاها ${maxAllowedDays} أيام فقط`;
    }

    return "";
  };

  // Handle pause confirmation
  const handlePauseConfirm = () => {
    const error = validatePauseDates();
    if (error) {
      setPauseValidationError(error);
      return;
    }
    
    if (selectedBookingForPause) {
      const pauseData = {
        bookingId: selectedBookingForPause.id,
        startDate: pauseStartDate,
        endDate: pauseEndDate,
        duration: pauseDuration
      };
      
      console.log("Pausing booking:", pauseData);
      alert(`تم إيقاف الحجز ${pauseData.bookingId} مؤقتاً من ${pauseData.startDate} إلى ${pauseData.endDate}`);
      
      // Reset and close
      setSelectedBookingForPause(null);
      setOpenCancelBooking(false);
      setPauseValidationError("");
    }
  };

  // Handle start date change
  const handlePauseStartDateChange = (e) => {
    const newStartDate = e.target.value;
    setPauseStartDate(newStartDate);
    setPauseValidationError("");
    
    // If end date is before new start date, adjust it
    if (pauseEndDate && new Date(pauseEndDate) < new Date(newStartDate)) {
      const newEndDate = new Date(newStartDate);
      newEndDate.setDate(newEndDate.getDate() + 1);
      setPauseEndDate(newEndDate.toISOString().split('T')[0]);
    }
  };

  // Handle end date change
  const handlePauseEndDateChange = (e) => {
    setPauseEndDate(e.target.value);
    setPauseValidationError("");
  };

  // ✅ Filtered data
  const filteredData = useMemo(() => {
    if (!statusFilter) return data;
    return data.filter((booking) => String(booking.approvement_status) === statusFilter);
  }, [data, statusFilter]);

  console.log("BookingContainer - Has extend permission:", hasPermission(permissions?.extend));

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
        <label className="font-medium dark:text-gray-300">تصفية حسب حالة الموافقة:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded px-2 py-1 text-gray-600 dark:text-gray-300 font-semibold outline-none cursor-pointer"
        >
          <option value="">الكل</option>
          {Object.entries(approvementStatusMap).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Status Filter Legend */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h4 className="font-semibold mb-2 dark:text-gray-300">دلالات الألوان:</h4>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm dark:text-gray-300">نشط / موافقة</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm dark:text-gray-300">مكتمل</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-sm dark:text-gray-300">ملغي / مرفوض</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-sm dark:text-gray-300">متوقف مؤقت</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span className="text-sm dark:text-gray-300">غير معروف</span>
          </div>
        </div>
      </div>

       <DynamicTable
        data={filteredData || []}
        columns={EnhancedBookingColumns} // Use enhanced columns
        isLoading={isLoading}
        onShow={(row) => navigate(`/dashboard/booking/${row.id}`)}
        onEditBooking={(row) => navigate(`/dashboard/booking/edit/${row.id}`)}
        onDeleteBooking={handleDelete}
        onUnconfirmOrder={handlePauseBooking}
        onStatusChange={handleStatusChange}
        onExtendBooking={handleExtendBooking}
        permissions={permissions}
        showTemporaryBookingIcon={true}
        isOrdersTable={false}
      />

      {/* Delete dialog */}
      <DeleteDialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={onConfirmDelete}
        loading={isLoadingDelete}
      />

      {/* Status Change Dialog */}
      <DeleteDialog
        open={openStatusDialog}
        onClose={() => {
          setOpenStatusDialog(false);
          setSelectedBookingForStatus(null);
          setNewStatus("");
          setRejectReason("");
        }}
        title={"تغيير حالة الموافقة للحجز"}
        description={
          <div className="space-y-4">
            {selectedBookingForStatus && (
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border dark:border-gray-700">
                <h4 className="font-semibold mb-2 dark:text-gray-300">معلومات الحجز:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="dark:text-gray-400">رقم الحجز: <span className="font-bold dark:text-white">{selectedBookingForStatus.id}</span></div>
                  <div className="dark:text-gray-400">الموقع: <span className="font-bold dark:text-white">{selectedBookingForStatus.roadsigns?.[0]?.place || "غير محدد"}</span></div>
                  <div className="dark:text-gray-400">حالة الموافقة: <span className="font-bold dark:text-white">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      selectedBookingForStatus.approvement_status === 2 ? "bg-green-100 text-green-800" :
                      selectedBookingForStatus.approvement_status === 3 ? "bg-red-100 text-red-800" :
                      selectedBookingForStatus.approvement_status === 4 ? "bg-yellow-100 text-yellow-800" :
                      "bg-blue-100 text-blue-800"
                    }`}>
                      {approvementStatusMap[selectedBookingForStatus.approvement_status] || "غير معروف"}
                    </span>
                  </span></div>
                  <div className="dark:text-gray-400">حالة الحجز: <span className="font-bold dark:text-white">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      selectedBookingForStatus.status === 1 ? "bg-green-100 text-green-800" :
                      selectedBookingForStatus.status === 4 ? "bg-yellow-100 text-yellow-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {bookingStatusMap[selectedBookingForStatus.status] || "غير معروف"}
                    </span>
                  </span></div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <Label htmlFor="newStatus" className="dark:text-gray-300">
                  حالة الموافقة الجديدة:
                </Label>
                <select
                  id="newStatus"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-2 border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded"
                >
                  <option value="">اختر حالة الموافقة</option>
                  {Object.entries(approvementStatusMap).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {newStatus === "3" && (
                <div>
                  <Label htmlFor="rejectReason" className="dark:text-gray-300">
                    سبب الرفض:
                  </Label>
                  <textarea
                    id="rejectReason"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full p-2 border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded min-h-[80px]"
                    placeholder="أدخل سبب رفض الحجز..."
                  />
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <Icon icon="mdi:information" className="text-blue-500 dark:text-blue-400 mt-0.5" />
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>ملاحظة:</strong> هذا يغير فقط حالة الموافقة (approvement_status)
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
        confirmText="تأكيد التغيير"
        titleLoading="جاري التحديث..."
        onConfirm={handleUpdateStatus}
        loading={isUpdatingStatus}
        cancelText="إلغاء"
      />

      {/* Pause Booking Dialog */}
      {openCancelBooking && selectedBookingForPause && (
        <DeleteDialog
          open={openCancelBooking}
          onClose={() => {
            setOpenCancelBooking(false);
            setSelectedBookingForPause(null);
            setPauseValidationError("");
          }}
          title={"إيقاف مؤقت للحجز"}
          description={
            <div className="space-y-4">
              {/* Booking Info */}
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border dark:border-gray-700">
                <h4 className="font-semibold mb-2 dark:text-gray-300">معلومات الحجز:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="dark:text-gray-400">رقم الحجز: <span className="font-bold dark:text-white">{selectedBookingForPause.id}</span></div>
                  <div className="dark:text-gray-400">الموقع: <span className="font-bold dark:text-white">{selectedBookingForPause.roadsigns?.[0]?.place || "غير محدد"}</span></div>
                  <div className="dark:text-gray-400">حالة الحجز الحالية: <span className="font-bold dark:text-white">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      selectedBookingForPause.status === 1 ? "bg-green-100 text-green-800" :
                      selectedBookingForPause.status === 4 ? "bg-yellow-100 text-yellow-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {bookingStatusMap[selectedBookingForPause.status] || "غير معروف"}
                    </span>
                  </span></div>
                  <div className="dark:text-gray-400">حالة الموافقة: <span className="font-bold dark:text-white">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      selectedBookingForPause.approvement_status === 2 ? "bg-green-100 text-green-800" :
                      selectedBookingForPause.approvement_status === 3 ? "bg-red-100 text-red-800" :
                      "bg-blue-100 text-blue-800"
                    }`}>
                      {approvementStatusMap[selectedBookingForPause.approvement_status] || "غير معروف"}
                    </span>
                  </span></div>
                  <div className="col-span-2 dark:text-gray-400">
                    الأيام المتبقية: <span className="font-bold text-blue-600 dark:text-blue-400">{pauseDaysAvailable} يوم</span>
                  </div>
                </div>
              </div>

              {/* Date Inputs */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="pauseStartDate" className="dark:text-gray-300">
                    تاريخ بداية الإيقاف:
                  </Label>
                  <Input
                    id="pauseStartDate"
                    type="date"
                    value={pauseStartDate}
                    onChange={handlePauseStartDateChange}
                    min={new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]}
                    max={selectedBookingForPause ? new Date(selectedBookingForPause.end_date).toISOString().split('T')[0] : undefined}
                    className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">يجب أن يكون تاريخ البداية غداً أو بعد</p>
                </div>

                <div>
                  <Label htmlFor="pauseEndDate" className="dark:text-gray-300">
                    تاريخ نهاية الإيقاف:
                  </Label>
                  <Input
                    id="pauseEndDate"
                    type="date"
                    value={pauseEndDate}
                    onChange={handlePauseEndDateChange}
                    min={pauseStartDate || new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().split('T')[0]}
                    max={selectedBookingForPause ? new Date(selectedBookingForPause.end_date).toISOString().split('T')[0] : undefined}
                    className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    يمكنك إيقاف الحجز لمدة أقصاها {Math.min(10, pauseDaysAvailable)} أيام
                  </p>
                </div>

                {/* Duration Display */}
                {pauseStartDate && pauseEndDate && pauseDuration > 0 && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-700 dark:text-green-300">مدة الإيقاف:</span>
                      <span className="font-bold text-green-700 dark:text-green-300 text-lg">
                        {pauseDuration} يوم
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                      من {new Date(pauseStartDate).toLocaleDateString('ar-EG')} إلى {new Date(pauseEndDate).toLocaleDateString('ar-EG')}
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {pauseValidationError && (
                  <div className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="flex items-start gap-2">
                      <Icon icon="mdi:alert-circle" className="text-red-500 dark:text-red-400 mt-0.5" />
                      <span>{pauseValidationError}</span>
                    </div>
                  </div>
                )}

                {/* Days Limit Info */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-2">
                    <Icon icon="mdi:information" className="text-blue-500 dark:text-blue-400 mt-0.5" />
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>ملاحظة:</strong> يمكنك إيقاف الحجز لمدة أقصاها{" "}
                      <span className="font-bold">{Math.min(30, pauseDaysAvailable)}</span>{" "}
                      يوم
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
          confirmText="تأكيد الإيقاف المؤقت"
          titleLoading="جاري الإيقاف..."
          onConfirm={handlePauseConfirm}
          loading={isLoadingCancel}
          error={pauseValidationError}
          cancelText="إلغاء"
        />
      )}
    </div>
  );
};

export default BookingContainer;