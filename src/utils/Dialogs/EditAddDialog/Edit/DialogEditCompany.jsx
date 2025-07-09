import { useUpdateCompanyMutation } from "../../../../RtkQuery/Slice/Auth/AuthApi";
import { CompanyFields } from "../../Data/DynamicDialogConfiguration/CompanyDialogConfiguration/CompanyFields";
import { CompanyValidationSchema } from "../../Data/DynamicDialogConfiguration/CompanyDialogConfiguration/CompanyValidationSchema";
import DynamicDialog from "../DynamicDialog";

const DialogEditCompany = ({ show, handleClose, initData }) => {
  return (
    <>
      <DynamicDialog
        show={show}
        handleClose={handleClose}
        title="تعديل معلومات الشركة "
        fields={CompanyFields}
        validationSchema={CompanyValidationSchema}
        mutationHook={useUpdateCompanyMutation}
        initialValues={initData}
      />
    </>
  );
};

export default DialogEditCompany;
