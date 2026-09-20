import React from "react";
import { useAccounting } from "../../hooks/useAccounting";
import SuppliersTab from "../../Components/Accounting/SuppliersTab";

/**
 * صفحة مستقلة للموردين (طلب صريح: عنصر جديد في الشريط الجانبي اسمه
 * "الموردين" يأخذ مباشرة إلى صفحة الموردين) - بدل الاعتماد فقط على تبويب
 * الموردين داخل صفحة المحاسبة (AccountingPanel). تستخدم نفس المكوّن
 * SuppliersTab ونفس useAccounting() بالضبط، فأي عملية (إضافة مورد، فئة
 * مورد، كشف حساب) تبقى متطابقة مع ما هو موجود أصلًا في تبويب "الموردون".
 */
const SuppliersPage = () => {
  const accounting = useAccounting();

  return (
    <div className="p-4" dir="rtl">
      <SuppliersTab accounting={accounting} />
    </div>
  );
};

export default SuppliersPage;
