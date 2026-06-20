import { useAddNewPaymentMutation } from "../../../../RtkQuery/Slice/Payments/PaymentsApi";
import { useGetBookingQuery } from "../../../../RtkQuery/Slice/Booking/BookingApi";
import { useGetCustomersQuery } from "../../../../RtkQuery/Slice/Customers/CustomersApi";
import DynamicDialog from "../DynamicDialog";
import * as Yup from "yup";
import { useState, useEffect, useCallback } from "react";
import { PaymentInitialValues } from "../../Data/DynamicDialogConfiguration/PaymentsDialogConfiguration/PaymentInitialValues";
import Select from "react-select";

// Update validation schema
export const PaymentValidationSchema = Yup.object({
  customer_id: Yup.string().required("يجب اختيار العميل أولاً"),
  paid: Yup.number()
    .required("المبلغ المدفوع مطلوب")
    .positive("المبلغ يجب أن يكون موجبًا")
    .typeError("يجب أن يكون المبلغ رقمًا"),
  payment_number: Yup.string().required("رقم الدفعة مطلوب"),
  payment_image: Yup.mixed().required("صورة الدفعة مطلوبة"),
});

// Updated fields configuration - keep customer_id field but we'll handle it differently
export const PaymentFields = [
  {
    name: "customer_id",
    label: "اختر العميل",
    type: "select",
    dataKey: "customers",
    valueKey: "id",
    displayKey: "company_name",
  },
  { 
    name: "paid", 
    label: "المبلغ المدفوع", 
    type: "number",
  },
  { name: "payment_number", label: "رقم الدفعة", type: "text" },
  { name: "payment_image", label: "صورة الدفعة", type: "file", accept: "image/*" },
];

export const DialogAddPayments = ({ show, handleClose }) => {
  const [page, setPage] = useState(1);
  
  const { data: bookingsResponse } = useGetBookingQuery();
  const { data: customersResponse, isSuccess: isCustomersSuccess, isLoading: isCustomersLoading } = useGetCustomersQuery({
    page: page,
    per_page: 20,
  });

  const bookingsData = bookingsResponse?.data || [];
  const customersData = customersResponse?.data || [];
  const [addPayment] = useAddNewPaymentMutation();
  
  const [customerTotalRemaining, setCustomerTotalRemaining] = useState(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  const customersWithTotals = Array.isArray(customersData) ? customersData.map(customer => {
    let totalRemaining = 0;
    
    if (bookingsData) {
      const customerBookings = bookingsData.filter(
        booking => String(booking.customer_id) === String(customer.id) && booking.type === 2
      );
      
      customerBookings.forEach(booking => {
        const paid = booking.paid_amount || 0;
        const total = booking.total_price || 0;
        const remaining = total - paid;
        if (remaining > 0) {
          totalRemaining += remaining;
        }
      });
    }
    
    return {
      ...customer,
      id: String(customer.id),
      company_name: customer.company_name || customer.full_name || `زبون #${customer.id}`,
      total_remaining: totalRemaining,
    };
  }) : [];

  const selectData = {
    customers: {
      data: customersWithTotals.map(customer => ({
        id: customer.id,
        company_name: `${customer.company_name}`, 
        total_remaining: customer.total_remaining,
      })),
      // PAGINATION DATA - This is the key addition
      pagination: {
        currentPage: customersResponse?.current_page || 1,
        totalPages: customersResponse?.last_page || 1,
        hasNextPage: customersResponse?.current_page < customersResponse?.last_page,
        hasPrevPage: customersResponse?.current_page > 1,
        onPageChange: (newPage) => {
          if (newPage >= 1 && newPage <= (customersResponse?.last_page || 1)) {
            setPage(newPage);
          }
        },
      },
    },
  };

  const handleFieldChange = (fieldName, value) => {
    if (fieldName === "customer_id") {
      setSelectedCustomerId(value);
      
      const selectedCustomer = customersWithTotals.find(
        customer => String(customer.id) === String(value)
      );
      
      if (selectedCustomer) {
        setCustomerTotalRemaining(selectedCustomer.total_remaining);
      } else {
        setCustomerTotalRemaining(0);
      }
    }
  };

  const renderCustomFields = (formik) => {
    if (!selectedCustomerId) return null;
    
    return (
      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-700">إجمالي المبلغ المتبقي للعميل:</span>
          <span className="font-bold text-lg text-blue-700">
            {customerTotalRemaining.toFixed(2)} $
          </span>
        </div>
        {formik.values.paid > 0 && (
          <div className="mt-2 pt-2 border-t border-blue-300">
            <div className="flex justify-between text-sm">
              <span>المبلغ بعد الدفع:</span>
              <span className={`font-bold ${(customerTotalRemaining - formik.values.paid) <= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                {(customerTotalRemaining - formik.values.paid).toFixed(2)} $
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const onSubmitTransform = (values) => {
    const formData = new FormData();
    formData.append("paid", values.paid);
    formData.append("payment_number", values.payment_number);
    formData.append("customer_id", values.customer_id);
    if (values.payment_image) 
      formData.append("payment_image", values.payment_image);
    return formData;
  };

  const handleDialogClose = () => {
    setCustomerTotalRemaining(0);
    setSelectedCustomerId(null);
    setPage(1); // Reset to page 1 when closing
    handleClose();
  };

  const customValidation = (values) => {
    const errors = {};
    
    if (selectedCustomerId && values.paid > 0) {
      if (values.paid > customerTotalRemaining) {
        errors.paid = "المبلغ المدفوع أكبر من المبلغ المتبقي";
      }
    }
    
    return errors;
  };

  return (
    <DynamicDialog
      show={show}
      handleClose={handleDialogClose}
      title="إضافة دفعة للعميل"
      fields={PaymentFields}
      validationSchema={PaymentValidationSchema}
      mutationHook={() => [addPayment, { isLoading: false }]}
      initialValues={{ 
        ...PaymentInitialValues, 
        customer_id: "", 
        paid: "" 
      }}
      selectData={selectData}
      onSubmitTransform={onSubmitTransform}
      styles={"overflow-visible"}
      onFieldChange={handleFieldChange}
      renderCustomFields={renderCustomFields}
      customValidation={customValidation}
      submitButtonText="إضافة الدفعة"
    />
  );
};