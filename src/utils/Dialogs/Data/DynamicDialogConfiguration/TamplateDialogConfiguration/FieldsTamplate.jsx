export const TemplateFields = [
  
  { name: "model", label: "النموذج", dir: "rtl" },
  { name: "size", label: "الحجم", dir: "rtl" },
  { name: "faces_number", label: "عدد الأوجه", dir: "rtl" , type: "number" },

  { name: "advertising_space", label: "مساحة الإعلان", dir: "rtl", type: "number" },
  { name: "printing_space", label: "مساحة الطباعة", dir: "rtl", type: "number" },{
    name: "type",
    label: "النوع",
    type: "select",
    options: [
      { value: "طولي", label: "طولي" },
      { value: "عرضي", label: "عرضي" },

    ],
  },
  {
    name: "products",
    label: "أسعار المنتجات",
    type: "array",
  },
];