import React from "react";
import { Icon } from "@iconify/react";

export const CustomerDetailsDrawer = ({ isOpen, onClose, details }) => {
  if (!isOpen || !details) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-2xl h-full bg-card text-foreground shadow-2xl flex flex-col justify-between p-6 overflow-y-auto border-s border-border">
        
        {/* Header */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <Icon icon="mdi:account-details" className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold">{details.customer_name}</h2>
                <p className="text-xs text-muted-foreground">معرّف الزبون: #{details.customer_id}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
            >
              <Icon icon="mdi:close" className="w-5 h-5" />
            </button>
          </div>

          {/* Bookings Section */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3 text-primary">
              <Icon icon="mdi:calendar-bookmark" className="w-5 h-5" />
              سجل الحجوزات ({details.bookings?.length || 0})
            </h3>
            
            <div className="space-y-3">
              {details.bookings?.map((booking) => (
                <div key={booking.booking_id} className="p-4 rounded-xl border border-border bg-accent/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">حجز #{booking.booking_id}</span>
                    <span className="px-2.5 py-0.5 text-xs rounded-full bg-emerald-500/10 text-emerald-600 font-semibold">
                      نشط
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>📅 من: <span className="font-medium text-foreground">{booking.start_date}</span></div>
                    <div>➡️ إلى: <span className="font-medium text-foreground">{booking.end_date}</span></div>
                    <div>💰 المبلغ الكلي: <span className="font-medium text-foreground">{booking.total_price?.toLocaleString("ar-EG")} $</span></div>
                    <div>⏳ المتبقي: <span className="font-medium text-amber-600">{booking.remaining?.toLocaleString("ar-EG")} $</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payments Section */}
          <div className="mt-8">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3 text-emerald-600">
              <Icon icon="mdi:cash-multiple" className="w-5 h-5" />
              سجل الدفعات ({details.payments?.length || 0})
            </h3>

            <div className="space-y-3">
              {details.payments?.map((payment) => (
                <div key={payment.payment_id} className="p-4 rounded-xl border border-border bg-emerald-500/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">دفعة رقم #{payment.payment_number || payment.payment_id}</span>
                    <span className="text-xs text-muted-foreground">📅 {payment.date}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block">المدفوع</span>
                      <span className="font-bold text-emerald-600 text-sm">{payment.paid?.toLocaleString("ar-EG")} $</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">الإجمالي</span>
                      <span className="font-semibold">{payment.total?.toLocaleString("ar-EG")} $</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">المتبقي بعد الدفعة</span>
                      <span className="font-semibold text-rose-500">{payment.remaining_after_payment?.toLocaleString("ar-EG")} $</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-border mt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-accent text-accent-foreground font-medium text-sm hover:bg-accent/80 transition-colors"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};