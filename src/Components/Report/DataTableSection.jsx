import React from 'react';
import { Loader, MapPin, ExternalLink } from "lucide-react";
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
  // Function to handle live location click
  const handleLiveLocation = (lat, lng, placeName) => {
    if (lat && lng) {
      // Open in Google Maps
      const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
      window.open(googleMapsUrl, '_blank');
      
      // Optional: Log for debugging
      console.log(`Opening location for ${placeName}: ${lat}, ${lng}`);
    } else {
      console.warn('No coordinates available for this location');
      alert('لا توجد إحداثيات متاحة لهذا الموقع');
    }
  };

  // Define table columns with live location column
  const getTableColumns = () => {
    if (isWeeklyReport) {
      return [
        ...weeklyTableColumns,
        {
          header: 'الموقع المباشر',
          accessor: 'live_location',
          cell: (item) => {
            const lat = item.latitudeX || item.lat;
            const lng = item.longitudeY || item.lng;
            const hasCoordinates = lat && lng;
            
            return (
              <button
                onClick={() => handleLiveLocation(lat, lng, item.place || item.name)}
                disabled={!hasCoordinates}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  hasCoordinates 
                    ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg transform hover:scale-105' 
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>عرض الموقع</span>
                {hasCoordinates && <ExternalLink className="w-3 h-3" />}
              </button>
            );
          },
          cellClassName: "text-center"
        }
      ];
    } else {
      // Details report columns
      const baseColumns = [...detailsTableColumns];
      
      // Add type indicator column for details report only
      const typeColumn = {
        header: 'نوع الحجز',
        accessor: 'booking_type',
        cell: (item) => {
          if (item.bookings && item.bookings.some(booking => booking.type === 1)) {
            return (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-xs font-medium">
                مؤقت
              </span>
            );
          }
          return null;
        },
        cellClassName: "text-center"
      };
      
      // Add live location column
      const locationColumn = {
        header: 'الموقع المباشر',
        accessor: 'live_location',
        cell: (item) => {
          const lat = item.latitudeX || item.lat;
          const lng = item.longitudeY || item.lng;
          const hasCoordinates = lat && lng;
          
          return (
       <button
  onClick={() => handleLiveLocation(lat, lng, item.place || item.name)}
  disabled={!hasCoordinates}
  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-sm font-medium transition-all duration-200 ${
    hasCoordinates 
      ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow-md transform hover:scale-105' 
      : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
  }`}
>
  <MapPin className="w-3 h-3" />
  <span>عرض الموقع</span>
  {hasCoordinates && <ExternalLink className="w-2.5 h-2.5" />}
</button>

          );
        },
        cellClassName: "text-center"
      };
      
      // Insert columns at position 2
      const updatedColumns = [...baseColumns];
      updatedColumns.splice(2, 0, typeColumn, locationColumn);
      return updatedColumns;
    }
  };

  const tableColumns = getTableColumns();

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
                  {tableColumns.map((column, colIndex) => {
                    // Special handling for live_location and booking_type columns
                    if (column.accessor === 'live_location' || column.accessor === 'booking_type') {
                      return (
                        <td key={colIndex} className={`px-4 py-3 text-right ${column.cellClassName || ''}`}>
                          {column.cell(item)}
                        </td>
                      );
                    }
                    
                    // Regular columns
                    return (
                      <td key={colIndex} className={`px-4 py-3 text-right ${column.cellClassName ? 
                        (typeof column.cellClassName === 'function' ? column.cellClassName(item) : column.cellClassName) 
                        : ''}`}>
                        {column.cell ? column.cell(item) : item[column.accessor]}
                      </td>
                    );
                  })}
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