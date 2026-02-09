import React, { forwardRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useGetRoadSignsQuery } from '../../RtkQuery/Slice/RoadSings/RoadSingsApi'; // Adjust the import path

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const syrianCities = [
  {
    id: 1,
    name: "دمشق",
    position: [33.5138, 36.2765],
    address: "شارع العابد , دخلة المطعم الصحي  ",
    phone: "939333336 963+",
  },
  {
    id: 2,
    name: "حلب",
    position: [36.2021, 37.1343],
    address: "محطة بغداد",
    phone: "992400040 963+",
  },
  {
    id: 3,
    name: "حمص",
    position: [34.7324, 36.7137],
    address: "المنطقة المركزية، الساحة الرئيسية",
    phone: "989888623 963+",
  },
  {
    id: 4,
    name: "طرطوس",
    position: [34.8950, 35.8867],
    address: "شارع الثورة , دوار أمن الدولة - بناء بنك عودة سابقا",
    phone: "944333322 963 +",
  }
];

// Function to check if a face is booked
const isFaceBooked = (roadSign) => {
  if (roadSign.is_booked !== undefined) {
    return roadSign.is_booked === true;
  }
  
  if (!roadSign.bookings || !Array.isArray(roadSign.bookings) || roadSign.bookings.length === 0) {
    return false;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (const booking of roadSign.bookings) {
    if (!booking.start_date || !booking.end_date) continue;
    
    try {
      const isApproved = booking.approvement_status === 2;
      if (!isApproved) continue;
      
      const startDate = new Date(booking.start_date);
      const endDate = new Date(booking.end_date);
      
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      
      if (today >= startDate && today <= endDate) {
        return true;
      }
    } catch (error) {
      console.error(`Error parsing dates for booking ${booking.id}:`, error);
      continue;
    }
  }
  
  return false;
};

// Function to check special dual face case
const checkSpecialDualFaceCase = (roadSign, allRoadSigns) => {
  if (roadSign.direction_code !== null && roadSign.direction_code !== undefined) {
    const roadSignCode = roadSign.roadsign_code;
    
    if (!roadSignCode) return false;
    
    const otherFace = allRoadSigns.find(sign => 
      sign.roadsign_code === roadSignCode && 
      sign.direction_code !== roadSign.direction_code &&
      sign.id !== roadSign.id
    );
    
    if (otherFace) {
      const currentFaceBooked = isFaceBooked(roadSign);
      const otherFaceBooked = isFaceBooked(otherFace);
      
      return (currentFaceBooked && !otherFaceBooked) || (!currentFaceBooked && otherFaceBooked);
    }
  }
  return false;
};

// Function to get dual face info
const getDualFaceInfo = (roadSign, allRoadSigns) => {
  if (roadSign.direction_code === null || roadSign.direction_code === undefined) return null;
  
  const roadSignCode = roadSign.roadsign_code;
  if (!roadSignCode) return null;
  
  const otherFace = allRoadSigns.find(sign => 
    sign.roadsign_code === roadSignCode && 
    sign.direction_code !== roadSign.direction_code
  );
  
  if (!otherFace) return null;
  
  return {
    currentFace: {
      direction: roadSign.direction_code,
      isBooked: isFaceBooked(roadSign),
      data: roadSign
    },
    otherFace: {
      direction: otherFace.direction_code,
      isBooked: isFaceBooked(otherFace),
      data: otherFace
    }
  };
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'غير محدد';
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-SA');
};

// Create custom icons
const createCustomIcon = (status = 'available', type = 'roadSign', hasDualFace = false) => {
  if (type === 'branch') {
    return new L.Icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="18" fill="#dc2626" stroke="white" stroke-width="3"/>
          <path d="M20 12 L26 18 L20 24 L14 18 Z" fill="white"/>
        </svg>
      `)}`,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40]
    });
  }

  let fillColor, iconSymbol;
  
  switch(status) {
    case 'booked':
      fillColor = '#ef4444';
      iconSymbol = 'M20 12 L28 12 L30 20 L28 28 L12 28 L10 20 Z';
      break;
    case 'partially':
      fillColor = '#f59e0b';
      iconSymbol = 'M20 12 L28 12 L30 20 L20 20 Z M20 20 L12 20 L10 28 L20 28 Z';
      break;
    default:
      fillColor = '#10b981';
      iconSymbol = 'M20 12 L28 12 L30 20 L28 28 L12 28 L10 20 Z';
  }

  return new L.Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="2" stdDeviation="2" flood-opacity="0.3"/>
          </filter>
        </defs>
        <circle cx="20" cy="20" r="18" fill="${fillColor}" stroke="white" stroke-width="3" filter="url(#shadow)"/>
        ${hasDualFace ? `
          <circle cx="30" cy="10" r="8" fill="${fillColor}" stroke="white" stroke-width="2"/>
          <path d="M25 5 L35 5 L35 15 L25 15 Z" fill="white" stroke="white" stroke-width="1"/>
        ` : ''}
        <path d="${iconSymbol}" fill="white" transform="translate(0, 0)"/>
      </svg>
    `)}`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
    className: 'road-sign-marker'
  });
};

const BranchesSection = forwardRef(({ inView, isDarkMode }, ref) => {
  const [roadSigns, setRoadSigns] = useState([]);
  const [selectedRoadSignId, setSelectedRoadSignId] = useState(null);
  const [mapHeight, setMapHeight] = useState(500); // Initial height
  
  const { data: roadSignsData, isLoading, isError } = useGetRoadSignsQuery({});
  
  // Update map height based on screen size
  useEffect(() => {
    const updateMapHeight = () => {
      const width = window.innerWidth;
      if (width < 640) { // Mobile
        setMapHeight(400);
      } else if (width < 768) { // Tablet
        setMapHeight(450);
      } else if (width < 1024) { // Small desktop
        setMapHeight(550);
      } else { // Desktop
        setMapHeight(600);
      }
    };
    
    updateMapHeight();
    window.addEventListener('resize', updateMapHeight);
    
    return () => window.removeEventListener('resize', updateMapHeight);
  }, []);
  
  useEffect(() => {
    if (roadSignsData?.data) {
      const transformedRoadSigns = roadSignsData.data.map((sign) => {
        const isBooked = isFaceBooked(sign);
        const specialDualFace = checkSpecialDualFaceCase(sign, roadSignsData.data);
        const dualFaceInfo = getDualFaceInfo(sign, roadSignsData.data);
        
        let status = 'available';
        if (isBooked) status = 'booked';
        else if (specialDualFace) status = 'partially';
        
        return {
          id: sign.id,
          name: sign.roadsign_code || `لافتة ${sign.id}`,
          position: [sign.latitudeX, sign.longitudeY],
          address: sign.place || sign.region?.name || sign.city?.name || 'غير محدد',
          city: sign.city?.name || 'غير معروف',
          region: sign.region?.name || '',
          status: status,
          type: 'roadSign',
          template: sign.template,
          directions: sign.directions,
          is_booked: isBooked,
          bookings: sign.bookings || [],
          image: sign.image,
          roadsign_code: sign.roadsign_code,
          direction_code: sign.direction_code,
          hasDualFace: dualFaceInfo !== null,
          dualFaceInfo: dualFaceInfo
        };
      });
      
      setRoadSigns(transformedRoadSigns);
    }
  }, [roadSignsData]);

  const colors = {
    primary: {
      text: isDarkMode ? 'text-red-400' : 'text-red-600',
      bg: isDarkMode ? 'bg-red-500' : 'bg-red-600'
    },
    secondary: {
      bg: isDarkMode ? 'bg-green-500' : 'bg-green-600'
    },
    roadSign: {
      available: {
        bg: isDarkMode ? 'bg-emerald-500' : 'bg-emerald-600',
        text: isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
      },
      partially: {
        bg: isDarkMode ? 'bg-amber-500' : 'bg-amber-600',
        text: isDarkMode ? 'text-amber-400' : 'text-amber-600'
      },
      booked: {
        bg: isDarkMode ? 'bg-red-500' : 'bg-red-600',
        text: isDarkMode ? 'text-red-400' : 'text-red-600'
      }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const slideInLeft = {
    hidden: {
      opacity: 0,
      x: -100,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  const slideInRight = {
    hidden: {
      opacity: 0,
      x: 100,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  const fadeInUp = {
    hidden: { 
      opacity: 0, 
      y: 60,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  // Statistics
  const availableRoadSigns = roadSigns.filter(r => r.status === 'available').length;
  const partiallyRoadSigns = roadSigns.filter(r => r.status === 'partially').length;
  const bookedRoadSigns = roadSigns.filter(r => r.status === 'booked').length;

const RoadSignPopup = ({ sign }) => (
  <div className={`p-2 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} w-[200px] max-w-[80vw]`} dir="rtl">
    <div className="flex items-center justify-between mb-1">
      <div>
        <h3 className="font-bold text-sm mb-0.5 truncate max-w-[120px]">{sign.name}</h3>
        <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
          sign.status === 'available' 
            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300'
            : sign.status === 'partially'
            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300'
            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
        }`}>
          {sign.status === 'available' ? 'متاحة' : 
           sign.status === 'partially' ? 'جزئياً' : 'محجوزة'}
        </span>
      </div>
    </div>
    
    <div className="text-xs space-y-1">
      <div className="flex items-start">
        <Icon icon="mdi:map-marker" className="flex-shrink-0 mt-0.5 mr-1 text-gray-400" />
        <div>
          <p className="font-medium line-clamp-2">{sign.address}</p>
          <p className="text-gray-500 dark:text-gray-400">
            {sign.city}
          </p>
        </div>
      </div>
      
      {sign.template && (
        <div className="flex items-center justify-between pt-1 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: sign.template.color || '#000' }} />
            <span className="text-xs">{sign.template.type || '---'}</span>
          </div>
          <span className="text-xs font-medium">{sign.template.size || '---'}</span>
        </div>
      )}
      
      {sign.hasDualFace && sign.dualFaceInfo && (
        <div className="pt-1 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between text-xs">
            <span className={`px-1 rounded ${sign.dualFaceInfo.currentFace.isBooked ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>
              {sign.dualFaceInfo.currentFace.isBooked ? '🔒' : '🔓'}
            </span>
            <span>وجهان</span>
            <span className={`px-1 rounded ${sign.dualFaceInfo.otherFace.isBooked ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>
              {sign.dualFaceInfo.otherFace.isBooked ? '🔒' : '🔓'}
            </span>
          </div>
        </div>
      )}
    </div>
  </div>
);

  return (
    <section id="branches" ref={ref} className={`py-16 sm:py-20 ${
      isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50/50'
    }`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="text-center mb-12 sm:mb-16"
        >
          <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            <span className={colors.primary.text}>فروعنا واللافتات</span>
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className={`text-lg sm:text-xl max-w-2xl mx-auto ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}
          >
            مواقع استراتيجية ولافتات إعلانية في جميع أنحاء سوريا
          </motion.p>
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 inline-flex items-center space-x-2 text-sm"
            >
              <Icon icon="eos-icons:loading" className="text-blue-500 animate-spin" />
              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                جاري تحميل بيانات اللافتات...
              </span>
            </motion.div>
          )}
          
          {isError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 inline-flex items-center space-x-2 text-sm text-red-500"
            >
              <Icon icon="mdi:alert-circle" />
              <span>حدث خطأ في تحميل بيانات اللافتات</span>
            </motion.div>
          )}
        </motion.div>

        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
          {/* Map Section - Made larger and responsive */}
          <motion.div
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            variants={slideInLeft}
            className="relative w-full h-auto lg:h-full order-1 lg:order-1"
          >
            <div className="sticky top-4">
              <div 
                className="rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-300/20 dark:border-gray-700/20"
                style={{ height: `${mapHeight}px` }}
              >
                <MapContainer
                  center={[34.8021, 38.9968]}
                  zoom={7}
                  style={{ height: '100%', width: '100%' }}
                  className="rounded-2xl z-0"
                  scrollWheelZoom={true}
                  zoomControl={true}
                  dragging={true}
                  touchZoom={true}
                  doubleClickZoom={true}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  
                  {/* Branch Markers */}
                  {syrianCities.map((city, index) => (
                    <Marker
                      key={`branch-${city.id}`}
                      position={city.position}
                      icon={createCustomIcon('branch', 'branch')}
                    >
                      <Popup className="custom-popup">
                        <div className={`p-4 min-w-[250px] ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`} dir="rtl">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-lg">{city.name}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              index === 0 
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                                : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                            }`}>
                              {index === 0 ? 'المكتب الرئيسي' : 'فرع'}
                            </span>
                          </div>
                          <div className="space-y-3 text-sm">
                            <div className="flex items-start space-x-2">
                              <Icon icon="mdi:map-marker" className="text-red-500 flex-shrink-0 mt-0.5" />
                              <span>{city.address}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Icon icon="mdi:phone" className="text-green-500 flex-shrink-0" />
                              <span>{city.phone}</span>
                            </div>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                  
                  {/* Road Sign Markers */}
                  {roadSigns.map((sign) => (
                    <Marker
                      key={`roadsign-${sign.id}`}
                      position={sign.position}
                      icon={createCustomIcon(sign.status, 'roadSign', sign.hasDualFace)}
                      eventHandlers={{
                        click: () => setSelectedRoadSignId(sign.id),
                      }}
                    >
                     <Popup
  onClose={() => setSelectedRoadSignId(null)}
  className="custom-popup"
  minWidth={160}
  maxWidth={200}
  maxHeight={180}
>
  <RoadSignPopup sign={sign} />
</Popup>
                    </Marker>
                  ))}
                </MapContainer>
                
              
              
              </div>


              {/*
              map legend 
                <div className={`absolute z-[1000] p-3 rounded-lg ${
                  isDarkMode ? 'bg-gray-800/95 text-white' : 'bg-white/95 text-gray-800'
                } backdrop-blur-sm shadow-lg border border-gray-300/20 dark:border-gray-700/20
                  top-4 right-4 left-4 sm:top-auto sm:bottom-4 sm:left-4 sm:right-4
                  max-h-[40%] overflow-y-auto`}>
                  <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-3">
                    <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 text-sm w-full sm:w-auto">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0"></div>
                        <span className="whitespace-nowrap">المكاتب</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-emerald-500 rounded-full flex-shrink-0"></div>
                        <span className="whitespace-nowrap">لافتات متاحة</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-amber-500 rounded-full flex-shrink-0"></div>
                        <span className="whitespace-nowrap">محجوزة جزئياً</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0"></div>
                        <span className="whitespace-nowrap">محجوزة بالكامل</span>
                      </div>
                    </div>
                    <div className="text-xs opacity-75 whitespace-nowrap mt-2 sm:mt-0">
                      {roadSigns.length} لافتة | {availableRoadSigns} متاحة
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-300/50 dark:border-gray-700/50 sm:hidden">
                    <div className="flex items-center space-x-4 text-xs">
                      <div className="flex items-center space-x-2">
                        <div className="relative">
                          <div className="w-5 h-5 bg-emerald-500 rounded-full"></div>
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-white"></div>
                        </div>
                        <span>وجهين</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Icon icon="mdi:information" className="text-blue-500" />
                        <span>انقر على أيقونة للحصول على التفاصيل</span>
                      </div>
                    </div>
                  </div>
                </div>
              */}

              
              {/* Map Controls Info (Mobile) */}
              <div className="mt-3 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 sm:hidden">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Icon icon="mdi:gesture-tap" className="text-blue-500" />
                    <span>انقر على الأيقونة</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Icon icon="mdi:gesture-pinch" className="text-green-500" />
                    <span>تطبيق لتكبير/تصغير</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Panel - Made scrollable on mobile */}
          <motion.div
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            variants={slideInRight}
            className="space-y-6 order-2 lg:order-2"
          >
            {/* Branches List */}
            {syrianCities.map((branch, index) => (
              <motion.div
                key={branch.id}
                whileHover={{ scale: 1.02, y: -5 }}
                className={`rounded-xl p-4 sm:p-6 border-2 transition-all duration-300 group cursor-pointer ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700 hover:border-gray-600 hover:bg-gray-700' 
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-1 text-right">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`text-base sm:text-lg font-bold ${
                        isDarkMode ? 'text-white' : 'text-gray-800'
                      }`}>{branch.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        index === 0 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                          : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                      }`}>
                        {index === 0 ? 'المكتب الرئيسي' : 'فرع'}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className={`flex items-center space-x-2 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        <Icon icon="mdi:map-marker-outline" className="flex-shrink-0 text-red-500 text-sm" />
                        <span className="text-xs sm:text-sm">{branch.address}</span>
                      </p>
                      <p className={`flex items-center space-x-2 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        <Icon icon="mdi:phone" className="flex-shrink-0 text-green-500 text-sm" />
                        <span className="text-xs sm:text-sm">{branch.phone}</span>
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-3">
                      <div className={`flex-1 h-1 rounded-full ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                      }`}>
                        <div 
                          className={`h-1 rounded-full ${
                            index % 2 === 0 ? colors.primary.bg : colors.secondary.bg
                          }`}
                          style={{ width: `${80 + (index * 10)}%` }}
                        ></div>
                      </div>
                      <span className={`text-xs font-medium ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        %{70 + (index * 10)} تغطية
                      </span>
                    </div>
                  </div>
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 ${
                    index % 2 === 0 ? colors.primary.bg : colors.secondary.bg
                  }`}>
                    <Icon icon="mdi:office-building" className="text-white text-base sm:text-lg" />
                  </div>
                </div>
              </motion.div>
            ))}
            
            {/* Road Signs Statistics Card */}
            <motion.div
              variants={fadeInUp}
              className={`rounded-xl p-4 sm:p-6 border-2 ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700' 
                  : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                  <h4 className={`font-semibold text-base sm:text-lg ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>إحصاءات اللافتات</h4>
                  <p className={`text-xs sm:text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {roadSigns.length} لافتة إعلانية في جميع أنحاء سوريا
                  </p>
                </div>
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600`}>
                  <Icon icon="mdi:chart-pie" className="text-white text-base sm:text-lg" />
                </div>
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      اللافتات المتاحة
                    </span>
                    <span className={`font-bold text-sm sm:text-base ${colors.roadSign.available.text}`}>
                      {availableRoadSigns}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${(availableRoadSigns / roadSigns.length) * 100 || 0}%` }}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      المحجوزة جزئياً
                    </span>
                    <span className={`font-bold text-sm sm:text-base ${colors.roadSign.partially.text}`}>
                      {partiallyRoadSigns}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${(partiallyRoadSigns / roadSigns.length) * 100 || 0}%` }}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      المحجوزة بالكامل
                    </span>
                    <span className={`font-bold text-sm sm:text-base ${colors.roadSign.booked.text}`}>
                      {bookedRoadSigns}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${(bookedRoadSigns / roadSigns.length) * 100 || 0}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-300/50 dark:border-gray-700/50">
                <div className="flex items-center justify-between">
                  <span className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    معدل الإشغال
                  </span>
                  <span className={`text-base sm:text-lg font-bold ${
                    ((partiallyRoadSigns + bookedRoadSigns) / roadSigns.length) * 100 > 50
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}>
                    {Math.round(((partiallyRoadSigns + bookedRoadSigns) / roadSigns.length) * 100 || 0)}%
                  </span>
                </div>
              </div>
            </motion.div>
            
            {/* Quick Actions Card */}
            <motion.div
              variants={fadeInUp}
              className={`rounded-xl p-4 sm:p-6 border-2 ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700' 
                  : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200'
              }`}
            >
              <div className="flex items-center space-x-3 mb-3 sm:mb-4">
                <div className="flex-1">
                  <h4 className={`font-semibold text-base sm:text-lg ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>تغطية وطنية شاملة</h4>
                  <p className={`text-xs sm:text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    الوصول إلى 85٪ من سكان سوريا من خلال {syrianCities.length} فرع و {roadSigns.length} لافتة إعلانية
                  </p>
                </div>
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${colors.primary.bg}`}>
                  <Icon icon="mdi:earth" className="text-white text-sm sm:text-lg" />
                </div>
              </div>
              
              {/* Responsive Grid for Coverage Stats */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4">
                <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {syrianCities.length}
                  </div>
                  <div className="text-xs sm:text-sm text-blue-800 dark:text-blue-300 mt-1">
                    فروع
                  </div>
                </div>
                <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
                  <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
                    {roadSigns.length}
                  </div>
                  <div className="text-xs sm:text-sm text-green-800 dark:text-green-300 mt-1">
                    لافتات
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
});

export default BranchesSection;