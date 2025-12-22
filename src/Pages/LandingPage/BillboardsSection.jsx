import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

const billboardTypes = [
  { name: "لوحات TR-X", size: "310×900 سم", image: "/images/TRX.png" },
  { name: "لوحات EXL", size: "310×650 سم", image: "/images/EXL.png" },
  { name: "لوحات EXL", size: "650×310 سم", image: "/images/EXL1.png" },
  { name: "لوحات XL", size: "500×250 سم", image: "/images/XL1.png" },
  { name: "لوحات XL", size: "250×500 سم", image: "/images/XL.png" },
  { name: "لوحات L", size: "300×150 سم", image: "/images/L.png" },
  { name: "لوحات EV", size: "210×120 سم", image: "/images/EV.png" },
  { name: "لوحات V", size: "160×100 سم", image: "/images/V.png" },
  { name: "لوحات XLM", size: "400×200 سم", image: "/images/XLM.png" }
];

const BillboardsSection = forwardRef(({ inView, isDarkMode, onBillboardClick }, ref) => {
  const colors = {
    primary: {
      text: isDarkMode ? 'text-red-400' : 'text-red-600'
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
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
    <section id="billboards" ref={ref} className={`py-16 sm:py-20 ${
      isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50/50'
    }`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="text-center mb-12 sm:mb-16"
        >
          <motion.h2 variants={scaleIn} className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            أنواع <span className={colors.primary.text}>اللوحات</span>
          </motion.h2>
          <motion.p
            variants={scaleIn}
            className={`text-lg sm:text-xl max-w-2xl mx-auto ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}
          >
            انقر على أي لوحة لعرضها بتقنية 360° وتفاصيل التركيب
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8"
        >
          {billboardTypes.map((billboard, index) => (
            <motion.div
              key={index}
              variants={scaleIn}
              whileHover={{ 
                scale: 1.05,
                y: -8,
              }}
              className={`rounded-xl sm:rounded-2xl p-6 shadow-lg hover:shadow-2xl border-2 transition-all duration-300 group cursor-pointer ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 hover:border-red-500' 
                  : 'bg-white border-gray-200 hover:border-red-400'
              }`}
              onClick={() => onBillboardClick(billboard)}
            >
              <div className="relative h-40 mb-4 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <img 
                  src={billboard.image} 
                  alt={billboard.name}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const fallback = e.target.parentElement.querySelector('.billboard-fallback');
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div className="absolute inset-0 hidden items-center justify-center flex-col billboard-fallback">
                  <Icon icon="mdi:billboard" className="text-4xl text-gray-400 mb-2" />
                  <span className="text-gray-500 text-sm">صورة {billboard.name}</span>
                </div>
                
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/50 rounded-full p-3">
                    <Icon icon="mdi:rotate-3d" className="text-white text-2xl" />
                  </div>
                </div>
              </div>
              
              <h3 className={`text-lg font-bold mb-2 text-center ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                {billboard.name}
              </h3>
              <p className={`text-sm text-center ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {billboard.size}
              </p>
              
              <div className="mt-3 flex justify-center">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                }`}>
                  انقر للعرض 360°
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
});

export default BillboardsSection;