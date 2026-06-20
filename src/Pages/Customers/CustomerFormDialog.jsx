// src/components/CustomerFormDialog.jsx
import React, { useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Trash2, PlusCircle, Briefcase } from "lucide-react";
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
import { useGetWorkTypesQuery } from "../../RtkQuery/Slice/WorkTypesApi/WorkTypesApi";
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

  const { data: workTypesData, isLoading: isWorkTypesLoading } =
    useGetWorkTypesQuery();
  const workTypes = workTypesData?.data || [];

  const formik = useFormik({
    initialValues: {
      id: initialData?.id || null,
      full_name: initialData?.full_name || "",
      company_name: initialData?.company_name || "",
      address: initialData?.address || "",
      phone_number: initialData?.phone_number || "",
      commercial_registration_number:
        initialData?.commercial_registration_number || "",
      email: initialData?.email || "",
      username: initialData?.username || "",
      password: "",
      work_type_id: initialData?.work_type_id || "", // ← ADD THIS
      is_contracted: initialData?.is_contracted ?? false, // ← ADD THIS (default false)

      customer_account: initialData?.customer_account || "", // ✅ Fixed: Added customer_account
      alt_phone_number: initialData?.alt_phone_number?.length
        ? initialData.alt_phone_number
        : [""],
      is_tracking: !!(
        initialData?.customers && initialData.customers.length > 0
      ),
      customer:
        initialData?.customers && initialData.customers.length > 0
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
      // ❌ REMOVED: phone_number validation
      commercial_registration_number: Yup.string()
        .matches(/^[0-9]*$/, "الرجاء إدخال أرقام فقط")
        .nullable(),
      email: Yup.string()
        .email("البريد الإلكتروني غير صالح")
        .required("الحقل البريد الالكتروني مطلوب."),
      username: Yup.string().required("الحقل اسم المُستخدم مطلوب."),
      work_type_id: Yup.number()  // ← ADD THIS (if not already)
        .required("نوع العمل مطلوب")
        .typeError("يجب اختيار نوع عمل"),
      customer_account: Yup.string()
        .matches(/^[0-9]*$/, "الرجاء إدخال أرقام فقط")
        .nullable(),
      password: Yup.string().test(
        "password-required-if-add",
        "الحقل كلمة المرور مطلوب.",
        function (value) {
          const { id } = this.parent;
          if (!id && !value) return false;
          return true;
        }
      ),
      alt_phone_number: Yup.array().of(
        Yup.string()
          .matches(/^[0-9]*$/, "الرجاء إدخال أرقام فقط!")
          .nullable()
      ),
      is_tracking: Yup.boolean(),
      customer: Yup.object().shape({
        full_name: Yup.string().when("is_tracking", {
          is: true,
          then: (schema) =>
            schema.required("اسم مدير الأعمال مطلوب عند التتبع"),
          otherwise: (schema) => schema.nullable(),
        }),
        address: Yup.string().nullable(),
      }),
    }),

    onSubmit: async (values) => {
      const payload = {
        full_name: values.full_name,
        company_name: values.company_name,
        address: values.address,
        phone_number: values.phone_number,
        email: values.email,
        username: values.username,
        work_type_id: values.work_type_id,
        is_contracted :values.is_contracted ,

        customer_account: values.customer_account, // ✅ Added to payload
        ...(values.password && { password: values.password }),
        alt_phone_number: values.alt_phone_number.filter(
          (num) => num && num.trim() !== "",
        ),
        is_tracking: values.is_tracking ? 1 : 0,
        ...(values.is_tracking &&
          values.customer.full_name && { customer: values.customer }),
        ...(values.commercial_registration_number && {
          commercial_registration_number: values.commercial_registration_number,
        }),
      };

      try {
        if (isEditMode) {
          await updateCustomerMutation({ id: values.id, ...payload }).unwrap();
        } else {
          await addNewCustomerMutation(payload).unwrap();
        }
        onSuccess();
      } catch (error) {
        console.error("Full customer error object:", error);

        if (error?.data) {
          console.log("API error data:", JSON.stringify(error.data, null, 2));

          if (error.data.errors) {
            Object.keys(error.data.errors).forEach((field) => {
              formik.setFieldError(field, error.data.errors[field][0]);
            });
          }
        }

        showToast(
          "error",
          error?.data?.message || error?.message || "حدث خطأ ما",
        );
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
        commercial_registration_number:
          initialData?.commercial_registration_number || "",
        email: initialData?.email || "",
        username: initialData?.username || "",
        password: "",
        is_contracted: initialData?.is_contracted ?? false,  // ← ADD THIS
        work_type_id: initialData?.work_type_id || "", // ← ADD THIS
        customer_account: initialData?.customer_account || "", // ✅ Added to useEffect
        alt_phone_number: initialData?.alt_phone_number?.length
          ? initialData.alt_phone_number
          : [""],
        is_tracking: !!(
          initialData?.customers && initialData.customers.length > 0
        ),
        customer:
          initialData?.customers && initialData.customers.length > 0
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
    formik.setFieldValue("alt_phone_number", [
      ...formik.values.alt_phone_number,
      "",
    ]);
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
          {/* Existing fields */}
          <div>
            <Label htmlFor="full_name">الاسم الكامل:</Label>
            <Input
              id="full_name"
              name="full_name"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.full_name}
              className="mt-1"
            />
            {formik.touched.full_name && formik.errors.full_name && (
              <div className="text-red-500 text-sm mt-1">
                {formik.errors.full_name}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="company_name">اسم الشركة:</Label>
            <Input
              id="company_name"
              name="company_name"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.company_name}
              className="mt-1"
            />
            {formik.touched.company_name && formik.errors.company_name && (
              <div className="text-red-500 text-sm mt-1">
                {formik.errors.company_name}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="address">العنوان:</Label>
            <Input
              id="address"
              name="address"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.address}
              className="mt-1"
            />
            {formik.touched.address && formik.errors.address && (
              <div className="text-red-500 text-sm mt-1">
                {formik.errors.address}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="phone_number">رقم الهاتف:</Label>
            <Input
              id="phone_number"
              name="phone_number"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.phone_number}
              className="mt-1"
            />
            {formik.touched.phone_number && formik.errors.phone_number && (
              <div className="text-red-500 text-sm mt-1">
                {formik.errors.phone_number}
              </div>
            )}
          </div>

          {/* New fields */}
          <div>
            <Label htmlFor="email">البريد الالكتروني:</Label>
            <Input
              id="email"
              name="email"
              type="email"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.email}
              className="mt-1"
            />
            {formik.touched.email && formik.errors.email && (
              <div className="text-red-500 text-sm mt-1">
                {formik.errors.email}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="username">اسم المستخدم:</Label>
            <Input
              id="username"
              name="username"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.username}
              className="mt-1"
            />
            {formik.touched.username && formik.errors.username && (
              <div className="text-red-500 text-sm mt-1">
                {formik.errors.username}
              </div>
            )}
          </div>

                    {/* Work Type Select */}
          <div>
            <Label htmlFor="work_type_id">نوع العمل:</Label>
            <div className="relative mt-1">
              <Briefcase className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
              <select
                id="work_type_id"
                name="work_type_id"
                value={formik.values.work_type_id}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full px-3 py-2 pr-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none"
              >
                <option value="">اختر نوع العمل</option>
                {isWorkTypesLoading ? (
                  <option disabled>جاري التحميل...</option>
                ) : workTypes.length === 0 ? (
                  <option disabled>لا توجد أنواع أعمال</option>
                ) : (
                  workTypes.map((wt) => (
                    <option key={wt.id} value={wt.id}>
                      {wt.type}
                    </option>
                  ))
                )}
              </select>
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {formik.touched.work_type_id && formik.errors.work_type_id && (
              <div className="text-red-500 text-sm mt-1">{formik.errors.work_type_id}</div>
            )}
          </div>

          {/* Is Contracted Checkbox */}
          <div className="flex items-center space-x-2 space-x-reverse bg-white/5 rounded-lg p-3">
            <Checkbox
              id="is_contracted"
              checked={formik.values.is_contracted}
              onCheckedChange={(checked) => formik.setFieldValue("is_contracted", checked)}
            />
            <Label htmlFor="is_contracted" className="mr-2 cursor-pointer">
              <span className="font-medium">هل العميل متعاقد؟</span>
              <span className="text-gray-400 text-sm block">
                {formik.values.is_contracted ? "نعم، العميل متعاقد" : "لا، العميل غير متعاقد"}
              </span>
            </Label>
          </div>



          {/*
          
          <div>
            <Label htmlFor="customer_account">المحفظة</Label>
            <Input 
              id="customer_account" 
              name="customer_account" 
              type="number" 
              onChange={formik.handleChange} 
              onBlur={formik.handleBlur} 
              value={formik.values.customer_account} 
              className="mt-1" 
            />
            {formik.touched.customer_account && formik.errors.customer_account && <div className="text-red-500 text-sm mt-1">{formik.errors.customer_account}</div>}
          </div>


           
           */}

          {!isEditMode && (
            <div>
              <Label htmlFor="password">كلمة المرور:</Label>
              <Input
                id="password"
                name="password"
                type="password"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.password}
                className="mt-1"
              />
              {formik.touched.password && formik.errors.password && (
                <div className="text-red-500 text-sm mt-1">
                  {formik.errors.password}
                </div>
              )}
            </div>
          )}

          {/* Commercial Registration Number */}
          <div>
            <Label htmlFor="commercial_registration_number">
              رقم السجل التجاري:
            </Label>
            <Input
              id="commercial_registration_number"
              name="commercial_registration_number"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.commercial_registration_number}
              className="mt-1"
            />
            {formik.touched.commercial_registration_number &&
              formik.errors.commercial_registration_number && (
                <div className="text-red-500 text-sm mt-1">
                  {formik.errors.commercial_registration_number}
                </div>
              )}
          </div>

          {/* Alternative Phone Numbers */}
          <div>
            <Label>أرقام هواتف بديلة:</Label>
            {formik.values.alt_phone_number.map((phone, index) => (
              <div key={index} className="flex items-center gap-2 mt-2">
                <Input
                  value={phone}
                  onChange={(e) => {
                    const newAltPhoneNumbers = [
                      ...formik.values.alt_phone_number,
                    ];
                    newAltPhoneNumbers[index] = e.target.value;
                    formik.setFieldValue(
                      "alt_phone_number",
                      newAltPhoneNumbers,
                    );
                  }}
                  onBlur={formik.handleBlur}
                  placeholder="رقم هاتف بديل"
                />
                {formik.values.alt_phone_number.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeAltPhoneNumberField(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="mt-2"
              onClick={addAltPhoneNumberField}
            >
              <PlusCircle className="h-4 w-4 ml-2" />
              إضافة رقم بديل
            </Button>
          </div>

          {/* Tracking Section */}
          <div className="flex items-center space-x-2 space-x-reverse">
            <Checkbox
              id="is_tracking"
              checked={formik.values.is_tracking}
              onCheckedChange={(checked) =>
                formik.setFieldValue("is_tracking", checked)
              }
            />
            <Label htmlFor="is_tracking" className="mr-2">
              تتبع هذا الزبون
            </Label>
          </div>

          {formik.values.is_tracking && (
            <div className="border p-4 rounded-md space-y-4">
              <h3 className="font-medium">معلومات مدير الأعمال:</h3>
              <div>
                <Label htmlFor="customer.full_name">اسم مدير الأعمال:</Label>
                <Input
                  id="customer.full_name"
                  name="customer.full_name"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.customer.full_name}
                  className="mt-1"
                />
                {formik.touched.customer?.full_name &&
                  formik.errors.customer?.full_name && (
                    <div className="text-red-500 text-sm mt-1">
                      {formik.errors.customer.full_name}
                    </div>
                  )}
              </div>
              <div>
                <Label htmlFor="customer.phone_number">
                  رقم هاتف مدير الأعمال:
                </Label>
                <Input
                  id="customer.phone_number"
                  name="customer.phone_number"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.customer.phone_number}
                  className="mt-1"
                />
                {formik.touched.customer?.phone_number &&
                  formik.errors.customer?.phone_number && (
                    <div className="text-red-500 text-sm mt-1">
                      {formik.errors.customer.phone_number}
                    </div>
                  )}
              </div>
              <div>
                <Label htmlFor="customer.address">عنوان مدير الأعمال:</Label>
                <Input
                  id="customer.address"
                  name="customer.address"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.customer.address}
                  className="mt-1"
                />
                {formik.touched.customer?.address &&
                  formik.errors.customer?.address && (
                    <div className="text-red-500 text-sm mt-1">
                      {formik.errors.customer.address}
                    </div>
                  )}
              </div>
            </div>
          )}

          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={currentLoading}>
              {currentLoading
                ? "جاري الحفظ..."
                : isEditMode
                  ? "تحديث الزبون"
                  : "حفظ الزبون"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <Toaster />
    </Dialog>
  );
};

export default CustomerFormDialog;
