import React, { useState } from "react";
import { FolderOpen, Upload, Loader2, FileText, ImageIcon, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import {
  useGetContractDocumentsQuery,
  useUploadContractDocumentMutation,
  useDeleteContractDocumentMutation,
} from "../../RtkQuery/Slice/Booking/BookingApi";

/**
 * "مستودع موحَّد لمستندات العقد" (طلب صريح: "a centralized repository for
 * contract-related documentation to ensure easy access from a single
 * location... invoice images, signed and unsigned contract copies, and any
 * other associated documents or PDFs"). يجمع في مكان واحد: العقد الموقَّع
 * ونسخته المولَّدة (للعرض فقط، تُدارا من SignContractPanel/زر توليد العقد)
 * + أي مستند آخر يرفعه الموظف يدويًا (صورة فاتورة، نسخة إضافية، PDF آخر) -
 * راجع BookingDocumentController::documents()/storeDocument().
 */
const DOCUMENT_TYPE_OPTIONS = [
  { value: "invoice_image", label: "صورة فاتورة" },
  { value: "unsigned_contract_copy", label: "نسخة عقد غير موقَّعة" },
  { value: "other", label: "مستند آخر" },
];

const ContractDocumentsPanel = ({ bookingId }) => {
  const { data, isLoading } = useGetContractDocumentsQuery(bookingId, { skip: !bookingId });
  const [uploadDocument, { isLoading: isUploading }] = useUploadContractDocumentMutation();
  const [deleteDocument, { isLoading: isDeleting }] = useDeleteContractDocumentMutation();

  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] = useState("invoice_image");
  const [label, setLabel] = useState("");

  const documents = data?.data || [];

  const handleFileSelect = (e) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("يرجى اختيار ملف أولًا");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("document_type", documentType);
      if (label) formData.append("label", label);

      await uploadDocument({ id: bookingId, body: formData }).unwrap();
      toast.success("تم رفع المستند بنجاح");
      setFile(null);
      setLabel("");
    } catch (error) {
      toast.error(error?.data?.message || "تعذّر رفع المستند، حاول مجددًا");
    }
  };

  const handleDelete = async (mediaId) => {
    try {
      await deleteDocument({ id: bookingId, mediaId }).unwrap();
      toast.success("تم حذف المستند");
    } catch (error) {
      toast.error(error?.data?.message || "تعذّر حذف المستند");
    }
  };

  return (
    <div className="max-w-6xl mx-auto mb-6 p-4 bg-white rounded-xl shadow-sm border border-gray-200 no-print">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FolderOpen size={24} /></div>
        <div>
          <p className="font-bold text-gray-800">مستندات العقد</p>
          <p className="text-xs text-gray-500 mt-0.5">
            كل الملفات المتعلقة بهذا العقد في مكان واحد - العقد الموقَّع، نسخته، صور الفواتير، وأي مستند آخر.
          </p>
        </div>
      </div>

      {/* رفع مستند جديد */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-2 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
        <label className="w-full md:w-auto">
          <input type="file" onChange={handleFileSelect} className="hidden" id={`contract-doc-file-${bookingId}`} />
          <Button asChild variant="outline" size="sm" className="rounded-lg gap-2 w-full md:w-auto">
            <label htmlFor={`contract-doc-file-${bookingId}`} className="cursor-pointer flex items-center gap-2">
              <Upload size={16} /> {file ? file.name : "اختيار ملف"}
            </label>
          </Button>
        </label>

        <select
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          className="text-sm rounded-lg border border-gray-300 px-2 py-1.5 w-full md:w-auto"
        >
          {DOCUMENT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="وصف مختصر (اختياري)"
          className="text-sm rounded-lg border border-gray-300 px-2 py-1.5 flex-1 w-full md:w-auto"
        />

        <Button
          onClick={handleUpload}
          disabled={!file || isUploading}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg gap-2 disabled:opacity-50 w-full md:w-auto"
        >
          {isUploading ? (<><Loader2 size={16} className="animate-spin" /> جارٍ الرفع...</>) : "رفع"}
        </Button>
      </div>

      {/* قائمة المستندات */}
      {isLoading ? (
        <div className="text-sm text-gray-500 flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> جارٍ التحميل...</div>
      ) : documents.length === 0 ? (
        <div className="text-sm text-gray-400 text-center py-4">لا توجد مستندات مرفوعة بعد</div>
      ) : (
        <div className="divide-y divide-gray-100">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between gap-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                {doc.type === "invoice_image" || doc.type === "signed_contract" ? (
                  <ImageIcon size={18} className="text-gray-400 shrink-0" />
                ) : (
                  <FileText size={18} className="text-gray-400 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{doc.label}</p>
                  <p className="text-xs text-gray-400">
                    {doc.type_label}
                    {doc.uploaded_at ? ` - ${new Date(doc.uploaded_at).toLocaleDateString("ar-SY")}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" title="فتح المستند">
                    <ExternalLink size={16} />
                  </a>
                </Button>
                {doc.removable && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    disabled={isDeleting}
                    onClick={() => handleDelete(doc.id)}
                    title="حذف المستند"
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContractDocumentsPanel;
