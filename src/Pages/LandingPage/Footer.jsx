import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

const Footer = ({ companyName, arabicName, isDarkMode }) => {
  const navigationItems = [
    { id: 'vision', label: 'رؤيتنا' },
    { id: 'services', label: 'خدماتنا' },
    { id: 'billboards', label: 'أنواع اللوحات' },
    { id: 'why-us', label: 'لماذا نحن' },
    { id: 'branches', label: 'فروعنا' },
    { id: 'advertisers', label: 'كبار المعلنين' }
  ];

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className={`py-12 sm:py-16 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-800'
    } text-white`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <div className="sm:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center space-x-3 mb-4 sm:mb-6"
            >
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                
                {/*
                
                <img 
                  src="/src/assets/images/adv_syrian.png" 
                  alt="إعلان طرقية"
                  className="w-full h-full object-contain"
                />

                */}

                
              </div>
              <div className="flex flex-col text-right">
                <span className="text-xl sm:text-2xl font-bold">{companyName}</span>
                <span className="text-xs sm:text-sm text-gray-400 font-arabic">{arabicName}</span>
              </div>
            </motion.div>
            <p className="text-gray-400 mb-4 sm:mb-6 max-w-md text-sm sm:text-base text-right">
              شريكك الموثوق للإعلان الطرقي الاستراتيجي في جميع أنحاء سوريا. ضع علامتك التجارية في المقدمة مع حلولنا المتميزة للوحات الإعلانية والإشارات.
            </p>
            <div className="flex space-x-3 sm:space-x-4 justify-end">
              {[
                { 
                  icon: 'mdi:facebook', 
                  url: 'https://www.facebook.com/share/1DF8kxB9mv/',
                  label: 'فيسبوك'
                },
                { 
                  icon: 'mdi:instagram', 
                  url: 'https://www.instagram.com/syrian.advertisement?igsh=MW9tNG9jNzFnczAzag==',
                  label: 'انستغرام'
                },
                { 
                  icon: 'mdi:whatsapp', 
                  url: 'https://wa.me/963939333336',
                  label: 'واتساب'
                }
              ].map((social, index) => (
                <motion.a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-600 transition-colors duration-300 flex-shrink-0"
                  aria-label={`تابعنا على ${social.label}`}
                >
                  <Icon icon={social.icon} className="text-sm sm:text-xl" />
                </motion.a>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-3 sm:mb-4 text-right">روابط سريعة</h4>
            <ul className="space-y-2 sm:space-y-3">
              {navigationItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => scrollToSection(item.id)}
                    className="text-gray-400 hover:text-white transition-colors duration-300 text-right text-sm sm:text-base block w-full"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-3 sm:mb-4 text-right">معلومات الاتصال</h4>
            <ul className="space-y-2 sm:space-y-3 text-gray-400 text-sm sm:text-base text-right">
              <li className="flex items-center space-x-2 justify-end">
                <span style={{direction:"rtl"}} className="text-right">
                  دمشق: 0939333336 - 0112333422
                    <br />
                  حلب: 0992400040 - 0212222140
                    <br />
                حمص: 0989888623 - 0122223344
                    <br />
                طرطوس: 0944333322 - 0182221188
                </span>
                



                <Icon icon="mdi:phone" className="text-lg flex-shrink-0" />
              </li>
              <li className="flex items-center space-x-2 justify-end">
                <a href="http://www.syrian-advertisment.com" target="_blank" rel="noopener noreferrer">www.syrian-advertisment.com</a>
                <Icon icon="mdi:email" className="text-lg flex-shrink-0" />
              </li>
              <li className="flex items-center space-x-2 justify-end">
                <span>دمشق، سوريا</span>
                <Icon icon="mdi:map-marker" className="text-lg flex-shrink-0" />
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 sm:mt-12 pt-6 sm:pt-8 text-center text-gray-400 text-sm sm:text-base">
          <p>&copy; {new Date().getFullYear()} {companyName}. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;