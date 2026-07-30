import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@iconify/react";
import { DeleteDialog } from "../../utils/Dialogs/DeleteDialog/DeleteDialog";

const ACCOUNT_TYPES = [
  { value: "asset", label: "أصول" },
  { value: "liability", label: "خصوم" },
  { value: "equity", label: "حقوق ملكية" },
  { value: "revenue", label: "إيرادات" },
  { value: "expense", label: "مصاريف" },
];

const AccountForm = ({ initialData, accountsFlat, onCancel, onSave, isSaving }) => {
  const isEdit = Boolean(initialData?.id);
  const [form, setForm] = useState({
    parent_id: initialData?.parent_id ?? "",
    code: initialData?.code ?? "",
    name: initialData?.name ?? "",
    type: initialData?.type ?? "expense",
    normal_balance: initialData?.normal_balance ?? "debit",
    is_transactional: initialData?.is_transactional ?? true,
    is_cash_account: initialData?.is_cash_account ?? false,
    is_active: initialData?.is_active ?? true,
    description: initialData?.description ?? "",
  });

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEdit) {
      onSave({
        name: form.name,
        description: form.description,
        is_active: form.is_active,
        is_transactional: form.is_transactional,
        is_cash_account: form.is_cash_account,
      });
    } else {
      onSave({
        parent_id: form.parent_id || null,
        code: form.code,
        name: form.name,
        type: form.type,
        normal_balance: form.normal_balance,
        is_transactional: form.is_transactional,
        is_cash_account: form.is_cash_account,
        description: form.description,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isEdit && (
        <>
          <div className="space-y-2">
            <Label>الحساب الأب (اختياري)</Label>
            <Select value={form.parent_id ? String(form.parent_id) : ""} onValueChange={(v) => set("parent_id")(v)}>
              <SelectTrigger>
                <SelectValue placeholder="بدون حساب أب" />
              </SelectTrigger>
              <SelectContent>
                {accountsFlat.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.code} - {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الرمز (Code)</Label>
              <Input value={form.code} onChange={(e) => set("code")(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>النوع</Label>
              <Select value={form.type} onValueChange={set("type")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>الطبيعة المحاسبية</Label>
            <Select value={form.normal_balance} onValueChange={set("normal_balance")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="debit">مدين (Debit)</SelectItem>
                <SelectItem value="credit">دائن (Credit)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label>اسم الحساب</Label>
        <Input value={form.name} onChange={(e) => set("name")(e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label>الوصف</Label>
        <Input value={form.description} onChange={(e) => set("description")(e.target.value)} />
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_transactional}
            onChange={(e) => set("is_transactional")(e.target.checked)}
          />
          حساب قابل للترحيل (وريقة)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_cash_account}
            onChange={(e) => set("is_cash_account")(e.target.checked)}
          />
          حساب نقدي (صندوق/بنك)
        </label>
        {isEdit && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => set("is_active")(e.target.checked)}
            />
            فعال
          </label>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          إلغاء
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "جارٍ الحفظ..." : "حفظ"}
        </Button>
      </DialogFooter>
    </form>
  );
};

const AccountNode = ({ node, depth, onInspect, onEdit, onDelete, inspectedId }) => {
  const [collapsed, setCollapsed] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <div
        className={`flex items-center justify-between gap-2 py-1.5 px-2 rounded hover:bg-muted/50 ${
          inspectedId === node.id ? "bg-muted" : ""
        }`}
        style={{ paddingRight: depth * 20 + 8 }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {hasChildren ? (
            <button type="button" onClick={() => setCollapsed((c) => !c)} className="shrink-0">
              <Icon icon={collapsed ? "mdi:chevron-left" : "mdi:chevron-down"} className="w-4 h-4" />
            </button>
          ) : (
            <span className="w-4 shrink-0" />
          )}
          <span className="text-xs text-muted-foreground shrink-0">{node.code}</span>
          <button
            type="button"
            onClick={() => onInspect(node)}
            className="truncate text-sm font-medium hover:underline text-right"
            disabled={!node.is_transactional}
            title={node.is_transactional ? "عرض كشف الحساب" : "حساب رئيسي (غير قابل للترحيل)"}
          >
            {node.name}
          </button>
          {node.is_cash_account && (
            <Badge variant="secondary" className="text-[10px]">صندوق/بنك</Badge>
          )}
          {node.is_system && (
            <Badge variant="outline" className="text-[10px]">نظامي</Badge>
          )}
          {!node.is_active && (
            <Badge variant="destructive" className="text-[10px]">غير فعال</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {node.is_transactional && (
            <span className={`text-sm font-mono ${Number(node.balance) < 0 ? "text-emerald-600" : ""}`}>
              {Number(node.balance ?? 0).toLocaleString("ar-SY", { minimumFractionDigits: 2 })}
            </span>
          )}
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(node)}>
            <Icon icon="mdi:pencil" className="w-4 h-4" />
          </Button>
          {!node.is_system && (
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDelete(node)}>
              <Icon icon="mdi:trash-can-outline" className="w-4 h-4 text-destructive" />
            </Button>
          )}
        </div>
      </div>

      {hasChildren && !collapsed && (
        <div>
          {node.children.map((child) => (
            <AccountNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onInspect={onInspect}
              onEdit={onEdit}
              onDelete={onDelete}
              inspectedId={inspectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ChartOfAccountsTab = ({ accounting }) => {
  const {
    accountsTree,
    accountsFlat,
    isFetchingAccounts,
    accountDialogOpen,
    setAccountDialogOpen,
    editingAccount,
    openCreateAccount,
    openEditAccount,
    handleSaveAccount,
    isSavingAccount,
    deleteAccountTarget,
    setDeleteAccountTarget,
    handleDeleteAccount,
    isDeletingAccount,
    inspectedAccountId,
    setInspectedAccountId,
    accountStatementFilters,
    setAccountStatementFilters,
    accountStatement,
    isFetchingAccountStatement,
  } = accounting;

  const [treeSearch, setTreeSearch] = useState("");

  // Client-side filter: keep a node if it matches, or any of its
  // descendants match - lets you jump straight to e.g. "رسوم" instead of
  // expanding the whole tree by hand.
  const filterTree = (nodes, query) => {
    if (!query) return nodes;
    const q = query.trim().toLowerCase();
    return nodes
      .map((node) => {
        const children = filterTree(node.children || [], query);
        const selfMatches =
          node.name?.toLowerCase().includes(q) || node.code?.toLowerCase().includes(q);
        if (selfMatches || children.length > 0) {
          return { ...node, children };
        }
        return null;
      })
      .filter(Boolean);
  };

  const visibleTree = filterTree(accountsTree, treeSearch);

  const periodPreset = (preset) => {
    const now = new Date();
    let from, to;
    if (preset === "this-month") {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (preset === "last-month") {
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      to = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (preset === "this-year") {
      from = new Date(now.getFullYear(), 0, 1);
      to = new Date(now.getFullYear(), 11, 31);
    }
    setAccountStatementFilters({
      from_date: from.toISOString().slice(0, 10),
      to_date: to.toISOString().slice(0, 10),
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="border border-border rounded-lg bg-card">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">دليل الحسابات (Chart of Accounts)</h3>
          <Button size="sm" onClick={openCreateAccount}>
            <Icon icon="mdi:plus" className="w-4 h-4 ml-1" />
            حساب جديد
          </Button>
        </div>
        <div className="p-2 border-b border-border">
          <Input
            placeholder="ابحث عن حساب بالاسم أو الرمز... (مثال: رسوم)"
            value={treeSearch}
            onChange={(e) => setTreeSearch(e.target.value)}
          />
        </div>
        <div className="p-2 max-h-[600px] overflow-y-auto">
          {isFetchingAccounts && <p className="text-sm text-muted-foreground p-4">جارٍ التحميل...</p>}
          {!isFetchingAccounts && accountsTree.length === 0 && (
            <p className="text-sm text-muted-foreground p-4">لا توجد حسابات بعد.</p>
          )}
          {!isFetchingAccounts && treeSearch && visibleTree.length === 0 && (
            <p className="text-sm text-muted-foreground p-4">لا توجد حسابات مطابقة لـ "{treeSearch}"</p>
          )}
          {visibleTree.map((node) => (
            <AccountNode
              key={node.id}
              node={node}
              depth={0}
              onInspect={(n) => setInspectedAccountId(n.id)}
              onEdit={openEditAccount}
              onDelete={setDeleteAccountTarget}
              inspectedId={inspectedAccountId}
            />
          ))}
        </div>
      </div>

      <div className="border border-border rounded-lg bg-card">
        <div className="p-4 border-b border-border space-y-2">
          <h3 className="font-semibold">كشف الحساب / حركة الحساب</h3>
          <p className="text-xs text-muted-foreground">
            {inspectedAccountId ? "اضغط على اسم أي حساب قابل للترحيل لعرض كشفه هنا" : "اختر حسابًا من القائمة لعرض كشفه"}
          </p>
          {inspectedAccountId && (
            <div className="flex flex-wrap items-end gap-2 pt-1">
              <div className="space-y-1">
                <Label className="text-xs">من تاريخ</Label>
                <Input
                  type="date"
                  className="h-8 w-36"
                  value={accountStatementFilters.from_date || ""}
                  onChange={(e) => setAccountStatementFilters((f) => ({ ...f, from_date: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">إلى تاريخ</Label>
                <Input
                  type="date"
                  className="h-8 w-36"
                  value={accountStatementFilters.to_date || ""}
                  onChange={(e) => setAccountStatementFilters((f) => ({ ...f, to_date: e.target.value }))}
                />
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => periodPreset("this-month")}>هذا الشهر</Button>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => periodPreset("last-month")}>الشهر الماضي</Button>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => periodPreset("this-year")}>هذه السنة</Button>
                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setAccountStatementFilters({ from_date: "", to_date: "" })}>الكل</Button>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 max-h-[600px] overflow-y-auto">
          {!inspectedAccountId && (
            <p className="text-sm text-muted-foreground">لم يتم اختيار حساب بعد.</p>
          )}
          {inspectedAccountId && isFetchingAccountStatement && (
            <p className="text-sm text-muted-foreground">جارٍ التحميل...</p>
          )}
          {inspectedAccountId && accountStatement && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div className="bg-muted/40 rounded p-2">
                  <div className="text-xs text-muted-foreground">الرصيد الافتتاحي</div>
                  <div className="font-mono font-semibold">
                    {Number(accountStatement.opening_balance).toLocaleString("ar-SY", { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="bg-muted/40 rounded p-2">
                  <div className="text-xs text-muted-foreground">إجمالي مدين خلال الفترة</div>
                  <div className="font-mono font-semibold">
                    {Number(accountStatement.total_debit).toLocaleString("ar-SY", { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="bg-muted/40 rounded p-2">
                  <div className="text-xs text-muted-foreground">إجمالي دائن خلال الفترة</div>
                  <div className="font-mono font-semibold">
                    {Number(accountStatement.total_credit).toLocaleString("ar-SY", { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded p-2">
                  <div className="text-xs text-muted-foreground">الرصيد الختامي</div>
                  <div className="font-mono font-bold">
                    {Number(accountStatement.closing_balance).toLocaleString("ar-SY", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                مثال: لمعرفة إجمالي الرسوم المدفوعة خلال شهر، اختر حساب "رسوم ونشر إعلانات"
                واستخدم فلتر "هذا الشهر" أعلاه - سيظهر المجموع في بطاقة "إجمالي مدين خلال الفترة".
                لمعرفة إجمالي قيمة العقود المباعة خلال فترة، اختر حساب "إيرادات حجوزات اللوحات
                الإعلانية" بنفس الطريقة - المجموع يظهر في "إجمالي دائن خلال الفترة".
              </p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="text-right p-1">التاريخ</th>
                    <th className="text-right p-1">البيان</th>
                    <th className="text-left p-1">مدين</th>
                    <th className="text-left p-1">دائن</th>
                    <th className="text-left p-1">الرصيد</th>
                  </tr>
                </thead>
                <tbody>
                  {(accountStatement.lines?.data ?? accountStatement.lines ?? []).map((line) => (
                    <tr key={line.id} className="border-b border-border/50">
                      <td className="p-1">{line.entry_date}</td>
                      <td className="p-1 max-w-[160px] truncate" title={line.description}>{line.description}</td>
                      <td className="p-1 font-mono">{line.debit ? Number(line.debit).toLocaleString("ar-SY") : "-"}</td>
                      <td className="p-1 font-mono">{line.credit ? Number(line.credit).toLocaleString("ar-SY") : "-"}</td>
                      <td className="p-1 font-mono">{Number(line.balance_after).toLocaleString("ar-SY")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAccount ? "تعديل حساب" : "حساب جديد"}</DialogTitle>
          </DialogHeader>
          <AccountForm
            initialData={editingAccount}
            accountsFlat={accountsFlat}
            onCancel={() => setAccountDialogOpen(false)}
            onSave={handleSaveAccount}
            isSaving={isSavingAccount}
          />
        </DialogContent>
      </Dialog>

      <DeleteDialog
        open={Boolean(deleteAccountTarget)}
        onClose={() => setDeleteAccountTarget(null)}
        onConfirm={handleDeleteAccount}
        loading={isDeletingAccount}
        title="حذف الحساب"
        description={`هل أنت متأكد من حذف الحساب "${deleteAccountTarget?.name ?? ""}"؟`}
      />
    </div>
  );
};

export default ChartOfAccountsTab;
