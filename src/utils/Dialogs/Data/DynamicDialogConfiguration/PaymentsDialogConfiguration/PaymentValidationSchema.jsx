import * as Yup from "yup";

export const PaymentValidationSchema = Yup.object({
  paid: Yup.number()
    .required("المبلغ المدفوع مطلوب")
    .positive("المبلغ يجب أن يكون موجبًا")
    .typeError("يجب أن يكون المبلغ رقمًا"),
    .test("max-paid", "لا يمكن أن يتجاوز المبلغ الرصيد المتبقي", function (value) {
    const { booking_id } = this.parent;
    const selectedBooking = bookingsData?.find((b) => String(b.id) === booking_id);
    return !selectedBooking || value <= selectedBooking.remaining_amount;
    }) ,
  payment_number: Yup.string().required("رقم الدفعة مطلوب"),
  customer_id: Yup.string().required("يجب اختيار زبون"),
  payment_image: Yup.mixed().required("صورة الدفعة مطلوبة"),
  booking_id: Yup.string().required("يجب اختيار رقم الحجز")
});