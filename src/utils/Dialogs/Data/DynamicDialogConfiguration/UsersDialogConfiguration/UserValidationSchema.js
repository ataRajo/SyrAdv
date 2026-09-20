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
  department: Yup.string().required("القسم مطلوب"),
  // ✅ الراتب (طلب صريح): اختياري - خانة فارغة تعني "بلا راتب معرَّف بعد"
  // (عند الإضافة) أو "بلا تغيير على الراتب الحالي" (عند التعديل). عند
  // إدخال قيمة يجب أن تكون رقمًا موجبًا - transform يحوّل "" إلى undefined
  // كي لا يفشل الفحص العددي أمام خانة فارغة تمامًا.
  salary: Yup.number()
    .transform((value, originalValue) =>
      String(originalValue).trim() === "" ? undefined : value
    )
    .typeError("الراتب يجب أن يكون رقمًا")
    .positive("الراتب يجب أن يكون أكبر من صفر")
    .nullable(),

});