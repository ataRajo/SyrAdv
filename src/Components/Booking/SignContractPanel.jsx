import React, { useState } from "react";
import { FileSignature, Upload, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useSignContractMutation } from "../../RtkQuery/Slice/Booking/BookingApi";

/**
 * توثيق توقيع العقد (طلب صريح من العميل): "Issued contracts must be signed
 * by the client before execution... we capture an image of the signed
 * contract and upload it; the contract is only processed once the image of
 * the signed document has been uploaded". هذه اللوحة مساحة مخصَّصة لرفع
 * صورة المستند الموقَّع + مربّع تأكيد - الضغط على "توثيق التوقيع" هو فعليًا
 * التأكيد نفسه (يستدعي BookingController::signContract() مباشرة مع
 * الصورة معًا؛ لا حقل "موقَّع" منفصل يُرسَل بلا صورة).
 *
 * طالما لم يُوثَّق التوقيع: لا تُنشأ أوامر الفك/التركيب ولا يُطبَّق الرصيد
 * على العميل (راجع BookingService على الباك-إند) - حتى لو كان العقد
 * "دائم" ومُعتمَدًا بالفعل. هذه اللوحة توضّح ذلك صراحةً للموظف بدل ترك ذلك
 * ضمنيًا.
 */
const SignContractPanel = ({ bookingId, bookingData }) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [signContract, { isLoading: isSigning }] = useSignContractMutation();

  const isPermanent = Number(bookingData?.type) === 2; // BookingType::PERMANENT
  const isSigned = Boolean(bookingData?.is_signed);

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      toast.error("يرجى اختيار ملف صورة فقط (jpg/png وما شابه)");
      return;
    }
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const canSubmit = Boolean(file) && confirmChecked && !isSigning;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      const formData = new FormData();
      formData.append("image", file);
      await signContract({ id: bookingId, body: formData }).unwrap();
      toast.success("تم توثيق توقيع العقد بنجاح");
      setFile(null);
      setPreviewUrl(null);
      setConfirmChecked(false);
    } catch (error) {
      toast.error(error?.data?.message || "تعذّر توثيق توقيع العقد، حاول مجددًا");
    }
  };

  if (isSigned) {
    return (
      <div className="max-w-6xl mx-auto mb-6 p-4 bg-white rounded-xl shadow-sm border border-emerald-200 flex flex-col md:flex-row justify-between items-center gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle2 size={24} /></div>
          <div>
            <p className="font-bold text-gray-800">العقد موقَّع وموثَّق</p>
            {bookingData?.signed_at && (
              <p className="text-xs text-gray-500 mt-0.5">
                تاريخ التوثيق: {new Date(bookingData.signed_at).toLocaleString("ar-SY")}
              </p>
            )}
          </div>
        </div>
        {bookingData?.signed_contract_image && (
          <Button asChild variant="outline" className="rounded-xl gap-2">
            <a href={bookingData.signed_contract_image} target="_blank" rel="noopener noreferrer">
              عرض صورة العقد الموقَّع
            </a>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mb-6 p-4 bg-white rounded-xl shadow-sm border border-amber-200 no-print">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><FileSignature size={24} /></div>
        <div>
          <p className="font-bold text-gray-800">العقد بانتظار توثيق التوقيع</p>
          <p className="text-xs text-amber-700 mt-0.5 flex items-center gap-1">
            <AlertTriangle size={14} />
            {isPermanent
              ? "طالما لم تُرفع صورة العقد الموقَّع: لن تُنشأ أوامر فك/تركيب اللوحات ولن يُطبَّق الرصيد على العميل."
              : "يمكن توثيق التوقيع الآن أو لاحقًا عند تحويل الحجز إلى عقد دائم."}
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
        <label className="flex-1 w-full">
          <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" id={`sign-contract-file-${bookingId}`} />
          <Button asChild variant="outline" className="rounded-xl gap-2 w-full md:w-auto">
            <label htmlFor={`sign-contract-file-${bookingId}`} className="cursor-pointer flex items-center gap-2">
              <Upload size={18} /> {file ? file.name : "اختيار صورة العقد الموقَّع"}
            </label>
          </Button>
        </label>

        {previewUrl && (
          <img src={previewUrl} alt="معاينة صورة العقد الموقَّع" className="h-16 w-16 object-cover rounded-lg border border-gray-200" />
        )}

        <label className="flex items-center gap-2 text-sm text-gray-700 select-none">
          <input
            type="checkbox"
            checked={confirmChecked}
            onChange={(e) => setConfirmChecked(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          أؤكد استلام العقد موقَّعًا من العميل
        </label>

        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 disabled:opacity-50 w-full md:w-auto"
        >
          {isSigning ? (<><Loader2 size={18} className="animate-spin" /> جارٍ التوثيق...</>) : (<><CheckCircle2 size={18} /> توثيق التوقيع</>)}
        </Button>
      </div>
    </div>
  );
};

export default SignContractPanel;
