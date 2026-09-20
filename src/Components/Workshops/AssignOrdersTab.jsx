import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Icon } from "@iconify/react";

const ORDER_TYPE_LABELS = {
  1: "فك",
  2: "تركيب",
  3: "فك وتركيب",
  4: "صيانة",
};

/**
 * اسم الزبون الذي "تتبعه" هذه المجموعة - طلب صريح: "افرز أيضًا خانة
 * الزبون... يعني هالطلبات لأيّا زبون تابعة" (مثال العميل: "عندي 10 xl
 * بتاريخ معين لزبون معين"). customer_new هو الزبون الجديد في حالة "فك
 * وتركيب" (نفس اللوحة تنتقل من زبون لآخر بنفس التاريخ) - هو الأولوية لأنه
 * الزبون الذي *ستُنفَّذ* اللوحة لأجله فعليًا؛ إن اختلف عن الزبون الأصلي
 * نعرض الاثنين معًا (تركيب لِـ B بعد فك من عند A).
 */
const getOrderCustomerLabel = (order) => {
  const nameOf = (c) => c?.company_name || c?.full_name || null;
  const oldName = nameOf(order.customer);
  const newName = nameOf(order.customer_new);

  if (newName && oldName && newName !== oldName) return `${oldName} ← ${newName}`;
  return newName || oldName || "بلا زبون";
};

const getOrderCustomerKey = (order) => {
  const nameOf = (c) => c?.company_name || c?.full_name || null;
  return nameOf(order.customer_new) || nameOf(order.customer) || "بلا زبون";
};

/**
 * تجميع الأوامر حسب (المدينة + المنطقة + تاريخ التنفيذ المخطَّط + الزبون)
 * في سطر واحد - طلب العميل: "لأن العمل على أرض الواقع يكون كل ورشة تستلم
 * منطقة معينة" - فتصفّح مئات الأسطر الفردية بحثًا عن أوامر منطقة بعينها
 * في يوم بعينه غير عملي، بينما التجميع يُظهر مباشرة "5 أوامر في منطقة كذا
 * بتاريخ كذا لزبون كذا" كما طلب العميل حرفيًا. لا تغيير على الباك-إند: كل
 * مجموعة هي واجهة عرض/تحديد فوق نفس مصفوفة order_ids المُرسَلة لاحقًا
 * لـ assignOrders.
 */
const groupOrders = (orders) => {
  const groups = new Map();

  orders.forEach((order) => {
    const cityName = order.road_sign?.city?.name || "بلا مدينة";
    const regionName = order.road_sign?.region?.name || "بلا منطقة";
    const actionDate = order.action_date || "بلا تاريخ";
    const customerName = getOrderCustomerLabel(order);
    const customerKey = getOrderCustomerKey(order);
    const key = `${cityName}|${regionName}|${actionDate}|${customerKey}`;

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        cityName,
        regionName,
        actionDate,
        customerName,
        orders: [],
      });
    }
    groups.get(key).orders.push(order);
  });

  return Array.from(groups.values()).sort((a, b) => {
    if (a.actionDate !== b.actionDate) return a.actionDate.localeCompare(b.actionDate);
    if (a.cityName !== b.cityName) return a.cityName.localeCompare(b.cityName, "ar");
    if (a.regionName !== b.regionName) return a.regionName.localeCompare(b.regionName, "ar");
    return a.customerName.localeCompare(b.customerName, "ar");
  });
};

/**
 * ملخص اتجاهات مجموعة أوامر - يُعرض في صف المجموعة المطوي قبل توسيعه، حتى
 * تُرى الاتجاهات دفعة واحدة بلا حاجة لفتح كل مجموعة. يجمع القيم الفريدة
 * (direction_code مع النص الوصفي directions بين قوسين إن اختلف عنه) لكل
 * لوحة ضمن المجموعة.
 */
const getGroupDirectionsSummary = (orders) => {
  const values = new Set();
  orders.forEach((order) => {
    const code = order.road_sign?.direction_code;
    const text = order.road_sign?.directions;
    if (code && text && code !== text) values.add(`${code} (${text})`);
    else if (code || text) values.add(code || text);
  });
  if (values.size === 0) return "غير محدد";
  return Array.from(values).join("، ");
};

/**
 * إسناد دفعة أوامر (فك/تركيب) لورشة - نداء الإدارة الصباحي. الأوامر
 * المعروضة هنا هي غير المؤكَّدة (status=false) وغير المُسنَدة لأي ورشة
 * بعد؛ بمجرد الإسناد يمكن لعمال تلك الورشة رؤيتها فورًا في تطبيقهم عبر
 * GET /workshop-orders/my-orders.
 *
 * الأوامر مُجمَّعة حسب المدينة/المنطقة/تاريخ التنفيذ في سطر واحد لكل
 * مجموعة (طلب العميل) - افتح المجموعة لرؤية الأوامر الفردية أو حدِّد
 * أوامر بعينها منها.
 */
const AssignOrdersTab = ({ workshops }) => {
  const {
    workshops: workshopsList,
    assignableOrders,
    isFetchingUnassignedOrders,
    selectedOrderIds,
    toggleOrderSelection,
    setSelectedOrderIds,
    assignTargetWorkshopId,
    setAssignTargetWorkshopId,
    assignSelectedOrders,
    isAssigningOrders,
  } = workshops;

  const activeWorkshops = (workshopsList ?? []).filter((w) => w.is_active);
  const allSelected =
    assignableOrders.length > 0 && selectedOrderIds.length === assignableOrders.length;

  const groups = useMemo(() => groupOrders(assignableOrders ?? []), [assignableOrders]);
  const [expandedGroups, setExpandedGroups] = useState(() => new Set());

  const toggleExpanded = (key) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const groupSelectionState = (group) => {
    const selectedCount = group.orders.filter((o) => selectedOrderIds.includes(o.id)).length;
    if (selectedCount === 0) return "none";
    if (selectedCount === group.orders.length) return "all";
    return "partial";
  };

  const toggleGroupSelection = (group) => {
    const state = groupSelectionState(group);
    const groupIds = group.orders.map((o) => o.id);
    if (state === "all") {
      setSelectedOrderIds((prev) => prev.filter((id) => !groupIds.includes(id)));
    } else {
      setSelectedOrderIds((prev) => Array.from(new Set([...prev, ...groupIds])));
    }
  };

  return (
    <div className="border border-border rounded-lg bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border">
        <h3 className="font-semibold">إسناد دفعة أوامر لورشة</h3>
        <div className="flex items-center gap-2">
          <Select value={assignTargetWorkshopId} onValueChange={setAssignTargetWorkshopId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="اختر الورشة" />
            </SelectTrigger>
            <SelectContent>
              {activeWorkshops.map((w) => (
                <SelectItem key={w.id} value={String(w.id)}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={assignSelectedOrders}
            disabled={isAssigningOrders || !assignTargetWorkshopId || selectedOrderIds.length === 0}
          >
            <Icon icon="mdi:truck-delivery-outline" className="w-4 h-4 ml-1" />
            {isAssigningOrders ? "جارٍ الإسناد..." : `إسناد (${selectedOrderIds.length})`}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-center">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="p-2 text-center">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={allSelected}
                  onChange={(e) =>
                    setSelectedOrderIds(e.target.checked ? assignableOrders.map((o) => o.id) : [])
                  }
                  title="تحديد الكل"
                />
              </th>
              <th className="p-2 text-center"></th>
              <th className="p-2 text-center">المدينة/المنطقة</th>
              <th className="p-2 text-center">الاتجاهات</th>
              <th className="p-2 text-center">تاريخ التنفيذ المخطَّط</th>
              <th className="p-2 text-center">الزبون</th>
              <th className="p-2 text-center">عدد الأوامر</th>
            </tr>
          </thead>
          <tbody>
            {isFetchingUnassignedOrders && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-muted-foreground">
                  جارٍ التحميل...
                </td>
              </tr>
            )}
            {!isFetchingUnassignedOrders && groups.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-muted-foreground">
                  لا يوجد أوامر بانتظار الإسناد حاليًا
                </td>
              </tr>
            )}
            {groups.map((group) => {
              const state = groupSelectionState(group);
              const isExpanded = expandedGroups.has(group.key);
              return (
                <React.Fragment key={group.key}>
                  <tr className="border-b border-border/50 hover:bg-muted/30 bg-muted/10">
                    <td className="p-2 text-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={state === "all"}
                        ref={(el) => {
                          if (el) el.indeterminate = state === "partial";
                        }}
                        onChange={() => toggleGroupSelection(group)}
                      />
                    </td>
                    <td className="p-2 text-center">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => toggleExpanded(group.key)}
                        title={isExpanded ? "طي" : "عرض الأوامر الفردية"}
                      >
                        <Icon
                          icon={isExpanded ? "mdi:chevron-up" : "mdi:chevron-down"}
                          className="w-4 h-4"
                        />
                      </Button>
                    </td>
                    <td className="p-2 text-center font-medium">
                      {group.cityName} / {group.regionName}
                    </td>
                    <td className="p-2 text-center">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Icon icon="mdi:compass-outline" className="w-4 h-4" />
                        {getGroupDirectionsSummary(group.orders)}
                      </span>
                    </td>
                    <td className="p-2 text-xs text-center">{group.actionDate}</td>
                    <td className="p-2 text-xs text-center font-medium">{group.customerName}</td>
                    <td className="p-2 text-center">
                      <span className="inline-flex items-center justify-center min-w-6 h-6 px-1.5 text-xs font-bold text-white bg-primary rounded-full">
                        {group.orders.length}
                      </span>
                    </td>
                  </tr>
                  {isExpanded &&
                    group.orders.map((order) => (
                      <tr key={order.id} className="border-b border-border/30 hover:bg-muted/20 text-xs">
                        <td className="p-1.5 text-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={selectedOrderIds.includes(order.id)}
                            onChange={() => toggleOrderSelection(order.id)}
                          />
                        </td>
                        <td className="p-1.5"></td>
                        <td className="p-1.5 text-center text-muted-foreground" colSpan={3}>
                          اللوحة: {order.road_sign?.roadsign_code || `#${order.road_sign_id}`}
                          {" - "}
                          الاتجاه: {order.road_sign?.direction_code || order.road_sign?.directions || "غير محدد"}
                          {order.road_sign?.directions && order.road_sign?.direction_code && order.road_sign.directions !== order.road_sign.direction_code
                            ? ` (${order.road_sign.directions})`
                            : ""}
                          {" - "}
                          النوع: {ORDER_TYPE_LABELS[order.type] || order.type}
                          {order.road_sign?.template?.size ? ` - المقاس: ${order.road_sign.template.size}` : ""}
                        </td>
                        <td className="p-1.5 text-center text-muted-foreground">
                          {getOrderCustomerLabel(order)}
                        </td>
                        <td className="p-1.5"></td>
                      </tr>
                    ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssignOrdersTab;
