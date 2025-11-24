import React from "react";
import { useUpdataTemplateMutation } from "../../../../RtkQuery/Slice/Template/TemplateApi";
import { TemplateFields } from "../../Data/DynamicDialogConfiguration/TamplateDialogConfiguration/FieldsTamplate";
import { TemplateValidationSchema } from "../../Data/DynamicDialogConfiguration/TamplateDialogConfiguration/TemplateValidationSchema";
import DynamicDialog from "../DynamicDialog";

export const DialogEditTemplate = ({ show, handleClose, initData }) => {
  // Transform values before sending:
  // - remove timestamps
  // - if image is unchanged (string or null) remove it
  // - if image is a File or FileList, build and return FormData
const handleSubmitTransform = (values) => {
  const data = { ...values };
  delete data.created_at;
  delete data.updated_at;

  // Normalize file: support File or FileList
  const file =
    data.image instanceof File
      ? data.image
      : data.image && data.image[0] instanceof File
      ? data.image[0]
      : null;

  // If no new file: remove image when it's a URL or falsy so backend keeps existing image
  if (!file) {
    if (typeof data.image === "string" || data.image == null || data.image === "") {
      delete data.image;
    }
    return data; // send JSON payload (no image change)
  }

  // Build FormData only when a real file exists
  const formData = new FormData();

  // Append simple fields (not image)
  Object.entries(data).forEach(([key, value]) => {
    if (key === "image" || value === undefined) return;
    // Handle products array explicitly so Laravel receives real array fields
    if (key === "products" && Array.isArray(value)) {
      value.forEach((item, i) => {
        // append each property of product as products[i][prop]
        Object.entries(item || {}).forEach(([prop, val]) => {
          formData.append(`products[${i}][${prop}]`, val == null ? "" : String(val));
        });
      });
      return;
    }

    // For other objects/arrays, stringify (or adapt if backend expects bracketed keys)
    if (typeof value === "object") {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, String(value));
    }
  });

  // Append the file
  formData.append("image", file);

  // If your API requires PUT via POST, uncomment:
  // formData.append("_method", "PUT");

  return formData;
};


  return (
    <DynamicDialog
      show={show}
      handleClose={handleClose}
      title="تعديل النموذج"
      fields={TemplateFields}
      validationSchema={TemplateValidationSchema}
      mutationHook={useUpdataTemplateMutation}
      initialValues={initData}
      id={initData?.id}
      onSubmitTransform={handleSubmitTransform}
    />
  );
};

export default DialogEditTemplate;
