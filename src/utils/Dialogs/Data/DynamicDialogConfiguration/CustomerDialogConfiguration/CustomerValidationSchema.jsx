import * as Yup from "yup";

export const CustomersValidationSchema = Yup.object({
  full_name: Yup.string().required("الأسم مطلوب"),
  company_name: Yup.string().required("أسم الشركة مطلوب"),
  address: Yup.string().required("العنوان مطلوب"),
  phone_number: Yup.number().required("رقم الهاتف"),
  commercial_registration_number: Yup.number(),
  
    // .test(
    //   "len",
    //   "يجب أن يتكون رقم السجل التجاري من 4 أرقام فقط",
    //   (val) => val && val.toString().length === 4
    // ),
});