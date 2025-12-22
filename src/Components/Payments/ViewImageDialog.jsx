import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Maximize } from "lucide-react";
import { toast } from "sonner";
import { showToast } from "../../utils/Notifictions/showToast";
import imageURL from "../../../src/assets/images/adv_syrian.png";

export const ViewImageDialog = ({ show, handleClose, payment }) => {
  const imageUrl = payment?.payment_image || imageURL;

  const handleDownload = () => {
    if (!imageUrl) {
      showToast("error", "لا توجد صورة لتنزيلها.");
      return;
    }
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `payment_${payment?.payment_number || "image"}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("success", "تم تنزيل الصورة بنجاح.");
  };

  const handleMaximize = () => {
    if (!imageUrl) {
      showToast("error", "لا توجد صورة لتكبيرها.");
      return;
    }
    window.open(imageUrl, "_blank");
  };

  if (!payment) {
    return (
      <Dialog open={!!show} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[425px] md:max-w-xl lg:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-right">عرض صورة الدفعة</DialogTitle>
            <DialogDescription className="text-right">لا توجد دفعة محددة</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={!!show} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] overflow-auto max-h-[80vh] md:max-w-xl lg:max-w-3xl">
        <DialogHeader>
          <div className="flex items-center justify-between w-full gap-3">
            <div className="text-right">
              <DialogTitle className="text-right">عرض صورة الدفعة</DialogTitle>
              <DialogDescription className="text-right">
                صورة الدفعة رقم: {payment?.payment_number || "غير متوفر"}
              </DialogDescription>
            </div>

            <div className="flex items-center">
              <img
                src={imageURL}
                alt="اعلان"
                className="w-20 h-12 object-cover rounded-md hidden sm:block"
              />
            </div>
          </div>
        </DialogHeader>

        {/* Details: responsive RTL grid */}
        <div className="px-4 text-right">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
            <div className="truncate">
              <strong className="ml-2">رقم الدفعة:</strong>
              <span>{payment?.payment_number ?? "-"}</span>
            </div>
            <div className="truncate">
              <strong className="ml-2">المبلغ المدفوع:</strong>
              <span>{payment?.paid ?? "-"}</span>
            </div>
            <div className="truncate">
              <strong className="ml-2">الزبون:</strong>
              <span>{payment?.customer_name ?? payment?.customer_id ?? "-"}</span>
            </div>
            <div className="truncate">
              <strong className="ml-2">رقم الحجز:</strong>
              <span>{payment?.booking_id ?? "-"}</span>
            </div>
            <div className="col-span-full break-words">
              <strong className="ml-2">ملاحظة:</strong>
              <span>{payment?.note ?? "-"}</span>
            </div>
            <div className="truncate">
              <strong className="ml-2">تاريخ الإنشاء:</strong>
              <span>
                {payment?.created_at ? new Date(payment.created_at).toLocaleString() : "-"}
              </span>
            </div>
            <div className="truncate">
              {/*
              

              <strong className="ml-2">حالة الاستلام:</strong>
              <span>{payment?.received ? "مستلمة" : "غير مستلمة"}</span>

              */}
            </div>
          </div>
        </div>

        {/* Image */}
        <div className="flex flex-col items-center py-4">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`صورة الدفعة رقم ${payment?.payment_number || ""}`}
              className="max-w-full md:max-w-[60%] h-auto rounded-md object-contain bg-white"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = imageURL;
                toast.error("تعذر تحميل الصورة.");
              }}
            />
          ) : (
            <div className="w-full h-48 flex items-center justify-center bg-gray-100 text-gray-500 rounded-md border border-dashed">
              لا توجد صورة متوفرة لهذه الدفعة.
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={handleDownload} disabled={!imageUrl} variant="outline">
            <Download className="mr-2 h-4 w-4" /> تنزيل
          </Button>
          <Button onClick={handleMaximize} disabled={!imageUrl} variant="outline">
            <Maximize className="mr-2 h-4 w-4" /> تكبير
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
