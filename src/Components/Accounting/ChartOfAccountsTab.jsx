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
import { useAuth } from "../../Context/AuthProvider";

const ACCOUNT_TYPES = [
  { value: "asset", label: "أصول" },
  { value: "liability", label: "خصوم" },
  { value: "equity", label: "حقوق ملكية" },
  { value: "revenue", label: "إيرادات" },
  { value: "expense", label: "مصاريف" },
];

const fmtMoney = (n) =>
  Number(n ?? 0).toLocaleString("ar-SY", { minimumFractionDigits: 2 });

const AccountForm = ({
  initialData,
  accountsFlat,
  onCancel,
  onSave,
  isSaving,
  isSuperAdmin,
  onManualAdjust,
  isManualAdjusting,
  manualAdjustHistory,
  isFetchingManualAdjustHistory,
}) => {
  const isEdit = Boolean(initialData?.id);
  const [form, setForm] = useState({
    parent_id: initialData?.parent_id ?? "",
    code: initialData?.code ?? "",
    name: initialData?.name ?? "",
    type: initialData?.type ?? "expense",
    normal_balance: initialData?.normal_balance ?? "debit",
    currency: initialData?.currency ?? "USD",
    balance: initialData?.balance ?? 0,
    is_transactional: initialData?.is_transactional ?? true,
    is_cash_account: initialData?.is_cash_account ?? false,
    is_active: initialData?.is_active ?? true,
    description: initialData?.description ?? "",
  });
  // "تعديل يدوي للحسابات من شجرة الحسابات (من السوبر ادمن فقط)" - طلب
  // صريح. يفتح الحقول الهيكلية المقفلة عادة عند التعديل (راجع تعليق
  // AccountService::update() على الباك-إند) وحتى الرصيد نفسه - مقصور على
  // من يملك دور "سوبر أدمن" فقط، ويطلب سببًا مكتوبًا دائمًا.
  const [manualMode, setManualMode] = useState(false);
  const [manualReason, setManualReason] = useState("");
  // تعديل نوع الحساب من الشجرة (طلب صريح) - الحسابات الفرعية تتبع الأب افتراضيًا.
  const [applyTypeToChildren, setApplyTypeToChildren] = useState(true);
  const hasChildren = Boolean(initialData?.children?.length);
  const typeChanged = isEdit && form.type !== (initialData?.type ?? "expense");

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEdit && manualMode) {
      onManualAdjust(initialData.id, {
        parent_id: form.parent_id || null,
        code: form.code,
        name: form.name,
        type: form.type,
        normal_balance: form.normal_balance,
        currency: form.currency,
        balance: Number(form.balance),
        is_transactional: form.is_transactional,
        is_cash_account: form.is_cash_account,
        is_active: form.is_active,
        description: form.description,
        reason: manualReason,
      });
    } else if (isEdit) {
      onSave({
        name: form.name,
        description: form.description,
        is_active: form.is_active,
        is_transactional: form.is_transactional,
        is_cash_account: form.is_cash_account,
        ...(typeChanged ? { type: form.type, apply_to_children: applyTypeToChildren } : {}),
      });
    } else {
      onSave({
        parent_id: form.parent_id || null,
        code: form.code,
        name: form.name,
        type: form.type,
        normal_balance: form.normal_balance,
        currency: form.currency,
        is_transactional: form.is_transactional,
        is_cash_account: form.is_cash_account,
        description: form.description,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isEdit && isSuperAdmin && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-red-900">
            <input
              type="checkbox"
              checked={manualMode}
              onChange={(e) => {
                setManualMode(e.target.checked);
                if (e.target.checked) {
                  setForm((f) => ({
                    ...f,
                    parent_id: initialData?.parent_id ?? "",
                    code: initialData?.code ?? "",
                    type: initialData?.type ?? "expense",
                    normal_balance: initialData?.normal_balance ?? "debit",
                    currency: initialData?.currency ?? "USD",
                    balance: initialData?.balance ?? 0,
                  }));
                }
              }}
            />
            <Icon icon="mdi:shield-alert-outline" className="w-4 h-4" />
            تعديل يدوي متقدِّم (سوبر أدمن فقط)
          </label>
          {manualMode && (
            <>
              <p className="text-xs text-red-800">
                تحذير: هذا يفتح حقولًا هيكلية (الرمز/النوع/الطبيعة المحاسبية/الحساب
                الأب) وحتى الرصيد نفسه مباشرة، بلا قيد محاسبي موازٍ. استخدمه فقط
                لتصحيح خطأ إدخال/ترحيل بيانات - كل تعديل هنا يُسجَّل بسببه
                ومن نفَّذه للمراجعة اللاحقة.
              </p>
              <div className="space-y-1">
                <Label className="text-xs">سبب التعديل (إلزامي)</Label>
                <Input
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  placeholder="مثال: تصحيح رصيد افتتاحي أُدخل خطأً عند الترحيل من النظام القديم"
                  required={manualMode}
                />
              </div>
            </>
          )}
        </div>
      )}

      {(!isEdit || manualMode) && (
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

          {manualMode && (
            <div className="space-y-2">
              <Label className="text-red-800">الرصيد (تعديل مباشر - بلا قيد موازٍ)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.balance}
                onChange={(e) => set("balance")(e.target.value)}
              />
            </div>
          )}
        </>
      )}

      {isEdit && !manualMode && (
        <div className="space-y-2 rounded-md border border-border p-3">
          <Label>نوع الحساب</Label>
          <Select value={form.type} onValueChange={set("type")} disabled={initialData?.is_system}>
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
          {initialData?.is_system && (
            <p className="text-xs text-muted-foreground">حساب نظام محمي - لا يمكن تغيير نوعه.</p>
          )}
          {typeChanged && (
            <>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                الطبيعة المحاسبية (مدين/دائن) تتبع النوع تلقائيًا، وإن انقلبت يُعاد احتساب إشارة الرصيد وكشف الحساب بنفس الحركات دون أي قيد جديد. يُسجَّل التغيير في سجل التعديلات.
              </p>
              {hasChildren && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={applyTypeToChildren}
                    onChange={(e) => setApplyTypeToChildren(e.target.checked)}
                  />
                  تطبيق النوع الجديد على كل الحسابات الفرعية ({initialData.children.length})
                </label>
              )}
            </>
          )}
        </div>
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
        {(!isEdit || manualMode) && form.is_cash_account && (
          <div className="space-y-2">
            <Label>عملة هذا الصندوق/البنك</Label>
            <Select value={form.currency} onValueChange={set("currency")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">دولار ($)</SelectItem>
                <SelectItem value="SYP">ليرة سورية (ل.س)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
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

      {isEdit && isSuperAdmin && (manualAdjustHistory ?? []).length > 0 && (
        <div className="border border-border rounded-md p-2 space-y-1 max-h-32 overflow-y-auto">
          <p className="text-xs font-semibold text-muted-foreground">سجل التعديلات اليدوية السابقة</p>
          {isFetchingManualAdjustHistory && <p className="text-xs text-muted-foreground">جارٍ التحميل...</p>}
          {(manualAdjustHistory ?? []).map((log) => (
            <div key={log.id} className="text-[11px] border-b border-border/50 pb-1 last:border-0">
              <span className="font-medium">{log.user_name || "-"}</span>
              {" - "}
              <span className="text-muted-foreground">
                {log.created_at ? new Date(log.created_at).toLocaleString("ar-SY") : "-"}
              </span>
              <div className="text-muted-foreground">{log.reason}</div>
            </div>
          ))}
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          إلغاء
        </Button>
        <Button type="submit" disabled={isSaving || isManualAdjusting || (manualMode && !manualReason.trim())}>
          {isSaving || isManualAdjusting
            ? "جارٍ الحفظ..."
            : manualMode
              ? "حفظ التعديل اليدوي"
              : "حفظ"}
        </Button>
      </DialogFooter>
    </form>
  );
};

const AccountNode = ({ node, depth, onInspect, onEdit, onDelete, inspectedId, parentType }) => {
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
          {depth === 0 || parentType !== node.type ? (
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              {ACCOUNT_TYPES.find((t) => t.value === node.type)?.label || node.type}
            </Badge>
          ) : null}
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
              {node.currency === "SYP" ? "ل.س " : "$"}
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
              parentType={node.type}
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
  const { isSuperAdmin: checkIsSuperAdmin } = useAuth();
  const isUserSuperAdmin = checkIsSuperAdmin();
  const {
    accountsTree,
    showZeroCustomerAccounts,
    setShowZeroCustomerAccounts,
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
    manualAdjustAccount,
    isManualAdjustingAccount,
    accountManualAdjustments,
    isFetchingAccountManualAdjustments,
    inspectedAccountId,
    setInspectedAccountId,
    accountStatementFilters,
    setAccountStatementFilters,
    accountStatement,
    isFetchingAccountStatement,
    reconciliationLogs,
    isFetchingReconciliationLogs,
    runReconciliation,
    isRunningReconciliation,
  } = accounting;

  const [treeSearch, setTreeSearch] = useState("");
  const [reconciliationOpen, setReconciliationOpen] = useState(false);

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

  // إجابة مباشرة لطلب العميل: "ماذا يوجد في الصندوق دولار أو ليرة سورية" -
  // كل حساب نقدي (صندوق/بنك) برصيده الحقيقي، مجمَّعًا حسب العملة.
  const cashAccountsList = accountsFlat.filter((a) => a.is_cash_account);

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
    <div className="space-y-4">
      {cashAccountsList.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {cashAccountsList.map((a) => (
            <div key={a.id} className="border border-border rounded-lg bg-card px-4 py-2 flex items-center gap-2">
              <Icon icon={a.currency === "SYP" ? "mdi:cash-multiple" : "mdi:cash-usd"} className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">{a.name}</div>
                <div className="font-mono font-semibold">
                  {a.currency === "SYP" ? "ل.س " : "$"}
                  {Number(a.balance ?? 0).toLocaleString("ar-SY", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* "والتأكد من جميع الحسابات" - طلب صريح. رصد/تنبيه فقط، لا يُصحِّح أي
          رصيد تلقائيًا - راجع ReconciliationService على الباك-إند. */}
      <div className="border border-border rounded-lg bg-card">
        <button
          type="button"
          className="w-full flex items-center justify-between p-4"
          onClick={() => setReconciliationOpen((v) => !v)}
        >
          <span className="font-semibold flex items-center gap-2">
            <Icon icon="mdi:clipboard-check-outline" className="w-4 h-4" />
            تدقيق الحسابات (التأكد من جميع الحسابات)
            {reconciliationLogs?.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">
                {reconciliationLogs.length} انحراف مسجَّل
              </span>
            )}
          </span>
          <Icon icon={reconciliationOpen ? "mdi:chevron-up" : "mdi:chevron-down"} className="w-4 h-4" />
        </button>
        {reconciliationOpen && (
          <div className="border-t border-border p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-xs text-muted-foreground">
                يقارن رصيد كل حساب في الشجرة مع قيوده الفعلية، ورصيد حسابَي سلف
                الموظفين/الموردين مع سجلَّيهما التفصيليَّين، بالإضافة لأرصدة
                الزبائن - رصد وتسجيل فقط، بلا أي تعديل تلقائي على أي رصيد.
              </p>
              {isUserSuperAdmin && (
                <Button size="sm" variant="outline" disabled={isRunningReconciliation} onClick={runReconciliation}>
                  <Icon icon="mdi:refresh" className="w-3.5 h-3.5 ml-1" />
                  {isRunningReconciliation ? "جارٍ التدقيق..." : "تشغيل تدقيق شامل الآن"}
                </Button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="text-right p-1">النوع</th>
                    <th className="text-right p-1">الحساب/الجهة</th>
                    <th className="text-left p-1">المتوقَّع</th>
                    <th className="text-left p-1">الفعلي</th>
                    <th className="text-left p-1">الفرق</th>
                    <th className="text-right p-1">تاريخ الاكتشاف</th>
                  </tr>
                </thead>
                <tbody>
                  {isFetchingReconciliationLogs && (
                    <tr><td colSpan={6} className="p-3 text-center text-muted-foreground">جارٍ التحميل...</td></tr>
                  )}
                  {!isFetchingReconciliationLogs && (reconciliationLogs ?? []).length === 0 && (
                    <tr><td colSpan={6} className="p-3 text-center text-muted-foreground">لا يوجد أي انحراف مسجَّل - كل الحسابات متطابقة.</td></tr>
                  )}
                  {(reconciliationLogs ?? []).map((log) => (
                    <tr key={`${log.scope}-${log.id}`} className="border-b border-border/50">
                      <td className="p-1">{log.scope}</td>
                      <td className="p-1">{log.account_name || log.account_code || "-"}</td>
                      <td className="p-1 font-mono">{fmtMoney(log.expected_balance)}</td>
                      <td className="p-1 font-mono">{fmtMoney(log.actual_balance)}</td>
                      <td className="p-1 font-mono text-amber-700 font-semibold">{fmtMoney(log.difference)}</td>
                      <td className="p-1">{log.detected_at ? new Date(log.detected_at).toLocaleString("ar-SY") : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="border border-border rounded-lg bg-card">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">دليل الحسابات (Chart of Accounts)</h3>
          <Button size="sm" onClick={openCreateAccount}>
            <Icon icon="mdi:plus" className="w-4 h-4 ml-1" />
            حساب جديد
          </Button>
        </div>
        <div className="p-2 border-b border-border space-y-2">
          <Input
            placeholder="ابحث عن حساب بالاسم أو الرمز... (مثال: رسوم)"
            value={treeSearch}
            onChange={(e) => setTreeSearch(e.target.value)}
          />
          {/* طلب صريح: الزبائن برصيد صفر لا يظهرون في الشجرة - مخفيون
              افتراضيًا (من الباك-إند)، وهذا الخيار يُظهرهم عند الحاجة. */}
          <label className="flex items-center gap-2 text-xs text-muted-foreground select-none cursor-pointer px-1">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-gray-300"
              checked={!!showZeroCustomerAccounts}
              onChange={(e) => setShowZeroCustomerAccounts?.(e.target.checked)}
            />
            إظهار الزبائن الذين رصيدهم صفر
          </label>
        </div>
        <div className="p-2 max-h-[600px] overflow-y-auto">
          {isFetchingAccounts && <p className="text-sm text-muted-foreground p-4">جارٍ التحميل...</p>}
          {!isFetchingAccounts && accountsTree.length === 0 && (
            <p className="text-sm text-muted-foreground p-4">لا توجد حسابات بعد.</p>
          )}
          {!isFetchingAccounts && treeSearch && visibleTree.length === 0 && (
            <p className="text-sm text-muted-foreground p-4">
              لا توجد حسابات مطابقة لـ "{treeSearch}"
              {!showZeroCustomerAccounts && " (الزبائن برصيد صفر مخفيون - فعّل خيار إظهارهم أعلاه)"}
            </p>
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
            isSuperAdmin={isUserSuperAdmin}
            onManualAdjust={async (id, data) => {
              const ok = await manualAdjustAccount(id, data);
              if (ok) setAccountDialogOpen(false);
            }}
            isManualAdjusting={isManualAdjustingAccount}
            manualAdjustHistory={accountManualAdjustments}
            isFetchingManualAdjustHistory={isFetchingAccountManualAdjustments}
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
