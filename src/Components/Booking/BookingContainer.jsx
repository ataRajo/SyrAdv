// BookingContainer.jsx - UPDATED WITH TEMPORARY BOOKINGS ICON & DETAILS
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  useConfirmBookingMutation 
} from "../../RtkQuery/Slice/Booking/BookingApi";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

const approvementStatusMap = {
  "1": "انتظار",
  "2": "موافقة",
  "3": "مرفوض",
  //"4": "متوقف مؤقت"
};

const bookingStatusMap = {
  1: "نشط",
  2: "مكتمل",
  3: "ملغي",
  //4: "متوقف مؤقت"
};

const EnhancedBookingColumns = [...BookingColumns];

const statusIndex = EnhancedBookingColumns.findIndex(col => col.accessor === "approvement_status");
if (statusIndex !== -1) {
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

  // ✅ Filter states
  const [statusFilter, setStatusFilter] = useState("");
  const [archiveFilter, setArchiveFilter] = useState("active");
  const [customerNameFilter , setCustomerNameFilter] = useState("")

  // Pause booking state
  const [pauseStartDate, setPauseStartDate] = useState("");
  const [pauseEndDate, setPauseEndDate] = useState("");
  const [selectedBookingForPause, setSelectedBookingForPause] = useState(null);
  const [pauseDaysAvailable, setPauseDaysAvailable] = useState(0);
  const [pauseValidationError, setPauseValidationError] = useState("");
  const [confirmBooking, { isLoading: isConfirming }] = useConfirmBookingMutation();

  // Status change state
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [selectedBookingForStatus, setSelectedBookingForStatus] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Temporary Bookings Dialog state
  const [openTemporaryDialog, setOpenTemporaryDialog] = useState(false);

  // RTK Query mutation for updating booking status
  const [updateBookingStatus] = useUpdateBookingStatusMutation();

  // Calculate counts
  const temporaryBookingsCount = useMemo(() => {
    if (!data || !Array.isArray(data)) return 0;
    return data.filter(booking => booking.type === 1 && booking.is_archived === 0).length;
  }, [data]);

  const pendingApprovalsCount = useMemo(() => {
    if (!data || !Array.isArray(data)) return 0;
    return data.filter(booking => booking.approvement_status === 1 && booking.is_archived === 0).length;
  }, [data]);

  const pausedBookingsCount = useMemo(() => {
    if (!data || !Array.isArray(data)) return 0;
    return data.filter(booking => booking.status === 4 && booking.is_archived === 0).length;
  }, [data]);

  const archivedBookingsCount = useMemo(() => {
    if (!data || !Array.isArray(data)) return 0;
    return data.filter(booking => booking.is_archived === 1).length;
  }, [data]);

  const activeBookingsCount = useMemo(() => {
    if (!data || !Array.isArray(data)) return 0;
    return data.filter(booking => booking.is_archived === 0).length;
  }, [data]);

  // Get temporary bookings for display
  const temporaryBookings = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    return data.filter(booking => booking.type === 1 && booking.is_archived === 0);
  }, [data]);

  // Calculate total notifications
  const totalNotifications = useMemo(() => {
    return temporaryBookingsCount + pendingApprovalsCount + pausedBookingsCount;
  }, [temporaryBookingsCount, pendingApprovalsCount, pausedBookingsCount]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "غير محدد";
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate remaining days
  const calculateRemainingDays = (endDate) => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Handle view booking details
  const handleViewBookingDetails = (bookingId) => {
    navigate(`/dashboard/booking/${bookingId}`);
    setOpenTemporaryDialog(false);
  };

  // Handle edit temporary booking
  const handleEditBooking = (bookingId) => {
    navigate(`/dashboard/booking/edit/${bookingId}`);
    setOpenTemporaryDialog(false);
  };

  const handleConfirmBooking = async (bookingId) => {
    if (isConfirming) return;
    
    // Optional: Add confirmation dialog
    const userConfirmed = window.confirm(`هل تريد تأكيد الحجز رقم ${bookingId}؟`);
    if (!userConfirmed) return;
    
    try {
      await confirmBooking(bookingId).unwrap();
      toast.success(`تم تأكيد الحجز رقم ${bookingId} بنجاح`);
      // The table will automatically refresh due to invalidated tags
    } catch (error) {
      console.error("Error confirming booking:", error);
      toast.error(error?.data?.message || "فشل في تأكيد الحجز");
    }
  }
  
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

  // ✅ Handle extend booking
  const handleExtendBooking = (booking) => {
    console.log("Extend booking clicked:", booking);
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
      toast.success(`تم إيقاف الحجز ${pauseData.bookingId} مؤقتاً`);
      
      // Reset and close
      setSelectedBookingForPause(null);
      setOpenCancelBooking(false);
      setPauseValidationError("");
    }
  };

  useEffect(() => {
    localStorage.setItem('bookingsNotificationCount', totalNotifications.toString());
  }, [totalNotifications]);

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

  const handlePauseEndDateChange = (e) => {
    setPauseEndDate(e.target.value);
    setPauseValidationError("");
  };

// ✅ Filtered data with BOTH statusFilter and archiveFilter
const filteredData = useMemo(() => {
  if (!data || !Array.isArray(data)) return [];
  
  let filtered = [...data];
  
  // 1. Apply archive filter
  if (archiveFilter === "active") {
    filtered = filtered.filter(booking => booking.is_archived === 0);
  } else if (archiveFilter === "archived") {
    filtered = filtered.filter(booking => booking.is_archived === 1);
  }
  // "all" option shows both archived and active
  
  // 2. Apply status filter (if selected)
  if (statusFilter) {
    filtered = filtered.filter((booking) => String(booking.approvement_status) === statusFilter);
  }
  
  // 3. Apply customer name filter (if entered)
  if (customerNameFilter.trim()) {
    const searchTerm = customerNameFilter.toLowerCase().trim();
    filtered = filtered.filter((booking) => {
      const customer = booking.customer;
      if (!customer) return false;
      
      // Search in both full_name and company_name
      const fullName = customer.full_name?.toLowerCase() || '';
      const companyName = customer.company_name?.toLowerCase() || '';
      const phone = customer.phone_number?.toLowerCase() || '';
      
      return fullName.includes(searchTerm) || 
             companyName.includes(searchTerm) || 
             phone.includes(searchTerm);
    });
  }
  
  return filtered;
}, [data, statusFilter, archiveFilter, customerNameFilter]); // ← Add customerNameFilter to dependencies


  return (
    <div className="p-4 sm:p-6 w-full mx-auto space-y-6 overflow-x-auto">
      {/* HEADER WITH TEMPORARY BOOKINGS ICON */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Icon icon="mdi:template" className="text-blue-500" />
            {"الحجوزات"}
          </h1>
          
          {temporaryBookingsCount > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setOpenTemporaryDialog(true)}
                    className="relative group"
                  >
                    <div className="relative p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors duration-200">
                      <Icon 
                        icon="mdi:clock-outline" 
                        className="w-6 h-6 text-amber-600 dark:text-amber-400"
                      />
                      <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg group-hover:bg-amber-600 transition-colors duration-200">
                        {temporaryBookingsCount}
                      </div>
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-amber-50 dark:bg-amber-900 border-amber-200 dark:border-amber-800">
                  <p className="text-amber-800 dark:text-amber-300 font-medium">
                    {temporaryBookingsCount} حجز مؤقت
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    انقر لعرض التفاصيل
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* TOTAL NOTIFICATIONS BELL */}
          {totalNotifications > 0 && archiveFilter === "active" && temporaryBookingsCount === 0 && (
            <div className="relative">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <Icon 
                        icon="mdi:bell" 
                        className="w-6 h-6 text-red-500 dark:text-red-400"
                      />
                      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {totalNotifications}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-800">
                    <p className="text-red-800 dark:text-red-300 font-medium">
                      {totalNotifications} إشعار
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
        
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

{/* Customer Name Filter */}
<div className="flex items-center gap-2">
  <label className="font-medium dark:text-gray-300">اسم العميل:</label>
  <div className="relative w-48">
    <Input
      type="text"
      placeholder="ابحث باسم العميل..."
      value={customerNameFilter}
      onChange={(e) => setCustomerNameFilter(e.target.value)}
      className="pr-8"
    />
   {customerNameFilter && (
  <div className="flex items-center gap-2 mt-2">
    <Icon icon="mdi:account" className="text-purple-500" />
    <span className="text-sm text-purple-600 dark:text-purple-400">
      تصفية حسب العميل: "{customerNameFilter}"
    </span>
    <button
      onClick={() => setCustomerNameFilter("")}
      className="text-purple-400 hover:text-purple-600"
    >
      <Icon icon="mdi:close" className="w-4 h-4" />
    </button>
  </div>
)}
  </div>
</div>


      {/* ✅ FILTERS SECTION */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        {/* Archive Filter */}
        <div className="flex items-center gap-2">
          <label className="font-medium dark:text-gray-300">تصفية حسب:</label>
          <div className="flex items-center gap-2">
            <Button
              variant={archiveFilter === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setArchiveFilter("active")}
              className={`px-3 ${archiveFilter === "active" ? "bg-blue-600 text-white" : ""}`}
            >
              <Icon icon="mdi:check-circle" className="ml-1" />
              نشط
            </Button>
            
            <Button
              variant={archiveFilter === "archived" ? "default" : "outline"}
              size="sm"
              onClick={() => setArchiveFilter("archived")}
              className={`px-3 ${archiveFilter === "archived" ? "bg-gray-600 text-white" : ""}`}
            >
              <Icon icon="mdi:archive" className="ml-1" />
              مؤرشفة
            </Button>
            
            <Button
              variant={archiveFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setArchiveFilter("all")}
              className={`px-3 ${archiveFilter === "all" ? "bg-green-600 text-white" : ""}`}
            >
              <Icon icon="mdi:view-list" className="ml-1" />
              الكل
            </Button>
          </div>
        </div>
        
        {/* Approval Status Filter */}
        {archiveFilter !== "archived" && (
          <div className="flex items-center gap-2">
            <label className="font-medium dark:text-gray-300">حالة الموافقة:</label>
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
        )}
      </div>

      {/* ✅ Active Filters Info */}
      {archiveFilter !== "all" && (
        <div className={`mb-4 p-3 rounded-lg ${
          archiveFilter === "active" 
            ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800" 
            : "bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700"
        }`}>
          <div className="flex items-center gap-2">
            <Icon 
              icon={archiveFilter === "active" ? "mdi:check-circle" : "mdi:archive"} 
              className={archiveFilter === "active" ? "text-blue-500" : "text-gray-500"} 
            />
            <div>
              <span className="font-medium">
                {archiveFilter === "active" ? "عرض الحجوزات النشطة" : "عرض الحجوزات المؤرشفة"}
              </span>
              <span className="mr-2 text-sm text-gray-600 dark:text-gray-400">
                ({filteredData?.length || 0} حجز)
              </span>
            </div>
          </div>
        </div>
      )}

      <DynamicTable
        data={filteredData || []}
        columns={EnhancedBookingColumns}
        isLoading={isLoading}
        onShow={(row) => navigate(`/dashboard/booking/${row.id}`)}
        onEditBooking={(row) => {
          if (row.is_archived === 1 || archiveFilter === "all") {
            toast.warning("لا يمكن تعديل هذا الحجز");
            return;
          }
          navigate(`/dashboard/booking/edit/${row.id}`);
        }}
        onDeleteBooking={(row) => {
          if (row.is_archived === 1 || archiveFilter === "all") {
            toast.warning("لا يمكن حذف هذا الحجز");
            return;
          }
          handleDelete(row);
        }}
        onUnconfirmOrder={(row) => {
          if (row.is_archived === 1 || archiveFilter === "all") {
            toast.warning("لا يمكن إيقاف هذا الحجز");
            return;
          }
          handlePauseBooking(row);
        }}
        onStatusChange={(row) => {
          if (row.is_archived === 1 || archiveFilter === "all") {
            toast.warning("لا يمكن تغيير حالة هذا الحجز");
            return;
          }
          handleStatusChange(row);
        }}
        onExtendBooking={(row) => {
          if (row.is_archived === 1 || archiveFilter === "all") {
            toast.warning("لا يمكن تمديد هذا الحجز");
            return;
          }
          handleExtendBooking(row);
        }}
        permissions={permissions}
        showTemporaryBookingIcon={archiveFilter === "active"}
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
                  <div className="dark:text-gray-400">حالة الأرشيف: <span className="font-bold dark:text-white">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      selectedBookingForStatus.is_archived === 1 ? "bg-gray-100 text-gray-800" : "bg-green-100 text-green-800"
                    }`}>
                      {selectedBookingForStatus.is_archived === 1 ? "مؤرشف" : "نشط"}
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
                  <div className="dark:text-gray-400">حالة الأرشيف: <span className="font-bold dark:text-white">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      selectedBookingForPause.is_archived === 1 ? "bg-gray-100 text-gray-800" : "bg-green-100 text-green-800"
                    }`}>
                      {selectedBookingForPause.is_archived === 1 ? "مؤرشف" : "نشط"}
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

      {/* TEMPORARY BOOKINGS DIALOG */}
      <Dialog open={openTemporaryDialog} onOpenChange={setOpenTemporaryDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] dark:bg-gray-900 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Icon icon="mdi:clock-outline" className="w-6 h-6" />
              الحجوزات المؤقتة
              <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                {temporaryBookingsCount}
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              قائمة الحجوزات المؤقتة التي تحتاج إلى تأكيد
            </DialogDescription>
          </DialogHeader>
          
          <Separator className="dark:bg-gray-700" />
          
          <ScrollArea className="max-h-[60vh] pr-4">
            {temporaryBookings.length === 0 ? (
              <div className="text-center py-8">
                <Icon icon="mdi:check-circle" className="w-16 h-16 text-green-500 dark:text-green-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300">لا توجد حجوزات مؤقتة</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">جميع الحجوزات مؤكدة</p>
              </div>
            ) : (
              <div className="space-y-4">
                {temporaryBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-4 rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">
                              الحجز #{booking.id}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                                <Icon icon="mdi:clock-outline" className="w-3 h-3 ml-1" />
                                مؤقت
                              </Badge>
                              <Badge className={
                                booking.approvement_status === 1 
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" 
                                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                              }>
                                {approvementStatusMap[booking.approvement_status]}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-sm text-gray-500 dark:text-gray-400">تاريخ الإنشاء</div>
                            <div className="font-medium text-gray-700 dark:text-gray-300">
                              {formatDate(booking.created_at)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="space-y-1">
                            <div className="text-sm text-gray-500 dark:text-gray-400">الموقع</div>
                            <div className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                              <Icon icon="mdi:map-marker" className="w-4 h-4" />
                              {booking.roadsigns?.[0]?.place || "غير محدد"}
                            </div>
                          </div>
                          {/*
                          

                          <div className="space-y-1">
                            <div className="text-sm text-gray-500 dark:text-gray-400">فترة الحجز</div>
                            <div className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                              <Icon icon="mdi:calendar-range" className="w-4 h-4" />
                              {formatDate(booking.start_date)} → {formatDate(booking.end_date)}
                            </div>
                          </div>
                          
                          */}
                          
                          
                          <div className="space-y-1">
                            <div className="text-sm text-gray-500 dark:text-gray-400">الأيام المتبقية</div>
                            <div className="font-bold text-lg text-blue-600 dark:text-blue-400">
                              {calculateRemainingDays(booking.end_date)} يوم
                            </div>
                          </div>
                        </div>
                        
                        {booking.notes && (
                          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">ملاحظات</div>
                            <div className="text-gray-700 dark:text-gray-300">{booking.notes}</div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleViewBookingDetails(booking.id)}
                          className="gap-2"
                          variant="outline"
                        >
                          <Icon icon="mdi:eye" />
                          عرض التفاصيل
                        </Button>
                        
                        <Button
                          size="sm"
                          onClick={() => handleConfirmBooking(booking.id)}
                          className="gap-2 bg-green-600 hover:bg-green-700"
                        >
                          <Icon icon="mdi:check" />
                          تأكيد الحجز
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          <div className="flex justify-between items-center pt-4 border-t dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              عرض {temporaryBookings.length} من {temporaryBookingsCount} حجز مؤقت
            </div>
            <Button
              variant="outline"
              onClick={() => setOpenTemporaryDialog(false)}
              className="gap-2"
            >
              <Icon icon="mdi:close" />
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingContainer;