import * as Yup from "yup";

export const ProfileValidationSchema = Yup.object({
  full_name: Yup.string()
    .required("حقل الاسم الكامل مطلوب")
    .min(3, "يجب أن يكون الاسم الكامل على الأقل 3 أحرف"),
  
  username: Yup.string()
    .required("حقل اسم المستخدم مطلوب")
    .min(3, "يجب أن يكون اسم المستخدم على الأقل 3 أحرف"),
  
  phone_number: Yup.string()
    .required("حقل رقم الهاتف مطلوب")
    .matches(/^[0-9]+$/, "يجب أن يحتوي رقم الهاتف على أرقام فقط")
    .min(10, "يجب أن يكون رقم الهاتف على الأقل 10 أرقام"),
  
  address: Yup.string()
    .required("حقل العنوان مطلوب")
    .min(3, "يجب أن يكون العنوان على الأقل 3 أحرف"),
  
  email: Yup.string()
    .required("حقل البريد الإلكتروني مطلوب")
    .email("البريد الإلكتروني غير صالح"),
  
  password: Yup.string()
    .required("حقل كلمة المرور مطلوب")
    .min(6, "يجب أن تكون كلمة المرور على الأقل 6 أحرف")
});