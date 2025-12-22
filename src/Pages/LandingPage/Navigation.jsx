import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import ChatInterface from './ChatInterface'; // Adjust the path as needed

const Navigation = ({ 
  isDarkMode, 
  setIsDarkMode, 
  activeSection, 
  isMenuOpen, 
  setIsMenuOpen,
  companyName,
  arabicName 
}) => {
  // Add state for chat interface visibility
  const [isChatOpen, setIsChatOpen] = useState(false);

  const navigationItems = [
    { id: 'vision', label: 'رؤيتنا' },
    { id: 'services', label: 'خدماتنا' },
    { id: 'billboards', label: 'أنواع اللوحات' },
    { id: 'why-us', label: 'لماذا نحن' },
    { id: 'branches', label: 'فروعنا' },
    { id: 'advertisers', label: 'كبار المعلنين' },
    { id: 'ai', label: 'المساعد الذكي' } 
  ];

  const colors = {
    primary: {
      text: isDarkMode ? 'text-red-400' : 'text-red-600',
      bg: isDarkMode ? 'bg-red-500' : 'bg-red-600'
    }
  };

const handleNavigationClick = (itemId) => {
  if (itemId === 'ai') {
    setIsChatOpen(true);
    setIsMenuOpen(false);
  } else {
    setIsChatOpen(false);
    
    // Close mobile menu if open
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
    
    // Enhanced scrolling with multiple attempts
    scrollToSection(itemId);
  }
};

// New function to handle scrolling
const scrollToSection = (sectionId) => {
  // Attempt 1: Direct element lookup
  const element = document.getElementById(sectionId);
  
  if (element) {
    element.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
    return;
  }
  
  // Attempt 2: Try after a short delay (for components that might still be mounting)
  setTimeout(() => {
    const delayedElement = document.getElementById(sectionId);
    if (delayedElement) {
      delayedElement.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
      return;
    }
    
    // Attempt 3: If still not found, use URL hash
    window.location.hash = sectionId;
    
    // Attempt 4: Last resort - scroll to top
    if (!delayedElement) {
      console.warn(`Section with id "${sectionId}" not found. Scrolling to top.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, 100);
};

  return (
    <>
      <nav className={`fixed top-0 w-full z-50 border-b transition-all duration-300 ${
        isDarkMode 
          ? 'bg-gray-900/80 backdrop-blur-lg border-gray-700' 
          : 'bg-white/80 backdrop-blur-lg border-gray-200'
      }`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                {/*
                
                <img 

                  src="/src/assets/images/adv_syrian.png" 
                  alt="إعلان طرقية"
                  className="w-full h-full object-contain"
                />
                
                */}
                
              </div>
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-red-600 to-green-600 bg-clip-text text-transparent leading-tight">
                  {companyName}
                </span>
                <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-arabic leading-tight">
                  {arabicName}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Dark Mode Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-lg transition-colors duration-300 flex-shrink-0 ${
                  isDarkMode 
                    ? 'bg-gray-700 text-yellow-300 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Icon icon={isDarkMode ? "mdi:weather-sunny" : "mdi:weather-night"} className="text-lg" />
              </motion.button>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
                {navigationItems.map((item) => (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleNavigationClick(item.id)}
                    className={`font-medium transition-all duration-300 hover:scale-105 px-3 py-2 rounded-lg text-sm lg:text-base ${
                      item.id === 'ai' ? 'relative' : ''
                    } ${
                      activeSection === item.id || (item.id === 'ai' && isChatOpen)
                        ? `${colors.primary.text} font-semibold bg-red-50 dark:bg-red-900/20` 
                        : `${
                            isDarkMode 
                              ? 'text-gray-300 hover:text-white' 
                              : 'text-gray-600 hover:text-gray-900'
                          }`
                    }`}
                  >
                    {item.label}
                    {item.id === 'ai' && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-white dark:border-gray-900"></span>
                      </span>
                    )}
                  </motion.button>
                ))}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 lg:px-6 lg:py-2 ${colors.primary.bg} text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-sm lg:text-base flex-shrink-0`}
                >
                  احصل على عرض سعر
                </motion.button>
              </div>

              {/* Mobile Menu Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="md:hidden p-2 flex-shrink-0"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <div className="w-6 h-6 relative">
                  <span className={`absolute top-1/2 right-0 w-6 h-0.5 transform transition-all duration-300 ${
                    isDarkMode ? 'bg-white' : 'bg-gray-800'
                  } ${isMenuOpen ? 'rotate-45 translate-y-0' : '-translate-y-2'}`}></span>
                  <span className={`absolute top-1/2 right-0 w-6 h-0.5 transform transition-all duration-300 ${
                    isDarkMode ? 'bg-white' : 'bg-gray-800'
                  } ${isMenuOpen ? 'opacity-0' : ''}`}></span>
                  <span className={`absolute top-1/2 right-0 w-6 h-0.5 transform transition-all duration-300 ${
                    isDarkMode ? 'bg-white' : 'bg-gray-800'
                  } ${isMenuOpen ? '-rotate-45 translate-y-0' : 'translate-y-2'}`}></span>
                </div>
              </motion.button>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`md:hidden mt-2 space-y-1 pb-4 rounded-lg ${
                  isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
                }`}
              >
                {navigationItems.map((item) => (
                  <motion.button
                    key={item.id}
                    onClick={() => {
                      handleNavigationClick(item.id);
                      setIsMenuOpen(false);
                    }}
                    className={`block w-full text-right py-3 px-4 rounded-lg transition-colors duration-200 text-sm ${
                      activeSection === item.id || (item.id === 'ai' && isChatOpen)
                        ? `${colors.primary.text} font-semibold bg-red-50 dark:bg-red-900/20` 
                        : `${
                            isDarkMode 
                              ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                              : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                          }`
                    }`}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between">
                      {item.label}
                      {item.id === 'ai' && (
                        <span className="flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                        </span>
                      )}
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Chat Interface Overlay */}
      <AnimatePresence>
        {isChatOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChatOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999]"
            />
            
            {/* Chat Interface */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 20 }}
              className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
            >
              <div className="relative w-full max-w-6xl h-[85vh]">
                {/* Close Button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsChatOpen(false)}
                  className="absolute -top-10 right-0 p-2 rounded-full bg-gray-800 text-white hover:bg-gray-700 z-10"
                >
                  <Icon icon="mdi:close" className="w-6 h-6" />
                </motion.button>
                
                <ChatInterface />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navigation;