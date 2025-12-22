import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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
    //manager: "وسيم مارديني"
  },
  {
    id: 2,
    name: "حلب",
    position: [36.2021, 37.1343],
    address: "محطة بغداد",
    phone: "992400040 963+",
    //manager: "عمر خالد"
  },
  {
    id: 3,
    name: "حمص",
    position: [34.7324, 36.7137],
    address: "المنطقة المركزية، الساحة الرئيسية",
    phone: "989888623 963+",
    //manager: "خالد الحمصي"
  },
  {
    id: 4,
    name: "طرطوس",
    position: [34.8950, 35.8867],
    address: "شارع الثورة , دوار أمن الدولة - بناء بنك عودة سابقا",
    phone: "944333322 963 +",
    //manager: "حسن إبراهيم"
  }
];

// Create custom icons
const createCustomIcon = (color) => {
  return new L.Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="16" cy="16" r="6" fill="white"/>
      </svg>
    `)}`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

const BranchesSection = forwardRef(({ inView, isDarkMode }, ref) => {
  const colors = {
    primary: {
      text: isDarkMode ? 'text-red-400' : 'text-red-600',
      bg: isDarkMode ? 'bg-red-500' : 'bg-red-600'
    },
    secondary: {
      bg: isDarkMode ? 'bg-green-500' : 'bg-green-600'
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
            <span className={colors.primary.text}>فروعنا</span>
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className={`text-lg sm:text-xl max-w-2xl mx-auto ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}
          >
            مواقع استراتيجية في جميع أنحاء سوريا لأقصى تغطية إعلانية
          </motion.p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <motion.div
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            variants={slideInLeft}
            className="relative h-[400px] sm:h-[500px] rounded-2xl overflow-hidden shadow-2xl"
          >
            <MapContainer
              center={[34.8021, 38.9968]} // Center of Syria
              zoom={7}
              style={{ height: '100%', width: '100%' }}
              className="rounded-2xl z-0"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {syrianCities.map((city, index) => (
                <Marker
                  key={city.id}
                  position={city.position}
                  icon={createCustomIcon(index % 2 === 0 ? '#dc2626' : '#16a34a')}
                >
                  <Popup className="custom-popup">
                    <div className={`p-3 min-w-[200px] ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`} dir="rtl">
                      <h3 className="font-bold text-lg mb-2">{city.name}</h3>
                      <div className="space-y-1 text-sm">
                        <p className="flex items-center space-x-2">
                          <Icon icon="mdi:map-marker" className="text-red-500 flex-shrink-0" />
                          <span>{city.address}</span>
                        </p>
                        <p className="flex items-center space-x-2">
                          <Icon icon="mdi:phone" className="text-green-500 flex-shrink-0" />
                          <span>{city.phone}</span>
                        </p>
                        <p className="flex items-center space-x-2">
                          <Icon icon="mdi:account" className="text-blue-500 flex-shrink-0" />

                          {/*
                          <span>المدير: {city.manager}</span>
                          
                          */}

                        </p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            
            {/* Map Overlay Info */}
            <div className={`absolute top-4 right-4 left-4 p-3 rounded-lg backdrop-blur-sm border ${
              isDarkMode 
                ? 'bg-gray-900/80 border-gray-700 text-white' 
                : 'bg-white/80 border-gray-200 text-gray-800'
            }`} dir="rtl">
              <div className="flex items-center justify-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>المكاتب الرئيسية</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>الأفرع الثانوية</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            variants={slideInRight}
            className="space-y-6"
          >
            {syrianCities.map((branch, index) => (
              <motion.div
                key={branch.id}
                whileHover={{ scale: 1.02, y: -5 }}
                className={`rounded-xl p-6 border-2 transition-all duration-300 group cursor-pointer ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700 hover:border-gray-600 hover:bg-gray-700' 
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => {
                  // You can add map focus logic here
                  console.log(`Focus on ${branch.name}`);
                }}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-1 text-right">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`text-lg font-bold ${
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
                        <Icon icon="mdi:map-marker-outline" className="flex-shrink-0 text-red-500" />
                        <span>{branch.address}</span>
                      </p>
                      <p className={`flex items-center space-x-2 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        <Icon icon="mdi:phone" className="flex-shrink-0 text-green-500" />
                        <span>{branch.phone}</span>
                      </p>
                      <p className={`flex items-center space-x-2 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {/*
                        <Icon icon="mdi:account" className="flex-shrink-0 text-blue-500" />
                        <span>المدير: {branch.manager}</span>
                          

                        */}

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
                        %{80 + (index * 10)} تغطية
                      </span>
                    </div>
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 ${
                    index % 2 === 0 ? colors.primary.bg : colors.secondary.bg
                  }`}>
                    <Icon icon="mdi:map-marker" className="text-white text-lg" />
                  </div>
                </div>
              </motion.div>
            ))}
            
            {/* Additional Info Card */}
            <motion.div
              variants={fadeInUp}
              className={`rounded-xl p-6 border-2 ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700' 
                  : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div>
                  <h4 className={`font-semibold ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>تغطية وطنية</h4>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>الوصول إلى 85٪ من سكان سوريا من خلال المواقع الاستراتيجية</p>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colors.primary.bg}`}>
                  <Icon icon="mdi:chart-bar" className="text-white text-lg" />
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