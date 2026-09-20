import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icon } from "@iconify/react";
import { useGetAllTemplatesQuery } from "../../RtkQuery/Slice/Template/TemplateApi";
import { useGetRegionsQuery } from "../../RtkQuery/Slice/CitiesAndRegions/CitiesAndRegionsApi";

const ORDER_TYPE_LABELS = {
  1: "فك",
  2: "تركيب",
  3: "فك وتركيب",
  4: "صيانة",
};

const STATUS_LABELS = {
  received: { text: "مُستلَم - بانتظار التنفيذ", color: "text-amber-600 bg-amber-500/10" },
  executed: { text: "مُنفَّذ", color: "text-emerald-600 bg-emerald-500/10" },
};

/**
 * "الورشة ركّبت اللوحة الآن" - بث كامل لحالة الأوامر الميدانية: من
 * استلمها، من نفّذها، ومتى (لا الأوامر المُنفَّذة فقط كما كانت سابقًا -
 * ⚠️ FIXED: كان لا وجود لأي طريقة لمعرفة *من استلم* الأمر إطلاقًا، فقط "أي
 * ورشة". راجع DEVELOPER_GUIDE.md، الجزء الحادي عشر). قابل للفلترة حسب
 * الورشة/من استلم/من نفَّذ/النوع/الحالة/المدى الزمني. يُحدَّث تلقائيًا كل
 * 30 ثانية (polling) - بديل بسيط عن WebSocket غير مُهيَّأ حاليًا.
 */
const ActivityFeedTab = ({ workshops, lockedToOwnWorkshop = false }) => {
  const {
    workshops: workshopsList,
    workshopWorkers,
    activityFeed,
    isFetchingActivityFeed,
    activityFilters,
    setActivityFilters,
  } = workshops;

  const [fromDate, setFromDate] = useState(activityFilters.from_date || "");
  const [toDate, setToDate] = useState(activityFilters.to_date || "");

  const applyDateFilters = () => {
    setActivityFilters((f) => ({ ...f, from_date: fromDate || undefined, to_date: toDate || undefined }));
  };

  // طلب صريح: "فلتر حسب النموذج وفلتر حسب المنطقة" - لغير العامل (المشرف/
  // مدير الورشة، الوحيدان القادران أصلًا على فتح هذا التبويب). نفس نمط
  // استخراج المصفوفة الدفاعي المستخدَم في بقية المشروع (Precentage.jsx):
  // الاستجابة قد تصل كمصفوفة مباشرة أو ككائن {data: [...]}.
  const { data: templatesRaw } = useGetAllTemplatesQuery();
  const templates = Array.isArray(templatesRaw) ? templatesRaw : templatesRaw?.data ?? [];

  const { data: regionsRaw } = useGetRegionsQuery();
  const regions = Array.isArray(regionsRaw) ? regionsRaw : regionsRaw?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="border border-border rounded-lg bg-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          {!lockedToOwnWorkshop && (
            <div className="space-y-1">
              <Label className="text-xs">الورشة</Label>
              <Select
                value={activityFilters.workshop_id ? String(activityFilters.workshop_id) : "all"}
                onValueChange={(v) =>
                  setActivityFilters((f) => ({ ...f, workshop_id: v === "all" ? undefined : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="كل الورشات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الورشات</SelectItem>
                  {(workshopsList ?? []).map((w) => (
                    <SelectItem key={w.id} value={String(w.id)}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-xs">استلمه</Label>
            <Select
              value={activityFilters.received_by ? String(activityFilters.received_by) : "all"}
              onValueChange={(v) =>
                setActivityFilters((f) => ({ ...f, received_by: v === "all" ? undefined : v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="كل العمال" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل العمال</SelectItem>
                {(workshopWorkers ?? []).map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">نفَّذه</Label>
            <Select
              value={activityFilters.executed_by ? String(activityFilters.executed_by) : "all"}
              onValueChange={(v) =>
                setActivityFilters((f) => ({ ...f, executed_by: v === "all" ? undefined : v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="كل العمال" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل العمال</SelectItem>
                {(workshopWorkers ?? []).map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">الحالة</Label>
            <Select
              value={activityFilters.status || "all"}
              onValueChange={(v) => setActivityFilters((f) => ({ ...f, status: v === "all" ? undefined : v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="كل الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="received">مُستلَم فقط (بانتظار التنفيذ)</SelectItem>
                <SelectItem value="executed">مُنفَّذ فقط</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">النوع</Label>
            <Select
              value={activityFilters.type ? String(activityFilters.type) : "all"}
              onValueChange={(v) => setActivityFilters((f) => ({ ...f, type: v === "all" ? undefined : v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="كل الأنواع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأنواع</SelectItem>
                {Object.entries(ORDER_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">النموذج</Label>
            <Select
              value={activityFilters.template_id ? String(activityFilters.template_id) : "all"}
              onValueChange={(v) =>
                setActivityFilters((f) => ({ ...f, template_id: v === "all" ? undefined : v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="كل النماذج" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل النماذج</SelectItem>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.model} {t.size ? `- ${t.size}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">المنطقة</Label>
            <Select
              value={activityFilters.region_id ? String(activityFilters.region_id) : "all"}
              onValueChange={(v) =>
                setActivityFilters((f) => ({ ...f, region_id: v === "all" ? undefined : v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="كل المناطق" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المناطق</SelectItem>
                {regions.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">من تاريخ</Label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">إلى تاريخ</Label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <button
            onClick={applyDateFilters}
            className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium"
          >
            تطبيق
          </button>
        </div>
      </div>

      {isFetchingActivityFeed && (activityFeed ?? []).length === 0 && (
        <div className="text-center text-muted-foreground py-10">جارٍ التحميل...</div>
      )}
      {!isFetchingActivityFeed && (activityFeed ?? []).length === 0 && (
        <div className="text-center text-muted-foreground py-10">
          لا يوجد أوامر ضمن هذه الفلاتر
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(activityFeed ?? []).map((order) => {
          const beforePhoto = (order.photos ?? []).find((p) => p.phase === "before");
          const afterPhoto = (order.photos ?? []).find((p) => p.phase === "after");
          const status = STATUS_LABELS[order.status_label] ?? STATUS_LABELS.received;

          return (
            <div key={order.id} className="border border-border rounded-lg bg-card overflow-hidden">
              <div className="grid grid-cols-2 gap-0.5 bg-muted">
                <PhotoSlot photo={beforePhoto} label="قبل" />
                <PhotoSlot photo={afterPhoto} label="بعد" />
              </div>
              <div className="p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">
                    {order.road_sign?.roadsign_code || `#${order.road_sign_id}`}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {ORDER_TYPE_LABELS[order.type] || order.type}
                  </span>
                </div>

                <span className={`inline-block text-[11px] px-2 py-0.5 rounded-full ${status.color}`}>
                  {status.text}
                </span>

                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Icon icon="mdi:account-hard-hat-outline" className="w-3.5 h-3.5" />
                  {order.workshop?.name || "-"}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Icon icon="mdi:hand-back-right-outline" className="w-3.5 h-3.5" />
                  استلمه: {order.receiver?.full_name || "-"}
                  {order.received_at && ` (${new Date(order.received_at).toLocaleString("ar-SY")})`}
                </div>
                {order.executor?.full_name && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Icon icon="mdi:check-decagram-outline" className="w-3.5 h-3.5" />
                    نفَّذه: {order.executor.full_name}
                    {order.executed_at && ` (${new Date(order.executed_at).toLocaleString("ar-SY")})`}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PhotoSlot = ({ photo, label }) => {
  if (!photo) {
    return (
      <div className="aspect-video flex items-center justify-center text-muted-foreground text-[11px] bg-muted">
        {label}: لا صورة بعد
      </div>
    );
  }
  return (
    <a href={photo.url} target="_blank" rel="noreferrer" className="aspect-video block relative group">
      <img src={photo.url} alt={`صورة ${label}`} className="w-full h-full object-cover" />
      <span className="absolute bottom-1 right-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
        {label}
      </span>
    </a>
  );
};

export default ActivityFeedTab;
