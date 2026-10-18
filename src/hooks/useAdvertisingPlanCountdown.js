// useAdvertisingPlanCountdown.js
//
// عدّاد تنازلي بسيط حتى موعد أرشفة الخطة (created_at + 48 ساعة). يُستخدم في
// AdvertisingPlanStatusBadge وصفحتي القائمة/التفاصيل. الأرشفة الفعلية تتم
// على الباك-إند (راجع API_CONTRACT.md) - هذا العدّاد للعرض فقط ولا يُنفّذ
// أي أرشفة من طرف الواجهة.
import { useEffect, useState } from "react";

const PLAN_LIFETIME_HOURS = 48;

function getArchiveDate(plan) {
  if (plan?.archive_at) return new Date(plan.archive_at);
  if (plan?.created_at) {
    const d = new Date(plan.created_at);
    d.setHours(d.getHours() + PLAN_LIFETIME_HOURS);
    return d;
  }
  return null;
}

export function formatRemaining(ms) {
  if (ms <= 0) return null;
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours >= 1) return `${hours} س ${minutes} د`;
  return `${minutes} د`;
}

export default function useAdvertisingPlanCountdown(plan) {
  const archiveDate = getArchiveDate(plan);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (plan?.is_archived || !archiveDate) return;
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [archiveDate?.getTime(), plan?.is_archived]);

  if (plan?.is_archived || !archiveDate) {
    return { isArchived: Boolean(plan?.is_archived), remainingMs: 0, remainingText: null, archiveDate };
  }

  const remainingMs = archiveDate.getTime() - now;
  return {
    isArchived: remainingMs <= 0,
    remainingMs: Math.max(remainingMs, 0),
    remainingText: formatRemaining(remainingMs),
    archiveDate,
  };
}
