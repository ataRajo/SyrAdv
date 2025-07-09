import React, { useEffect, useRef } from "react";
import { useFormik, Formik, Form, FieldArray } from "formik";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Select from "react-select"; 
import { showToast } from "../../Notifictions/showToast";
import { Loader2 } from "lucide-react";
import { Toaster } from "react-hot-toast";
import { Textarea } from "@/Components/ui/textarea";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css"; 

const DynamicDialog = ({
  show,
  handleClose,
  title,
  fields,
  validationSchema,
  mutationHook,
  initialValues,
  selectData = {},
  id = null,
  styles="overflow-y-auto",
  onSubmitTransform = (values) => values,
  onFieldChange  = () => {}
}) => {
  const hasNotifiedRef = useRef(false);
  const [mutate, { isLoading, isSuccess, isError, error }] = mutationHook();


  const renderField = (field, formik) => {

    switch (field.type) {
      case "select":
        const options = field.options || (selectData[field.dataKey]?.data || []);
        const selectOptions = options.map((opt, ind) => {
          const value = typeof opt === "string" ? opt : field.options ? opt.value : opt[field.valueKey];
          const label = typeof opt === "string" ? opt : field.options ? opt.label : opt[field.displayKey || field.valueKey];
          return { value, label };
        });

        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            <Select
              options={selectOptions}
              value={selectOptions.find((opt) => opt.value === formik.values[field.name]) || null}
              onChange={(selectedOption) =>{ 
                const value = selectedOption ? selectedOption.value : "";
                formik.setFieldValue(field.name, selectedOption ? selectedOption.value : "")
              onFieldChange(field.name , value)}}
              onBlur={() => formik.setFieldTouched(field.name, true)}
              placeholder={`اختر ${field.label}`}
              isSearchable={true}
              autoFocus={true}
              noOptionsMessage={() => "لا توجد خيارات مطابقة"}
              menuPlacement="auto"
              
              styles={{
                control: (base) => ({
                  ...base,
                  borderColor: formik.touched[field.name] && formik.errors[field.name] ? "red" : base.borderColor,
                  direction: "rtl",
                  textAlign: "right",
                  padding: "2px",
                  boxShadow: "none",
                  "&:hover": {
                    borderColor: formik.touched[field.name] && formik.errors[field.name] ? "red" : "primary",
                  },
                }),
                input: (base) => ({
                  ...base,
                  direction: "rtl",
                  padding: "8px",
                }),
                menu: (base) => ({
                  ...base,
                  direction: "rtl",
                  zIndex: 9999,
                }),
                option: (base, { isFocused, isSelected }) => ({
                  ...base,
                  direction: "rtl",
                  textAlign: "right",
                  backgroundColor: isSelected
                    ? "#2563eb"
                    : isFocused
                    ? "primary"
                    : "white",
                  color: isSelected ? "white" : "black",
                  cursor: "pointer",
                }),
                placeholder: (base) => ({
                  ...base,
                  color: "#9ca3af",
                }),
              }}
            />
            {formik.touched[field.name] && formik.errors[field.name] && (
              <p className="text-sm text-destructive">{formik.errors[field.name]}</p>
            )}
          </div>
        );
      case "array":
        return (
          <div key={field.name} className="space-y-2">
            <Label>{field.label}</Label>
            <div>
              {formik.values[field.name]?.map((item, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <Label htmlFor={`${field.name}[${index}].price`} className="w-24">
                    {item.type === 1 ? "محلي" : item.type === 2 ? "أجنبي" : "كلاهما"}
                  </Label>
                  <Input
                    type="number"
                    name={`${field.name}[${index}].price`}
                    value={formik.values[field.name][index]?.price || ""}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder={`سعر ${item.type === 1 ? "محلي" : item.type === 2 ? "أجنبي" : "كلاهما"}`}
                    className={formik.touched[field.name]?.[index]?.price && formik.errors[field.name]?.[index]?.price ? "border-destructive" : ""}
                  />
                </div>
              ))}
              {formik.touched[field.name] && formik.errors[field.name] && (
                <p className="text-sm text-destructive">
                  {typeof formik.errors[field.name] === "string"
                    ? formik.errors[field.name]
                    : "يرجى التحقق من أسعار المنتجات"}
                </p>
              )}
            </div>
          </div>
        );
      case "file":
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input
              id={field.name}
              name={field.name}
              type="file"
              onChange={(e) => formik.setFieldValue(field.name, e.currentTarget.files[0])}
              onBlur={formik.handleBlur}
              accept={field.accept || "image/*"}
            />
            {formik.touched[field.name] && formik.errors[field.name] && (
              <p className="text-sm text-destructive">{formik.errors[field.name]}</p>
            )}
          </div>
        );
      case "textarea":
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            <Textarea
              id={field.name}
              name={field.name}
              value={formik.values[field.name] || ""}
              onChange={formik.handleChange}
              onBlur={ formik.handleBlur}
              dir={field.dir || "rtl"}
              placeholder={field.placeholder || `أدخل ${field.label}`}
              className={formik.touched[field.name] && formik.errors[field.name] ? "border-destructive" : ""}
            />
            {formik.touched[field.name] && formik.errors[field.name] && (
              <p className="text-sm text-destructive">{formik.errors[field.name]}</p>
            )}
          </div>
        );
      case "reactquill":
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            <ReactQuill
              id={field.name}
              value={formik.values[field.name] || ""}
              onChange={(value) => formik.setFieldValue(field.name, value)}
              onBlur={() => formik.setFieldTouched(field.name, true)}
              dir={field.dir || "rtl"}
              placeholder={field.placeholder || `أدخل ${field.label}`}
              className={formik.touched[field.name] && formik.errors[field.name] ? "border-destructive" : ""}
            />
            {formik.touched[field.name] && formik.errors[field.name] && (
              <p className="text-sm text-destructive">{formik.errors[field.name]}</p>
            )}
          </div>
        );
      default:
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input
              id={field.name}
              name={field.name}
              type={field.type || "text"}
              value={formik.values[field.name] || ""}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              dir={field.dir || "rtl"}
              className={formik.touched[field.name] && formik.errors[field.name] ? "border-destructive" : ""}
            />
            {formik.touched[field.name] && formik.errors[field.name] && (
              <p className="text-sm text-destructive">{formik.errors[field.name]}</p>
            )}
          </div>
        );
    }
  };

  return (
    <Dialog  open={show} onOpenChange={handleClose}>
      <DialogContent   className={`sm:max-w-[500px] max-h-[600px] dialog-content  ${styles } p-6`} dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-center">{title}</DialogTitle>
          {/* <DialogDescription>
            قم بإدخال بيانات النموذج لإضافته أو تعديله.
          </DialogDescription> */}
        </DialogHeader>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          enableReinitialize
          onSubmit={async (values) => {
            try {
              const transformed = onSubmitTransform(values);
              await mutate(id ? { id, data: transformed } : transformed).unwrap();
              showToast("success" , "تمت المهمة بنجاح")
            } catch (err) {
              console.error("Mutation error:", err);
              showToast("error" , `  لقد حدث خطأ غير متوقع ${err.data.message}`)
            }
            handleClose();
          }}
        >
          {(formik) => (
            <Form className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {fields.map((field) => renderField(field, formik))}
              </div>
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    handleClose();
                    formik.resetForm();
                  }}
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    "حفظ"
                  )}
                </Button>
              </DialogFooter>
            </Form>
          )}
        </Formik>
      </DialogContent>
      <Toaster />
    </Dialog>
  );
};

export default DynamicDialog;