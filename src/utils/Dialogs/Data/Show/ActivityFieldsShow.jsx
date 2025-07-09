
export const ActivityFieldsShow = [
  { label: "النشاط", key: "activity", icon: "mdi:history" },
  {
    label: "انشاء",
    key: "created_at",
    icon: "mdi:calendar",
    format: (value) => new Date(value).toLocaleDateString("en-US"),
  },
];
