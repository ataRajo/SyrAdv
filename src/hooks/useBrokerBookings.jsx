import { useState, useCallback, useMemo } from "react";
import { showToast } from "../utils/Notifictions/showToast";
import {
  useGetBrokerBookingsQuery,
  useCreateBrokerBookingMutation,
  useGetBookingDetailsQuery,
  useCreateCustomerBookingMutation,
  useUpdateBookingMutation,
  useDeleteBookingMutation,
} from "../RtkQuery/Slice/mediatorapis/MediatorApi";
import { useCalculateReservationMutation } from "../RtkQuery/Slice/Booking/BookingApi";

const DEFAULT_FILTERS = {
  page: 1,
  per_page: 15,
  status: "",
  start_date: "",
  end_date: "",
  customer_id: "",
};

export const useBrokerBookings = () => {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Calculate price state
  const [calculatedPrice, setCalculatedPrice] = useState(null);

  // Queries
  const {
    data: bookingsData,
    isLoading: isLoadingBookings,
    isFetching,
    error: bookingsError,
    refetch: refetchBookings,
  } = useGetBrokerBookingsQuery(filters);

  const {
    data: bookingDetails,
    isLoading: isLoadingDetails,
    refetch: refetchDetails,
  } = useGetBookingDetailsQuery(
    { customer_id: filters.customer_id || undefined, booking_id: selectedBooking?.id },
    { skip: !selectedBooking?.id && !filters.customer_id }
  );

  // Mutations
  const [createBrokerBooking, { isLoading: isCreatingBooking }] = useCreateBrokerBookingMutation();
  const [createCustomerBooking, { isLoading: isCreatingCustomerBooking }] = useCreateCustomerBookingMutation();
  const [updateBooking, { isLoading: isUpdating }] = useUpdateBookingMutation();
  const [deleteBooking, { isLoading: isDeleting }] = useDeleteBookingMutation();
  
  // Calculate reservation mutation
  const [calculateReservation, { isLoading: isCalculating }] = useCalculateReservationMutation();

  // Memoized derived data
  const bookings = useMemo(() => {
    if (!bookingsData) return [];
    if (Array.isArray(bookingsData)) return bookingsData;
    if (Array.isArray(bookingsData.data)) return bookingsData.data;
    return bookingsData.data || bookingsData.bookings || [];
  }, [bookingsData]);

  const pagination = useMemo(() => {
    if (!bookingsData || Array.isArray(bookingsData)) {
      return {
        currentPage: 1,
        totalPages: 1,
        total: bookings.length,
        perPage: bookings.length,
      };
    }
    return {
      currentPage: bookingsData?.current_page || 1,
      totalPages: bookingsData?.last_page || 1,
      total: bookingsData?.total || 0,
      perPage: bookingsData?.per_page || 15,
    };
  }, [bookingsData, bookings.length]);

  // Validation helper
  const validateBookingData = useCallback((bookingData) => {
    if (!bookingData.customer_id) {
      showToast("error", "معرف العميل مطلوب");
      return false;
    }
    if (!Array.isArray(bookingData.roadsigns) || bookingData.roadsigns.length === 0) {
      showToast("error", "يجب إضافة لوحة إعلانية واحدة على الأقل");
      return false;
    }
    if (!bookingData.printing_id) {
      showToast("error", "نوع الطباعة مطلوب");
      return false;
    }
    return true;
  }, []);

  // Calculate price action
  const calculateBookingPrice = useCallback(async ({ roadsigns, start_date, end_date, printing_id, product_type = 2 }) => {
    if (!roadsigns || roadsigns.length === 0) {
      showToast("error", "يرجى إضافة لوحة إعلانية واحدة على الأقل");
      return { success: false };
    }
    if (!start_date || !end_date) {
      showToast("error", "يرجى تحديد فترة الحجز");
      return { success: false };
    }
    if (!printing_id) {
      showToast("error", "يرجى اختيار نوع الطباعة");
      return { success: false };
    }

    try {
      const payload = {
        roadsigns: roadsigns.map(sign => ({
          road_sign_id: parseInt(sign.road_sign_id || sign.id),
          booking_faces: parseInt(sign.booking_faces) || 1,
          start_date: sign.start_date || start_date,
          end_date: sign.end_date || end_date,
          number_of_reserved_panels: parseInt(sign.number_of_reserved_panels) || 1,
        })),
        product_type: parseInt(product_type),
        start_date,
        end_date,
        is_extend: 0,
        printing_id: parseInt(printing_id),
      };

      const response = await calculateReservation(payload).unwrap();

      let price = null;
      if (response.amount?.total_price) {
        price = response.amount.total_price;
      } else if (response.total_price_per_month) {
        price = response.total_price_per_month;
      } else if (response.total_price) {
        price = response.total_price;
      } else if (response.price_per_period) {
        price = response.price_per_period;
      }

      if (price !== null) {
        setCalculatedPrice(price);
        showToast("success", `تم حساب السعر: ${price.toLocaleString()} $`);
        return { success: true, price, response };
      } else {
        showToast("error", "لم يتم استلام سعر من الخادم");
        return { success: false };
      }
    } catch (err) {
      console.error("Error calculating price:", err);
      showToast("error", err?.data?.message || "فشل في حساب السعر");
      return { success: false, error: err };
    }
  }, [calculateReservation]);

  // Reset calculated price
  const resetCalculatedPrice = useCallback(() => {
    setCalculatedPrice(null);
  }, []);

  // Actions
  const createNewBooking = useCallback(async (bookingData) => {
    if (!validateBookingData(bookingData)) {
      return { success: false };
    }

    try {
      const response = await createCustomerBooking(bookingData).unwrap();
      showToast("success", response.message || "تم إنشاء الحجز بنجاح");
      refetchBookings();
      setCalculatedPrice(null); // Reset after successful creation
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.data?.message || error.message || "فشل في إنشاء الحجز";
      showToast("error", message);
      return { success: false, error: message };
    }
  }, [createCustomerBooking, refetchBookings, validateBookingData]);

  const updateExistingBooking = useCallback(async (id, bookingData) => {
    try {
      const response = await updateBooking({ id, data: bookingData }).unwrap();
      showToast("success", "تم تحديث الحجز بنجاح");
      refetchBookings();
      if (selectedBooking?.id === id) refetchDetails();
      return { success: true, data: response };
    } catch (error) {
      const message = error.data?.message || error.message || "فشل في تحديث الحجز";
      showToast("error", message);
      return { success: false, error: message };
    }
  }, [updateBooking, refetchBookings, refetchDetails, selectedBooking]);

  const deleteExistingBooking = useCallback(async (id) => {
    try {
      await deleteBooking(id).unwrap();
      showToast("success", "تم حذف الحجز بنجاح");
      refetchBookings();
      setSelectedBooking(null);
      return { success: true };
    } catch (error) {
      const message = error.data?.message || error.message || "فشل في حذف الحجز";
      showToast("error", message);
      return { success: false, error: message };
    }
  }, [deleteBooking, refetchBookings]);

  // Filter handlers
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  // Selection handlers
  const selectBooking = useCallback((booking) => {
    setSelectedBooking(booking);
  }, []);

  const clearSelectedBooking = useCallback(() => {
    setSelectedBooking(null);
  }, []);

  // Data preparation helper
  const prepareBookingData = useCallback((formData) => {
    const {
      customer_id,
      type = 2,
      start_date,
      end_date,
      roadsigns,
      product_type = 2,
      notes = "",
      printing_id,
      coupon,
      discount_type,
      value,
    } = formData;

    const payload = {
      customer_id: parseInt(customer_id),
      type,
      start_date,
      end_date,
      roadsigns: roadsigns.map(sign => ({
        road_sign_id: parseInt(sign.road_sign_id),
        booking_faces: parseInt(sign.booking_faces) || 1,
        number_of_reserved_panels: parseInt(sign.number_of_reserved_panels) || 1,
        start_date: sign.start_date || start_date,
        end_date: sign.end_date || end_date,
      })),
      product_type,
      notes,
      printing_id: parseInt(printing_id),
    };

    if (coupon) payload.coupon = coupon;
    if (discount_type) payload.discount_type = discount_type;
    if (value !== null && value !== undefined) payload.value = value;

    return payload;
  }, []);

  return {
    // Data
    bookings,
    pagination,
    selectedBooking,
    bookingDetails,
    calculatedPrice,
    
    // Loading states
    isLoading: isLoadingBookings || isFetching,
    isLoadingDetails,
    isCreating: isCreatingBooking || isCreatingCustomerBooking,
    isUpdating,
    isDeleting,
    isCalculating,
    
    // Errors
    error: bookingsError,
    
    // Filters
    filters,
    handleFilterChange,
    handlePageChange,
    clearFilters,
    
    // Actions
    createNewBooking,
    updateExistingBooking,
    deleteExistingBooking,
    selectBooking,
    clearSelectedBooking,
    refetchBookings,
    prepareBookingData,
    calculateBookingPrice,
    resetCalculatedPrice,
    
    // UI states
    isCreating,
    setIsCreating,
    isEditing,
    setIsEditing,
  };
};