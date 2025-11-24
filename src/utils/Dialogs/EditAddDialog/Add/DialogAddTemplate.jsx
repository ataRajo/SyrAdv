import { useCreateTemplateMutation } from "../../../../RtkQuery/Slice/Template/TemplateApi";
import { TemplateFields } from "../../Data/DynamicDialogConfiguration/TamplateDialogConfiguration/FieldsTamplate";
import { TemplateInitialValues } from "../../Data/DynamicDialogConfiguration/TamplateDialogConfiguration/InitialValuesTemplate";
import { TemplateValidationSchema } from "../../Data/DynamicDialogConfiguration/TamplateDialogConfiguration/TemplateValidationSchema";
import DynamicDialog from "../DynamicDialog";

export const DialogAddTemplate = ({ show, handleClose }) => {
  const [createTemplate, { isLoading, isError, error }] = useCreateTemplateMutation();

const handleSubmit = async (values) => {
    try {
      const formData = onSubmitTransform(values);
      const result = await createTemplate(formData).unwrap();
      
      // Force refetch templates list after successful creation
      // You might need to invalidate tags here
      
      handleClose(); // Close dialog on success
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };



  const onSubmitTransform = (values) => {
     console.log('🎯 Form submitted with values:', values);
    const formData = new FormData();
    formData.append("model", values.model);
    formData.append("size", values.size);
    formData.append("faces_number", values.faces_number);
    formData.append("advertising_space", values.advertising_space);
    formData.append("printing_space", values.printing_space);
    formData.append("type", values.type);
    formData.append("color", values.color);

    values?.products?.forEach((product, index) => {
      formData.append(`products[${index}][price]`, product?.price);
      formData.append(`products[${index}][type]`, product?.type);
    });

    if (values.image) formData.append("image", values.image);

    return formData;
  };

  return (
    <DynamicDialog
      show={show}
      handleClose={handleClose}
      title="إضافة نموذج"
      fields={TemplateFields}
      validationSchema={TemplateValidationSchema}
      mutationHook={useCreateTemplateMutation}
      initialValues={TemplateInitialValues}
      onSubmitTransform={onSubmitTransform}
      isLoading={isLoading}
    />
  );
};
