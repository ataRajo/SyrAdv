import React from 'react';
import { Loader } from "lucide-react";
import { 
  calculateTotalAdvertisingSpace,
  weeklyTableColumns,
  detailsTableColumns 
} from './ReportUtils';

const DataTableSection = ({
  isWeeklyReport,
  activeTab,
  setActiveTab,
  currentData,
  processDetailsData,
  isFetching,
  templateNameFilter,
  customerId,
  formatArabicDate,
  startDate,
  endDate
}) => {
  const tableColumns = isWeeklyReport ? weeklyTableColumns : detailsTableColumns;

  return (
    <div className="space-y-4">
      {/* Tabs for Available/Unavailable - Only for Details Report */}
      {!isWeeklyReport && (
        <div className="flex justify-center mb-4">
          <div className="inline-flex rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setActiveTab("available")}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === "available"
                  ? "bg-green-500 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              اللوحات المتاحة ({processDetailsData.available?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("unavailable")}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === "unavailable"
                  ? "bg-red-500 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              اللوحات المحجوزة ({processDetailsData.unavailable?.length || 0})
            </button>
          </div>
        </div>
      )}

      {/* Data Summary */}
      {currentData.length > 0 && (
        <div className={`p-3 rounded-lg mb-4 ${
          (isWeeklyReport || activeTab === "unavailable") 
            ? "bg-red-50 dark:bg-red-900/20" 
            : "bg-green-50 dark:bg-green-900/20"
        }`}>
          <h3 className={`font-semibold ${
            (isWeeklyReport || activeTab === "unavailable")
              ? "text-red-700 dark:text-red-300" 
              : "text-green-700 dark:text-green-300"
          }`}>
            {isWeeklyReport ? 'اللوحات المحجوزة' : `اللوحات ${activeTab === "available" ? 'المتاحة' : 'المحجوزة'}`}: {currentData.length} لوحة
            {templateNameFilter && ` | مفلتر حسب القالب: "${templateNameFilter}"`}
            {customerId && ` | مفلتر حسب العميل: "${customerId}"`}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            إجمالي الأمتار الإعلانية: {calculateTotalAdvertisingSpace(currentData)} متر مربع
          </p>
        </div>
      )}

      {/* Data Table */}
      {currentData.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900">
                {tableColumns.map((column, index) => (
                  <th key={index} className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300 border-b">
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentData.map((item, index) => (
                <tr key={item.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b">
                  {tableColumns.map((column, colIndex) => (
                    <td key={colIndex} className={`px-4 py-3 text-right ${column.cellClassName ? 
                      (typeof column.cellClassName === 'function' ? column.cellClassName(item) : column.cellClassName) 
                      : ''}`}>
                      {column.cell ? column.cell(item) : item[column.accessor]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center p-8 text-gray-500">
          {isFetching ? (
            <div className="flex items-center justify-center gap-2">
              <Loader className="w-4 h-4 animate-spin" />
              <span>جاري تحميل البيانات...</span>
            </div>
          ) : (
            <>
              <p>لا توجد لوحات {isWeeklyReport ? 'محجوزة' : (activeTab === "available" ? 'متاحة' : 'محجوزة')} تطابق الفلاتر المحددة</p>
              {templateNameFilter && (
                <p className="text-sm text-red-600 mt-2">
                  لا توجد لوحات للقالب: "{templateNameFilter}"
                </p>
              )}
              {isWeeklyReport && (
                <p className="text-sm text-blue-600 mt-2">
                  الفترة: {formatArabicDate(startDate)} - {formatArabicDate(endDate)}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DataTableSection;