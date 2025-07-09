import React, { useCallback, useMemo, useState } from "react";

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

  const [confirmPayment, { isLoading: isLoadingConfirm }] =
    useConfirmOnePaymentMutation();
  const [selectedPayment, setSelectedPayment] = useState(null);
  const { data: payments, isFetching: isFetchingPayments } =
    useGetPaymentsQuery();
  const {
    data: paymentIsNotReceived,
    isFetching: isFetchingPaymentsNotReceived,
  } = useGetPaymentsQuery({ is_received: false });
  const { data: paymentIsReceived, isFetching: isFetchingPaymentsReceived } =
    useGetPaymentsQuery({ is_received: true });
  const [deletePayment, { isLoading: isLoadingDelete }] =
    useDeletePaymentMutation();

  // box query
  const { data, isFetching: isFetchingBox } = useGetTotalPaymentAndRemainingQuery(
    {
      from_date: fromDate,
      to_date: toDate,
    }
  );

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
    isFetchingBox,
  };
};

export default useMangePayments;
