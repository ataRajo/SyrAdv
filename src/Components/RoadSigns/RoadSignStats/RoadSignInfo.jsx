import React from 'react';
import { useGetRoadSignByIdQuery } from '../../../RtkQuery/Slice/RoadSings/RoadSingsApi';

const RoadSignInfo = ({ roadSignId }) => {
  const { data: roadSign, isLoading, error } = useGetRoadSignByIdQuery(roadSignId);

  if (isLoading) return <div className="text-center p-4">جاري تحميل معلومات اللوحة...</div>;
  if (error) return <div className="text-center p-4 text-red-500">خطأ في تحميل البيانات</div>;
  if (!roadSign) return <div className="text-center p-4">لا توجد بيانات</div>;

  const { template, city, region, bookings, available_date_ranges, booking_dates } = roadSign;
  
  // Calculate availability status
  const availabilityStatus = calculateAvailability(available_date_ranges, booking_dates, roadSign.panels_number);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          🛑 معلومات اللوحة الطرقية #{roadSign.id}
        </h3>
        <AvailabilityBadge status={availabilityStatus.status} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 border-b pb-2">المعلومات الأساسية</h4>
          <InfoItem label="المدينة" value={city?.name} />
          <InfoItem label="المنطقة" value={region?.name} />
          <InfoItem label="الموقع" value={roadSign.place} />
         
            
            {/*
            <InfoItem label="حالة التوفر" value={availabilityStatus.text} />
         <InfoItem label="الاتجاهات" value={roadSign.directions} />
          <InfoItem label="اللوحات المتاحة الآن" value={availabilityStatus.availableNow} />
            
            */}
          
        </div>

        {/* Template Information */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 border-b pb-2">مواصفات القالب</h4>
          <InfoItem label="الموديل" value={template?.model} />
          <InfoItem label="النوع" value={template?.type} />
          <InfoItem label="الحجم" value={template?.size} />
          {/*
         
         <InfoItem label="المساحة الإعلانية" value={`${template?.advertising_space} m²`} />
          <InfoItem label="المساحة الطباعية" value={`${template?.printing_space} m²`} />

          */}
          
        </div>

        {/* Statistics */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 border-b pb-2">الإحصائيات</h4>
          <InfoItem label="عدد اللوحات" value={roadSign.panels_number} />
          <InfoItem label="عدد الوجوه" value={roadSign.faces_number} />
          {/*
            <InfoItem label="إجمالي الحجوزات" value={bookings?.length || 0} />
          <InfoItem label="الحجوزات النشطة" value={booking_dates?.length || 0} />
          <InfoItem label="إجمالي أيام التوفر" value={availabilityStatus.totalAvailableDays} />
          
          */}
        
        </div>
      </div>

      {/* Availability Timeline */}
      {available_date_ranges && available_date_ranges.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">فترات التوفر</h4>
          <div className="space-y-2">
            {available_date_ranges.map((range, index) => (
              <div key={index} className="flex justify-between items-center bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {formatDate(range.start_date)} - {formatDate(range.end_date)}
                </span>
                <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                  {range.available_panels} لوحة متاحة ({range.days} يوم)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Bookings */}
      {booking_dates && booking_dates.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">الحجوزات الحالية</h4>
          <div className="space-y-2">
            {booking_dates.map((booking, index) => (
              <div key={index} className="flex justify-between items-center bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
                </span>
                <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
                  {booking.panels_reserved} لوحة محجوزة ({booking.days} يوم)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coordinates */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem label="خط العرض" value={roadSign.latitudeX} />
          <InfoItem label="خط الطول" value={roadSign.longitudeY} />
        </div>
      </div>
    </div>
  );
};

// Availability Badge Component
const AvailabilityBadge = ({ status }) => {
  const getBadgeStyle = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'partially_available':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'fully_booked':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getBadgeText = (status) => {
    switch (status) {
      case 'available':
        return '🟢 متاحة بالكامل';
      case 'partially_available':
        return '🟡 متاحة جزئياً';
      case 'fully_booked':
        return '🔴 محجوزة بالكامل';
      default:
        return '⚫ غير معروف';
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getBadgeStyle(status)}`}>
      {getBadgeText(status)}
    </span>
  );
};

// Calculate availability status
const calculateAvailability = (availableRanges, bookingDates, totalPanels) => {
  if (!availableRanges || availableRanges.length === 0) {
    return { status: 'fully_booked', text: 'محجوزة بالكامل', availableNow: 0, totalAvailableDays: 0 };
  }

  // Get current available panels (from the first available range which should be current)
  const currentAvailable = availableRanges[0]?.available_panels || 0;
  const totalAvailableDays = availableRanges.reduce((sum, range) => sum + range.days, 0);

  let status, text;

  if (currentAvailable === totalPanels) {
    status = 'available';
    text = 'متاحة بالكامل';
  } else if (currentAvailable > 0) {
    status = 'partially_available';
    text = `متاحة جزئياً (${currentAvailable}/${totalPanels})`;
  } else {
    status = 'fully_booked';
    text = 'محجوزة بالكامل';
  }

  return {
    status,
    text,
    availableNow: currentAvailable,
    totalAvailableDays
  };
};

const InfoItem = ({ label, value }) => (
  <div className="flex justify-between items-center">
    <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">{label}:</span>
    <span className="text-gray-900 dark:text-white font-semibold">{value || 'غير متوفر'}</span>
  </div>
);

const formatDate = (dateString) => {
  if (!dateString) return 'غير محدد';
  return new Date(dateString).toLocaleDateString('ar-EG');
};

export default RoadSignInfo;