import {  useUpdataBrokerMutation } from "../../../../RtkQuery/Slice/Brokers/BrokersApi";
import { BrokerFields } from "../../Data/DynamicDialogConfiguration/BrokerDialogConfiguration/BrokerFields";
import { BrokerValidationSchema } from "../../Data/DynamicDialogConfiguration/BrokerDialogConfiguration/BrokerValidationSchema";
import DynamicDialog from "../DynamicDialog";

export const DialogEditBroker = ({ show, handleClose , initData }) => {
  return (
    <DynamicDialog
      show={show}
      handleClose={handleClose}
      title="تعديل وسيط"
      fields={BrokerFields}
      validationSchema={BrokerValidationSchema}
      mutationHook={useUpdataBrokerMutation}
      initialValues={initData}
      id={initData.id}

    />
  );
};