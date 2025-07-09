import { useUpdateCustomerMutation } from "../../../../RtkQuery/Slice/Customers/CustomersApi";
import { CustomerFields } from "../../Data/DynamicDialogConfiguration/CustomerDialogConfiguration/CustomerFields";
import { CustomersValidationSchema } from "../../Data/DynamicDialogConfiguration/CustomerDialogConfiguration/CustomerValidationSchema";
import DynamicDialog from "../DynamicDialog";

export const DialogEditCustomer = ({ show, handleClose, initData }) => {
  return (
    <DynamicDialog
      show={show}
      handleClose={handleClose}
      title="تعديل زبون"
      fields={CustomerFields}
      validationSchema={CustomersValidationSchema}
      mutationHook={useUpdateCustomerMutation}
      initialValues={initData}
    />
  );
};
