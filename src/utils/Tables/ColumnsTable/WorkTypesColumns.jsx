export const WorkTypesColumns = [
  {
    header: "ID",
    accessor: "id",
    prefixIcon: "mdi:identifier",
    className: "min-w-[80px]",
    cellClassName: "font-mono text-gray-500",
  },
  {
    header: "نوع العمل",
    accessor: "type",
    prefixIcon: "mdi:briefcase-outline",
    className: "min-w-[200px]",
    cellClassName: "font-medium",
  },
  {
    header: "عدد الزبائن",
    accessor: "count_of_customers",
    prefixIcon: "mdi:account-group",
    className: "min-w-[120px]",
    cellClassName: "text-center",
    format: (value) => value || 0,
  },
  {
    header: "تاريخ الإنشاء",
    accessor: "created_at",
    prefixIcon: "mdi:calendar-plus",
    className: "min-w-[150px]",
    format: (value) => {
      if (!value) return "—";
      const date = new Date(value);
      return date.toLocaleDateString("ar-SY", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    },
  },
];