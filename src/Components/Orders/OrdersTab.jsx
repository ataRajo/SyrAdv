import React, { useState, useMemo, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  BellRing,
  CalendarClock,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  Lock,
  ShoppingCart,
  Wrench,
} from "lucide-react";
import { DialogEditOrders } from "../../utils/Dialogs/EditAddDialog/Edit/DialogEditOrders";
import DialogShow from "../../utils/Dialogs/DialogShow/DialogShow";
import { DeleteDialog } from "../../utils/Dialogs/DeleteDialog/DeleteDialog";
import { OrderFieldsShow } from "../../utils/Dialogs/Data/Show/OrderFieldsShow";
import OrderFilters from "./OrderFilters";
import OrdersHeader from "./OrdersHeader";
import ExportService from "./OrderExportService";
import { useGetCustomersQuery } from "../../RtkQuery/Slice/Customers/CustomersApi";
import useMangeOrders from "../../hooks/useMangeOrders";

/* ==================== ثوابت النطاق ==================== */

// كل حسابات "اليوم/غدًا/متأخر" تجري بتوقيت العمليات، لا بتوقيت متصفح
// المستخدم. موظف يفتح اللوحة من جهاز مضبوط على توقيت آخر كان سيرى تصنيفًا
// مختلفًا لليوم نفسه - وهذا يفسد كامل منطق الأولوية أدناه.
const OPERATIONS_TIMEZONE = "Asia/Damascus";

const ORDER_TYPES = [
  {
    value: 1,
    key: "release",
    label: "فك",
    tone: {
      border: "border-red-200 dark:border-red-900",
      bg: "bg-red-50/60 dark:bg-red-950/20",
      text: "text-red-700 dark:text-red-400",
      dot: "bg-red-500",
    },
  },
  {
    value: 2,
    key: "installation",
    label: "تركيب",
    tone: {
      border: "border-emerald-200 dark:border-emerald-900",
      bg: "bg-emerald-50/60 dark:bg-emerald-950/20",
      text: "text-emerald-700 dark:text-emerald-400",
      dot: "bg-emerald-500",
    },
  },
  {
    value: 3,
    key: "swap",
    label: "فك وتركيب",
    tone: {
      border: "border-amber-200 dark:border-amber-900",
      bg: "bg-amber-50/60 dark:bg-amber-950/20",
      text: "text-amber-700 dark:text-amber-400",
      dot: "bg-amber-500",
    },
  },
  {
    value: 4,
    key: "maintenance",
    label: "صيانة",
    tone: {
      border: "border-slate-200 dark:border-slate-800",
      bg: "bg-slate-50/60 dark:bg-slate-900/40",
      text: "text-slate-700 dark:text-slate-300",
      dot: "bg-slate-500",
    },
  },
];

const TYPE_BY_VALUE = Object.fromEntries(ORDER_TYPES.map((t) => [t.value, t]));
const TYPE_BY_KEY = Object.fromEntries(ORDER_TYPES.map((t) => [t.key, t]));

const BOOKING_STATUS_LABELS = {
  1: { label: "قيد الانتظار", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300" },
  2: { label: "مركّب", className: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" },
  3: { label: "ملغى", className: "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  4: { label: "متوقف مؤقتًا", className: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300" },
  5: { label: "مكتمل", className: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" },
};

const MAINTENANCE_STATUS_LABELS = {
  open: { label: "مفتوح", className: "bg-red-100 text-red-800" },
  in_progress: { label: "قيد التنفيذ", className: "bg-amber-100 text-amber-800" },
  done: { label: "منجز", className: "bg-green-100 text-green-800" },
};

/* ==================== أدوات التاريخ ==================== */

// 'YYYY-MM-DD' هو الشكل الوحيد المتداول هنا. المقارنة تجري على النص/الأيام
// الكاملة لا على كائنات Date، تفاديًا لانزياح المنطقة الزمنية الذي يجعل
// new Date('2026-08-11') يظهر كـ 10 أغسطس في أي متصفح غرب غرينتش.
const toDateKey = (value) => {
  if (!value) return null;
  if (typeof value === "string") {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: OPERATIONS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(parsed);
};

const keyToUTC = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};

const daysBetween = (fromKey, toKey) =>
  Math.round((keyToUTC(toKey) - keyToUTC(fromKey)) / 86400000);

const shiftKey = (key, days) => {
  const date = new Date(keyToUTC(key));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const formatDisplayDate = (key) => {
  if (!key) return "—";
  const [y, m, d] = key.split("-");
  return `${d}/${m}/${y}`;
};

const URGENCY_RANK = { overdue: 0, today: 1, tomorrow: 2, upcoming: 3, unknown: 4 };

const urgencyOf = (dateKey, todayKey) => {
  if (!dateKey) return { level: "unknown", daysLate: 0 };
  const diff = daysBetween(todayKey, dateKey);
  if (diff < 0) return { level: "overdue", daysLate: -diff };
  if (diff === 0) return { level: "today", daysLate: 0 };
  if (diff === 1) return { level: "tomorrow", daysLate: 0 };
  return { level: "upcoming", daysLate: 0, daysAhead: diff };
};

const isConfirmed = (order) => Number(order?.status) === 1;

/* ==================== مكوّنات فرعية ==================== */

const UrgencyChip = ({ urgency }) => {
  if (!urgency || urgency.level === "unknown") return null;

  if (urgency.level === "overdue") {
    return (
      <Badge className="bg-red-600 text-white hover:bg-red-600 text-[11px] gap-1">
        <AlertTriangle className="w-3 h-3" />
        متأخر {urgency.daysLate} يوم
      </Badge>
    );
  }
  if (urgency.level === "today") {
    return (
      <Badge className="bg-orange-500 text-white hover:bg-orange-500 text-[11px] gap-1">
        <Clock className="w-3 h-3" />
        اليوم
      </Badge>
    );
  }
  if (urgency.level === "tomorrow") {
    return (
      <Badge className="bg-blue-500 text-white hover:bg-blue-500 text-[11px] gap-1">
        <CalendarClock className="w-3 h-3" />
        غدًا
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[11px] text-gray-500">
      بعد {urgency.daysAhead} يوم
    </Badge>
  );
};

/** صف لوحة واحدة داخل قسم النوع. */
const OrderRow = ({ order, todayKey, canConfirm, onConfirm, onShow }) => {
  const confirmed = isConfirmed(order);
  const dateKey = toDateKey(order.action_date);
  const urgency = urgencyOf(dateKey, todayKey);
  const isMaintenance = Number(order.type) === 4;
  const maintenance = MAINTENANCE_STATUS_LABELS[order.maintenance_status];
  const reminderCount = Number(order.reminder_count) || 0;

  // Location details
  const roadSign = order.road_sign;
  const locationDetails = [
    roadSign?.place,
    roadSign?.directions,
    roadSign?.region?.name,
    roadSign?.city?.name,
  ].filter(Boolean).join(" · ");

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${
        confirmed
          ? "bg-gray-50 dark:bg-gray-800/60 border-gray-100 dark:border-gray-700"
          : urgency.level === "overdue"
          ? "bg-red-50/70 dark:bg-red-950/20 border-red-200 dark:border-red-900"
          : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-8 h-8 shrink-0 rounded-md border border-gray-200 dark:border-gray-600"
          style={{ backgroundColor: roadSign?.template?.color || "#ccc" }}
        />
        <div className="min-w-0">
          <div className="font-medium text-sm truncate">
            {roadSign?.template?.model || "—"}
            {roadSign?.template?.size ? ` - ${roadSign.template.size}` : ""}
          </div>
          <div className="text-xs text-gray-500 truncate" title={locationDetails}>
            {locationDetails || "—"}
          </div>
          <div className="text-xs text-gray-400 font-mono">{roadSign?.roadsign_code}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap justify-end">
        {reminderCount > 0 && !confirmed && (
          <Badge variant="outline" className="text-[11px] text-amber-700 border-amber-300 gap-1">
            <BellRing className="w-3 h-3" />
            ذُكِّر {reminderCount}×
          </Badge>
        )}

        <span className="text-xs text-gray-500 font-mono">{formatDisplayDate(dateKey)}</span>

        {!confirmed && <UrgencyChip urgency={urgency} />}

        {onShow && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onShow(order)}
            className="h-8 w-8 p-0 text-gray-500"
            aria-label="عرض تفاصيل الطلب"
          >
            <Eye className="w-4 h-4" />
          </Button>
        )}

        {isMaintenance ? (
          <Badge className={`text-xs ${maintenance?.className || "bg-gray-100 text-gray-700"}`}>
            <Wrench className="w-3 h-3 ml-1" />
            {maintenance?.label || "صيانة"}
          </Badge>
        ) : confirmed ? (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 ml-1" />
            تم التأكيد
          </Badge>
        ) : canConfirm ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onConfirm([order.id])}
            className="h-8 px-3 border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
          >
            <CheckCircle className="w-4 h-4 ml-1" />
            تأكيد
          </Button>
        ) : (
          <Badge variant="outline" className="text-xs text-gray-500">
            بانتظار التأكيد
          </Badge>
        )}
      </div>
    </div>
  );
};

/** قسم قابل للطي لنوع طلب واحد داخل بطاقة الحجز. */
const OrderTypeSection = ({ typeConfig, orders, todayKey, expanded, onToggle, canConfirm, onConfirm, onShow }) => {
  if (!orders || orders.length === 0) return null;

  const pending = orders.filter((o) => !isConfirmed(o));
  const isMaintenance = typeConfig.value === 4;

  return (
    <div className={`border rounded-lg overflow-hidden ${typeConfig.tone.border}`}>
      <div className={`w-full flex items-center justify-between gap-2 ${typeConfig.tone.bg}`}>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="flex-1 flex items-center gap-3 p-3 text-right hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors"
        >
          <span className={`w-2 h-2 rounded-full ${typeConfig.tone.dot}`} />
          <span className={`font-bold ${typeConfig.tone.text}`}>{typeConfig.label}</span>
          <Badge variant="outline" className="text-xs">
            {orders.length} لوحة
          </Badge>
          {!isMaintenance &&
            (pending.length === 0 ? (
              <Badge className="bg-green-100 text-green-800 text-xs">
                <CheckCircle className="w-3 h-3 ml-1" />
                مؤكد بالكامل
              </Badge>
            ) : (
              <Badge className="bg-yellow-100 text-yellow-800 text-xs">{pending.length} بانتظار التأكيد</Badge>
            ))}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400 mr-auto" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400 mr-auto" />
          )}
        </button>

        {!isMaintenance && pending.length > 0 && canConfirm && (
          <Button
            size="sm"
            onClick={() => onConfirm(pending.map((o) => o.id))}
            className="h-7 px-2 ml-3 bg-green-600 hover:bg-green-700 text-white text-xs shrink-0"
          >
            <CheckCircle className="w-3 h-3 ml-1" />
            تأكيد الكل
          </Button>
        )}
      </div>

      {expanded && (
        <div className="p-3 space-y-2 bg-white dark:bg-gray-900">
          {orders.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              todayKey={todayKey}
              canConfirm={canConfirm}
              onConfirm={onConfirm}
              onShow={onShow}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/** بطاقة حجز واحد: كل طلباته مجمّعة ومقسومة حسب النوع. */
const BookingCard = ({ group, todayKey, canConfirm, onConfirm, onShow }) => {
  const { stats, booking } = group;

  // الأقسام غير المؤكدة مفتوحة تلقائيًا: العمل المتبقي هو سبب فتح الصفحة.
  const [expandedTypes, setExpandedTypes] = useState(() => {
    const initial = new Set();
    ORDER_TYPES.forEach((type) => {
      const orders = group.ordersByType[type.value];
      if (orders?.some((o) => !isConfirmed(o))) initial.add(type.value);
    });
    if (initial.size === 0) {
      const first = ORDER_TYPES.find((t) => group.ordersByType[t.value]?.length);
      if (first) initial.add(first.value);
    }
    return initial;
  });

  const toggleType = (value) =>
    setExpandedTypes((current) => {
      const next = new Set(current);
      next.has(value) ? next.delete(value) : next.add(value);
      return next;
    });

  const bookingStatus = BOOKING_STATUS_LABELS[Number(booking?.status)];
  const progress = stats.total ? Math.round((stats.confirmed / stats.total) * 100) : 0;

  return (
    <Card
      className={`mb-4 shadow-sm hover:shadow-md transition-shadow border ${
        stats.overdue > 0
          ? "border-red-300 dark:border-red-900"
          : "border-gray-200 dark:border-gray-700"
      }`}
    >
      <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap min-w-0">
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-mono shrink-0">
              {group.bookingId ? `حجز #${booking?.number || group.bookingId}` : "بلا حجز"}
            </Badge>
            <span className="font-bold text-lg truncate">
              {group.customer?.company_name || group.customer?.full_name || "عميل غير معروف"}
            </span>
            {group.customerNew && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400">
                ← {group.customerNew.company_name || group.customerNew.full_name}
              </span>
            )}
            {bookingStatus && (
              <Badge className={`text-xs ${bookingStatus.className}`}>{bookingStatus.label}</Badge>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <UrgencyChip urgency={stats.urgency} />
            <span className="text-sm text-gray-500 whitespace-nowrap">
              {stats.confirmed}/{stats.total} مؤكد
            </span>
            {stats.pending > 0 && canConfirm && (
              <Button
                size="sm"
                onClick={() => onConfirm(stats.pendingIds)}
                className="h-8 bg-green-600 hover:bg-green-700 text-white text-xs"
              >
                <CheckCircle className="w-3 h-3 ml-1" />
                تأكيد كل الحجز ({stats.pending})
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap text-xs text-gray-500">
          {booking?.start_date && (
            <span className="font-mono">
              فترة الحجز: {formatDisplayDate(toDateKey(booking.start_date))} ←{" "}
              {formatDisplayDate(toDateKey(booking.end_date))}
            </span>
          )}
          <span>
            أقرب تنفيذ: <span className="font-mono">{formatDisplayDate(stats.earliestKey)}</span>
          </span>
          {stats.hidden > 0 && (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <Lock className="w-3 h-3" />
              معروض {stats.total} من {stats.total + stats.hidden} طلبًا لهذا الحجز
            </span>
          )}
        </div>

        <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              progress === 100 ? "bg-green-500" : stats.overdue > 0 ? "bg-red-500" : "bg-blue-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-4">
        {ORDER_TYPES.map((type) => (
          <OrderTypeSection
            key={type.value}
            typeConfig={type}
            orders={group.ordersByType[type.value]}
            todayKey={todayKey}
            expanded={expandedTypes.has(type.value)}
            onToggle={() => toggleType(type.value)}
            canConfirm={canConfirm}
            onConfirm={onConfirm}
            onShow={onShow}
          />
        ))}
      </CardContent>
    </Card>
  );
};

/** شريط الأرقام أعلى القائمة - يقرأ منه المدير حالة اليوم في سطر واحد. */
const SummaryStrip = ({ summary }) => {
  const cells = [
    { label: "متأخر", value: summary.overdue, className: "text-red-600 dark:text-red-400" },
    { label: "اليوم", value: summary.today, className: "text-orange-600 dark:text-orange-400" },
    { label: "غدًا", value: summary.tomorrow, className: "text-blue-600 dark:text-blue-400" },
    { label: "بانتظار التأكيد", value: summary.pending, className: "text-amber-600 dark:text-amber-400" },
    { label: "حجوزات", value: summary.bookings, className: "text-gray-700 dark:text-gray-300" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {cells.map((cell) => (
        <div
          key={cell.label}
          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3"
        >
          <div className={`text-2xl font-bold ${cell.className}`}>{cell.value}</div>
          <div className="text-xs text-gray-500 mt-0.5">{cell.label}</div>
        </div>
      ))}
    </div>
  );
};

/* ==================== المكوّن الرئيسي ==================== */

const OrdersTab = ({ data, permission, isAdmin }) => {
  const {
    orderType,
    setOrderType,
    cityId,
    setCityId,
    regionId,
    setRegionId,
    isCitiesLoading,
    isFetching,
    iLoadingConfirm,
    openShow,
    setOpenShow,
    openConfirm,
    setOpenConfirm,
    openEdit,
    setOpenEdit,
    isConfirmAction,
    selectedOrder,
    setSelectedOrder,
    handleEdit,
    handleShow,
    handleConfirmOrUnconfirm,
    onConfirmOrder,
    confirmOrder,
    cities,
    regions,
  } = useMangeOrders();

const { data: customersResponse, isLoading: isLoadingCustomers } = useGetCustomersQuery({
  per_page: 1000, // pull everything in one shot if your API supports a high per_page
});
const customersList = customersResponse?.data ?? [];

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [unreadOrdersCount, setUnreadOrdersCount] = useState(0);
  const [viewedOrderIds, setViewedOrderIds] = useState(new Set());

  const exportService = useMemo(() => new ExportService(), []);

  // شكل prop الصلاحيات يختلف بين الشاشات، فتُقرأ دفاعيًا: غياب المعلومة
  // يعني السماح (السلوك السابق)، والمنع يحدث فقط عند تصريح واضح بالمنع.
  const canConfirm = useMemo(() => {
    if (permission == null) return true;
    if (typeof permission === "boolean") return permission;
    if (Array.isArray(permission)) return permission.includes("edit-orders");
    return permission.edit ?? permission["edit-orders"] ?? true;
  }, [permission]);

  const todayKey = useMemo(
    () =>
      new Intl.DateTimeFormat("en-CA", {
        timeZone: OPERATIONS_TIMEZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date()),
    []
  );
  const tomorrowKey = useMemo(() => shiftKey(todayKey, 1), [todayKey]);

  /* ==================== التجميع حسب الحجز ==================== */
  const bookingGroups = useMemo(() => {
    if (!Array.isArray(data)) return [];

    const groups = new Map();

    data.forEach((order) => {
      // الطلبات بلا حجز (صيانة مستقلة مثلًا) تُجمَّع حسب الزبون بدل أن
      // تنهار كلها في مفتاح واحد باسم null.
      const key =
        order.booking_id != null ? `booking-${order.booking_id}` : `customer-${order.customer_id ?? "unknown"}`;

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          bookingId: order.booking_id ?? null,
          booking: order.booking ?? null,
          customer: order.customer ?? null,
          customerNew: order.customer_new ?? null,
          allOrders: [],
          ordersByType: { 1: [], 2: [], 3: [], 4: [] },
        });
      }

      const group = groups.get(key);
      if (!group.booking && order.booking) group.booking = order.booking;
      if (!group.customer && order.customer) group.customer = order.customer;
      if (!group.customerNew && order.customer_new) group.customerNew = order.customer_new;

      group.allOrders.push(order);

      // أي نوع غير معروف مستقبلًا يُلحَق بسلته الخاصة بدل أن يختفي بصمت -
      // النسخة السابقة كانت تُسقِط النوعين 3 و 4 كليًا من الشاشة.
      const typeValue = Number(order.type);
      if (!group.ordersByType[typeValue]) group.ordersByType[typeValue] = [];
      group.ordersByType[typeValue].push(order);
    });

    return Array.from(groups.values()).map((group) => {
      Object.values(group.ordersByType).forEach((list) =>
        list.sort((a, b) => (toDateKey(a.action_date) || "").localeCompare(toDateKey(b.action_date) || ""))
      );

      const confirmable = group.allOrders.filter((o) => Number(o.type) !== 4);
      const pendingOrders = confirmable.filter((o) => !isConfirmed(o));
      const dateKeys = group.allOrders.map((o) => toDateKey(o.action_date)).filter(Boolean).sort();
      const pendingKeys = pendingOrders.map((o) => toDateKey(o.action_date)).filter(Boolean).sort();

      // أولوية البطاقة تُحسب من الطلبات غير المؤكدة وحدها: حجز أُنجز بالكامل
      // لا يجب أن يتصدّر القائمة لمجرد أن تاريخه قديم.
      const drivingKey = pendingKeys[0] || dateKeys[0] || null;

      const buckets = pendingOrders.reduce(
        (acc, order) => {
          const level = urgencyOf(toDateKey(order.action_date), todayKey).level;
          if (level === "overdue") acc.overdue += 1;
          else if (level === "today") acc.today += 1;
          else if (level === "tomorrow") acc.tomorrow += 1;
          return acc;
        },
        { overdue: 0, today: 0, tomorrow: 0 }
      );

      const totalOnServer = Number(group.booking?.orders_count);

      return {
        ...group,
        stats: {
          total: group.allOrders.length,
          confirmed: confirmable.filter(isConfirmed).length,
          pending: pendingOrders.length,
          pendingIds: pendingOrders.map((o) => o.id),
          overdue: buckets.overdue,
          today: buckets.today,
          tomorrow: buckets.tomorrow,
          earliestKey: drivingKey,
          urgency: urgencyOf(drivingKey, todayKey),
          hidden: Number.isFinite(totalOnServer)
            ? Math.max(0, totalOnServer - group.allOrders.length)
            : 0,
        },
      };
    });
  }, [data, todayKey]);

  /* ==================== التصفية والترتيب ==================== */
  const filteredGroups = useMemo(() => {
    let result = bookingGroups;

    if (orderType) {
      const typeValue = TYPE_BY_KEY[orderType]?.value ?? Number(orderType);
      if (Number.isFinite(typeValue)) {
        result = result.filter((g) => g.ordersByType[typeValue]?.length > 0);
      }
    }

    if (selectedCustomerId) {
      const wanted = selectedCustomerId.toString();
      result = result.filter(
        (g) => g.customer?.id?.toString() === wanted || g.customerNew?.id?.toString() === wanted
      );
    }

    if (cityId) {
      const wanted = cityId.toString();
      result = result.filter((g) =>
        g.allOrders.some((o) => o.road_sign?.city?.id?.toString() === wanted)
      );
    }

    if (regionId) {
      const wanted = regionId.toString();
      result = result.filter((g) =>
        g.allOrders.some((o) => o.road_sign?.region?.id?.toString() === wanted)
      );
    }

  if (selectedDate) {
  result = result.filter((g) =>
    g.allOrders.some((o) => toDateKey(o.action_date) === selectedDate)
  );
}

    // الترتيب: المتأخر ثم اليوم ثم غدًا ثم القادم، وداخل كل مستوى بالتاريخ
    // ثم برقم الحجز - ترتيب ثابت لا يتغير بين إعادتي رسم.
    return [...result].sort((a, b) => {
      const rank = URGENCY_RANK[a.stats.urgency.level] - URGENCY_RANK[b.stats.urgency.level];
      if (rank !== 0) return rank;
      const dateDiff = (a.stats.earliestKey || "9999").localeCompare(b.stats.earliestKey || "9999");
      if (dateDiff !== 0) return dateDiff;
      return (a.bookingId ?? 0) - (b.bookingId ?? 0);
    });
  }, [bookingGroups, orderType, selectedCustomerId, cityId, regionId, selectedDate]);

  const summary = useMemo(
    () =>
      filteredGroups.reduce(
        (acc, group) => ({
          overdue: acc.overdue + group.stats.overdue,
          today: acc.today + group.stats.today,
          tomorrow: acc.tomorrow + group.stats.tomorrow,
          pending: acc.pending + group.stats.pending,
          bookings: acc.bookings + 1,
        }),
        { overdue: 0, today: 0, tomorrow: 0, pending: 0, bookings: 0 }
      ),
    [filteredGroups]
  );

  /* ==================== عدّاد غير المقروء ==================== */
  useEffect(() => {
    if (Array.isArray(data)) {
      setUnreadOrdersCount(data.filter((o) => !isConfirmed(o) && !viewedOrderIds.has(o.id)).length);
    }
  }, [data, viewedOrderIds]);

  /* ==================== المعالجات ==================== */

  const handleConfirmOrders = useCallback(
    async (orderIds) => {
      if (!orderIds?.length) return;
      try {
        await confirmOrder({ status: 1, id: orderIds }).unwrap();
        toast.success(
          orderIds.length === 1 ? "تم تأكيد الطلب" : `تم تأكيد ${orderIds.length} طلبًا`
        );
      } catch (err) {
        toast.error(err?.data?.message || "تعذّر تأكيد الطلب. حدّث الصفحة وأعد المحاولة.");
      }
    },
    [confirmOrder]
  );

  const flattenGroups = useCallback(
    (groups) => groups.flatMap((group) => group.allOrders),
    []
  );

  const resolveCustomerName = useCallback(() => {
    if (!selectedCustomerId) return "جميع العملاء";
    return (
      customersList.find((c) => c.id.toString() === selectedCustomerId.toString())?.company_name || "عميل"
    );
  }, [selectedCustomerId, customersList]);

  const exportToWord = useCallback(async () => {
    if (filteredGroups.length === 0) {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }
    await exportService.exportToWord(flattenGroups(filteredGroups), resolveCustomerName(), customersList, toast);
  }, [filteredGroups, flattenGroups, resolveCustomerName, customersList, exportService]);

  const generatePDFViaPrint = useCallback(async () => {
    if (filteredGroups.length === 0) {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }
    await exportService.generatePDFViaPrint(
      flattenGroups(filteredGroups),
      resolveCustomerName(),
      customersList,
      toast
    );
  }, [filteredGroups, flattenGroups, resolveCustomerName, customersList, exportService]);

  const markAllOrdersAsRead = useCallback(() => {
    if (Array.isArray(data)) {
      setViewedOrderIds(new Set(data.map((o) => o.id)));
      setUnreadOrdersCount(0);
      toast.success("تم تعليم جميع الطلبات كمقروءة");
    }
  }, [data]);

  const onShowOrder = useCallback(
    (order) => {
      setViewedOrderIds((current) => new Set(current).add(order.id));
      if (typeof handleShow === "function") {
        handleShow(order);
        return;
      }
      setSelectedOrder(order);
      setOpenShow(true);
    },
    [handleShow, setSelectedOrder, setOpenShow]
  );

  /* ==================== العرض ==================== */

  const activeTypeLabel = orderType ? TYPE_BY_KEY[orderType]?.label ?? "" : "";

  return (
    <div className="p-4 sm:p-6 max-w-full mx-auto space-y-6 bg-background rounded-lg shadow-sm dark:shadow-gray-800">
      <OrdersHeader
        unreadOrdersCount={unreadOrdersCount}
        sortedDataLength={filteredGroups.length}
        exportToWord={exportToWord}
        generatePDFViaPrint={generatePDFViaPrint}
        markAllOrdersAsRead={markAllOrdersAsRead}
      />

      {isAdmin === false && (
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 p-4">
          <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-200">
            <div className="font-semibold">عرض محدود</div>
            <p className="text-blue-800/80 dark:text-blue-300/80 mt-0.5">
              تظهر لك طلبات {formatDisplayDate(todayKey)} و{formatDisplayDate(tomorrowKey)}، إضافة إلى
              الطلبات المتأخرة وطلبات الحجوزات المنتهية. للاطلاع على الطلبات الأبعد راجع مدير النظام.
            </p>
          </div>
        </div>
      )}

      {summary.pending > 0 && (
        <SummaryStrip summary={summary} />
      )}

      <OrderFilters
        selectedCustomerId={selectedCustomerId}
        setSelectedCustomerId={setSelectedCustomerId}
        orderType={orderType}
        setOrderType={setOrderType}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        cityId={cityId}
        setCityId={setCityId}
        regionId={regionId}
        setRegionId={setRegionId}
        customersList={customersList}
        isLoadingCustomers={isLoadingCustomers}
        cities={cities}
        regions={regions}
        isCitiesLoading={isCitiesLoading}
        sortedDataLength={filteredGroups.length}
      />

      {activeTypeLabel && (
        <div className="p-4 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 border border-rose-200 dark:border-gray-700 rounded-lg shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 dark:bg-opacity-30 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  التصفية حسب نوع الطلب:
                </span>
                <span className="px-3 py-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md font-semibold text-sm">
                  {activeTypeLabel}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOrderType("")}
              className="text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 border border-red-200 px-3 py-2 rounded-lg"
            >
              إزالة التصفية
            </Button>
          </div>
        </div>
      )}

      {isFetching ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">جاري التحميل...</p>
        </div>
      ) : filteredGroups.length > 0 ? (
        <div className="space-y-4">
          {filteredGroups.map((group) => (
            <BookingCard
              key={group.key}
              group={group}
              todayKey={todayKey}
              canConfirm={canConfirm}
              onConfirm={handleConfirmOrders}
              onShow={onShowOrder}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <p className="text-gray-600 dark:text-gray-300 font-medium">لا توجد طلبات مطابقة</p>
          <p className="text-sm text-gray-500 mt-1">
            جرّب إزالة التصفية أو اختيار تاريخ آخر لعرض طلبات أخرى.
          </p>
        </div>
      )}

      <DialogEditOrders show={openEdit} handleClose={() => setOpenEdit(false)} initData={selectedOrder} />

      <DialogShow
        show={openShow}
        handleClose={() => {
          setOpenShow(false);
          setSelectedOrder(null);
        }}
        data={selectedOrder}
        fields={OrderFieldsShow}
      />

      <DeleteDialog
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        title={isConfirmAction ? "عملية تأكيد الطلب" : "عملية إلغاء تأكيد الطلب"}
        description={`هل تريد ${isConfirmAction ? "تأكيد" : "إلغاء تأكيد"} هذا الطلب؟`}
        confirmText="نعم"
        onConfirm={handleConfirmOrUnconfirm}
        loading={iLoadingConfirm}
        titleLoading={isConfirmAction ? "جاري التأكيد" : "جاري إلغاء التأكيد"}
      />
    </div>
  );
};

export default React.memo(OrdersTab);
