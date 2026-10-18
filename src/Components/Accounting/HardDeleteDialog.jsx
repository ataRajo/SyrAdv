import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";

const fmt = (n) => Number(n ?? 0).toLocaleString("ar-SY", { minimumFractionDigits: 2 });

/**
 * حذف نهائي (مرحلة الاختبار) مع معاينة قبل التنفيذ:
 * يعرض ما سيُحذف (سندات/سلف) وأثر الحذف على أرصدة الحسابات، ولا يحذف قبل تأكيد المستخدم.
 *
 * props:
 *  - open / onClose
 *  - id: معرّف السجل
 *  - title: عنوان الحوار
 *  - usePreviewLazy: hook مثل useLazyPreviewDeleteTransactionQuery
 *  - useDelete: hook مثل useDeleteTransactionMutation
 */
const HardDeleteDialog = ({ open, onClose, id, title, usePreviewLazy, useDelete }) => {
  const [trigger, { data: plan, isFetching, isError, error }] = usePreviewLazy();
  const [doDelete, { isLoading }] = useDelete();

  useEffect(() => {
    if (open && id != null) trigger(id);
  }, [open, id, trigger]);

  const handleConfirm = async () => {
    try {
      await doDelete(id).unwrap();
      toast.success("تم الحذف النهائي وتصحيح الأرصدة");
      onClose();
    } catch (e) {
      toast.error(e?.data?.message || "فشل الحذف");
    }
  };

  const blockers = plan?.blockers ?? [];
  const canDelete = plan?.can_delete !== false && !isFetching && !isError;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[95vw] sm:max-w-[560px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-red-600">{title || "حذف نهائي"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm max-h-[60vh] overflow-y-auto">
          <p className="text-muted-foreground">
            هذا حذف نهائي لا رجعة فيه (للبيانات التجريبية فقط). راجع ما سيُحذف ثم أكّد.
          </p>

          {isFetching && <div className="text-center text-muted-foreground">جارٍ احتساب الأثر...</div>}
          {isError && (
            <div className="text-red-600">{error?.data?.message || "تعذّر تحميل المعاينة (الحذف النهائي معطّل؟)"}</div>
          )}

          {blockers.length > 0 && (
            <div className="border border-red-300 bg-red-50 text-red-700 rounded p-2 space-y-1">
              <div className="font-semibold">لا يمكن الحذف:</div>
              {blockers.map((b, i) => (
                <div key={i}>• {typeof b === "string" ? b : b.label || b.hint || JSON.stringify(b)}</div>
              ))}
            </div>
          )}

          {(plan?.entries ?? []).length > 0 && (
            <div>
              <div className="font-semibold mb-1">السندات/القيود التي ستُحذف ({plan.entries.length})</div>
              <div className="border border-border rounded divide-y divide-border">
                {plan.entries.map((e) => (
                  <div key={e.id} className="p-2 flex justify-between gap-2">
                    <span className="font-mono text-xs">{e.voucher_number || e.entry_number}</span>
                    <span className="flex-1 truncate">{e.description || "-"}</span>
                    <span className="font-mono">{fmt(e.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(plan?.advances_to_delete ?? []).length > 0 && (
            <div>
              <div className="font-semibold mb-1">سلف ستُحذف</div>
              {plan.advances_to_delete.map((a, i) => (
                <div key={i} className="p-2 border border-border rounded mb-1 flex justify-between">
                  <span>{a.name || `${a.kind === "employee" ? "سلفة موظف" : "سلفة مورد"} #${a.id}`}</span>
                  <span className="font-mono">{fmt(a.amount)}</span>
                </div>
              ))}
            </div>
          )}

          {(plan?.advances_to_restore ?? []).length > 0 && (
            <div className="text-amber-700">
              سيُعاد رصيد {plan.advances_to_restore.length} سلفة كانت مخصومة عبر هذا السجل.
            </div>
          )}

          {(plan?.accounts ?? []).length > 0 && (
            <div>
              <div className="font-semibold mb-1">أثر الحذف على الأرصدة</div>
              <table className="w-full text-xs text-center border border-border">
                <thead>
                  <tr className="bg-muted/30">
                    <th className="p-1">الحساب</th>
                    <th className="p-1">قبل</th>
                    <th className="p-1">بعد</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.accounts.map((a) => (
                    <tr key={a.id} className="border-t border-border">
                      <td className="p-1">{a.code} - {a.name}</td>
                      <td className="p-1 font-mono">{fmt(a.current_balance)} {a.currency}</td>
                      <td className="p-1 font-mono">{fmt(a.balance_after)} {a.currency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(plan?.warnings ?? []).map((w, i) => (
            <div key={i} className="text-amber-700">⚠ {w}</div>
          ))}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">إلغاء</Button>
          <Button
            variant="destructive"
            disabled={!canDelete || isLoading}
            onClick={handleConfirm}
            className="w-full sm:w-auto"
          >
            {isLoading ? "جارٍ الحذف..." : "حذف نهائي"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HardDeleteDialog;
