import { format } from "date-fns";

 export const TemplateFieldsShow = [
    { label: "النموذج", key: "model", icon: "mdi:shape-outline" },
    { label: "النوع", key: "type", icon: "mdi:format-list-bulleted-type" },
    { label: "القياس", key: "size", icon: "mdi:ruler-square" },
    {
      label: "مساحة الطبياعة",
      key: "printing_space",
      icon: "mdi:image-area",
      format: (value) => `${value}m²`,
    },
    {
      label: "مساحة الإعلان",
      key: "advertising_space",
      icon: "mdi:image-area",
      format: (value) => `${value}m²`,
    },
    {
      label: "إنشئ في ",
      key: "created_at",
      icon: "mdi:calendar",
      format: (value) => format(new Date(value), "MMM dd, yyyy"),
    },
  ];