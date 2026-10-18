// components/NotificationsModal.jsx
import React, { useEffect, useState } from "react";
import {
  Bell,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MessageCircle,
  Loader2,
  ClipboardList,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { messaging } from "@/firebase";
import { getToken } from "firebase/messaging";
import toast from "react-hot-toast";
import { getPublicPlanUrl } from "../../Api/baseUrl";
import {
  useGetNotificationsQuery,
  useSendOverdueBalanceWhatsappMutation,
} from "../../RtkQuery/Slice/Booking/BookingApi";

// طلب صريح: فلترة الإشعارات حسب نوع المحتوى (تنبيهات عامة/طلبات/مالية/خطط
// إعلانية) - راجع App\Enums\NotificationType على الباك-إند لنفس القيم
// بالضبط. "خطط إعلانية" (advertising_plan) نوع مستقل بحد ذاته (طلب صريح)
// يُنشأ فقط عندما يضغط الزبون "أريد حجز هذه الخطة" من الرابط العام - راجع
// AdvertisingPlanService::notifyStaffOfCustomerRequest().
const NOTIFICATION_TYPE_TABS = [
  { value: null, label: "الكل" },
  { value: "general", label: "عام" },
  { value: "order", label: "الطلبات" },
  { value: "financial", label: "مالية" },
  { value: "advertising_plan", label: "خطط إعلانية" },
];

const NotificationsModal = ({
  isOpen,
  onClose,
  notifications = [],
  unreadCount = 0
}) => {
  const [expandedId, setExpandedId] = useState(null);
  const [typeFilter, setTypeFilter] = useState(null);
  const [sendWhatsapp, { isLoading: isSendingWhatsapp }] = useSendOverdueBalanceWhatsappMutation();
  const [sendingBookingId, setSendingBookingId] = useState(null);
  // نسخ الرابط العام للخطة (share_token) مباشرة من الإشعار - راجع
  // AdvertisingPlanConflictBadge لنفس أسلوب "نسخ للحافظة + أيقونة تأكيد".
  const [copiedPlanId, setCopiedPlanId] = useState(null);

  // جلب مستقل بحسب نوع الفلتر المختار (لا يُشغَّل إلا والنافذة مفتوحة) -
  // فلترة الأدوار (من يرى إشعارات الطلبات أصلًا) يطبّقها السيرفر دومًا بصرف
  // النظر عن هذا الاختيار. عند "الكل" نستخدم قائمة notifications الممرَّرة
  // من الأعلى مباشرةً (تفادي استعلام مكرر لنفس البيانات غير المفلترة).
  const { data: filteredData } = useGetNotificationsQuery(
    { type: typeFilter },
    { skip: !isOpen || !typeFilter }
  );

  const displayedNotifications = typeFilter
    ? (filteredData?.data || [])
    : notifications;

  useEffect(() => {
    if (isOpen) {
      getToken(messaging, {
        vapidKey: "BAEh5pDcl7muc7kcU-wQnfZQTM9EoYNTD9BLnlq5fYVKBMkxgpiy6pvH7TbHafvprRLOkRSRzP_NSKtkEtxLyWY"
      })
      .then((token) => {
        if (token) {
          console.log("FCM Token:", token);
          localStorage.setItem('fcm_token', token);
        } else {
          console.log("No registration token available.");
        }
      })
      .catch((err) => {
        console.error("Error retrieving token:", err);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "الآن";
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    return `منذ ${diffDays} يوم`;
  };

  const handleNotificationClick = (notification) => {
    setExpandedId(expandedId === notification.id ? null : notification.id);
  };

  const handleNavigateToBooking = (bookingId) => {
    // Navigate to booking details page
    window.location.href = `/dashboard/bookings/${bookingId}`;
    onClose();
  };

  // إشعار "خطط إعلانية" (طلب صريح، نوع مستقل) - الذهاب لصفحة تفاصيل الخطة
  // بنفس أسلوب handleNavigateToBooking أعلاه.
  const handleNavigateToAdvertisingPlan = (planId) => {
    window.location.href = `/dashboard/advertising-plans/${planId}`;
    onClose();
  };

  const handleCopyPublicPlanLink = async (shareToken, notificationId) => {
    const url = getPublicPlanUrl(shareToken);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedPlanId(notificationId);
      toast.success("تم نسخ الرابط العام");
      setTimeout(() => setCopiedPlanId(null), 2000);
    } catch (err) {
      toast.error("تعذّر نسخ الرابط");
    }
  };

  // إرسال تلقائي فوري عبر واتساب (WAHA) - يستبدل فتح رابط wa.me اليدوي
  // السابق. نفس نص الرسالة (whatsapp_message من الباك-إند)، لكن يُرسَل
  // فعليًا بدل أن يُفتَح للموظف ليضغط "إرسال" يدويًا في واتساب.
  const handleSendOverdueBalanceWhatsapp = async (bookingId) => {
    setSendingBookingId(bookingId);
    try {
      const result = await sendWhatsapp(bookingId).unwrap();
      toast.success(result?.message || "تم إرسال رسالة واتساب للعميل بنجاح");
    } catch (err) {
      toast.error(err?.message || "تعذّر إرسال رسالة واتساب");
    } finally {
      setSendingBookingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100]">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div 
          className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-md max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                الإشعارات
              </h3>
              {unreadCount > 0 && (
                <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs px-2 py-0.5 rounded-full">
                  {unreadCount} جديد
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content-type filter tabs (طلب صريح: تصفية الإشعارات حسب نوع المحتوى) */}
          <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
            {NOTIFICATION_TYPE_TABS.map((tab) => (
              <button
                key={tab.value ?? "all"}
                type="button"
                onClick={() => setTypeFilter(tab.value)}
                className={cn(
                  "shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors",
                  typeFilter === tab.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notifications list */}
          <div className="overflow-y-auto max-h-[60vh]">
            {displayedNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                لا توجد إشعارات
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {displayedNotifications.map((notification) => {
                  const isExpanded = expandedId === notification.id;
                  const hasData = notification.data && Object.keys(notification.data).length > 0;

                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "transition-colors",
                        notification.is_read === 0 && "bg-blue-50/50 dark:bg-blue-900/10 border-r-2 border-r-blue-500"
                      )}
                    >
                      {/* Clickable header */}
                      <div
                        onClick={() => handleNotificationClick(notification)}
                        className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "min-w-2 h-2 mt-2 rounded-full",
                            notification.is_read === 1
                              ? "bg-gray-300 dark:bg-gray-700" 
                              : "bg-blue-500"
                          )} />
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1 flex-1">
                                {notification.title}
                              </p>
                              {hasData && (
                                isExpanded ? (
                                  <ChevronUp className="h-4 w-4 text-gray-400 mt-1" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-gray-400 mt-1" />
                                )
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                              {notification.body}
                            </p>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                {formatTime(notification.created_at)}
                              </span>
                              {notification.is_read === 0 && (
                                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                                  جديد
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expanded data section */}
                      {isExpanded && hasData && (
                        <div className="px-4 pb-4 pt-0">
                          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                تفاصيل الحجز
                              </span>
                              {notification.data?.booking_id && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleNavigateToBooking(notification.data.booking_id);
                                  }}
                                  className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  الذهاب للحجز
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {notification.data?.booking_id && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500 dark:text-gray-400">رقم الحجز:</span>
                                  <span className="font-medium text-gray-900 dark:text-gray-100">#{notification.data.booking_id}</span>
                                </div>
                              )}
                              {notification.data?.total_price !== undefined && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500 dark:text-gray-400">السعر:</span>
                                  <span className="font-medium text-green-600 dark:text-green-400">
                                    {notification.data.total_price.toLocaleString()} 
                                  </span>
                                </div>
                              )}
                              {notification.data?.discount_value !== undefined && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500 dark:text-gray-400">الخصم:</span>
                                  <span className="font-medium text-red-600 dark:text-red-400">
                                    {notification.data.discount_value}

                                    {notification.data.discount_type === 2 ? '%' : '$'}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* تنبيه "رصيد متأخر قبل منتصف مدة العقد" (طلب
                                العميل) - كل عقد مع زر واتساب يُرسِل الرسالة
                                تلقائيًا عبر الباك-إند (WAHA)، راجع
                                BookingOverdueBalanceAlertService::sendWhatsapp(). */}
                            {notification.data?.type === "booking_overdue_balance" && (
                              <div className="mt-2 space-y-2">
                                {(notification.data.bookings || []).map((b) => (
                                  <div
                                    key={b.booking_id}
                                    className="flex items-center justify-between gap-2 bg-white dark:bg-gray-900 rounded p-2 border border-amber-200 dark:border-amber-900"
                                  >
                                    <div className="text-xs">
                                      <div className="font-medium text-gray-900 dark:text-gray-100">
                                        {b.booking_number ? `عقد #${b.booking_number}` : `عقد #${b.booking_id}`} - {b.customer_name}
                                      </div>
                                      <div className="text-gray-500 dark:text-gray-400">
                                        متبقٍ: {Number(b.remaining).toLocaleString()} - منتصف المدة: {b.midpoint_date}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleNavigateToBooking(b.booking_id); }}
                                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                      >
                                        العقد
                                      </button>
                                      {b.whatsapp_link ? (
                                        <button
                                          type="button"
                                          disabled={isSendingWhatsapp && sendingBookingId === b.booking_id}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSendOverdueBalanceWhatsapp(b.booking_id);
                                          }}
                                          className="flex items-center gap-1 text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded hover:bg-emerald-200 dark:hover:bg-emerald-900 disabled:opacity-50"
                                        >
                                          {isSendingWhatsapp && sendingBookingId === b.booking_id ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                            <MessageCircle className="h-3 w-3" />
                                          )}
                                          واتساب
                                        </button>
                                      ) : (
                                        <span className="text-[11px] text-gray-400">لا يوجد رقم هاتف</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* "خطط إعلانية" (طلب صريح، نوع مستقل) - الزبون
                                ضغط "أريد حجز هذه الخطة" من الرابط العام.
                                نعرض هنا كل بيانات الخطة والزبون وكل لوحة
                                فيها كاملةً بلا اقتطاع (طلب صريح: "خلي واجهة
                                الجرس تتحمل داتا كبيرة بحيث تعرض كلشي") -
                                راجع AdvertisingPlanService::notifyStaffOfCustomerRequest(). */}
                            {notification.type === "advertising_plan" && notification.data && (
                              <div className="mt-2 space-y-2">
                                <div className="grid grid-cols-2 gap-2 text-xs bg-white dark:bg-gray-900 rounded p-2 border border-blue-200 dark:border-blue-900">
                                  {notification.data.customer && (
                                    <>
                                      <div className="col-span-2 flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">الزبون:</span>
                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                                          {notification.data.customer.company_name ||
                                            notification.data.customer.full_name ||
                                            "—"}
                                        </span>
                                      </div>
                                      {notification.data.customer.phone_number && (
                                        <div className="col-span-2 flex justify-between">
                                          <span className="text-gray-500 dark:text-gray-400">الهاتف:</span>
                                          <span className="font-medium text-gray-900 dark:text-gray-100" dir="ltr">
                                            {notification.data.customer.phone_number}
                                          </span>
                                        </div>
                                      )}
                                    </>
                                  )}
                                  {(notification.data.start_date || notification.data.end_date) && (
                                    <div className="col-span-2 flex justify-between">
                                      <span className="text-gray-500 dark:text-gray-400">فترة الحملة:</span>
                                      <span className="font-medium text-gray-900 dark:text-gray-100">
                                        {notification.data.start_date} إلى {notification.data.end_date}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">عدد اللوحات:</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                      {notification.data.road_signs_count ?? (notification.data.road_signs || []).length}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">السعر النهائي:</span>
                                    <span className="font-medium text-green-600 dark:text-green-400">
                                      {Number(notification.data.total_price || 0).toLocaleString("ar-EG")} ل.س
                                    </span>
                                  </div>
                                  {notification.data.customer_note && (
                                    <div className="col-span-2">
                                      <span className="text-gray-500 dark:text-gray-400 block mb-0.5">ملاحظة الزبون:</span>
                                      <span className="text-gray-900 dark:text-gray-100">{notification.data.customer_note}</span>
                                    </div>
                                  )}
                                </div>

                                {/* كل اللوحات كاملةً - منطقة قابلة للتمرير كي
                                    لا تُكسِّر ارتفاع النافذة عند خطة كبيرة
                                    (طلب صريح: عرض كل الداتا). */}
                                {(notification.data.road_signs || []).length > 0 && (
                                  <div className="max-h-56 overflow-y-auto rounded border border-blue-200 dark:border-blue-900">
                                    <table className="w-full text-[11px]">
                                      <thead className="bg-blue-50 dark:bg-blue-950/40 sticky top-0">
                                        <tr>
                                          <th className="text-right px-2 py-1">اللوحة</th>
                                          <th className="text-right px-2 py-1">المكان</th>
                                          <th className="text-right px-2 py-1">النموذج</th>
                                          <th className="text-right px-2 py-1">السعر</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {notification.data.road_signs.map((rs) => (
                                          <tr key={rs.id} className="border-t border-blue-100 dark:border-blue-900/60">
                                            <td className="px-2 py-1 font-mono">{rs.roadsign_code || `#${rs.id}`}</td>
                                            <td className="px-2 py-1">
                                              {rs.city ? `${rs.city} - ` : ""}
                                              {rs.place || "—"}
                                            </td>
                                            <td className="px-2 py-1">{rs.template_model || "—"}</td>
                                            <td className="px-2 py-1">
                                              {Number(rs.price || 0).toLocaleString("ar-EG")}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleNavigateToAdvertisingPlan(notification.data.advertising_plan_id);
                                    }}
                                    className="flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-900"
                                  >
                                    <ClipboardList className="h-3 w-3" />
                                    الذهاب للخطة
                                  </button>
                                  {notification.data.share_token && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopyPublicPlanLink(notification.data.share_token, notification.id);
                                      }}
                                      className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                                    >
                                      {copiedPlanId === notification.id ? (
                                        <Check className="h-3 w-3 text-green-600" />
                                      ) : (
                                        <Copy className="h-3 w-3" />
                                      )}
                                      نسخ رابط الزبون
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex justify-between">
              <span>المجموع: {displayedNotifications.length}</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span>جديد</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                  <span>مقروء</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsModal;