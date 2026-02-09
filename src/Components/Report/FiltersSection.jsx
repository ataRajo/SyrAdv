import React from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar, X } from "lucide-react";
import { calculateEndDate } from './ReportUtils';

const FiltersSection = ({
  isWeeklyReport,
  cityId,
  setCityId,
  regionId,
  setRegionId,
  templateNameFilter,
  setTemplateNameFilter,
  productTypeFilter,
  setProductTypeFilter,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  placeFilter,
  setPlaceFilter,
  cities,
  isCitiesLoading,
  getRegionsForCity,
  templateOptions,
  customerOptions,
  clearAllFilters
}) => {
  return (
    <>
      {isWeeklyReport && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <Label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              من تاريخ
            </Label>
            
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => {
                  const newStartDate = e.target.value;
                  setStartDate(newStartDate);
                  if (newStartDate) {
                    const newEndDate = calculateEndDate(newStartDate, 6);
                    setEndDate(newEndDate);
                  }
                }}
                className="w-full pl-10 p-2 border dark:bg-gray-900 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="productTypeFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              نوع المنتج
            </Label>
            <select
              id="productTypeFilter"
              value={productTypeFilter}
              onChange={(e) => {
                setProductTypeFilter(e.target.value);
              }}
              className="w-full p-2 border dark:bg-gray-900 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع الأنواع</option>
              <option value="1">محلي</option>
              <option value="2">اجنبي</option>
              <option value="3">محلي واجنبي</option>
            </select>
          </div>

          <div>
            <Label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              إلى تاريخ
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                }}
                className="w-full pl-10 p-2 border dark:bg-gray-900 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-end">
            <Button
              onClick={clearAllFilters}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white"
            >
              مسح جميع الفلاتر
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* باقي الفلاتر كما هي بدون تغيير */}
        <div>
          <Label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            المدينة
          </Label>
          <select
            id="city"
            value={cityId}
            onChange={(e) => {
              setCityId(e.target.value);
              setRegionId(""); // Reset region when city changes
            }}
            disabled={isCitiesLoading}
            className="w-full p-2 border dark:bg-gray-900 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">جميع المدن</option>
            {isCitiesLoading && <option>جاري تحميل المدن ...</option>}
            {cities?.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </div>

        {cityId && (
          <div>
            <Label htmlFor="region" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              المنطقة
            </Label>
            <select
              id="region"
              value={regionId}
              onChange={(e) => {
                setRegionId(e.target.value);
              }}
              className="w-full p-2 border dark:bg-gray-900 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع المناطق</option>
              {getRegionsForCity().map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <Label htmlFor="templateFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            اسم القالب
          </Label>
          <select
            id="templateFilter"
            value={templateNameFilter}
            onChange={(e) => {
              setTemplateNameFilter(e.target.value);
            }}
            className="w-full p-2 border dark:bg-gray-900 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">جميع القوالب</option>
            {templateOptions.length > 0 ? (
              templateOptions.map((templateName, index) => (
                <option key={index} value={templateName}>
                  {templateName}
                </option>
              ))
            ) : (
              <option disabled>لا توجد قوالب في البيانات</option>
            )}
          </select>
          {templateNameFilter && (
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-green-600">✓ تم تطبيق الفلتر</span>
              <button
                onClick={() => setTemplateNameFilter("")}
                className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                type="button"
              >
                <X size={12} />
                إزالة الفلتر
              </button>
            </div>
          )}
        </div>

        {isWeeklyReport ? (
          <div>
            <Label htmlFor="placeFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              المكان (تموضع)
            </Label>
            <input
              type="text"
              id="placeFilter"
              value={placeFilter}
              onChange={(e) => setPlaceFilter(e.target.value)}
              placeholder="اكتب اسم المكان"
              className="w-full p-2 border dark:bg-gray-900 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {placeFilter && (
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-green-600">✓ تم تطبيق فلتر المكان</span>
                <button
                  onClick={() => setPlaceFilter("")}
                  className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                  type="button"
                >
                  <X size={12} />
                  إزالة الفلتر
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <Label htmlFor="placeFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              المكان (تموضع)
            </Label>
            <input
              type="text"
              id="placeFilter"
              value={placeFilter}
              onChange={(e) => setPlaceFilter(e.target.value)}
              placeholder="اكتب اسم المكان"
              className="w-full p-2 border dark:bg-gray-900 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {placeFilter && (
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-green-600">✓ تم تطبيق فلتر المكان</span>
                <button
                  onClick={() => setPlaceFilter("")}
                  className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                  type="button"
                >
                  <X size={12} />
                  إزالة الفلتر
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default FiltersSection;