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

const ORDER_TYPE_LABELS = { 1: "فك", 2: "تركيب", 3: "فك وتركيب", 4: "صيانة" };

const getOrderCustomerLabel = (order) => {
  const nameOf = (c) => c?.company_name || c?.full_name || null;
  const oldName = nameOf(order.customer);
  const newName = nameOf(order.customer_new);

  if (newName && oldName && newName !== oldName)
    return `${oldName} ← ${newName}`;
  return newName || oldName || "بلا زبون";
};

/**
 * تجميع حسب (المدينة + المنطقة + تاريخ التنفيذ + الزبون + الورشة الحالية)
 * - نفس نمط AssignOrdersTab، مع إضافة الورشة الحالية للتجميع كي لا تُخلَط
 * دفعتان متأخرتان من ورشتين مختلفتين في مجموعة واحدة (القرار قد يختلف
 * بينهما: إحداهما تبقى، والأخرى تنتقل).
 */
const groupOrders = (orders) => {
  const groups = new Map();

  orders.forEach((order) => {
    const cityName = order.road_sign?.city?.name || "بلا مدينة";
    const regionName = order.road_sign?.region?.name || "بلا منطقة";
    const actionDate = order.action_date || "بلا تاريخ";
    const customerName = getOrderCustomerLabel(order);
    const currentWorkshopId = order.workshop_id ?? "none";
    const currentWorkshopName = order.workshop?.name || "بلا ورشة";
    const key = `${cityName}|${regionName}|${actionDate}|${customerName}|${currentWorkshopId}`;

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        cityName,
        regionName,
        actionDate,
        customerName,
        currentWorkshopId,
        currentWorkshopName,
        orders: [],
      });
    }
    groups.get(key).orders.push(order);
  });

  return Array.from(groups.values()).sort((a, b) => {
    if (a.actionDate !== b.actionDate)
      return a.actionDate.localeCompare(b.actionDate);
    if (a.cityName !== b.cityName)
      return a.cityName.localeCompare(b.cityName, "ar");
    if (a.regionName !== b.regionName)
      return a.regionName.localeCompare(b.regionName, "ar");
    return a.customerName.localeCompare(b.customerName, "ar");
  });
};

/**
 * ملخص اتجاهات مجموعة أوامر - نفس دالة AssignOrdersTab بالضبط (طلب صريح
 * بعرض الاتجاهات في شاشات إسناد الطلبات جميعها).
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
 * "إعادة إسناد متأخرة" - طلب صريح: "عندما العامل يستلم طلبات ولم ينفذها
 * كلها (للساعة 7 مساءً بتوقيت سوريا) يجب اعادة فرز الطلبات واسنادها
 * لورشات جديدة أو لنفس الورشة (على حسب قرار الإدمن)".
 *
 * الأوامر هنا هي التي علَّمها الباك-إند تلقائيًا (needs_reassignment_at)
 * لأنها لم تُنفَّذ رغم استحقاقها حتى الساعة 7 مساءً. لا إسناد تلقائي - كل
 * ما هنا بانتظار قرار المسؤول: يختار ورشة الهدف (قد تكون نفس "الورشة
 * الحالية" المعروضة لكل مجموعة، أو ورشة مختلفة تمامًا) ثم يضغط "إعادة
 * إسناد". اختيار نفس الورشة الحالية لا يمس بيانات الاستلام/التخصيص
 * الموجودة (الورشة قد تكون بدأت فعليًا)، بينما اختيار ورشة مختلفة يُصفِّر
 * الاستلام/التخصيص القديمين كي تبدأ الورشة الجديدة دورة استلام نظيفة -
 * راجع OrderService::reassignOrders على الباك-إند لتفاصيل الفرق.
 */
const ReassignOrdersTab = ({ workshops }) => {
  const {
    workshops: workshopsList,
    reassignmentOrders,
    isFetchingReassignmentOrders,
    selectedReassignmentOrderIds,
    toggleReassignmentOrderSelection,
    setSelectedReassignmentOrderIds,
    reassignTargetWorkshopId,
    setReassignTargetWorkshopId,
    reassignSelectedOrders,
    isReassigningOrders,
  } = workshops;

  const activeWorkshops = (workshopsList ?? []).filter((w) => w.is_active);
  const allSelected =
    reassignmentOrders.length > 0 &&
    selectedReassignmentOrderIds.length === reassignmentOrders.length;

  const groups = useMemo(
    () => groupOrders(reassignmentOrders ?? []),
    [reassignmentOrders],
  );
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
    const selectedCount = group.orders.filter((o) =>
      selectedReassignmentOrderIds.includes(o.id),
    ).length;
    if (selectedCount === 0) return "none";
    if (selectedCount === group.orders.length) return "all";
    return "partial";
  };

  const toggleGroupSelection = (group) => {
    const state = groupSelectionState(group);
    const groupIds = group.orders.map((o) => o.id);
    if (state === "all") {
      setSelectedReassignmentOrderIds((prev) =>
        prev.filter((id) => !groupIds.includes(id)),
      );
    } else {
      setSelectedReassignmentOrderIds((prev) =>
        Array.from(new Set([...prev, ...groupIds])),
      );
    }
  };

  // اختصار: تحديد كل أوامر مجموعة بعينها ثم تعيين هدف الإسناد إلى ورشتها
  // الحالية نفسها بضغطة واحدة - يغطي الحالة الأكثر شيوعًا "أبقِها في نفس
  // الورشة" بلا حاجة للبحث عنها يدويًا في القائمة المنسدلة.
  const keepSameWorkshop = (group) => {
    if (!group.currentWorkshopId || group.currentWorkshopId === "none") return;
    setSelectedReassignmentOrderIds((prev) =>
      Array.from(new Set([...prev, ...group.orders.map((o) => o.id)])),
    );
    setReassignTargetWorkshopId(String(group.currentWorkshopId));
  };

  return (
    <div className="border border-border rounded-lg bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border">
        <div>
          <h3 className="font-semibold">إعادة إسناد متأخرة</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            أوامر لم تُنجَز حتى الساعة 7 مساءً بتوقيت دمشق - اختر ورشة الهدف
            (نفس الورشة الحالية أو ورشة جديدة) ثم أعد الإسناد.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={reassignTargetWorkshopId}
            onValueChange={setReassignTargetWorkshopId}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="اختر ورشة الهدف" />
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
            onClick={reassignSelectedOrders}
            disabled={
              isReassigningOrders ||
              !reassignTargetWorkshopId ||
              selectedReassignmentOrderIds.length === 0
            }
          >
            <Icon icon="mdi:refresh" className="w-4 h-4 ml-1" />
            {isReassigningOrders
              ? "جارٍ إعادة الإسناد..."
              : `إعادة إسناد (${selectedReassignmentOrderIds.length})`}
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
                    setSelectedReassignmentOrderIds(
                      e.target.checked
                        ? reassignmentOrders.map((o) => o.id)
                        : [],
                    )
                  }
                  title="تحديد الكل"
                />
              </th>
              <th className="p-2 text-center"></th>
              <th className="p-2 text-center">المدينة/المنطقة</th>
              <th className="p-2 text-center">الاتجاهات</th>
              <th className="p-2 text-center">تاريخ التنفيذ المخطَّط</th>
              <th className="p-2 text-center">الزبون</th>
              <th className="p-2 text-center">الورشة الحالية</th>
              <th className="p-2 text-center">عدد الأوامر</th>
              <th className="p-2 text-center"></th>
            </tr>
          </thead>
          <tbody>
            {isFetchingReassignmentOrders && (
              <tr>
                <td
                  colSpan={9}
                  className="p-4 text-center text-muted-foreground"
                >
                  جارٍ التحميل...
                </td>
              </tr>
            )}
            {!isFetchingReassignmentOrders && groups.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="p-4 text-center text-muted-foreground"
                >
                  لا يوجد أوامر متأخرة بحاجة لإعادة إسناد حاليًا
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
                          icon={
                            isExpanded ? "mdi:chevron-up" : "mdi:chevron-down"
                          }
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
                    <td className="p-2 text-xs text-center">
                      {group.actionDate}
                    </td>
                    <td className="p-2 text-xs text-center font-medium">
                      {group.customerName}
                    </td>
                    <td className="p-2 text-xs text-center">
                      {group.currentWorkshopName}
                    </td>
                    <td className="p-2 text-center">
                      <span className="inline-flex items-center justify-center min-w-6 h-6 px-1.5 text-xs font-bold text-white bg-amber-600 rounded-full">
                        {group.orders.length}
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        onClick={() => keepSameWorkshop(group)}
                        title="حدِّد أوامر هذه المجموعة واجعل هدف الإسناد نفس ورشتها الحالية"
                      >
                        الإبقاء بنفس الورشة
                      </Button>
                    </td>
                  </tr>
                  {isExpanded &&
                    group.orders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-border/30 hover:bg-muted/20 text-xs"
                      >
                        <td className="p-1.5 text-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={selectedReassignmentOrderIds.includes(
                              order.id,
                            )}
                            onChange={() =>
                              toggleReassignmentOrderSelection(order.id)
                            }
                          />
                        </td>
                        <td className="p-1.5"></td>
                        <td
                          className="p-1.5 text-center text-muted-foreground"
                          colSpan={5}
                        >
                          اللوحة:{" "}
                          {order.road_sign?.roadsign_code ||
                            `#${order.road_sign_id}`}
                          {" - "}
                          الاتجاه:{" "}
                          {order.road_sign?.direction_code ||
                            order.road_sign?.directions ||
                            "غير محدد"}
                          {order.road_sign?.directions &&
                          order.road_sign?.direction_code &&
                          order.road_sign.directions !== order.road_sign.direction_code
                            ? ` (${order.road_sign.directions})`
                            : ""}
                          {" - "}
                          النوع: {ORDER_TYPE_LABELS[order.type] || order.type}
                          {order.road_sign?.template?.size
                            ? ` - المقاس: ${order.road_sign.template.size}`
                            : ""}
                        </td>
                        <td className="p-1.5" colSpan={2}></td>
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

export default ReassignOrdersTab;
