import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Search,
  MapPin,
  Users,
  Briefcase,
  Calendar,
  CreditCard,
  Loader2,
  X,
  Clock,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  List,
  ArrowLeft,
  CalendarDays,
  ShoppingBag,
  Check,
  Plus,
  Trash2,
  HelpCircle,
  Sparkles,
  FileText,
  FileSignature,
  MoreHorizontal,
  Table2Icon,
  LayoutDashboard,
  FileText as FileTextIcon,
  Receipt,
  Map,
  BarChart3,
  CalendarClock,
  Wallet,
  Handshake,
  Percent,
  Tag,
  Truck,
  Package,
} from "lucide-react";
import { useLazyGlobalSearchQuery } from "../../RtkQuery/Slice/SearchApi/SearchApi";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import CustomerSearchSelect from "../../Components/Common/CustomerSearchSelect";
import { useAddNewBookingMutation } from "../../RtkQuery/Slice/Booking/BookingApi";
import { typeOptions, productTypeOptions, periodOptions, navLinksAdministrationPage } from "../../Static/StaticData";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { BASE_URL } from "../../Api/baseUrl";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Map for administration page icons
const adminIconMap = {
  "الاحصائيات": LayoutDashboard,
  "الطلبات": FileTextIcon,
  "الدفعات": Receipt,
  "المناطق والمدن": Map,
  "تقرير لوحات الزبائن": BarChart3,
  "التقرير الاسبوعي": CalendarClock,
  "الصندوق": Wallet,
  "الوسيط": Handshake,
};

// API call for printing types
const fetchPrintingTypes = async () => {
  const response = await fetch(`${BASE_URL}/printings`);
  if (!response.ok) {
    throw new Error('Failed to fetch printing types');
  }
  return response.json();
};

// API call for calculating booking amount (advertising/printing/total/discounted prices)
const fetchCalculatedAmount = async (payload) => {
  const response = await fetch(`${BASE_URL}/get-calculate-Amount`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Failed to calculate booking amount");
  }
  return response.json();
};

// Discount type options for the booking
const discountTypeOptions = [
  { value: "1", label: "نسبة مئوية %" },
  { value: "2", label: "قيمة ثابتة" },
];

const SEARCH_CATEGORIES = [
  { id: "templates", label: "النماذج", icon: Table2Icon, color: "text-purple-500", bgColor: "bg-purple-500/10" },
  { id: "roadsigns", label: "لوحات طرقية", icon: MapPin, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  { id: "customers", label: "العملاء", icon: Users, color: "text-green-500", bgColor: "bg-green-500/10" },
  { id: "employees", label: "الموظفون", icon: Briefcase, color: "text-purple-500", bgColor: "bg-purple-500/10" },
  { id: "bookings", label: "الحجوزات", icon: Calendar, color: "text-orange-500", bgColor: "bg-orange-500/10" },
  { id: "payments", label: "المدفوعات", icon: CreditCard, color: "text-red-500", bgColor: "bg-red-500/10" },
  { id: "suppliers", label: "الموردين", icon: Truck, color: "text-teal-500", bgColor: "bg-teal-500/10" },
  { id: "materials", label: "المواد", icon: Package, color: "text-amber-500", bgColor: "bg-amber-500/10" },
  { id: "administration", label: "الإدارة", icon: LayoutDashboard, color: "text-indigo-500", bgColor: "bg-indigo-500/10" },
];

// Small requestAnimationFrame-based counter so the total price "counts up"
// instead of just popping to the new value.
const useAnimatedNumber = (target, duration = 700) => {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = Number(target) || 0;
    const start = performance.now();

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return Math.round(display);
};

// Animated total price + per-roadsign details summary
const PriceSummary = ({
  isDark,
  isCalculating,
  advertisingPrice,
  printingPrice,
  totalPrice,
  totalPriceBeforeDiscount,
  discountType,
  discountedAdvertisingPrice,
  priceDetails,
}) => {
  const animatedTotal = useAnimatedNumber(totalPrice);
  const hasDiscount = discountType && totalPriceBeforeDiscount > totalPrice;

  return (
    <div
      className={cn(
        "mt-4 rounded-xl border overflow-hidden",
        isDark ? "bg-gray-700/40 border-gray-700" : "bg-gray-50 border-gray-200"
      )}
    >
      <div className="p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="text-sm">
            <span className={isDark ? "text-gray-400" : "text-gray-500"}>سعر الإعلان: </span>
            <span className="font-semibold">{advertisingPrice.toLocaleString("en-US")}</span>
          </div>
          <div className="text-sm">
            <span className={isDark ? "text-gray-400" : "text-gray-500"}>سعر الطباعة: </span>
            <span className="font-semibold">{printingPrice.toLocaleString("en-US")}</span>
          </div>
          {hasDiscount && (
            <div className="text-sm">
              <span className={isDark ? "text-gray-400" : "text-gray-500"}>بعد الخصم: </span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {discountedAdvertisingPrice.toLocaleString("en-US")}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-2">
          {hasDiscount && (
            <span className="text-sm line-through text-gray-400">
              {totalPriceBeforeDiscount.toLocaleString("en-US")}
            </span>
          )}
          <span className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
            الإجمالي:
          </span>
          <AnimatePresence mode="wait">
            <motion.span
              key={isCalculating ? "loading" : totalPrice}
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="text-2xl font-extrabold text-primary tabular-nums"
            >
              {isCalculating ? (
                <Loader2 className="h-6 w-6 animate-spin inline" />
              ) : (
                animatedTotal.toLocaleString("en-US")
              )}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {priceDetails.length > 0 && (
        <div
          className={cn(
            "border-t px-4 py-3 space-y-1.5",
            isDark ? "border-gray-700" : "border-gray-200"
          )}
        >
          <div className={cn("text-xs font-semibold mb-1", isDark ? "text-gray-400" : "text-gray-500")}>
            تفاصيل اللوحات
          </div>
          {priceDetails.map((detail, idx) => (
            <div
              key={detail.road_sign_id ?? idx}
              className="flex items-center justify-between text-xs"
            >
              <span className={isDark ? "text-gray-300" : "text-gray-600"}>
                لوحة #{detail.road_sign_id}
                {detail.template_model && ` — ${detail.template_model}`}
              </span>
              <span className="font-semibold">
                {Number(detail.face_price ?? 0).toLocaleString("en-US")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SearchInput = () => {
  const goBack = () => window.history.back();

  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains('dark') || 
    localStorage.getItem('theme') === 'dark'
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDarkMode = document.documentElement.classList.contains('dark') || 
                        localStorage.getItem('theme') === 'dark';
      setIsDark(isDarkMode);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [recentSearches, setRecentSearches] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [selectedRoadSigns, setSelectedRoadSigns] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [printingTypes, setPrintingTypes] = useState([]);
  const [isLoadingPrinting, setIsLoadingPrinting] = useState(false);

  const [customerFilter, setCustomerFilter] = useState("all");
  const [bookingTypeFilter, setBookingTypeFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [productTypeFilter, setProductTypeFilter] = useState("all");
  const [printingTypeFilter, setPrintingTypeFilter] = useState("all");
  const [customerPage, setCustomerPage] = useState(1);
  const [customerSearch, setCustomerSearch] = useState("");

  // Discount inputs for the booking
  const [discountType, setDiscountType] = useState("");
  const [discountValue, setDiscountValue] = useState("");

  // Prices returned from /get-calculate-Amount, sent as-is to /bookings
  const [advertisingPrice, setAdvertisingPrice] = useState(0);
  const [printingPrice, setPrintingPrice] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalPriceBeforeDiscount, setTotalPriceBeforeDiscount] = useState(0);
  const [priceDetails, setPriceDetails] = useState([]);
  const [discountedAdvertisingPrice, setDiscountedAdvertisingPrice] = useState(0);
  const [isCalculatingAmount, setIsCalculatingAmount] = useState(false);

  const inputRef = useRef(null);
  const [triggerSearch] = useLazyGlobalSearchQuery();
  const [addNewBooking] = useAddNewBookingMutation();


  // Fetch printing types
  useEffect(() => {
    const loadPrintingTypes = async () => {
      setIsLoadingPrinting(true);
      try {
        const data = await fetchPrintingTypes();
        setPrintingTypes(data);
      } catch (error) {
        console.error("Error fetching printing types:", error);
        toast.error("فشل في تحميل أنواع الطباعة");
      } finally {
        setIsLoadingPrinting(false);
      }
    };
    loadPrintingTypes();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      } catch (e) {
        setRecentSearches([]);
      }
    }

    inputRef.current?.focus();
  }, []);

  const saveRecentSearch = (searchQuery, result) => {
    const newSearch = {
      query: searchQuery,
      timestamp: Date.now(),
      category: result?.type || "all",
    };
    const updated = [newSearch, ...recentSearches.filter((s) => s.query !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  };

  // Function to search administration pages
  const searchAdministrationPages = (searchQuery) => {
    if (!searchQuery || searchQuery.trim().length < 2) return [];
    
    const lowerQuery = searchQuery.toLowerCase().trim();
    const results = [];

    navLinksAdministrationPage.forEach((link) => {
      const textMatch = link.text?.toLowerCase().includes(lowerQuery);
      const mobileTextMatch = link.mobileText?.toLowerCase().includes(lowerQuery);
      
      if (textMatch || mobileTextMatch) {
        const IconComponent = adminIconMap[link.text] || LayoutDashboard;
        
        results.push({
          id: `admin-${link.to || Math.random()}`,
          type: "administration",
          title: link.text,
          subtitle: link.mobileText,
          to: link.to ? `/dashboard/administration-page/${link.to}` : "/dashboard/administration-page",
          icon: IconComponent,
          badge: "إدارة",
          badgeColor: "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400",
          color: "text-indigo-500",
          bgColor: "bg-indigo-500/10",
          category: "الإدارة",
          details: [
            link.mobileText && `📱 ${link.mobileText}`,
            link.permission && `🔒 ${link.permission}`,
          ].filter(Boolean),
        });
      }
    });

    return results;
  };

  const toggleRoadSign = (item) => {
    const itemId = item.data?.id || item.id;
    const exists = selectedRoadSigns.some(
      (sign) => (sign.data?.id || sign.id) === itemId
    );

    if (exists) {
      setSelectedRoadSigns(selectedRoadSigns.filter(
        (sign) => (sign.data?.id || sign.id) !== itemId
      ));
    } else {
      setSelectedRoadSigns([...selectedRoadSigns, item]);
    }
  };

  const getResultMeta = (item) => {
    const model = item.type;
    const categoryInfo = SEARCH_CATEGORIES.find((c) => c.id === model);
    const CategoryIcon = categoryInfo?.icon || Search || HelpCircle;
    const data = item.data || item;

    if (model === "administration") {
      return {
        icon: item.icon || CategoryIcon,
        color: item.color || categoryInfo?.color || "text-indigo-500",
        bgColor: item.bgColor || categoryInfo?.bgColor || "bg-indigo-500/10",
        title: item.title || "صفحة إدارة",
        subtitle: item.subtitle || "",
        details: item.details || [],
        to: item.to || "/dashboard/administration-page",
        badge: item.badge || "إدارة",
        badgeColor: item.badgeColor || "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400",
        category: item.category || "الإدارة",
        isAdminPage: true,
      };
    }

    switch (model) {
      case "customers":
        return {
          icon: CategoryIcon,
          color: categoryInfo?.color || "text-gray-500",
          bgColor: categoryInfo?.bgColor || "bg-gray-500/10",
          title: data.full_name || data.company_name || "عميل بدون اسم",
          subtitle: data.company_name || data.phone_number || "",
          details: [
            data.company_name && `الشركة: ${data.company_name}`,
            data.phone_number && `📱 ${data.phone_number}`,
            typeof data.remaining === "number" && `💰 ${data.remaining.toLocaleString("en-US")}`,
          ].filter(Boolean),
          to: `/dashboard/customers/${data.id}`,
          badge: data.company_name ? "شركة" : "فرد",
          badgeColor: data.company_name
            ? "bg-blue-500/20 text-blue-600 dark:text-blue-400"
            : "bg-green-500/20 text-green-600 dark:text-green-400",
          category: "العملاء",
        };

      case "roadsigns": {
        const isBooked = item.is_booked;
        const isAvailable = isBooked === false;
        const isUndefined = isBooked === null || isBooked === undefined;

        let badgeText = "غير محدد";
        let badgeColor = "bg-gray-500/20 text-gray-600 dark:text-gray-400 border border-gray-500/30";
        let cardBg = "bg-gray-50/50 dark:bg-gray-800/50";
        let iconColor = "text-gray-500 dark:text-gray-400";
        let iconBg = "bg-gray-100 dark:bg-gray-700/50";

        if (isAvailable) {
          badgeText = "متاحة";
          badgeColor = "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30";
          cardBg = "bg-emerald-50/50 dark:bg-emerald-950/20";
          iconColor = "text-emerald-600 dark:text-emerald-400";
          iconBg = "bg-emerald-100 dark:bg-emerald-900/30";
        } else if (isBooked === true) {
          badgeText = "محجوزة";
          badgeColor = "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30";
          cardBg = "bg-rose-50/50 dark:bg-rose-950/20";
          iconColor = "text-rose-600 dark:text-rose-400";
          iconBg = "bg-rose-100 dark:bg-rose-900/30";
        }

        return {
          icon: CategoryIcon,
          color: categoryInfo?.color || "text-gray-500",
          bgColor: categoryInfo?.bgColor || "bg-gray-500/10",
          title: data.roadsign_code || data.place || "لوحة بدون كود",
          subtitle: data.place || data.directions || "",
          details: [
            data.place && `📍 ${data.place}`,
            data.directions && `🧭 ${data.directions}`,
            typeof data.panels_number === "number" && `📋 ${data.panels_number} لوح`,
            typeof data.faces_number === "number" && `👁️ ${data.faces_number} وجه`,
          ].filter(Boolean),
          to: `/dashboard/road_signs/${data.id}/stats`,
          badge: badgeText,
          badgeColor: badgeColor,
          cardBorder: isAvailable ? "hover:border-emerald-500/50" : isBooked === true ? "hover:border-rose-500/50" : "hover:border-gray-500/50",
          cardBg: cardBg,
          category: "اللوحات الطرقية",
          isBooked: isBooked,
          isAvailable: isAvailable,
          isUndefined: isUndefined,
          iconColor: iconColor,
          iconBg: iconBg,
        };
      }

      case "templates":
        return {
          icon: CategoryIcon,
          color: categoryInfo?.color || "text-gray-500",
          bgColor: categoryInfo?.bgColor || "bg-gray-500/10",
          title: data.model || data.name || data.title || "نموذج بدون اسم",
          subtitle: data.type || data.display_type || "",
          details: [
            data.type && `نوع: ${data.type}`,
            data.model && `الموديل: ${data.model}`,
            data.display_type && `نوع العرض: ${data.display_type}`,
            data.size && `الحجم: ${data.size}`,
            typeof data.advertising_space === "number" && `مساحة الإعلان: ${data.advertising_space}`,
            typeof data.printing_space === "number" && `مساحة الطباعة: ${data.printing_space}`,
            typeof data.faces_number === "number" && `عدد الوجوه: ${data.faces_number}`,
            data.color && `اللون: ${data.color}`,
          ].filter(Boolean),
          to: `/dashboard/models/${data.id}`,
          badge: data.model || "نموذج",
          badgeColor: "bg-purple-500/20 text-purple-600 dark:text-purple-400",
          category: "النماذج",
        };

      case "employees":
        return {
          icon: CategoryIcon,
          color: categoryInfo?.color || "text-gray-500",
          bgColor: categoryInfo?.bgColor || "bg-gray-500/10",
          title: data.full_name || data.username || "موظف بدون اسم",
          subtitle: data.department || data.phone_number || "",
          details: [
            data.username && `👤 ${data.username}`,
            data.phone_number && `📱 ${data.phone_number}`,
            data.department && `🏢 ${data.department}`,
          ].filter(Boolean),
          to: `/dashboard/users/${data.id}`,
          badge: data.department || "موظف",
          badgeColor: "bg-purple-500/20 text-purple-600 dark:text-purple-400",
          category: "الموظفون",
        };

      case "bookings":
        return {
          icon: CategoryIcon,
          color: categoryInfo?.color || "text-gray-500",
          bgColor: categoryInfo?.bgColor || "bg-gray-500/10",
          title: `حجز #${data.id}`,
          subtitle: data.customer?.full_name || data.customer?.company_name || "عميل غير معروف",
          details: [
            data.customer?.full_name || data.customer?.company_name || "عميل غير معروف",
            data.start_date && `📅 ${data.start_date}`,
            data.end_date && `➡️ ${data.end_date}`,
            typeof data.total_price === "number" && `💰 ${data.total_price.toLocaleString("en-US")}`,
          ].filter(Boolean),
          to: `/dashboard/bookings/${data.id}`,
          badge: data.status === 1 ? "نشط" : data.status === 0 ? "غير نشط" : "",
          badgeColor:
            data.status === 1
              ? "bg-green-500/20 text-green-600 dark:text-green-400"
              : "bg-gray-500/20 text-gray-600 dark:text-gray-400",
          category: "الحجوزات",
          isBooking: true,
          bookingId: data.id,
        };

      case "payments":
        return {
          icon: CategoryIcon,
          color: categoryInfo?.color || "text-gray-500",
          bgColor: categoryInfo?.bgColor || "bg-gray-500/10",
          title: `دفعة #${data.id}`,
          subtitle: data.customer?.full_name || "",
          details: [
            typeof data.total === "number" && `💰 ${data.total.toLocaleString("en-US")}`,
            data.date && `📅 ${data.date}`,
            data.customer?.full_name && `👤 ${data.customer.full_name}`,
          ].filter(Boolean),
          to: `/dashboard/payments`,
          badge: data.status === 1 ? "مكتمل" : "معلق",
          badgeColor:
            data.status === 1
              ? "bg-green-500/20 text-green-600 dark:text-green-400"
              : "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
          category: "المدفوعات",
        };

      case "suppliers":
        return {
          icon: CategoryIcon,
          color: categoryInfo?.color || "text-gray-500",
          bgColor: categoryInfo?.bgColor || "bg-gray-500/10",
          title: data.name || "مورد بدون اسم",
          subtitle: data.category?.name || data.phone || "",
          details: [
            data.phone && `📞 ${data.phone}`,
            data.address && `📍 ${data.address}`,
            data.category?.name && `🏷️ ${data.category.name}`,
          ].filter(Boolean),
          to: `/dashboard/accounting?tab=suppliers`,
          badge: data.is_active === false ? "غير نشط" : "مورد",
          badgeColor: "bg-teal-500/20 text-teal-600 dark:text-teal-400",
          category: "الموردين",
        };

      case "materials":
        return {
          icon: CategoryIcon,
          color: categoryInfo?.color || "text-gray-500",
          bgColor: categoryInfo?.bgColor || "bg-gray-500/10",
          title: data.name || "مادة بدون اسم",
          subtitle: data.unit || "",
          details: [data.unit && `الوحدة: ${data.unit}`].filter(Boolean),
          to: `/dashboard/accounting?tab=materials`,
          badge: data.is_active === false ? "غير نشطة" : "مادة",
          badgeColor: "bg-amber-500/20 text-amber-600 dark:text-amber-400",
          category: "المواد",
        };

      default:
        return {
          icon: CategoryIcon,
          color: "text-gray-500",
          bgColor: "bg-gray-500/10",
          title: item.title || item.name || `نتيجة #${item.id}`,
          subtitle: item.subtitle || "",
          details: [item.subtitle || ""],
          to: `/dashboard/${model}/${data?.id || ""}`,
          badge: "",
          badgeColor: "",
          category: "عام",
        };
    }
  };

  // Booking Actions Dropdown Component
  const BookingActions = ({ bookingId }) => {
    const handleGeneratePDF = (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.open(`/dashboard/bookings/${bookingId}`, '_blank');
    };

    const handleGenerateContract = (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.open(`/dashboard/booking/${bookingId}`, '_blank');
    };

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={handleGeneratePDF}
            className="flex items-center gap-2 cursor-pointer"
          >
            <FileText className="h-4 w-4 text-blue-600" />
            <span>توليد PDF</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleGenerateContract}
            className="flex items-center gap-2 cursor-pointer"
          >
            <FileSignature className="h-4 w-4 text-emerald-600" />
            <span>العقد</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const handleSearch = useCallback(
    async (targetPage = page) => {
      if (!query.trim() && !startDate && !endDate) {
        const adminResults = searchAdministrationPages(query);
        if (adminResults.length > 0) {
          setResults(adminResults);
          setHasMore(false);
        } else {
          setResults([]);
          setHasMore(false);
        }
        return;
      }

      setIsLoading(true);
      try {
        const models =
          selectedCategory === "all"
            ? ["templates", "roadsigns", "customers", "employees", "bookings", "payments", "suppliers", "materials"]
            : selectedCategory === "administration"
              ? []
              : [selectedCategory];

        if (selectedCategory === "administration") {
          const adminResults = searchAdministrationPages(query);
          setResults(adminResults);
          setHasMore(false);
          setIsLoading(false);
          return;
        }

        const searchParams = {
          model: models,
          query: query.trim() || "",
          page: targetPage,
          per_page: 15,
        };

        if (startDate) {
          searchParams.start_date = startDate;
        }
        if (endDate) {
          searchParams.end_date = endDate;
        }

        if (selectedCategory === "roadsigns" || selectedCategory === "all") {
          if (customerFilter && customerFilter !== "all") {
            searchParams.customer_id = customerFilter;
          }
          if (bookingTypeFilter && bookingTypeFilter !== "all") {
            searchParams.booking_type = bookingTypeFilter;
          }
          if (periodFilter && periodFilter !== "all") {
            searchParams.periods = periodFilter;
          }
          if (productTypeFilter && productTypeFilter !== "all") {
            searchParams.product_type = productTypeFilter;
          }
          if (printingTypeFilter && printingTypeFilter !== "all") {
            searchParams.printing_type = printingTypeFilter;
          }
        }

        console.log("🔍 Search Params:", searchParams);

        const response = await triggerSearch(searchParams, true).unwrap();

        let allResults = [];
        if (response?.data) {
          if (Array.isArray(response.data)) {
            allResults.push(...response.data);
          } else {
            Object.keys(response.data).forEach((key) => {
              if (Array.isArray(response.data[key])) {
                allResults.push(...response.data[key]);
              }
            });
          }
        }

        const adminResults = searchAdministrationPages(query);
        allResults = [...allResults, ...adminResults];

        setResults(allResults);

        if (response?.meta?.has_more !== undefined) {
          setHasMore(response.meta.has_more);
        } else if (response?.meta?.last_page !== undefined) {
          setHasMore(targetPage < response.meta.last_page);
        } else {
          setHasMore(allResults.length >= 10);
        }

        if (allResults.length > 0 && targetPage === 1 && query.trim()) {
          saveRecentSearch(query.trim(), allResults[0]);
        }
      } catch (error) {
        console.error("Search API Error:", error);
        const adminResults = searchAdministrationPages(query);
        setResults(adminResults);
        setHasMore(false);
      } finally {
        setIsLoading(false);
      }
    },
    [query, selectedCategory, page, startDate, endDate, triggerSearch, customerFilter, bookingTypeFilter, periodFilter, productTypeFilter, printingTypeFilter]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2 || startDate || endDate) {
        setPage(1);
        handleSearch(1);
      } else if (query.trim().length === 0 && !startDate && !endDate) {
        setResults([]);
        setHasMore(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [query, selectedCategory, startDate, endDate, customerFilter, bookingTypeFilter, periodFilter, productTypeFilter, printingTypeFilter, handleSearch]);

  // Calculate advertising/printing/total/discounted prices whenever the
  // inputs that affect the price change.
  const calculateBookingAmount = useCallback(async () => {
    if (selectedRoadSigns.length === 0 || !startDate || !endDate) {
      setAdvertisingPrice(0);
      setPrintingPrice(0);
      setTotalPrice(0);
      setTotalPriceBeforeDiscount(0);
      setDiscountedAdvertisingPrice(0);
      setPriceDetails([]);
      return;
    }

    setIsCalculatingAmount(true);
    try {
      const roadsignsPayload = selectedRoadSigns.map((item) => ({
        road_sign_id: item.data?.id || item.id,
        booking_faces: 1,
        number_of_reserved_panels: 1,
        start_date: startDate,
        end_date: endDate,
      }));

      const payload = {
        product_type: parseInt(productTypeFilter) || 1,
        printing_id: parseInt(printingTypeFilter) || 1,
        start_date: startDate,
        end_date: endDate,
        is_extend: false,
        roadsigns: roadsignsPayload,
      };

      if (discountType) {
        payload.discount_type = parseInt(discountType);
      }
      if (discountValue !== "" && discountValue !== null) {
        payload.value = parseFloat(discountValue);
      }

      const response = await fetchCalculatedAmount(payload);
      // The real payload is nested under `amount`, not top-level
      const amount = response?.amount ?? {};

      setAdvertisingPrice(amount.total_advertising_price ?? 0);
      setPrintingPrice(amount.total_printing_price ?? 0);
      setTotalPrice(amount.total_price ?? 0);
      setTotalPriceBeforeDiscount(
        amount.total_price_befor_discount ?? amount.total_price ?? 0
      );
      setDiscountedAdvertisingPrice(
        amount.discounted_advertising_price ?? amount.total_advertising_price ?? 0
      );
      setPriceDetails(Array.isArray(amount.details) ? amount.details : []);
    } catch (error) {
      console.error("Calculate amount error:", error);
      toast.error("تعذّر حساب سعر الحجز");
    } finally {
      setIsCalculatingAmount(false);
    }
  }, [selectedRoadSigns, startDate, endDate, productTypeFilter, printingTypeFilter, discountType, discountValue]);

  // Debounced recalculation (mirrors the pattern of the existing search debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      calculateBookingAmount();
    }, 500);
    return () => clearTimeout(timer);
  }, [calculateBookingAmount]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setPage(1);
      handleSearch(1);
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setPage(1);
    setHasMore(false);
    inputRef.current?.focus();
  };

  const handleRecentSearchClick = (searchQuery) => {
    setQuery(searchQuery);
    setPage(1);
    setTimeout(() => {
      handleSearch(1);
    }, 100);
  };

  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
    setPage(1);
    if (catId !== "roadsigns" && catId !== "all" && catId !== "administration") {
      setCustomerFilter("all");
      setBookingTypeFilter("all");
      setPeriodFilter("all");
      setProductTypeFilter("all");
      setPrintingTypeFilter("all");
      setCustomerPage(1);
      setCustomerSearch("");
      setDiscountType("");
      setDiscountValue("");
    }
  };

  const handleNextPage = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    handleSearch(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrevPage = () => {
    if (page <= 1) return;
    const prevPage = page - 1;
    setPage(prevPage);
    handleSearch(prevPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCreateBooking = async () => {
    if (!startDate || !endDate) {
      toast.error("يرجى تحديد تاريخ البداية والنهاية");
      return;
    }

    if (selectedRoadSigns.length === 0) {
      toast.error("يرجى اختيار لوحة طرقية على الأقل");
      return;
    }

    const customerId = customerFilter !== "all" ? parseInt(customerFilter) : null;
    
    if (!customerId) {
      toast.error("يرجى اختيار زبون");
      return;
    }

    setIsCreatingBooking(true);

    try {
      const roadsigns = selectedRoadSigns.map((item) => ({
        road_sign_id: item.data?.id || item.id,
        booking_faces: 1,
        number_of_reserved_panels: 1,
        start_date: startDate,
        end_date: endDate,
        units: parseInt(periodFilter) || 1,
      }));

      const bookingData = {
        customer_id: customerId,
        type: parseInt(bookingTypeFilter) || 1,
        start_date: startDate,
        end_date: endDate,
        product_type: parseInt(productTypeFilter) || 1,
        printing_id: parseInt(printingTypeFilter) || 1,
        roadsigns: roadsigns,
        advertising_price: advertisingPrice,
        printing_price: printingPrice,
        total_price: totalPrice,
        discounted_advertising_price: discountedAdvertisingPrice,
        notes: null,
        discount_type: discountType ? parseInt(discountType) : null,
        value: discountValue !== "" && discountValue !== null ? parseFloat(discountValue) : null,
      };

      console.log("Booking Data:", bookingData);

      const response = await addNewBooking(bookingData).unwrap();
      
      toast.success(`تم إنشاء الحجز بنجاح لـ ${selectedRoadSigns.length} لوحة/لوحات!`);
      
      setSelectedRoadSigns([]);
      setDiscountType("");
      setDiscountValue("");
      setAdvertisingPrice(0);
      setPrintingPrice(0);
      setTotalPrice(0);
      setTotalPriceBeforeDiscount(0);
      setDiscountedAdvertisingPrice(0);
      setPriceDetails([]);
      
      setTimeout(() => {
        window.location.href = `/dashboard/bookings/${response.data?.id || ''}`;
      }, 1500);
      
    } catch (error) {
      console.error("Booking creation error:", error);
      toast.error(error?.data?.message || "حدث خطأ أثناء إنشاء الحجز");
    } finally {
      setIsCreatingBooking(false);
    }
  };

  const resetRoadSignFilters = () => {
    setCustomerFilter("all");
    setBookingTypeFilter("all");
    setPeriodFilter("all");
    setProductTypeFilter("all");
    setPrintingTypeFilter("all");
    setCustomerPage(1);
    setCustomerSearch("");
    setDiscountType("");
    setDiscountValue("");
  };

  const filteredResults =
    selectedCategory === "all"
      ? results
      : results.filter((r) => r.type === selectedCategory || 
          (selectedCategory === "administration" && r.type === "administration"));

  const isRoadSignCategory = selectedCategory === "all" || selectedCategory === "roadsigns";
  const isTemplateCategory = selectedCategory === "all" || selectedCategory === "templates";
  const showDateFilter = selectedCategory === "all" || selectedCategory === "roadsigns" || selectedCategory === "templates";
  const showRoadSignFilters = selectedCategory === "all" || selectedCategory === "roadsigns";

  const canCreateBooking = selectedRoadSigns.length > 0 && startDate && endDate;

  const CategoryFilterButton = ({ id, label, icon: Icon }) => (
    <button
      type="button"
      onClick={() => handleCategoryChange(id)}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
        selectedCategory === id
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
          : isDark
          ? "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
      )}
    >
      {Icon && <Icon className="h-4 w-4" />}
      <span>{label}</span>
    </button>
  );

  return (
    <div className={cn("min-h-screen p-6 transition-colors duration-200 relative", isDark ? "bg-gray-900" : "bg-gray-50")}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={goBack}
              className={cn(
                "p-2 rounded-lg transition-colors",
                isDark ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-200 text-gray-600"
              )}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>
              البحث المتقدم
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {selectedRoadSigns.length > 0 && (
              <span className={cn("text-sm font-medium", isDark ? "text-gray-300" : "text-gray-700")}>
                المحدد: {selectedRoadSigns.length} لوحة
              </span>
            )}
            <Button
              onClick={handleCreateBooking}
              disabled={!canCreateBooking || isCreatingBooking}
              className="rounded-xl px-6 py-2 font-semibold"
            >
              {isCreatingBooking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جاري الحجز...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 ml-2" />
                  حجز الآن
                </>
              )}
            </Button>
          </div>
        </div>

        <div className={cn("rounded-2xl p-6 mb-6 transition-colors shadow-lg", isDark ? "bg-gray-800" : "bg-white")}>
          <div className="flex flex-col gap-4">
            <div className="relative flex items-center gap-2">
              <div className="flex-1 relative">
                <Search
                  className={cn(
                    "absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5",
                    isDark ? "text-gray-500" : "text-gray-400"
                  )}
                />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="ابحث عن العملاء، اللوحات، الحجوزات، أو صفحات الإدارة..."
                  value={query}
                  onKeyDown={handleKeyDown}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (!e.target.value.trim() && !startDate && !endDate) {
                      setResults([]);
                    }
                  }}
                  className={cn(
                    "w-full py-3 pr-12 pl-4 rounded-xl text-lg outline-none transition-colors border focus:border-transparent",
                    isDark
                      ? "bg-gray-700 text-white placeholder:text-gray-400 border-gray-600 focus:ring-2 focus:ring-primary"
                      : "bg-gray-50 text-gray-900 placeholder:text-gray-400 border-gray-200 focus:ring-2 focus:ring-primary"
                  )}
                />
                {query && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className={cn(
                      "absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors",
                      isDark ? "hover:bg-gray-600" : "hover:bg-gray-200"
                    )}
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                )}
              </div>

              <Button
                onClick={() => {
                  setPage(1);
                  handleSearch(1);
                }}
                disabled={isLoading || (!query.trim() && !startDate && !endDate)}
                className="px-6 h-12 rounded-xl"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Search className="h-4 w-4 ml-2" />
                    بحث
                  </>
                )}
              </Button>
            </div>

            {showDateFilter && (
              <div
                className={cn(
                  "p-4 rounded-xl border flex flex-wrap items-center gap-4 transition-all duration-200",
                  isDark ? "bg-gray-700/40 border-gray-700" : "bg-gray-50 border-gray-200"
                )}
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  <span>تصفية حسب التوفر (تاريخ الحجز):</span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className={cn("text-xs font-medium", isDark ? "text-gray-300" : "text-gray-600")}>
                      من:
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        if (e.target.value || endDate) {
                          setPage(1);
                        }
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm border outline-none transition-colors",
                        isDark
                          ? "bg-gray-800 border-gray-600 text-white focus:border-primary"
                          : "bg-white border-gray-300 text-gray-900 focus:border-primary"
                      )}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <label className={cn("text-xs font-medium", isDark ? "text-gray-300" : "text-gray-600")}>
                      إلى:
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        if (startDate || e.target.value) {
                          setPage(1);
                        }
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm border outline-none transition-colors",
                        isDark
                          ? "bg-gray-800 border-gray-600 text-white focus:border-primary"
                          : "bg-white border-gray-300 text-gray-900 focus:border-primary"
                      )}
                    />
                  </div>

                  {(startDate || endDate) && (
                    <button
                      type="button"
                      onClick={() => {
                        setStartDate("");
                        setEndDate("");
                        setPage(1);
                        setResults([]);
                        setHasMore(false);
                      }}
                      className="text-xs text-rose-500 hover:underline transition-all"
                    >
                      إلغاء التواريخ
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <CategoryFilterButton id="all" label="الكل" icon={Grid3x3} />
              {SEARCH_CATEGORIES.map((cat) => (
                <CategoryFilterButton key={cat.id} {...cat} />
              ))}
            </div>
          </div>
        </div>

        {showRoadSignFilters && (
          <div className={cn(
            "rounded-2xl p-4 mb-6 transition-colors shadow-lg border",
            isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
          )}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={cn("text-sm font-semibold", isDark ? "text-gray-300" : "text-gray-700")}>
                <MapPin className="h-4 w-4 inline ml-2 text-primary" />
                فلتر اللوحات الطرقية
              </h3>
              <button
                type="button"
                onClick={resetRoadSignFilters}
                className="text-xs text-rose-500 hover:underline transition-all"
              >
                إعادة تعيين
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <div>
                <label className={cn("block text-sm font-medium mb-2", isDark ? "text-gray-300" : "text-gray-700")}>
                  الزبون
                </label>
                {/* بحث من الخادم + تمرير لا نهائي (بدل "تحميل المزيد") */}
                <CustomerSearchSelect
                  value={customerFilter}
                  onChange={(id) => setCustomerFilter(id || "all")}
                  allowAll
                  allValue="all"
                  allLabel="الكل"
                />
              </div>

              <div>
                <label className={cn("block text-sm font-medium mb-2", isDark ? "text-gray-300" : "text-gray-700")}>
                  نوع الحجز
                </label>
                <Select
                  onValueChange={(value) => setBookingTypeFilter(value)}
                  value={bookingTypeFilter}
                >
                  <SelectTrigger className="w-full text-right">
                    <SelectValue placeholder="اختر نوع الحجز" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    {typeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className={cn("block text-sm font-medium mb-2", isDark ? "text-gray-300" : "text-gray-700")}>
                  الدورة (الفترات)
                </label>
                <Select
                  onValueChange={(value) => setPeriodFilter(value)}
                  value={periodFilter}
                >
                  <SelectTrigger className="w-full text-right">
                    <SelectValue placeholder="اختر عدد الفترات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    {periodOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-xs text-gray-500 mt-1">
                  كل فترة = 7 يوم + 7 أيام إضافية
                </div>
              </div>

              <div>
                <label className={cn("block text-sm font-medium mb-2", isDark ? "text-gray-300" : "text-gray-700")}>
                  نوع المنتج
                </label>
                <Select
                  onValueChange={(value) => setProductTypeFilter(value)}
                  value={productTypeFilter}
                >
                  <SelectTrigger className="w-full text-right">
                    <SelectValue placeholder="اختر نوع المنتج" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    {productTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className={cn("block text-sm font-medium mb-2", isDark ? "text-gray-300" : "text-gray-700")}>
                  نوع الطباعة
                </label>
                <Select
                  onValueChange={(value) => setPrintingTypeFilter(value)}
                  value={printingTypeFilter}
                >
                  <SelectTrigger className="w-full text-right">
                    <SelectValue placeholder={isLoadingPrinting ? "جاري التحميل..." : "اختر نوع الطباعة"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    {isLoadingPrinting ? (
                      <SelectItem value="loading" disabled>جاري تحميل أنواع الطباعة...</SelectItem>
                    ) : printingTypes.length === 0 ? (
                      <SelectItem value="empty" disabled>لا توجد أنواع طباعة متاحة</SelectItem>
                    ) : (
                      printingTypes.map((printing) => (
                        <SelectItem key={printing.id} value={printing.id.toString()}>
                          {printing.type} - {printing.price?.toLocaleString()} 
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className={cn("block text-sm font-medium mb-2", isDark ? "text-gray-300" : "text-gray-700")}>
                  <Tag className="h-3.5 w-3.5 inline ml-1 text-primary" />
                  نوع الخصم
                </label>
                <Select
                  onValueChange={(value) => setDiscountType(value === "none" ? "" : value)}
                  value={discountType || "none"}
                >
                  <SelectTrigger className="w-full text-right">
                    <SelectValue placeholder="بدون خصم" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون خصم</SelectItem>
                    {discountTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className={cn("block text-sm font-medium mb-2", isDark ? "text-gray-300" : "text-gray-700")}>
                  <Percent className="h-3.5 w-3.5 inline ml-1 text-primary" />
                  قيمة الخصم
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  disabled={!discountType}
                  className="w-full text-right"
                />
              </div>
            </div>

            {selectedRoadSigns.length > 0 && startDate && endDate && (
              <PriceSummary
                isDark={isDark}
                isCalculating={isCalculatingAmount}
                advertisingPrice={advertisingPrice}
                printingPrice={printingPrice}
                totalPrice={totalPrice}
                totalPriceBeforeDiscount={totalPriceBeforeDiscount}
                discountType={discountType}
                discountedAdvertisingPrice={discountedAdvertisingPrice}
                priceDetails={priceDetails}
              />
            )}
          </div>
        )}

        <div className="space-y-4">
          {!isLoading && results.length > 0 && (
            <div
              className={cn(
                "flex items-center justify-between px-4 py-3 rounded-xl shadow-sm",
                isDark ? "bg-gray-800" : "bg-white"
              )}
            >
              <div className="flex items-center gap-3">
                <span className={cn("text-sm font-medium", isDark ? "text-gray-300" : "text-gray-700")}>
                  <span className="font-bold">{filteredResults.length}</span> نتيجة في هذه الصفحة
                  {selectedCategory !== "all" && (
                    <span className="mx-1">
                      في {SEARCH_CATEGORIES.find((c) => c.id === selectedCategory)?.label}
                    </span>
                  )}
                </span>
              </div>
              <span className={cn("text-xs font-semibold", isDark ? "text-gray-400" : "text-gray-500")}>
                الصفحة {page}
              </span>
            </div>
          )}

          {isLoading ? (
            <div className={cn("rounded-2xl p-12 text-center", isDark ? "bg-gray-800" : "bg-white")}>
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className={cn("text-lg font-medium", isDark ? "text-gray-300" : "text-gray-700")}>
                جاري البحث...
              </p>
            </div>
          ) : results.length > 0 ? (
            <>
              <div
                className={cn(
                  "grid gap-4",
                  viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
                )}
              >
                {filteredResults.map((item, index) => {
                  const meta = getResultMeta(item);
                  const ItemIcon = meta.icon || Search;
                  const itemId = item.data?.id || item.id;
                  const isSelected = selectedRoadSigns.some(
                    (sign) => (sign.data?.id || sign.id) === itemId
                  );

                  if (item.type === "administration") {
                    return (
                      <a
                        key={item.id ?? index}
                        href={meta.to}
                        className={cn(
                          "group relative rounded-2xl p-5 transition-all duration-200 shadow-sm flex flex-col justify-between border",
                          isDark ? "bg-gray-800 hover:bg-gray-700 border-gray-700" : "bg-white hover:shadow-xl border-gray-100"
                        )}
                      >
                        <div className="block flex-1">
                          <div className="flex items-start gap-4">
                            <div
                              className={cn(
                                "flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center",
                                meta.bgColor || "bg-indigo-500/10"
                              )}
                            >
                              <ItemIcon className={cn("h-6 w-6", meta.color || "text-indigo-500")} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h3
                                    className={cn(
                                      "font-semibold text-base truncate",
                                      isDark ? "text-white" : "text-gray-900"
                                    )}
                                  >
                                    {meta.title}
                                  </h3>
                                  {meta.subtitle && meta.subtitle !== meta.title && (
                                    <p
                                      className={cn(
                                        "text-sm truncate mt-0.5",
                                        isDark ? "text-gray-400" : "text-gray-500"
                                      )}
                                    >
                                      {meta.subtitle}
                                    </p>
                                  )}
                                </div>
                                {meta.badge && (
                                  <span
                                    className={cn(
                                      "text-xs px-2.5 py-1 rounded-full font-semibold whitespace-nowrap flex-shrink-0",
                                      meta.badgeColor || "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                                    )}
                                  >
                                    {meta.badge}
                                  </span>
                                )}
                              </div>

                              {meta.details && meta.details.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {meta.details.slice(0, 3).map((detail, idx) => (
                                    <span
                                      key={idx}
                                      className={cn(
                                        "text-xs px-2 py-1 rounded-md",
                                        isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"
                                      )}
                                    >
                                      {detail}
                                    </span>
                                  ))}
                                </div>
                              )}

                              <div className="mt-3 flex items-center gap-2">
                                <span
                                  className={cn(
                                    "text-xs px-2 py-0.5 rounded-full",
                                    isDark ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-500"
                                  )}
                                >
                                  {meta.category}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </a>
                    );
                  }

                  if (item.type === "roadsigns") {
                    return (
                      <motion.div
                        key={item.id ?? index}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => toggleRoadSign(item)}
                        className={cn(
                          "group relative rounded-2xl p-5 transition-all duration-200 shadow-sm flex flex-col justify-between border cursor-pointer",
                          meta.cardBorder || "",
                          meta.cardBg || "",
                          isSelected
                            ? "border-primary ring-2 ring-primary"
                            : isDark
                            ? "bg-gray-800 hover:bg-gray-700 border-gray-700"
                            : "hover:shadow-xl border-gray-100"
                        )}
                      >
                        <div className="block flex-1">
                          <div className="flex items-start gap-4">
                            <div
                              className={cn(
                                "flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center",
                                meta.iconBg || "bg-gray-100 dark:bg-gray-700/50"
                              )}
                            >
                              <ItemIcon className={cn(
                                "h-6 w-6",
                                meta.iconColor || "text-gray-500 dark:text-gray-400"
                              )} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h3
                                    className={cn(
                                      "font-semibold text-base truncate",
                                      isDark ? "text-white" : "text-gray-900"
                                    )}
                                  >
                                    {meta.title}
                                  </h3>
                                  {meta.subtitle && (
                                    <p
                                      className={cn(
                                        "text-sm truncate mt-0.5",
                                        isDark ? "text-gray-400" : "text-gray-500"
                                      )}
                                    >
                                      {meta.subtitle}
                                    </p>
                                  )}
                                </div>
                                <span
                                  className={cn(
                                    "text-xs px-2.5 py-1 rounded-full font-semibold whitespace-nowrap flex-shrink-0",
                                    meta.badgeColor
                                  )}
                                >
                                  {meta.badge}
                                </span>
                              </div>

                              {meta.details.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {meta.details.slice(0, 3).map((detail, idx) => (
                                    <span
                                      key={idx}
                                      className={cn(
                                        "text-xs px-2 py-1 rounded-md",
                                        isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"
                                      )}
                                    >
                                      {detail}
                                    </span>
                                  ))}
                                  {meta.details.length > 3 && (
                                    <span
                                      className={cn(
                                        "text-xs px-2 py-1 rounded-md",
                                        isDark ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-400"
                                      )}
                                    >
                                      +{meta.details.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}

                              <div className="mt-3 flex items-center gap-2">
                                <span
                                  className={cn(
                                    "text-xs px-2 py-0.5 rounded-full",
                                    meta.isBooked === true
                                      ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                                      : meta.isBooked === false
                                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                      : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                                  )}
                                >
                                  {meta.isBooked === true ? "🔴 محجوزة" : meta.isBooked === false ? "🟢 متاحة" : "⚪ غير محدد"}
                                </span>
                                <span
                                  className={cn(
                                    "text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700",
                                    isDark ? "text-gray-500" : "text-gray-400"
                                  )}
                                >
                                  {meta.category}
                                </span>
                              </div>

                              {/* تفاصيل الحجز: من تاريخ الى تاريخ ومن هو الزبون
                                  (الشركة) صاحب الحجز - تُعرض سواء أُخذت
                                  الفترة الافتراضية (اليوم -> +15 يوم) أو
                                  حدَّد المستخدم تاريخًا مخصصًا. */}
                              {meta.isBooked === true && Array.isArray(item.reservations) && item.reservations.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {item.reservations.map((res, resIdx) => (
                                    <div
                                      key={res.booking_id ?? resIdx}
                                      className={cn(
                                        "text-[11px] rounded-md px-2 py-1",
                                        isDark ? "bg-rose-950/30 text-rose-300" : "bg-rose-50 text-rose-700"
                                      )}
                                    >
                                      <span className="font-medium">
                                        {res.customer_name || "زبون غير معروف"}
                                      </span>
                                      {res.start_date && res.end_date && (
                                        <span className="mx-1">
                                          — من {res.start_date} إلى {res.end_date}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <Check className="h-5 w-5 text-primary" />
                          </div>
                        )}
                      </motion.div>
                    );
                  }

                  const isBooking = meta.isBooking === true;
                  const isTemplate = item.type === "templates";

                  return (
                    <div
                      key={item.id ?? index}
                      className={cn(
                        "group relative rounded-2xl p-5 transition-all duration-200 shadow-sm flex flex-col justify-between border",
                        isDark ? "bg-gray-800 hover:bg-gray-700 border-gray-700" : "bg-white hover:shadow-xl border-gray-100"
                      )}
                    >
                      <a href={meta.to} className="block flex-1">
                        <div className="flex items-start gap-4">
                          <div
                            className={cn(
                              "flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center",
                              meta.bgColor
                            )}
                          >
                            <ItemIcon className={cn("h-6 w-6", meta.color)} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3
                                  className={cn(
                                    "font-semibold text-base truncate",
                                    isDark ? "text-white" : "text-gray-900"
                                  )}
                                >
                                  {meta.title}
                                </h3>
                                {meta.subtitle && (
                                  <p
                                    className={cn(
                                      "text-sm truncate mt-0.5",
                                      isDark ? "text-gray-400" : "text-gray-500"
                                    )}
                                  >
                                    {meta.subtitle}
                                  </p>
                                )}
                              </div>
                              {meta.badge && (
                                <span
                                  className={cn(
                                    "text-xs px-2.5 py-1 rounded-full font-semibold whitespace-nowrap flex-shrink-0",
                                    meta.badgeColor
                                  )}
                                >
                                  {meta.badge}
                                </span>
                              )}
                            </div>

                            {meta.details.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {meta.details.slice(0, 3).map((detail, idx) => (
                                  <span
                                    key={idx}
                                    className={cn(
                                      "text-xs px-2 py-1 rounded-md",
                                      isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"
                                    )}
                                  >
                                    {detail}
                                  </span>
                                ))}
                                {meta.details.length > 3 && (
                                  <span
                                    className={cn(
                                      "text-xs px-2 py-1 rounded-md",
                                      isDark ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-400"
                                    )}
                                  >
                                    +{meta.details.length - 3}
                                  </span>
                                )}
                              </div>
                            )}

                            <div className="mt-3 flex items-center gap-2">
                              <span
                                className={cn(
                                  "text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700",
                                  isDark ? "text-gray-500" : "text-gray-400"
                                )}
                              >
                                {meta.category}
                              </span>
                            </div>
                          </div>
                        </div>
                      </a>
                      
                      {isBooking && meta.bookingId && (
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/60 flex justify-end">
                          <BookingActions bookingId={meta.bookingId} />
                        </div>
                      )}

                      {isTemplate && (
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/60 flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-purple-600 hover:text-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              window.location.href = meta.to;
                            }}
                          >
                            عرض النموذج
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-6 mt-4">
                <Button
                  onClick={handlePrevPage}
                  disabled={page <= 1 || isLoading}
                  variant="outline"
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-5 h-10 transition-colors",
                    isDark
                      ? "border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-200"
                      : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                  )}
                >
                  <ChevronRight className="h-4 w-4" />
                  السابق
                </Button>

                <div
                  className={cn(
                    "text-sm font-semibold px-4 py-2 rounded-xl",
                    isDark ? "bg-gray-800 text-gray-300" : "bg-white text-gray-700 shadow-sm"
                  )}
                >
                  الصفحة <span className="text-primary font-bold">{page}</span>
                </div>

                <Button
                  onClick={handleNextPage}
                  disabled={!hasMore || isLoading}
                  variant="outline"
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-5 h-10 transition-colors",
                    isDark
                      ? "border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-200"
                      : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                  )}
                >
                  التالي
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : query.trim().length > 0 || startDate || endDate ? (
            <div className={cn("rounded-2xl p-16 text-center", isDark ? "bg-gray-800" : "bg-white")}>
              <div
                className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4",
                  isDark ? "bg-gray-700" : "bg-gray-100"
                )}
              >
                <Search className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className={cn("text-xl font-semibold mb-2", isDark ? "text-white" : "text-gray-900")}>
                لا توجد نتائج
              </h3>
              <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                لم نعثر على نتائج تناسب خيارات البحث أو الفترة المحددة
              </p>
            </div>
          ) : recentSearches.length > 0 && (
            <div className={cn("rounded-2xl p-6", isDark ? "bg-gray-800" : "bg-white")}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={cn("text-sm font-medium", isDark ? "text-gray-300" : "text-gray-700")}>
                  <Clock className="h-4 w-4 inline ml-2" />
                  عمليات بحث حديثة
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setRecentSearches([]);
                    localStorage.removeItem("recentSearches");
                  }}
                  className="text-xs text-red-500 hover:text-red-600 transition-colors"
                >
                  مسح الكل
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {recentSearches.map((search, index) => (
                  <button
                    type="button"
                    key={index}
                    onClick={() => handleRecentSearchClick(search.query)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl text-right transition-colors",
                      isDark
                        ? "hover:bg-gray-700 text-gray-300"
                        : "hover:bg-gray-50 text-gray-700"
                    )}
                  >
                    <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm flex-1">{search.query}</span>
                    {search.category !== "all" && (
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          isDark ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-500"
                        )}
                      >
                        {SEARCH_CATEGORIES.find((c) => c.id === search.category)?.label || search.category}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchInput;