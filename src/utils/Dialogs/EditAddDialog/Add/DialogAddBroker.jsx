import { useAddNewBrokerMutation } from "../../../../RtkQuery/Slice/Brokers/BrokersApi";
import { BrokerFields } from "../../Data/DynamicDialogConfiguration/BrokerDialogConfiguration/BrokerFields";
import { BrokerInitialValues } from "../../Data/DynamicDialogConfiguration/BrokerDialogConfiguration/BrokerInitialValues";
import { BrokerValidationSchema } from "../../Data/DynamicDialogConfiguration/BrokerDialogConfiguration/BrokerValidationSchema";
import DynamicDialog from "../DynamicDialog";

export const DialogAddBroker = ({ show, handleClose }) => {
  return (
    <DynamicDialog
      show={show}
      handleClose={handleClose}
      title="إضافة وسيط"
      fields={BrokerFields}
      validationSchema={BrokerValidationSchema}
      mutationHook={useAddNewBrokerMutation}
      initialValues={BrokerInitialValues}
    />
  );
};