import * as Yup from "yup";

export const BrokerValidationSchema = Yup.object({
  username: Yup.string().required("اسم المستخدم مطلوب"),
  phone_number: Yup.number().required("رقم الهاتف مطلوب"),
  password:Yup.string().required(" كلمة السر مطلوبة"),
  email: Yup.string().required("البريد الالكتروني مطلوب"),
  discount: Yup.string().required("هذا الحقل مطلوب"),

});