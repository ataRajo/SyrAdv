import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Loader2,
  Filter,
  MapPin,
  Navigation,
  RefreshCw,
  Eye,
  Calendar,
  AlertCircle,
  Crosshair,
  ShoppingCart,
  Trash2,
  X,
  AlertTriangle,
  Calculator,
  Send,
  Plus,
  Minus,
  CheckCircle,
  ChevronDown,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { BrokerNavbar } from "../../Components/Broker/BrokerNavbar";
import { useGetRoadSignsQuery } from "../../RtkQuery/Slice/RoadSings/RoadSingsApi";
import { useGetCitiesWithRegionsQuery ,
  useSubmitBrokerActivityMutation  
 } from "../../RtkQuery/Slice/mediatorapis/MediatorApi";
import { useCalculateReservationMutation } from "../../RtkQuery/Slice/Booking/BookingApi";
import { showToast } from "../../utils/Notifictions/showToast";


import { BASE_URL } from "../../Api/baseUrl";

import { useBrokerAuthentication } from "../../Hooks/useBrokerAuthentication";

import axios from "axios";

// Helper function for className
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Product Types
const PRODUCT_TYPES = [
  { id: 1, name: "محلي", value: "local" },
  { id: 2, name: "اجنبي", value: "foreign" },
  { id: 3, name: "محلي اجنبي", value: "local_foreign" },
];

// Simple working marker icon (Google Maps style)
const createSimpleMarkerIcon = (isSelected = false) => {
  const color = { bg: "#4CAF50", border: "#388E3C" };
  const borderColor = isSelected ? "#FF9800" : color.border;
  const bgColor = isSelected ? "#FF9800" : color.bg;

  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 32">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 8 12 20 12 20s12-12 12-20c0-6.63-5.37-12-12-12z" 
            fill="${bgColor}" 
            stroke="${borderColor}" 
            stroke-width="2"/>
      <circle cx="12" cy="12" r="3" fill="white"/>
    </svg>
  `;

  const encodedSvg = btoa(unescape(encodeURIComponent(svgString)));
  const iconUrl = `data:image/svg+xml;base64,${encodedSvg}`;

  return L.icon({
    iconUrl: iconUrl,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    className: "custom-marker-icon",
  });
};

// Component to handle map bounds
function MapBoundsController({ markers, map }) {
  useEffect(() => {
    if (map && markers && markers.length > 0) {
      const validMarkers = markers.filter((m) => m.lat && m.lng);
      if (validMarkers.length > 0) {
        const bounds = L.latLngBounds(validMarkers.map((m) => [m.lat, m.lng]));
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [markers, map]);

  return null;
}

// Component to handle map clicks
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      if (onMapClick) onMapClick(e.latlng);
    },
  });

  return null;
}

// Component for location control
function LocationControl({ onLocate, map }) {
  const handleLocate = () => {
    if (!map) return;
    map.locate({ setView: true, maxZoom: 15 });
    map.once("locationfound", (e) => {
      if (onLocate) onLocate(e.latlng);
    });
  };

  return (
    <div
      className="leaflet-bottom leaflet-left"
      style={{ marginBottom: 20, marginLeft: 10 }}
    >
      <div className="leaflet-control leaflet-bar">
        <Button
          size="sm"
          variant="secondary"
          className="shadow-lg bg-white hover:bg-gray-100"
          onClick={handleLocate}
        >
          <Crosshair className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Quick Select Button Component
function QuickSelectButton({ marker, isSelected, onSelect }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onSelect(marker);
      }}
      className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${
        isSelected
          ? "bg-orange-500 text-white"
          : "bg-green-500 text-white hover:bg-green-600"
      }`}
    >
      {isSelected ? "✓ تم الاختيار" : "➕ اختر للواتساب"}
    </button>
  );
}

export function MapBroker() {
  const navigate = useNavigate();

  // Filter states
  const [filters, setFilters] = useState({
    city_id: "",
    region_id: "",
    direction: "",
    template_size: "",
  });

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedSign, setSelectedSign] = useState(null);
  const [selectedSigns, setSelectedSigns] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [totalAmount, setTotalAmount] = useState(null);
  const [selectedPrintingId, setSelectedPrintingId] = useState(null);
  const [selectedProductType, setSelectedProductType] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [printings, setPrintings] = useState([]);
  const [mapCenter, setMapCenter] = useState([36.2127, 37.1258]);
  const [mapZoom, setMapZoom] = useState(13);
  const [lastClickedCoords, setLastClickedCoords] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [showWhatsAppForm, setShowWhatsAppForm] = useState(false);
  const { getBrokerUser } = useBrokerAuthentication();
  const [brokerLogId, setBrokerLogId] = useState(null);
  const [whatsappNumber, setWhatsappNumber] = useState("");

  // NEW: State for WhatsApp selection mode
  const [whatsAppSelectMode, setWhatsAppSelectMode] = useState(false);

  const [bookingData, setBookingData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    companyName: "",
    notes: "",
  });
  const [isSending, setIsSending] = useState(false);

  const mapRef = useRef(null);
  // FIX: Track if map is mounted to prevent _leaflet_pos error
  const mapMountedRef = useRef(false);

  const createAxiosInstance = () => {
    const instance = axios.create({
      baseURL: BASE_URL,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.error("Unauthorized! Token might be invalid or expired");
        }
        return Promise.reject(error);
      },
    );

    return instance;
  };

  const axiosInstance = createAxiosInstance();

  // API hooks
  const [calculateReservation] = useCalculateReservationMutation();
  const [submitBrokerActivity] = useSubmitBrokerActivityMutation();

  // Fetch cities
  const { data: cities = [], isLoading: citiesLoading } =
    useGetCitiesWithRegionsQuery();

  // Fetch printings
  useEffect(() => {
    const fetchPrintings = async () => {
      try {
        const response = await axiosInstance.get("/printings");
        const printingsData = response.data?.data || response.data || [];
        setPrintings(printingsData);
      } catch (err) {
        console.error("Error fetching printings:", err);
      }
    };
    fetchPrintings();
  }, []);

  // Get regions based on selected city
  const selectedCity = useMemo(
    () => cities.find((c) => c.id === parseInt(filters.city_id)),
    [cities, filters.city_id],
  );
  const regions = selectedCity?.regions || [];

  // Build query params for road signs
  const queryParams = useMemo(() => {
    const params = {};
    if (filters.city_id) params.city_id = filters.city_id;
    if (filters.region_id) params.region_id = filters.region_id;
    if (filters.direction) params.direction = filters.direction;
    if (filters.template_size) params.template_size = filters.template_size;
    if (startDate) params.start_date = startDate.toISOString().split("T")[0];
    if (endDate) params.end_date = endDate.toISOString().split("T")[0];

    return params;
  }, [filters, startDate, endDate]);

  // Fetch road signs
  const {
    data: roadSignsResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetRoadSignsQuery(queryParams);

  // Extract road signs data from response
  const roadSignsData = roadSignsResponse?.data || [];

  // Prepare markers data — ONLY available (is_booked === false)
  const markers = useMemo(() => {
    if (!roadSignsData || roadSignsData.length === 0) return [];

    return roadSignsData
      .filter((sign) => sign.latitudeX && sign.longitudeY && sign.is_booked === false)
      .map((sign) => ({
        id: sign.id,
        lat: parseFloat(sign.latitudeX),
        lng: parseFloat(sign.longitudeY),
        roadsign_code: sign.roadsign_code,
        place: sign.place,
        directions: sign.directions,
        panels_number: sign.panels_number,
        faces_number: sign.faces_number,
        image: sign.image,
        location_image1: sign.location_image1,
        template: sign.template,
        city: sign.city,
        region: sign.region,
        bookings: sign.bookings || [],
      }));
  }, [roadSignsData]);

  // Stats — only available markers
  const stats = useMemo(() => {
    const total = markers.length;
    return { total, available: total };
  }, [markers]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };
      if (key === "city_id") {
        newFilters.region_id = "";
      }
      return newFilters;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      city_id: "",
      region_id: "",
      direction: "",
      template_size: "",
    });
    setStartDate(null);
    setEndDate(null);
    setSelectedSigns([]);
    setTotalAmount(null);
    setBrokerLogId(null);
    setWhatsappNumber("");
    showToast("info", "تم مسح جميع الفلاتر");
  }, []);

  // Modified: Handle marker click — now checks if WhatsApp selection mode is active
  const handleMarkerClick = useCallback((sign) => {
    // If in WhatsApp select mode, add/remove from cart instead of showing modal
    if (whatsAppSelectMode) {
      setSelectedSigns((prev) => {
        const exists = prev.some((s) => s.id === sign.id);
        if (exists) {
          showToast(
            "info",
            `تم إزالة ${sign.roadsign_code || sign.id} من القائمة`,
          );
          return prev.filter((s) => s.id !== sign.id);
        }
        showToast(
          "success",
          `تم إضافة ${sign.roadsign_code || sign.id} إلى القائمة`,
        );
        return [...prev, sign];
      });
      setTotalAmount(null);
    } else {
      // Normal mode - show modal with details
      setSelectedSign(sign);
    }
  }, [whatsAppSelectMode]);

  // NEW: Toggle WhatsApp selection mode
  const toggleWhatsAppSelectMode = useCallback(() => {
    setWhatsAppSelectMode((prev) => {
      const newMode = !prev;
      if (newMode) {
        showToast("info", "وضع اختيار الواتساب مفعل - اضغط على اللوحات لإضافتها أو إزالتها");
      } else {
        showToast("info", "تم إلغاء وضع اختيار الواتساب");
      }
      return newMode;
    });
  }, []);

  // NEW: Clear all selected signs
  const clearSelectedSigns = useCallback(() => {
    if (selectedSigns.length === 0) {
      showToast("info", "لا توجد لوحات مختارة");
      return;
    }
    setSelectedSigns([]);
    setTotalAmount(null);
    showToast("success", "تم مسح جميع اللوحات المختارة");
  }, [selectedSigns.length]);

  // Handle quick select — adds/removes from cart without modal
  const handleQuickSelect = useCallback((sign) => {
    setSelectedSigns((prev) => {
      const exists = prev.some((s) => s.id === sign.id);
      if (exists) {
        showToast(
          "info",
          `تم إزالة ${sign.roadsign_code || sign.id} من القائمة`,
        );
        return prev.filter((s) => s.id !== sign.id);
      }
      showToast(
        "success",
        `تم إضافة ${sign.roadsign_code || sign.id} إلى القائمة`,
      );
      return [...prev, sign];
    });
    setTotalAmount(null);
  }, []);

  const handleRemoveSign = useCallback((signId) => {
    setSelectedSigns((prev) => prev.filter((s) => s.id !== signId));
    setTotalAmount(null);
    showToast("info", "تم إزالة اللوحة من القائمة");
  }, []);

  const handleMapClick = useCallback((latlng) => {
    setLastClickedCoords({
      lat: latlng.lat.toFixed(6),
      lng: latlng.lng.toFixed(6),
    });
    setTimeout(() => setLastClickedCoords(null), 3000);
  }, []);

  const closeDetails = useCallback(() => {
    setSelectedSign(null);
  }, []);

  const refreshData = useCallback(() => {
    refetch();
    showToast("success", "تم تحديث البيانات");
  }, [refetch]);

  // Calculate total price using the API
  const handleCalculateTotal = useCallback(async () => {
    if (selectedSigns.length === 0) {
      showToast("error", "الرجاء اختيار لوحة إعلانية على الأقل");
      return;
    }
    if (!startDate || !endDate) {
      showToast("error", "الرجاء اختيار تاريخ البداية والنهاية");
      return;
    }
    if (!selectedPrintingId) {
      showToast("error", "الرجاء اختيار نوع الطباعة");
      return;
    }
    if (!selectedProductType) {
      showToast("error", "الرجاء اختيار نوع المنتج");
      return;
    }

    // Get the logged-in broker user
    const brokerUser = getBrokerUser();
    const brokerId = brokerUser?.id || null;

    setIsCalculating(true);
    try {
      const payload = {
        roadsigns: selectedSigns.map((sign) => ({
          road_sign_id: sign.id,
          booking_faces: sign.faces_number || 1,
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
          number_of_reserved_panels: sign.panels_number || 1,
        })),
        product_type: selectedProductType,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        is_extend: 0,
        printing_id: selectedPrintingId,
        actor_id: brokerId,
      };

      const response = await calculateReservation(payload).unwrap();

      // Save the broker_log.id from response
      if (response.broker_log?.id) {
        setBrokerLogId(response.broker_log.id);
        console.log("Broker log ID saved:", response.broker_log.id);
      }

      // Set the total amount from response
      if (response.amount) {
        setTotalAmount(response.amount.total_price);
        showToast("success", `تم حساب السعر بنجاح: ${response.amount.total_price} $`);
      } else if (response.total_price_per_month) {
        setTotalAmount(response.total_price_per_month);
        showToast("success", `تم حساب السعر بنجاح: ${response.total_price_per_month} $`);
      } else if (response.total_price) {
        setTotalAmount(response.total_price);
        showToast("success", `تم حساب السعر بنجاح: ${response.total_price} $`);
      } else {
        setTotalAmount(response.price_per_period || 0);
        showToast("success", "تم حساب السعر بنجاح");
      }

      // Reset WhatsApp form visibility when new calculation is done
      setShowWhatsAppForm(false);

    } catch (err) {
      console.error("Error calculating amount:", err);
      showToast("error", err?.data?.message || "فشل في حساب السعر");
      setTotalAmount(null);
    } finally {
      setIsCalculating(false);
    }
  }, [
    selectedSigns,
    startDate,
    endDate,
    selectedPrintingId,
    selectedProductType,
    calculateReservation,
    getBrokerUser,
  ]);

  // Send to WhatsApp with API call using dynamic number
  const handleSendToWhatsApp = async () => {
    if (!bookingData.customerName || !bookingData.customerPhone) {
      showToast("error", "الرجاء إدخال الاسم ورقم الهاتف");
      return;
    }

    if (!whatsappNumber) {
      showToast("error", "الرجاء إدخال رقم واتساب المستلم");
      return;
    }

    if (selectedSigns.length === 0) {
      showToast("error", "الرجاء اختيار لوحة إعلانية على الأقل");
      return;
    }

    // Check if we have the broker_log.id
    if (!brokerLogId) {
      showToast("error", "الرجاء حساب السعر أولاً");
      return;
    }

    setIsSending(true);

    try {
      // Prepare customer information for the API
      const customerInformations = {
        username: bookingData.customerName,
        company_name: bookingData.companyName || "",
        phone_number: bookingData.customerPhone,
      };

      // Call the activities API with the broker_log.id
      const apiResult = await submitBrokerActivity({
        activityId: brokerLogId,
        customerInformations: customerInformations,
      }).unwrap();

      if (apiResult.success) {
        console.log("Activity submitted successfully:", apiResult);

        // Continue with WhatsApp message
        const formattedStartDate = startDate
          ? startDate.toISOString().split("T")[0]
          : "";
        const formattedEndDate = endDate
          ? endDate.toISOString().split("T")[0]
          : "";

        const selectedPrinting = printings.find(
          (p) => p.id === selectedPrintingId,
        );
        const printingName = selectedPrinting ? selectedPrinting.type : "";

        const selectedProductTypeObj = PRODUCT_TYPES.find(
          (p) => p.id === selectedProductType,
        );
        const productTypeName = selectedProductTypeObj
          ? selectedProductTypeObj.name
          : "";

        let message = `*طلب حجز لوحات إعلانية*\n\n`;
        message += `*بيانات العميل:*\n`;
        message += `الاسم: ${bookingData.customerName}\n`;
        message += `الهاتف: ${bookingData.customerPhone}\n`;
        if (bookingData.customerEmail)
          message += `البريد الإلكتروني: ${bookingData.customerEmail}\n`;
        if (bookingData.companyName)
          message += `الشركة: ${bookingData.companyName}\n`;
        message += `\n*مدة الحجز:*\n`;
        message += `من: ${formattedStartDate}\n`;
        message += `إلى: ${formattedEndDate}\n`;
        message += `\n*نوع الطباعة:* ${printingName}\n`;
        message += `*نوع المنتج:* ${productTypeName}\n`;
        message += `\n*اللوحات المختارة:*\n`;

        selectedSigns.forEach((sign, index) => {
          message += `${index + 1}. كود: ${sign.roadsign_code || sign.id}\n`;
          message += `   الموقع: ${sign.place || ""}\n`;
          message += `   المدينة: ${sign.city?.name || ""} - ${sign.region?.name || ""}\n`;
          if (sign.template) {
            message += `   القالب: ${sign.template.model} - ${sign.template.size}\n`;
          }
          message += `   عدد اللوحات: ${sign.panels_number || 1}\n`;
          message += `   عدد الوجوه: ${sign.faces_number || 1}\n\n`;
        });

        if (totalAmount) {
          message += `\n*تفاصيل السعر:*\n`;
          message += `المبلغ الإجمالي: ${totalAmount} $\n`;
        }

        if (bookingData.notes) {
          message += `\n*ملاحظات:*\n${bookingData.notes}\n`;
        }

        message += `\n*تاريخ الطلب:* ${new Date().toLocaleDateString("ar-SY")}`;

        const encodedMessage = encodeURIComponent(message);
        // Clean the WhatsApp number (remove any non-digits)
        const cleanNumber = whatsappNumber.replace(/\D/g, "");
        const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;

        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
        showToast("success", "تم إرسال البيانات وفتح واتساب بنجاح");

        // Reset form after sending
        setShowWhatsAppForm(false);
        setWhatsAppSelectMode(false);
        setWhatsappNumber("");
        setBookingData({
          customerName: "",
          customerPhone: "",
          customerEmail: "",
          companyName: "",
          notes: "",
        });
      } else {
        showToast("error", apiResult.message || "فشل في إرسال البيانات");
      }
    } catch (error) {
      console.error("Error in handleSendToWhatsApp:", error);
      showToast("error", error?.data?.message || "حدث خطأ في فتح واتساب");
    } finally {
      setIsSending(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingData((prev) => ({ ...prev, [name]: value }));
  };

  // FIX: Stable map ready handler - only set once
  const handleMapReady = useCallback((map) => {
    if (!mapMountedRef.current) {
      mapRef.current = map;
      mapMountedRef.current = true;
      setMapReady(true);
    }
  }, []);

  // FIX: Cleanup on unmount
  useEffect(() => {
    return () => {
      mapMountedRef.current = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const showMap = startDate && endDate && !isLoading;
  const noData = startDate && endDate && !isLoading && markers.length === 0;

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <BrokerNavbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 max-w-md mx-4">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-white text-lg font-semibold mb-2">حدث خطأ</h3>
              <p className="text-gray-300 mb-4">
                فشل في تحميل بيانات اللوحات الإعلانية
              </p>
              <Button
                onClick={refreshData}
                className="bg-blue-600 hover:bg-blue-700"
              >
                إعادة المحاولة
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <BrokerNavbar />

      <div className="pt-16">
        {/* Stats Bar with WhatsApp Select Button */}
        {showMap && markers.length > 0 && (
          <div className="bg-white/5 backdrop-blur-lg border-b border-white/20 sticky top-16 z-40">
            <div className="container mx-auto px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-4 flex-wrap items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-white text-sm">
                      متاح: {stats.available}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                    <span className="text-white text-sm">
                      الإجمالي: {stats.total}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {/* WhatsApp Select Mode Toggle */}
                  <Button
                    size="sm"
                    onClick={toggleWhatsAppSelectMode}
                    className={`transition-all ${
                      whatsAppSelectMode
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-green-600/70 hover:bg-green-700"
                    }`}
                  >
                    <MessageSquare className="h-4 w-4 ml-2" />
                    {whatsAppSelectMode ? "إلغاء الاختيار" : "اختر للواتساب"}
                  </Button>

                  {selectedSigns.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={clearSelectedSigns}
                      className="bg-red-500/20 border-red-500/30 text-red-300 hover:bg-red-500/30"
                    >
                      <Trash2 className="h-4 w-4 ml-2" />
                      مسح الكل ({selectedSigns.length})
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={refreshData}
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                  >
                    <RefreshCw className="h-4 w-4 ml-2" />
                    تحديث
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => setShowCart(true)}
                    disabled={selectedSigns.length === 0}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <ShoppingCart className="h-4 w-4 ml-2" />
                    السلة ({selectedSigns.length})
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters Section - RESPONSIVE */}
        <div className="container mx-auto px-4 py-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-4">
              <div className="flex flex-col md:flex-row gap-4 flex-1 w-full">
                {/* Date Inputs */}
                <div className="w-full md:min-w-[150px]">
                  <Label className="text-gray-300 text-sm mb-1.5 block">
                    تاريخ البداية *
                  </Label>
                  <input
                    type="date"
                    value={
                      startDate ? startDate.toISOString().split("T")[0] : ""
                    }
                    onChange={(e) =>
                      setStartDate(
                        e.target.value ? new Date(e.target.value) : null,
                      )
                    }
                    className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/30 text-white mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="w-full md:min-w-[150px]">
                  <Label className="text-gray-300 text-sm mb-1.5 block">
                    تاريخ النهاية *
                  </Label>
                  <input
                    type="date"
                    value={endDate ? endDate.toISOString().split("T")[0] : ""}
                    onChange={(e) =>
                      setEndDate(
                        e.target.value ? new Date(e.target.value) : null,
                      )
                    }
                    min={startDate ? startDate.toISOString().split("T")[0] : ""}
                    className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/30 text-white mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* City Select - DARK MODE FIXED */}
                <div className="w-full md:min-w-[180px]">
                  <Label className="text-gray-300 text-sm mb-1.5 block">المدينة</Label>
                  <Select
                    value={filters.city_id || "all"}
                    onValueChange={(v) => handleFilterChange("city_id", v === "all" ? "" : v)}
                  >
                    <SelectTrigger className="bg-white/10 border-white/30 text-white h-10">
                      <SelectValue placeholder="جميع المدن" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/20 text-white">
                      <SelectItem value="all" className="text-white hover:bg-white/10 focus:bg-white/10 focus:text-white">جميع المدن</SelectItem>
                      {cities.map((city) => (
                        <SelectItem 
                          key={city.id} 
                          value={city.id.toString()}
                          className="text-white hover:bg-white/10 focus:bg-white/10 focus:text-white"
                        >
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Region Select - DARK MODE FIXED */}
                {regions.length > 0 && (
                  <div className="w-full md:min-w-[180px]">
                    <Label className="text-gray-300 text-sm mb-1.5 block">المنطقة</Label>
                    <Select
                      value={filters.region_id || "all"}
                      onValueChange={(v) => handleFilterChange("region_id", v === "all" ? "" : v)}
                    >
                      <SelectTrigger className="bg-white/10 border-white/30 text-white h-10">
                        <SelectValue placeholder="جميع المناطق" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-white/20 text-white">
                        <SelectItem value="all" className="text-white hover:bg-white/10 focus:bg-white/10 focus:text-white">جميع المناطق</SelectItem>
                        {regions.map((region) => (
                          <SelectItem 
                            key={region.id} 
                            value={region.id.toString()}
                            className="text-white hover:bg-white/10 focus:bg-white/10 focus:text-white"
                          >
                            {region.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <Button
                onClick={clearFilters}
                variant="outline"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 w-full md:w-auto"
              >
                <X className="h-4 w-4 ml-2" />
                مسح الكل
              </Button>
            </div>
          </div>
        </div>

        {/* Map Container - RESPONSIVE HEIGHT */}
        <div className="h-[calc(100vh-280px)] md:h-[calc(100vh-240px)] w-full relative px-4 pb-4">
          {!startDate || !endDate ? (
            <div className="h-full flex items-center justify-center bg-white/5 rounded-xl border border-white/20">
              <div className="text-center p-8">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-white text-lg font-semibold mb-2">
                  اختر تاريخ البداية والنهاية
                </h3>

                <span><p className="text-red-500 font-extrabold text-2xl">ملاحظة</p> 
بعد تصفية تاريخ البداية والنهاية ...      
                </span>
              </div>
            </div>
          ) : isLoading ? (
            <div className="h-full flex items-center justify-center bg-white/5 rounded-xl border border-white/20">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-white">جاري تحميل البيانات...</p>
              </div>
            </div>
          ) : noData ? (
            <div className="h-full flex items-center justify-center bg-white/5 rounded-xl border border-white/20">
              <div className="text-center p-8">
                <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-white text-lg font-semibold mb-2">
                  لا توجد لوحات متاحة
                </h3>
                <p className="text-gray-400">
                  لا توجد لوحات إعلانية متاحة للفترة المحددة
                </p>
                <Button
                  onClick={clearFilters}
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                >
                  تغيير الفلاتر
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-full rounded-xl overflow-hidden border border-white/20 relative">
              {/* WhatsApp Selection Mode Indicator */}
              {whatsAppSelectMode && (
                <div className="absolute top-4 left-4 z-[1001] bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
                  <MessageSquare className="h-5 w-5" />
                  <span className="font-medium">وضع اختيار الواتساب نشط - اضغط على أي لوحة لإضافتها</span>
                </div>
              )}

              {/* FIX: Stable key to prevent re-mounting */}
              <MapContainer
                key="broker-map-stable"
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: "100%", width: "100%" }}
                zoomControl={false}
                className="z-0"
                whenCreated={handleMapReady}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <ZoomControl position="bottomright" />

                <MapClickHandler onMapClick={handleMapClick} />

                <MapBoundsController markers={markers} map={mapRef.current} />

                {markers.map((marker) => {
                  const isSelected = selectedSigns.some(
                    (s) => s.id === marker.id,
                  );
                  const customIcon = createSimpleMarkerIcon(isSelected);

                  return (
                    <Marker
                      key={marker.id}
                      position={[marker.lat, marker.lng]}
                      icon={customIcon}
                      eventHandlers={{
                        click: () => handleMarkerClick(marker),
                      }}
                    >
                      <Popup>
                        <div className="text-right p-2 min-w-[220px]">
                          <h4 className="font-semibold mb-2 text-lg">
                            {marker.roadsign_code || `لوحة #${marker.id}`}
                          </h4>
                          <div className="space-y-2 text-sm mb-3">
                            <div className="flex justify-between items-start gap-2">
                              <span className="text-gray-500">📍 الموقع:</span>
                              <span className="text-right flex-1">
                                {marker.place || "غير محدد"}
                              </span>
                            </div>
                            <div className="flex justify-between items-start gap-2">
                              <span className="text-gray-500">🏙️ المدينة:</span>
                              <span className="text-right flex-1">
                                {marker.city?.name || "غير محدد"}
                              </span>
                            </div>
                            <div className="flex justify-between items-start gap-2">
                              <span className="text-gray-500">🗺️ المنطقة:</span>
                              <span className="text-right flex-1">
                                {marker.region?.name || "غير محدد"}
                              </span>
                            </div>
                            {marker.template && (
                              <div className="flex justify-between items-start gap-2">
                                <span className="text-gray-500">
                                  📏 النموذج:
                                </span>
                                <span className="text-right flex-1">
                                  {marker.template.model} -{" "}
                                  {marker.template.size}
                                </span>
                              </div>
                            )}
                            <div className="flex gap-2 mt-2 pt-2 border-t">
                              <div className="flex-1 text-center">
                                <div className="text-xs text-gray-500">
                                  اللوحات
                                </div>
                                <div className="font-bold">
                                  {marker.panels_number || 1}
                                </div>
                              </div>
                              <div className="flex-1 text-center">
                                <div className="text-xs text-gray-500">
                                  الوجوه
                                </div>
                                <div className="font-bold">
                                  {marker.faces_number || 1}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Quick Select Button */}
                          <QuickSelectButton
                            marker={marker}
                            isSelected={isSelected}
                            onSelect={handleQuickSelect}
                          />

                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full mt-2"
                            onClick={() => handleMarkerClick(marker)}
                          >
                            عرض التفاصيل الكاملة
                          </Button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

                <LocationControl
                  onLocate={(latlng) => {
                    setMapCenter([latlng.lat, latlng.lng]);
                    setMapZoom(15);
                  }}
                  map={mapRef.current}
                />
              </MapContainer>

              {/* Legend - RESPONSIVE */}
              <div className="absolute bottom-4 left-4 bg-slate-900/95 backdrop-blur-sm rounded-xl p-3 shadow-lg z-[1000] max-w-[200px]">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500 shrink-0"></div>
                    <span className="text-white text-xs">متاح</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-400 border-2 border-white shrink-0"></div>
                    <span className="text-white text-xs">مختار</span>
                  </div>
                </div>
              </div>

              {/* Marker Count */}
              <div className="absolute top-4 right-4 bg-blue-500 text-white rounded-full px-3 py-1.5 text-xs shadow-lg font-medium z-[1000]">
                {markers.length} لوحة
              </div>

              {/* Coordinates Toast */}
              {lastClickedCoords && (
                <div className="absolute bottom-24 left-4 bg-black/80 backdrop-blur-lg rounded-lg p-2 text-white text-xs z-[1000]">
                  📍 {lastClickedCoords.lat}, {lastClickedCoords.lng}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      <Dialog open={!!selectedSign} onOpenChange={closeDetails}>
        <DialogContent className="bg-slate-900 border-white/20 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedSign && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-2">
                  <MapPin className="h-6 w-6" />
                  {selectedSign.roadsign_code || `لوحة #${selectedSign.id}`}
                </DialogTitle>
                <DialogDescription className="text-gray-300">
                  معلومات مفصلة عن اللوحة الإعلانية
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div className="flex justify-center">
                  <Badge className="bg-green-600 text-lg px-4 py-2">
                    متاح
                  </Badge>
                </div>

                {selectedSign.image && (
                  <div className="rounded-lg overflow-hidden">
                    <img
                      src={selectedSign.image}
                      alt="Road sign"
                      className="w-full h-40 object-cover"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-lg p-3">
                    <Label className="text-gray-400 text-xs">رمز اللوحة</Label>
                    <p className="text-white font-mono text-sm mt-1">
                      {selectedSign.roadsign_code || "—"}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <Label className="text-gray-400 text-xs">النموذج</Label>
                    <p className="text-white text-sm mt-1">
                      {selectedSign.template?.model || "—"}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <Label className="text-gray-400 text-xs">الحجم</Label>
                    <p className="text-white text-sm mt-1">
                      {selectedSign.template?.size || "—"}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <Label className="text-gray-400 text-xs">النوع</Label>
                    <p className="text-white text-sm mt-1">
                      {selectedSign.template?.display_type || "—"}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <Label className="text-gray-400 text-xs">عدد اللوحات</Label>
                    <p className="text-white text-sm mt-1">
                      {selectedSign.panels_number || 1}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <Label className="text-gray-400 text-xs">عدد الوجوه</Label>
                    <p className="text-white text-sm mt-1">
                      {selectedSign.faces_number || 1}
                    </p>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-3">
                  <Label className="text-gray-400 text-xs flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    الموقع
                  </Label>
                  <p className="text-white text-sm mt-1">
                    {selectedSign.place || "عنوان غير محدد"}
                  </p>
                  <p className="text-white text-sm mt-1">
                    الاتجاه: {selectedSign.directions || "غير محدد"}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    الإحداثيات: {selectedSign.lat}, {selectedSign.lng}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-lg p-3">
                    <Label className="text-gray-400 text-xs">المدينة</Label>
                    <p className="text-white text-sm mt-1">
                      {selectedSign.city?.name || "—"}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <Label className="text-gray-400 text-xs">المنطقة</Label>
                    <p className="text-white text-sm mt-1">
                      {selectedSign.region?.name || "—"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={() =>
                      navigate(`/broker/road-signs/${selectedSign.id}`)
                    }
                  >
                    <Eye className="h-4 w-4 ml-2" />
                    عرض التفاصيل الكاملة
                  </Button>
                  <Button
                    variant="outline"
                    onClick={closeDetails}
                    className="flex-1 border-white/30 text-white hover:bg-white/10"
                  >
                    إغلاق
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Cart Sidebar - RESPONSIVE */}
      {showCart && (
        <div className="fixed inset-0 z-[2000]">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowCart(false)}
          />
          <div className="absolute left-0 top-0 h-full w-full max-w-md bg-slate-900 shadow-2xl overflow-y-auto border-r border-white/10">
            <div className="sticky top-0 p-4 border-b border-white/10 flex justify-between items-center bg-slate-900">
              <h3 className="text-lg font-bold text-white">سلة الاختيار</h3>
              <button
                onClick={() => setShowCart(false)}
                className="p-2 hover:bg-white/10 rounded-full text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Selected Signs List */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <h4 className="font-semibold text-base mb-3 text-white">
                  اللوحات المختارة ({selectedSigns.length})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedSigns.length === 0 ? (
                    <p className="text-center text-gray-400 py-8 text-sm">
                      لم يتم اختيار أي لوحة
                    </p>
                  ) : (
                    selectedSigns.map((sign) => (
                      <div
                        key={sign.id}
                        className="p-3 rounded-xl bg-white/5 border border-white/10"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-white">
                              {sign.roadsign_code}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {sign.city?.name} - {sign.region?.name}
                            </p>
                            {sign.template && (
                              <p className="text-xs text-gray-400 mt-1">
                                {sign.template.model}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveSign(sign.id)}
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Printing Type Selection - FIXED Z-INDEX */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 relative z-50">
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  نوع الطباعة <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedPrintingId || ""}
                    onChange={(e) => setSelectedPrintingId(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/30 text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    style={{ 
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'left 12px center',
                      backgroundSize: '16px',
                      paddingLeft: '40px'
                    }}
                  >
                    <option value="" className="bg-slate-800 text-white">اختر نوع الطباعة</option>
                    {printings.map((printing) => (
                      <option 
                        key={printing.id} 
                        value={printing.id}
                        className="bg-slate-800 text-white py-2"
                      >
                        {printing.type} - {printing.price} $
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product Type Selection - FIXED Z-INDEX */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 relative z-50">
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  نوع المنتج <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedProductType || ""}
                    onChange={(e) => setSelectedProductType(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/30 text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    style={{ 
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'left 12px center',
                      backgroundSize: '16px',
                      paddingLeft: '40px'
                    }}
                  >
                    <option value="" className="bg-slate-800 text-white">اختر نوع المنتج</option>
                    {PRODUCT_TYPES.map((type) => (
                      <option 
                        key={type.id} 
                        value={type.id}
                        className="bg-slate-800 text-white py-2"
                      >
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Calculate Button */}
              <Button
                onClick={handleCalculateTotal}
                disabled={
                  selectedSigns.length === 0 ||
                  !selectedPrintingId ||
                  !selectedProductType ||
                  isCalculating
                }
                className="w-full bg-green-600 hover:bg-green-700 text-white h-12"
              >
                {isCalculating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin ml-2" />
                    جاري الحساب...
                  </>
                ) : (
                  <>
                    <Calculator className="h-5 w-5 ml-2" />
                    حساب السعر
                  </>
                )}
              </Button>

              {/* Total Amount */}
              {totalAmount && (
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-base text-white">الإجمالي:</span>
                    <span className="text-2xl font-bold text-green-400">
                      {totalAmount} $
                    </span>
                  </div>
                </div>
              )}

              {/* WhatsApp Form */}
              {totalAmount && !showWhatsAppForm && (
                <Button
                  onClick={() => setShowWhatsAppForm(true)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white h-12"
                >
                  <Send className="h-5 w-5 ml-2" />
                  إرسال عبر واتساب
                </Button>
              )}

              {/* Customer Information Form */}
              {showWhatsAppForm && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                  <h4 className="font-semibold text-base text-white mb-2">
                    بيانات العميل
                  </h4>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-300">
                      رقم واتساب المستلم <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="tel"
                      name="whatsappNumber"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="مثال: 963912345678"
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                      dir="ltr"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      أدخل رقم الهاتف مع رمز الدولة (مثال: 963912345678)
                    </p>
                  </div>

                  <input
                    type="text"
                    name="customerName"
                    value={bookingData.customerName}
                    onChange={handleInputChange}
                    placeholder="الاسم الكامل *"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="tel"
                    name="customerPhone"
                    value={bookingData.customerPhone}
                    onChange={handleInputChange}
                    placeholder="رقم الهاتف *"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    dir="ltr"
                  />
                  <input
                    type="email"
                    name="customerEmail"
                    value={bookingData.customerEmail}
                    onChange={handleInputChange}
                    placeholder="البريد الإلكتروني (اختياري)"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    name="companyName"
                    value={bookingData.companyName}
                    onChange={handleInputChange}
                    placeholder="اسم الشركة (اختياري)"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea
                    name="notes"
                    value={bookingData.notes}
                    onChange={handleInputChange}
                    placeholder="ملاحظات إضافية (اختياري)"
                    rows="3"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    onClick={handleSendToWhatsApp}
                    disabled={
                      isSending ||
                      !bookingData.customerName ||
                      !bookingData.customerPhone ||
                      !whatsappNumber
                    }
                    className="w-full bg-green-600 hover:bg-green-700 text-white h-12 disabled:opacity-50"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin ml-2" />
                        جاري الإرسال...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5 ml-2" />
                        إرسال الطلب عبر واتساب
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
