import { useAddNewPaymentMutation } from "../../../../RtkQuery/Slice/Payments/PaymentsApi";
import DynamicDialog from "../DynamicDialog";
import * as Yup from "yup";
import { useState } from "react";
import { PaymentInitialValues } from "../../Data/DynamicDialogConfiguration/PaymentsDialogConfiguration/PaymentInitialValues";

// رقم الدفعة يُولَّد تلقائيًا في الخادم (PaymentService::nextPaymentNumber).
export const PaymentValidationSchema = Yup.object({
  customer_id: Yup.string().required("يجب اختيار العميل أولاً"),
  paid: Yup.number()
    .required("المبلغ المدفوع مطلوب")
    .positive("المبلغ يجب أن يكون موجبًا")
    .typeError("يجب أن يكون المبلغ رقمًا"),
  payment_image: Yup.mixed().required("صورة الدفعة مطلوبة"),
  documentation_image: Yup.mixed().nullable(),
  voucher_reason: Yup.string().max(500, "النص طويل جدًا (500 حرف كحد أقصى)").nullable(),
});

// اختيار الزبون ببحث من الخادم + تمرير لا نهائي (customer-search) بدل قائمة
// مرقَّمة بـ 20 زبونًا في الصفحة، وبدل جلب كل الحجوزات لحساب المتبقي - الرصيد
// المتبقي يأتي مباشرة مع الزبون من الخادم.
export const PaymentFields = [
  {
    name: "customer_id",
    label: "اختر العميل",
    type: "customer-search",
    showRemaining: true,
  },
  {
    name: "paid",
    label: "المبلغ المدفوع",
    type: "number",
  },
  { name: "payment_image", label: "صورة الدفعة", type: "file", accept: "image/*" },
  {
    // توثيق الدفعة (اختياري هنا): بدونه تبقى الدفعة "بانتظار التوثيق" ولا
    // تُخصم من رصيد الزبون ولا تُرحَّل على الحسابات حتى تُوثَّق لاحقًا.
    name: "documentation_image",
    label: "صورة سند القبض الموقَّع (توثيق - اختياري)",
    type: "file",
    accept: "image/*",
  },
  {
    // نص السند الديناميكي (طلب صريح): سطر "و ذلك عن" في سند/إيصال الدفعة -
    // يُملأ من الأدمن. فارغ = النص الافتراضي ("دفعة على الحساب"...). يمكن
    // تعديله لاحقًا أيضًا من شاشة السند نفسها قبل الطباعة.
    name: "voucher_reason",
    label: "و ذلك عن (نص السند - اختياري)",
    type: "text",
    dir: "rtl",
  },
];

export const DialogAddPayments = ({ show, handleClose }) => {
  const [addPayment] = useAddNewPaymentMutation();
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const customerRemaining = Number(selectedCustomer?.remaining) || 0;

  const handleFieldChange = (fieldName, value, customer) => {
    if (fieldName === "customer_id") {
      setSelectedCustomer(value ? customer || null : null);
    }
  };

  const renderCustomFields = (formik) => {
    if (!selectedCustomer) return null;
    const paid = Number(formik.values.paid) || 0;
    const after = customerRemaining - paid;

    return (
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 space-y-2">
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-700 dark:text-gray-300">إجمالي المبلغ المتبقي للعميل:</span>
          <span className="font-bold text-lg text-blue-700 dark:text-blue-300">{customerRemaining.toFixed(2)} $</span>
        </div>
        {paid > 0 && (
          <div className="pt-2 border-t border-blue-300 dark:border-blue-700 flex justify-between text-sm">
            <span>المبلغ بعد الدفع:</span>
            <span className={`font-bold ${after <= 0 ? "text-green-600" : "text-orange-600"}`}>{after.toFixed(2)} $</span>
          </div>
        )}
        {!formik.values.documentation_image && (
          <p className="text-xs text-amber-700 dark:text-amber-400">
            ⚠️ بدون صورة سند القبض الموقَّع ستُحفَظ الدفعة "بانتظار التوثيق" ولن تُخصم من رصيد العميل أو تُرحَّل على الحسابات حتى تُوثَّق.
          </p>
        )}
      </div>
    );
  };

  const onSubmitTransform = (values) => {
    const formData = new FormData();
    formData.append("paid", values.paid);
    formData.append("customer_id", values.customer_id);
    if (values.payment_image) formData.append("payment_image", values.payment_image);
    if (values.documentation_image) formData.append("documentation_image", values.documentation_image);
    if (values.voucher_reason?.trim()) formData.append("voucher_reason", values.voucher_reason.trim());
    return formData;
  };

  const handleDialogClose = () => {
    setSelectedCustomer(null);
    handleClose();
  };

  return (
    <DynamicDialog
      show={show}
      handleClose={handleDialogClose}
      title="إضافة دفعة للعميل"
      fields={PaymentFields}
      validationSchema={PaymentValidationSchema}
      mutationHook={() => [addPayment, { isLoading: false }]}
      initialValues={{
        ...PaymentInitialValues,
        customer_id: "",
        paid: "",
        documentation_image: null,
        voucher_reason: "",
      }}
      onSubmitTransform={onSubmitTransform}
      styles={"overflow-visible"}
      onFieldChange={handleFieldChange}
      renderCustomFields={renderCustomFields}
      submitButtonText="إضافة الدفعة"
    />
  );
};
