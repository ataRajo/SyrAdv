export const PaymentFields = [
  {
    name: "paid",
    label: "المبلغ المدفوع",
    type: "number",
  },
  {
    name: "payment_number",
    label: "رقم الدفعة",
    type: "text",
  },
  {
    name: "customer_id",
    label: "الزبون",
    type: "select",
    dataKey: "customers",
    valueKey: "id",
    displayKey: "name",
  },
  {
    name: "payment_image",
    label: "صورة الدفعة",
    type: "file",
    accept: "image/*",
  },
];