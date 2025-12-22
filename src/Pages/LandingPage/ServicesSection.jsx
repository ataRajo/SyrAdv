import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

const ServicesSection = forwardRef(({ inView, isDarkMode }, ref) => {
  const colors = {
    primary: {
      text: isDarkMode ? 'text-red-400' : 'text-red-600',
      bg: isDarkMode ? 'bg-red-500' : 'bg-red-600'
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
    <section id="services" ref={ref} className="py-16 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={staggerContainer}
          className="text-center mb-12 sm:mb-16"
        >
          <motion.h2
            variants={fadeInUp}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4"
          >
            <span className={colors.primary.text}>خدماتنا</span>
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className={`text-lg sm:text-xl max-w-2xl mx-auto ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}
          >
            تمتلك الشركة السورية للإعلان الطرقي مجموعة متنوعة من اللوحات الإعلانية بمختلف الأحجام والأشكال
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={staggerContainer}
          className="max-w-4xl mx-auto"
        >
          <motion.div
            variants={fadeInUp}
            className={`rounded-2xl p-8 sm:p-12 shadow-2xl border mb-12 ${
              isDarkMode 
                ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' 
                : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
            }`}
          >
            <div className="text-right space-y-6">
              <p className={`text-lg leading-relaxed ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <strong>تمتلك الشركة السورية للإعلان الطرقي مجموعة متنوعة من اللوحات الإعلانية بمختلف الأحجام والأشكال،</strong> والتي تناسب مختلف أنواع الحملات الإعلانية.
              </p>
              <p className={`text-lg leading-relaxed ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <strong>تتميز هذه اللوحات بمواقعها الاستراتيجية على الطرق الرئيسية والمناطق ذات الكثافة المرورية العالية،</strong> مما يضمن وصول الرسالة الإعلانية إلى أكبر شريحة ممكنة من الجمهور المستهدف.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
              {[
                { icon: 'mdi:highway', title: 'مواقع استراتيجية', desc: 'على الطرق الرئيسية' },
                { icon: 'mdi:traffic-light', title: 'كثافة مرورية عالية', desc: 'وصول لأكبر شريحة' },
                { icon: 'mdi:target', title: 'جمهور مستهدف', desc: 'تغطية شاملة' }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  variants={scaleIn}
                  className="text-center"
                >
                  <div className={`w-16 h-16 ${colors.primary.bg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
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
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
});

export default ServicesSection;