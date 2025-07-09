import * as Yup from "yup";

export const TemplateValidationSchema = Yup.object({
  model: Yup.string().required("حقل النموذج مطلوب"),
  type: Yup.string().required("حقل النوع مطلوب"),
  faces_number:Yup.number().required("حقل النوع مطلوب").max(2,"لا يمكن إضافة اكثر من وجهين للنموذج الواحد"),
  size: Yup.string().required("حقل الحجم مطلوب"),
  advertising_space: Yup.number()
    .typeError("يجب أن يكون حقل مساحة الإعلان رقمًا")
    .required("حقل مساحة الإعلان مطلوب"),
  printing_space: Yup.number()
    .typeError("يجب أن يكون حقل مساحة الطباعة رقمًا")
    .required("حقل مساحة الطباعة مطلوب"),
  products: Yup.array()
    .of(
      Yup.object().shape({
        price: Yup.number()
          .typeError("يجب أن يكون السعر رقمًا")
          .required("حقل السعر مطلوب"),
        type: Yup.number().required("حقل نوع المنتج مطلوب"),
      })
    )
    .length(3, "يجب إدخال أسعار لجميع أنواع المنتجات الثلاثة")
    .required("حقل أسعار المنتجات مطلوب"),
});