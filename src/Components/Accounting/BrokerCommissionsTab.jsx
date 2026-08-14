import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icon } from "@iconify/react";

const fmt = (n) => Number(n ?? 0).toLocaleString("ar-SY", { minimumFractionDigits: 2 });

/**
 * عمولات الوسطاء - تُدفع لكل حجز على حدة (قرار العميل، لا دفعة إجمالية
 * دورية كالرواتب) عبر BrokerCommissionService على الباك-إند. تحتسب
 * العمولة تلقائيًا (total_price * discount%) وتُرحَّل كسند صرف فورًا.
 */
const BrokerCommissionsTab = ({ accounting }) => {
  const {
    payBrokerCommission,
    isPayingCommission,
    brokerCommissionHistory,
    brokerCommissionHistoryMeta,
    isFetchingBrokerCommissionHistory,
    loadBrokerCommissionHistory,
    handleOpenVoucher,
  } = accounting;

  const [bookingId, setBookingId] = useState("");
  const [notes, setNotes] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const safeHistory = Array.isArray(brokerCommissionHistory) ? brokerCommissionHistory : [];

  const onSubmit = async (e) => {
    e.preventDefault();
    const ok = await payBrokerCommission(Number(bookingId), notes ? { notes } : {});
    if (ok) {
      setBookingId("");
      setNotes("");
      if (showHistory) loadBrokerCommissionHistory({});
    }
  };

  return (
    <div className="space-y-4">
      <div className="border border-border rounded-lg bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">دفع عمولة وسيط</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setShowHistory((v) => !v);
              if (!showHistory) loadBrokerCommissionHistory({});
            }}
          >
            <Icon icon="mdi:history" className="w-4 h-4 ml-1" />
            {showHistory ? "إخفاء السجل" : "سجل دفع العمولات"}
          </Button>
        </div>
        <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label>رقم الحجز</Label>
            <Input
              type="number"
              className="w-40"
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2 flex-1 min-w-[200px]">
            <Label>ملاحظات (اختياري)</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button type="submit" disabled={isPayingCommission || !bookingId}>
            {isPayingCommission ? "جارٍ الدفع..." : "دفع العمولة"}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2">
          تُحتسب العمولة تلقائيًا من سعر الحجز ونسبة الوسيط، وتُرحَّل كسند صرف فورًا.
        </p>
      </div>

      {showHistory && (
        <div className="border border-border rounded-lg bg-card">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold">سجل دفع عمولات الوسطاء</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="p-2 text-right">التاريخ</th>
                  <th className="p-2 text-right">رقم السند</th>
                  <th className="p-2 text-right">البيان</th>
                  <th className="p-2 text-left">المبلغ</th>
                  <th className="p-2 text-center">طباعة</th>
                </tr>
              </thead>
              <tbody>
                {isFetchingBrokerCommissionHistory && (
                  <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">جارٍ التحميل...</td></tr>
                )}
                {!isFetchingBrokerCommissionHistory && safeHistory.length === 0 && (
                  <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">لا يوجد سجل بعد</td></tr>
                )}
                {safeHistory.map((entry) => (
                  <tr key={entry.id} className="border-b border-border/50">
                    <td className="p-2 text-xs">{entry.entry_date}</td>
                    <td className="p-2 font-mono text-xs">{entry.voucher_number || entry.entry_number}</td>
                    <td className="p-2 max-w-[260px] truncate" title={entry.description}>{entry.description}</td>
                    <td className="p-2 font-mono">{fmt(entry.total_debit)}</td>
                    <td className="p-2 text-center">
                      {entry.voucher_number && (
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleOpenVoucher(entry.id)}>
                          <Icon icon="mdi:printer-outline" className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {brokerCommissionHistoryMeta?.total_pages > 1 && (
            <div className="flex items-center justify-center gap-2 p-3 border-t border-border">
              <Button
                size="sm"
                variant="outline"
                disabled={brokerCommissionHistoryMeta.current_page <= 1}
                onClick={() => loadBrokerCommissionHistory({ page: (brokerCommissionHistoryMeta.current_page || 1) - 1 })}
              >
                السابق
              </Button>
              <span className="text-sm text-muted-foreground">
                صفحة {brokerCommissionHistoryMeta.current_page} من {brokerCommissionHistoryMeta.total_pages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={brokerCommissionHistoryMeta.current_page >= brokerCommissionHistoryMeta.total_pages}
                onClick={() => loadBrokerCommissionHistory({ page: (brokerCommissionHistoryMeta.current_page || 1) + 1 })}
              >
                التالي
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BrokerCommissionsTab;
