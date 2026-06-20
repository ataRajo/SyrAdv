import { useCallback, useMemo, useState } from "react";
import { showToast } from "../utils/Notifictions/showToast";
import {
  useCancelBookingMutation,
  useDeleteBookingMutation,
  useGetBookingQuery,
} from "../RtkQuery/Slice/Booking/BookingApi";
import { useNavigate } from "react-router";
import { useAuth } from "../Context/AuthProvider";
import { Permissions } from "../Static/StaticData";
import { useEffect } from "react";
const useGetBookings = ({page = 1, per_page = 20}={}) => {
  
  const { data:bookingsResponse, isLoading } = useGetBookingQuery({page,per_page});

const data = bookingsResponse?.data || [];
const paginationMeta = {
  currentPage: bookingsResponse?.current_page || 1,
  lastPage: bookingsResponse?.last_page || 1,
  total: bookingsResponse?.total || 0,
  perPage: bookingsResponse?.per_page || 20,
};
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [openDelete, setOpenDelete] = useState(false);
  const [openCancelBooking, setOpenCancelBooking] = useState(false);
  const [selectBooking, setSelectBooking] = useState();

  
  const [deleteBooking, { isLoading: isLoadingDelete }] =
    useDeleteBookingMutation();

  const [cancelBooking, { isLoading: isLoadingCancel }] =
    useCancelBookingMutation();

  const handleDelete = useCallback((row) => {
    if (!row) {
      console.error("No row data provided for edit");
      return;
    }
    setSelectBooking(row);
    setOpenDelete(true);
  }, []);

  const onCancelBooking = (row) => {
    setSelectBooking(row);
    setOpenCancelBooking(true);
  };

  const handelCancelBooking = useCallback(async () => {
    try {
      await cancelBooking(selectBooking?.id).unwrap();
      showToast("success", "تم إيقاف الطلب بنجاح");
    } catch (err) {
      showToast("error", err.data?.message || "خطأ غير معروف");
    }
    setOpenCancelBooking(false);
  }, [cancelBooking, selectBooking?.id]);

useEffect(() => {
  console.log("Bookings list:", data);
}, [data]);


  const onConfirmDelete = useCallback(async () => {
    try {
      await deleteBooking(selectBooking?.id).unwrap();
      showToast("success", "تم حذف الحجز بنجاح");
    } catch (err) {
      showToast("error", err.data.message);
    }
    setOpenDelete(false);
  }, [selectBooking , selectBooking?.id]);


  const permissions = useMemo(() => {
    return {
      show: Permissions.ViewBookings,
      edit: Permissions.EditBookings,
      delete: Permissions.DeleteBookings,
      unConfirm: Permissions.EditBookings,
      extend: Permissions.ExtendBookings,
    };
  }, [Permissions]);

  return {
    permissions,
    data,
    isLoading,
    navigate,
    paginationMeta,
    hasPermission,
    openDelete,
    setOpenDelete,
    openCancelBooking,
    setOpenCancelBooking,
    selectBooking,
    setSelectBooking,
    deleteBooking,
    isLoadingDelete,
    cancelBooking,
    isLoadingCancel,
    handleDelete,
    onCancelBooking,
    onConfirmDelete,
    handelCancelBooking,
  };
};

export default useGetBookings;
