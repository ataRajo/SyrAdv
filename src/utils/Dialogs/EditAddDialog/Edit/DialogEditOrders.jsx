import { useUpdateOrderMutation } from "../../../../RtkQuery/Slice/Orders/OrdersApi";
import { orderFields } from "../../Data/DynamicDialogConfiguration/OrderDialogConfiguration/orderFields";
import { orderValidationSchema } from "../../Data/DynamicDialogConfiguration/OrderDialogConfiguration/orderValidationSchema";
import DynamicDialog from "../DynamicDialog";

export const DialogEditOrders = ({ show, handleClose , initData }) => {
  return (
    <DynamicDialog
      show={show}
      handleClose={handleClose}
      title="تعديل الطلب"
      fields={orderFields}
      validationSchema={orderValidationSchema}
      mutationHook={useUpdateOrderMutation}
      initialValues={initData}
      id={initData?.id}
    />
  );
};