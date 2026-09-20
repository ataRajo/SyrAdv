import React, { useMemo } from "react";
import { Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { useGetPermissionsQuery } from "../../../RtkQuery/Slice/Users/UsersApi";

/**
 * منتقي صلاحيات الموظف - checkbox لكل صلاحية (عرض/إضافة/تعديل/حذف) مُجمَّعة
 * حسب المورد، بالإضافة لقسم منفصل للصلاحيات "الاستثنائية" (مثل إظهار كل
 * الطلبات بدل طلبات اليوم وغدًا فقط) - طلب صريح: "يتم تحديد ال permissions
 * الخاصة به من خلال checkbox ويوجد permissions استثنائية".
 *
 * مُتحكَّم بالكامل (controlled): `value` مصفوفة أسماء الصلاحيات المُحدَّدة
 * حاليًا، و`onChange` تستدعى بالمصفوفة الجديدة كاملة عند أي تبديل - نفس
 * نمط formik.setFieldValue القياسي في هذا المشروع.
 */
const EmployeePermissionsPicker = ({ value = [], onChange }) => {
  const { data, isFetching, isError } = useGetPermissionsQuery();

  const selected = useMemo(() => new Set(Array.isArray(value) ? value : []), [value]);

  const toggle = (name) => {
    const next = new Set(selected);
    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
    }
    onChange(Array.from(next));
  };

  const toggleAllInGroup = (groupPermissions, checked) => {
    const next = new Set(selected);
    groupPermissions.forEach((p) => {
      if (checked) next.add(p.name);
      else next.delete(p.name);
    });
    onChange(Array.from(next));
  };

  if (isFetching) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        جاري تحميل الصلاحيات...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-sm text-red-600 py-2">تعذّر تحميل قائمة الصلاحيات</div>
    );
  }

  const { groups = [], exceptional = [] } = data;

  return (
    <div className="col-span-1 sm:col-span-2 space-y-4" dir="rtl">
      <div className="flex items-center gap-2 border-b pb-2">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <h4 className="font-semibold text-sm">صلاحيات الموظف</h4>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {groups.map((group) => {
          const groupNames = group.permissions.map((p) => p.name);
          const selectedCount = groupNames.filter((n) => selected.has(n)).length;
          const allSelected = selectedCount === groupNames.length && groupNames.length > 0;

          return (
            <div key={group.resource} className="border rounded-lg p-3 bg-muted/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">{group.label}</span>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = selectedCount > 0 && !allSelected;
                    }}
                    onChange={(e) => toggleAllInGroup(group.permissions, e.target.checked)}
                  />
                  الكل
                </label>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {group.permissions.map((perm) => (
                  <label
                    key={perm.name}
                    className="flex items-center gap-1.5 text-xs cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5"
                      checked={selected.has(perm.name)}
                      onChange={() => toggle(perm.name)}
                    />
                    {perm.label}
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {exceptional.length > 0 && (
        <div className="border border-amber-300 dark:border-amber-700 rounded-lg p-3 bg-amber-50 dark:bg-amber-950/20">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
              صلاحيات استثنائية
            </span>
          </div>
          <div className="space-y-2">
            {exceptional.map((perm) => (
              <label
                key={perm.name}
                className="flex items-start gap-2 text-xs cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 mt-0.5"
                  checked={selected.has(perm.name)}
                  onChange={() => toggle(perm.name)}
                />
                <span>
                  <span className="font-medium">{perm.label}</span>
                  {perm.description && (
                    <span className="block text-[11px] text-muted-foreground mt-0.5">
                      {perm.description}
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeePermissionsPicker;
