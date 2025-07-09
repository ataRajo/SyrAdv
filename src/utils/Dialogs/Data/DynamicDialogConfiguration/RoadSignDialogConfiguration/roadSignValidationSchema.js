import * as Yup from "yup";

export const roadSignValidationSchema1 = Yup.object({
  city_id: Yup.number().required("المدينة مطلوبة"),
  region_id: Yup.number().required("المنطقة مطلوبة"),
  place: Yup.string().required("مكان التموضع مطلوب"),
  direction_one: Yup.string().required("الاتجاه مطلوب"),
  panels_number: Yup.number()
    .required("عدد اللوحات مطلوب")
    .min(0, "يجب أن يكون عدد اللوحات أكبر من 0"),
  template_id: Yup.number().required("نوع المنتج مطلوب"),
});


export const roadSignValidationSchema2 = Yup.object({
  city_id: Yup.number().required("المدينة مطلوبة"),
  region_id: Yup.number().required("المنطقة مطلوبة"),
  place: Yup.string().required("مكان التموضع مطلوب"),
  direction_one: Yup.string().required("الاتجاه مطلوب"),
  direction_two: Yup.string().required("الاتجاه مطلوب"),
  panels_number: Yup.number()
    .required("عدد اللوحات مطلوب")
    .min(0, "يجب أن يكون عدد اللوحات أكبر من 0"),
  template_id: Yup.number().required("نوع المنتج مطلوب"),
});


export const roadSignValidationSchemaEdit = Yup.object({
  city_id: Yup.number().required("المدينة مطلوبة"),
  region_id: Yup.number().required("المنطقة مطلوبة"),
  place: Yup.string().required("مكان التموضع مطلوب"),
  directions: Yup.string().required("الاتجاه مطلوب"),
  panels_number: Yup.number()
    .required("عدد اللوحات مطلوب")
    .min(0, "يجب أن يكون عدد اللوحات أكبر من 0"),
  // template_id: Yup.number().required("نوع المنتج مطلوب"),
});