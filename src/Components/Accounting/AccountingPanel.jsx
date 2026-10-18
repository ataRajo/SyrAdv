import React from "react";
import { useSearchParams } from "react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccounting } from "../../hooks/useAccounting";
import { useAuth } from "../../Context/AuthProvider";
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

// صلاحية كل تبويب (طلب صريح: إظهار تبويبات محددة فقط لموظف معيّن، مثل
// المعاملات والسندات + كشوفات الحساب). الأسماء مطابقة لـ App\Enums\AccountingTabs
// على الباك-إند. super admin يرى كل التبويبات دائمًا.
const tabPermission = (tab) => `financials-tab-${tab}`;

const AccountingPanel = () => {
  const accounting = useAccounting();
  const { hasPermission, isSuperAdmin } = useAuth();

  const visibleTabs = VALID_TABS.filter(
    (tab) => isSuperAdmin() || hasPermission(tabPermission(tab))
  );
  const canSee = (tab) => visibleTabs.includes(tab);

  // يقرأ التبويب المطلوب من ?tab= في الرابط - يسمح بالانتقال المباشر
  // لتبويب معيّن (الموردين/المواد) من الشريط الجانبي أو من نتائج البحث
  // الذكي، بدل الاضطرار لفتح صفحة المحاسبة ثم اختيار التبويب يدويًا.
  const [searchParams, setSearchParams] = useSearchParams();

  const requestedTab = searchParams.get("tab");
  // التبويب المطلوب في الرابط يُحترم فقط إن كان مسموحًا للمستخدم، وإلا يُفتح أول
  // تبويب مسموح له (لا "المعاملات" دائمًا كما كان - قد لا يملكها الموظف).
  const activeTab = canSee(requestedTab) ? requestedTab : visibleTabs[0];

  if (visibleTabs.length === 0) {
    return (
      <div
        className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground"
        dir="rtl"
      >
        لا تملك صلاحية الوصول لأي تبويب في المحاسبة والصندوق. يرجى التواصل مع المسؤول.
      </div>
    );
  }

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
        <TabsList className="flex flex-wrap w-full bg-card rounded-lg border border-border h-auto">
          {canSee("transactions") && (
            <TabsTrigger value="transactions" className="flex-1 text-xs md:text-sm font-medium">
              المعاملات والسندات
            </TabsTrigger>
          )}
          {canSee("accounts") && (
            <TabsTrigger value="accounts" className="flex-1 text-xs md:text-sm font-medium">
              دليل الحسابات
            </TabsTrigger>
          )}
          {canSee("statements") && (
            <TabsTrigger value="statements" className="flex-1 text-xs md:text-sm font-medium">
              كشوفات الحساب
            </TabsTrigger>
          )}
          {canSee("cash-closing") && (
            <TabsTrigger value="cash-closing" className="flex-1 text-xs md:text-sm font-medium">
              تقفيل الصندوق
            </TabsTrigger>
          )}
          {canSee("payroll") && (
            <TabsTrigger value="payroll" className="flex-1 text-xs md:text-sm font-medium">
              الرواتب والأجور
            </TabsTrigger>
          )}
          {canSee("suppliers") && (
            <TabsTrigger value="suppliers" className="flex-1 text-xs md:text-sm font-medium">
              الموردون
            </TabsTrigger>
          )}
          {canSee("purchase-invoices") && (
            <TabsTrigger value="purchase-invoices" className="flex-1 text-xs md:text-sm font-medium relative">
              فواتير الشراء
              {getUnpaidCreditCount(accounting.purchaseInvoices) > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                  {getUnpaidCreditCount(accounting.purchaseInvoices)}
                </span>
              )}
            </TabsTrigger>
          )}
          {canSee("materials") && (
            <TabsTrigger value="materials" className="flex-1 text-xs md:text-sm font-medium">
              المواد
            </TabsTrigger>
          )}
          {canSee("broker-commissions") && (
            <TabsTrigger value="broker-commissions" className="flex-1 text-xs md:text-sm font-medium">
              عمولات الوسطاء
            </TabsTrigger>
          )}
          {canSee("advances") && (
            <TabsTrigger value="advances" className="flex-1 text-xs md:text-sm font-medium">
              السلف
            </TabsTrigger>
          )}
          {canSee("reports") && (
            <TabsTrigger value="reports" className="flex-1 text-xs md:text-sm font-medium">
              التقارير المالية
            </TabsTrigger>
          )}
          {canSee("trial-balance") && (
            <TabsTrigger value="trial-balance" className="flex-1 text-xs md:text-sm font-medium">
              ميزان المراجعة
            </TabsTrigger>
          )}
        </TabsList>

        {canSee("transactions") && (
          <TabsContent value="transactions" className="mt-4">
            <TransactionsTab accounting={accounting} />
          </TabsContent>
        )}

        {canSee("accounts") && (
          <TabsContent value="accounts" className="mt-4">
            <ChartOfAccountsTab accounting={accounting} />
          </TabsContent>
        )}

        {canSee("statements") && (
          <TabsContent value="statements" className="mt-4">
            <StatementsTab accounting={accounting} />
          </TabsContent>
        )}

        {canSee("cash-closing") && (
          <TabsContent value="cash-closing" className="mt-4">
            <CashClosingTab accounting={accounting} />
          </TabsContent>
        )}

        {canSee("payroll") && (
          <TabsContent value="payroll" className="mt-4">
            <PayrollTab accounting={accounting} />
          </TabsContent>
        )}

        {canSee("suppliers") && (
          <TabsContent value="suppliers" className="mt-4">
            <SuppliersTab accounting={accounting} />
          </TabsContent>
        )}

        {canSee("purchase-invoices") && (
          <TabsContent value="purchase-invoices" className="mt-4">
            <PurchaseInvoicesTab accounting={accounting} />
          </TabsContent>
        )}

        {canSee("materials") && (
          <TabsContent value="materials" className="mt-4">
            <MaterialsTab />
          </TabsContent>
        )}

        {canSee("broker-commissions") && (
          <TabsContent value="broker-commissions" className="mt-4">
            <BrokerCommissionsTab accounting={accounting} />
          </TabsContent>
        )}

        {canSee("advances") && (
          <TabsContent value="advances" className="mt-4">
            <AdvancesTab accounting={accounting} />
          </TabsContent>
        )}

        {canSee("reports") && (
          <TabsContent value="reports" className="mt-4">
            <FinancialReportsTab accounting={accounting} />
          </TabsContent>
        )}

        {canSee("trial-balance") && (
          <TabsContent value="trial-balance" className="mt-4">
            <TrialBalanceTab accounting={accounting} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default AccountingPanel;