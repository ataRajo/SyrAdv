import React, { forwardRef, useState, useRef, useEffect } from 'react';
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
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [touchActive, setTouchActive] = useState(null);
  const [rotation, setRotation] = useState({});
  const [showRotationHint, setShowRotationHint] = useState(false);
  const containerRefs = useRef({});

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

  // Mouse events for desktop
  const handleMouseMove = (e, index) => {
    if (!containerRefs.current[index]) return;
    
    const container = containerRefs.current[index];
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate rotation based on mouse position
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const deltaX = x - centerX;
    const deltaY = y - centerY;
    
    // Calculate rotation angles (normalized)
    const rotateY = (deltaX / centerX) * 20; // Max 20 degrees
    const rotateX = -(deltaY / centerY) * 10; // Max 10 degrees
    
    setRotation(prev => ({
      ...prev,
      [index]: { rotateX, rotateY }
    }));
  };

  const handleMouseLeave = (index) => {
    setRotation(prev => ({
      ...prev,
      [index]: { rotateX: 0, rotateY: 0 }
    }));
    setHoveredIndex(null);
  };

  // Touch events for mobile
  const handleTouchStart = (e, index) => {
    e.preventDefault();
    setTouchActive(index);
    
    // Show rotation hint on first touch
    if (!localStorage.getItem('rotationHintShown')) {
      setShowRotationHint(true);
      setTimeout(() => setShowRotationHint(false), 3000);
      localStorage.setItem('rotationHintShown', 'true');
    }
  };

  const handleTouchMove = (e, index) => {
    if (touchActive !== index) return;
    e.preventDefault();
    
    if (!containerRefs.current[index]) return;
    
    const touch = e.touches[0];
    const container = containerRefs.current[index];
    const rect = container.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    // Calculate rotation based on touch position
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const deltaX = x - centerX;
    const deltaY = y - centerY;
    
    // Calculate rotation angles (more sensitive for touch)
    const rotateY = (deltaX / centerX) * 30; // Max 30 degrees for touch
    const rotateX = -(deltaY / centerY) * 15; // Max 15 degrees for touch
    
    setRotation(prev => ({
      ...prev,
      [index]: { rotateX, rotateY }
    }));
  };

  const handleTouchEnd = (index) => {
    setTouchActive(null);
    
    // Animate back to original position
    setTimeout(() => {
      setRotation(prev => ({
        ...prev,
        [index]: { rotateX: 0, rotateY: 0 }
      }));
    }, 300);
  };

  // Handle click/tap
  const handleCardClick = (billboard, index) => {
    if (touchActive === index) {
      // If touch is active, it's a rotation gesture, not a click
      return;
    }
    onBillboardClick(billboard);
  };

  // Double tap for mobile
  const [lastTap, setLastTap] = useState(0);
  const handleDoubleTap = (e, billboard) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    
    if (tapLength < 300 && tapLength > 0) {
      // Double tap detected
      e.preventDefault();
      onBillboardClick(billboard);
    }
    setLastTap(currentTime);
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
            {typeof window !== 'undefined' && window.innerWidth < 768 
              ? 'اسحب بأصبعك على اللوحة لتدويرها 360°'
              : 'انقر على أي لوحة لعرضها بتقنية 360° وتفاصيل التركيب'
            }
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
              className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-2xl border-2 transition-all duration-300 group cursor-pointer relative ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 hover:border-red-500' 
                  : 'bg-white border-gray-200 hover:border-red-400'
              } ${touchActive === index ? 'scale-105' : ''}`}
              onClick={() => handleCardClick(billboard, index)}
              onTouchStart={(e) => handleDoubleTap(e, billboard)}
            >
              <div 
                ref={el => containerRefs.current[index] = el}
                className="relative h-36 sm:h-40 mb-4 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
                onMouseMove={(e) => handleMouseMove(e, index)}
                onMouseLeave={() => handleMouseLeave(index)}
                onMouseEnter={() => setHoveredIndex(index)}
                onTouchStart={(e) => handleTouchStart(e, index)}
                onTouchMove={(e) => handleTouchMove(e, index)}
                onTouchEnd={() => handleTouchEnd(index)}
                style={{
                  transform: rotation[index] 
                    ? `perspective(1000px) rotateX(${rotation[index].rotateX}deg) rotateY(${rotation[index].rotateY}deg)`
                    : 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
                  transition: touchActive === index ? 'transform 0.1s' : 'transform 0.3s ease-out'
                }}
              >
                <img 
                  src={billboard.image} 
                  alt={billboard.name}
                  className="w-full h-full object-contain transition-transform duration-300"
                  style={{
                    transform: rotation[index] 
                      ? `scale(1.1) rotateX(${rotation[index].rotateX * 0.5}deg) rotateY(${rotation[index].rotateY * 0.5}deg)`
                      : 'scale(1)',
                  }}
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
                
                {/* Rotation hint overlay for mobile */}
                {typeof window !== 'undefined' && window.innerWidth < 768 && (
                  <div className={`absolute inset-0 bg-black/0 flex items-center justify-center transition-all duration-300 ${
                    hoveredIndex === index || touchActive === index ? 'bg-black/10' : ''
                  }`}>
                    <div className={`transition-opacity duration-300 ${
                      touchActive === index ? 'opacity-100' : 'opacity-0'
                    }`}>
                      <Icon icon="mdi:rotate-3d" className="text-white/80 text-2xl sm:text-3xl" />
                    </div>
                  </div>
                )}
                
                {/* Desktop hover effect */}
                {typeof window !== 'undefined' && window.innerWidth >= 768 && (
                  <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                    hoveredIndex === index ? 'bg-black/20' : 'bg-black/0'
                  }`}>
                    <div className={`transition-opacity duration-300 ${
                      hoveredIndex === index ? 'opacity-100' : 'opacity-0'
                    }`}>
                      <Icon icon="mdi:rotate-3d" className="text-white text-2xl sm:text-3xl" />
                    </div>
                  </div>
                )}
              </div>
              
              <h3 className={`text-base sm:text-lg font-bold mb-1 sm:mb-2 text-center ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                {billboard.name}
              </h3>
              <p className={`text-xs sm:text-sm text-center ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {billboard.size}
              </p>
              
              <div className="mt-3 flex flex-col items-center gap-1">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                }`}>
                  {typeof window !== 'undefined' && window.innerWidth < 768 
                    ? 'اسحب لتدوير' 
                    : 'مرر للتدوير'
                  }
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-600'
                }`}>
                  {typeof window !== 'undefined' && window.innerWidth < 768 
                    ? 'انقر مرتين للتكبير' 
                    : 'انقر '
                  }
                </span>
              </div>

              {/* Mobile rotation hint */}
              {showRotationHint && index === 0 && (
                <div className="absolute -top-10 left-0 right-0 bg-blue-500 text-white text-xs py-2 px-3 rounded-lg animate-bounce">
                  <div className="flex items-center justify-center gap-2">
                    <Icon icon="mdi:gesture-swipe-horizontal" className="animate-pulse" />
                    <span>اسحب بأصبعك لتدوير اللوحة</span>
                  </div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                    <div className="w-3 h-3 bg-blue-500 rotate-45"></div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Mobile instructions */}
        {typeof window !== 'undefined' && window.innerWidth < 768 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="mt-8 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center flex-shrink-0">
                <Icon icon="mdi:gesture-tap" className="text-blue-600 dark:text-blue-300 text-xl" />
              </div>
              <div>
                <h4 className="font-bold text-blue-800 dark:text-blue-300 text-sm">تعليمات الاستخدام على الجوال:</h4>
                <ul className="text-xs text-blue-700 dark:text-blue-400 mt-1 space-y-1">
                  <li className="flex items-center gap-2">
                    <Icon icon="mdi:gesture-swipe" className="text-blue-500" />
                    <span>اسحب بأصبعك على اللوحة لتدويرها 360°</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon icon="mdi:gesture-tap" className="text-blue-500" />
                    <span>انقر مرتين على اللوحة لعرضها بحجم كامل</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
});

export default BillboardsSection;