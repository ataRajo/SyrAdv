export const orderFields = [
  { name: "notes", label: "ملاحظة", type: "text", dir: "rtl" },
  {
    name: "action_date",
    label: "تاريخ البدء",
    type: "date",
    minDate: new Date().toISOString().split("T")[0],
  }
]; 