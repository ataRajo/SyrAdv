import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Share2,
  Upload,
  X,
  Loader2,
  ChevronUp,
  ChevronDown,
  FileText,
  Search,
  Image,
  Plus,
  Trash2,
  Download,
  FileImage
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  useGetBookingQuery,
  useUploadBookingPdfMutation,
} from "../../RtkQuery/Slice/Booking/BookingApi";
import jsPDF from "jspdf";

export default function CampaignsPage() {
  const { data: campaigns, isLoading, refetch } = useGetBookingQuery({});
  const [uploadPdf, { isLoading: isUploading }] = useUploadBookingPdfMutation();
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [sortField, setSortField] = useState("start_date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 20;

  // Filter by company name
  const filteredCampaigns = useMemo(() => {
    if (!campaigns) return [];
    
    if (!searchTerm.trim()) return campaigns;
    
    return campaigns.filter(booking => {
      const companyName = booking.customer?.company_name || booking.customer?.full_name || "";
      return companyName.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [campaigns, searchTerm]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!filteredCampaigns.length) return [];

    const sorted = [...filteredCampaigns].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === "start_date" || sortField === "end_date") {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      
      if (sortField === "customer.company_name") {
        aVal = a.customer?.company_name || a.customer?.full_name || "";
        bVal = b.customer?.company_name || b.customer?.full_name || "";
      }
      
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredCampaigns, sortField, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return sortedData.slice(start, end);
  }, [sortedData, currentPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const totalResults = filteredCampaigns.length;

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Handle share map link
  const handleShareMap = (campaignId) => {
    const mapLink = `https://tsyr.addresses.sy/public-map/${campaignId}`;
    navigator.clipboard.writeText(mapLink).then(() => {
      toast.success("تم نسخ رابط الخريطة! ✅", {
        duration: 2000,
      });
    }).catch(() => {
      window.open(mapLink, "_blank");
    });
  };

  // Handle open map
  const handleOpenMap = (campaignId) => {
    const mapLink = `https://tsyr.addresses.sy/public-map/${campaignId}`;
    window.open(mapLink, "_blank");
  };

  // Handle photo files selection
  const handlePhotoChange = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length !== files.length) {
      toast.error("الرجاء اختيار ملفات صور فقط");
    }
    
    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  // Remove selected photo
  const removePhoto = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Generate PDF from photos (NO TEXT VERSION)
  const generatePDFFromPhotos = async () => {
    if (selectedFiles.length === 0) {
      toast.error("الرجاء اختيار صور أولاً");
      return;
    }

    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        // Convert image to base64
        const imageDataUrl = await readFileAsDataURL(file);
        
        // Add new page for images after the first one
        if (i > 0) {
          pdf.addPage();
        }
        
        // Calculate image dimensions to fit page
        const imgProps = pdf.getImageProperties(imageDataUrl);
        const imgWidth = pageWidth - 20; // 10px margin on each side
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
        
        // Add image only - NO TEXT AT ALL
        pdf.addImage(imageDataUrl, 'JPEG', 10, 10, imgWidth, Math.min(imgHeight, pageHeight - 20));
      }
      
      // Download PDF
      const fileName = `photos_${format(new Date(), "yyyyMMdd_HHmmss")}.pdf`;
      pdf.save(fileName);
      
      toast.success("تم تحميل PDF بنجاح");
      
      // Upload PDF to server
      const pdfBlob = pdf.output('blob');
      const formData = new FormData();
      formData.append("pdf", pdfBlob, fileName);
      
      try {
        await uploadPdf({
          id: selectedCampaign.id,
          body: formData,
        }).unwrap();
        
        toast.success("تم حفظ PDF على السيرفر");
        refetch();
      } catch (error) {
        console.error("Upload error:", error);
        // PDF still downloaded locally even if upload fails
      }
      
      // Close modal and reset
      setShowPhotoModal(false);
      setSelectedFiles([]);
      setSelectedCampaign(null);
      
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("فشل في إنشاء PDF");
    }
  };

  // Helper function to read file as data URL
  const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  };

  // Handle PDF upload for existing PDF
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
    } else {
      toast.error("الرجاء رفع ملف PDF فقط");
    }
  };

  const handleUploadPdf = async () => {
    if (!selectedFile) {
      toast.error("الرجاء اختيار ملف PDF للرفع");
      return;
    }

    const formData = new FormData();
    formData.append("pdf", selectedFile);

    try {
      await uploadPdf({
        id: selectedCampaign.id,
        body: formData,
      }).unwrap();
      
      toast.success("تم رفع ملف PDF بنجاح");
      setShowUploadModal(false);
      setSelectedFile(null);
      refetch();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("فشل في رفع الملف");
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy");
  };

  // Sort icon component
  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronUp className="h-3 w-3 opacity-30" />;
    return sortDirection === "asc" ? 
      <ChevronUp className="h-3 w-3" /> : 
      <ChevronDown className="h-3 w-3" />;
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 rtl dark:bg-gray-900 dark:text-gray-100 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">الحملات</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          إدارة جميع الحملات الإعلانية - إجمالي: {campaigns?.length || 0} حملة
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="البحث باسم الشركة..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pr-10 pl-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {searchTerm && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            تم العثور على {totalResults} نتيجة
          </p>
        )}
      </div>

      {/* Table - Best for large data */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th 
                  className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => handleSort("customer.company_name")}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">اسم الشركة</span>
                    <SortIcon field="customer.company_name" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => handleSort("start_date")}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">من تاريخ</span>
                    <SortIcon field="start_date" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => handleSort("end_date")}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">إلى تاريخ</span>
                    <SortIcon field="end_date" />
                  </div>
                </th>
                <th className="px-4 py-3 text-right">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">عرض الخريطة</span>
                </th>
                <th className="px-4 py-3 text-right">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">الإعلان</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((campaign, index) => (
                <tr 
                  key={campaign.id}
                  className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50'
                  }`}
                >
                  {/* Company Name */}
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {campaign.customer?.company_name || campaign.customer?.full_name || "—"}
                    </div>
                  </td>
                  
                  {/* Start Date */}
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {formatDate(campaign.start_date)}
                    </div>
                   </td>
                  
                  {/* End Date */}
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {formatDate(campaign.end_date)}
                    </div>
                   </td>
                  
                  {/* Map Button */}
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenMap(campaign.id)}
                        className="gap-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        <Eye className="h-3 w-3" />
                        عرض
                      </Button>
                    </div>
                   </td>
                  
                  {/* Photos Button */}
                  <td className="px-4 py-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCampaign(campaign);
                        setSelectedFiles([]);
                        setShowPhotoModal(true);
                      }}
                      className="gap-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <FileImage className="h-3 w-3" />
                      إضافة صور
                    </Button>
                   </td>
                </tr>
              ))}
            </tbody>
           </table>
        </div>

        {/* Empty State */}
        {paginatedData.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? "لا توجد نتائج مطابقة للبحث" : "لا توجد حملات حالياً"}
            </p>
          </div>
        )}

        {/* Pagination - Only show if multiple pages */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              صفحة {currentPage} من {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="dark:border-gray-600 dark:text-gray-300"
              >
                السابقة
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="dark:border-gray-600 dark:text-gray-300"
              >
                التالية
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Photo Upload Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
              <h3 className="text-lg font-semibold dark:text-white">إضافة صور للإعلان</h3>
              <button
                onClick={() => {
                  setShowPhotoModal(false);
                  setSelectedFiles([]);
                  setSelectedCampaign(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                إضافة صور لحملة: <span className="font-semibold dark:text-white">{selectedCampaign?.customer?.company_name}</span>
              </p>

              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center mb-4">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoChange}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Image className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    اختر صور متعددة
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    JPG, PNG, GIF
                  </span>
                </label>
              </div>

              {/* Selected Images Preview */}
              {selectedFiles.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    الصور المختارة ({selectedFiles.length})
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`صورة ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                        />
                        <button
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                          {file.name}
                        </p>
                      </div>
                    ))}
                    
                    {/* Add More Button */}
                    <label
                      htmlFor="photo-upload"
                      className="cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center h-32 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Plus className="h-8 w-8 text-gray-400" />
                      <span className="text-xs text-gray-400 mt-1">إضافة المزيد</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 p-4 border-t dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPhotoModal(false);
                  setSelectedFiles([]);
                  setSelectedCampaign(null);
                }}
                className="flex-1 dark:border-gray-600 dark:text-gray-300"
              >
                إلغاء
              </Button>
              <Button
                onClick={generatePDFFromPhotos}
                disabled={selectedFiles.length === 0}
                className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                <Download className="h-4 w-4 ml-2" />
                تحميل كـ PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}