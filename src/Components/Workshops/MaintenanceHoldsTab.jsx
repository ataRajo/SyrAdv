import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
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
import {
  useGetMaintenanceHoldsQuery,
  useGetMaintenanceCandidatesQuery,
  useMarkMaintenanceHoldMutation,
  useClearMaintenanceHoldMutation,
  useManagerCompleteOrderMutation,
  useManagerSendBookingPdfMutation,
  useGetWorkshopsQuery,
} from "../../RtkQuery/Slice/Workshops/WorkshopsApi";
import { CompleteDialog } from "./MyOrdersTab";

const ORDER_TYPE_LABELS = { 1: "فك", 2: "تركيب", 3: "فك وتركيب", 4: "صيانة" };

const customerLabel = (order) => {
  const nameOf = (c) => c?.company_name || c?.full_name || null;
  return nameOf(order.customer_new) || nameOf(order.customer) || "-";
};

const signLabel = (order) => order.road_sign?.roadsign_code || `#${order.road_sign_id}`;

/** نافذة تأشير / تمديد الصيانة: عدد الأيام + سبب اختياري. */
const HoldDialog = ({ order, onCancel, onConfirm, isSaving }) => {
  const [days, setDays] = useState(order?.maintenance_hold_days || 3);
  const [reason, setReason] = useState(order?.maintenance_hold_reason || "");

  const until = useMemo(() => {
    const n = parseInt(days, 10);
    if (!n || n < 1) return "-";
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toLocaleDateString("en-CA");
  }, [days]);

  return (
    <div className="space-y-4">
      <div className="text-sm bg-muted/50 rounded-md p-3 space-y-1">
        <div className="font-medium">
          اللوحة {signLabel(order)} · {ORDER_TYPE_LABELS[order.type] || order.type}
        </div>
        <div className="text-muted-foreground">
          {order.road_sign?.region?.name || "-"} · {order.road_sign?.place || "-"}
        </div>
      </div>
      <div className="space-y-2">
        <Label>عدد أيام الصيانة</Label>
        <Input type="number" min="1" max="365" value={days} onChange={(e) => setDays(e.target.value)} />
        <div className="text-xs text-muted-foreground">
          سيُمدَّد تنفيذ أمر هذه اللوحة وحدها حتى {until}، ويستطيع العامل الانتقال لمنطقة أخرى.
          لن يُرسَل ملف الـ PDF للزبون حتى تكتمل الصيانة (أو ترسله يدويًا).
        </div>
      </div>
      <div className="space-y-2">
        <Label>سبب الصيانة (اختياري)</Label>
        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="مثال: هيكل اللوحة يحتاج لحام" />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          إلغاء
        </Button>
        <Button
          type="button"
          disabled={isSaving || !parseInt(days, 10)}
          onClick={() => onConfirm({ days: parseInt(days, 10), reason: reason.trim() })}
        >
          {isSaving ? "جارٍ الحفظ..." : "تأكيد حالة الصيانة"}
        </Button>
      </DialogFooter>
    </div>
  );
};

/**
 * تبويب "الصيانة" - صلاحية manage-maintenance-holds (طلب صريح: صلاحية
 * مستقلة للصيانة). المرتبط بورشة = ورشته فقط؛ unrestricted = كل الورشات:
 *  - القاعدة: العامل لا يخرج من المنطقة إلا بعد تركيب كل لوحاتها.
 *  - الاستثناء: لوحة تحتاج صيانة - يؤشّر مدير الورشة عليها بحالة صيانة ويحدد
 *    عدد الأيام، فيُمدَّد أمرها وحده ويستطيع العامل الانتقال.
 *  - طالما في الحجز لوحة بحالة صيانة، لا يُرسَل ملف الـ PDF للزبون حتى
 *    تكتمل كل اللوحات - أو ينهي مدير الورشة الصيانة مبكرًا بنفسه مع الصور ثم
 *    يُرسَل الملف يدويًا.
 */
const MaintenanceHoldsTab = ({ unrestricted = false }) => {
  const [search, setSearch] = useState("");
  const [holdTarget, setHoldTarget] = useState(null);
  const [completeTarget, setCompleteTarget] = useState(null);
  // صاحب صلاحية الصيانة بلا ورشة (أو super admin) يعمل على كل الورشات -
  // يختار الورشة هنا. المرتبط بورشة: الباك-إند يحصر القائمتين بورشته تلقائيًا.
  const [workshopId, setWorkshopId] = useState("");

  const { data: workshops = [] } = useGetWorkshopsQuery(undefined, { skip: !unrestricted });
  const workshopParams = unrestricted && workshopId ? { workshop_id: workshopId } : {};

  const { data: holds = [], isFetching: isFetchingHolds } = useGetMaintenanceHoldsQuery(workshopParams);
  const { data: candidates = [], isFetching: isFetchingPending } = useGetMaintenanceCandidatesQuery(workshopParams, {
    skip: unrestricted && !workshopId,
  });
  const needsWorkshopPick = unrestricted && !workshopId;

  const [markHold, { isLoading: isMarking }] = useMarkMaintenanceHoldMutation();
  const [clearHold, { isLoading: isClearing }] = useClearMaintenanceHoldMutation();
  const [managerComplete, { isLoading: isCompleting }] = useManagerCompleteOrderMutation();
  const [sendPdf, { isLoading: isSendingPdf }] = useManagerSendBookingPdfMutation();

  const pendingOrders = useMemo(() => {
    const rows = (candidates ?? []).filter((o) => [1, 2, 3].includes(Number(o.type)));
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((o) =>
      [signLabel(o), o.road_sign?.region?.name, o.road_sign?.city?.name, o.road_sign?.place]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [candidates, search]);

  const onConfirmHold = async ({ days, reason }) => {
    try {
      await markHold({ orderId: holdTarget.id, days, reason }).unwrap();
      toast.success("تم تأشير اللوحة بحالة صيانة");
      setHoldTarget(null);
    } catch (error) {
      toast.error(error?.data?.message || "تعذّر تأشير الصيانة");
    }
  };

  const onClear = async (order) => {
    if (!window.confirm(`إنهاء حالة الصيانة للوحة ${signLabel(order)}؟ سيعود أمرها مستحقًا اليوم للورشة.`)) return;
    try {
      await clearHold(order.id).unwrap();
      toast.success("تم إنهاء حالة الصيانة");
    } catch (error) {
      toast.error(error?.data?.message || "تعذّر إنهاء الصيانة");
    }
  };

  const onConfirmComplete = async ({ beforePhoto, afterPhoto }) => {
    const formData = new FormData();
    if (beforePhoto) formData.append("before_photo", beforePhoto);
    formData.append("after_photo", afterPhoto);
    try {
      await managerComplete({ orderId: completeTarget.id, formData }).unwrap();
      toast.success("تم تنفيذ الأمر وإرفاق الصور - يمكن الآن إرسال ملف الـ PDF للزبون");
      setCompleteTarget(null);
    } catch (error) {
      toast.error(error?.data?.message || "تعذّر توثيق التنفيذ");
    }
  };

  // إرسال ملف الـ PDF للزبون يدويًا رغم وجود لوحات بصيانة (بعد أن يعدّل
  // المدير الملف ويضع الصور) - نفس الملف المرفوع للحجز.
  const onSendPdf = async (order) => {
    const bookingId = order.booking?.id || order.booking_id;
    if (!bookingId) return;
    if (!window.confirm("إرسال ملف الـ PDF المرفوع لهذا الحجز للزبون الآن عبر واتساب رغم وجود لوحة بحالة صيانة؟")) return;
    try {
      await sendPdf(bookingId).unwrap();
      toast.success("تم إرسال الملف للزبون عبر واتساب");
    } catch (error) {
      toast.error(error?.data?.message || "تعذّر إرسال الملف");
    }
  };

  return (
    <div className="space-y-6">
      {unrestricted && (
        <div className="border border-border rounded-lg bg-card p-4 flex flex-wrap items-end gap-3">
          <div className="space-y-1 min-w-[220px]">
            <Label className="text-xs">الورشة</Label>
            <select
              value={workshopId}
              onChange={(e) => setWorkshopId(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">كل الورشات</option>
              {(workshops ?? []).map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-muted-foreground flex-1 min-w-[200px]">
            لديك صلاحية الصيانة على كل الورشات. اختر ورشة لتأشير لوحاتها بحالة صيانة.
          </p>
        </div>
      )}

      {/* ─── اللوحات الحالية بحالة صيانة ─── */}
      <div className="border border-border rounded-lg bg-card">
        <div className="p-4 border-b border-border flex items-center justify-between gap-2">
          <div>
            <div className="font-bold flex items-center gap-2">
              <Icon icon="mdi:wrench-clock" className="w-5 h-5 text-orange-600" />
              لوحات بحالة صيانة
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              لا يُرسَل ملف الـ PDF لزبون الحجز حتى تُحسَم صيانة كل لوحاته.
            </div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">{holds.length}</span>
        </div>

        {isFetchingHolds && <div className="p-6 text-center text-muted-foreground">جارٍ التحميل...</div>}
        {!isFetchingHolds && holds.length === 0 && (
          <div className="p-6 text-center text-muted-foreground">لا توجد لوحات بحالة صيانة حاليًا</div>
        )}

        {!isFetchingHolds && holds.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs">
                <tr>
                  <th className="p-2 text-right">اللوحة</th>
                  <th className="p-2 text-right">المنطقة / المكان</th>
                  <th className="p-2 text-right">الزبون / الحجز</th>
                  <th className="p-2 text-right">الورشة</th>
                  <th className="p-2 text-right">الصيانة حتى</th>
                  <th className="p-2 text-right">السبب</th>
                  <th className="p-2 text-right">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {holds.map((order) => (
                  <tr key={order.id}>
                    <td className="p-2">
                      <div className="font-medium">{signLabel(order)}</div>
                      <div className="text-xs text-muted-foreground">{ORDER_TYPE_LABELS[order.type] || order.type}</div>
                    </td>
                    <td className="p-2">
                      {order.road_sign?.region?.name || "-"}
                      <div className="text-xs text-muted-foreground">{order.road_sign?.place || ""}</div>
                    </td>
                    <td className="p-2">
                      {customerLabel(order)}
                      <div className="text-xs text-muted-foreground">
                        {order.booking ? `حجز ${order.booking.number || `#${order.booking.id}`}` : ""}
                      </div>
                    </td>
                    <td className="p-2">{order.workshop?.name || "-"}</td>
                    <td className="p-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          order.maintenance_hold_active ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {order.maintenance_hold_until || "-"}
                      </span>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {order.maintenance_hold_active ? `${order.maintenance_hold_days} يوم` : "انتهت المدة"}
                      </div>
                    </td>
                    <td className="p-2 text-xs">{order.maintenance_hold_reason || "-"}</td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-1.5">
                        <Button size="sm" onClick={() => setCompleteTarget(order)} title="تمت الصيانة: نفّذ الأمر وارفع الصور">
                          <Icon icon="mdi:camera-outline" className="w-4 h-4 ml-1" />
                          تنفيذ مع صور
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setHoldTarget(order)}>
                          تمديد
                        </Button>
                        <Button size="sm" variant="outline" disabled={isClearing} onClick={() => onClear(order)}>
                          إنهاء الصيانة
                        </Button>
                        {(order.booking?.id || order.booking_id) && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isSendingPdf}
                            onClick={() => onSendPdf(order)}
                            title="إرسال ملف الـ PDF المرفوع للحجز للزبون يدويًا"
                          >
                            <Icon icon="mdi:whatsapp" className="w-4 h-4 ml-1" />
                            إرسال PDF يدويًا
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── تأشير لوحة جديدة بحالة صيانة ─── */}
      <div className="border border-border rounded-lg bg-card">
        <div className="p-4 border-b border-border space-y-3">
          <div className="font-bold">
            {unrestricted ? "تأشير لوحة بحالة صيانة" : "تأشير لوحة من ورشتي بحالة صيانة"}
          </div>
          <div className="space-y-1 max-w-md">
            <Label className="text-xs">بحث (رمز اللوحة / المنطقة / المكان)</Label>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {needsWorkshopPick && (
          <div className="p-6 text-center text-muted-foreground">اختر ورشة من الأعلى لعرض أوامرها غير المنفَّذة</div>
        )}
        {!needsWorkshopPick && isFetchingPending && (
          <div className="p-6 text-center text-muted-foreground">جارٍ التحميل...</div>
        )}
        {!needsWorkshopPick && !isFetchingPending && pendingOrders.length === 0 && (
          <div className="p-6 text-center text-muted-foreground">لا توجد أوامر فك/تركيب غير منفَّذة</div>
        )}

        {!needsWorkshopPick && !isFetchingPending && pendingOrders.length > 0 && (
          <div className="divide-y divide-border">
            {pendingOrders.map((order) => {
              const onHold = !!order.maintenance_hold_at && !order.maintenance_resolved_at;
              return (
                <div key={order.id} className="p-3 flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {signLabel(order)}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {ORDER_TYPE_LABELS[order.type] || order.type}
                      </span>
                      {onHold && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                          صيانة حتى {order.maintenance_hold_until}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {order.road_sign?.city?.name || "-"} / {order.road_sign?.region?.name || "-"} · مقاس{" "}
                      {order.road_sign?.template?.size || "-"} · تاريخ التنفيذ {order.action_date || "-"}
                      {order.assigned_worker?.full_name ? ` · العامل: ${order.assigned_worker.full_name}` : ""}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setHoldTarget(order)}>
                    <Icon icon="mdi:wrench-outline" className="w-4 h-4 ml-1" />
                    {onHold ? "تمديد الصيانة" : "بحالة صيانة"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!holdTarget} onOpenChange={(open) => !open && setHoldTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأشير اللوحة بحالة صيانة</DialogTitle>
          </DialogHeader>
          {holdTarget && (
            <HoldDialog
              order={holdTarget}
              onCancel={() => setHoldTarget(null)}
              onConfirm={onConfirmHold}
              isSaving={isMarking}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!completeTarget} onOpenChange={(open) => !open && setCompleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تمت الصيانة - تنفيذ الأمر ورفع الصور</DialogTitle>
          </DialogHeader>
          {completeTarget && (
            <CompleteDialog
              onCancel={() => setCompleteTarget(null)}
              isSaving={isCompleting}
              onConfirm={onConfirmComplete}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MaintenanceHoldsTab;
