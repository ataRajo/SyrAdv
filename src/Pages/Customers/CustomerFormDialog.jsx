// src/components/CustomerFormDialog.jsx
import React, { useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Trash2, PlusCircle } from 'lucide-react';
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
import { Checkbox } from "@/components/ui/checkbox";
import { showToast } from "../../utils/Notifictions/showToast";
import { Toaster } from "react-hot-toast";

const CustomerFormDialog = ({
  open,
  onOpenChange,
  initialData, 
  onSuccess,    
  addNewCustomerMutation, 
  updateCustomerMutation, 
  isAdding,     
  isUpdating,  
}) => {
  const isEditMode = !!initialData?.id; 

  const formik = useFormik({
    initialValues: {
      id: initialData?.id || null,
      full_name: initialData?.full_name || "",
      company_name: initialData?.company_name || "",
      address: initialData?.address || "",
      phone_number: initialData?.phone_number || "",
      commercial_registration_number: initialData?.commercial_registration_number || "",
      alt_phone_number: initialData?.alt_phone_number?.length ? initialData.alt_phone_number : [""],
      is_tracking: !!(initialData?.customers && initialData.customers.length > 0),
      customer: initialData?.customers && initialData.customers.length > 0
        ? {
            full_name: initialData.customers[0].full_name || "",
            phone_number: initialData.customers[0].phone_number || "",
            address: initialData.customers[0].address || "",
          }
        : { full_name: "", phone_number: "", address: "" },
    },
    validationSchema: Yup.object({
      full_name: Yup.string().required("الاسم الكامل مطلوب"),
      company_name: Yup.string().required("اسم الشركة مطلوب"),
      address: Yup.string().required("العنوان مطلوب"),
      phone_number: Yup.string()
        .matches(/^[0-9]+$/, "الرجاء إدخال أرقام فقط!")
        .min(8, "رقم الهاتف قصير جداً!")
        .required("رقم الهاتف مطلوب!"),
      commercial_registration_number: Yup.string()
        .matches(/^[0-9]*$/, "الرجاء إدخال أرقام فقط")
        .nullable(),
      alt_phone_number: Yup.array().of(
        Yup.string()
          .matches(/^[0-9]*$/, "الرجاء إدخال أرقام فقط!")
          .nullable()
      ),
      is_tracking: Yup.boolean(),
      customer: Yup.object().shape({
        full_name: Yup.string().when('is_tracking', {
          is: true,
          then: (schema) => schema.required("اسم مدير الأعمال مطلوب عند التتبع"),
          otherwise: (schema) => schema.nullable(),
        }),
        phone_number: Yup.string().matches(/^[0-9]*$/, "الرجاء إدخال أرقام فقط!").nullable(),
        address: Yup.string().nullable(),
      }),
    }),
    onSubmit: async (values) => {
      const payload = {
        full_name: values.full_name,
        company_name: values.company_name,
        address: values.address,
        phone_number: values.phone_number,
        alt_phone_number: values.alt_phone_number.filter(num => num && num.trim() !== ""),
        is_tracking: values.is_tracking ? 1 : 0,
        ...(values.is_tracking && values.customer.full_name && { customer: values.customer }),
        ...(values.commercial_registration_number && { commercial_registration_number: values.commercial_registration_number }),
      };

      try {
        if (isEditMode) {
          await updateCustomerMutation({ id: values.id, ...payload }).unwrap();
        } else {
          await addNewCustomerMutation(payload).unwrap();
        }
        onSuccess(); 
      } catch (error) {
        showToast("error", error.data?.message || "حدث خطأ ما");
        console.log(error)
      }
    },
  });

  useEffect(() => {
    if (open) {
      formik.setValues({
        id: initialData?.id || null,
        full_name: initialData?.full_name || "",
        company_name: initialData?.company_name || "",
        address: initialData?.address || "",
        phone_number: initialData?.phone_number || "",
        commercial_registration_number: initialData?.commercial_registration_number || "",
        alt_phone_number: initialData?.alt_phone_number?.length ? initialData.alt_phone_number : [""],
        is_tracking: !!(initialData?.customers && initialData.customers.length > 0),
        customer: initialData?.customers && initialData.customers.length > 0
          ? {
              full_name: initialData.customers[0].full_name || "",
              phone_number: initialData.customers[0].phone_number || "",
              address: initialData.customers[0].address || "",
            }
          : { full_name: "", phone_number: "", address: "" },
      });
    } else {
      formik.resetForm();
    }
  }, [open, initialData]); 

  const addAltPhoneNumberField = () => {
    formik.setFieldValue("alt_phone_number", [...formik.values.alt_phone_number, ""]);
  };

  const removeAltPhoneNumberField = (index) => {
    const newAltPhoneNumbers = [...formik.values.alt_phone_number];
    newAltPhoneNumbers.splice(index, 1);
    formik.setFieldValue("alt_phone_number", newAltPhoneNumbers);
  };

  const currentLoading = isAdding || isUpdating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`sm:max-w-[500px] max-h-[600px] overflow-y-auto dialog-content p-6`}
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-bold">
            {isEditMode ? "تعديل معلومات الزبون" : "إضافة زبون جديد"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={formik.handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="full_name">الاسم الكامل:</Label>
            <Input
              id="full_name"
              type="text"
              name="full_name"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.full_name}
              className="mt-1"
            />
            {formik.touched.full_name && formik.errors.full_name ? (
              <div className="text-red-500 text-sm mt-1">{formik.errors.full_name}</div>
            ) : null}
          </div>

          <div>
            <Label htmlFor="company_name">اسم الشركة:</Label>
            <Input
              id="company_name"
              type="text"
              name="company_name"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.company_name}
              className="mt-1"
            />
            {formik.touched.company_name && formik.errors.company_name ? (
              <div className="text-red-500 text-sm mt-1">{formik.errors.company_name}</div>
            ) : null}
          </div>

          <div>
            <Label htmlFor="address">العنوان:</Label>
            <Input
              id="address"
              type="text"
              name="address"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.address}
              className="mt-1"
            />
            {formik.touched.address && formik.errors.address ? (
              <div className="text-red-500 text-sm mt-1">{formik.errors.address}</div>
            ) : null}
          </div>

          <div>
            <Label htmlFor="phone_number">رقم الهاتف:</Label>
            <Input
              id="phone_number"
              type="text"
              name="phone_number"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.phone_number}
              className="mt-1"
            />
            {formik.touched.phone_number && formik.errors.phone_number ? (
              <div className="text-red-500 text-sm mt-1">{formik.errors.phone_number}</div>
            ) : null}
          </div>

          <div>
            <Label htmlFor="commercial_registration_number">رقم السجل التجاري (اختياري):</Label>
            <Input
              id="commercial_registration_number"
              type="text"
              name="commercial_registration_number"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.commercial_registration_number}
              className="mt-1"
            />
            {formik.touched.commercial_registration_number && formik.errors.commercial_registration_number ? (
              <div className="text-red-500 text-sm mt-1">{formik.errors.commercial_registration_number}</div>
            ) : null}
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-200 mt-4">
            <Label>أرقام هواتف بديلة:</Label>
            {formik.values.alt_phone_number.map((phone, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  type="text"
                  name={`alt_phone_number[${index}]`}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={phone}
                  placeholder={`رقم هاتف بديل ${index + 1}`}
                  className="flex-grow"
                />
                {formik.values.alt_phone_number.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAltPhoneNumberField(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addAltPhoneNumberField} className="w-full">
              <PlusCircle className="h-4 w-4 mr-2" /> إضافة رقم هاتف بديل
            </Button>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-200 mt-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_tracking"
                checked={formik.values.is_tracking}
                onCheckedChange={(checked) => {
                  formik.setFieldValue("is_tracking", checked);
                  if (!checked) {
                    formik.setFieldValue("customer", { full_name: "", phone_number: "", address: "" });
                  }
                }}
              />
              <Label htmlFor="is_tracking" className="cursor-pointer">تتبع مدير أعمال؟</Label>
            </div>

            {formik.values.is_tracking && (
              <div className="space-y-2 mt-2 p-3 border rounded-md bg-gray-50 dark:bg-gray-800">
                <div>
                  <Label htmlFor="customer.full_name">اسم مدير الأعمال:</Label>
                  <Input
                    id="customer.full_name"
                    type="text"
                    name="customer.full_name"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.customer.full_name}
                    className="mt-1"
                  />
                  {formik.touched.customer?.full_name && formik.errors.customer?.full_name ? (
                    <div className="text-red-500 text-sm mt-1">{formik.errors.customer.full_name}</div>
                  ) : null}
                </div>
                <div>
                  <Label htmlFor="customer.phone_number">رقم هاتف مدير الأعمال:</Label>
                  <Input
                    id="customer.phone_number"
                    type="text"
                    name="customer.phone_number"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.customer.phone_number}
                    className="mt-1"
                  />
                  {formik.touched.customer?.phone_number && formik.errors.customer?.phone_number ? (
                    <div className="text-red-500 text-sm mt-1">{formik.errors.customer.phone_number}</div>
                  ) : null}
                </div>
                <div>
                  <Label htmlFor="customer.address">عنوان مدير الأعمال:</Label>
                  <Input
                    id="customer.address"
                    type="text"
                    name="customer.address"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.customer.address}
                    className="mt-1"
                  />
                  {formik.touched.customer?.address && formik.errors.customer?.address ? (
                    <div className="text-red-500 text-sm mt-1">{formik.errors.customer.address}</div>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
              }}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={currentLoading}>
              {currentLoading ? "جاري الحفظ..." : (isEditMode ? "تحديث الزبون" : "حفظ الزبون")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <Toaster />
    </Dialog>
  );
};

export default CustomerFormDialog;