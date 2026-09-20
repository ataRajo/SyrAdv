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
import { useGetOffersQuery, useAssignOfferToCustomerMutation } from "../../RtkQuery/Slice/Offers/offersApiSlice";
import { useSendWhatsappMessageMutation } from "../../RtkQuery/Slice/Whatsapp/WhatsappApi";
import toast from "react-hot-toast";

// Country codes data
const countryCodes = [
  { code: "+90", name: "تركيا", flag: "🇹🇷" },
  { code: "+963", name: "سوريا", flag: "🇸🇾" },
  { code: "+20", name: "مصر", flag: "🇪🇬" },
  { code: "+964", name: "العراق", flag: "🇮🇶" },
  { code: "+966", name: "السعودية", flag: "🇸🇦" },
  { code: "+971", name: "الإمارات", flag: "🇦🇪" },
  { code: "+965", name: "الكويت", flag: "🇰🇼" },
  { code: "+974", name: "قطر", flag: "🇶🇦" },
  { code: "+973", name: "البحرين", flag: "🇧🇭" },
  { code: "+968", name: "عمان", flag: "🇴🇲" },
  { code: "+962", name: "الأردن", flag: "🇯🇴" },
  { code: "+961", name: "لبنان", flag: "🇱🇧" },
  { code: "+970", name: "فلسطين", flag: "🇵🇸" },
  { code: "+218", name: "ليبيا", flag: "🇱🇾" },
  { code: "+216", name: "تونس", flag: "🇹🇳" },
  { code: "+213", name: "الجزائر", flag: "🇩🇿" },
  { code: "+212", name: "المغرب", flag: "🇲🇦" },
  { code: "+249", name: "السودان", flag: "🇸🇩" },
  { code: "+967", name: "اليمن", flag: "🇾🇪" },
  { code: "+1", name: "الولايات المتحدة", flag: "🇺🇸" },
  { code: "+44", name: "المملكة المتحدة", flag: "🇬🇧" },
  { code: "+49", name: "ألمانيا", flag: "🇩🇪" },
  { code: "+33", name: "فرنسا", flag: "🇫🇷" },
  { code: "+39", name: "إيطاليا", flag: "🇮🇹" },
  { code: "+31", name: "هولندا", flag: "🇳🇱" },
  { code: "+46", name: "السويد", flag: "🇸🇪" },
  { code: "+47", name: "النرويج", flag: "🇳🇴" },
  { code: "+45", name: "الدنمارك", flag: "🇩🇰" },
  { code: "+358", name: "فنلندا", flag: "🇫🇮" },
  { code: "+48", name: "بولندا", flag: "🇵🇱" },
  { code: "+40", name: "رومانيا", flag: "🇷🇴" },
  { code: "+359", name: "بلغاريا", flag: "🇧🇬" },
  { code: "+30", name: "اليونان", flag: "🇬🇷" },
  { code: "+357", name: "قبرص", flag: "🇨🇾" },
  { code: "+98", name: "إيران", flag: "🇮🇷" },
  { code: "+92", name: "باكستان", flag: "🇵🇰" },
  { code: "+91", name: "الهند", flag: "🇮🇳" },
  { code: "+880", name: "بنغلاديش", flag: "🇧🇩" },
  { code: "+60", name: "ماليزيا", flag: "🇲🇾" },
  { code: "+62", name: "إندونيسيا", flag: "🇮🇩" },
];

const ContactCustomerModal = ({
  open,
  onClose,
  customerId,
  customerName,
  companyName,
  phoneNumber,
}) => {
  const [formData, setFormData] = useState({
    companyName: companyName || "",
    message: "",
    roadsigns: "",
    selectedOffer: "",
    countryCode: "+963", // Default country code (Syria)
    phone: phoneNumber || "", // Raw phone number without country code
  });

  const { data: offersData, isLoading: isOffersLoading } = useGetOffersQuery({
    active: true,
  });

  const [assignOffer, { isLoading: isAssigning }] = useAssignOfferToCustomerMutation();
  const [sendWhatsappMessage, { isLoading: isSendingWhatsapp }] = useSendWhatsappMessageMutation();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSendWhatsApp = async () => {
    // First: assign offer to customer via API
    if (formData.selectedOffer && customerId) {
      try {
        await assignOffer({
          offerId: formData.selectedOffer,
          customerId: customerId,
        }).unwrap();
        toast.success("تم تعيين العرض للعميل بنجاح");
      } catch (err) {
        toast.error(err?.message || "فشل في تعيين العرض");
        return; // Don't send WhatsApp if assignment failed
      }
    }

    // Clean phone number and combine with country code
    let cleanPhone = formData.phone.replace(/\D/g, ""); // Remove all non-digits
    const countryCodeNumber = formData.countryCode.replace("+", ""); // Remove + from country code
    
    // Remove leading zeros from phone number
    cleanPhone = cleanPhone.replace(/^0+/, "");
    
    // Combine country code with phone number
    const fullPhoneNumber = countryCodeNumber + cleanPhone;

    const selectedOfferObj = offersData?.offers?.find(
      (o) => o.id === Number(formData.selectedOffer)
    );

    const offerText = selectedOfferObj
      ? `\n\n📋 العرض: ${selectedOfferObj.offer_name}\n💰 السعر: ${selectedOfferObj.offer_price} $\n📅 من: ${selectedOfferObj.from_date}\n📅 إلى: ${selectedOfferObj.to_date}`
      : "";

    const fullMessage = `السادة شركة ${formData.companyName} المحترمين\n\n${formData.message}\n\nنرفق لكم عرض باللوحات التالية: ${formData.roadsigns}${offerText}`;

    // إرسال تلقائي عبر الباك-إند (WAHA) بدل فتح واتساب يدويًا - نفس نص
    // الرسالة الذي كان يُبنى أعلاه تمامًا بلا أي تغيير.
    try {
      const result = await sendWhatsappMessage({
        phoneNumber: fullPhoneNumber,
        message: fullMessage,
      }).unwrap();
      toast.success(result?.message || "تم إرسال الرسالة عبر واتساب بنجاح");
    } catch (err) {
      toast.error(err?.message || "فشل في إرسال الرسالة عبر واتساب");
      return; // لا تُغلق النافذة أو تُصفّر الحقول إن فشل الإرسال
    }

    setFormData({
      companyName: companyName || "",
      message: "",
      roadsigns: "",
      selectedOffer: "",
      countryCode: "+963",
      phone: phoneNumber || "",
    });
    onClose();
  };

  const handleClose = () => {
    setFormData({
      companyName: companyName || "",
      message: "",
      roadsigns: "",
      selectedOffer: "",
      countryCode: "+963",
      phone: phoneNumber || "",
    });
    onClose();
  };

  const isSubmitting = isAssigning || isSendingWhatsapp;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] rtl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
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
          {/* Company Name */}
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
              className="w-full bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Phone Number with Country Code */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              رقم الهاتف <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              {/* Country Code Selector */}
              <select
                id="countryCode"
                name="countryCode"
                value={formData.countryCode}
                onChange={handleChange}
                className="w-1/3 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {countryCodes.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.code} - {country.name}
                  </option>
                ))}
              </select>
              
              {/* Phone Number Input */}
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="أدخل رقم الهاتف"
                className="flex-1 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                dir="ltr"
              />
            </div>
            {formData.phone && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                الرقم الكامل: <strong dir="ltr">{formData.countryCode} {formData.phone}</strong>
              </p>
            )}
          </div>

          {/* Offer Select Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="selectedOffer" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              اختر العرض <span className="text-red-500">*</span>
            </Label>
            <select
              id="selectedOffer"
              name="selectedOffer"
              value={formData.selectedOffer}
              onChange={handleChange}
              disabled={isOffersLoading}
              className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- اختر عرض --</option>
              {isOffersLoading ? (
                <option disabled>جاري التحميل...</option>
              ) : (
                offersData?.offers?.map((offer) => (
                  <option key={offer.id} value={offer.id}>
                    {offer.offer_name} - {offer.offer_price}$ ({offer.from_date} → {offer.to_date})
                  </option>
                ))
              )}
            </select>
            {isOffersLoading && (
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Icon icon="mdi:loading" className="animate-spin" />
                جاري تحميل العروض...
              </p>
            )}
          </div>

          {/* Message */}
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
              rows={4}
              className="w-full resize-none bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Road Signs */}
          <div className="space-y-2">
            <Label htmlFor="roadsigns" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              اللوحات
            </Label>
            <Textarea
              id="roadsigns"
              name="roadsigns"
              value={formData.roadsigns}
              onChange={handleChange}
              placeholder="اكتب اللوحات هنا..."
              rows={3}
              className="w-full resize-none bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <Icon icon="mdi:information" className="inline-block mr-1" />
              سيتم تعيين العرض للعميل ثم إرسال الرسالة تلقائيًا عبر واتساب
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            className="gap-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
          >
            <Icon icon="mdi:close" />
            إلغاء
          </Button>
          <Button
            onClick={handleSendWhatsApp}
            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
            disabled={
              !formData.message.trim() || 
              !formData.phone.trim() || 
              !formData.selectedOffer || 
              isSubmitting
            }
          >
            {isSubmitting ? (
              <Icon icon="mdi:loading" className="animate-spin" />
            ) : (
              <Icon icon="mdi:send" />
            )}
            إرسال عبر واتساب
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContactCustomerModal;