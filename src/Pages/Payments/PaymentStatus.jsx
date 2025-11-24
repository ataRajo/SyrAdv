import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Status constants matching backend
export const PAYMENT_STATUS_VALUES = {
  ALL: null,
  WAITING: 1,
  ACCEPTED: 2,
  REJECTED: 3,
};

const PaymentStatusFilter = ({ value, onChange }) => {
  
  return (
    <div className="flex items-center gap-2 bg-card p-3 rounded-lg border border-border">
      <label className="text-sm font-medium whitespace-nowrap">
        تصفية حسب الحالة:
      </label>
      <Select 
        value={value?.toString() || "all"} 
        onValueChange={(val) => onChange(val === "all" ? null : parseInt(val))}
      >
        <SelectTrigger className="w-[160px] bg-white">
          <SelectValue placeholder="اختر الحالة" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">📋 الكل</SelectItem>
          <SelectItem value="1">⏳ بالانتظار</SelectItem>
          <SelectItem value="2">✅ مقبول</SelectItem>
          <SelectItem value="3">❌ مرفوض</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default PaymentStatusFilter;