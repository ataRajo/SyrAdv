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

/**
 * تجميع أوامر ورشتي (المدير) حسب (المدينة + المنطقة + تاريخ التنفيذ
 * المخطَّط + الزبون) في سطر واحد - نفس فرز/تجميع AssignOrdersTab (تبويب
 * المسؤول) تمامًا، طلب صريح: "افرز الطلبات لدى العامل ومدير الورشة...
 * هي مفرزة حسب المنطقة والتاريخ مع التجميع، الآن افرز أيضًا خانة الزبون".
 * لا تغيير على الباك-إند: كل مجموعة واجهة عرض/تحديد فوق نفس مصفوفة
 * order_ids المُرسَلة لاحقًا لـ assignToWorker.
 */
const groupOrders = (orders) => {
  const groups = new Map();

  orders.forEach((order) => {
    const cityName = order.road_sign?.city?.name || "بلا مدينة";
    const regionName = order.road_sign?.region?.name || "بلا منطقة";
    const actionDate = order.action_date || "بلا تاريخ";
    const customerName = getOrderCustomerLabel(order);
    const key = `${cityName}|${regionName}|${actionDate}|${customerName}`;

    if (!groups.has(key)) {
      groups.set(key, { key, cityName, regionName, actionDate, customerName, orders: [] });
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
 * إسناد أوامر ورشتي (المدير) لعامل بعينه ضمن فريقي - طلب صريح: "يسند
 * الطلبات التابعة للورشة للعمال التابعين للورشة". يظهر لدور
 * workshop_manager فقط (راجع WorkshopsPanel.jsx). منفصل عمدًا عن
 * AssignOrdersTab (تلك لمسؤول الإدارة، تُسنِد أمرًا **لورشة كاملة**؛ هذا
 * يُسنِد أمرًا **مُسنَدًا لورشتي أصلًا** لعامل واحد بعينه فيها).
 *
 * الأوامر المعروضة: كل أوامر ورشتي غير المُنفَّذة (status=pending) بصرف
 * النظر عن مُسنَدها الحالي - قد يكون بلا عامل (طابور مشترك) أو مُسنَدًا
 * سابقًا لعامل آخر (يمكن إعادة إسناده). الباك-إند يمنع أي أمر لا يخصّ
 * ورشتي، بصرف النظر عمّا أرسله. مُجمَّعة حسب المدينة/المنطقة/التاريخ/الزبون
 * في سطر واحد لكل مجموعة (طلب العميل) - افتح المجموعة لرؤية الأوامر
 * الفردية أو حدِّد أوامر بعينها منها.
 */
const AssignToWorkerTab = ({ workshops }) => {
  const {
    myTeamMembers,
    assignableTeamOrders,
    isFetchingAssignableTeamOrders,
    workerAssignTargetId,
    setWorkerAssignTargetId,
    selectedTeamOrderIds,
    toggleTeamOrderSelection,
    setSelectedTeamOrderIds,
    assignSelectedOrdersToWorker,
    isAssigningToWorker,
  } = workshops;

  const allSelected =
    assignableTeamOrders.length > 0 && selectedTeamOrderIds.length === assignableTeamOrders.length;

  const groups = useMemo(() => groupOrders(assignableTeamOrders ?? []), [assignableTeamOrders]);
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
    const selectedCount = group.orders.filter((o) => selectedTeamOrderIds.includes(o.id)).length;
    if (selectedCount === 0) return "none";
    if (selectedCount === group.orders.length) return "all";
    return "partial";
  };

  const toggleGroupSelection = (group) => {
    const state = groupSelectionState(group);
    const groupIds = group.orders.map((o) => o.id);
    if (state === "all") {
      setSelectedTeamOrderIds((prev) => prev.filter((id) => !groupIds.includes(id)));
    } else {
      setSelectedTeamOrderIds((prev) => Array.from(new Set([...prev, ...groupIds])));
    }
  };

  return (
    <div className="border border-border rounded-lg bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border">
        <h3 className="font-semibold">إسناد أوامر ورشتي لعامل</h3>
        <div className="flex items-center gap-2">
          <Select value={workerAssignTargetId} onValueChange={setWorkerAssignTargetId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="اختر العامل" />
            </SelectTrigger>
            <SelectContent>
              {(myTeamMembers ?? []).map((u) => (
                <SelectItem key={u.id} value={String(u.id)}>
                  {u.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={assignSelectedOrdersToWorker}
            disabled={isAssigningToWorker || !workerAssignTargetId || selectedTeamOrderIds.length === 0}
          >
            <Icon icon="mdi:account-arrow-right-outline" className="w-4 h-4 ml-1" />
            {isAssigningToWorker ? "جارٍ الإسناد..." : `إسناد (${selectedTeamOrderIds.length})`}
          </Button>
        </div>
      </div>

      {(myTeamMembers ?? []).length === 0 && (
        <div className="p-4 text-sm text-muted-foreground">
          لا يوجد عمال في ورشتك بعد. أضِف عمالًا لها من تبويب "الأعضاء" في إدارة الورشات (يتطلب صلاحية إدارية).
        </div>
      )}

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
                    setSelectedTeamOrderIds(e.target.checked ? assignableTeamOrders.map((o) => o.id) : [])
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
            {isFetchingAssignableTeamOrders && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-muted-foreground">
                  جارٍ التحميل...
                </td>
              </tr>
            )}
            {!isFetchingAssignableTeamOrders && groups.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-muted-foreground">
                  لا يوجد أوامر بانتظار التنفيذ في ورشتك حاليًا
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
                            checked={selectedTeamOrderIds.includes(order.id)}
                            onChange={() => toggleTeamOrderSelection(order.id)}
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
                          {" - "}
                          استلمه: {order.receiver?.full_name || "-"}
                          {" - "}
                          مُسنَد حاليًا لـ:{" "}
                          {order.assigned_worker?.full_name || "طابور مشترك"}
                        </td>
                        <td className="p-1.5 text-center text-muted-foreground" colSpan={2}></td>
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

export default AssignToWorkerTab;
