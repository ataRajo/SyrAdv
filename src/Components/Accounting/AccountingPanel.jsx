import React from "react";
import { useSearchParams } from "react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccounting } from "../../hooks/useAccounting";
import ChartOfAccountsTab from "./ChartOfAccountsTab";
import TransactionsTab from "./TransactionsTab";
import StatementsTab from "./StatementsTab";
import TrialBalanceTab from "./TrialBalanceTab";
import CashClosingTab from "./CashClosingTab";
import PayrollTab from "./PayrollTab";
import FinancialReportsTab from "./FinancialReportsTab";
import SuppliersTab from "./SuppliersTab";
import PurchaseInvoicesTab from "./PurchaseInvoicesTab";
import MaterialsTab from "./MaterialsTab";
import BrokerCommissionsTab from "./BrokerCommissionsTab";
import AdvancesTab from "./AdvancesTab";

// Helper function to count unpaid credit invoices
const getUnpaidCreditCount = (purchaseInvoices) => {
  if (!purchaseInvoices) return 0;
  return purchaseInvoices.filter(
    invoice => invoice.payment_type === 'credit' && !invoice.is_fully_paid
  ).length;
};

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
const VALID_TABS = [
  "transactions",
  "accounts",
  "statements",
  "cash-closing",
  "payroll",
  "suppliers",
  "purchase-invoices",
  "materials",
  "broker-commissions",
  "advances",
  "reports",
  "trial-balance",
];

const AccountingPanel = () => {
  const accounting = useAccounting();

  // يقرأ التبويب المطلوب من ?tab= في الرابط - يسمح بالانتقال المباشر
  // لتبويب معيّن (الموردين/المواد) من الشريط الجانبي أو من نتائج البحث
  // الذكي، بدل الاضطرار لفتح صفحة المحاسبة ثم اختيار التبويب يدويًا.
  const [searchParams, setSearchParams] = useSearchParams();

  const requestedTab = searchParams.get("tab");
  const activeTab = VALID_TABS.includes(requestedTab) ? requestedTab : "transactions";

  const handleTabChange = (value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", value);
      return next;
    }, { replace: true });
  };

  return (
    <div className="space-y-4" dir="rtl">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-12 bg-card rounded-lg border border-border h-auto">
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
          <TabsTrigger value="suppliers" className="text-xs md:text-sm font-medium">
            الموردون
          </TabsTrigger>
          <TabsTrigger value="purchase-invoices" className="text-xs md:text-sm font-medium relative">
            فواتير الشراء
            {getUnpaidCreditCount(accounting.purchaseInvoices) > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                {getUnpaidCreditCount(accounting.purchaseInvoices)}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="materials" className="text-xs md:text-sm font-medium">
            المواد
          </TabsTrigger>
          <TabsTrigger value="broker-commissions" className="text-xs md:text-sm font-medium">
            عمولات الوسطاء
          </TabsTrigger>
          <TabsTrigger value="advances" className="text-xs md:text-sm font-medium">
            السلف
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

        <TabsContent value="suppliers" className="mt-4">
          <SuppliersTab accounting={accounting} />
        </TabsContent>

        <TabsContent value="purchase-invoices" className="mt-4">
          <PurchaseInvoicesTab accounting={accounting} />
        </TabsContent>

        <TabsContent value="materials" className="mt-4">
          <MaterialsTab />
        </TabsContent>

        <TabsContent value="broker-commissions" className="mt-4">
          <BrokerCommissionsTab accounting={accounting} />
        </TabsContent>

        <TabsContent value="advances" className="mt-4">
          <AdvancesTab accounting={accounting} />
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