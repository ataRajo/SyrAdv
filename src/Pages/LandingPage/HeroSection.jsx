import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

const HeroSection = forwardRef(({ inView, isDarkMode }, ref) => {
  const colors = {
    primary: {
      bg: isDarkMode ? 'bg-red-500' : 'bg-red-600',
      text: isDarkMode ? 'text-red-400' : 'text-red-600'
    }
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
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

  const scaleIn = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <section id="hero" ref={ref} className="min-h-screen flex items-center justify-center pt-20 pb-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <motion.div
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            variants={staggerContainer}
            className="text-center lg:text-right"
          >
            <motion.div
              variants={fadeInUp}
              className={`inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border mb-4 sm:mb-6 text-xs sm:text-sm ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700 text-green-400' 
                  : 'bg-green-50 border-green-200 text-green-700'
              }`}
            >
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full ml-2 animate-pulse flex-shrink-0"></span>
              <span className="font-medium">تغطية إعلانية على مستوى الجمهورية العربية السورية </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 leading-tight"
            >
              <span className={isDarkMode ? 'text-white' : 'text-gray-800'}>
                الإعلان
              </span>
              <br />
              <span className={`bg-gradient-to-r ${colors.primary.bg} bg-clip-text text-transparent`}>
                الطرقي
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className={`text-lg sm:text-xl mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              ضع علامتك التجارية في المقدمة مع مواقعنا الإعلانية الاستراتيجية على الطرق السورية الأكثر ازدحاماً والطرق السريعة.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-end"
            >
              
              
              
              {/*

<motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-6 py-3 sm:px-8 sm:py-4 ${colors.primary.bg} text-white rounded-2xl font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center space-x-2 text-sm sm:text-base`}
                onClick={() => scrollToSection('form')}
              >
                <Icon icon="mdi:phone" className="text-lg sm:text-xl flex-shrink-0" />
                <span> للاستفسار وارسال طلب</span>
              </motion.button>

<motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-6 py-3 sm:px-8 sm:py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border-2 text-sm sm:text-base ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700 text-white hover:border-gray-600' 
                    : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
                onClick={() => scrollToSection('services')}
              >
                عرض الخدمات
              </motion.button>
              */}


              
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="flex items-center justify-center lg:justify-end space-x-6 sm:space-x-8 mt-6 sm:mt-8"
            >
              {[
                { value: '+800', label: 'لوحة إعلانية' },
                { value: '24/7', label: 'رؤية مستمرة' },
                { value: '98%', label: 'تغطية' }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className={`text-xl sm:text-2xl font-bold ${colors.primary.text}`}>{stat.value}</div>
                  <div className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            variants={staggerContainer}
            className="relative mt-8 lg:mt-0"
          >
            <motion.div
              variants={scaleIn}
              className="relative z-10"
            >
              <div className={`rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl border ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' 
                  : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
              }`}>
                <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full"></div>
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className={`text-xs sm:text-sm font-medium ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>عرض سعر سريع</div>
                  </div>
                  
                  <div className="space-y-3 sm:space-y-4">
                    {[
                      { icon: 'mdi:billboard', title: 'إعلانات اللوحات', desc: 'مواقع عالية الرؤية' },
                      { icon: 'mdi:road', title: 'لافتات الطرق', desc: 'مواقع استراتيجية' },
                      { icon: 'mdi:chart-line', title: 'نتائج مثبتة', desc: 'تأثير قابل للقياس' }
                    ].map((service, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="flex-1 min-w-0 text-right">
                          <div className={`font-semibold text-sm sm:text-base ${
                            isDarkMode ? 'text-white' : 'text-gray-800'
                          }`}>{service.title}</div>
                          <div className={`text-xs sm:text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          } truncate`}>{service.desc}</div>
                        </div>
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 ${colors.primary.bg} rounded-full flex items-center justify-center flex-shrink-0`}>
                          <Icon icon={service.icon} className="text-white text-sm sm:text-lg" />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/*
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    className={`mt-4 sm:mt-6 ${colors.primary.bg} text-white py-2 sm:py-3 px-4 rounded-xl text-center font-semibold cursor-pointer shadow-lg w-full text-sm sm:text-base`}
                    onClick={() => scrollToSection('form')}
                  >
                    احصل على استشارة مجانية
                  </motion.button>
                  
                  */}
                  
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
});

export default HeroSection;