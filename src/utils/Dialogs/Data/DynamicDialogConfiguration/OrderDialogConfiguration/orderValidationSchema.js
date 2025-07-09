import * as Yup from "yup";

export const orderValidationSchema = Yup.object().shape({
  notes: Yup.string().nullable(),
  action_date: Yup.date()
    .required("تاريخ البدء مطلوب")
    .typeError("يرجى إدخال تاريخ صالح"),
});