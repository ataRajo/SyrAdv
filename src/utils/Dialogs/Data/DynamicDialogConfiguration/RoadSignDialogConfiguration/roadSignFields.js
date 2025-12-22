export const roadSignFields1 = [
  {
    name: "template_id",
    label: "نوع النموذج",
    type: "select",
    dir: "rtl",
    dataKey: "template_id",
    valueKey: "id",
    displayKey: "model",
  },
  {
    name: "city_id",
    label: "المدينة",
    type: "select",
    dir: "rtl",
    dataKey: "cities",
    valueKey: "id",
    displayKey: "name",
  },
  {
    name: "region_id",
    label: "المنطقة",
    type: "select",
    dir: "rtl",
    dataKey: "regions",
    valueKey: "id",
    displayKey: "name",
  },
  { name: "place", label: "مكان التموضع", type: "text", dir: "rtl" },
  { name: "direction_one", label: "الإتجاه الأول ", type: "text", dir: "rtl" },
  {
    name: "image",
    label: "صورة اللوحة",
    type: "file",
    accept: "image/*",
  },
  {
    name: "map",
    type:"map"
  },
];

export const roadSignFields2 = [
  {
    name: "template_id",
    label: "نوع النموذج",
    type: "select",
    dir: "rtl",
    dataKey: "template_id",
    valueKey: "id",
    displayKey: "model",
  },
  {
    name: "city_id",
    label: "المدينة",
    type: "select",
    dir: "rtl",
    dataKey: "cities",
    valueKey: "id",
    displayKey: "name",
  },
  {
    name: "region_id",
    label: "المنطقة",
    type: "select",
    dir: "rtl",
    dataKey: "regions",
    valueKey: "id",
    displayKey: "name",
  },
  { name: "place", label: "مكان التموضع", type: "text", dir: "rtl" },
  { name: "direction_one", label: "الإتجاه الأول ", type: "text", dir: "rtl" },
  {
    name: "direction_two",
    label: "الإتجاه الثاني ",
    type: "text",
    dir: "rtl",
  },
  // ONLY ONE IMAGE FIELD - Will be used for both faces
  {
    name: "image",
    label: "صورة اللوحة (ستستخدم لكلا الوجهين)",
    type: "file",
    accept: "image/*",
  },
  {
    name: "map",
    type:"map"
  },
];

export const roadSignFieldsEdit = [
  { name: "place", label: "مكان التموضع", type: "text", dir: "rtl" },
  { name: "directions", label: "الإتجاه ", type: "text", dir: "rtl" },
    {
    name: "city_id",
    label: "المدينة",
    type: "select",
    dir: "rtl",
    dataKey: "cities",
    valueKey: "id",
    displayKey: "name",
  },
  {
    name: "region_id",
    label: "المنطقة",
    type: "select",
    dir: "rtl",
    dataKey: "regions",
    valueKey: "id",
    displayKey: "name",
  },
    {
    name: "image",
    label: "صورة اللوحة",
    type: "file",
    accept: "image/*",
  },

  // { name: "panels_number", label: "عدد اللوحات", type: "number", dir: "rtl" },
  // {
  //   name: "template_id",
  //   label: "نوع النموذج",
  //   type: "select",
  //   dir: "rtl",
  //   dataKey: "template_id",
  //   valueKey: "id",
  //   displayKey: "model",
  // },

  // {
  //   name: "image",
  //   label: "صورة اللوحة",
  //   type: "file",
  //   accept: "image/*",
  // },
  
   {
     name: "map",
     type:"map"
   },


];
