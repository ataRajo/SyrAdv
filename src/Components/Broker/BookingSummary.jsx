import { useState } from "react";
import { Send, Calculator, Loader2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const BookingSummary = ({ 
  selectedCount, 
  totalPrice, 
  calculatedPrice,
  isSubmitting, 
  isCalculating,
  isValid, 
  canCalculate,
  onSubmit,
  onCalculate,
  startDate,
  endDate,
  printingId,
}) => {
  const [showCalculated, setShowCalculated] = useState(false);

  const handleCalculate = async () => {
    const result = await onCalculate();
    if (result?.success) {
      setShowCalculated(true);
    }
  };

  // Check if we can calculate (all required fields present)
  const canCalc = canCalculate && startDate && endDate && printingId && selectedCount > 0;

  return (
    <Card className="bg-gradient-to-br from-blue-600 to-purple-600 text-white sticky top-20 border-0">
      <CardHeader>
        <CardTitle className="text-white text-lg">ملخص الحجز</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-blue-100">عدد اللوحات:</span>
            <span className="font-bold text-xl">{selectedCount}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-blue-100">عدد الوجوه:</span>
            <span className="font-bold">{selectedCount}</span>
          </div>
          
          <Separator className="bg-white/30" />
          
          {/* Show calculated price if available */}
          {showCalculated && calculatedPrice !== null && (
            <>
              <div className="flex justify-between items-center text-lg bg-white/10 rounded-lg p-3">
                <span className="text-blue-100 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  السعر المحسوب:
                </span>
                <span className="font-bold text-2xl text-yellow-300">
                  {calculatedPrice.toLocaleString()} $
                </span>
              </div>
              <Separator className="bg-white/30" />
            </>
          )}
          
          {/* Show manual total if no calculated price yet */}
          {!showCalculated && (
            <div className="flex justify-between items-center text-lg">
              <span className="text-blue-100">المجموع التقديري:</span>
              <span className="font-bold text-2xl">{totalPrice.toLocaleString()} $</span>
            </div>
          )}
          
          <Separator className="bg-white/30" />
          
          {/* Calculate Price Button */}
          <Button
            onClick={handleCalculate}
            disabled={isCalculating || !canCalc}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold h-12"
            variant="secondary"
          >
            {isCalculating ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                جاري الحساب...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                حساب السعر
              </span>
            )}
          </Button>
          
          {/* Submit Button */}
          <Button
            onClick={onSubmit}
            disabled={isSubmitting || !isValid}
            className="w-full bg-white text-blue-600 hover:bg-blue-50 font-bold h-12"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                جاري الإنشاء...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                تأكيد الحجز
              </span>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};