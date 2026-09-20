import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@iconify/react";

const ORDER_TYPE_LABELS = { 1: "فك", 2: "تركيب", 3: "فك وتركيب", 4: "صيانة" };

const ReceiveDialog = ({ order, onCancel, onConfirm, isSaving }) => {
  const expected = order?.expected_receipt;
  const [facesCount, setFacesCount] = useState(expected?.faces_count ?? "");
  const [notes, setNotes] = useState("");

  return (
    <div className="space-y-4">
      {expected && (
        <div className="text-sm bg-muted/50 rounded-md p-3 space-y-1">
          <div className="font-medium">المتوقَّع لهذه اللوحة:</div>
          <div className="text-muted-foreground">
            {expected.faces_count ?? "-"} وجه · مقاس {expected.size ?? "-"}
          </div>
        </div>
      )}
      <div className="space-y-2">
        <Label>العدد الفعلي المُستلَم (اختياري)</Label>
        <Input
          type="number"
          min="0"
          value={facesCount}
          onChange={(e) => setFacesCount(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>ملاحظات (اختياري - مثلًا عند وجود فرق عن المتوقَّع)</Label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          إلغاء
        </Button>
        <Button
          type="button"
          disabled={isSaving}
          onClick={() => onConfirm({ facesCount, notes })}
        >
          {isSaving ? "جارٍ التسجيل..." : "تأكيد الاستلام"}
        </Button>
      </DialogFooter>
    </div>
  );
};

const CompleteDialog = ({ onCancel, onConfirm, isSaving }) => {
  const [beforePhoto, setBeforePhoto] = useState(null);
  const [beforePreview, setBeforePreview] = useState(null);
  const [afterPhoto, setAfterPhoto] = useState(null);
  const [afterPreview, setAfterPreview] = useState(null);

  const onBeforeFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setBeforePhoto(file);
    setBeforePreview(file ? URL.createObjectURL(file) : null);
  };

  const onAfterFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setAfterPhoto(file);
    setAfterPreview(file ? URL.createObjectURL(file) : null);
  };

  return (
    <div className="space-y-4">
      {/* Before Photo */}
      <div className="space-y-2">
        <Label>صورة قبل التنفيذ</Label>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onBeforeFileChange}
          className="block w-full text-sm border border-input rounded-md p-2"
        />
        {beforePreview && (
          <img src={beforePreview} alt="قبل" className="mt-2 rounded-md max-h-48 w-full object-cover" />
        )}
      </div>

      {/* After Photo */}
      <div className="space-y-2">
        <Label>صورة بعد التنفيذ (إجبارية)</Label>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onAfterFileChange}
          className="block w-full text-sm border border-input rounded-md p-2"
        />
        {afterPreview && (
          <img src={afterPreview} alt="بعد" className="mt-2 rounded-md max-h-48 w-full object-cover" />
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          إلغاء
        </Button>
        <Button
          type="button"
          disabled={isSaving || !afterPhoto}
          onClick={() => onConfirm({ beforePhoto, afterPhoto })}
        >
          {isSaving ? "جارٍ الرفع..." : "تأكيد التنفيذ"}
        </Button>
      </DialogFooter>
    </div>
  );
};

// ─── Grouping helpers ───
// NOTE: adjust `order.created_at` below if your API uses a different field
// name for the order's date (e.g. order.assigned_at, order.date).
const getOrderDateKey = (order) => {
  const raw = order.created_at || order.assigned_at || order.date;
  if (!raw) return "بدون تاريخ";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "بدون تاريخ";
  return d.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
};

const getOrderRegionKey = (order) => order.road_sign?.region?.name || "بدون منطقة";

/**
 * اسم الزبون الذي تتبعه هذه المجموعة - طلب صريح: "افرز أيضًا خانة الزبون
 * ... يعني هالطلبات لأيّا زبون تابعة" (مثال العميل: "عندي 10 xl بتاريخ
 * معين لزبون معين"). customer_new هو زبون "فك وتركيب" الجديد (نفس اللوحة
 * تنتقل من زبون لآخر بنفس التاريخ) - يُفضَّل لأنه من *ستُنفَّذ* اللوحة
 * لأجله فعليًا؛ إن اختلف عن الزبون الأصلي نعرض الاثنين معًا.
 */
const getOrderCustomerLabel = (order) => {
  const nameOf = (c) => c?.company_name || c?.full_name || null;
  const oldName = nameOf(order.customer);
  const newName = nameOf(order.customer_new);

  if (newName && oldName && newName !== oldName) return `${oldName} ← ${newName}`;
  return newName || oldName || "بلا زبون";
};

const groupOrders = (orders) => {
  const groups = {};
  orders.forEach((order) => {
    const region = getOrderRegionKey(order);
    const dateLabel = getOrderDateKey(order);
    const customer = getOrderCustomerLabel(order);
    const key = `${region}__${dateLabel}__${customer}`;
    if (!groups[key]) {
      groups[key] = { region, dateLabel, customer, orders: [] };
    }
    groups[key].orders.push(order);
  });
  // Sort groups: newest date first, then region name, then customer name
  return Object.values(groups).sort((a, b) => {
    if (a.dateLabel !== b.dateLabel) return b.dateLabel.localeCompare(a.dateLabel, "ar");
    if (a.region !== b.region) return a.region.localeCompare(b.region, "ar");
    return a.customer.localeCompare(b.customer, "ar");
  });
};

/**
 * شاشة "أوامري" لعامل الورشة - تجمع: ملخّص اليوم، فلاتر المقاس السريعة،
 * وقائمة الأوامر بزري استلام/تنفيذ. راجع DEVELOPER_GUIDE.md، الجزء
 * الثامن، لسبب دمج ملخّص اليوم وتوزيع المقاسات هنا بدل تبويبين منفصلين.
 */
const MyOrdersTab = ({ myWorkshop }) => {
  const {
    myOrders,
    activeRegions,
    isFetchingMyOrders,
    orderFilters,
    setOrderFilters,
    sizeBreakdown,
    dailySummary,
    receiveOrder,
    isReceiving,
    completeOrder,
    isCompleting,
  } = myWorkshop;

  const [receiveTarget, setReceiveTarget] = useState(null);
  const [completeTarget, setCompleteTarget] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});

  const activeSize = orderFilters.size;

  const groupedOrders = useMemo(() => groupOrders(myOrders || []), [myOrders]);

  // قفل المنطقة (طلب صريح): بمجرد استلام أمر من منطقة، تُقفَل بقية
  // المناطق (استلام وتنفيذ) حتى إنجاز منطقتك الحالية كاملة - نفس القاعدة
  // لمدير الورشة (يعمل كعامل هنا) وللعامل العادي. region_locked يصل جاهزًا
  // من الباك-إند لكل أمر (OrderService::myWorkshopOrders)؛ activeRegions هي
  // فقط لعرض اسم المنطقة/المناطق في التنبيه أدناه.
  const activeRegionNames = (activeRegions || []).map((r) => r.name).filter(Boolean);
  const hasActiveRegion = activeRegionNames.length > 0;

  const toggleGroup = (key) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4">
      {dailySummary && (
        <div className="grid grid-cols-3 gap-3">
          <div className="border border-border rounded-lg bg-card p-3 text-center">
            <div className="text-2xl font-bold">{dailySummary.assigned}</div>
            <div className="text-xs text-muted-foreground">مُسنَد اليوم</div>
          </div>
          <div className="border border-border rounded-lg bg-card p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{dailySummary.received}</div>
            <div className="text-xs text-muted-foreground">مُستلَم</div>
          </div>
          <div className="border border-border rounded-lg bg-card p-3 text-center">
            <div className="text-2xl font-bold text-emerald-600">{dailySummary.executed}</div>
            <div className="text-xs text-muted-foreground">مُنفَّذ</div>
          </div>
        </div>
      )}

      {hasActiveRegion && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 p-3 text-sm">
          <Icon icon="mdi:map-marker-lock-outline" className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-medium">
              منطقتك النشطة حاليًا: {activeRegionNames.join("، ")}
            </div>
            <div className="text-xs text-amber-700 mt-0.5">
              لديك أوامر مُستلَمة لم تُنفَّذ بعد في هذه المنطقة - أنجزها كاملة أولًا قبل استلام أو تنفيذ أوامر من منطقة أخرى.
            </div>
          </div>
        </div>
      )}

      {sizeBreakdown && sizeBreakdown.total > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">فلترة حسب المقاس:</span>
          <button
            onClick={() => setOrderFilters((f) => ({ ...f, size: undefined }))}
            className={`text-xs px-3 py-1 rounded-full border ${
              !activeSize ? "bg-primary text-primary-foreground border-primary" : "border-border"
            }`}
          >
            الكل ({sizeBreakdown.total})
          </button>
          {Object.entries(sizeBreakdown.by_size ?? {}).map(([size, count]) => (
            <button
              key={size}
              onClick={() => setOrderFilters((f) => ({ ...f, size }))}
              className={`text-xs px-3 py-1 rounded-full border ${
                activeSize === size ? "bg-primary text-primary-foreground border-primary" : "border-border"
              }`}
            >
              {size} ({count})
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {isFetchingMyOrders && (
          <div className="text-center text-muted-foreground py-8">جارٍ التحميل...</div>
        )}
        {!isFetchingMyOrders && myOrders.length === 0 && (
          <div className="text-center text-muted-foreground py-8">لا يوجد أوامر حاليًا</div>
        )}

        {!isFetchingMyOrders &&
          groupedOrders.map((group) => {
            const key = `${group.region}__${group.dateLabel}__${group.customer}`;
            const isOpen = !!expandedGroups[key];
            // نفس منطقة كل أوامر المجموعة (التجميع أصلًا حسب المنطقة)،
            // فيكفي فحص أول أمر لمعرفة إن كانت المجموعة كلها مقفلة.
            const isGroupLocked = group.orders[0]?.region_locked === true;
            return (
              <div
                key={key}
                className={`border rounded-lg bg-card overflow-hidden ${
                  isGroupLocked ? "border-border/60 opacity-70" : "border-border"
                }`}
              >
                {/* ─── group header (click to expand/collapse) ─── */}
                <button
                  type="button"
                  onClick={() => toggleGroup(key)}
                  className="w-full flex items-center justify-between gap-3 p-4 hover:bg-muted/40 transition-colors"
                >
                  <div className="text-right">
                    <div className="font-medium flex items-center gap-1.5">
                      {group.region}
                      {isGroupLocked && (
                        <Icon
                          icon="mdi:lock-outline"
                          className="w-4 h-4 text-amber-600"
                          title="أنجز منطقتك النشطة أولًا لفتح هذه المنطقة"
                        />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {group.dateLabel} · الزبون: {group.customer}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {group.orders.length} أمر
                    </span>
                    <Icon
                      icon="mdi:chevron-down"
                      className={`w-5 h-5 text-muted-foreground transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {/* ─── group details (orders list) ─── */}
                {isOpen && (
                  <div className="border-t border-border divide-y divide-border">
                    {isGroupLocked && (
                      <div className="p-3 text-xs bg-amber-50 text-amber-700 flex items-center gap-1.5">
                        <Icon icon="mdi:information-outline" className="w-4 h-4 shrink-0" />
                        هذه المنطقة مقفلة حتى تُنجز أوامر منطقتك النشطة كاملة.
                      </div>
                    )}
                    {group.orders.map((order) => {
                      const isLocked = order.region_locked === true;
                      const lockTitle = isLocked
                        ? "لا يمكن استلام أو تنفيذ أوامر من هذه المنطقة قبل إنجاز منطقتك النشطة كاملة"
                        : undefined;
                      return (
                        <div key={order.id} className="p-4">
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {order.road_sign?.roadsign_code || `#${order.road_sign_id}`}
                                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                  {ORDER_TYPE_LABELS[order.type] || order.type}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {order.road_sign?.city?.name || "-"} / {order.road_sign?.region?.name || "-"} ·
                                {" "}مقاس {order.road_sign?.template?.size || "-"}
                              </div>
                              {order.road_sign?.place && (
                                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                  <Icon icon="mdi:map-marker-outline" className="w-3.5 h-3.5 shrink-0" />
                                  {order.road_sign.place}
                                </div>
                              )}
                              {order.received_at && (
                                <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                                  <Icon icon="mdi:check-circle-outline" className="w-3.5 h-3.5" />
                                  مُستلَم
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {!order.received_at && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={isLocked}
                                  title={lockTitle}
                                  onClick={() => setReceiveTarget(order)}
                                >
                                  <Icon icon="mdi:hand-back-right-outline" className="w-4 h-4 ml-1" />
                                  استلام
                                </Button>
                              )}
                              <Button
                                size="sm"
                                disabled={isLocked}
                                title={lockTitle}
                                onClick={() => setCompleteTarget(order)}
                              >
                                <Icon icon="mdi:camera-outline" className="w-4 h-4 ml-1" />
                                تنفيذ
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
      </div>

      <Dialog open={!!receiveTarget} onOpenChange={(open) => !open && setReceiveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>استلام أمر</DialogTitle>
          </DialogHeader>
          <ReceiveDialog
            order={receiveTarget}
            onCancel={() => setReceiveTarget(null)}
            isSaving={isReceiving}
            onConfirm={async (payload) => {
              const ok = await receiveOrder(receiveTarget.id, payload);
              if (ok) setReceiveTarget(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!completeTarget} onOpenChange={(open) => !open && setCompleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>توثيق تنفيذ الأمر</DialogTitle>
          </DialogHeader>
          <CompleteDialog
            onCancel={() => setCompleteTarget(null)}
            isSaving={isCompleting}
            onConfirm={async (payload) => {
              const ok = await completeOrder(completeTarget.id, payload);
              if (ok) setCompleteTarget(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyOrdersTab;