import React, { forwardRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

const topAdvertisers = [
  { 
    name: "الشهية", 
    image: "/images/alshaheya.png", 
    description: "مطعم الشهية - إعلان على الطريق الرئيسي",
    location: "طرطوس الساحلي"
  },
  { 
    name: "جيسي", 
    image: "/images/jessy.png",
    description: "جيسي للملابس - لوحة إعلانية استراتيجية",
    location: "دمشق - المزة"
  },
  { 
    name: "بطاريات الهاشمي", 
    image: "/images/hashmi.png", 
    description: "بطاريات الهاشمي - إعلان على الطريق السريع",
    location: "حمص - طريق حماه"
  }
];

const AdvertisersSection = forwardRef(({ inView, isDarkMode }, ref) => {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [imageRotation, setImageRotation] = useState({ x: 0, y: 0 });

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
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

  // Image rotation handler
  const handleImageMouseMove = (e, index) => {
    const imageContainer = e.currentTarget;
    const rect = imageContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateY = ((x - centerX) / centerX) * 15; // Increased rotation for better effect
    const rotateX = ((centerY - y) / centerY) * 15;
    
    setImageRotation(prev => ({
      ...prev,
      [index]: { x: rotateX, y: rotateY }
    }));
  };

  const handleImageMouseLeave = (index) => {
    setImageRotation(prev => ({
      ...prev,
      [index]: { x: 0, y: 0 }
    }));
    setHoveredCard(null);
  };

  const handleImageMouseEnter = (index) => {
    setHoveredCard(index);
  };

  // Reset rotation when not hovering
  const resetImageRotation = (index) => {
    setTimeout(() => {
      setImageRotation(prev => ({
        ...prev,
        [index]: { x: 0, y: 0 }
      }));
    }, 200);
  };

  return (
    <section id="advertisers" ref={ref} className={`py-16 sm:py-20 ${
      isDarkMode 
        ? 'bg-gradient-to-r from-gray-900 to-black' 
        : 'bg-gradient-to-r from-gray-800 to-gray-900'
    } text-white overflow-hidden`}>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-red-500/10 to-green-500/10"
            style={{
              width: Math.random() * 100 + 50,
              height: Math.random() * 100 + 50,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 40 - 20, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="text-center mb-12 sm:mb-16"
        >
          <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            كبار <span className="text-red-400">المعلنين</span>
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-lg sm:text-xl max-w-2xl mx-auto text-gray-300"
          >
            إعلانات حقيقية على الطرق لعلامات تجارية رائدة
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12"
        >
          {topAdvertisers.map((advertiser, index) => (
            <motion.div
              key={index}
              variants={scaleIn}
              className="group cursor-pointer"
              whileHover={{ 
                y: -8,
                transition: { duration: 0.3 }
              }}
            >
              {/* Main Card - Stable (No Rotation) */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-red-400/50 transition-all duration-500">
                
                {/* Image Container with 3D Rotation */}
                <div 
                  className="relative h-64 sm:h-80 overflow-hidden"
                  onMouseMove={(e) => handleImageMouseMove(e, index)}
                  onMouseLeave={() => handleImageMouseLeave(index)}
                  onMouseEnter={() => handleImageMouseEnter(index)}
                  style={{
                    transformStyle: 'preserve-3d',
                    perspective: '1000px'
                  }}
                >
                  {/* Rotating Image */}
                  <motion.img 
                    src={advertiser.image} 
                    alt={`إعلان ${advertiser.name}`}
                    className="w-full h-full object-cover"
                    style={{
                      transform: imageRotation[index] 
                        ? `perspective(1000px) rotateX(${imageRotation[index].x}deg) rotateY(${imageRotation[index].y}deg) scale3d(1.1, 1.1, 1.1)`
                        : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
                      transformStyle: 'preserve-3d',
                      transition: 'transform 0.1s ease-out'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const fallback = e.target.parentElement.querySelector('.ad-fallback');
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  
                  {/* Fallback Content with 3D Rotation */}
                  <div 
                    className="absolute inset-0 hidden items-center justify-center flex-col ad-fallback bg-gradient-to-br from-red-600 to-green-600"
                    style={{
                      transform: imageRotation[index] 
                        ? `perspective(1000px) rotateX(${imageRotation[index].x}deg) rotateY(${imageRotation[index].y}deg)`
                        : 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
                      transformStyle: 'preserve-3d',
                      transition: 'transform 0.1s ease-out'
                    }}
                  >
                    <motion.div
                      animate={{ rotateY: hoveredCard === index ? 180 : 0 }}
                      transition={{ duration: 0.6 }}
                    >
                      <Icon icon="mdi:billboard" className="text-6xl text-white mb-4 opacity-80" />
                    </motion.div>
                    <span className="text-white text-lg font-bold">إعلان {advertiser.name}</span>
                  </div>
                  
                  {/* Dynamic Gradient Overlay - Also Rotates */}
                  <div 
                    className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-all duration-500"
                    style={{
                      background: hoveredCard === index 
                        ? 'linear-gradient(45deg, rgba(220,38,38,0.3), rgba(34,197,94,0.3), rgba(59,130,246,0.3))'
                        : 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                      transform: imageRotation[index] 
                        ? `perspective(1000px) rotateX(${imageRotation[index].x}deg) rotateY(${imageRotation[index].y}deg)`
                        : 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
                      transformStyle: 'preserve-3d',
                      transition: 'transform 0.1s ease-out'
                    }}
                  />
                  
                  {/* Location Badge - Stays Fixed (No Rotation) */}
                  <motion.div 
                    className="absolute top-4 left-4"
                    whileHover={{ 
                      scale: 1.1,
                      y: -2
                    }}
                  >
                    <div className="bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1 border border-white/20">
                      <Icon icon="mdi:map-marker" className="text-red-400 text-sm" />
                      <span className="text-white text-xs font-medium">{advertiser.location}</span>
                    </div>
                  </motion.div>

                  {/* 3D Rotation Indicator - Stays Fixed */}
                  <motion.div 
                    className="absolute bottom-4 right-4"
                    animate={{
                      rotateY: hoveredCard === index ? 360 : 0,
                      scale: hoveredCard === index ? 1.2 : 1
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="bg-red-500/80 rounded-full p-2 backdrop-blur-sm">
                      <Icon icon="mdi:3d-rotation" className="text-white text-sm" />
                    </div>
                  </motion.div>

                  {/* Rotation Guide Text */}
                  <motion.div 
                    className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: hoveredCard === index ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
                      <span className="text-white text-xs flex items-center">
                        <Icon icon="mdi:gesture-swipe" className="ml-1" />
                        حرك الماوس لتدوير الصورة
                      </span>
                    </div>
                  </motion.div>
                </div>
                
                {/* Card Content - Stays Fixed (No Rotation) */}
                <div className="p-6 relative">
                  <motion.h3 
                    className="text-xl font-bold mb-2 text-center bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
                    whileHover={{ scale: 1.05 }}
                  >
                    {advertiser.name}
                  </motion.h3>
                  
                  <motion.p 
                    className="text-gray-300 text-sm text-center leading-relaxed mb-4"
                    whileHover={{ scale: 1.02 }}
                  >
                    {advertiser.description}
                  </motion.p>
                  
                  <div className="flex justify-center space-x-6 text-center">
                    <motion.div whileHover={{ scale: 1.1 }}>
                      <div className="text-red-400 font-bold text-lg">24/7</div>
                      <div className="text-gray-400 text-xs">رؤية مستمرة</div>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.1 }}>
                      <div className="text-green-400 font-bold text-lg">98%</div>
                      <div className="text-gray-400 text-xs">معدل الرؤية</div>
                    </motion.div>
                  </div>
                </div>
                
                {/* Glow Effect - Stays Fixed */}
                <div 
                  className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-red-400/30 transition-all duration-500 pointer-events-none"
                  style={{
                    boxShadow: hoveredCard === index 
                      ? '0 0 30px rgba(220, 38, 38, 0.3), 0 0 60px rgba(34, 197, 94, 0.2)'
                      : 'none',
                  }}
                />
              </div>

              {/* Shadow - Stays Fixed */}
              <motion.div 
                className="absolute inset-0 rounded-2xl bg-black/20 blur-xl -z-10"
                animate={{
                  scale: hoveredCard === index ? 1.1 : 1,
                  opacity: hoveredCard === index ? 0.3 : 0.1
                }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Trust Badge - Stays Fixed */}
        <motion.div
          variants={fadeInUp}
          className="text-center mt-16"
          whileHover={{ 
            scale: 1.05,
          }}
        >
          <div className="inline-flex items-center space-x-2 bg-white/5 rounded-full px-6 py-3 border border-white/10 backdrop-blur-sm">
            <motion.div
              animate={{ rotateY: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Icon icon="mdi:shield-check" className="text-green-400 text-xl" />
            </motion.div>
            <span className="text-gray-300 text-sm font-medium">
              شريك إعلاني موثوق للعلامات التجارية الرائدة
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
});

export default AdvertisersSection;