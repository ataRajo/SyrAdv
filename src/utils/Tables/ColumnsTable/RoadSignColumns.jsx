const ProductType = {
  1: "Local",
  2: "Foreign",
  3: "Both",
};

export const RoadSignColumns = [
   
     {
      header: "نموذج",
      accessor: "template.model",
      prefixIcon: "mdi:package-variant",
      className: "min-w-[80px] sm:min-w-[100px] md:min-w-[120px]",
      priority: 8,
    },
    {
      header: "القياس",
      accessor: "template.size",
      prefixIcon: "mdi:ruler-square",
      // format: (value) => `$${parseFloat(value).toFixed(2)}`,
      className: "text-right min-w-[80px] sm:min-w-[100px] md:min-w-[120px]",
      cellClassName: "text-right font-mono",
      priority: 7,
    },
    {
      header: "المدينة",
      accessor: "city.name",
      prefixIcon: "mdi:city",
      className: "min-w-[80px] sm:min-w-[100px] md:min-w-[120px]",
      priority: 9,
    },
    {
      header: "المنطقة",
      accessor: "region.name",
      prefixIcon: "mdi:map",
      className: "min-w-[80px] sm:min-w-[100px] md:min-w-[120px]",
      priority: 10,
    },
    {
      header: "  الإتجاه",
      accessor: "directions",
      prefixIcon: "mdi:compass",
      className: "text-right min-w-[80px]  sm:min-w-[100px] md:min-w-[120px]",
      cellClassName: "text-right font-mono",
      priority: 6,
    },
     {
      header: "عدد الوجوه",
      accessor: "panels_number",
      prefixIcon: "mdi:package-variant",
      className: "min-w-[80px] sm:min-w-[100px] md:min-w-[120px]",
      priority: 8,
    },
    
   
    
  ];