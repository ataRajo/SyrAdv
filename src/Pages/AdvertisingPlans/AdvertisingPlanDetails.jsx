// AdvertisingPlanDetails.jsx
//
// عرض تفاصيل خطة إعلانية واحدة: الخريطة + قائمة اللوحات والأسعار + حالة
// الخطة (نشطة مع عدّاد / مؤرشفة) + إشعار إن كان الزبون قد طلب حجزها عبر
// الرابط العام + أزرار: تعديل، مشاركة، أرشفة، وتحويل إلى حجز فعلي.
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowRight,
  Pencil,
  Share2,
  Archive,
  ArchiveRestore,
  Loader2,
  MessageCircleMore,
  CheckCircle2,
  ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useGetAdvertisingPlanByIdQuery,
  useGetAdvertisingPlansQuery,
  useArchiveAdvertisingPlanMutation,
  useRestoreAdvertisingPlanMutation,
} from "../../RtkQuery/Slice/AdvertisingPlans/AdvertisingPlansApi";
import AdvertisingPlanStatusBadge from "../../Components/AdvertisingPlans/AdvertisingPlanStatusBadge";
import SharePlanDialog from "../../Components/AdvertisingPlans/SharePlanDialog";
import PublicPlanMap from "../../Components/AdvertisingPlans/PublicPlanMap";
import { showToast } from "../../utils/Notifictions/showToast";
import { productTypeMap } from "../../Static/StaticData";

// الخصم مُخزَّن كما يصل من الباك-إند: 1 = قيمة ثابتة، 2 = نسبة مئوية (نفس
// App\DiscountType على الباك-إند ونفس ما تعرضه CalculationResult.jsx في
// نموذج الحجز).
const discountTypeLabel = (type) => (String(type) === "2" ? "نسبة مئوية" : "قيمة ثابتة");

export default function AdvertisingPlanDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shareOpen, setShareOpen] = useState(false);

  const { data: plan, isLoading } = useGetAdvertisingPlanByIdQuery(id);
  const { data: allPlansResponse } = useGetAdvertisingPlansQuery({ status: "active" });
  const [archivePlan, { isLoading: isArchiving }] = useArchiveAdvertisingPlanMutation();
  const [restorePlan, { isLoading: isRestoring }] = useRestoreAdvertisingPlanMutation();

  const candidatePlans = (allPlansResponse?.data || []).filter((p) => p.id !== Number(id));

  const handleArchiveToggle = async () => {
    try {
      if (plan.is_archived) {
        await restorePlan(plan.id).unwrap();
        showToast("success", "تمت إعادة تنشيط الخطة");
      } else {
        await archivePlan(plan.id).unwrap();
        showToast("success", "تمت أرشفة الخطة");
      }
    } catch (err) {
      showToast("error", err?.data?.message || "تعذّر تنفيذ العملية");
    }
  };

  // ⚠️ لا يوجد endpoint باك-إند لإنشاء حجز تلقائياً من خطة إعلانية (طلب
  // Booking صالح يحتاج type/booking_faces لكل لوحة ونوع حجز (مؤقت/دائم) لا
  // تملكه الخطة إطلاقًا - لا يمكن تخمينها بأمان). بدلاً من ذلك: تنقّل لشاشة
  // "إضافة حجز" العادية مع تعبئة مسبقة عبر location.state، فيُكمل الموظف
  // فقط ما تبقّى (نوع الحجز) يدويًا - راجع BookingContext.jsx حيث تُقرأ
  // fromAdvertisingPlan عند التحميل الأول.
  //
  // جولة تعديلات جديدة (طلب صريح: "عند النقر على تحويل الى حجز اين تذهب
  // هذه الخطة؟"): التعبئة المسبقة كانت تنقل فقط الزبون/التواريخ/اللوحات،
  // تاركةً الموظف يُدخِل نوع المنتج ونوع الطباعة والخصم يدويًا من الصفر رغم
  // أن الخطة قد تملكها بالفعل (إن استُخدِم التسعير التلقائي الجديد). الآن
  // تُنقَل أيضًا حين تكون متوفرة - BookingContext.jsx يُعبّئها في نموذج
  // الحجز مباشرةً فيبقى فقط "نوع الحجز" (مؤقت/دائم) يدويًا.
  const handleConvertToBooking = () => {
    navigate("/dashboard/booking/add", {
      state: {
        fromAdvertisingPlan: {
          plan_id: plan.id,
          customer_id: plan.customer?.id ?? null,
          start_date: plan.start_date,
          end_date: plan.end_date,
          road_signs: plan.road_signs || [],
          product_type: plan.product_type ?? null,
          printing_id: plan.printing_id ?? null,
          discount_type: plan.discount_type ?? null,
          discount_value: plan.discount_value ?? null,
        },
      },
    });
  };

  if (isLoading || !plan) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const total =
    plan.total_price ??
    (plan.road_signs || []).reduce((sum, rs) => sum + Number(rs.pivot?.price || 0), 0);

  return (
    <div dir="rtl" className="p-4 lg:p-6 bg-background text-foreground min-h-screen">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{plan.name || `خطة #${plan.id}`}</h1>
            <div className="flex items-center gap-2 mt-1">
              <AdvertisingPlanStatusBadge plan={plan} />
              {plan.customer_requested_at && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  <MessageCircleMore className="h-3 w-3" />
                  طلب الزبون حجز هذه الخطة
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => navigate(`/dashboard/advertising-plans/edit/${plan.id}`)}
          >
            <Pencil className="h-4 w-4" />
            تعديل
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setShareOpen(true)}>
            <Share2 className="h-4 w-4" />
            مشاركة مع الزبون
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleArchiveToggle}
            disabled={isArchiving || isRestoring}
          >
            {plan.is_archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
            {plan.is_archived ? "إعادة تنشيط" : "أرشفة"}
          </Button>
          <Button className="gap-2" onClick={handleConvertToBooking}>
            <ClipboardCheck className="h-4 w-4" />
            تحويل إلى حجز
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-[420px]">
          <PublicPlanMap roadSigns={plan.road_signs} />
        </div>

        <div className="bg-card border border-border rounded-xl p-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">الزبون</span>
            <span className="font-medium">
              {plan.customer?.company_name || plan.customer?.full_name || "غير محدد"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">فترة الحملة</span>
            <span className="font-medium">
              {plan.start_date} إلى {plan.end_date}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">عدد اللوحات</span>
            <span className="font-medium">{plan.road_signs?.length ?? 0}</span>
          </div>
          {plan.notes && (
            <div>
              <span className="text-muted-foreground block mb-1">ملاحظات</span>
              <p className="text-foreground">{plan.notes}</p>
            </div>
          )}

          {/* التسعير التلقائي (طلب صريح، جديد) - تظهر فقط للخطط التي
              استُخدِم فيها نوع منتج/طباعة (product_type/printing_id) - راجع
              AdvertisingPlanResource. الخطط القديمة (سعر يدوي لكل لوحة فقط)
              لا تعرض هذا القسم. */}
          {plan.product_type && (
            <div className="pt-3 border-t border-border space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">نوع المنتج</span>
                <span className="font-medium">{productTypeMap[plan.product_type] || plan.product_type}</span>
              </div>
              {plan.printing && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">نوع الطباعة</span>
                  <span className="font-medium">
                    {plan.printing.type} ({Number(plan.printing.price).toLocaleString("ar-EG")} $)
                  </span>
                </div>
              )}
              {plan.periods_count != null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">عدد الفترات (14 يوم/فترة)</span>
                  <span className="font-medium">{plan.periods_count}</span>
                </div>
              )}
              {plan.total_advertising_space != null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">مساحة الإعلان الإجمالية</span>
                  <span className="font-medium">{Number(plan.total_advertising_space).toLocaleString("ar-EG")} م²</span>
                </div>
              )}
              {plan.discount_type && plan.discount_value != null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الخصم المطبَّق</span>
                  <span className="font-medium text-green-600">
                    {discountTypeLabel(plan.discount_type)} - {Number(plan.discount_value).toLocaleString("ar-EG")}
                    {String(plan.discount_type) === "2" ? "%" : " $"}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="pt-3 border-t border-border flex justify-between items-center">
            <span className="text-muted-foreground">السعر النهائي</span>
            <span className="text-lg font-bold flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              {Number(total).toLocaleString("ar-EG")} {plan.product_type ? "$" : "ل.س"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-right px-4 py-2.5">اللوحة</th>
              <th className="text-right px-4 py-2.5">المدينة / المكان</th>
              <th className="text-right px-4 py-2.5">النموذج</th>
              <th className="text-right px-4 py-2.5">السعر</th>
            </tr>
          </thead>
          <tbody>
            {(plan.road_signs || []).map((rs) => (
              <tr key={rs.id} className="border-t border-border">
                <td className="px-4 py-2.5 font-mono">{rs.roadsign_code || `#${rs.id}`}</td>
                <td className="px-4 py-2.5">
                  {rs.city?.name || "—"}
                  {rs.place ? ` - ${rs.place}` : ""}
                </td>
                <td className="px-4 py-2.5">{rs.template?.model || "—"}</td>
                <td className="px-4 py-2.5 font-medium">
                  {Number(rs.pivot?.price || 0).toLocaleString("ar-EG")} {plan.product_type ? "$" : "ل.س"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SharePlanDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        currentPlan={plan}
        candidatePlans={candidatePlans}
      />
    </div>
  );
}
