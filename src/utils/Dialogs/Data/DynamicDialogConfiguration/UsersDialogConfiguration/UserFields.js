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
];
