import * as Yup from "yup";

export const BrokerValidationSchema = Yup.object({
  full_name: Yup.string().required("الأسم مطلوب"),
  number: Yup.number().required("رقم الهاتف مطلوب"),
  discount: Yup.string().required("هذا الحقل مطلوب"),

});