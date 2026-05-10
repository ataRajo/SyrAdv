import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Icon } from "@iconify/react";

const ContactCustomerModal = ({
  open,
  onClose,
  customerName,
  companyName,
  phoneNumber,
}) => {
  const [formData, setFormData] = useState({
    companyName: companyName || "",
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSendWhatsApp = () => {
    // Clean the phone number - remove all non-digit characters
    let cleanPhone = phoneNumber ? phoneNumber.replace(/\D/g, "") : "";
    
    // Remove leading zeros if present
    cleanPhone = cleanPhone.replace(/^0+/, "");
    
    // Add country code if not present (assuming Syria +963)
    // Adjust this based on your needs
    if (!cleanPhone.startsWith("963")) {
      cleanPhone = "963" + cleanPhone;
    }
    
    const fullMessage = `السادة شركة ${formData.companyName} المحترمين\n\n${formData.message}`;
    
    const encodedMessage = encodeURIComponent(fullMessage);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    
    console.log("WhatsApp URL:", whatsappUrl); // Debug log
    console.log("Clean Phone:", cleanPhone); // Debug log
    
    // Open in new tab
    window.open(whatsappUrl, "_blank");
    
    // Reset form and close modal
    setFormData({ companyName: companyName || "", message: "" });
    onClose();
  };

  const handleClose = () => {
    setFormData({ companyName: companyName || "", message: "" });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icon icon="mdi:whatsapp" className="text-green-500 text-2xl" />
            مراسلة العميل عبر واتساب
          </DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-gray-400">
            {customerName && (
              <span>
                إرسال رسالة إلى: <strong>{customerName}</strong>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="companyName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              اسم الشركة
            </Label>
            <Input
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="أدخل اسم الشركة"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              نص الرسالة
            </Label>
            <Textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="اكتب رسالتك هنا..."
              rows={5}
              className="w-full resize-none"
            />
          </div>

          {phoneNumber && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <Icon icon="mdi:phone" className="text-blue-500" />
              <span>سيتم الإرسال إلى: <strong dir="ltr">{phoneNumber}</strong></span>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <Icon icon="mdi:information" className="inline-block mr-1" />
              سيتم فتح محادثة واتساب مع الرسالة جاهزة للإرسال
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            className="gap-2"
          >
            <Icon icon="mdi:close" />
            إلغاء
          </Button>
          <Button
            onClick={handleSendWhatsApp}
            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
            disabled={!formData.message.trim() || !phoneNumber}
          >
            <Icon icon="mdi:send" />
            إرسال عبر واتساب
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContactCustomerModal;