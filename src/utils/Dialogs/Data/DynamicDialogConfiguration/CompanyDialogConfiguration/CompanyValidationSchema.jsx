import * as Yup from "yup";

export const CompanyValidationSchema = Yup.object({
  name: Yup.string()
    .required("حقل اسم الشركة مطلوب")
    .min(3, "يجب أن يكون اسم الشركة على الأقل 3 أحرف"),

  description: Yup.string().required("حقل الوصف مطلوب"),

  about_us: Yup.string().required("حقل عنا مطلوب"),

  contract_note: Yup.string().required("حقل معلومات العقد مطلوب"),

  commercial_registration_number: Yup.string()
    .required("حقل رقم السجل التجاري مطلوب")
    .matches(/^[0-9]+$/, "يجب أن يحتوي رقم السجل التجاري على أرقام فقط"),
  // .min(10, "يجب أن يكون رقم الهاتف على الأقل 10 أرقام"),
  address: Yup.string()
    .required("حقل العنوان مطلوب")
    .min(3, "يجب أن يكون العنوان على الأقل 3 أحرف"),
});
