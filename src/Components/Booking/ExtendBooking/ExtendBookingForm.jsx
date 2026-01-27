import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Calendar,
  DollarSign,
  Check,
  XCircle,
  HelpCircle,
  AlertTriangle,
  CheckCircle,
  Palette,
  RefreshCw
} from "lucide-react";
import { Icon } from "@iconify/react";
import { fetchPrintingTypes } from "./ExtendBooking"; // FIX 1: Import the function

const ExtendBookingForm = ({
  booking,
  newEndDate,
  setNewEndDate,
  useNewDesign,
  setUseNewDesign,
  selectedPrintingType,
  setSelectedPrintingType,
  printingTypes,
  isFetchingPrintingTypes,
  designPriceInfo,
  selectedRoadSigns,
  calculatedAmount,
  discount,
  setDiscount,
  discountType,
  setDiscountType,
  onCalculatePrice,
  onExtendBooking,
  calculateFinalPrice,
  isExtending
}) => {
  // FIX 1: Remove the local fetch function and use the imported one
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon icon="mdi:calendar-edit" className="text-green-500" />
          تمديد الحجز
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <DesignChangeSection 
          useNewDesign={useNewDesign}
          setUseNewDesign={setUseNewDesign}
          printingTypes={printingTypes}
          selectedPrintingType={selectedPrintingType}
          setSelectedPrintingType={setSelectedPrintingType}
          designPriceInfo={designPriceInfo}
          isFetchingPrintingTypes={isFetchingPrintingTypes}
        />

        <div>
          <Label htmlFor="end_date" className="text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            تاريخ النهاية الجديد
          </Label>
          <Input
            id="end_date"
            type="date"
            value={newEndDate}
            onChange={(e) => {
              setNewEndDate(e.target.value);
              // Reset calculations when date changes
              if (calculatedAmount) {
                // Keep this logic from original
              }
            }}
            min={booking.end_date.split('T')[0]}
            className="mt-1"
          />
          <p className="text-sm text-gray-500 mt-1">
            يجب أن يكون التاريخ الجديد بعد {new Date(booking.end_date).toLocaleDateString('ar-EG')}
          </p>
        </div>

        {selectedRoadSigns.length < booking.roadsigns?.length && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Icon icon="mdi:alert-circle" className="text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">ملاحظة:</p>
                <p>سيتم تمديد {selectedRoadSigns.length} لوحة فقط من أصل {booking.roadsigns?.length}</p>
                <p className="mt-1">اللوحات غير المحددة سيتم إزالتها من التمديد</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={onCalculatePrice}
            disabled={
              !newEndDate || 
              selectedRoadSigns.length === 0 ||
              (useNewDesign && !selectedPrintingType)
            }
            className="flex-1 bg-blue-600 text-white hover:bg-blue-700 transition-all hover:scale-105"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            حساب السعر الجديد
          </Button>
        </div>

        {calculatedAmount && (
          <PriceCalculationSection 
            useNewDesign={useNewDesign}
            designPriceInfo={designPriceInfo}
            calculatedAmount={calculatedAmount}
            selectedRoadSigns={selectedRoadSigns}
          />
        )}

        {calculatedAmount && (
          <DiscountSection 
            discount={discount}
            setDiscount={setDiscount}
            discountType={discountType}
            setDiscountType={setDiscountType}
            useNewDesign={useNewDesign}
            designPriceInfo={designPriceInfo}
            calculatedAmount={calculatedAmount}
            calculateFinalPrice={calculateFinalPrice}
          />
        )}

        <div className="flex gap-3 pt-4">
          <Button
            onClick={onExtendBooking}
            disabled={
              isExtending || 
              !calculatedAmount || 
              selectedRoadSigns.length === 0 ||
              (useNewDesign && !selectedPrintingType)
            }
            className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            {isExtending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                جاري التمديد...
              </>
            ) : (
              <>
                <Icon icon="mdi:calendar-plus" className="mr-2" />
                {useNewDesign ? "تمديد مع تصميم جديد" : "تأكيد التمديد"}
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="flex-1"
          >
            إلغاء
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const DesignChangeSection = ({
  useNewDesign,
  setUseNewDesign,
  printingTypes,
  selectedPrintingType,
  setSelectedPrintingType,
  designPriceInfo,
  isFetchingPrintingTypes
}) => (
  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 dark:bg-blue-800/50 rounded-lg">
          <Palette className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            تغيير التصميم
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            هل تريد تغيير تصميم اللوحات في فترة التمديد؟
          </p>
        </div>
      </div>
      
      <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-1 bg-gray-50 dark:bg-gray-800">
        <button
          type="button"
          onClick={() => setUseNewDesign(true)}
          className={`px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
            useNewDesign
              ? 'bg-blue-500 text-white shadow-md hover:bg-blue-600'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <Check className="w-4 h-4 inline mr-2" />
          نعم
        </button>
        <button
          type="button"
          onClick={() => setUseNewDesign(false)}
          className={`px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
            !useNewDesign
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white shadow-inner hover:bg-gray-300'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <XCircle className="w-4 h-4 inline mr-2" />
          لا
        </button>
      </div>
    </div>
    
    {useNewDesign && (
      <div className="mt-4 space-y-4 animate-in fade-in duration-300">
        <div className="p-3 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-yellow-100 dark:bg-yellow-800/50 rounded-md mt-0.5">
              <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="font-semibold text-yellow-800 dark:text-yellow-300 text-sm">
                ملاحظة مهمة
              </p>
              <p className="text-yellow-700 dark:text-yellow-400 text-xs mt-1">
                سيتم إضافة تكلفة التصميم الجديد إلى السعر النهائي للتمديد
              </p>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-blue-500" />
            اختر نوع التصميم الجديد
          </Label>
          
          {isFetchingPrintingTypes ? (
            <div className="flex items-center justify-center p-4">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-500 mr-2" />
              <span className="text-sm text-gray-600">جاري تحميل أنواع التصميم...</span>
            </div>
          ) : printingTypes.length === 0 ? (
            <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <span className="text-sm text-red-700 dark:text-red-300">لا توجد أنواع تصميم متاحة</span>
              </div>
            </div>
          ) : (
            <Select
              value={selectedPrintingType?.toString()}
              onValueChange={(value) => {
                setSelectedPrintingType(value);
                // FIX 1: Show toast when changing printing type
                // You need to import showToast or pass it as prop
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="اختر نوع التصميم" />
              </SelectTrigger>
              <SelectContent>
                {printingTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    <div className="flex items-center justify-between w-full">
                      <span>{type.type}</span>
                      <span className="text-sm text-green-600 font-medium">
                        {parseFloat(type.price || 0).toLocaleString()} ل.س
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {selectedPrintingType && printingTypes.find(t => t.id == selectedPrintingType) && (
            <div className="mt-2 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-800 dark:text-green-300">
                    {printingTypes.find(t => t.id == selectedPrintingType).type}
                  </span>
                </div>
                <Badge variant="outline" className="text-sm">
                  <DollarSign className="w-3 h-3 inline mr-1" />
                  {parseFloat(printingTypes.find(t => t.id == selectedPrintingType).price || 0).toLocaleString()} ل.س
                </Badge>
              </div>
              {designPriceInfo && (
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  <p>تكلفة التصميم: {designPriceInfo.printingCost?.toLocaleString()} ل.س</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )}
  </div>
);

const PriceCalculationSection = ({
  useNewDesign,
  designPriceInfo,
  calculatedAmount,
  selectedRoadSigns
}) => (
  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800 animate-in slide-in-from-bottom-5">
    <h3 className="font-semibold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
      <DollarSign className="w-4 h-4" />
      حساب السعر الدقيق
    </h3>
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span>عدد اللوحات المحددة:</span>
        <span className="font-medium">{selectedRoadSigns.length} لوحة</span>
      </div>
      
      {useNewDesign && designPriceInfo && (
        <>
          <Separator className="my-2" />
          <div className="flex justify-between">
            <span>سعر التمديد:</span>
            <span className="font-medium">{designPriceInfo.originalPrice?.toLocaleString()} $</span>
          </div>
          <div className="flex justify-between">
            <span>تكلفة التصميم:</span>
            <span className="text-blue-600 font-medium">+{designPriceInfo.printingCost?.toLocaleString()} $</span>
          </div>
          <Separator className="my-2" />
        </>
      )}
      
      <div className="flex justify-between">
        <span>السعر الجديد:</span>
        <span className="text-green-600 font-bold text-lg animate-pulse">
          {useNewDesign && designPriceInfo 
            ? designPriceInfo.totalPrice?.toLocaleString() 
            : calculatedAmount?.toLocaleString()
          } $
        </span>
      </div>
    </div>
  </div>
);

const DiscountSection = ({
  discount,
  setDiscount,
  discountType,
  setDiscountType,
  useNewDesign,
  designPriceInfo,
  calculatedAmount,
  calculateFinalPrice
}) => (
  <div className="space-y-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
    <div className="flex items-center justify-between">
      <Label className="text-sm font-medium flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-orange-500" />
        إضافة خصم
      </Label>
      <div className="flex gap-2">
        <Button
          type="button"
          variant={discountType === "percentage" ? "default" : "outline"}
          size="sm"
          onClick={() => setDiscountType("percentage")}
          className="px-3"
        >
          %
        </Button>
        <Button
          type="button"
          variant={discountType === "fixed" ? "default" : "outline"}
          size="sm"
          onClick={() => setDiscountType("fixed")}
          className="px-3"
        >
          $
        </Button>
      </div>
    </div>
    
    <div className="flex gap-2">
      <Input
        type="number"
        placeholder={discountType === "percentage" ? "نسبة الخصم" : "مبلغ الخصم"}
        value={discount}
        onChange={(e) => setDiscount(Number(e.target.value))}
        min="0"
        max={discountType === "percentage" ? "100" : undefined}
        className="flex-1"
      />
      <Button
        variant="outline"
        onClick={() => setDiscount(0)}
        disabled={discount === 0}
        className="px-4"
      >
        إلغاء
      </Button>
    </div>
    
    {discount > 0 && (
      <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-yellow-200 dark:border-yellow-700 animate-in fade-in">
        <div className="flex justify-between items-center text-sm mb-1">
          <span>السعر قبل الخصم:</span>
          <span className="font-medium">
            {useNewDesign && designPriceInfo 
              ? designPriceInfo.totalPrice?.toLocaleString() 
              : calculatedAmount?.toLocaleString()
            } $
          </span>
        </div>
        <div className="flex justify-between items-center text-sm mb-2">
          <span>قيمة الخصم:</span>
          <span className="text-red-600 font-medium">
            -{discountType === "percentage" ? `${discount}%` : `${discount}$`}
          </span>
        </div>
        <Separator className="my-2" />
        <div className="flex justify-between items-center text-sm pt-2">
          <span className="font-bold">السعر النهائي:</span>
          <span className="text-green-600 font-bold text-lg">
            {useNewDesign && designPriceInfo 
              ? calculateFinalPrice(designPriceInfo.totalPrice)?.toLocaleString() 
              : calculateFinalPrice(calculatedAmount)?.toLocaleString()
            } $
          </span>
        </div>
      </div>
    )}
  </div>
);

export default ExtendBookingForm;