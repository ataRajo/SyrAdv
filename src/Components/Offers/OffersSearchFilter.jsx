import { Icon } from "@iconify/react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const OffersSearchFilter = ({
  search,
  active,
  expired,
  onSearch,
  onActiveChange,
  onExpiredChange,
  onClear,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px]">
        <Icon
          icon="mdi:magnify"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5"
        />
        <Input
          placeholder="البحث في العروض..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="pl-10 text-right bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          dir="rtl"
        />
      </div>

      {/* Active Filter */}
      <div className="min-w-[140px]">
        <Select
          value={active === "" ? "all" : active === true ? "active" : "inactive"}
          onValueChange={(value) => {
            if (value === "all") onActiveChange("");
            else if (value === "active") onActiveChange("true");
            else onActiveChange("false");
          }}
        >
          <SelectTrigger 
            className="text-right bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
            dir="rtl"
          >
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent 
            dir="rtl"
            className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          >
            <SelectItem 
              value="all"
              className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700"
            >
              جميع الحالات
            </SelectItem>
            <SelectItem 
              value="active"
              className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700"
            >
              نشط
            </SelectItem>
            <SelectItem 
              value="inactive"
              className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700"
            >
              غير نشط
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Expired Filter */}
      <div className="min-w-[140px]">
        <Select
          value={expired === "" ? "all" : expired === true ? "expired" : "valid"}
          onValueChange={(value) => {
            if (value === "all") onExpiredChange("");
            else if (value === "expired") onExpiredChange("true");
            else onExpiredChange("false");
          }}
        >
          <SelectTrigger 
            className="text-right bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
            dir="rtl"
          >
            <SelectValue placeholder="صلاحية العرض" />
          </SelectTrigger>
          <SelectContent 
            dir="rtl"
            className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          >
            <SelectItem 
              value="all"
              className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700"
            >
              جميع العروض
            </SelectItem>
            <SelectItem 
              value="expired"
              className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700"
            >
              منتهي الصلاحية
            </SelectItem>
            <SelectItem 
              value="valid"
              className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700"
            >
              ساري المفعول
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={onClear}
        title="مسح الفلاتر"
        className="shrink-0 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
      >
        <Icon icon="mdi:filter-remove" className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default OffersSearchFilter;