// src/utils/Dialogs/AddDiscount/AddDiscountDialog.jsx
import React, { useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Toaster } from "react-hot-toast";
import { showToast } from "../../utils/Notifictions/showToast";

const AddDiscountDialog = ({
  open,
  onOpenChange,
  customerId,  
  onSuccess,  
  addDiscountMutation,  
  isAdding,  
  remainingBalance,  
}) => {
  const formik = useFormik({
    initialValues: {
      value: "",  
      discount_type: "1",  
      customer_id: customerId,
    },
    validationSchema: Yup.object({
      value: Yup.number()
        .typeError("الرجاء إدخال قيمة رقمية صحيحة.")
        .required("قيمة الخصم مطلوبة.")
        .when("discount_type", {
          is: "1", // Fixed amount
          then: (schema) =>
            schema
              .positive("قيمة الخصم يجب أن تكون أكبر من صفر.")
              .max(
                remainingBalance,
                `قيمة الخصم لا يمكن أن تتجاوز الرصيد المتبقي: ${remainingBalance} $`
              ),
          otherwise: (schema) =>
            schema
              .min(0, "النسبة المئوية يجب أن تكون بين 0 و 100.")
              .max(100, "النسبة المئوية لا يمكن أن تتجاوز 100%.")
        }),
      discount_type: Yup.string().required("نوع الخصم مطلوب."),
    }),
    onSubmit: async (values) => {
      const payload = {
        customer_id: values.customer_id,
        value: parseFloat(values.value), // Ensure value is a number
        discount_type: parseInt(values.discount_type), // Ensure type is an integer
      };

      try {
        await addDiscountMutation(payload).unwrap();
        showToast("success", "تم إضافة الخصم بنجاح.");
        onSuccess(); // Close dialog and trigger refetch or state update
      } catch (error) {
        console.error("فشل إضافة الخصم:", error);
        showToast("error", "فشل إضافة الخصم: " + (error?.data?.message || "خطأ غير معروف"));
      }
    },
  });

  // Reset form when dialog opens or customerId changes
  useEffect(() => {
    if (open) {
      formik.setValues({
        value: "",
        discount_type: "1",
        customer_id: customerId,
      });
      formik.resetForm(); // Reset touched and errors
    }
  }, [open, customerId]); // Add customerId to dependencies

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`sm:max-w-[425px] dialog-content p-6`}
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-bold">
            إضافة خصم للزبون
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={formik.handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="discount_type" className="mb-2 block">
              نوع الخصم:
            </Label>
            <RadioGroup
              dir="rtl"
              onValueChange={(value) => {
                formik.setFieldValue("discount_type", value);
                // Clear value and re-validate when discount type changes
                formik.setFieldValue("value", "");
                formik.setFieldTouched("value", false);
              }}
              value={formik.values.discount_type}
              className="flex items-center gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1" id="fixed" />
                <Label htmlFor="fixed">قيمة ثابتة ($)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="2" id="percentage" />
                <Label htmlFor="percentage">نسبة مئوية (%)</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="value">
              قيمة الخصم (
              {formik.values.discount_type === "1" ? "$" : "%"}):
            </Label>
            <Input
              id="value"
              type="number"
              name="value"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.value}
              className="mt-1"
            />
            {formik.touched.value && formik.errors.value ? (
              <div className="text-red-500 text-sm mt-1">
                {formik.errors.value}
              </div>
            ) : null}
          </div>

          <DialogFooter className="flex justify-end gap-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={isAdding}>
              {isAdding ? "جاري الإضافة..." : "إضافة الخصم"}
            </Button>
          </DialogFooter>
        </form>
        <Toaster />
      </DialogContent>
    </Dialog>
  );
};

export default AddDiscountDialog;