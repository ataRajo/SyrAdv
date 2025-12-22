import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

const testimonials = [
  {
    name: "محمد الأسد",
    location: "دمشق",
    text: "زادت مبيعاتنا بنسبة 40٪ بعد استخدام مواقع اللوحات الإعلانية الاستراتيجية. موصى به بشدة!",
    rating: 5,
    avatar: "👨"
  },
  {
    name: "ليلى حسن",
    location: "حلب",
    text: "خدمة احترافية ومواقع ممتازة. لم يكن الوصول لعلامتنا التجارية أفضل من قبل.",
    rating: 5,
    avatar: "👩"
  },
  {
    name: "أحمد فرح",
    location: "طرطوس",
    text: "فهم الفريق احتياجاتنا بشكل مثالي وقدموا نتائج استثنائية ضمن ميزانيتنا.",
    rating: 5,
    avatar: "👨"
  }
];

const TestimonialsSection = forwardRef(({ inView, isDarkMode }, ref) => {
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

  return (
    <section id="testimonials" ref={ref} className={`py-16 sm:py-20 ${
      isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50/50'
    }`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="text-center mb-12 sm:mb-16"
        >
          <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            ما يقوله <span className={colors.primary.text}>عملاؤنا</span>
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              whileHover={{ y: -5 }}
              className={`rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl border transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center mb-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-lg sm:text-xl ml-3 sm:ml-4 flex-shrink-0 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  {testimonial.avatar}
                </div>
                <div className="min-w-0 text-right">
                  <div className={`font-semibold text-sm sm:text-base truncate ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>{testimonial.name}</div>
                  <div className={`text-xs sm:text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  } truncate`}>{testimonial.location}</div>
                </div>
              </div>
              <div className="flex mb-3 sm:mb-4 justify-end">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Icon key={i} icon="mdi:star" className="text-yellow-400 text-sm sm:text-lg ml-1" />
                ))}
              </div>
              <p className={`italic leading-relaxed text-sm sm:text-base text-right ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>"{testimonial.text}"</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
});

export default TestimonialsSection;