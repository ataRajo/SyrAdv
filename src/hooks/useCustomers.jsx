import { useState, useCallback } from "react";
import { showToast } from "../utils/Notifictions/showToast";
import {
  useAddDiscountMutation,
  useAddNewCustomerMutation,
  useDeleteCustomerMutation,
  useGetCustomersQuery,
  useUpdateCustomerMutation,
} from "../RtkQuery/Slice/Customers/CustomersApi";
import { useAuth } from "../Context/AuthProvider";
import { useNavigate } from "react-router";

const useCustomers = ({ id = 0, refetch = () => {} }) => {
  // State variables for dialogs and display toggles
  const [open, setOpen] = useState(false);
  const [openAddPayment, setOpenAddPayment] = useState(false);
  const [showBookings, setShowBooking] = useState(false);
  const [showPayments, setShowPayments] = useState(false);
  const [showDiscounts, setShowDiscounts] = useState(false);

  const [openViewImage, setOpenViewImage] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [openDel, setOpenDel] = useState(false);

  // State and settings for CustomerFormDialog
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  // State for AddDiscountDialog
  const [isAddDiscountDialogOpen, setIsAddDiscountDialogOpen] = useState(false);


  const navigate = useNavigate();
  const { hasPermission } = useAuth();



  const [updateCustomer, { isLoading: isUpdating }] =
    useUpdateCustomerMutation();
  const [addDiscount, { isLoading: isAddingDiscount }] =
    useAddDiscountMutation();

  const [deleteCustomer, { isLoading: isDeleting }] =
    useDeleteCustomerMutation();

  const { data: customers, isSuccess, isFetching } = useGetCustomersQuery();

  const [addNewCustomer, { isLoading: isAdding }] = useAddNewCustomerMutation();



  // Callback function on successful form submission (add/edit)
  const handleFormSuccess = useCallback(() => {
    setIsFormDialogOpen(false);
    if (id > 0) {
      showToast("success", "تم تعديل معلومات الزبون");
    } else {
      showToast("success", "تم إضافة زبون");
    }
  }, []);

  // Callback function on successful discount addition
  const handleDiscountSuccess = useCallback(() => {
    setIsAddDiscountDialogOpen(false);
    showToast("success", "تم إضافة الخصم بنجاح");
    refetch();
  }, [refetch]);

  // Handles customer deletion
  const handelDelete = useCallback(async () => {
    try {
      await deleteCustomer(id).unwrap();
      navigate("/dashboard/customers");
    } catch (error) {
      console.error("Failed to delete customer:", error);
      showToast("error", "فشل حذف الزبون");
    } finally {
      setOpenDel(false);
    }
  }, [deleteCustomer, id, navigate]);

  // Navigates to booking details page
  const onShowBookingDetails = useCallback(
    (row) => {
      navigate(`/dashboard/booking/${row?.id}`);
    },
    [navigate]
  );

  // Sets the selected payment and opens the image view
  const onShowPaymentImage = useCallback((row) => {
    setOpenViewImage(true);
    setSelectedPayment(row);
  }, []);

  const handleViewDetails = (e) => {
    e.preventDefault();
    navigate(`/dashboard/customers/${id}`);
  };


  return {
    openAddPayment,
    setOpenAddPayment,
    showBookings,
    setShowBooking,
    showPayments,
    setShowPayments,
    showDiscounts,
    setShowDiscounts,
    openViewImage,
    setOpenViewImage,
    selectedPayment,
    setSelectedPayment,
    openDel,
    setOpenDel,
    isFormDialogOpen,
    setIsFormDialogOpen,
    isAddDiscountDialogOpen,
    setIsAddDiscountDialogOpen,
    updateCustomer,
    isUpdating,
    addDiscount,
    isAddingDiscount,
    navigate,
    hasPermission,
    deleteCustomer,
    isDeleting,
    handleFormSuccess,
    handleDiscountSuccess,
    handelDelete,
    onShowBookingDetails,
    onShowPaymentImage,
    handleViewDetails,
    open,
    setOpen,
    customers,
    addNewCustomer,
    isSuccess,
    isFetching,
    isAdding,
  };
};

export default useCustomers;
