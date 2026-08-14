import React from "react";
import { Badge } from "@/components/ui/badge";

const fmt = (n) => Number(n ?? 0).toLocaleString("ar-SY", { minimumFractionDigits: 2 });

const TrialBalanceTab = ({ accounting }) => {
  const { trialBalance, isFetchingTrialBalance } = accounting;

  if (isFetchingTrialBalance) {
    return <p className="text-sm text-muted-foreground p-4">جارٍ التحميل...</p>;
  }

  if (!trialBalance) {
    return <p className="text-sm text-muted-foreground p-4">تعذر تحميل ميزان المراجعة.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="border border-border rounded-lg bg-card p-4 min-w-[180px]">
          <div className="text-xs text-muted-foreground">إجمالي المدين</div>
          <div className="font-mono font-semibold text-lg">{fmt(trialBalance.total_debit)}</div>
        </div>
        <div className="border border-border rounded-lg bg-card p-4 min-w-[180px]">
          <div className="text-xs text-muted-foreground">إجمالي الدائن</div>
          <div className="font-mono font-semibold text-lg">{fmt(trialBalance.total_credit)}</div>
        </div>
        <Badge variant={trialBalance.is_balanced ? "default" : "destructive"} className="h-8 px-4 text-sm">
          {trialBalance.is_balanced ? "الدفتر متوازن ✓" : "تحذير: الدفتر غير متوازن!"}
        </Badge>
      </div>

      <div className="border border-border rounded-lg bg-card overflow-x-auto">
        <table className="w-full text-sm text-center">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="p-2 text-center">الرمز</th>
              <th className="p-2 text-center">اسم الحساب</th>
              <th className="p-2 text-center">النوع</th>
              <th className="p-2 text-center">الطبيعة</th>
              <th className="p-2 text-center">الرصيد</th>
            </tr>
          </thead>
          <tbody>
            {(trialBalance.accounts ?? []).map((a) => (
              <tr key={a.id} className="border-b border-border/50">
                <td className="p-2 font-mono text-xs text-center">{a.code}</td>
                <td className="p-2 text-center">{a.name}</td>
                <td className="p-2 text-xs text-muted-foreground text-center">{a.type}</td>
                <td className="p-2 text-xs text-muted-foreground text-center">{a.normal_balance === "debit" ? "مدين" : "دائن"}</td>
                <td className={`p-2 font-mono text-center ${Number(a.balance) < 0 ? "text-emerald-600" : ""}`}>
                  {a.currency === "SYP" ? "ل.س " : "$"}
                  {fmt(a.balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TrialBalanceTab;