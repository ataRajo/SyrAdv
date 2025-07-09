import React, { memo, useContext } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { BookingContext } from "../../../../Context/BookingContext";

const CalculationResult = () => {
  const {
    calculateDiscountedPrice,
    handleDiscountValueChange,
    calculationResult,
    discountValue,
    setShowDiscount,
    showDiscount,
    discountType,
    setDiscountType,
    setDiscountValue,
  } = useContext(BookingContext);

  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 text-right">
        نتائج الحساب
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            السعر الإجمالي:
          </span>
          <span className="mt-1 text-gray-900 dark:text-gray-100 font-medium">
            {calculationResult?.price_per_period?.toFixed(2)} $
          </span>
        </div>
        {discountValue && (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              السعر بعد الحسم:
            </span>
            <span className="mt-1 text-gray-900 dark:text-gray-100 font-medium">
              {calculateDiscountedPrice()?.toFixed(2)} $
            </span>
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            مساحة الإعلان:
          </span>
          <span className="mt-1 text-gray-900 dark:text-gray-100 font-medium">
            {calculationResult?.amount?.total_advertising_space.toFixed(2)} متر
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            مساحة الطباعة:
          </span>
          <span className="mt-1 text-gray-900 dark:text-gray-100 font-medium">
            {calculationResult?.amount?.total_printing_space.toFixed(2)} متر
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            عدد الدورات ( الأشهر ) :
          </span>
          <span className="mt-1 text-gray-900 dark:text-gray-100 font-medium">
            {calculationResult?.units || "غير متوفر"} 
          </span>
        </div>
      </div>
      {calculationResult && (
        <div className="mt-4">
          <Button
            type="button"
            onClick={() => setShowDiscount(true)}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg"
          >
            إضافة حسم
          </Button>
          {showDiscount && (
            <div className="mt-4 space-y-4">
              <RadioGroup
                value={discountType}
                onValueChange={setDiscountType}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="amount" />
                  <Label htmlFor="amount">قيمة</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="2" id="percentage" />
                  <Label htmlFor="percentage">نسبة مئوية</Label>
                </div>
              </RadioGroup>
              <Input
                type="number"
                value={discountValue}
                onChange={handleDiscountValueChange}
                placeholder="أدخل قيمة الحسم"
                className="w-full text-right"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDiscount(false);
                  setDiscountValue("");
                }}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                إلغاء الحسم
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default memo(CalculationResult);
