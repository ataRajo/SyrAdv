import React, { memo, useContext } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import CartInfo from "./CartInfo";
import CalculationResult from "./CalculationResult";
import CartTable from "./CartTable";
import { BookingContext } from "../../../../Context/BookingContext";

const CartDialog = () => {
  const {
    openDialog,
    setOpenDialog,
    isEditMode,
    calculationResult,
    calculateTotal,
    formik,
    setContractDialog,
    isLoadingAdd,
    isLoadingUpdate,
    isLoadingCalculateReservation,
  } = useContext(BookingContext);

  // Create a custom submit handler
  const handleSubmitBooking = async () => {
    
    // Validate the form first
    const errors = await formik.validateForm();
    
    if (Object.keys(errors).length > 0) {
      // Set touched to show errors
      formik.setTouched({
        customer_id: true,
        type: true,
        start_date: true,
        end_date: true,
        product_type: true,
        printing_id: true,
      });
      console.log("🔴 Form has validation errors");
      return;
    }

    // Check if we have items in cart
    if (formik.values.selectedSigns?.length === 0) {
      return;
    }

    // Submit the form
    console.log("🟢 Submitting form...");
    formik.submitForm();
  };

  return (
    <Dialog dir="rtl" open={openDialog} onOpenChange={setOpenDialog}>
      <DialogContent
        dir="rtl"
        className="w-full max-h-[90vh] dialog-content overflow-auto p-6"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-right">
            سلة الحجز
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 w-[100%] max-w-[70vw] md:max-w-[100vw]">
          <CartInfo />
          {calculationResult && <CalculationResult />}
          <div className="rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <CartTable />
          </div>
        </div>
        <DialogFooter className="flex mt-6 flex-wrap gap-2">
          <Button
            type="button"
            onClick={calculateTotal}
            disabled={isLoadingCalculateReservation}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            {isLoadingCalculateReservation ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>جاري حساب التكلفة</span>
              </>
            ) : (
              "حساب التكلفة"
            )}
          </Button>
          {formik.values.type && (
            <Button
              type="button"
              onClick={() => setContractDialog(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg"
            >
              {isLoadingAdd || isLoadingUpdate ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {parseInt(formik.values.type) === 1
                    ? "... جاري تصدير عقد دائم"
                    : "جاري تصدير عقد مؤقت "}
                </>
              ) : parseInt(formik.values.type) === 1 ? (
                "تصدير عقد دائم"
              ) : (
                "ملاحظة"
              )}
            </Button>
          )}
          <Button
            type="button"
            onClick={handleSubmitBooking} // Changed to custom handler
            disabled={isLoadingAdd || isLoadingUpdate}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
          >
            {isLoadingAdd || isLoadingUpdate ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditMode ? "... جاري تعديل الحجز " : "جاري تثبيت الحجز ..."}
              </>
            ) : isEditMode ? (
              "تعديل الحجز"
            ) : (
              "تثبيت الحجز"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default memo(CartDialog);