// AdvertisingPlanForm.jsx
//
// إنشاء/تعديل خطة إعلانية: بيانات الخطة (الاسم، الزبون، فترة الحملة
// المقترحة) + اختيار اللوحات من خريطة تفاعلية + سعر كل لوحة + المجموع
// النهائي. نفس شاشة التعديل تُستخدم لتنفيذ طلب العميل "إمكانية تعديل الخطة
// (إضافة وحذف لوحات) يدوياً قبل الحجز".
//
// جولة تعديلات جديدة (طلب صريح من الزبون - راجع رسالته الحرفية):
//   1) تحديد نوع المنتج ونوع الطباعة للخطة (كانا مفقودين بالكامل).
//   2) حساب سعر نهائي حقيقي عبر نفس endpoint حساب سعر الحجوزات
//      (get-calculate-Amount / useCalculateReservationMutation) - "راجع من
//      الكود كيف يتم حساب السعر" - بدل الاكتفاء بمجموع أسعار يدوية لكل
//      لوحة (يبقى ذلك التدفق القديم يعمل إن لم يُحدَّد نوع منتج/طباعة).
//   3) خصم اختياري (قيمة أو نسبة مئوية) بنفس شكل CalculationResult.jsx في
//      نموذج الحجز - يُطبَّق فقط على سعر الإعلان (لا الطباعة).
//   4) عرض "مساحة الإعلان الإجمالية" (total_advertising_space) - كانت
//      غائبة تماماً عن نموذج الخطة رغم وجودها في نموذج الحجز.
//   5) عدد الفترات (كل فترة = 14 يوم) يُحسَب تلقائياً من فترة الحملة
//      ويُعرَض مع السعر، بنفس صيغة BookingFields.jsx.
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Loader2, Save, ArrowRight, Search, Calculator, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import axios from "axios";
import { BASE_URL } from "../../Api/baseUrl";
import {
  useAddAdvertisingPlanMutation,
  useUpdateAdvertisingPlanMutation,
  useGetAdvertisingPlanByIdQuery,
} from "../../RtkQuery/Slice/AdvertisingPlans/AdvertisingPlansApi";
import { useCalculateReservationMutation } from "../../RtkQuery/Slice/Booking/BookingApi";
import CustomerSearchSelect from "../../Components/Common/CustomerSearchSelect";
import { productTypeOptions } from "../../Static/StaticData";
import AdvertisingPlanMapPicker from "../../Components/AdvertisingPlans/AdvertisingPlanMapPicker";
import AdvertisingPlanBoardsTable from "../../Components/AdvertisingPlans/AdvertisingPlanBoardsTable";
import { showToast } from "../../utils/Notifictions/showToast";

const DAYS_PER_PERIOD = 14;

// نفس صيغة حساب "عدد الفترات" المستخدمة في BookingFields.jsx (كل فترة 14
// يوم + يومي تركيب/فك) - تُستخدَم هنا فقط لعرض تقديري فوري قبل ضغط "احسب
// السعر النهائي" (الرقم المعتمَد فعلياً يأتي من استجابة الخادم - راجع
// calculationResult.units أدناه).
const estimatePeriods = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const totalInclusiveDays = diffDays + 1;
  const rawPeriods = (totalInclusiveDays - 2) / DAYS_PER_PERIOD;
  return Math.max(0, Math.ceil(rawPeriods));
};

export default function AdvertisingPlanForm() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const { data: existingPlan, isLoading: isLoadingPlan } = useGetAdvertisingPlanByIdQuery(id, {
    skip: !isEditMode,
  });

  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerLabel, setCustomerLabel] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerList, setShowCustomerList] = useState(false);
  // Map<roadSignId, { road_sign, price }>
  const [selectedBoards, setSelectedBoards] = useState(new Map());

  // ===== التسعير التلقائي الجديد (طلب صريح) =====
  const [productType, setProductType] = useState("");
  const [printingId, setPrintingId] = useState("");
  const [printingTypes, setPrintingTypes] = useState([]);
  const [loadingPrintingTypes, setLoadingPrintingTypes] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountType, setDiscountType] = useState("1"); // "1" قيمة، "2" نسبة
  const [discountValue, setDiscountValue] = useState("");
  // استجابة get-calculate-Amount كاملةً (نفس شكل استجابتها في نموذج
  // الحجز): { price_per_period, amount: { total_advertising_price,
  // total_printing_price, total_advertising_space, ... }, units, ... }
  const [calculationResult, setCalculationResult] = useState(null);

  const [addAdvertisingPlan, { isLoading: isAdding }] = useAddAdvertisingPlanMutation();
  const [updateAdvertisingPlan, { isLoading: isUpdating }] = useUpdateAdvertisingPlanMutation();
  const [calculateReservation, { isLoading: isCalculating }] = useCalculateReservationMutation();

  // جلب أنواع الطباعة - نفس نمط BookingFields.jsx حرفياً (لا يوجد RTK
  // slice جاهز لـ printings في المشروع، الجلب مباشرة عبر axios).
  useEffect(() => {
    const fetchPrintingTypes = async () => {
      try {
        setLoadingPrintingTypes(true);
        const getAuthToken = () => {
          try {
            const raw = localStorage.getItem("SuperAdminInfo");
            const info = raw ? JSON.parse(raw) : null;
            return info?.user?.token || info?.token || null;
          } catch (error) {
            return null;
          }
        };
        const token = getAuthToken();
        const response = await axios.get(`${BASE_URL}/printings`, {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });
        setPrintingTypes(response.data || []);
      } catch (error) {
        setPrintingTypes([]);
      } finally {
        setLoadingPrintingTypes(false);
      }
    };
    fetchPrintingTypes();
  }, []);

  // تعبئة الحقول عند التعديل
  useEffect(() => {
    if (!existingPlan) return;
    setName(existingPlan.name || "");
    setNotes(existingPlan.notes || "");
    setStartDate(existingPlan.start_date?.slice(0, 10) || "");
    setEndDate(existingPlan.end_date?.slice(0, 10) || "");
    if (existingPlan.customer) {
      setCustomerId(existingPlan.customer.id);
      setCustomerLabel(existingPlan.customer.company_name || existingPlan.customer.full_name || "");
    }
    const map = new Map();
    (existingPlan.road_signs || []).forEach((rs) => {
      map.set(rs.id, { road_sign: rs, price: Number(rs.pivot?.price ?? rs.price ?? 0) });
    });
    setSelectedBoards(map);

    // التسعير التلقائي المحفوظ سابقاً (إن وُجد) - راجع AdvertisingPlanResource.
    if (existingPlan.product_type) setProductType(String(existingPlan.product_type));
    if (existingPlan.printing_id) setPrintingId(String(existingPlan.printing_id));
    if (existingPlan.discount_type) {
      setDiscountType(String(existingPlan.discount_type));
      setDiscountValue(existingPlan.discount_value != null ? String(existingPlan.discount_value) : "");
      setShowDiscount(true);
    }
    // نعرض قيماً محفوظة فوراً (بلا إعادة استدعاء للخادم) حتى تظهر "السعر
    // النهائي المحسوَب" مباشرةً عند فتح شاشة التعديل، لا بعد الضغط يدوياً
    // على "احسب السعر" من جديد.
    if (existingPlan.price_per_period != null || existingPlan.total_advertising_space != null) {
      setCalculationResult({
        price_per_period: existingPlan.price_per_period,
        units: existingPlan.periods_count,
        amount: {
          total_advertising_price:
            existingPlan.total_price -
            // الطباعة تُحسَب من مساحتها × سعر نوع الطباعة - لا نملكها هنا
            // بدقة قبل إعادة الحساب، لذلك نعرض 0 مبدئياً وتُحدَّث فوراً
            // بمجرد ضغط "احسب السعر النهائي" مرة واحدة.
            0,
          total_printing_price: 0,
          total_advertising_space: existingPlan.total_advertising_space,
        },
      });
    }
  }, [existingPlan]);

  const boardsArray = useMemo(() => Array.from(selectedBoards.values()), [selectedBoards]);
  const selectedIds = useMemo(() => Array.from(selectedBoards.keys()), [selectedBoards]);
  const manualTotal = boardsArray.reduce((sum, it) => sum + (Number(it.price) || 0), 0);

  // التسعير التلقائي مُفعَّل فقط بعد اختيار نوع المنتج ونوع الطباعة معاً.
  const autoPricingEnabled = Boolean(productType && printingId);

  const estimatedPeriods = useMemo(() => estimatePeriods(startDate, endDate), [startDate, endDate]);

  // نفس صيغة الخصم المستخدمة في BookingContext.jsx::calculateDiscountedPrice
  // حرفياً (الخصم يُطبَّق فقط على سعر الإعلان، لا الطباعة) - طلب صريح:
  // "راجع الاكواد" قبل إضافة الخصم.
  const calculateDiscountedTotal = () => {
    if (!calculationResult) return 0;
    const advertisingPrice = calculationResult.amount?.total_advertising_price || 0;
    const printingPrice = calculationResult.amount?.total_printing_price || 0;
    if (!discountValue) return advertisingPrice + printingPrice;

    const discountNum = parseFloat(discountValue);
    const discountedAdvertisingPrice =
      discountType === "1"
        ? Math.max(0, advertisingPrice - discountNum)
        : advertisingPrice * (1 - discountNum / 100);
    return discountedAdvertisingPrice + printingPrice;
  };

  const handleDiscountValueChange = (e) => {
    const value = e.target.value;
    if (discountType === "1" && calculationResult) {
      const cap = calculationResult.amount?.total_advertising_price ?? 0;
      if (value <= cap) {
        setDiscountValue(value);
      } else {
        setDiscountValue(String(cap));
        showToast("error", "قيمة الحسم لا يمكن أن تتجاوز سعر الإعلان");
      }
    } else if (discountType === "2") {
      if (value <= 100) {
        setDiscountValue(value);
      } else {
        setDiscountValue("100");
        showToast("error", "قيمة الحسم لا يمكن أن تتجاوز 100%");
      }
    } else {
      setDiscountValue(value);
    }
  };

  // "احسب السعر النهائي" - يستخدم بالضبط نفس endpoint حساب سعر الحجوزات
  // (get-calculate-Amount) الذي يستخدمه نموذج الحجز العادي (طلب صريح: راجع
  // الكود الموجود بدل تكرار منطق تسعير جديد). لا نرسل الخصم هنا (نفس ما
  // يفعله BookingFields.jsx) - المعاينة الفورية للخصم تُحسَب محلياً فوق
  // النتيجة غير المخصومة عبر calculateDiscountedTotal() أعلاه؛ الخصم
  // الفعلي يُرسَل للخادم فقط عند الحفظ فيعيد الخادم حسابه ويعتمده.
  const handleCalculatePrice = async () => {
    if (!productType) {
      showToast("error", "اختر نوع المنتج أولاً");
      return;
    }
    if (!printingId) {
      showToast("error", "اختر نوع الطباعة أولاً");
      return;
    }
    if (boardsArray.length === 0) {
      showToast("error", "اختر لوحة واحدة على الأقل قبل حساب السعر");
      return;
    }
    if (!startDate || !endDate) {
      showToast("error", "حدد فترة الحملة (من - إلى) أولاً");
      return;
    }

    try {
      const payload = {
        product_type: parseInt(productType, 10),
        printing_id: parseInt(printingId, 10),
        start_date: startDate,
        end_date: endDate,
        roadsigns: boardsArray.map((it) => ({
          road_sign_id: it.road_sign.id,
          booking_faces: 1,
          number_of_reserved_panels: 1,
          start_date: startDate,
          end_date: endDate,
        })),
      };
      const response = await calculateReservation(payload).unwrap();
      setCalculationResult(response);
      showToast("success", `تم حساب السعر - عدد الفترات: ${response?.units ?? "-"}`);
    } catch (err) {
      showToast("error", err?.data?.message || "تعذّر حساب السعر");
    }
  };

  const handleToggleBoard = (roadSign) => {
    setSelectedBoards((prev) => {
      const next = new Map(prev);
      if (next.has(roadSign.id)) {
        next.delete(roadSign.id);
      } else {
        next.set(roadSign.id, { road_sign: roadSign, price: 0 });
      }
      return next;
    });
    // تغيّرت اللوحات - أي سعر محسوَب سابقاً لم يعد دقيقاً، يجب إعادة الحساب.
    setCalculationResult(null);
  };

  const handlePriceChange = (roadSignId, value) => {
    setSelectedBoards((prev) => {
      const next = new Map(prev);
      const entry = next.get(roadSignId);
      if (entry) next.set(roadSignId, { ...entry, price: value === "" ? "" : Number(value) });
      return next;
    });
  };

  const handleRemoveBoard = (roadSignId) => {
    setSelectedBoards((prev) => {
      const next = new Map(prev);
      next.delete(roadSignId);
      return next;
    });
    setCalculationResult(null);
  };

  const pickCustomer = (customer) => {
    setCustomerId(customer.id);
    setCustomerLabel(customer.company_name || customer.full_name || "");
    setCustomerSearch("");
    setShowCustomerList(false);
  };

  const validate = () => {
    if (!name.trim()) return "الرجاء إدخال اسم/عنوان الخطة";
    if (!startDate || !endDate) return "الرجاء تحديد فترة الحملة المقترحة (من - إلى)";
    if (new Date(endDate) < new Date(startDate)) return "تاريخ النهاية يجب أن يكون بعد تاريخ البداية";
    if (boardsArray.length === 0) return "اختر لوحة واحدة على الأقل من الخريطة";
    if (autoPricingEnabled && !calculationResult) {
      return "اضغط \"احسب السعر النهائي\" قبل الحفظ - نوع المنتج ونوع الطباعة محدَّدان";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      showToast("error", error);
      return;
    }

    const payload = {
      name: name.trim(),
      customer_id: customerId || null,
      notes: notes.trim(),
      start_date: startDate,
      end_date: endDate,
      road_signs: boardsArray.map((it) => ({
        road_sign_id: it.road_sign.id,
        // التسعير التلقائي مُفعَّل: لا نرسل سعراً يدوياً لكل لوحة - الخادم
        // يوزّع السعر النهائي المحسوَب تلقائياً بالتساوي (راجع
        // AdvertisingPlanService::syncRoadSigns). التدفق القديم (بلا نوع
        // منتج/طباعة) يستمر بإرسال السعر اليدوي كما كان.
        ...(autoPricingEnabled ? {} : { price: Number(it.price) || 0 }),
      })),
      // ===== حقول التسعير التلقائي (طلب صريح) - الخادم يُعيد حساب السعر
      // النهائي بنفسه من هذه المدخلات (لا يثق بأي سعر جاهز من الفرونت-إند)
      // عبر نفس محرك تسعير الحجوزات - راجع
      // AdvertisingPlanService::calculatePlanPricing(). =====
      product_type: autoPricingEnabled ? parseInt(productType, 10) : null,
      printing_id: autoPricingEnabled ? parseInt(printingId, 10) : null,
      discount_type: autoPricingEnabled && discountValue ? parseInt(discountType, 10) : null,
      discount_value: autoPricingEnabled && discountValue ? parseFloat(discountValue) : null,
    };

    try {
      if (isEditMode) {
        await updateAdvertisingPlan({ id, ...payload }).unwrap();
        showToast("success", "تم تحديث الخطة الإعلانية");
        navigate(`/dashboard/advertising-plans/${id}`);
      } else {
        const created = await addAdvertisingPlan(payload).unwrap();
        showToast("success", "تم إنشاء الخطة الإعلانية");
        navigate(`/dashboard/advertising-plans/${created?.id ?? created?.data?.id ?? ""}`);
      }
    } catch (err) {
      showToast("error", err?.data?.message || "تعذّر حفظ الخطة الإعلانية");
    }
  };

  if (isEditMode && isLoadingPlan) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isSaving = isAdding || isUpdating;
  const finalDisplayedPrice = autoPricingEnabled && calculationResult ? calculateDiscountedTotal() : manualTotal;

  return (
    <div dir="rtl" className="p-4 lg:p-6 bg-background text-foreground min-h-screen">
      <div className="flex items-center gap-3 mb-6">
        <Button type="button" variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowRight className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditMode ? "تعديل الخطة الإعلانية" : "خطة إعلانية جديدة"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* بيانات الخطة الأساسية */}
        <div className="bg-card border border-border rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <Label className="mb-1.5 block">اسم / عنوان الخطة *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: خطة حملة رمضان - وسط المدينة"
            />
          </div>

          <div className="relative">
            <Label className="mb-1.5 block">الزبون (اختياري)</Label>
            <CustomerSearchSelect
              value={customerId ? String(customerId) : ""}
              onChange={(id, customer) => {
                setCustomerId(id || "");
                setCustomerLabel(customer ? customer.company_name || customer.full_name || "" : "");
              }}
              selectedCustomer={existingPlan?.customer || null}
              placeholder="ابحث عن زبون..."
            />
          </div>

          <div>
            <Label className="mb-1.5 block">بداية فترة الحملة *</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCalculationResult(null);
              }}
            />
          </div>
          <div>
            <Label className="mb-1.5 block">نهاية فترة الحملة *</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCalculationResult(null);
              }}
            />
            {estimatedPeriods > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                عدد الفترات التقديري: {estimatedPeriods} (كل فترة {DAYS_PER_PERIOD} يوم)
              </div>
            )}
          </div>

          <div>
            <Label className="mb-1.5 block">نوع المنتج</Label>
            <Select
              value={productType}
              onValueChange={(value) => {
                setProductType(value);
                setCalculationResult(null);
              }}
            >
              <SelectTrigger className="w-full text-right">
                <SelectValue placeholder="اختر نوع المنتج" />
              </SelectTrigger>
              <SelectContent>
                {productTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-1.5 block">نوع الطباعة</Label>
            <Select
              value={printingId}
              onValueChange={(value) => {
                setPrintingId(value);
                setCalculationResult(null);
              }}
            >
              <SelectTrigger className="w-full text-right">
                <SelectValue placeholder={loadingPrintingTypes ? "جاري التحميل..." : "اختر نوع الطباعة"} />
              </SelectTrigger>
              <SelectContent>
                {loadingPrintingTypes ? (
                  <SelectItem value="loading" disabled>
                    جاري تحميل أنواع الطباعة...
                  </SelectItem>
                ) : printingTypes.length === 0 ? (
                  <SelectItem value="empty" disabled>
                    لا توجد أنواع طباعة متاحة
                  </SelectItem>
                ) : (
                  printingTypes.map((pt) => (
                    <SelectItem key={pt.id} value={pt.id.toString()}>
                      {pt.type} - {pt.price?.toLocaleString()} $
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="lg:col-span-2 flex items-end">
            <Button
              type="button"
              variant="secondary"
              className="gap-2 w-full"
              disabled={!autoPricingEnabled || isCalculating || boardsArray.length === 0}
              onClick={handleCalculatePrice}
            >
              {isCalculating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
              احسب السعر النهائي
            </Button>
          </div>

          <div className="lg:col-span-4">
            <Label className="mb-1.5 block">ملاحظات</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>

        {/* نتيجة الحساب التلقائي + الخصم (طلب صريح) */}
        {autoPricingEnabled && calculationResult && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 text-right">
              نتائج الحساب
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">عدد الفترات</span>
                <span className="mt-1 text-gray-900 dark:text-gray-100 font-medium">
                  {calculationResult.units ?? "-"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">سعر الإعلان</span>
                <span className="mt-1 text-gray-900 dark:text-gray-100 font-medium">
                  {(calculationResult.amount?.total_advertising_price || 0).toFixed(2)} $
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">سعر الطباعة</span>
                <span className="mt-1 text-gray-900 dark:text-gray-100 font-medium">
                  {(calculationResult.amount?.total_printing_price || 0).toFixed(2)} $
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  مساحة الإعلان الإجمالية
                </span>
                <span className="mt-1 text-gray-900 dark:text-gray-100 font-medium">
                  {(calculationResult.amount?.total_advertising_space || 0).toFixed(2)} م²
                </span>
              </div>
            </div>

            <div className="flex flex-col mb-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">السعر النهائي</span>
              <span
                className={`mt-1 text-xl font-bold ${
                  discountValue ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-gray-100"
                }`}
              >
                {calculateDiscountedTotal().toFixed(2)} $
              </span>
              {discountValue && (
                <span className="text-xs text-gray-500 dark:text-gray-400 line-through mt-1">
                  كان:{" "}
                  {(
                    (calculationResult.amount?.total_advertising_price || 0) +
                    (calculationResult.amount?.total_printing_price || 0)
                  ).toFixed(2)}{" "}
                  $
                </span>
              )}
            </div>

            <Button
              type="button"
              onClick={() => setShowDiscount((v) => !v)}
              className="gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg"
            >
              <Tag className="h-4 w-4" />
              {showDiscount ? "إخفاء الحسم" : "إضافة حسم"}
            </Button>

            {showDiscount && (
              <div className="mt-4 space-y-4">
                <RadioGroup value={discountType} onValueChange={setDiscountType} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1" id="plan-discount-amount" />
                    <Label htmlFor="plan-discount-amount">قيمة</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2" id="plan-discount-percentage" />
                    <Label htmlFor="plan-discount-percentage">نسبة مئوية</Label>
                  </div>
                </RadioGroup>
                <p className="text-sm text-red-600 font-bold">الحسم يشمل فقط سعر الإعلان</p>
                <Input
                  type="number"
                  value={discountValue}
                  onChange={handleDiscountValueChange}
                  placeholder="الحسم لا يتضمن الطباعة"
                  className="w-full text-right"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDiscount(false);
                    setDiscountValue("");
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  إلغاء الحسم
                </Button>
              </div>
            )}
          </div>
        )}

        {/* اختيار اللوحات: الخريطة على اليمين، القائمة المختارة على اليسار */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-[520px]">
            <AdvertisingPlanMapPicker selectedIds={selectedIds} onToggle={handleToggleBoard} />
          </div>
          <div className="flex flex-col gap-3">
            <AdvertisingPlanBoardsTable
              items={boardsArray}
              onPriceChange={handlePriceChange}
              onRemove={handleRemoveBoard}
              autoPricingActive={autoPricingEnabled && Boolean(calculationResult)}
              autoPricingTotal={autoPricingEnabled && calculationResult ? calculateDiscountedTotal() : 0}
            />
          </div>
        </div>

        <div className="flex items-center justify-between bg-card border border-border rounded-xl p-4 sticky bottom-4">
          <span className="text-sm text-muted-foreground">{boardsArray.length} لوحة مختارة</span>
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold">
              السعر النهائي:{" "}
              {autoPricingEnabled
                ? `${finalDisplayedPrice.toLocaleString("ar-EG", { maximumFractionDigits: 2 })} $`
                : `${finalDisplayedPrice.toLocaleString("ar-EG")} ل.س`}
            </span>
            <Button type="submit" disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isEditMode ? "حفظ التعديلات" : "إنشاء الخطة"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
