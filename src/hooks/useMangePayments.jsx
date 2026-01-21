import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
  useConfirmOnePaymentMutation,
  useDeletePaymentMutation,
  useGetPaymentsQuery,
  useGetTotalPaymentAndRemainingQuery,
} from "../RtkQuery/Slice/Payments/PaymentsApi";
import { showToast } from "../utils/Notifictions/showToast";
import { Permissions } from "../Static/StaticData";

const useMangePayments = () => {
  const [openAdd, setOpenAdd] = useState(false);
  const [openViewImage, setOpenViewImage] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [activeTab, setActiveTab] = useState("payments");
  const [openConfirm, setOpenConfirm] = useState(false);
  const [isConfirmAction, setIsConfirmAction] = useState(true);
  const [selectPayment, setSelectPayment] = useState();

  // box state
  const [fromDate, setFromDate] = useState();
  const [toDate, setToDate] = useState();
  // Add filter states
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");

  const [confirmPayment, { isLoading: isLoadingConfirm }] =
    useConfirmOnePaymentMutation();
  const [selectedPayment, setSelectedPayment] = useState(null);
  const { data: payments = [], isFetching: isFetchingPayments } =
    useGetPaymentsQuery();
  const {
    data: paymentIsNotReceived = [],
    isFetching: isFetchingPaymentsNotReceived,
  } = useGetPaymentsQuery({ is_received: false });
  const { data: paymentIsReceived = [], isFetching: isFetchingPaymentsReceived } =
    useGetPaymentsQuery({ is_received: true });
  const [deletePayment, { isLoading: isLoadingDelete }] =
    useDeletePaymentMutation();

  // Updated box query with filters
  const { data, isFetching: isFetchingBox } = useGetTotalPaymentAndRemainingQuery(
    {
      from_date: fromDate,
      to_date: toDate,
      user_id: selectedUser,
      customer_id: selectedCustomer,
    }
  );

  // ✅ دالة يمكن إعادة استخدامها لحساب إشعارات أي مجموعة من الدفعات
  const calculateBookingNotifications = useCallback((paymentData) => {
    if (!paymentData || !paymentData.length) {
      return {
        totalBookings: 0,
        pendingBookings: 0,
        overdueBookings: 0,
        completedBookings: 0,
        bookingsMap: {},
        pendingBookingsList: [],
        completedBookingsList: [],
        overdueBookingsList: []
      };
    }
    
    // تجميع الدفعات حسب الحجز (booking_id)
    const bookingsMap = {};
    
    // أولاً: تجميع كل الدفعات حسب الحجز
    paymentData.forEach(payment => {
      const bookingId = payment.booking_id;
      if (!bookingsMap[bookingId]) {
        bookingsMap[bookingId] = {
          bookingId: bookingId,
          customerId: payment.customer_id,
          customerName: payment.customer?.company_name || payment.customer?.full_name || 'غير معروف',
          totalAmount: 0,
          totalPaid: 0,
          totalRemaining: 0,
          payments: [],
          lastPaymentDate: null,
          isCompleted: false
        };
      }
      
      const booking = bookingsMap[bookingId];
      const paymentAmount = parseFloat(payment.total) || 0;
      const paymentPaid = parseFloat(payment.paid) || 0;
      const paymentRemaining = parseFloat(payment.remaining) || 0;
      
      booking.totalAmount += paymentAmount;
      booking.totalPaid += paymentPaid;
      booking.totalRemaining += paymentRemaining;
      booking.payments.push({
        id: payment.id,
        amount: paymentAmount,
        paid: paymentPaid,
        remaining: paymentRemaining,
        date: payment.date,
        status: payment.status
      });
      
      // تحديث آخر تاريخ دفع
      if (payment.date) {
        const paymentDate = new Date(payment.date);
        if (!booking.lastPaymentDate || paymentDate > booking.lastPaymentDate) {
          booking.lastPaymentDate = paymentDate;
        }
      }
    });
    
    // ثانياً: حساب الحجوزات التي لا تزال باقية (المجموع الكلي > 0)
    const pendingBookingsList = [];
    const completedBookingsList = [];
    
    Object.values(bookingsMap).forEach(booking => {
      // تحديد إذا كان الحجز مكتملاً أم لا
      booking.isCompleted = booking.totalRemaining <= 0;
      
      if (!booking.isCompleted) {
        pendingBookingsList.push(booking);
      } else {
        completedBookingsList.push(booking);
      }
    });
    
    const pendingBookingsCount = pendingBookingsList.length;
    
    // ثالثاً: حساب الحجوزات المتأخرة
    const overdueBookingsList = pendingBookingsList.filter(booking => {
      if (!booking.lastPaymentDate) return false;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const paymentDate = new Date(booking.lastPaymentDate);
      paymentDate.setHours(0, 0, 0, 0);
      
      // إذا كان آخر دفعة منذ أكثر من 3 أيام، تعتبر متأخرة
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(today.getDate() - 3);
      return paymentDate < threeDaysAgo;
    });
    
    const overdueBookingsCount = overdueBookingsList.length;
    
    return {
      totalBookings: Object.keys(bookingsMap).length,
      pendingBookings: pendingBookingsCount,
      overdueBookings: overdueBookingsCount,
      completedBookings: completedBookingsList.length,
      bookingsMap,
      pendingBookingsList,
      completedBookingsList,
      overdueBookingsList
    };
  }, []);

  // ✅ حساب الإشعارات للبيانات غير المستلمة (للتخزين في localStorage)
  const allNotifications = useMemo(() => {
    return calculateBookingNotifications(paymentIsNotReceived);
  }, [paymentIsNotReceived, calculateBookingNotifications]);

  // ✅ تخزين الإشعارات الكاملة في localStorage
  useEffect(() => {
    if (paymentIsNotReceived.length === 0) {
      localStorage.setItem('paymentsNotificationCount', '0');
      localStorage.setItem('paymentsOverdueCount', '0');
      return;
    }

    localStorage.setItem('paymentsNotificationCount', allNotifications.pendingBookings.toString());
    localStorage.setItem('paymentsOverdueCount', allNotifications.overdueBookings.toString());
  }, [allNotifications, paymentIsNotReceived]);

  const onShow = useCallback((row) => {
    setSelectedPayment(row);
    setOpenViewImage(true);
  }, []);

  const onConfirmPayment = useCallback((row) => {
    setSelectedPayment(row);
    setIsConfirmAction(true);
    setOpenConfirm(true);
  }, []);

  const handleConfirm = useCallback(async () => {
    try {
      await confirmPayment(selectedPayment.id).unwrap();
      showToast("success", "تم تسليم الدفعة بنجاح");
    } catch (err) {
      showToast("error", err.data?.message || "خطأ غير معروف");
    }
    setOpenConfirm(false);
  }, [selectedPayment?.id, confirmPayment]);

  const handleDelete = useCallback((row) => {
    if (!row) {
      console.error("No row data provided for edit");
      return;
    }
    setSelectPayment(row);
    setOpenDelete(true);
  }, []);

  const onConfirmDelete = useCallback(async () => {
    try {
      await deletePayment(selectPayment?.id).unwrap();
      showToast("success", "تم حذف الحجز بنجاح");
    } catch (err) {
      showToast("error", err.data.message);
    }
    setOpenDelete(false);
  }, [selectPayment?.id, deletePayment]);

  const dataInvoicePdf = useMemo(() => {
    return {
      payments: payments,
    };
  }, [payments]);

  const permissions = useMemo(() => {
    return {
      confirm: Permissions.ViewPayments,
      show: Permissions.ViewPayments,
      delete: Permissions.DeletePayments,
    };
  }, [Permissions]);

  // start box
  const dataBox = [
    {
      total_booking_amount: data?.total_booking_amount,
      total_customer_remaining: data?.total_customer_remaining,
      total_paid_received: data?.total_paid_received,
    },
  ];

  return {
    data, 
    openAdd,
    setOpenAdd,
    openViewImage,
    setOpenViewImage,
    openDelete,
    setOpenDelete,
    confirmPayment,
    isLoadingConfirm,
    selectedPayment,
    setSelectedPayment,
    payments,
    isFetchingPayments,
    paymentIsReceived,
    isFetchingPaymentsReceived,
    activeTab,
    setActiveTab,
    openConfirm,
    setOpenConfirm,
    isConfirmAction,
    setIsConfirmAction,
    selectPayment,
    setSelectPayment,
    onShow,
    onConfirmPayment,
    handleConfirm,
    deletePayment,
    isLoadingDelete,
    handleDelete,
    onConfirmDelete,
    isFetchingPaymentsNotReceived,
    paymentIsNotReceived,
    dataInvoicePdf,
    permissions,
    dataBox,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    selectedUser,
    setSelectedUser,
    selectedCustomer,
    setSelectedCustomer,
    isFetchingBox,
    // إرجاع دالة حساب الإشعارات والبيانات
    calculateBookingNotifications, // ✅ أضف هذه الدالة
    allNotifications, // ✅ إشعارات جميع البيانات
  };
};

export default useMangePayments;