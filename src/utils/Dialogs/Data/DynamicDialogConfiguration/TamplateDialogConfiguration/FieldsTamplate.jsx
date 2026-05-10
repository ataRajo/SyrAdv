export const TemplateFields = [
  
  { name: "model", label: "النموذج", dir: "rtl" },
  { name: "size", label: "الحجم", dir: "rtl" },
  { name: "faces_number", label: "عدد الأوجه", dir: "rtl" , type: "number" },
  { name: "color", label: "اللون ", dir: "rtl" , type: "color" },


  { name: "advertising_space", label: "مساحة الإعلان", dir: "rtl", type: "number" },
  { name: "printing_space", label: "مساحة الطباعة", dir: "rtl", type: "number" },
  {
    name: "image",
    label: "صورة النموذج",
    type: "file",
    accept: "image/*",
  },
  {
    name: "image_on_map",
    label: "صورة SVG",
    type: "file",
    accept: ".svg,image/svg+xml",
  },
  {
    name: "type",
    label: "النوع",
    type: "select",
    options: [
      { value: "طولي", label: "طولي" },
      { value: "عرضي", label: "عرضي" },

    ],
  },
  
  {
    
    name: "display_type",                                    
    label: "نوع العرض",                                      
    type: "select",                                          
    options: [                                               
      { value: "digital", label: "رقمي (Digital)" },               
      { value: "physical", label: "فيزيائي (Physical)" },          
    ],                                                       
  },                                                        
  {
    name: "products",
    label: "أسعار المنتجات",
    type: "array",
  },
];