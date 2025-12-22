import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

const VisionSection = forwardRef(({ inView, isDarkMode }, ref) => {
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
    <section id="vision" ref={ref} className={`py-16 sm:py-20 ${
      isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50/50'
    }`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="text-center mb-12 sm:mb-16"
        >
          <motion.h2
            variants={fadeInUp}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4"
          >
            <span className={colors.primary.text}>رؤيتنا</span>
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="max-w-4xl mx-auto"
        >
          <motion.div
            variants={fadeInUp}
            className={`rounded-2xl p-8 sm:p-12 shadow-2xl border ${
              isDarkMode 
                ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' 
                : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
            }`}
          >
            <div className="text-center mb-8">
              <div className={`w-20 h-20 ${colors.primary.bg} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                <Icon icon="mdi:eye" className="text-white text-3xl" />
              </div>
              <h3 className={`text-2xl sm:text-3xl font-bold mb-4 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                نطمح للريادة في الإعلان الطرقي
              </h3>
            </div>
            
            <div className={`space-y-4 text-lg leading-relaxed text-right ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              <p>
                <strong>نسعى لأن نكون الاختيار الأول والأفضل في مجال الإعلان الطرقي في سوريا،</strong> من خلال تقديم خدمات إعلانية متميزة تجمع بين الابتكار والجودة العالية والانتشار الواسع، وذلك لتحقيق أقصى استفادة ممكنة لعملائنا من حملاتهم الإعلانية.
              </p>
              <p>
                <strong>تماشياً مع الاتجاهات العالمية،</strong> نهدف إلى دمج التقنيات الرقمية والممارسات المستدامة في حلول الإعلان الخارجي لدينا، ووضع معايير جديدة للصناعة في سوريا.
              </p>
            </div>

            <motion.div
              variants={staggerContainer}
              className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12"
            >
              {[
                { icon: 'mdi:star', title: 'الريادة', desc: 'الاختيار الأول في سوريا' },
                { icon: 'mdi:nice', title: 'الابتكار', desc: 'دمج التقنيات الحديثة' },
                { icon: 'mdi:quality-high', title: 'الجودة', desc: 'أعلى معايير الصناعة' }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  variants={scaleIn}
                  className="text-center"
                >
                  <div className={`w-16 h-16 ${colors.secondary.bg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                    <Icon icon={item.icon} className="text-white text-2xl" />
                  </div>
                  <h4 className={`font-bold text-lg mb-2 ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>{item.title}</h4>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
});

export default VisionSection;