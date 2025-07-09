import * as Yup from "yup";

export const PaymentValidationSchema = Yup.object({
  paid: Yup.number()
    .required("المبلغ المدفوع مطلوب")
    .positive("المبلغ يجب أن يكون موجبًا")
    .typeError("يجب أن يكون المبلغ رقمًا"),
  payment_number: Yup.string().required("رقم الدفعة مطلوب"),
  customer_id: Yup.string().required("يجب اختيار زبون"),
  payment_image: Yup.mixed().required("صورة الدفعة مطلوبة"),
});