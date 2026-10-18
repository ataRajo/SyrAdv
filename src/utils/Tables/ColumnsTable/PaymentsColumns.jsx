import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdatePaymentStatusMutation } from "../../../RtkQuery/Slice/Payments/PaymentsApi";

// Status mapping: backend values to display text
export const PAYMENT_STATUS = {
  WAITING: { value: 1, label: "بالانتظار", emoji: "⏳", color: "text-yellow-600" },
  ACCEPTED: { value: 2, label: "مقبول", emoji: "✅", color: "text-green-600" },
  REJECTED: { value: 3, label: "مرفوض", emoji: "❌", color: "text-red-600" },
};

// Helper component: safe for hooks
const StatusDropdown = ({ payment }) => {
  const [loading, setLoading] = useState(false);
  const [updatePaymentStatus] = useUpdatePaymentStatusMutation();

  const currentStatus =
    Object.values(PAYMENT_STATUS).find((s) => s.value === payment.status) ||
    PAYMENT_STATUS.WAITING;

  const handleChange = async (value) => {
    setLoading(true);
    try {
      await updatePaymentStatus({ id: payment.id, status: parseInt(value) }).unwrap();
    } catch (err) {
      console.error("Error updating status", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Select
      value={payment.status?.toString()}
      onValueChange={handleChange}
      disabled={loading}
    >
      <SelectTrigger
        className={`w-[140px] border rounded-md text-center bg-white ${currentStatus.color} ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <SelectValue>
          {loading ? "⏳ جاري التحديث..." : `${currentStatus.emoji} ${currentStatus.label}`}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.values(PAYMENT_STATUS).map((status) => (
          <SelectItem key={status.value} value={status.value.toString()}>
            {status.emoji} {status.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

// Columns definition
export const PaymentsColumns = [
  {
    header: "رقم الدفعة",
    accessor: "payment_number",
    className: "min-w-[90px]",
    cellClassName: "font-mono",
    priority: 1,
    cell: ({ row }) => <span className="font-mono">{row.payment_number ?? "-"}</span>,
  },
  {
    header: "اسم الشركة",
    accessor: "customer.company_name",
    className: "min-w-[120px] sm:min-w-[150px] md:min-w-[200px] lg:min-w-[250px]",
    cellClassName: "font-medium",
    priority: 1,
  },
  /*
  {
    header: "المبلغ الكلي",
    accessor: "total",
    format: (value) => `${parseInt(value) || 0}`, 
    className: "text-right min-w-[100px] sm:min-w-[120px] md:min-w-[150px]",
    cellClassName: "text-right font-mono",
    priority: 2,
  },
  */

  {
    header: "المبلغ المدفوع",
    accessor: "paid",
    format: (value) => `${parseInt(value) || 0}`, 
    className: "text-right min-w-[100px] sm:min-w-[120px] md:min-w-[150px]",
    cellClassName: "text-right font-mono",
    priority: 3,
  },
  /*
  {
    header: "المبلغ الباقي",
    accessor: "remaining",
    format: (value) => `${parseInt(value) || 0}`, 
    className: "text-right min-w-[100px] sm:min-w-[120px] md:min-w-[150px]",
    cellClassName: "text-right font-mono",
    priority: 4,
  },
  */
 
  {
    header: "التاريخ",
    accessor: "date",
    className: "min-w-[100px] sm:min-w-[120px] md:min-w-[150px]",
    priority: 5,
  },
  {
    header: "الحالة",
    accessor: "status",
    className: "min-w-[140px]",
    priority: 6,
    cell: ({ row }) => <StatusDropdown payment={row} />, 
  },
];