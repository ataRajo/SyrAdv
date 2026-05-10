import React, { useState } from 'react';
import { useGetRoadSignByIdQuery } from '../../../RtkQuery/Slice/RoadSings/RoadSingsApi';

const RoadSignInfo = ({ roadSignId }) => {
  const { data: roadSign, isLoading, error } = useGetRoadSignByIdQuery(roadSignId);

  if (isLoading) return <div className="text-center p-4">جاري تحميل معلومات اللوحة...</div>;
  if (error) return <div className="text-center p-4 text-red-500">خطأ في تحميل البيانات</div>;
  if (!roadSign) return <div className="text-center p-4">لا توجد بيانات</div>;

  // ✅ SIMPLE LOGIC: Check bookings array
  const isAvailable = !roadSign.bookings || roadSign.bookings.length === 0;
  
  // Status based on bookings array
  const status = isAvailable ? 'available' : 'fully_booked';
  const statusText = isAvailable ? '🟢 متاحة' : '🔴 محجوزة';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          🛑 معلومات اللوحة الطرقية #{roadSign.id}
        </h3>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
          isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {statusText}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 border-b pb-2">المعلومات الأساسية</h4>
          <InfoItem label="المدينة" value={roadSign.city?.name} />
          <InfoItem label="المنطقة" value={roadSign.region?.name} />
          <InfoItem label="الموقع" value={roadSign.place} />
          <InfoItem label="الاتجاهات" value={roadSign.directions} />
          <InfoItem label="الكود" value={roadSign.roadsign_code} />
          <InfoItem label="حالة التوفر" value={isAvailable ? 'متاحة' : 'محجوزة'} />
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 border-b pb-2">مواصفات القالب</h4>
          <InfoItem label="الموديل" value={roadSign.template?.model} />
          <InfoItem label="النوع" value={roadSign.template?.type} />
          <InfoItem label="الحجم" value={roadSign.template?.size} />
          <InfoItem label="المساحة الطباعية" value={`${roadSign.template?.printing_space} m²`} />
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 border-b pb-2">الإحصائيات</h4>
          <InfoItem label="عدد اللوحات" value={roadSign.panels_number} />
          <InfoItem label="عدد الوجوه" value={roadSign.faces_number} />
          <InfoItem label="عدد الحجوزات" value={roadSign.bookings?.length || 0} />
          <InfoItem label="حالة الحجوزات" value={
            roadSign.bookings?.length === 0 ? 'لا توجد حجوزات' : `محجوزة (${roadSign.bookings?.length})`
          } />
          <InfoItem label="الإتجاه" value={roadSign.direction_code ? `الاتجاه ${roadSign.direction_code}` : "غير محدد"} />
        </div>
      </div>

      {/* Show bookings if they exist */}
      {roadSign.bookings && roadSign.bookings.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">الحجوزات النشطة ({roadSign.bookings.length})</h4>
          <div className="space-y-3">
            {roadSign.bookings.map((booking, index) => (
              <div key={index} className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">رقم الحجز:</span>
                    <div className="font-semibold">{booking.id}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">من تاريخ:</span>
                    <div className="font-semibold">{formatDate(booking.start_date)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">إلى تاريخ:</span>
                    <div className="font-semibold">{formatDate(booking.end_date)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">الحالة:</span>
                    <div className="font-semibold text-red-600 dark:text-red-400">محجوز</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAvailable && (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex items-center">
            <span className="text-2xl mr-2">✅</span>
            <div>
              <h4 className="font-semibold text-green-800 dark:text-green-300">اللوحة متاحة للحجز</h4>
              <p className="text-sm text-green-700 dark:text-green-400">
                لا توجد حجوزات نشطة على هذه اللوحة. يمكن حجزها الآن.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem label="خط العرض" value={roadSign.latitudeX} />
          <InfoItem label="خط الطول" value={roadSign.longitudeY} />
        </div>
      </div>

      {roadSign.image && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">صورة اللوحة</h4>
          <img 
            src={roadSign.image} 
            alt={`لوحة ${roadSign.id}`}
            className="max-w-full h-auto max-h-64 rounded-lg shadow-md object-cover"
          />
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500">
        <p><strong>منطق التوفر:</strong> {isAvailable ? 'متاحة (bookings array is empty)' : 'محجوزة (bookings array has items)'}</p>
        <p><strong>عدد الحجوزات:</strong> {roadSign.bookings?.length || 0}</p>
      </div>
    </div>
  );
};

const InfoItem = ({ label, value }) => (
  <div className="flex justify-between items-center">
    <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">{label}:</span>
    <span className="text-gray-900 dark:text-white font-semibold">
      {value !== null && value !== undefined ? value : 'غير متوفر'}
    </span>
  </div>
);

const formatDate = (dateString) => {
  if (!dateString) return 'غير محدد';
  return new Date(dateString).toLocaleDateString('ar-EG');
};

export default RoadSignInfo;