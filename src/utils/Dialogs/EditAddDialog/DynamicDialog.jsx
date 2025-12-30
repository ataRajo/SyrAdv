import React, { useRef, useState } from "react";
import { Formik, Form } from "formik";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { MapPin, Edit } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Select from "react-select";
import { showToast } from "../../Notifictions/showToast";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Toaster } from "react-hot-toast";
import { Textarea } from "@/Components/ui/textarea";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import MapDialog from "../../MapDialog";
import { useAddNewCityMutation } from "../../../RtkQuery/Slice/CitiesAndRegions/CitiesAndRegionsApi";

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
  styles = "overflow-y-auto",
  onSubmitTransform = (values) => values,
  onFieldChange = () => {},
  handleLocationSelect,
  selectedLocation,
}) => {
  const mutationReturn = mutationHook();
  let mutate = null;
  let isLoading = false;

  if (Array.isArray(mutationReturn)) {
    // RTK Query style: [trigger, result]
    mutate = mutationReturn[0];
    isLoading = mutationReturn[1]?.isLoading ?? false;
  } else if (mutationReturn && typeof mutationReturn === "object") {
    // react-query style or object with mutate/mutateAsync
    mutate = mutationReturn.mutate ?? mutationReturn.trigger ?? mutationReturn;
    isLoading = mutationReturn.isLoading ?? false;
  } else if (typeof mutationReturn === "function") {
    // hook returned a function directly
    mutate = mutationReturn;
  }

  const [passwordVisibility, setPasswordVisibility] = useState({});

  const togglePasswordVisibility = (fieldName) => {
    setPasswordVisibility((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

  const renderField = (field, formik) => {
    switch (field.type) {
case "select": {
  const options = field.options || (selectData[field.dataKey]?.data || []);
  const selectOptions = options.map((opt) => {
    const value = opt[field.valueKey] ?? opt.value ?? opt;
    const label = opt[field.displayKey] ?? opt.label ?? opt;
    return { value, label };
  });

  return (
    <div key={field.name} className="space-y-2">
      <Label htmlFor={field.name}>{field.label}</Label>
      <Select
        className="text-red-600"
        options={selectOptions}
        value={
          selectOptions.find((opt) => opt.value === formik.values[field.name]) || null
        }
        onChange={(selectedOption) => {
          const value = selectedOption ? selectedOption.value : "";
          formik.setFieldValue(field.name, value);
          onFieldChange(field.name, value);
        }}
        onBlur={() => formik.setFieldTouched(field.name, true)}
        placeholder={`اختر ${field.label}`}
        isSearchable
        noOptionsMessage={() => "لا توجد خيارات مطابقة"}
        styles={{
          control: (base) => ({
            ...base,
            borderColor:
              formik.touched[field.name] && formik.errors[field.name]
                ? "red"
                : base.borderColor,
            direction: "rtl",
            textAlign: "right",
          }),
          menu: (base) => ({ ...base, direction: "rtl", zIndex: 9999 }),
        }}
      />
      {formik.touched[field.name] && formik.errors[field.name] && (
        <p className="text-sm text-destructive">{formik.errors[field.name]}</p>
      )}
    </div>
  );
}
      case "array":
        return (
          <div key={field.name} className="space-y-2">
            <Label>{field.label}</Label>
            {formik.values[field.name]?.map((item, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <Label className="w-24">
                  {item.type === 1 ? "محلي"  : item.type === 2 ? "أجنبي" : "كلاهما"}
                  
                </Label>

                <Input
                  type="number"
                  name={`${field.name}[${index}].price`}
                  value={formik.values[field.name][index]?.price || ""}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder={`   السعر ب $  ${item.type === 1 ? "" : item.type === 2 ? "" : ""}`}
                  className={
                    formik.touched[field.name]?.[index]?.price && formik.errors[field.name]?.[index]?.price
                      ? "border-destructive"
                      : ""
                  }
                />
              </div>
            ))}
          </div>
        );

case "file": {
  const currentVal = formik.values[field.name];
  const initialVal = formik.initialValues?.[field.name];
  
  // Get the full image URL if it's stored as a path
  const getImageUrl = (imageValue) => {
    if (!imageValue) return null;
    
    if (imageValue instanceof File) {
      return URL.createObjectURL(imageValue);
    }
    
    if (typeof imageValue === 'string') {
      // Check if it's already a full URL
      if (imageValue.startsWith('http') || imageValue.startsWith('/')) {
        return imageValue;
      }
      // If it's just a filename, you might want to prepend your base URL
      return `${process.env.REACT_APP_API_URL || ''}/storage/${imageValue}`;
    }
    
    return null;
  };

  const previewSrc = getImageUrl(currentVal) || getImageUrl(initialVal);

  return (
    <div key={field.name} className="space-y-2">
      <Label htmlFor={field.name}>{field.label}</Label>

      {previewSrc && (
        <div className="mb-2">
          <p className="text-sm text-gray-600">الصورة الحالية:</p>
          <img
            src={previewSrc}
            alt="Preview"
            className="h-24 w-24 object-cover rounded border"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}

      <Input
        id={field.name}
        name={field.name}
        type="file"
        accept={field.accept || "image/*"}
        onChange={(e) => {
          const file = e.currentTarget.files?.[0];
          if (file) {
            formik.setFieldValue(field.name, file);
          }
        }}
      />

      <div className="flex gap-2 mt-2">
        {previewSrc && (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                // Clear the file input
                const fileInput = document.getElementById(field.name);
                if (fileInput) fileInput.value = '';
                // Clear the field value
                formik.setFieldValue(field.name, null);
              }}
            >
              إزالة الصورة
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.open(previewSrc, '_blank')}
            >
              عرض بالحجم الكامل
            </Button>
          </>
        )}
      </div>
    </div>
  );
}




      case "textarea":
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            <Textarea
              id={field.name}
              name={field.name}
              value={formik.values[field.name] || ""}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder={field.placeholder || `أدخل ${field.label}`}
            />
          </div>
        );

      case "reactquill":
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            <ReactQuill
              value={formik.values[field.name] || ""}
              onChange={(value) => formik.setFieldValue(field.name, value)}
            />
          </div>
        );

      case "password": {
        const isPasswordVisible = passwordVisibility[field.name];
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            <div className="relative">
              <Input
                id={field.name}
                name={field.name}
                type={isPasswordVisible ? "text" : "password"}
                value={formik.values[field.name] || ""}
                onChange={formik.handleChange}
                className="pl-10"
              />
              <button
                type="button"
                className="absolute inset-y-0 left-0 pr-3 flex items-center text-gray-500"
                onClick={() => togglePasswordVisibility(field.name)}
              >
                {isPasswordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
        );
      }

case "map":
  return (
    <div key={field.name} className="space-y-2">
      <Label htmlFor={field.name}>موقع اللوحة الطرقية</Label>
      
      {/* 🔍 DEBUG: Show what values we actually have */}
      <div className="text-xs text-gray-500 mb-2">
        Form values: lat={formik.values.latitudeX}, lng={formik.values.longitudeY}
      </div>
      
      {/* Display selected location if we have coordinates */}
      {(formik.values.latitudeX && formik.values.longitudeY) ? (
        <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-700 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <strong>الموقع الحالي:</strong>
            {selectedLocation?.address || "موقع محدد"}
          </p>
          <p className="text-xs text-gray-600">
            الإحداثيات: {formik.values.latitudeX}, {formik.values.longitudeY}
          </p>
        </div>
      ) : (
        <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-700">
            ⚠️ لم يتم تحديد موقع بعد
          </p>
        </div>
      )}
      
      {/* Map Dialog */}
      <MapDialog
        onLocationSelect={(locationData) => {
          // ✅ SIMPLY update formik values
          formik.setFieldValue("latitudeX", locationData.lat);
          formik.setFieldValue("longitudeY", locationData.lng);
          
          // If you have an external handler, call it
          if (typeof handleLocationSelect === 'function') {
            handleLocationSelect(locationData);
          }
        }}
        // ✅ Pass initial location ONLY if we have coordinates
        initialLocation={
          formik.values.latitudeX && formik.values.longitudeY
            ? {
                lat: parseFloat(formik.values.latitudeX),
                lng: parseFloat(formik.values.longitudeY),
                address: "الموقع الحالي"
              }
            : null
        }
        buttonText="تحديد/تغيير الموقع من الخريطة"
        buttonVariant="outline"
        enableSatelliteView={true}
      />
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
            />
          </div>
        );
    }
  };

  return (
    <Dialog open={show} onOpenChange={handleClose}>
      <DialogContent className={`sm:max-w-[500px] max-h-[600px] ${styles} p-6`} dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-center">{title}</DialogTitle>
        </DialogHeader>
   <Formik
  initialValues={initialValues}
  validationSchema={validationSchema}
  enableReinitialize={false} // Disable auto-reinitialize
  onSubmit={async (values, { setSubmitting, resetForm }) => {
    try {
      setSubmitting(true);

      // Debug: Log the original values
      console.log("📝 Original form values:", values);
      console.log("📍 LatitudeX:", values.latitudeX, "Type:", typeof values.latitudeX);
      console.log("📍 LongitudeY:", values.longitudeY, "Type:", typeof values.longitudeY);

      const transformed = onSubmitTransform(values);
      const payload = transformed instanceof FormData ? transformed : { ...transformed };

      // debug: log FormData entries when using FormData
      if (payload instanceof FormData) {
        console.log("📤 FormData entries:");
        for (const pair of payload.entries()) {
          console.log(pair[0], ":", pair[1], "(type:", typeof pair[1], ")");
        }
        
        // Ensure latitude and longitude are always included
        if (!payload.has('latitudeX')) {
          console.log("⚠️ latitudeX not in FormData, adding default 0");
          payload.append('latitudeX', 0);
        }
        if (!payload.has('longitudeY')) {
          console.log("⚠️ longitudeY not in FormData, adding default 0");
          payload.append('longitudeY', 0);
        }
      } else {
        console.log("📤 JSON payload:", payload);
        
        // Ensure latitude and longitude are always included in JSON
        if (payload.latitudeX === undefined || payload.latitudeX === null || payload.latitudeX === '') {
          console.log("⚠️ latitudeX not in payload, adding default 0");
          payload.latitudeX = 0;
        }
        if (payload.longitudeY === undefined || payload.longitudeY === null || payload.longitudeY === '') {
          console.log("⚠️ longitudeY not in payload, adding default 0");
          payload.longitudeY = 0;
        }
        
        // Convert to numbers
        if (typeof payload.latitudeX !== 'number') {
          payload.latitudeX = Number(payload.latitudeX) || 0;
        }
        if (typeof payload.longitudeY !== 'number') {
          payload.longitudeY = Number(payload.longitudeY) || 0;
        }
      }

      if (!mutate || typeof mutate !== "function") {
        throw new Error("Mutation function is not available. Ensure mutationHook is the correct RTK Query hook.");
      }

      // call the mutation in a way that supports RTK Query trigger (promise), react-query mutate/mutateAsync, and callback-style mutate
      let callResult;
      const callArg = id ? { id, data: payload } : payload;
      const maybePromise = mutate(callArg);

      if (maybePromise && typeof maybePromise.then === "function") {
        // RTK Query trigger returns a promise; it may have unwrap
        if (typeof maybePromise.unwrap === "function") {
          callResult = await maybePromise.unwrap();
        } else {
          callResult = await maybePromise;
        }
      } else {
        // callback-style mutate (react-query mutate)
        callResult = await new Promise((resolve, reject) => {
          try {
            mutate(callArg, {
              onSuccess: (data) => resolve(data),
              onError: (err) => reject(err),
            });
          } catch (e) {
            reject(e);
          }
        });
      }

      console.log("✅ API response:", callResult);
      showToast("success", "تمت المهمة بنجاح");
      resetForm(); // ✅ Reset form only on successful submission
      handleClose();
    } catch (err) {
      console.error("❌ Mutation error:", err);
      showToast("error", `حدث خطأ: ${err?.data?.message || err.message}`);
    } finally {
      setSubmitting(false);
    }
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
    }}
  >
    إلغاء
  </Button>
  <Button type="submit" disabled={isLoading || formik.isSubmitting}>
    {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "حفظ"}
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