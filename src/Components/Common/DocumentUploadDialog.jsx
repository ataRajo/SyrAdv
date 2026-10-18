// src/Components/Common/DocumentUploadDialog.jsx
//
// نافذة "توثيق" موحَّدة (طلب صريح: "كل السندات اعملها توثيق - رفع صورة متل
// العقد"). نفس فكرة SignContractPanel تمامًا: صورة المستند الموقَّع + مربّع
// تأكيد، والضغط على "توثيق" هو التأكيد نفسه. تُستخدم للدفعات ولسندات
// القبض/الصرف في المحاسبة.

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

const MAX_MB = 10;

export default function DocumentUploadDialog({
  open,
  onClose,
  onSubmit,
  isLoading = false,
  title = "توثيق السند",
  subtitle,
  warning = "لن يُرحَّل هذا السند على شجرة الحسابات حتى يُوثَّق برفع صورة السند الموقَّع.",
  confirmLabel = "أؤكد أن الصورة هي السند الموقَّع الأصلي",
  existingImageUrl = null,
  submitLabel = "توثيق",
}) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setFile(null);
      setConfirmed(false);
      setError("");
      setPreviewUrl((url) => {
        if (url) URL.revokeObjectURL(url);
        return null;
      });
    }
  }, [open]);

  const pick = (selected) => {
    if (!selected) return;
    if (!selected.type?.startsWith("image/")) {
      setError("يرجى اختيار ملف صورة فقط (jpg / png ...)");
      return;
    }
    if (selected.size > MAX_MB * 1024 * 1024) {
      setError(`حجم الصورة أكبر من ${MAX_MB} ميغابايت`);
      return;
    }
    setError("");
    setFile(selected);
    setPreviewUrl((url) => {
      if (url) URL.revokeObjectURL(url);
      return URL.createObjectURL(selected);
    });
  };

  const canSubmit = Boolean(file) && confirmed && !isLoading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const ok = await onSubmit?.(file);
    if (ok !== false) onClose?.();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !isLoading && onClose?.()}>
      <DialogContent dir="rtl" className="max-w-[95vw] sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon icon="mdi:file-sign" className="h-5 w-5 text-amber-600" />
            {title}
          </DialogTitle>
          {subtitle && <DialogDescription>{subtitle}</DialogDescription>}
        </DialogHeader>

        {warning && (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
            <Icon icon="mdi:alert-outline" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{warning}</span>
          </div>
        )}

        {existingImageUrl && !previewUrl && (
          <a
            href={existingImageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs text-primary underline"
          >
            عرض صورة التوثيق الحالية (رفع صورة جديدة يستبدلها)
          </a>
        )}

        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            pick(e.dataTransfer.files?.[0]);
          }}
          className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/20 p-4 text-center hover:bg-muted/40"
        >
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0])}
          />
          {previewUrl ? (
            <img src={previewUrl} alt="معاينة" className="max-h-56 rounded border border-border object-contain" />
          ) : (
            <>
              <Icon icon="mdi:camera-plus-outline" className="h-10 w-10 text-muted-foreground" />
              <span className="text-sm font-medium">اختر صورة السند الموقَّع أو اسحبها هنا</span>
              <span className="text-xs text-muted-foreground">يمكن التصوير مباشرة من الموبايل - حتى {MAX_MB}MB</span>
            </>
          )}
        </label>
        {file && <p className="truncate text-xs text-muted-foreground">{file.name}</p>}
        {error && <p className="text-xs text-destructive">{error}</p>}

        <label className="flex select-none items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          {confirmLabel}
        </label>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="w-full sm:w-auto">
            إلغاء
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto"
          >
            {isLoading ? (
              <>
                <Icon icon="mdi:loading" className="h-4 w-4 animate-spin" /> جارٍ التوثيق...
              </>
            ) : (
              <>
                <Icon icon="mdi:check-decagram" className="h-4 w-4" /> {submitLabel}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
