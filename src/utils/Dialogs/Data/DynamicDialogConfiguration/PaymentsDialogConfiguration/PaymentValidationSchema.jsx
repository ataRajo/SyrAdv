import * as Yup from "yup";

// رقم الدفعة لم يعد حقلًا يدويًا - يُولَّد تلقائيًا في الخادم.
export const PaymentValidationSchema = Yup.object({
  paid: Yup.number()
    .required("المبلغ المدفوع مطلوب")
    .positive("المبلغ يجب أن يكون موجبًا")
    .typeError("يجب أن يكون المبلغ رقمًا"),
  customer_id: Yup.string().required("يجب اختيار زبون"),
  payment_image: Yup.mixed().required("صورة الدفعة مطلوبة"),
});
