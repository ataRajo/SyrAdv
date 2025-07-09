import { useUpdataTemplateMutation } from "../../../../RtkQuery/Slice/Template/TemplateApi";
import { TemplateFields } from "../../Data/DynamicDialogConfiguration/TamplateDialogConfiguration/FieldsTamplate";
import { TemplateValidationSchema } from "../../Data/DynamicDialogConfiguration/TamplateDialogConfiguration/TemplateValidationSchema";
import DynamicDialog from "../DynamicDialog";

export const DialogEditTemplate = ({ show, handleClose, initData }) => {
  return (
    <>
      <DynamicDialog
        show={show}
        handleClose={handleClose}
        title="تعديل النموذج"
        fields={TemplateFields}
        validationSchema={TemplateValidationSchema}
        mutationHook={useUpdataTemplateMutation}
        initialValues={initData}
        id={initData?.id}
      />
    </>
  );
};
