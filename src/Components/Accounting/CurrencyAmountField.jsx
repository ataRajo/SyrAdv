import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * يعرض حقل المبلغ (بتسمية تعكس عملة الصندوق المختار: $ أو ل.س)، وحقل
 * سعر الصرف تلقائيًا فقط عندما يكون الصندوق المختار بالليرة السورية -
 * إن كان بالدولار (أو لم يُختر بعد)، سعر الصرف لا يظهر إطلاقًا (نفس
 * السلوك القديم تمامًا، بلا أي تغيير مرئي).
 */
const CurrencyAmountField = ({
  cashAccounts = [],
  selectedCashboxId,
  amount,
  onAmountChange,
  exchangeRate,
  onExchangeRateChange,
  amountRequired = true,
}) => {
  const selectedAccount = cashAccounts.find((a) => String(a.id) === String(selectedCashboxId));
  const currency = selectedAccount?.currency || "USD";
  const isForeign = currency !== "USD";

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>{isForeign ? "المبلغ (ل.س)" : "المبلغ ($)"}</Label>
        <Input
          type="number"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          required={amountRequired}
        />
      </div>
      {isForeign && (
        <div className="space-y-2">
          <Label>سعر الصرف (كم ليرة = 1 دولار)</Label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="مثال: 15000"
            value={exchangeRate}
            onChange={(e) => onExchangeRateChange(e.target.value)}
            required
          />
        </div>
      )}
    </div>
  );
};

export default CurrencyAmountField;
