import React from 'react';
import { useGetRoadSignByIdQuery } from '../../../RtkQuery/Slice/RoadSings/RoadSingsApi';

const RoadsignHistory = ({ roadSignId }) => {
  const { data: roadSign, isLoading, error } = useGetRoadSignByIdQuery(roadSignId);

  if (isLoading) return <div className="text-center p-4">جاري تحميل سجل الحجوزات...</div>;
  if (error) return <div className="text-center p-4 text-red-500">خطأ في تحميل البيانات</div>;

  const bookings = roadSign?.bookings || [];

  if (bookings.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">📜 سجل الحجوزات</h3>
        <p className="text-gray-500 dark:text-gray-400 text-center">لا توجد حجوزات سابقة</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">📜 سجل الحجوزات ({bookings.length})</h3>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                العميل
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                من
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                إلى
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                المدة
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                السعر
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                الحالة
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {getCustomerName(booking.customer)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {formatDate(booking.start_date)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {formatDate(booking.end_date)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {booking.duration_of_days || calculateDays(booking.start_date, booking.end_date)} يوم
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {booking.total_price} ₿
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    getStatusStyle(booking.status)
                  }`}>
                    {getBookingStatus(booking.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Helper functions
const getCustomerName = (customer) => {
  if (!customer) return 'غير محدد';
  return customer.full_name || customer.company_name || 'غير محدد';
};

const formatDate = (dateString) => {
  if (!dateString) return 'غير محدد';
  return new Date(dateString).toLocaleDateString('ar-EG');
};

const calculateDays = (start, end) => {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  return Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
};

const getBookingStatus = (status) => {
  const statusMap = {
    1: 'مفعل',
    2: 'معلق',
    0: 'ملغى'
  };
  return statusMap[status] || 'غير معروف';
};

const getStatusStyle = (status) => {
  const styleMap = {
    1: 'bg-green-100 text-green-800',
    2: 'bg-yellow-100 text-yellow-800', 
    0: 'bg-red-100 text-red-800'
  };
  return styleMap[status] || 'bg-gray-100 text-gray-800';
};

export default RoadsignHistory;