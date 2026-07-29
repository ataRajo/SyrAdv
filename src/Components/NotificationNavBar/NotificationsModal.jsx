// components/NotificationsModal.jsx
import React, { useEffect, useState } from "react";
import { Bell, X, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { messaging } from "@/firebase";
import { getToken } from "firebase/messaging";

const NotificationsModal = ({ 
  isOpen, 
  onClose,
  notifications = [],
  unreadCount = 0 
}) => {
  const [expandedId, setExpandedId] = useState(null);

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

          {/* Notifications list */}
          <div className="overflow-y-auto max-h-[60vh]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                لا توجد إشعارات
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {notifications.map((notification) => {
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
              <span>المجموع: {notifications.length}</span>
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