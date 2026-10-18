import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const initialFormState = {
  offer_description: "",
  offer_price: "",
  from_date: "",
  to_date: "",
  status: "active",
};

// ← أضيف: initialData يفعّل وضع التعديل (بما فيه إعادة تفعيل عرض
// منتهي عبر حقل "الحالة") - طلب صريح.
const OfferModal = ({ show, onClose, onSubmit, isSubmitting, initialData = null }) => {
  const isEditMode = Boolean(initialData);
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        offer_description: initialData.offer_description || "",
        offer_price: initialData.offer_price ?? "",
        from_date: initialData.from_date || "",
        to_date: initialData.to_date || "",
        status: initialData.status || "active",
      });
    } else {
      setFormData(initialFormState);
    }
    setErrors({});
  }, [show, initialData]);

  const validate = () => {
    const newErrors = {};
    if (!formData.offer_description.trim()) {
      newErrors.offer_description = "الوصف مطلوب";
    }
    if (!formData.offer_price || formData.offer_price <= 0) {
      newErrors.offer_price = "السعر يجب أن يكون أكبر من صفر";
    }
    if (!formData.from_date) {
      newErrors.from_date = "تاريخ البداية مطلوب";
    }
    if (!formData.to_date) {
      newErrors.to_date = "تاريخ النهاية مطلوب";
    }
    if (formData.from_date && formData.to_date && formData.from_date > formData.to_date) {
      newErrors.to_date = "تاريخ النهاية يجب أن يكون بعد تاريخ البداية";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      ...formData,
      offer_price: Number(formData.offer_price),
    });
  };

  const statusOptions = [
    { value: "active", label: "نشط" },
    { value: "expired", label: "غير نشط" },
  ];

  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Icon icon="mdi:tag" className="text-blue-500" />
            {isEditMode ? "تعديل العرض" : "إضافة عرض جديد"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="offer_description" className="text-right block text-gray-700 dark:text-gray-300">
              وصف العرض <span className="text-red-500">*</span>
            </Label>
            <Input
              id="offer_description"
              name="offer_description"
              value={formData.offer_description}
              onChange={handleChange}
              placeholder="أدخل وصف العرض"
              className={`text-right bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${errors.offer_description ? "border-red-500" : ""}`}
              dir="rtl"
            />
            {errors.offer_description && (
              <p className="text-red-500 text-sm">{errors.offer_description}</p>
            )}
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="offer_price" className="text-right block text-gray-700 dark:text-gray-300">
              السعر <span className="text-red-500">*</span>
            </Label>
            <Input
              id="offer_price"
              name="offer_price"
              type="number"
              min="0"
              step="0.01"
              value={formData.offer_price}
              onChange={handleChange}
              placeholder="أدخل السعر"
              className={`bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${errors.offer_price ? "border-red-500" : ""}`}
            />
            {errors.offer_price && (
              <p className="text-red-500 text-sm">{errors.offer_price}</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from_date" className="text-right block text-gray-700 dark:text-gray-300">
                من تاريخ <span className="text-red-500">*</span>
              </Label>
              <Input
                id="from_date"
                name="from_date"
                type="date"
                value={formData.from_date}
                onChange={handleChange}
                className={`bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 ${errors.from_date ? "border-red-500" : ""}`}
              />
              {errors.from_date && (
                <p className="text-red-500 text-sm">{errors.from_date}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="to_date" className="text-right block text-gray-700 dark:text-gray-300">
                إلى تاريخ <span className="text-red-500">*</span>
              </Label>
              <Input
                id="to_date"
                name="to_date"
                type="date"
                value={formData.to_date}
                onChange={handleChange}
                className={`bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 ${errors.to_date ? "border-red-500" : ""}`}
              />
              {errors.to_date && (
                <p className="text-red-500 text-sm">{errors.to_date}</p>
              )}
            </div>
          </div>

          {/* Status - فقط عند التعديل، تسمح بإعادة تفعيل عرض منتهي */}
          {isEditMode && (
            <div className="space-y-2">
              <Label htmlFor="status" className="text-right block text-gray-700 dark:text-gray-300">
                الحالة
              </Label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                dir="rtl"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <Icon icon="mdi:loading" className="animate-spin" />
              ) : (
                <Icon icon="mdi:check" />
              )}
              {isEditMode ? "حفظ التعديل" : "حفظ"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OfferModal;