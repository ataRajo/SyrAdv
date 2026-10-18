import { useState } from "react";
import { getPublicMapUrl } from "../../Api/baseUrl";
import { useNavigate } from "react-router";
import {
  Calendar,
  User,
  MapPin,
  Eye,
  Plus,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  ClipboardList,
  ArrowLeft,
  Printer,
  DollarSign,
  Minus,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BrokerNavbar } from "../../Components/Broker/BrokerNavbar";
import { useBrokerBookings } from "../../Hooks/useBrokerBookings";
import { toast } from "sonner";

const STATUS_MAP = {
  1: { label: "نشط", color: "bg-green-600" },
  2: { label: "معلق", color: "bg-yellow-600" },
  3: { label: "منتهي", color: "bg-gray-600" },
  4: { label: "ملغي", color: "bg-red-600" },
};

const APPROVE_STATUS_MAP = {
  1: { label: "مقبول", color: "bg-green-600" },
  2: { label: "قيد المراجعة", color: "bg-yellow-600" },
  3: { label: "مرفوض", color: "bg-red-600" },
};

// ShareMapButton Component for the modal
const ShareMapButton = ({ bookingId }) => {
  const handleOpenMap = () => {
    const mapLink = getPublicMapUrl(bookingId);
    console.log("Opening map link:", mapLink);
    
    // Try multiple methods for mobile compatibility
    try {
      // Method 1: Try to open in same tab (more reliable on mobile)
      window.location.href = mapLink;
    } catch (err) {
      console.error("Error opening map:", err);
      // Method 2: Fallback to alert with link
      alert(`رابط الخريطة: ${mapLink}\nالرجاء نسخ الرابط وفتحه في المتصفح`);
    }
  };

  const handleCopyLink = () => {
    const mapLink = getPublicMapUrl(bookingId);
    
    navigator.clipboard.writeText(mapLink).then(() => {
      toast.success("تم نسخ رابط الخريطة! ✅", {
        description: "يمكنك مشاركة الرابط مع الآخرين",
        duration: 3000,
      });
    }).catch(() => {
      alert(`رابط الخريطة: ${mapLink}`);
    });
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
        onClick={handleOpenMap}
        title="عرض الخريطة"
      >
        <Share2 className="h-4 w-4 ml-1" />
        مشاركة
      </Button>
    </div>
  );
};

export function BrokerBookings() {
  const navigate = useNavigate();
  const {
    bookings,
    pagination,
    isLoading,
    error,
    filters,
    handleFilterChange,
    handlePageChange,
    clearFilters,
  } = useBrokerBookings();

  // Modal state
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return "غير محدد";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ar-SY");
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status) => {
    const config = STATUS_MAP[status] || { label: "غير معروف", color: "bg-gray-500" };
    return <Badge className={`${config.color} text-white`}>{config.label}</Badge>;
  };

  const getApproveBadge = (status) => {
    const config = APPROVE_STATUS_MAP[status] || { label: "غير معروف", color: "bg-gray-500" };
    return <Badge className={`${config.color} text-white`}>{config.label}</Badge>;
  };

  const handleViewBooking = (booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedBooking(null), 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <BrokerNavbar />

      <div className="pt-16 pb-8">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Error State */}
          {error && (
            <Card className="bg-red-500/10 border-red-500/30 mb-6">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 text-red-400">
                  <AlertCircle className="h-6 w-6" />
                  <div>
                    <p className="font-semibold">خطأ في تحميل البيانات</p>
                    <p className="text-sm">{error.message || "حدث خطأ غير متوقع"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
              <p className="text-gray-400">جاري تحميل الحجوزات...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && bookings.length === 0 && (
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-12 text-center">
                <ClipboardList className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">لا توجد حجوزات</h3>
                <p className="text-gray-400 mb-6">لم يتم العثور على أي حجوزات مطابقة للفلاتر المحددة</p>
                <Button
                  onClick={() => navigate("/broker/bookings/create")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  إنشاء حجز جديد
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Bookings List */}
          {!isLoading && !error && bookings.length > 0 && (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <Card
                  key={booking.id}
                  className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/15 transition-colors"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Booking Info */}
                      <div className="flex-1">
                        {/* ID + Status Row */}
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                          <button
                            onClick={() => handleViewBooking(booking)}
                            className="text-xl font-bold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                            title="انقر لعرض تفاصيل الحجز"
                          >
                            #{booking.id}
                          </button>
                          {getStatusBadge(booking.status)}
                          {getApproveBadge(booking.approvement_status)}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center gap-2 text-gray-300">
                            <User className="h-4 w-4 text-blue-400" />
                            <span>
                              العميل: {booking.customer?.full_name || booking.customer?.username || `عميل #${booking.customer_id}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <Calendar className="h-4 w-4 text-blue-400" />
                            <span>
                              الفترة: {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <MapPin className="h-4 w-4 text-blue-400" />
                            <span>
                              اللوحات: {booking.roadsigns?.length || 0} لوحة
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-green-400">
                              {booking.total_price?.toLocaleString() || 0}$
                            </span>
                            <span className="text-sm text-gray-500">
                              (المتبقي: {booking.remaining?.toLocaleString() || 0})
                            </span>
                          </div>
                        </div>

                        {booking.printing && (
                          <div className="mt-3 text-sm text-gray-400 border-t border-white/10 pt-3">
                            الطباعة: {booking.printing.type} - {booking.printing.price}$
                          </div>
                        )}

                        {booking.notes && (
                          <p className="text-gray-400 text-sm mt-2">
                            ملاحظات: {booking.notes}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end lg:w-32">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-white/30 text-white hover:bg-white/10"
                          onClick={() => handleViewBooking(booking)}
                        >
                          <Eye className="h-4 w-4 ml-2" />
                          عرض
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage <= 1}
                    className="border-white/30 text-white hover:bg-white/10 disabled:opacity-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <span className="text-gray-300">
                    صفحة {pagination.currentPage} من {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage >= pagination.totalPages}
                    className="border-white/30 text-white hover:bg-white/10 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Booking Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="bg-slate-900 border-white/20 text-white max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0">
          {selectedBooking && (
            <>
              {/* Modal Header */}
              <DialogHeader className="p-6 pb-4 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
                    <span className="text-blue-400">#{selectedBooking.id}</span>
                   <div className="flex flex-col gap-2">
  <div className="flex gap-2">
    {getStatusBadge(selectedBooking.status)}
    {getApproveBadge(selectedBooking.approvement_status)}
  </div>
  {/* Show reject reason when status is 3 (rejected) */}
  {selectedBooking.approvement_status === 3 && selectedBooking.reject_reason && (
    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mt-2">
      <p className="text-red-400 text-sm font-medium">سبب الرفض:</p>
      <p className="text-red-300 text-sm">{selectedBooking.reject_reason}</p>
    </div>
  )}
</div>
                  </DialogTitle>
                  
                  {/* Share Button in Modal Header */}
                  <ShareMapButton bookingId={selectedBooking.id} />
                </div>
                <p className="text-gray-400 text-sm mt-1">
                  تم الإنشاء: {formatDate(selectedBooking.created_at)}
                </p>
              </DialogHeader>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Customer Info */}
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-white flex items-center gap-2 text-base">
                        <User className="h-4 w-4 text-blue-400" />
                        معلومات العميل
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">الاسم:</span>
                        <span className="text-white">
                          {selectedBooking.customer?.full_name || selectedBooking.customer?.username || "غير محدد"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">الشركة:</span>
                        <span className="text-white">{selectedBooking.customer?.company_name || "غير محدد"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">الهاتف:</span>
                        <span className="text-white" dir="ltr">
                          {selectedBooking.customer?.phone_number || "غير محدد"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Dates */}
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-white flex items-center gap-2 text-base">
                        <Calendar className="h-4 w-4 text-blue-400" />
                        فترة الحجز
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">من:</span>
                        <span className="text-white">{formatDate(selectedBooking.start_date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">إلى:</span>
                        <span className="text-white">{formatDate(selectedBooking.end_date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">المدة:</span>
                        <span className="text-white">{selectedBooking.duration_of_days || "غير محدد"} يوم</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Financial */}
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-white flex items-center gap-2 text-base">
                        <DollarSign className="h-4 w-4 text-green-400" />
                        المعلومات المالية
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">السعر الشهري:</span>
                        <span className="text-white">{selectedBooking.total_price_per_month?.toLocaleString() || 0}$</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">قبل الخصم:</span>
                        <span className="text-white">{selectedBooking.total_price_befor_discount?.toLocaleString() || 0}$</span>
                      </div>
                      <Minus className="bg-white/10 my-2" />
                      <div className="flex justify-between font-bold">
                        <span className="text-gray-300">الإجمالي:</span>
                        <span className="text-green-400">{selectedBooking.total_price?.toLocaleString() || 0}$</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">المتبقي:</span>
                        <span className="text-yellow-400">{selectedBooking.remaining?.toLocaleString() || 0}$</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Printing */}
                  {selectedBooking.printing && (
                    <Card className="bg-white/5 border-white/10">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-white flex items-center gap-2 text-base">
                          <Printer className="h-4 w-4 text-blue-400" />
                          نوع الطباعة
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">النوع:</span>
                          <span className="text-white">{selectedBooking.printing.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">السعر:</span>
                          <span className="text-white">{selectedBooking.printing.price}$</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Road Signs */}
                <Card className="bg-white/5 border-white/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white flex items-center gap-2 text-base">
                      <MapPin className="h-4 w-4 text-blue-400" />
                      اللوحات الإعلانية ({selectedBooking.roadsigns?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedBooking.roadsigns?.map((sign) => (
                      <div key={sign.id} className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="text-white font-semibold text-sm">
                              {sign.roadsign_code || `لوحة #${sign.id}`}
                            </h4>
                            <p className="text-gray-400 text-xs">{sign.place}</p>
                          </div>
                          <Badge className="bg-blue-600 text-xs">{sign.template?.model}</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          <div className="text-gray-400">
                            الوجوه: <span className="text-white">{sign.pivot?.booking_faces || 1}</span>
                          </div>
                          <div className="text-gray-400">
                            اللوحات: <span className="text-white">{sign.pivot?.number_of_reserved_panels || 1}</span>
                          </div>
                          <div className="text-gray-400">
                            السعر: <span className="text-white">{sign.pivot?.total_faces_price?.toLocaleString() || 0}$</span>
                          </div>
                          <div className="text-gray-400">
                            الوحدات: <span className="text-white">{sign.pivot?.units || 0}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Notes */}
                {selectedBooking.notes && (
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-white text-sm">ملاحظات</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 text-sm">{selectedBooking.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}