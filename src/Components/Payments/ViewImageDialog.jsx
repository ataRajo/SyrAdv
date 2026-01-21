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
  // The imageUrl should be taken directly from payment.payment_image
  // It already contains the full URL from the API response
  const imageUrl = payment?.payment_image || imageURL;

  const handleDownload = () => {
    if (!imageUrl || imageUrl === imageURL) {
      showToast("error", "لا توجد صورة لتنزيلها.");
      return;
    }
    
    try {
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = `payment_${payment?.payment_number || "image"}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("success", "تم تنزيل الصورة بنجاح.");
    } catch (error) {
      console.error("Download failed:", error);
      showToast("error", "فشل تنزيل الصورة.");
    }
  };

  const handleMaximize = () => {
    if (!imageUrl || imageUrl === imageURL) {
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
              <span>{payment?.customer?.company_name ?? payment?.customer_id ?? "-"}</span>
            </div>
            <div className="truncate">
              <strong className="ml-2">رقم الحجز:</strong>
              <span>{payment?.booking_id ?? "-"}</span>
            </div>
            <div className="col-span-full break-words">
              <strong className="ml-2">تاريخ الإنشاء:</strong>
              <span>
                {payment?.created_at ? new Date(payment.created_at).toLocaleString() : "-"}
              </span>
            </div>
          </div>
        </div>

        {/* Image */}
        <div className="flex flex-col items-center py-4">
          {imageUrl && imageUrl !== imageURL ? (
            <div className="w-full flex flex-col items-center">
              <img
                src={imageUrl}
                alt={`صورة الدفعة رقم ${payment?.payment_number || ""}`}
                className="max-w-full md:max-w-[80%] max-h-[400px] rounded-md object-contain bg-white"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = imageURL;
                  toast.error("تعذر تحميل الصورة.");
                }}
              />
              <p className="text-sm text-gray-500 mt-2">
                {imageUrl.includes('192.168.1.222') ? '' : 'Image from server'}
              </p>
            </div>
          ) : (
            <div className="w-full h-48 flex flex-col items-center justify-center bg-gray-100 text-gray-500 rounded-md border border-dashed">
              <div>لا توجد صورة متوفرة لهذه الدفعة.</div>
              <div className="mt-2">
                <img
                  src={imageURL}
                  alt="صورة افتراضية"
                  className="w-32 h-auto object-contain"
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions - Only show if there's an actual payment image */}
        {imageUrl && imageUrl !== imageURL && (
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={handleDownload} variant="outline">
              <Download className="mr-2 h-4 w-4" /> تنزيل
            </Button>
            <Button onClick={handleMaximize} variant="outline">
              <Maximize className="mr-2 h-4 w-4" /> تكبير
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};