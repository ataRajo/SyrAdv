import { useAddNewPaymentMutation } from "../../../../RtkQuery/Slice/Payments/PaymentsApi";
import { useGetCustomersQuery } from "../../../../RtkQuery/Slice/Customers/CustomersApi";
import { PaymentFields } from "../../Data/DynamicDialogConfiguration/PaymentsDialogConfiguration/PaymentFields";
import { PaymentInitialValues } from "../../Data/DynamicDialogConfiguration/PaymentsDialogConfiguration/PaymentInitialValues";
import { PaymentValidationSchema } from "../../Data/DynamicDialogConfiguration/PaymentsDialogConfiguration/PaymentValidationSchema";
import DynamicDialog from "../DynamicDialog";

export const DialogAddPayments = ({ show, handleClose, id }) => {
  const { data: customersData, isSuccess: isCustomersSuccess } = useGetCustomersQuery();

  // Find the customer only if id is provided and data is available
  const customer = isCustomersSuccess && id
    ? customersData?.find((customer) => String(customer.id) === String(id))
    : undefined;

  // Prepare selectData based on whether an ID is provided
  const selectData = {
    customers: {
      data: [], // Initialize with an empty array
    },
  };

  if (isCustomersSuccess && customersData) {
    if (id && customer) {
      // If an ID is provided and a customer is found, use only that customer
      selectData.customers.data = [
        {
          id: String(customer.id),
          name: customer.company_name,
        },
      ];
    } else if (!id) {
      // If no ID is provided, map all customers
      selectData.customers.data = customersData.map((customer) => ({
        id: String(customer.id),
        name: customer.company_name,
      }));
    }
  }

  const onSubmitTransform = (values) => {
    const formData = new FormData();
    formData.append("paid", values.paid);
    formData.append("payment_number", values.payment_number);
    formData.append("customer_id", values.customer_id);
    if (values.payment_image) {
      formData.append("payment_image", values.payment_image);
    }
    return formData;
  };

  return (
    <DynamicDialog
      show={show}
      handleClose={handleClose}
      title="إضافة دفعة"
      fields={PaymentFields}
      validationSchema={PaymentValidationSchema}
      mutationHook={useAddNewPaymentMutation}
      initialValues={PaymentInitialValues}
      selectData={selectData}
      onSubmitTransform={onSubmitTransform}
      styles={"overflow-visible"}
    />
  );
};