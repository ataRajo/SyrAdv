// components/NotificationsModal.jsx
import React, { useEffect } from "react";
import { Bell, X } from "lucide-react"; // ✅ fixed import
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { messaging } from "@/firebase"; // ✅ import messaging
import { getToken } from "firebase/messaging";

const NotificationsModal = ({ 
  isOpen, 
  onClose,
  notifications = [],
  unreadCount = 0 
}) => {
useEffect(() => {
  if (isOpen) {
    getToken(messaging, {
      vapidKey: "BAEh5pDcl7muc7kcU-wQnfZQTM9EoYNTD9BLnlq5fYVKBMkxgpiy6pvH7TbHafvprRLOkRSRzP_NSKtkEtxLyWY"
    })
    .then((token) => {
      if (token) {
        console.log("FCM Token:", token);
        
        // 👉 TEMPORARY: Just log it, don't send to backend
        localStorage.setItem('fcm_token', token);
        console.log("Token saved locally for testing");
        
        /*
        fetch("/api/save-fcm-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fcm_token: token })
        })
        .then(res => res.json())
        .then(data => console.log("Token saved:", data))
        .catch(err => console.error("Save error:", err));
        */
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
              type="button" // ✅ prevents page refresh
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
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50",
                      !notification.read && "bg-blue-50/50 dark:bg-blue-900/10"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "min-w-2 h-2 mt-2 rounded-full",
                        notification.read 
                          ? "bg-gray-300 dark:bg-gray-700" 
                          : "bg-blue-500"
                      )} />
                      <div className="flex-1">
                        <p className="text-sm text-gray-800 dark:text-gray-200">
                          {notification.text}
                        </p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {notification.time}
                          </span>
                          {!notification.read && (
                            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                              جديد
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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
