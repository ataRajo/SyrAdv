import React from "react";
import { useUpdataTemplateMutation } from "../../../../RtkQuery/Slice/Template/TemplateApi";
import { TemplateFields } from "../../Data/DynamicDialogConfiguration/TamplateDialogConfiguration/FieldsTamplate";
import { TemplateValidationSchema } from "../../Data/DynamicDialogConfiguration/TamplateDialogConfiguration/TemplateValidationSchema";
import DynamicDialog from "../DynamicDialog";

export const DialogEditTemplate = ({ show, handleClose, initData }) => {
  const handleSubmitTransform = (values) => {
    const data = { ...values };
    delete data.created_at;
    delete data.updated_at;

    // Normalize files: support File or FileList
    const imageFile =
      data.image instanceof File
        ? data.image
        : data.image && data.image[0] instanceof File
        ? data.image[0]
        : null;

    const svgFile =
      data.image_on_map instanceof File
        ? data.image_on_map
        : data.image_on_map && data.image_on_map[0] instanceof File
        ? data.image_on_map[0]
        : null;

    // If no new files: remove images when they're URLs or falsy so backend keeps existing images
    if (!imageFile && !svgFile) {
      if (typeof data.image === "string" || data.image == null || data.image === "") {
        delete data.image;
      }
      if (typeof data.image_on_map === "string" || data.image_on_map == null || data.image_on_map === "") {
        delete data.image_on_map;
      }
      return data; // send JSON payload (no image change)
    }

    // Build FormData when a real file exists
    const formData = new FormData();

    // Append simple fields (not image/image_on_map)
    Object.entries(data).forEach(([key, value]) => {
      if (key === "image" || key === "image_on_map" || value === undefined) return;
      // Handle products array explicitly so Laravel receives real array fields
      if (key === "products" && Array.isArray(value)) {
        value.forEach((item, i) => {
          Object.entries(item || {}).forEach(([prop, val]) => {
            formData.append(`products[${i}][${prop}]`, val == null ? "" : String(val));
          });
        });
        return;
      }

      // For other objects/arrays, stringify
      if (typeof value === "object") {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    });

    // Append the image file if exists
    if (imageFile) {
      formData.append("image", imageFile);
    }

    // Append the SVG file if exists
    if (svgFile) {
      formData.append("image_on_map", svgFile);
    }

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