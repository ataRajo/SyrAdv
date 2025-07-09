import React, { memo, useContext } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { BookingContext } from "../../../Context/BookingContext";
import { Loader2 } from "lucide-react";

const ContractDialog = () => {
  const {
    contractDialog: openContractDialog,
    setContractDialog: setOpenContractDialog,
    formik,
    notes,
    setNotes,
    isLoadingAdd,
    isLoadingUpdate,
  } = useContext(BookingContext);

  return (
    <Dialog open={openContractDialog} onOpenChange={setOpenContractDialog}>
      <DialogContent dir="rtl" className="w-full max-w-[90vw] max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-right">
            {parseInt(formik.values.type) === 1
              ? "تصدير عقد دائم"
              : "تصدير عقد مؤقت"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            الملاحظات
          </label>
          <ReactQuill
            theme="snow"
            value={notes}
            onChange={setNotes}
            directions="rtl"
            className="w-full text-right dark:text-gray-200"
            placeholder="أدخل الملاحظات هنا..."
          />
        </div>
        <DialogFooter className="mt-6">
          <Button
            type="button"
            onClick={() => setOpenContractDialog(false)}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
          >
            إلغاء
          </Button>
          <Button
            type="button"
            onClick={formik.submitForm}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
          >
            {isLoadingAdd || isLoadingUpdate ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              </>
            ) : (
              "تأكيد"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default memo(ContractDialog);
