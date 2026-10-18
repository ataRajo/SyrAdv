// SharePlanDialog.jsx
//
// حوار مشاركة الخطة/الخطط مع الزبون: يسمح باختيار أكثر من خطة نشطة (طلب
// صريح: "يوجد امكانية ارسال اكثر من خطة للزبون") ليُنشئ الباك-إند رابطاً
// عاماً واحداً (/plans/:token) يعرض كل الخطط المختارة معاً، بدون أي حاجة
// لتسجيل دخول من طرف الزبون.
import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, Loader2, Send } from "lucide-react";
import { getPublicPlanUrl } from "../../Api/baseUrl";
import { useShareAdvertisingPlansMutation } from "../../RtkQuery/Slice/AdvertisingPlans/AdvertisingPlansApi";
import { showToast } from "../../utils/Notifictions/showToast";

// candidatePlans: الخطط النشطة القابلة للمشاركة (عادة خطط نفس الزبون)
export default function SharePlanDialog({ open, onOpenChange, currentPlan, candidatePlans = [] }) {
  const [selectedIds, setSelectedIds] = useState(() =>
    currentPlan ? [currentPlan.id] : []
  );
  const [customerPhone, setCustomerPhone] = useState(currentPlan?.customer?.phone_number || "");
  const [sendWhatsapp, setSendWhatsapp] = useState(false);
  const [resultUrl, setResultUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const [shareAdvertisingPlans, { isLoading }] = useShareAdvertisingPlansMutation();

  const allPlans = useMemo(() => {
    const list = [...candidatePlans];
    if (currentPlan && !list.some((p) => p.id === currentPlan.id)) list.unshift(currentPlan);
    return list;
  }, [candidatePlans, currentPlan]);

  const toggle = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (selectedIds.length === 0) {
      showToast("error", "اختر خطة واحدة على الأقل للمشاركة");
      return;
    }
    try {
      const res = await shareAdvertisingPlans({
        plan_ids: selectedIds,
        send_whatsapp: sendWhatsapp,
        customer_phone: sendWhatsapp ? customerPhone : undefined,
      }).unwrap();
      const token = res?.share_token || res?.data?.share_token;
      setResultUrl(token ? getPublicPlanUrl(token) : res?.url || res?.data?.url || "");
      showToast("success", sendWhatsapp ? "تم إنشاء الرابط وإرساله عبر واتساب" : "تم إنشاء رابط المشاركة");
    } catch (err) {
      showToast("error", err?.data?.message || "تعذّر إنشاء رابط المشاركة");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(resultUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      showToast("error", "تعذّر نسخ الرابط");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>مشاركة الخطة الإعلانية مع الزبون</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-2 block text-sm">الخطط المُرسَلة في هذا الرابط</Label>
            <div className="max-h-44 overflow-y-auto border border-border rounded-md divide-y divide-border">
              {allPlans.map((plan) => (
                <label
                  key={plan.id}
                  className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selectedIds.includes(plan.id)}
                    onCheckedChange={() => toggle(plan.id)}
                  />
                  <span className="flex-1">{plan.name || `خطة #${plan.id}`}</span>
                  <span className="text-xs text-muted-foreground">
                    {(plan.total_price || 0).toLocaleString("ar-EG")} ل.س
                  </span>
                </label>
              ))}
              {allPlans.length === 0 && (
                <p className="px-3 py-4 text-xs text-muted-foreground text-center">
                  لا توجد خطط نشطة أخرى لهذا الزبون
                </p>
              )}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox checked={sendWhatsapp} onCheckedChange={(v) => setSendWhatsapp(Boolean(v))} />
            إرسال الرابط تلقائياً عبر واتساب
          </label>

          {sendWhatsapp && (
            <div>
              <Label className="mb-1 block text-sm">رقم واتساب الزبون</Label>
              <Input
                dir="ltr"
                placeholder="9639xxxxxxxx"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>
          )}

          {resultUrl && (
            <div>
              <Label className="mb-1 block text-sm">رابط المشاهدة (بدون تسجيل دخول)</Label>
              <div className="flex items-center gap-2">
                <Input dir="ltr" readOnly value={resultUrl} className="text-xs" />
                <Button type="button" variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
          <Button type="button" onClick={handleGenerate} disabled={isLoading} className="gap-2">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {resultUrl ? "إعادة إنشاء الرابط" : "إنشاء رابط المشاركة"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
