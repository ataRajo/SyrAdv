import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  // ← FIXED: unique accessor, no onViewCustomers prop needed
  {
    header: "الزبائن",
    accessor: "customers_count", // ← changed from "id" to unique value
    className: "min-w-[80px]",
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="sm"
        className="text-blue-600 hover:text-blue-800"
        onClick={() => {
          // Dispatch custom event instead of using prop
          window.dispatchEvent(new CustomEvent('viewWorkTypeCustomers', { detail: row }));
        }}
        title="عرض الزبائن"
      >
        <Eye className="h-4 w-4" />
      </Button>
    ),
  },
];