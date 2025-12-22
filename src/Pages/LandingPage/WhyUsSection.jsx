import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

const whyUsPoints = [
  {
    icon: "mdi:map-marker-radius",
    title: "الانتشار الواسع",
    description: "أكثر من 800 لوحة إعلانية منتشرة في مواقع استراتيجية في مختلف أنحاء سوريا"
  },
  {
    icon: "mdi:format-list-bulleted",
    title: "التنوع في الخيارات",
    description: "مجموعة متنوعة من اللوحات الإعلانية بمختلف الأحجام والأشكال، بالإضافة إلى الشاشات الإلكترونية الحديثة"
  },
  {
    icon: "mdi:lightbulb-on",
    title: "أساليب إعلانية مبتكرة",
    description: 'نقدم أنواعاً متعددة من الإعلانات مثل "غوريلا" و"الهمر" التي تساعد في ترسيخ المعلومة لدى المشاهد بطرق غير تقليدية'
  },
  {
    icon: "mdi:chart-line",
    title: "التسويق القوي للمنتجات",
    description: "نمتلك القدرة على تصميم وتنفيذ حملات إعلانية تساهم في زيادة المبيعات وتعزيز الوعي بالعلامة التجارية"
  },
  {
    icon: "mdi:accessibility",
    title: "مرونة في الحملات الإعلانية",
    description: "تنوع قياسات اللوحات الإعلانية يتيح للمعلنين اختيار الوسيلة المناسبة لأهدافهم التسويقية وميزانياتهم"
  },
  {
    icon: "mdi:package-variant",
    title: "الخدمات المتكاملة",
    description: "من التصميم إلى التنفيذ والتركيب والصيانة، نقدم حلولاً إعلانية متكاملة تلبي جميع احتياجات عملائنا"
  },
  {
    icon: "mdi:account-group",
    title: "الفريق المحترف",
    description: "نمتلك فريقاً من المصممين والفنيين المحترفين ذوي الخبرة والكفاءة العالية"
  },
  {
    icon: "mdi:quality-high",
    title: "الجودة العالية",
    description: "نلتزم بأعلى معايير الجودة في جميع خدماتنا، من التصميم إلى التنفيذ والتركيب"
  },
  {
    icon: "mdi:currency-usd",
    title: "السعر المناسب",
    description: "نقدم خدماتنا بأسعار تنافسية تناسب مختلف الميزانيات"
  }
];

const WhyUsSection = forwardRef(({ inView, isDarkMode }, ref) => {
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
    <section id="why-us" ref={ref} className="py-16 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="text-center mb-12 sm:mb-16"
        >
          <motion.h2 variants={scaleIn} className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            لماذا <span className={colors.primary.text}>تختارنا</span>؟
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
        >
          {whyUsPoints.map((point, index) => (
            <motion.div
              key={index}
              variants={scaleIn}
              whileHover={{ 
                scale: 1.02,
                y: -5,
              }}
              className={`rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl border transition-all duration-300 group ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`w-12 h-12 sm:w-16 sm:h-16 ${
                index % 2 === 0 ? colors.primary.bg : colors.secondary.bg
              } rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <Icon icon={point.icon} className="text-white text-lg sm:text-2xl" />
              </div>
              <h3 className={`text-lg sm:text-xl font-bold mb-2 sm:mb-3 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>{point.title}</h3>
              <p className={`text-sm sm:text-base leading-relaxed ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>{point.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
});

export default WhyUsSection;