import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useGetRoadSignByIdQuery } from '../../../RtkQuery/Slice/RoadSings/RoadSingsApi';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const StatisticalCharts = ({ roadSignId }) => {
  const { data: roadSign, isLoading, error } = useGetRoadSignByIdQuery(roadSignId);

  if (isLoading) return <div className="text-center p-4">جاري تحميل الإحصائيات...</div>;
  if (error) return <div className="text-center p-4 text-red-500">خطأ في تحميل البيانات</div>;

  const bookings = roadSign?.bookings || [];

  // Prepare chart data
  const customerData = prepareCustomerData(bookings);
  const monthlyData = prepareMonthlyData(bookings);
  const statusData = prepareStatusData(bookings);

  if (bookings.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">📈 الإحصائيات</h3>
        <p className="text-gray-500 dark:text-gray-400 text-center">لا توجد بيانات إحصائية</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">📈 الإحصائيات</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Distribution Pie Chart */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">توزيع الحجوزات حسب العميل</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={customerData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name} (${value})`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {customerData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      
      </div>

      {/* Monthly Bookings */}
      <div className="mt-6 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">الحجوزات الشهرية</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="bookings" fill="#00C49F" name="عدد الحجوزات" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Data preparation functions
const prepareCustomerData = (bookings) => {
  const customerCount = {};
  bookings.forEach(booking => {
    const customerName = getCustomerName(booking.customer);
    customerCount[customerName] = (customerCount[customerName] || 0) + 1;
  });

  return Object.entries(customerCount)
    .map(([name, value]) => ({
      name: name.length > 10 ? name.substring(0, 10) + '...' : name,
      value
    }))
    .sort((a, b) => b.value - a.value);
};

const getCustomerName = (customer) => {
  if (!customer) return 'غير محدد';
  return customer.company_name || 'غير محدد';
};

const prepareMonthlyData = (bookings) => {
  const monthCount = {};
  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  
  bookings.forEach(booking => {
    if (booking.start_date) {
      const month = new Date(booking.start_date).getMonth();
      monthCount[month] = (monthCount[month] || 0) + 1;
    }
  });

  return months.map((month, index) => ({
    month,
    bookings: monthCount[index] || 0
  }));
};

const prepareStatusData = (bookings) => {
  const statusCount = {
    'مفعل': 0,
    'معلق': 0,
    'ملغى': 0
  };

  bookings.forEach(booking => {
    const status = getBookingStatus(booking.status);
    statusCount[status] = (statusCount[status] || 0) + 1;
  });

  return Object.entries(statusCount).map(([status, count]) => ({
    status,
    count
  }));
};

const getBookingStatus = (status) => {
  const statusMap = {
    1: 'مفعل',
    2: 'معلق',
    0: 'ملغى'
  };
  return statusMap[status] || 'غير معروف';
};

export default StatisticalCharts;