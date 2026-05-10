import React, { useState, useMemo } from 'react';
import { useGetOccupancyRateQuery } from '../../RtkQuery/Slice/RoadSings/RoadSingsApi';
import { useGetCitiesQuery } from '../../RtkQuery/Slice/CitiesAndRegions/CitiesAndRegionsApi';
import { useGetAllTemplatesQuery } from '../../RtkQuery/Slice/Template/TemplateApi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import {
  IconChartInfographic,
  IconPercentage,
  IconTemplate,
  IconClick,
  IconAlertCircle,
  IconLoader2,
  IconChartBar,
  IconChartPie,
  IconChevronLeft,
  IconChevronRight,
  IconArrowsSort,
  IconTrendingUp,
  IconSquareRounded,
  IconCalendarMonth,
  IconRefresh,
  IconWaveSine,
  IconFilter,
  IconX
} from '@tabler/icons-react';

export default function Precentage() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [chartView, setChartView] = useState('bar');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState('desc');
  const itemsPerPage = 5;
  
  // Filters state
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [cityIdFilter, setCityIdFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch cities and templates for filter dropdowns
  const { data: citiesData, isLoading: citiesLoading } = useGetCitiesQuery();
  const { data: templatesData, isLoading: templatesLoading } = useGetAllTemplatesQuery();

  const { data, isLoading, isError, error, refetch } = useGetOccupancyRateQuery(
    { 
      month: selectedMonth,
      template_id: selectedTemplateId || undefined,
      city_id: cityIdFilter || undefined
    },
    { skip: !selectedMonth }
  );

  // Process cities data - cities API returns array directly
  const cities = useMemo(() => {
    if (!citiesData) return [];
    const citiesArray = Array.isArray(citiesData) ? citiesData : citiesData.data || [];
    return citiesArray.map(city => ({
      id: city.id,
      name: city.name
    }));
  }, [citiesData]);

  // Process templates data
  const templatesList = useMemo(() => {
    if (!templatesData) return [];
    const templatesArray = Array.isArray(templatesData) ? templatesData : templatesData.data || [];
    return templatesArray;
  }, [templatesData]);

  // Clear all filters
  const clearFilters = () => {
    setSelectedTemplateId('');
    setCityIdFilter('');
  };

  // Check if any filter is active
  const hasActiveFilters = selectedTemplateId || cityIdFilter;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <IconLoader2 className="animate-spin text-blue-500 dark:text-blue-400" size={56} />
          <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/20"></div>
        </div>
        <p className="text-gray-500 dark:text-gray-400 font-medium">جاري تحميل الإحصائيات...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-full">
          <IconAlertCircle size={56} className="text-red-500 dark:text-red-400" />
        </div>
        <p className="text-lg font-medium text-red-600 dark:text-red-400">حدث خطأ في تحميل البيانات</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{error?.data?.message || 'يرجى المحاولة مرة أخرى'}</p>
        <button
          onClick={() => refetch()}
          className="mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all flex items-center gap-2"
        >
          <IconRefresh size={18} />
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const overallRate = data?.overall_occupancy_percentage || 0;
  const templates = data?.templates || [];
  const totalAdvertisingMeters = data?.total_advertising_meters || 0;
  const reservedAdvertisingMeters = data?.reserved_advertising_meters || 0;
  const dailyRates = data?.daily_rates || [];
  
  const activeTemplates = templates.filter(t => t.reservation_percentage > 0);
  const totalTemplatesCount = templates.length;

  // Sort templates by reservation percentage
  const sortedTemplates = [...templates].sort((a, b) => {
    if (sortOrder === 'desc') {
      return b.reservation_percentage - a.reservation_percentage;
    } else {
      return a.reservation_percentage - b.reservation_percentage;
    }
  });

  // Calculate pagination
  const totalPages = Math.ceil(sortedTemplates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTemplates = sortedTemplates.slice(startIndex, startIndex + itemsPerPage);

  // Prepare data for charts
  const barChartData = templates
    .filter(t => t.reservation_percentage > 0)
    .map(t => ({
      name: t.template_model,
      percentage: t.reservation_percentage,
      id: t.template_id
    }))
    .sort((a, b) => b.percentage - a.percentage);

  // Format daily rates for wave chart
  const waveChartData = dailyRates.map(rate => ({
    date: rate.date,
    rate: parseFloat(rate.rate),
    displayDate: new Date(rate.date).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })
  }));

  // Top 5 most occupied templates
  const topOccupiedData = templates
    .filter(t => t.reservation_percentage > 0)
    .sort((a, b) => b.reservation_percentage - a.reservation_percentage)
    .slice(0, 5)
    .map(t => ({
      name: t.template_model,
      value: t.reservation_percentage,
      percentage: t.reservation_percentage
    }));

  const TOP_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-3 rtl">
          <p className="font-semibold text-gray-800 dark:text-white mb-1">{label}</p>
          <p className="text-blue-600 dark:text-blue-400">
            نسبة الإشغال: <span className="font-bold">{payload[0].value}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const WaveTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dateObj = new Date(payload[0].payload.date);
      const formattedDate = dateObj.toLocaleDateString('ar-SA', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
      });
      
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-3 rtl">
          <p className="font-semibold text-gray-800 dark:text-white mb-1">{formattedDate}</p>
          <p className="text-blue-600 dark:text-blue-400">
            نسبة الإشغال: <span className="font-bold">{payload[0].value}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    setCurrentPage(1);
  };

  // Get percentage color class
  const getPercentageColor = (percentage) => {
    if (percentage > 50) return 'text-red-600 dark:text-red-400';
    if (percentage > 20) return 'text-yellow-600 dark:text-yellow-400';
    if (percentage > 0) return 'text-green-600 dark:text-green-400';
    return 'text-gray-400';
  };

  const getProgressColor = (percentage) => {
    if (percentage > 50) return 'bg-red-500';
    if (percentage > 20) return 'bg-yellow-500';
    if (percentage > 0) return 'bg-green-500';
    return 'bg-gray-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-xl">
                <IconChartInfographic className="text-white" size={28} />
              </div>
              لوحة الإشغال
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 mr-11">
              تحليل نسبة إشغالية النماذج بشكل مرئي وتفاعلي
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {/* Chart Type Toggle */}
            <div className="flex bg-gray-200 dark:bg-gray-800 rounded-xl p-1">
              <button
                onClick={() => setChartView('bar')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  chartView === 'bar' 
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <IconChartBar size={18} />
                <span className="hidden sm:inline">أعمدة</span>
              </button>
              <button
                onClick={() => setChartView('wave')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  chartView === 'wave' 
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <IconWaveSine size={18} />
                <span className="hidden sm:inline">موجات</span>
              </button>
              <button
                onClick={() => setChartView('pie')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  chartView === 'pie' 
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <IconChartPie size={18} />
                <span className="hidden sm:inline">دائري</span>
              </button>
            </div>
            
            {/* Month Picker & Filter Button */}
            <div className="flex gap-2">
              <div className="relative">
                <IconCalendarMonth className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="border border-gray-300 dark:border-gray-600 rounded-xl px-10 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-auto"
                />
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-2 rounded-xl transition-all flex items-center gap-2 text-sm font-medium ${
                  showFilters || hasActiveFilters
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <IconFilter size={18} />
                <span className="hidden sm:inline">تصفية</span>
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <IconFilter size={20} />
                خيارات التصفية
              </h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <IconX size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  القالب (Template)
                </label>
                {templatesLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <IconLoader2 className="animate-spin" size={16} />
                    جاري التحميل...
                  </div>
                ) : (
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">جميع القوالب</option>
                    {templatesList.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.model} ({template.type}) - ID: {template.id}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  المدينة (City)
                </label>
                {citiesLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <IconLoader2 className="animate-spin" size={16} />
                    جاري التحميل...
                  </div>
                ) : (
                  <select
                    value={cityIdFilter}
                    onChange={(e) => setCityIdFilter(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">جميع المدن</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              <div className="flex items-end gap-2">
                <button
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    hasActiveFilters
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  مسح التصفية
                </button>
              </div>
            </div>
            
            {hasActiveFilters && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <span className="font-semibold">التصفية النشطة:</span>
                  {selectedTemplateId && (() => {
                    const selectedTemplate = templatesList.find(t => t.id == selectedTemplateId);
                    return ` القالب: ${selectedTemplate?.model || selectedTemplateId} (ID: ${selectedTemplateId})`;
                  })()}
                  {cityIdFilter && (() => {
                    const selectedCity = cities.find(c => c.id == cityIdFilter);
                    return ` المدينة: ${selectedCity?.name || cityIdFilter}`;
                  })()}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <div className="p-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <IconPercentage size={32} className="text-blue-200 opacity-80" />
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">الإجمالي</span>
              </div>
              <p className="text-blue-100 text-sm mb-1">نسبة الإشغال الإجمالية</p>
              <p className="text-3xl font-bold mb-2">{overallRate}%</p>
              <div className="bg-white/20 rounded-full h-2">
                <div className="bg-white rounded-full h-2 transition-all duration-500" style={{ width: `${overallRate}%` }}></div>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <div className="p-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <IconChartInfographic size={32} className="text-green-200 opacity-80" />
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">المساحة</span>
              </div>
              <p className="text-green-100 text-sm mb-1">إجمالي الأمتار (م²)</p>
              <p className="text-2xl font-bold">{totalAdvertisingMeters.toLocaleString()}</p>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <div className="p-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <IconClick size={32} className="text-purple-200 opacity-80" />
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">محجوز</span>
              </div>
              <p className="text-purple-100 text-sm mb-1">الأمتار المحجوزة (م²)</p>
              <p className="text-2xl font-bold">{reservedAdvertisingMeters.toLocaleString()}</p>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <div className="p-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <IconTemplate size={32} className="text-amber-200 opacity-80" />
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">النماذج</span>
              </div>
              <p className="text-amber-100 text-sm mb-1">النماذج النشطة</p>
              <p className="text-3xl font-bold">{activeTemplates.length} <span className="text-lg">/ {totalTemplatesCount}</span></p>
            </div>
          </div>
        </div>

        {/* Main Chart Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                {chartView === 'bar' ? <IconChartBar className="text-blue-600 dark:text-blue-400" size={24} /> : 
                 chartView === 'wave' ? <IconWaveSine className="text-blue-600 dark:text-blue-400" size={24} /> :
                 <IconChartPie className="text-blue-600 dark:text-blue-400" size={24} />}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  {chartView === 'bar' ? 'تحليل الإشغال' : 
                   chartView === 'wave' ? 'تغير الإشغال اليومي' :
                   'أكثر النماذج إشغالاً'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {chartView === 'bar' 
                    ? 'نسبة الإشغال لكل نموذج (النماذج النشطة فقط)' 
                    : chartView === 'wave'
                    ? 'نسبة الإشغال المتغيرة يومياً خلال الشهر'
                    : 'أعلى 5 نماذج من حيث نسبة الإشغال'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-4 md:p-6">
            {chartView === 'bar' && barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={450}>
                <BarChart data={barChartData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                  <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} />
                  <Legend wrapperStyle={{ paddingTop: 20 }} />
                  <Bar dataKey="percentage" name="نسبة الإشغال" radius={[0, 8, 8, 0]} animationDuration={1000}>
                    {barChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`}
                        fill={entry.percentage > 50 ? '#ef4444' : entry.percentage > 20 ? '#f59e0b' : '#10b981'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : chartView === 'wave' && waveChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={450}>
                <AreaChart data={waveChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                  <XAxis 
                    dataKey="displayDate" 
                    tick={{ fontSize: 11 }}
                    interval={Math.floor(waveChartData.length / 15)}
                  />
                  <YAxis domain={[0, 'auto']} unit="%" tick={{ fontSize: 12 }} />
                  <Tooltip content={<WaveTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: 20 }} />
                  <Area 
                    type="monotone" 
                    dataKey="rate" 
                    name="نسبة الإشغال" 
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#colorRate)"
                    strokeWidth={2}
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : chartView === 'bar' && barChartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
                <IconAlertCircle size={48} className="mb-3" />
                <p>لا توجد نماذج نشطة في الشهر المحدد</p>
              </div>
            ) : chartView === 'wave' && waveChartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
                <IconAlertCircle size={48} className="mb-3" />
                <p>لا توجد بيانات يومية متاحة</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 text-center flex items-center justify-center gap-2">
                    <IconTrendingUp size={20} />
                    أعلى 5 نماذج إشغالاً
                  </h3>
                  {topOccupiedData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <PieChart>
                        <Pie
                          data={topOccupiedData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={120}
                          dataKey="value"
                          animationDuration={1000}
                        >
                          {topOccupiedData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={TOP_COLORS[index % TOP_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value}%`, 'نسبة الإشغال']} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[400px] text-gray-400 dark:text-gray-500">
                      <IconAlertCircle size={48} className="mb-3" />
                      <p>لا توجد بيانات</p>
                    </div>
                  )}
                  <div className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
                    * يظهر أعلى 5 نماذج من حيث نسبة الإشغال
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 text-center flex items-center justify-center gap-2">
                    <IconSquareRounded size={20} />
                    ملخص النماذج النشطة
                  </h3>
                  <div className="space-y-4">
                    {topOccupiedData.map((item, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-gray-800 dark:text-white">{item.name}</span>
                          <span className={`text-lg font-bold ${getPercentageColor(item.percentage)}`}>
                            {item.percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(item.percentage)}`}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    {topOccupiedData.length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        لا توجد نماذج نشطة
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Data Table Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">تفاصيل النماذج</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  قائمة بجميع النماذج مرتبة حسب الأعلى إشغالاً
                </p>
              </div>
              <button
                onClick={toggleSortOrder}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
              >
                <IconArrowsSort size={16} />
                {sortOrder === 'desc' ? 'الأعلى أولاً' : 'الأقل أولاً'}
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="text-right p-4 text-sm font-medium text-gray-600 dark:text-gray-300">#</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-600 dark:text-gray-300">اسم النموذج</th>
                  <th className="text-center p-4 text-sm font-medium text-gray-600 dark:text-gray-300">نسبة الإشغال</th>
                  <th className="text-center p-4 text-sm font-medium text-gray-600 dark:text-gray-300">اللوحات</th>
                  <th className="text-center p-4 text-sm font-medium text-gray-600 dark:text-gray-300">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {paginatedTemplates.map((template, index) => (
                  <tr key={template.template_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-150">
                    <td className="p-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 text-xs">
                        {startIndex + index + 1}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-gray-800 dark:text-gray-200">{template.template_model}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">ID: {template.template_id}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-3">
                        <span className={`text-sm font-semibold ${getPercentageColor(template.reservation_percentage)}`}>
                          {template.reservation_percentage}%
                        </span>
                        <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(template.reservation_percentage)}`}
                            style={{ width: `${template.reservation_percentage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1 text-sm">
                        <span className="font-medium text-blue-600 dark:text-blue-400">{template.reserved_boards || 0}</span>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-600 dark:text-gray-300">{template.total_boards || 0}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {template.reservation_percentage > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                          نشط
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                          غير نشط
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  عرض {startIndex + 1} - {Math.min(startIndex + itemsPerPage, sortedTemplates.length)} من {sortedTemplates.length} نموذج
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1 ${
                      currentPage === 1
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <IconChevronRight size={16} />
                    السابق
                  </button>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-9 h-9 rounded-lg transition-all ${
                            currentPage === pageNum
                              ? 'bg-blue-500 text-white shadow-md'
                              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1 ${
                      currentPage === totalPages
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    التالي
                    <IconChevronLeft size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Stats */}
        {activeTemplates.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 rounded-xl p-4 border border-blue-100 dark:border-gray-700">
            <div className="flex flex-wrap justify-between items-center gap-3 text-sm">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-gray-600 dark:text-gray-400">أعلى من 50%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-gray-600 dark:text-gray-400">20% - 50%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-gray-600 dark:text-gray-400">أقل من 20%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                  <span className="text-gray-600 dark:text-gray-400">غير نشط</span>
                </div>
              </div>
              <div className="text-gray-500 dark:text-gray-400 text-xs">
                آخر تحديث: {new Date().toLocaleDateString('ar-SA')}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}