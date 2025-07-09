import * as Yup from "yup";

export const userValidationSchema = Yup.object({
  id: Yup.string(),
  full_name: Yup.string().required("الاسم الكامل مطلوب"),
  username: Yup.string().required("اسم المستخدم مطلوب"),
  password: Yup.string()
    .min(6, "يجب أن تكون كلمة السر 6 أحرف على الأقل")
    .required("كلمة السر مطلوبة"),
  phone_number: Yup.string()
    .matches(/^\d+$/, "يجب أن يحتوي على أرقام فقط")
    .required("رقم الهاتف مطلوب"),
  address: Yup.string().required("العنوان مطلوب").nullable(),
  email: Yup.string()
    .email("البريد الإلكتروني غير صالح")
    .required("البريد الإلكتروني مطلوب"),
  roles: Yup.string().required("الدور مطلوب"),
});