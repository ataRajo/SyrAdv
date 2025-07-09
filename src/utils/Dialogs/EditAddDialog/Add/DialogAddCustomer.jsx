import { useAddNewCustomerMutation } from "../../../../RtkQuery/Slice/Customers/CustomersApi";
import { CustomerFields } from "../../Data/DynamicDialogConfiguration/CustomerDialogConfiguration/CustomerFields";
import { CustomerInitialValues } from "../../Data/DynamicDialogConfiguration/CustomerDialogConfiguration/CustomerInitialValues";
import { CustomersValidationSchema } from "../../Data/DynamicDialogConfiguration/CustomerDialogConfiguration/CustomerValidationSchema";
import DynamicDialog from "../DynamicDialog";

export const DialogAddCustomer = ({ show, handleClose }) => {
  return (
    <DynamicDialog
      show={show}
      handleClose={handleClose}
      title="إضافة زبون"
      fields={CustomerFields}
      validationSchema={CustomersValidationSchema}
      mutationHook={useAddNewCustomerMutation}
      initialValues={CustomerInitialValues}
    />
  );
}; 