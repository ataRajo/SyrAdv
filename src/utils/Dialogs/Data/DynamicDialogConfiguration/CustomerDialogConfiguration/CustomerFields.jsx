export const CustomerFields = [
  { name: "full_name", label: "الاسم الكامل", dir: "rtl" },
  { name: "company_name", label: "اسم الشركة" },
  { name: "address", label: "العنوان" },
  { name: "phone_number", label: "رقم الهاتف" },
  { name: "commercial_registration_number", label: "رقم السجل التجاري" },
  {
    name: "work_type_id",
    label: "نوع العمل",
    type: "select",
    placeholder: "اختر نوع العمل",
    options: [], // Will be populated dynamically
    icon: "mdi:briefcase-outline",
    gridCols: 1,
  },
];
