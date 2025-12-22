import React, { useState, useRef, useEffect } from 'react';
import { useInView } from 'framer-motion';
import { Toaster } from 'react-hot-toast';

import Navigation from './Navigation';
import HeroSection from './HeroSection';
import VisionSection from './VisionSection';
import ServicesSection from './ServicesSection';
import BillboardsSection from './BillboardsSection';
import WhyUsSection from './WhyUsSection';
import BranchesSection from './BranchesSection';
import AdvertisersSection from './AdvertisersSection';
import TestimonialsSection from './TestimonialsSection';
import ContactForm from './ContactForm';
import Footer from './Footer';
import BillboardModal from './BillboardModal';

const LandingPage = ({ 
  companyName = "إعلان طرقية",
  arabicName = "الشركة السورية للإعلان الطرقي",
  onSubmit = async (formData) => {
    console.log('Form submitted:', formData);
    return Promise.resolve();
  }
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const [selectedBillboard, setSelectedBillboard] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

 
  const heroRef = useRef(null);
  const visionRef = useRef(null);
  const servicesRef = useRef(null);
  const billboardsRef = useRef(null);
  const whyUsRef = useRef(null);
  const branchesRef = useRef(null);
  const advertisersRef = useRef(null);
  const testimonialsRef = useRef(null);
  const formRef = useRef(null);

  // InView hooks
  const heroInView = useInView(heroRef, { once: true, margin: '-50px' });
  const visionInView = useInView(visionRef, { once: true, margin: '-50px' });
  const servicesInView = useInView(servicesRef, { once: true, margin: '-50px' });
  const billboardsInView = useInView(billboardsRef, { once: true, margin: '-50px' });
  const whyUsInView = useInView(whyUsRef, { once: true, margin: '-50px' });
  const branchesInView = useInView(branchesRef, { once: true, margin: '-50px' });
  const advertisersInView = useInView(advertisersRef, { once: true, margin: '-50px' });
  const testimonialsInView = useInView(testimonialsRef, { once: true, margin: '-50px' });
  const formInView = useInView(formRef, { once: true, margin: '-50px' });

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Scroll spy
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const sections = ['hero', 'vision', 'services', 'billboards', 'why-us', 'branches', 'advertisers', 'testimonials', 'form'];
          const current = sections.find(section => {
            const element = document.getElementById(section);
            if (element) {
              const rect = element.getBoundingClientRect();
              return rect.top <= 100 && rect.bottom >= 100;
            }
            return false;
          });
          if (current) setActiveSection(current);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBillboardClick = (billboard) => {
    setSelectedBillboard(billboard);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBillboard(null);
  };

  return (
    <div className={`min-h-screen overflow-x-hidden transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white' 
        : 'bg-gradient-to-br from-white via-gray-50 to-white text-gray-900'
    }`} dir="rtl">
      <Toaster position="top-left" />
      
      <Navigation 
        isDarkMode={isDarkMode}
        setIsDarkMode={toggleDarkMode}
        activeSection={activeSection}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        companyName={companyName}
        arabicName={arabicName}
      />

      <HeroSection 
        ref={heroRef}
        inView={heroInView}
        isDarkMode={isDarkMode}
      />

      <VisionSection 
        ref={visionRef}
        inView={visionInView}
        isDarkMode={isDarkMode}
      />

      <ServicesSection 
        ref={servicesRef}
        inView={servicesInView}
        isDarkMode={isDarkMode}
      />

      <BillboardsSection 
        ref={billboardsRef}
        inView={billboardsInView}
        isDarkMode={isDarkMode}
        onBillboardClick={handleBillboardClick}
      />

      <WhyUsSection 
        ref={whyUsRef}
        inView={whyUsInView}
        isDarkMode={isDarkMode}
      />

      <BranchesSection 
        ref={branchesRef}
        inView={branchesInView}
        isDarkMode={isDarkMode}
      />

      <AdvertisersSection 
        ref={advertisersRef}
        inView={advertisersInView}
        isDarkMode={isDarkMode}
      />

      <TestimonialsSection 
        ref={testimonialsRef}
        inView={testimonialsInView}
        isDarkMode={isDarkMode}
      />

      <ContactForm 
        ref={formRef}
        inView={formInView}
        isDarkMode={isDarkMode}
        onSubmit={onSubmit}
      />

      <Footer 
        companyName={companyName}
        arabicName={arabicName}
        isDarkMode={isDarkMode}
      />

      <BillboardModal 
        billboard={selectedBillboard} 
        isOpen={isModalOpen} 
        onClose={closeModal} 
      />
    </div>
  );
};

export default LandingPage;