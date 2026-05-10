import * as Yup from "yup";

const imageFileTest = Yup.mixed().nullable().test(
  "fileOrString",
  "Image must be jpeg, png, jpg, gif, or svg",
  function (value) {
    if (!value) return true; // no image provided is allowed
    if (typeof value === "string") return true; // existing URL when editing

    // Normalize File or FileList
    const file =
      value instanceof File
        ? value
        : value && value.length && value[0] instanceof File
        ? value[0]
        : null;

    if (!file) return false;

    const allowed = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/svg+xml",
    ];
    return allowed.includes(file.type);
  }
);

export const TemplateValidationSchema = Yup.object({
  model: Yup.string().required("حقل النموذج مطلوب"),
  type: Yup.string().required("حقل النوع مطلوب"),
  color: Yup.string().required("حقل اللون مطلوب"),
  faces_number: Yup.number()
    .required("حقل النوع مطلوب")
    .max(2, "لا يمكن إضافة اكثر من وجهين للنموذج الواحد"),
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
  image: imageFileTest,
  display_type: Yup.string().required("نوع العرض مطلوب"),

});
