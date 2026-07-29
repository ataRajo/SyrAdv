import React from "react";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const BookingFilter = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClear,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2">
        <Icon icon="mdi:calendar-filter" className="text-blue-500 w-5 h-5" />
        <span className="font-medium text-gray-700 dark:text-gray-300">
          تصفية بالتاريخ:
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <Label
          htmlFor="filterStartDate"
          className="text-xs text-gray-500 dark:text-gray-400"
        >
          من
        </Label>
        <Input
          id="filterStartDate"
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="w-40 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label
          htmlFor="filterEndDate"
          className="text-xs text-gray-500 dark:text-gray-400"
        >
          إلى
        </Label>
        <Input
          id="filterEndDate"
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          min={startDate}
          className="w-40 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
        />
      </div>

      {(startDate || endDate) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <Icon icon="mdi:close-circle" className="w-4 h-4 ml-1" />
          مسح
        </Button>
      )}
    </div>
  );
};

export default BookingFilter;