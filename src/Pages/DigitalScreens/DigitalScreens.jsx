import React, { useState, useEffect } from 'react';
import { useGetRoadSignsQuery } from '../../RtkQuery/Slice/RoadSings/RoadSingsApi';

export default function DigitalScreens() {
  // State for digital screens data
  const [digitalScreens, setDigitalScreens] = useState([]);
  const [selectedScreen, setSelectedScreen] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Animation message state
  const [displayMessage, setDisplayMessage] = useState('⚡ الشاشة الرقمية نشطة ⚡');
  const [messageIndex, setMessageIndex] = useState(0);
  
  // Fetch road signs data (no parameters sent)
  const { data: roadSignsData, isLoading } = useGetRoadSignsQuery();
  
  // Filter digital screens from the response
  useEffect(() => {
    if (roadSignsData?.data) {
      const digitalScreensList = roadSignsData.data.filter(
        item => item.template?.display_type === 'digital'
      );
      setDigitalScreens(digitalScreensList);
    }
  }, [roadSignsData]);
  
  // Animated marquee effect
  useEffect(() => {
    const scrollingMessages = [
      '✨ مرحباً بكم في المستقبل ✨',
      '🎬 تجربة السينما الرقمية 🎬',
      '🎟️ احجز مكانك الآن 🎟️',
      '⚡ الحد الأقصى 12 شخص ⚡',
      '💫 شاشة تفاعلية 💫',
      '🌟 التناظرية تلتقي بالرقمية 🌟',
      '🎮 احجز وأكد 🎮'
    ];
    
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % scrollingMessages.length);
      setDisplayMessage(scrollingMessages[(messageIndex + 1) % scrollingMessages.length]);
    }, 2800);
    return () => clearInterval(interval);
  }, [messageIndex]);
  
  // Open modal with screen details
  const openScreenDetails = (screen) => {
    setSelectedScreen(screen);
    setIsModalOpen(true);
  };
  
  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedScreen(null);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-slate-950 dark:via-indigo-950 dark:to-black flex items-center justify-center p-4 md:p-6 font-mono" dir="rtl">
      
      <div className="max-w-6xl w-full">
        
        <div className="relative mb-8 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(0,255,255,0.3)] border border-cyan-500/40 bg-white/80 dark:bg-black/60 backdrop-blur-sm">
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent animate-pulse"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400 shadow-lg animate-pulse"></div>
          
          <div className="p-6 md:p-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-400/50 text-cyan-600 dark:text-cyan-300 text-xs tracking-widest">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                مباشر • إشارة رقمية
              </div>
              
              {isLoading && (
                <div className="text-cyan-600 dark:text-cyan-400 text-sm animate-pulse">
                  ⚡ جاري تحميل الشاشات الرقمية...
                </div>
              )}
              
              <div className="w-full overflow-hidden bg-gray-100 dark:bg-black/80 border-y border-cyan-500/30 py-3 px-2 rounded-lg">
                <div className="whitespace-nowrap animate-marquee font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 dark:from-cyan-300 dark:via-blue-400 dark:to-purple-400 text-xl md:text-2xl tracking-wider">
                  {displayMessage} &nbsp;&nbsp;✦&nbsp;&nbsp; {displayMessage} &nbsp;&nbsp;✦&nbsp;&nbsp;
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 w-full max-w-md mt-4">
                <div className="flex flex-col items-center bg-cyan-50 dark:bg-cyan-950/40 rounded-lg p-2 border border-cyan-200 dark:border-cyan-400/30">
                  <span className="text-cyan-600 dark:text-cyan-400 text-xs">إجمالي الشاشات</span>
                  <span className="text-2xl font-bold text-gray-800 dark:text-white">{digitalScreens.length}</span>
                </div>
                <div className="flex flex-col items-center bg-cyan-50 dark:bg-cyan-950/40 rounded-lg p-2 border border-cyan-200 dark:border-cyan-400/30">
                  <span className="text-cyan-600 dark:text-cyan-400 text-xs">محجوزة</span>
                  <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {digitalScreens.filter(s => s.is_booked).length}
                  </span>
                </div>
                <div className="flex flex-col items-center bg-cyan-50 dark:bg-cyan-950/40 rounded-lg p-2 border border-cyan-200 dark:border-cyan-400/30">
                  <span className="text-cyan-600 dark:text-cyan-400 text-xs">متاحة</span>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {digitalScreens.filter(s => !s.is_booked).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
        </div>
        
        <div className="bg-white/80 dark:bg-black/50 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-indigo-500/40 p-5 md:p-6 shadow-xl dark:shadow-2xl">
          <div className="flex justify-between items-center flex-wrap gap-3 mb-6 border-b border-gray-200 dark:border-indigo-500/30 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
              <h2 className="text-xl md:text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-200 dark:to-blue-300">
                🎭 الشاشات الرقمية
              </h2>
            </div>
            <div className="text-xs text-cyan-600 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40 px-3 py-1 rounded-full border border-cyan-200 dark:border-cyan-400/40">
              تم العثور على {digitalScreens.length} شاشة
            </div>
          </div>
          
          {digitalScreens.length === 0 && !isLoading ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <span className="text-4xl">📡</span>
              <p className="mt-4">لا توجد شاشات رقمية</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {digitalScreens.map((screen) => (
                <div
                  key={screen.id}
                  onClick={() => openScreenDetails(screen)}
                  className={`
                    relative group cursor-pointer rounded-xl p-4 transition-all duration-300 
                    hover:scale-105 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]
                    ${screen.is_booked 
                      ? 'bg-red-400 dark:bg-gradient-to-br dark:from-red-950/40 dark:to-red-900/20 border-red-300 dark:border-red-500/30' 
                      : 'bg-white dark:bg-gradient-to-br dark:from-cyan-950/40 dark:to-blue-900/20 border-gray-200 dark:border-cyan-500/30'
                    }
                    border backdrop-blur-sm
                  `}
                >
                  <div className="absolute top-3 left-3 z-20">
                    <span className={`
                      inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold
                      ${screen.is_booked 
                        ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-300 border border-red-300 dark:border-red-500/30' 
                        : 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-300 border border-green-300 dark:border-green-500/30'
                      }
                    `}>
                      <span className={`w-1.5 h-1.5 rounded-full ${screen.is_booked ? 'bg-red-400' : 'bg-green-400'}`}></span>
                      {screen.is_booked ? 'محجوزة' : 'متاحة'}
                    </span>
                  </div>
                  
                  <div className="w-full h-40 mb-3 rounded-lg overflow-hidden bg-gradient-to-b from-gray-300 to-gray-400 dark:from-gray-800 dark:to-gray-900 border border-gray-300 dark:border-gray-700 relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-300/40 dark:from-blue-900/40 via-gray-300/60 dark:via-gray-900/60 to-gray-300 dark:to-gray-900">
                      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-blue-400/60 dark:from-blue-900/60 to-orange-300/20 dark:to-orange-900/20"></div>
                      
                      <div className="absolute top-3 right-6 w-6 h-6 rounded-full bg-yellow-400/40 dark:bg-yellow-400/20 blur-sm"></div>
                      
                      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-around px-1">
                        <div className="w-3 h-8 bg-gray-400/80 dark:bg-gray-800/80 rounded-t-sm"></div>
                        <div className="w-4 h-12 bg-gray-400/80 dark:bg-gray-800/80 rounded-t-sm"></div>
                        <div className="w-3 h-6 bg-gray-400/80 dark:bg-gray-800/80 rounded-t-sm"></div>
                        <div className="w-5 h-14 bg-gray-400/80 dark:bg-gray-800/80 rounded-t-sm"></div>
                        <div className="w-3 h-10 bg-gray-400/80 dark:bg-gray-800/80 rounded-t-sm"></div>
                        <div className="w-4 h-7 bg-gray-400/80 dark:bg-gray-800/80 rounded-t-sm"></div>
                        <div className="w-3 h-11 bg-gray-400/80 dark:bg-gray-800/80 rounded-t-sm"></div>
                      </div>
                      
                      <div className="absolute bottom-0 left-1/4 w-0.5 h-16 bg-gray-500/50 dark:bg-gray-600/50">
                        <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-yellow-400/50 dark:bg-yellow-400/30 blur-[1px]"></div>
                      </div>
                      <div className="absolute bottom-0 right-1/3 w-0.5 h-16 bg-gray-500/50 dark:bg-gray-600/50">
                        <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-yellow-400/50 dark:bg-yellow-400/30 blur-[1px]"></div>
                      </div>
                    </div>
                    
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
                      <div className="flex gap-6">
                        <div className="w-1 h-12 bg-gradient-to-r from-gray-500 to-gray-400 dark:from-gray-600 dark:to-gray-500"></div>
                        <div className="w-1 h-12 bg-gradient-to-r from-gray-500 to-gray-400 dark:from-gray-600 dark:to-gray-500"></div>
                      </div>
                      {/* Base */}
                      <div className="w-20 h-1 bg-gray-500/80 dark:bg-gray-600/80 rounded-sm"></div>
                    </div>
                    
                    {/* Digital Display Screen */}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[70%] h-[55%] bg-black border-2 border-gray-400 dark:border-gray-500 rounded-sm overflow-hidden shadow-lg">
                      {/* Screen content - animated gradient */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 via-cyan-500/20 to-purple-500/30 animate-pulse"></div>
                      
                      {/* Screen grid lines */}
                      <div className="absolute inset-0" style={{ 
                        backgroundImage: 'linear-gradient(0deg, rgba(0,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px)',
                        backgroundSize: '8px 8px'
                      }}></div>
                      
                      {/* Screen content elements */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
                        <div className="w-3/4 h-1 bg-cyan-400/40 rounded mb-1"></div>
                        <div className="w-1/2 h-1 bg-blue-400/30 rounded mb-1"></div>
                        <div className="w-2/3 h-1 bg-cyan-400/30 rounded"></div>
                      </div>
                      
                      {/* Screen glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/20 to-transparent"></div>
                    </div>
                  </div>
                  
                  {/* Screen Info */}
                  <div className="space-y-2">
                    <h3 className="text-cyan-600 dark:text-cyan-300 font-bold text-sm">
                      {screen.roadsign_code}
                    </h3>
                    
                    <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <span>📍</span>
                        <span>{screen.city?.name} - {screen.region?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>📐</span>
                        <span>{screen.template?.size} - {screen.template?.model}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>📅</span>
                        <span>{screen.bookings?.length || 0} حجوزات نشطة</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Hover effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none"></div>
                  
                  {/* Click indicator */}
                  <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] text-cyan-600 dark:text-cyan-400 bg-white/80 dark:bg-black/50 px-2 py-1 rounded">
                      ← اضغط للتفاصيل
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-5 text-center text-[11px] text-cyan-500/80 dark:text-cyan-700/80 flex justify-center gap-4">
          <span>◈ نظام الشاشات الرقمية v1.0 ◈</span>
          <span>⎯ اضغط على أي شاشة للتفاصيل ⎯</span>
        </div>
      </div>
      
      {isModalOpen && selectedScreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-cyan-500/40 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl dark:shadow-[0_0_30px_rgba(0,255,255,0.2)]">
            
            <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-cyan-500/30 p-6 rounded-t-2xl z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-cyan-600 dark:text-cyan-300">
                    {selectedScreen.roadsign_code}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {selectedScreen.template?.model} - {selectedScreen.template?.size}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors p-2 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg"
                >
                  <span className="text-2xl">✕</span>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              
              <div className="flex justify-center">
                <span className={`
                  inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold
                  ${selectedScreen.is_booked 
                    ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-300 border border-red-300 dark:border-red-500/30' 
                    : 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-300 border border-green-300 dark:border-green-500/30'
                  }
                `}>
                  <span className={`w-2 h-2 rounded-full ${selectedScreen.is_booked ? 'bg-red-400 animate-pulse' : 'bg-green-400'}`}></span>
                  {selectedScreen.is_booked ? 'محجوزة' : 'متاحة'}
                </span>
              </div>
              
              {selectedScreen.image && (
                <div className="w-full h-48 md:h-64 rounded-xl overflow-hidden bg-gray-100 dark:bg-black/40">
                  <img 
                    src={selectedScreen.image} 
                    alt={selectedScreen.roadsign_code}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-black/40 rounded-xl p-4 border border-gray-200 dark:border-cyan-500/20">
                  <h3 className="text-cyan-600 dark:text-cyan-400 font-semibold mb-3 flex items-center gap-2">
                    <span>📍</span> تفاصيل الموقع
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-500">المدينة</label>
                      <p className="text-gray-800 dark:text-white font-medium">{selectedScreen.city?.name}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-500">المنطقة</label>
                      <p className="text-gray-800 dark:text-white font-medium">{selectedScreen.region?.name}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-500">المكان</label>
                      <p className="text-gray-800 dark:text-white font-medium">{selectedScreen.place}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-500">الاتجاهات</label>
                      <p className="text-gray-800 dark:text-white font-medium">{selectedScreen.directions}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-500">الإحداثيات</label>
                      <p className="text-cyan-600 dark:text-cyan-300 text-sm">
                        {selectedScreen.latitudeX}, {selectedScreen.longitudeY}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-black/40 rounded-xl p-4 border border-gray-200 dark:border-cyan-500/20">
                  <h3 className="text-cyan-600 dark:text-cyan-400 font-semibold mb-3 flex items-center gap-2">
                    <span>📺</span> تفاصيل الشاشة
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-500">نموذج القالب</label>
                      <p className="text-gray-800 dark:text-white font-medium">{selectedScreen.template?.model}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-500">نوع العرض</label>
                      <p className="text-gray-800 dark:text-white font-medium uppercase">{selectedScreen.template?.display_type}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-500">المقاس</label>
                      <p className="text-gray-800 dark:text-white font-medium">{selectedScreen.template?.size}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-500">عدد الوجوه</label>
                      <p className="text-gray-800 dark:text-white font-medium">{selectedScreen.faces_number}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-500">عدد اللوحات</label>
                      <p className="text-gray-800 dark:text-white font-medium">{selectedScreen.panels_number}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-500">تاريخ الإنشاء</label>
                      <p className="text-gray-800 dark:text-white font-medium">
                        {new Date(selectedScreen.created_at).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-black/40 rounded-xl p-4 border border-gray-200 dark:border-cyan-500/20">
                <h3 className="text-cyan-600 dark:text-cyan-400 font-semibold mb-4 flex items-center gap-2">
                  <span>📋</span> الحجوزات ({selectedScreen.bookings?.length || 0})
                </h3>
                
                {selectedScreen.bookings && selectedScreen.bookings.length > 0 ? (
                  <div className="space-y-3">
                    {selectedScreen.bookings.map((booking) => (
                      <div 
                        key={booking.id}
                        className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-gray-200 dark:border-cyan-500/20"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-500 dark:text-gray-500">العميل</label>
                            <p className="text-gray-800 dark:text-white font-medium">{booking.customer?.full_name}</p>
                            {booking.customer?.company_name && (
                              <p className="text-gray-500 dark:text-gray-400 text-sm">{booking.customer.company_name}</p>
                            )}
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 dark:text-gray-500">المدة</label>
                            <p className="text-gray-800 dark:text-white font-medium">
                              {booking.pivot?.start_date} → {booking.pivot?.end_date}
                            </p>
                            <p className="text-cyan-600 dark:text-cyan-400 text-sm">
                              {booking.pivot?.days_of_reservation} يوم
                            </p>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 dark:text-gray-500">تفاصيل السعر</label>
                            <p className="text-gray-800 dark:text-white font-medium">
                              المجموع: ${booking.pivot?.total_faces_price}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 dark:text-gray-500">الحجز</label>
                            <p className="text-gray-800 dark:text-white font-medium">
                              {booking.pivot?.number_of_reserved_panels} لوحة
                            </p>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                              {booking.pivot?.units} وحدة
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <span className="text-3xl">📭</span>
                    <p className="mt-2">لا توجد حجوزات لهذه الشاشة</p>
                  </div>
                )}
              </div>
              
              {selectedScreen.available_date_ranges && selectedScreen.available_date_ranges.length > 0 && (
                <div className="bg-gray-50 dark:bg-black/40 rounded-xl p-4 border border-green-300 dark:border-green-500/20">
                  <h3 className="text-green-600 dark:text-green-400 font-semibold mb-3 flex items-center gap-2">
                    <span>📅</span> التواريخ المتاحة
                  </h3>
                  <div className="space-y-2">
                    {selectedScreen.available_date_ranges.map((range, idx) => (
                      <div key={idx} className="flex justify-between text-sm text-green-600 dark:text-green-300 bg-green-50 dark:bg-green-950/20 rounded p-2">
                        <span>{range.start_date || range.start}</span>
                        <span>→</span>
                        <span>{range.end_date || range.end}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-gray-200 dark:border-cyan-500/30 p-4 rounded-b-2xl">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  الرقم: {selectedScreen.id} | الكود: {selectedScreen.roadsign_code}
                </span>
                <button
                  onClick={closeModal}
                  className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 dark:hover:bg-cyan-500 text-white rounded-lg transition-colors text-sm font-semibold"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 12s linear infinite;
          display: inline-block;
          width: max-content;
        }
      `}</style>
    </div>
  );
}