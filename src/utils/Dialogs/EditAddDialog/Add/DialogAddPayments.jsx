import { useAddNewPaymentMutation } from "../../../../RtkQuery/Slice/Payments/PaymentsApi";
import { useGetBookingQuery } from "../../../../RtkQuery/Slice/Booking/BookingApi";
import DynamicDialog from "../DynamicDialog";
import * as Yup from "yup";
import { PaymentInitialValues } from "../../Data/DynamicDialogConfiguration/PaymentsDialogConfiguration/PaymentInitialValues";

// Validation schema
export const PaymentValidationSchema = Yup.object({
  paid: Yup.number()
    .required("المبلغ المدفوع مطلوب")
    .positive("المبلغ يجب أن يكون موجبًا")
    .typeError("يجب أن يكون المبلغ رقمًا"),
  payment_number: Yup.string().required("رقم الدفعة مطلوب"),
  booking_id: Yup.string().required("يجب اختيار رقم الحجز"),
  payment_image: Yup.mixed().required("صورة الدفعة مطلوبة"),
});

// Fields configuration
export const PaymentFields = [
  { name: "paid", label: "المبلغ المدفوع", type: "number" },
  { name: "payment_number", label: "رقم الدفعة", type: "text" },
  {
    name: "booking_id",
    label: "رقم الحجز",
    type: "select",
    dataKey: "reservations",
    valueKey: "id",
    displayKey: "booking_number", // Booking number display
  },
  { name: "payment_image", label: "صورة الدفعة", type: "file", accept: "image/*" },
];

export const DialogAddPayments = ({ show, handleClose }) => {
  const { data: bookingsData, isSuccess: isBookingsSuccess } = useGetBookingQuery();
  const [addPayment] = useAddNewPaymentMutation();

  // Map bookings to select data
  const selectData = {
    reservations: {
      data: bookingsData?.map((b) => ({
        id: String(b.id),
        booking_number: `رقم الحجز: ${b.id} - ${b.customer?.company_name || b.customer?.full_name || ""}`,
      })) || [],
    },
  };

  // Transform form values to FormData
  const onSubmitTransform = (values) => {
    const formData = new FormData();
    formData.append("paid", values.paid);
    formData.append("payment_number", values.payment_number);
    formData.append("booking_id", values.booking_id);
    if (values.payment_image) 
    formData.append("payment_image", values.payment_image);
    return formData;
  };

  return (

    <DynamicDialog
      show={show}
      handleClose={handleClose}
      title="إضافة دفعة"
      fields={PaymentFields}
      validationSchema={PaymentValidationSchema}
      mutationHook={() => [addPayment, { isLoading: false }]}
      initialValues={PaymentInitialValues}
      selectData={selectData}
      onSubmitTransform={onSubmitTransform}
      styles={"overflow-visible"}
    />
  );
};
