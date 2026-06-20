import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router";
import { 
  Calendar, 
  User, 
  MapPin, 
  FileText, 
  Plus, 
  AlertCircle,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BrokerNavbar } from "../../Components/Broker/BrokerNavbar";
import { useBrokerAuthentication } from "../../Hooks/useBrokerAuthentication";
import { useBrokerBookings } from "../../Hooks/useBrokerBookings";
import { useRoadSignSearch } from "../../Hooks/useRoadSignSearch";
import { useGetBrokerClientsQuery } from "../../RtkQuery/Slice/mediatorapis/MediatorApi";
import { RoadSignCard, SelectedRoadSignCard } from "../../Components/Broker/RoadSignCard";
import { RoadSignFilters } from "../../Components/Broker/RoadSignFilters";
import { BookingSummary } from "../../Components/Broker/BookingSummary";
import { SignDetailsDialog } from "../../Components/Broker/SignDetailsDialog";
import { showToast } from "../../utils/Notifictions/showToast";
import axios from "axios";
import { BASE_URL } from "../../Api/baseUrl";

const DEFAULT_FORM_DATA = {
  customer_id: "",
  type: 2,
  start_date: "",
  end_date: "",
  product_type: 2,
  notes: "",
  printing_id: "",
  coupon: "",
};

// Get broker token helper
const getBrokerToken = () => {
  try {
    const raw = localStorage.getItem("broker_token");
    return raw || null;
  } catch {
    return null;
  }
};

// Create axios instance with broker auth
const createBrokerAxios = () => {
  const token = getBrokerToken();
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  });
};

export function CreateBrokerBooking() {
  const navigate = useNavigate();
  const { getBrokerUser } = useBrokerAuthentication();
  const brokerUser = getBrokerUser();
  
  // Use hook with calculate logic included
  const { 
    createNewBooking, 
    prepareBookingData, 
    isCreating, 
    calculatedPrice,
    isCalculating,
    calculateBookingPrice,
    resetCalculatedPrice,
  } = useBrokerBookings();

  // Form state
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSign, setEditingSign] = useState(null);
  
  // Printings state
  const [printings, setPrintings] = useState([]);
  const [printingsLoading, setPrintingsLoading] = useState(false);

  // Fetch clients
  const { data: clientsData, isLoading: clientsLoading } = useGetBrokerClientsQuery({ per_page: 100 });
  const clients = clientsData?.clients || [];

  // Fetch printings on mount
  useEffect(() => {
    const fetchPrintings = async () => {
      setPrintingsLoading(true);
      try {
        const axiosInstance = createBrokerAxios();
        const response = await axiosInstance.get("/printings");
        setPrintings(response.data || []);
      } catch (err) {
        console.error("Failed to fetch printings:", err);
        showToast("error", "فشل في تحميل أنواع الطباعة");
      } finally {
        setPrintingsLoading(false);
      }
    };
    
    fetchPrintings();
  }, []);

  // Road sign search hook
  const {
    cities,
    regions,
    availableRoadSigns,
    selectedRoadSigns,
    totalPrice,
    roadSignsLoading,
    searchFilters,
    handleFilterChange,
    refetchWithDates,
    addRoadSign,
    removeRoadSign,
    updateRoadSign,
    clearAllSigns,
  } = useRoadSignSearch(formData.start_date, formData.end_date);

  // Validation
  const isDateRangeValid = useMemo(() => {
    if (!formData.start_date || !formData.end_date) return false;
    return new Date(formData.start_date) <= new Date(formData.end_date);
  }, [formData.start_date, formData.end_date]);

  const canSubmit = useMemo(() => 
    formData.customer_id && 
    isDateRangeValid && 
    selectedRoadSigns.length > 0 &&
    formData.printing_id,
    [formData.customer_id, isDateRangeValid, selectedRoadSigns.length, formData.printing_id]
  );

  const canCalculate = useMemo(() => 
    isDateRangeValid && 
    selectedRoadSigns.length > 0 &&
    formData.printing_id &&
    formData.product_type,
    [isDateRangeValid, selectedRoadSigns.length, formData.printing_id, formData.product_type]
  );

  // Handlers
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      // Reset calculated price when key inputs change
      if (['printing_id', 'product_type', 'start_date', 'end_date'].includes(field)) {
        resetCalculatedPrice();
      }
      return updated;
    });
  }, [resetCalculatedPrice]);

  const handleDateChange = useCallback((field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if ((field === 'start_date' || field === 'end_date') && updated.start_date && updated.end_date) {
        setTimeout(() => refetchWithDates(), 0);
      }
      return updated;
    });
    resetCalculatedPrice();
  }, [refetchWithDates, resetCalculatedPrice]);

  const handleSelectSign = useCallback((sign) => {
    setEditingSign(sign);
  }, []);

  const handleConfirmSign = useCallback((signWithDetails) => {
    addRoadSign(
      signWithDetails, 
      signWithDetails.booking_faces, 
      signWithDetails.number_of_reserved_panels,
      formData.start_date,
      formData.end_date
    );
    setEditingSign(null);
    resetCalculatedPrice(); // Reset when signs change
  }, [addRoadSign, formData.start_date, formData.end_date, resetCalculatedPrice]);

  // Calculate price handler - delegates to hook
  const handleCalculatePrice = useCallback(async () => {
    const result = await calculateBookingPrice({
      roadsigns: selectedRoadSigns,
      start_date: formData.start_date,
      end_date: formData.end_date,
      printing_id: formData.printing_id,
      product_type: formData.product_type,
    });
    return result;
  }, [calculateBookingPrice, selectedRoadSigns, formData]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!canSubmit) {
      if (!formData.customer_id) showToast("error", "يرجى اختيار العميل");
      if (!isDateRangeValid) showToast("error", "يرجى تحديد فترة حجز صحيحة");
      if (selectedRoadSigns.length === 0) showToast("error", "يرجى إضافة لوحة إعلانية واحدة على الأقل");
      if (!formData.printing_id) showToast("error", "يرجى اختيار نوع الطباعة");
      return;
    }

    const bookingData = prepareBookingData({
      ...formData,
      roadsigns: selectedRoadSigns,
    });

    const result = await createNewBooking(bookingData);
    
    if (result.success) {
      setTimeout(() => navigate("/broker/bookings"), 1500);
    }
  }, [canSubmit, formData, selectedRoadSigns, prepareBookingData, createNewBooking, navigate, isDateRangeValid]);

  const handleClearAll = useCallback(() => {
    if (window.confirm("هل أنت متأكد من إزالة جميع اللوحات؟")) {
      clearAllSigns();
      resetCalculatedPrice();
    }
  }, [clearAllSigns, resetCalculatedPrice]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <BrokerNavbar />
      
      <div className="pt-16 pb-8">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">إنشاء حجز جديد</h1>
            <p className="text-gray-400">قم بإنشاء حجز جديد للوحات الإعلانية</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Client Card */}
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    <User className="h-5 w-5 text-blue-400" />
                    معلومات العميل
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label className="text-gray-300 mb-1.5 block">العميل *</Label>
                    <Select
                      value={formData.customer_id || "none"}
                      onValueChange={(v) => handleInputChange("customer_id", v === "none" ? "" : v)}
                      disabled={clientsLoading}
                    >
                      <SelectTrigger className="bg-white/10 border-white/30 text-white">
                        <SelectValue placeholder={clientsLoading ? "جاري التحميل..." : "اختر العميل"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">اختر العميل</SelectItem>
                        {clients.map(client => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.name || client.username} - {client.phone_number || "لا يوجد رقم"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Dates Card */}
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5 text-blue-400" />
                    فترة الحجز
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300 mb-1.5 block">تاريخ البداية *</Label>
                      <Input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => handleDateChange("start_date", e.target.value)}
                        className="bg-white/10 border-white/30 text-white"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300 mb-1.5 block">تاريخ النهاية *</Label>
                      <Input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => handleDateChange("end_date", e.target.value)}
                        className="bg-white/10 border-white/30 text-white"
                        min={formData.start_date}
                      />
                    </div>
                  </div>
                  {!isDateRangeValid && formData.start_date && formData.end_date && (
                    <p className="text-red-400 text-sm mt-2">تاريخ النهاية يجب أن يكون بعد تاريخ البداية</p>
                  )}
                </CardContent>
              </Card>

              {/* Printing Type Card */}
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    <Printer className="h-5 w-5 text-blue-400" />
                    نوع الطباعة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label className="text-gray-300 mb-1.5 block">نوع الطباعة *</Label>
                    <Select
                      value={formData.printing_id || "none"}
                      onValueChange={(v) => handleInputChange("printing_id", v === "none" ? "" : v)}
                      disabled={printingsLoading}
                    >
                      <SelectTrigger className="bg-white/10 border-white/30 text-white">
                        <SelectValue placeholder={printingsLoading ? "جاري التحميل..." : "اختر نوع الطباعة"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">اختر نوع الطباعة</SelectItem>
                        {printings.map(printing => (
                          <SelectItem key={printing.id} value={printing.id.toString()}>
                            {printing.type} - {parseFloat(printing.price || 0).toLocaleString()} ل.س
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {printings.length === 0 && !printingsLoading && (
                      <p className="text-yellow-400 text-sm mt-2">لا توجد أنواع طباعة متاحة</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Road Signs Card */}
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-blue-400" />
                      اللوحات الإعلانية
                      {selectedRoadSigns.length > 0 && (
                        <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                          {selectedRoadSigns.length}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {selectedRoadSigns.length > 0 && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={handleClearAll}
                        >
                          إزالة الكل
                        </Button>
                      )}
                      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={!isDateRangeValid}
                          >
                            <Plus className="h-4 w-4 ml-1" />
                            إضافة لوحة
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-white/20 text-white max-w-4xl max-h-[85vh] p-0 gap-0">
                          <DialogHeader className="p-6 pb-2">
                            <DialogTitle className="text-right text-xl">اختر اللوحات الإعلانية</DialogTitle>
                            <p className="text-gray-400 text-sm text-right">
                              {formData.start_date && formData.end_date 
                                ? `الفترة: ${formData.start_date} إلى ${formData.end_date}`
                                : "يرجى تحديد فترة الحجز أولاً"
                              }
                            </p>
                          </DialogHeader>
                          
                          <div className="px-6 py-2">
                            <RoadSignFilters
                              cities={cities}
                              regions={regions}
                              filters={searchFilters}
                              onFilterChange={handleFilterChange}
                              disabled={roadSignsLoading}
                            />
                          </div>

                          <ScrollArea className="h-[400px] px-6 py-2">
                            {roadSignsLoading ? (
                              <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                              </div>
                            ) : availableRoadSigns.length === 0 ? (
                              <div className="text-center py-12 text-gray-400">
                                <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>لا توجد لوحات متاحة للفترة المحددة</p>
                                <p className="text-sm mt-1">جرب تغيير الفترة أو الفلاتر</p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {availableRoadSigns.map((sign) => (
                                  <RoadSignCard
                                    key={sign.id}
                                    sign={sign}
                                    onSelect={(s) => {
                                      handleSelectSign(s);
                                      setIsDialogOpen(false);
                                    }}
                                  />
                                ))}
                              </div>
                            )}
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedRoadSigns.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>لم يتم إضافة أي لوحات بعد</p>
                      <p className="text-sm mt-1">حدد فترة الحجز ثم اضغط "إضافة لوحة"</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedRoadSigns.map((sign, index) => (
                        <SelectedRoadSignCard
                          key={`${sign.id}-${index}`}
                          sign={sign}
                          index={index}
                          onRemove={removeRoadSign}
                          onUpdate={updateRoadSign}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notes Card */}
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-blue-400" />
                    معلومات إضافية
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-gray-300 mb-1.5 block">ملاحظات</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
                      placeholder="أضف ملاحظات هنا..."
                      className="bg-white/10 border-white/30 text-white min-h-[100px]"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300 mb-1.5 block">كود الخصم (اختياري)</Label>
                    <Input
                      value={formData.coupon}
                      onChange={(e) => handleInputChange("coupon", e.target.value)}
                      placeholder="أدخل كود الخصم"
                      className="bg-white/10 border-white/30 text-white"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Summary */}
            <div className="space-y-6">
              <BookingSummary
                selectedCount={selectedRoadSigns.length}
                totalPrice={totalPrice}
                calculatedPrice={calculatedPrice}
                isSubmitting={isCreating}
                isCalculating={isCalculating}
                isValid={canSubmit}
                canCalculate={canCalculate}
                onSubmit={handleSubmit}
                onCalculate={handleCalculatePrice}
                startDate={formData.start_date}
                endDate={formData.end_date}
                printingId={formData.printing_id}
              />

              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
                    <div className="text-sm text-gray-300 space-y-1">
                      <p>• يجب تحديد فترة الحجز قبل إضافة اللوحات</p>
                      <p>• يمكن تعديل عدد الوجوه واللوحات لكل إعلان</p>
                      <p>• اضغط "حساب السعر" للحصول على السعر الدقيق من الخادم</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Sign Details Dialog */}
      <SignDetailsDialog
        sign={editingSign}
        open={!!editingSign}
        onClose={() => setEditingSign(null)}
        onConfirm={handleConfirmSign}
        globalDates={{
          start: formData.start_date,
          end: formData.end_date
        }}
      />
    </div>
  );
}