import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccounting } from "../../hooks/useAccounting";
import ChartOfAccountsTab from "./ChartOfAccountsTab";
import TransactionsTab from "./TransactionsTab";
import StatementsTab from "./StatementsTab";
import TrialBalanceTab from "./TrialBalanceTab";
import CashClosingTab from "./CashClosingTab";
import PayrollTab from "./PayrollTab";
import FinancialReportsTab from "./FinancialReportsTab";

/**
 * The single entry point for the Accounting & Company Cashbox Management
 * module on the frontend - Chart of Accounts, transactions (incoming /
 * outgoing / transfer / reverse + سند قبض / سند صرف export), customer &
 * company statements, and the trial balance. Every one of those maps
 * directly to an endpoint documented in ACCOUNTING_MODULE.md - nothing in
 * that API is left unwired.
 *
 * All state and API calls live in the single useAccounting() hook; each
 * tab below is just a view over it, so the four tabs always stay in sync
 * with each other (e.g. posting an incoming transaction here immediately
 * refreshes the trial balance and any open statement).
 */
const AccountingPanel = () => {
  const accounting = useAccounting();

  return (
    <div className="space-y-4" dir="rtl">
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-7 bg-card rounded-lg border border-border h-auto">
          <TabsTrigger value="transactions" className="text-xs md:text-sm font-medium">
            المعاملات والسندات
          </TabsTrigger>
          <TabsTrigger value="accounts" className="text-xs md:text-sm font-medium">
            دليل الحسابات
          </TabsTrigger>
          <TabsTrigger value="statements" className="text-xs md:text-sm font-medium">
            كشوفات الحساب
          </TabsTrigger>
          <TabsTrigger value="cash-closing" className="text-xs md:text-sm font-medium">
            تقفيل الصندوق
          </TabsTrigger>
          <TabsTrigger value="payroll" className="text-xs md:text-sm font-medium">
            الرواتب والأجور
          </TabsTrigger>
          <TabsTrigger value="reports" className="text-xs md:text-sm font-medium">
            التقارير المالية
          </TabsTrigger>
          <TabsTrigger value="trial-balance" className="text-xs md:text-sm font-medium">
            ميزان المراجعة
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="mt-4">
          <TransactionsTab accounting={accounting} />
        </TabsContent>

        <TabsContent value="accounts" className="mt-4">
          <ChartOfAccountsTab accounting={accounting} />
        </TabsContent>

        <TabsContent value="statements" className="mt-4">
          <StatementsTab accounting={accounting} />
        </TabsContent>

        <TabsContent value="cash-closing" className="mt-4">
          <CashClosingTab accounting={accounting} />
        </TabsContent>

        <TabsContent value="payroll" className="mt-4">
          <PayrollTab accounting={accounting} />
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <FinancialReportsTab accounting={accounting} />
        </TabsContent>

        <TabsContent value="trial-balance" className="mt-4">
          <TrialBalanceTab accounting={accounting} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountingPanel;
