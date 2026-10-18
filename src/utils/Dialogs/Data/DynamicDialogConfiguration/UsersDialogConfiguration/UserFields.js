// نفس قيم SetEmployeeSalaryRequest على الباك-إند.
export const SALARY_TYPE_OPTIONS = [
  { value: "monthly", label: "شهري" },
  { value: "weekly", label: "أسبوعي" },
  { value: "daily", label: "يومي" },
];

export const UserFields = [
  { name: "full_name", label: "الاسم الكامل", type: "text", dir: "rtl" },
  { name: "username", label: "اسم المستخدم", type: "text", dir: "rtl" },
  { name: "password", label: "كلمة السر", type: "password", dir: "rtl" },
  { name: "phone_number", label: "رقم الهاتف", type: "text", dir: "rtl" },
  { name: "address", label: "العنوان", type: "text", dir: "rtl" },
  { name: "email", label: "البريد الإلكتروني", type: "email", dir: "rtl" },
  {
    name: "department",
    label: "القسم",
    type: "select",
    required: true,
      valueKey: "value",  // Add this
    displayKey: "label", // Add this
  },
  {
    name: "roles",
    label: "الدور",
    type: "select",
    dir: "rtl",
    dataKey: "roles",
    valueKey: "id",
    displayKey: "name",
  },
  // ✅ الراتب (طلب صريح): خانة جديدة ضمن إضافة/تعديل الموظف. تُرسَل كمبلغ
  // شهري افتراضًا إلى الباك-إند (UserService)، الذي يُنشئ/يُحدِّث سجل راتب
  // حقيقي متكامل مع الحساب والصندوق (نفس آلية تبويب "الرواتب والأجور")
  // بدل عمود منعزل. تُترَك فارغة لموظف بلا راتب معرَّف بعد.
  {
    name: "salary",
    label: "الراتب",
    type: "number",
    dir: "rtl",
  },
  // نوع الراتب (طلب صريح): شهري / أسبوعي / يومي - نفس الخيارات في "الرواتب
  // والأجور" بالصندوق والمحاسبة (PayrollTab). يُحفَظ في نفس سجل الراتب.
  {
    name: "salary_type",
    label: "نوع الراتب",
    type: "select",
    dir: "rtl",
    options: SALARY_TYPE_OPTIONS,
    valueKey: "value",
    displayKey: "label",
  },
  {
    name: "permissions",
    label: "الصلاحيات",
    type: "permissions-picker",
  },
];
