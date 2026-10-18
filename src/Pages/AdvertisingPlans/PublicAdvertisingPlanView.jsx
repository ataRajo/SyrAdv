// PublicAdvertisingPlanView.jsx
//
// الصفحة العامة (بدون تسجيل دخول) التي يفتحها الزبون عبر الرابط المُرسَل له
// (/plans/:token) لعرض خطة إعلانية واحدة أو أكثر (طلب صريح: "يوجد إمكانية
// إرسال أكثر من خطة للزبون") واختيار إحداها ثم إخبارنا أنه يريد حجزها.
// لا Sidebar/Navbar هنا عمداً (نفس فلسفة /public-map/:id الموجودة أصلاً في
// المشروع) ولا أي طلب مصادقة - راجع PublicAdvertisingPlansApi.jsx.
import { useState } from "react";
import { useParams } from "react-router";
import { Loader2, CheckCircle2, MapPin, CalendarRange, Archive, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useGetPublicAdvertisingPlansQuery,
  useRequestPlanBookingMutation,
} from "../../RtkQuery/Slice/Public/PublicAdvertisingPlansApi";
import PublicPlanMap from "../../Components/AdvertisingPlans/PublicPlanMap";
import LogoBase64 from "../../assets/LogoBase64";

function PlanRequestButton({ token, plan }) {
  const [requestPlanBooking, { isLoading }] = useRequestPlanBookingMutation();
  const [sent, setSent] = useState(Boolean(plan.customer_requested_at));

  const handleClick = async () => {
    const res = await requestPlanBooking({ token, planId: plan.id }).unwrap();
    if (res?.success !== false) setSent(true);
  };

  if (sent) {
    return (
      <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium">
        <CheckCircle2 className="h-5 w-5" />
        تم إرسال طلبك، سيتواصل معك فريقنا لتأكيد الحجز
      </div>
    );
  }

  return (
    <Button onClick={handleClick} disabled={isLoading} size="lg" className="gap-2 w-full sm:w-auto">
      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
      أريد حجز هذه الخطة
    </Button>
  );
}

function PlanCard({ token, plan }) {
  const total =
    plan.total_price ??
    (plan.road_signs || []).reduce((sum, rs) => sum + Number(rs.pivot?.price || 0), 0);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      <div className="p-5 border-b border-border flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">{plan.name || `خطة #${plan.id}`}</h2>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarRange className="h-4 w-4" />
              من {plan.start_date} إلى {plan.end_date}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {plan.road_signs?.length ?? 0} لوحة إعلانية
            </span>
          </div>
        </div>
        <div className="text-left">
          <p className="text-xs text-muted-foreground mb-0.5">السعر النهائي</p>
          <p className="text-2xl font-extrabold text-primary">
            {Number(total).toLocaleString("ar-EG")} ل.س
          </p>
        </div>
      </div>

      <div className="h-[320px] p-3">
        <PublicPlanMap roadSigns={plan.road_signs} />
      </div>

      {plan.notes && (
        <div className="px-5 py-3 text-sm text-muted-foreground border-t border-border">
          {plan.notes}
        </div>
      )}

      <div className="p-5 border-t border-border bg-muted/30 overflow-x-auto">
        <table className="w-full text-sm min-w-[420px]">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-right pb-2">اللوحة</th>
              <th className="text-right pb-2">المكان</th>
              <th className="text-right pb-2">النموذج</th>
              <th className="text-right pb-2">السعر</th>
            </tr>
          </thead>
          <tbody>
            {(plan.road_signs || []).map((rs) => (
              <tr key={rs.id} className="border-t border-border/60">
                <td className="py-2 font-mono">{rs.roadsign_code || `#${rs.id}`}</td>
                <td className="py-2">
                  {rs.city?.name} {rs.place ? `- ${rs.place}` : ""}
                </td>
                <td className="py-2">{rs.template?.model || "—"}</td>
                <td className="py-2 font-medium">
                  {Number(rs.pivot?.price || 0).toLocaleString("ar-EG")} ل.س
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-5 border-t border-border flex justify-center sm:justify-end">
        <PlanRequestButton token={token} plan={plan} />
      </div>
    </div>
  );
}

export default function PublicAdvertisingPlanView() {
  const { token } = useParams();
  const { data, isLoading, error } = useGetPublicAdvertisingPlansQuery(token, { skip: !token });

  const plans = data?.data || data || [];
  const activePlans = plans.filter((p) => !p.is_archived);

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <img src={LogoBase64} alt="الشعار" className="h-10 w-auto" />
          <div>
            <h1 className="font-bold text-lg">الخطط الإعلانية المقترحة لكم</h1>
            <p className="text-xs text-muted-foreground">اطلعوا على تفاصيل كل خطة واختاروا ما يناسبكم</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {isLoading && (
          <div className="flex justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div className="text-center py-24 text-muted-foreground">
            <p className="text-lg font-medium mb-2">تعذّر تحميل الخطة</p>
            <p className="text-sm">الرابط غير صحيح أو انتهت صلاحيته، الرجاء التواصل مع الشركة.</p>
          </div>
        )}

        {!isLoading && !error && plans.length === 0 && (
          <div className="text-center py-24 text-muted-foreground">لا توجد خطط لعرضها</div>
        )}

        {!isLoading && !error && plans.length > 0 && activePlans.length === 0 && (
          <div className="text-center py-24 text-muted-foreground flex flex-col items-center gap-3">
            <Archive className="h-10 w-10" />
            <p className="text-lg font-medium">انتهت صلاحية هذا العرض</p>
            <p className="text-sm">
              تم أرشفة الخطة/الخطط المرسلة تلقائياً، الرجاء التواصل مع الشركة للحصول على عرض جديد.
            </p>
          </div>
        )}

        {activePlans.map((plan) => (
          <PlanCard key={plan.id} token={token} plan={plan} />
        ))}
      </main>
    </div>
  );
}
