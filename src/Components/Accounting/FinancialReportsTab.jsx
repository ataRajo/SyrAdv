import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icon } from "@iconify/react";

const fmt = (n) => Number(n ?? 0).toLocaleString("ar-SY", { minimumFractionDigits: 2 });

const LineRows = ({ lines, emptyLabel }) => {
  if (!lines || lines.length === 0) {
    return <tr><td colSpan={2} className="p-2 text-center text-muted-foreground text-xs">{emptyLabel}</td></tr>;
  }
  return lines.map((line) => (
    <tr key={line.id} className="border-b border-border/30">
      <td className="p-1.5 pr-4 text-sm">{line.code} - {line.name}</td>
      <td className="p-1.5 text-left font-mono text-sm">{fmt(line.amount)}</td>
    </tr>
  ));
};

const IncomeStatementSection = ({ accounting }) => {
  const { incomeStatement, isFetchingIncomeStatement, loadIncomeStatement } = accounting;
  const [range, setRange] = useState({
    from_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    to_date: new Date().toISOString().slice(0, 10),
  });

  return (
    <div className="border border-border rounded-lg bg-card">
      <div className="p-4 border-b border-border space-y-3">
        <h3 className="font-semibold">قائمة الدخل (Income Statement)</h3>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label className="text-xs">من تاريخ</Label>
            <Input type="date" className="h-8 w-36" value={range.from_date} onChange={(e) => setRange((r) => ({ ...r, from_date: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">إلى تاريخ</Label>
            <Input type="date" className="h-8 w-36" value={range.to_date} onChange={(e) => setRange((r) => ({ ...r, to_date: e.target.value }))} />
          </div>
          <Button size="sm" onClick={() => loadIncomeStatement(range.from_date, range.to_date)}>
            <Icon icon="mdi:file-chart-outline" className="w-4 h-4 ml-1" />
            عرض التقرير
          </Button>
        </div>
      </div>
      <div className="p-4">
        {isFetchingIncomeStatement && <p className="text-sm text-muted-foreground">جارٍ الحساب...</p>}
        {!isFetchingIncomeStatement && !incomeStatement && (
          <p className="text-sm text-muted-foreground">اختر الفترة واضغط "عرض التقرير".</p>
        )}
        {incomeStatement && (
          <table className="w-full">
            <tbody>
              <tr><td colSpan={2} className="pt-1 pb-1 font-semibold text-sm">الإيرادات</td></tr>
              <LineRows lines={incomeStatement.revenue} emptyLabel="لا توجد إيرادات ضمن هذه الفترة" />
              <tr className="border-t border-border">
                <td className="p-1.5 pr-4 text-sm font-medium">إجمالي الإيرادات</td>
                <td className="p-1.5 text-left font-mono text-sm font-medium">{fmt(incomeStatement.gross_revenue)}</td>
              </tr>

              {incomeStatement.discounts?.length > 0 && (
                <>
                  <tr><td colSpan={2} className="pt-3 pb-1 font-semibold text-sm">يُخصم: الخصومات الممنوحة</td></tr>
                  <LineRows lines={incomeStatement.discounts} emptyLabel="" />
                  <tr className="border-t border-border">
                    <td className="p-1.5 pr-4 text-sm font-medium">إجمالي الخصومات</td>
                    <td className="p-1.5 text-left font-mono text-sm font-medium text-red-700">({fmt(incomeStatement.total_discounts)})</td>
                  </tr>
                </>
              )}

              <tr className="border-t-2 border-border bg-muted/30">
                <td className="p-1.5 pr-4 text-sm font-semibold">صافي الإيرادات</td>
                <td className="p-1.5 text-left font-mono text-sm font-semibold">{fmt(incomeStatement.net_revenue)}</td>
              </tr>

              <tr><td colSpan={2} className="pt-4 pb-1 font-semibold text-sm">المصاريف</td></tr>
              <LineRows lines={incomeStatement.expenses} emptyLabel="لا توجد مصاريف ضمن هذه الفترة" />
              <tr className="border-t border-border">
                <td className="p-1.5 pr-4 text-sm font-medium">إجمالي المصاريف</td>
                <td className="p-1.5 text-left font-mono text-sm font-medium">({fmt(incomeStatement.total_expenses)})</td>
              </tr>

              <tr className="border-t-2 border-border bg-blue-50">
                <td className="p-2 pr-4 font-bold">صافي الربح / الخسارة</td>
                <td className={`p-2 text-left font-mono font-bold ${incomeStatement.net_income < 0 ? "text-red-700" : ""}`}>
                  {fmt(incomeStatement.net_income)}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const BalanceSheetSection = ({ accounting }) => {
  const { balanceSheet, isFetchingBalanceSheet, loadBalanceSheet } = accounting;
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().slice(0, 10));

  return (
    <div className="border border-border rounded-lg bg-card">
      <div className="p-4 border-b border-border space-y-3">
        <h3 className="font-semibold">الميزانية العمومية (Balance Sheet)</h3>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label className="text-xs">كما في تاريخ</Label>
            <Input type="date" className="h-8 w-36" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} />
          </div>
          <Button size="sm" onClick={() => loadBalanceSheet(asOfDate)}>
            <Icon icon="mdi:scale-balance" className="w-4 h-4 ml-1" />
            عرض التقرير
          </Button>
        </div>
      </div>
      <div className="p-4">
        {isFetchingBalanceSheet && <p className="text-sm text-muted-foreground">جارٍ الحساب...</p>}
        {!isFetchingBalanceSheet && !balanceSheet && (
          <p className="text-sm text-muted-foreground">اختر التاريخ واضغط "عرض التقرير".</p>
        )}
        {balanceSheet && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <table className="w-full">
                <tbody>
                  <tr><td colSpan={2} className="pb-1 font-semibold text-sm">الأصول</td></tr>
                  <LineRows lines={balanceSheet.assets} emptyLabel="لا توجد أصول" />
                  <tr className="border-t-2 border-border bg-muted/30">
                    <td className="p-1.5 pr-4 text-sm font-semibold">إجمالي الأصول</td>
                    <td className="p-1.5 text-left font-mono text-sm font-semibold">{fmt(balanceSheet.total_assets)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <table className="w-full">
                <tbody>
                  <tr><td colSpan={2} className="pb-1 font-semibold text-sm">الخصوم</td></tr>
                  <LineRows lines={balanceSheet.liabilities} emptyLabel="لا توجد خصوم" />
                  <tr className="border-t border-border">
                    <td className="p-1.5 pr-4 text-sm font-medium">إجمالي الخصوم</td>
                    <td className="p-1.5 text-left font-mono text-sm font-medium">{fmt(balanceSheet.total_liabilities)}</td>
                  </tr>

                  <tr><td colSpan={2} className="pt-4 pb-1 font-semibold text-sm">حقوق الملكية</td></tr>
                  <LineRows lines={balanceSheet.equity} emptyLabel="" />
                  <tr className="border-t-2 border-border bg-muted/30">
                    <td className="p-1.5 pr-4 text-sm font-semibold">إجمالي الخصوم وحقوق الملكية</td>
                    <td className="p-1.5 text-left font-mono text-sm font-semibold">{fmt(balanceSheet.total_liabilities_and_equity)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="md:col-span-2 pt-2">
              <Badge variant={balanceSheet.is_balanced ? "default" : "destructive"}>
                {balanceSheet.is_balanced ? "الميزانية متوازنة ✓" : "تحذير: الميزانية غير متوازنة!"}
              </Badge>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const FinancialReportsTab = ({ accounting }) => (
  <div className="space-y-6">
    <IncomeStatementSection accounting={accounting} />
    <BalanceSheetSection accounting={accounting} />
  </div>
);

export default FinancialReportsTab;
