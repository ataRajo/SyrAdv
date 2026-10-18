import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router";
import CustomerSearchSelect from "../Common/CustomerSearchSelect";

const fmt = (n) => Number(n ?? 0).toLocaleString("ar-SY", { minimumFractionDigits: 2 });

const StatementLines = ({ statement, isLoading, onPrintVoucher, emptyLabel }) => {
  const navigate = useNavigate();
  if (isLoading) return <p className="text-sm text-muted-foreground p-4">جارٍ التحميل...</p>;
  if (!statement) return <p className="text-sm text-muted-foreground p-4">{emptyLabel}</p>;

  const lines = statement.lines?.data ?? statement.lines ?? [];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
        <div className="bg-muted/40 rounded p-2">
          <div className="text-xs text-muted-foreground">الرصيد الافتتاحي</div>
          <div className="font-mono font-semibold">{fmt(statement.opening_balance)}</div>
        </div>
        <div className="bg-muted/40 rounded p-2">
          <div className="text-xs text-muted-foreground">الرصيد الختامي</div>
          <div className="font-mono font-semibold">{fmt(statement.closing_balance)}</div>
        </div>
        <div className="bg-muted/40 rounded p-2">
          <div className="text-xs text-muted-foreground">إجمالي مدين</div>
          <div className="font-mono font-semibold">{fmt(statement.total_debit)}</div>
        </div>
        <div className="bg-muted/40 rounded p-2">
          <div className="text-xs text-muted-foreground">إجمالي دائن</div>
          <div className="font-mono font-semibold">{fmt(statement.total_credit)}</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-center">
          <thead>
            <tr className="text-muted-foreground border-b border-border">
              <th className="text-center p-1">التاريخ</th>
              <th className="text-center p-1">رقم السند</th>
              <th className="text-center p-1">البيان</th>
              <th className="text-center p-1">الحجز</th>
              <th className="text-center p-1">مدين</th>
              <th className="text-center p-1">دائن</th>
              <th className="text-center p-1">الرصيد</th>
              <th className="text-center p-1">طباعة</th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 && (
              <tr><td colSpan={8} className="p-3 text-center text-muted-foreground">لا توجد حركات ضمن هذه الفترة</td></tr>
            )}
            {lines.map((line) => (
              <tr key={line.id} className="border-b border-border/50">
                <td className="p-1 text-center">{line.entry_date}</td>
                <td className="p-1 font-mono text-center">{line.entry_number}</td>
                <td className="p-1 max-w-[200px] truncate text-center" title={line.description}>{line.description}</td>
                <td className="p-1 text-center">
                  {line.booking_id ? (
                    <Button
                      size="sm"
                      variant="link"
                      className="h-6 px-1 font-mono text-xs"
                      title="فتح/تحويل هذا الحجز إلى عقد"
                      onClick={() => navigate(`/dashboard/booking/${line.booking_id}`)}
                    >
                      #{line.booking_id}
                      <Icon icon="mdi:file-sign" className="w-3.5 h-3.5 mr-1" />
                    </Button>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="p-1 font-mono text-center">{line.debit ? fmt(line.debit) : "-"}</td>
                <td className="p-1 font-mono text-center">{line.credit ? fmt(line.credit) : "-"}</td>
                <td className="p-1 font-mono text-center">{fmt(line.balance_after)}</td>
                <td className="p-1 text-center">
                  {(line.type === "incoming" || line.type === "outgoing") && line.journal_entry_id && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      title="طباعة السند"
                      onClick={() => onPrintVoucher(line.journal_entry_id)}
                    >
                      <Icon icon="mdi:printer-outline" className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StatementsTab = ({ accounting }) => {
  const {
    statementCustomerId,
    setStatementCustomerId,
    customerStatementFilters,
    setCustomerStatementFilters,
    customerStatement,
    isFetchingCustomerStatement,
    printCustomerStatementDocument,
    downloadCustomerStatementDocument,
    sendCustomerStatementDocument,
    isSendingStatement,
    cashAccounts,
    companyAccountId,
    setCompanyAccountId,
    companyStatementFilters,
    setCompanyStatementFilters,
    companyStatement,
    isFetchingCompanyStatement,
    handleOpenVoucher,
  } = accounting;

  const [sendEmail, setSendEmail] = useState("");

  return (
    <div className="space-y-6">
      {/* Customer statement */}
      <div className="border border-border rounded-lg bg-card">
        <div className="p-4 border-b border-border space-y-3">
          <h3 className="font-semibold">كشف حساب عميل</h3>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-2 min-w-[260px]">
              <Label>العميل</Label>
              <CustomerSearchSelect
                value={statementCustomerId ? String(statementCustomerId) : ""}
                onChange={(id) => setStatementCustomerId(id ? Number(id) : null)}
                placeholder="ابحث واختر العميل"
                showRemaining
              />
            </div>
            <div className="space-y-2">
              <Label>من تاريخ</Label>
              <Input
                type="date"
                value={customerStatementFilters.from_date}
                onChange={(e) => setCustomerStatementFilters((f) => ({ ...f, from_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>إلى تاريخ</Label>
              <Input
                type="date"
                value={customerStatementFilters.to_date}
                onChange={(e) => setCustomerStatementFilters((f) => ({ ...f, to_date: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {statementCustomerId && (
          <div className="flex flex-wrap items-center gap-2 p-4 border-b border-border bg-muted/20">
            <Button
              size="sm"
              variant="outline"
              onClick={() => printCustomerStatementDocument(statementCustomerId, customerStatementFilters)}
            >
              <Icon icon="mdi:printer-outline" className="w-4 h-4 ml-1" />
              معاينة / طباعة كشف الحساب
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => downloadCustomerStatementDocument(statementCustomerId, customerStatementFilters)}
            >
              <Icon icon="mdi:file-pdf-box" className="w-4 h-4 ml-1" />
              تحميل PDF
            </Button>
            <Input
              type="email"
              placeholder="بريد إلكتروني (اختياري - افتراضياً بريد العميل)"
              value={sendEmail}
              onChange={(e) => setSendEmail(e.target.value)}
              className="w-64"
            />
            <Button
              size="sm"
              onClick={() =>
                sendCustomerStatementDocument(statementCustomerId, {
                  email: sendEmail || undefined,
                  ...customerStatementFilters,
                })
              }
              disabled={isSendingStatement}
            >
              <Icon icon="mdi:email-send-outline" className="w-4 h-4 ml-1" />
              {isSendingStatement ? "جارٍ الإرسال..." : "إرسال بالبريد"}
            </Button>
          </div>
        )}

        <div className="p-4 max-h-[500px] overflow-y-auto">
          {!statementCustomerId && (
            <p className="text-sm text-muted-foreground">اختر عميلاً لعرض كشف حسابه.</p>
          )}
          {statementCustomerId && (
            <StatementLines
              statement={customerStatement}
              isLoading={isFetchingCustomerStatement}
              onPrintVoucher={handleOpenVoucher}
              emptyLabel="لا توجد بيانات لهذا العميل بعد."
            />
          )}
        </div>
      </div>

      {/* Company statement */}
      <div className="border border-border rounded-lg bg-card">
        <div className="p-4 border-b border-border space-y-3">
          <h3 className="font-semibold">الكشف العام للشركة (حركة الصندوق/البنك)</h3>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-2 min-w-[200px]">
              <Label>الحساب</Label>
              <Select
                value={companyAccountId ? String(companyAccountId) : ""}
                onValueChange={(v) => setCompanyAccountId(v ? Number(v) : null)}
              >
                <SelectTrigger><SelectValue placeholder="الصندوق الرئيسي (افتراضي)" /></SelectTrigger>
                <SelectContent>
                  {cashAccounts.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>من تاريخ</Label>
              <Input
                type="date"
                value={companyStatementFilters.from_date}
                onChange={(e) => setCompanyStatementFilters((f) => ({ ...f, from_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>إلى تاريخ</Label>
              <Input
                type="date"
                value={companyStatementFilters.to_date}
                onChange={(e) => setCompanyStatementFilters((f) => ({ ...f, to_date: e.target.value }))}
              />
            </div>
          </div>
        </div>
        <div className="p-4 max-h-[500px] overflow-y-auto">
          <StatementLines
            statement={companyStatement}
            isLoading={isFetchingCompanyStatement}
            onPrintVoucher={handleOpenVoucher}
            emptyLabel="لا توجد حركات بعد."
          />
        </div>
      </div>
    </div>
  );
};

export default StatementsTab;