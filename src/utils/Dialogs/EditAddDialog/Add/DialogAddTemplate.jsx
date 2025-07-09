import { useCreateTemplateMutation } from "../../../../RtkQuery/Slice/Template/TemplateApi";
import { TemplateFields } from "../../Data/DynamicDialogConfiguration/TamplateDialogConfiguration/FieldsTamplate";
import { TemplateInitialValues } from "../../Data/DynamicDialogConfiguration/TamplateDialogConfiguration/InitialValuesTemplate";
import { TemplateValidationSchema } from "../../Data/DynamicDialogConfiguration/TamplateDialogConfiguration/TemplateValidationSchema";
import DynamicDialog from "../DynamicDialog";

export const DialogAddTemplate = ({ show, handleClose }) => {
  return (
    <DynamicDialog
      show={show}
      handleClose={handleClose}
      title="إضافة نموذج"
      fields={TemplateFields}
      validationSchema={TemplateValidationSchema}
      mutationHook={useCreateTemplateMutation}
      initialValues={TemplateInitialValues}
    />
  );
}; 