import React, { forwardRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { toast } from 'react-hot-toast';

const ContactForm = forwardRef(({ inView, isDarkMode }, ref) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    serviceType: '',
    budget: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const colors = {
    primary: {
      text: isDarkMode ? 'text-red-400' : 'text-red-600',
      bg: isDarkMode ? 'bg-red-500' : 'bg-red-600',
      ring: isDarkMode ? 'ring-red-400' : 'ring-red-500'
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

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'الاسم مطلوب';
    
    if (!formData.email.trim()) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'يرجى إدخال بريد إلكتروني صحيح';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'رقم الهاتف مطلوب';
    } else if (!/^\+?[\d\s-()]{10,}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'يرجى إدخال رقم هاتف صحيح';
    }
    
    if (!formData.serviceType.trim()) newErrors.serviceType = 'نوع الخدمة مطلوب';
    if (!formData.budget.trim()) newErrors.budget = 'نطاق الميزانية مطلوب';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Format the message for WhatsApp
      const serviceTypeMap = {
        'billboard': 'إعلانات اللوحات',
        'roadside': 'لافتات الطرق',
        'bus-stop': 'إعلانات محطات الحافلات',
        'vehicle': 'إعلانات المركبات',
        'digital': 'الشاشات الرقمية',
        'comprehensive': 'باقة شاملة'
      };

      const budgetMap = {
        'basic': 'أساسي (أقل من $1,000)',
        'standard': 'قياسي ($1,000 - $5,000)',
        'premium': 'متميز ($5,000 - $15,000)',
        'enterprise': 'شركات ($15,000+)',
        'custom': 'عرض سعر مخصص'
      };

      const whatsappMessage = `🚀 *طلب عرض سعر جديد* 🚀

👤 *الاسم:* ${formData.name}
📧 *البريد الإلكتروني:* ${formData.email}
📱 *رقم الهاتف:* ${formData.phone}
🎯 *نوع الخدمة:* ${serviceTypeMap[formData.serviceType] || formData.serviceType}
💰 *نطاق الميزانية:* ${budgetMap[formData.budget] || formData.budget}

⏰ *تم إرسال الطلب بتاريخ:* ${new Date().toLocaleString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}

✨ *شكرًا للاهتمام بخدماتنا!* ✨`;

      // Encode the message for URL
      const encodedMessage = encodeURIComponent(whatsappMessage);
      
      // WhatsApp number: 0981 888 977 (International format: +963981888977)
      const whatsappNumber = '+963981888977'; // Syria country code is +963
      
      // Create WhatsApp URL
      const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
      
      // Show success message first
      toast.success('جاري فتح واتساب لإرسال الطلب...');
      
      // Small delay for toast to show
      setTimeout(() => {
        // Open WhatsApp in a new tab
        window.open(whatsappURL, '_blank');
        
        // Reset form after a moment
        setTimeout(() => {
          toast.success('تم إرسال الطلب إلى واتساب بنجاح!');
          setIsSubmitting(false);
          setFormData({ name: '', email: '', phone: '', serviceType: '', budget: '' });
        }, 1000);
      }, 1500);
      
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      setIsSubmitting(false);
      toast.error('حدث خطأ. يرجى المحاولة مرة أخرى أو التواصل مباشرة عبر واتساب.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <section id="form" ref={ref} className="py-16 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={staggerContainer}
          className={`rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 shadow-2xl border ${
            isDarkMode 
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' 
              : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
          }`}
        >
          <motion.div
            variants={fadeInUp}
            className="text-center mb-6 sm:mb-8"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              احصل على <span className={colors.primary.text}>عرض السعر</span>
            </h2>
            <p className={`text-lg sm:text-xl ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              املأ النموذج أدناه وسيتم فتح واتساب لإرسال الطلب تلقائيًا
            </p>
           
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label htmlFor="name" className={`block text-sm font-semibold mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  الاسم الكامل *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 border-2 rounded-lg sm:rounded-xl focus:ring-4 focus:${colors.primary.ring} focus:border-transparent transition-all duration-300 text-sm sm:text-base ${
                    errors.name 
                      ? 'border-red-500 ring-red-200' 
                      : isDarkMode 
                        ? 'border-gray-600 bg-gray-700 text-white focus:border-transparent' 
                        : 'border-gray-300 focus:border-transparent'
                  }`}
                  placeholder="أدخل اسمك الكامل"
                />
                {errors.name && (
                  <p className="mt-1 sm:mt-2 text-sm text-red-600 flex items-center justify-end">
                    <Icon icon="mdi:alert-circle" className="ml-1 flex-shrink-0" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="email" className={`block text-sm font-semibold mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  البريد الإلكتروني *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 border-2 rounded-lg sm:rounded-xl focus:ring-4 focus:${colors.primary.ring} focus:border-transparent transition-all duration-300 text-sm sm:text-base ${
                    errors.email 
                      ? 'border-red-500 ring-red-200' 
                      : isDarkMode 
                        ? 'border-gray-600 bg-gray-700 text-white focus:border-transparent' 
                        : 'border-gray-300 focus:border-transparent'
                  }`}
                  placeholder="your@email.com"
                />
                {errors.email && (
                  <p className="mt-1 sm:mt-2 text-sm text-red-600 flex items-center justify-end">
                    <Icon icon="mdi:alert-circle" className="ml-1 flex-shrink-0" />
                    {errors.email}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label htmlFor="phone" className={`block text-sm font-semibold mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  رقم الهاتف *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 border-2 rounded-lg sm:rounded-xl focus:ring-4 focus:${colors.primary.ring} focus:border-transparent transition-all duration-300 text-sm sm:text-base ${
                    errors.phone 
                      ? 'border-red-500 ring-red-200' 
                      : isDarkMode 
                        ? 'border-gray-600 bg-gray-700 text-white focus:border-transparent' 
                        : 'border-gray-300 focus:border-transparent'
                  }`}
                  placeholder="+963 123 456 789"
                />
                {errors.phone && (
                  <p className="mt-1 sm:mt-2 text-sm text-red-600 flex items-center justify-end">
                    <Icon icon="mdi:alert-circle" className="ml-1 flex-shrink-0" />
                    {errors.phone}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="serviceType" className={`block text-sm font-semibold mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  نوع الخدمة *
                </label>
                <select
                  id="serviceType"
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleChange}
                  className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 border-2 rounded-lg sm:rounded-xl focus:ring-4 focus:${colors.primary.ring} focus:border-transparent transition-all duration-300 text-sm sm:text-base ${
                    errors.serviceType 
                      ? 'border-red-500 ring-red-200' 
                      : isDarkMode 
                        ? 'border-gray-600 bg-gray-700 text-white focus:border-transparent' 
                        : 'border-gray-300 focus:border-transparent'
                  }`}
                >
                  <option value="">اختر نوع الخدمة</option>
                  <option value="billboard">إعلانات اللوحات</option>
                  <option value="roadside">لافتات الطرق</option>
                  <option value="comprehensive">باقة شاملة</option>
                </select>
                {errors.serviceType && (
                  <p className="mt-1 sm:mt-2 text-sm text-red-600 flex items-center justify-end">
                    <Icon icon="mdi:alert-circle" className="ml-1 flex-shrink-0" />
                    {errors.serviceType}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="budget" className={`block text-sm font-semibold mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                نطاق الميزانية *
              </label>
              <select
                id="budget"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 border-2 rounded-lg sm:rounded-xl focus:ring-4 focus:${colors.primary.ring} focus:border-transparent transition-all duration-300 text-sm sm:text-base ${
                  errors.budget 
                    ? 'border-red-500 ring-red-200' 
                    : isDarkMode 
                      ? 'border-gray-600 bg-gray-700 text-white focus:border-transparent' 
                      : 'border-gray-300 focus:border-transparent'
                }`}
              >
                <option value="">اختر نطاق الميزانية</option>
                <option value="basic">أساسي (أقل من $1,000)</option>
                <option value="standard">قياسي ($1,000 - $5,000)</option>
                <option value="premium">متميز ($5,000 - $15,000)</option>
                <option value="enterprise">شركات ($15,000+)</option>
                <option value="custom">عرض سعر مخصص</option>
              </select>
              {errors.budget && (
                <p className="mt-1 sm:mt-2 text-sm text-red-600 flex items-center justify-end">
                  <Icon icon="mdi:alert-circle" className="ml-1 flex-shrink-0" />
                  {errors.budget}
                </p>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
              className={`w-full ${colors.primary.bg} text-white py-3 sm:py-4 px-6 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2`}
            >
              {isSubmitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Icon icon="mdi:loading" className="text-lg sm:text-xl" />
                  </motion.div>
                  <span>جاري فتح واتساب...</span>
                </>
              ) : (
                <>
                  <Icon icon="ri:whatsapp-fill" className="text-lg sm:text-xl" />
                  <span>إرسال الطلب عبر واتساب</span>
                </>
              )}
            </motion.button>
          </form>
          
          {/* WhatsApp direct link as backup */}
          <div className="mt-4 text-center">
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              أو يمكنك التواصل مباشرة عبر الرابط: 
              <a 
                href="https://wa.me/963981888977" 
                target="_blank" 
                rel="noopener noreferrer"
                className={`ml-1 ${colors.primary.text} hover:underline font-medium`}
              >
                اضغط هنا للتواصل عبر واتساب
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
});

export default ContactForm;