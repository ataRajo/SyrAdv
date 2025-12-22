import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';

const BillboardModal = ({ billboard, isOpen, onClose }) => {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  const modalRef = useRef(null);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        setRotation(prev => ({ ...prev, y: (prev.y - 10) % 360 }));
      } else if (e.key === 'ArrowRight') {
        setRotation(prev => ({ ...prev, y: (prev.y + 10) % 360 }));
      } else if (e.key === 'ArrowUp') {
        setRotation(prev => ({ ...prev, x: (prev.x - 10) % 360 }));
      } else if (e.key === 'ArrowDown') {
        setRotation(prev => ({ ...prev, x: (prev.x + 10) % 360 }));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Event handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - startPosition.x;
    const deltaY = e.clientY - startPosition.y;
    
    setRotation(prev => ({
      x: (prev.x + deltaY * 0.5) % 360,
      y: (prev.y + deltaX * 0.5) % 360
    }));
    
    setStartPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartPosition({ 
      x: e.touches[0].clientX, 
      y: e.touches[0].clientY 
    });
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    
    const deltaX = e.touches[0].clientX - startPosition.x;
    const deltaY = e.touches[0].clientY - startPosition.y;
    
    setRotation(prev => ({
      x: (prev.x + deltaY * 0.5) % 360,
      y: (prev.y + deltaX * 0.5) % 360
    }));
    
    setStartPosition({ 
      x: e.touches[0].clientX, 
      y: e.touches[0].clientY 
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const resetRotation = () => {
    setRotation({ x: 0, y: 0 });
  };

  const rotateLeft = () => {
    setRotation(prev => ({ ...prev, y: (prev.y - 45) % 360 }));
  };

  const rotateRight = () => {
    setRotation(prev => ({ ...prev, y: (prev.y + 45) % 360 }));
  };

  const rotateUp = () => {
    setRotation(prev => ({ ...prev, x: (prev.x - 45) % 360 }));
  };

  const rotateDown = () => {
    setRotation(prev => ({ ...prev, x: (prev.x + 45) % 360 }));
  };

  if (!isOpen || !billboard) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-lg"
      >
        <motion.div
          ref={modalRef}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", damping: 25 }}
          className="relative bg-gray-900 rounded-3xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full ${billboard.name.includes('TR-X') ? 'bg-red-500' : billboard.name.includes('EXL') ? 'bg-blue-500' : billboard.name.includes('XL') ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <h2 className="text-2xl font-bold text-white">{billboard.name}</h2>
              <span className="text-gray-400 text-lg">{billboard.size}</span>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Rotation Controls */}
              <div className="flex items-center space-x-2 bg-gray-800 rounded-full px-3 py-2">
                <button onClick={rotateLeft} className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors">
                  <Icon icon="mdi:rotate-left" className="text-white text-lg" />
                </button>
                <button onClick={rotateUp} className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors">
                  <Icon icon="mdi:arrow-up" className="text-white text-lg" />
                </button>
                <button onClick={resetRotation} className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors">
                  <Icon icon="mdi:refresh" className="text-white text-lg" />
                </button>
                <button onClick={rotateDown} className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors">
                  <Icon icon="mdi:arrow-down" className="text-white text-lg" />
                </button>
                <button onClick={rotateRight} className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors">
                  <Icon icon="mdi:rotate-right" className="text-white text-lg" />
                </button>
              </div>
              
              <button onClick={onClose} className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors">
                <Icon icon="mdi:close" className="text-white text-xl" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex justify-center">
              {/* Billboard Viewer */}
              <div 
                className="relative bg-gray-800 rounded-2xl p-8 flex items-center justify-center min-h-[500px] w-full max-w-2xl cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* 3D Billboard Container */}
                <motion.div
                  className="relative w-64 h-96"
                  style={{ 
                    rotateX: rotation.x,
                    rotateY: rotation.y,
                    transformStyle: 'preserve-3d',
                    perspective: '1000px'
                  }}
                  animate={{ rotateX: rotation.x, rotateY: rotation.y }}
                  transition={{ type: "spring", stiffness: 50, damping: 20 }}
                >
                  {/* Front Side */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-2xl flex items-center justify-center backface-hidden" style={{ backfaceVisibility: 'hidden' }}>
                    <img 
                      src={billboard.image} 
                      alt={`${billboard.name} - أمامي`}
                      className="w-full h-full object-contain rounded-xl"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const fallback = e.target.parentElement.querySelector('.front-fallback');
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    <div className="absolute inset-0 hidden items-center justify-center flex-col front-fallback">
                      <Icon icon="mdi:billboard" className="text-6xl text-white mb-4" />
                      <span className="text-white text-lg font-bold">الواجهة الأمامية</span>
                    </div>
                  </div>
                  
                  {/* Back Side */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-800 rounded-xl shadow-2xl flex items-center justify-center backface-hidden"
                       style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}>
                    <div className="text-center text-white p-6">
                      <Icon icon="mdi:construction" className="text-6xl mb-4 text-yellow-400" />
                    </div>
                  </div>
                </motion.div>

                {/* Rotation Guide */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
                  <div className="flex items-center space-x-2 text-white text-sm">
                    <Icon icon="mdi:gesture-swipe" className="text-lg" />
                    <span>اسحب لتدوير اللوحة 360°</span>
                  </div>
                </div>

                {/* Rotation Degree Indicator */}
                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
                  <span className="text-white text-sm font-mono">
                    X: {Math.abs(rotation.x % 360)}° Y: {Math.abs(rotation.y % 360)}°
                  </span>
                </div>
              </div>
            </div>

            {/* Features and Order Button */}
            <div className="mt-6 max-w-2xl mx-auto">
              <div className="bg-gray-800 rounded-2xl p-6 mb-4">
                <h3 className="text-xl font-bold text-white mb-4">مميزات التركيب</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: 'mdi:shield-sun', label: 'مقاوم للأشعة', color: 'text-yellow-400' },
                    { icon: 'mdi:weather-windy', label: 'مقاوم للرياح', color: 'text-blue-400' },
                    { icon: 'mdi:water', label: 'مقاوم للمطر', color: 'text-cyan-400' },
                    { icon: 'mdi:lightning-bolt', label: 'إضاءة قوية', color: 'text-green-400' }
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2 bg-gray-700 rounded-lg p-3">
                      <Icon icon={feature.icon} className={`text-lg ${feature.color}`} />
                      <span className="text-white text-sm">{feature.label}</span>
                    </div>
                  ))}
                </div>
              </div>


              <button className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-4 rounded-2xl font-bold text-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg">
                طلب هذه اللوحة
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BillboardModal;