import { useState, useCallback } from 'react';
import { useGetRoadSignsQuery } from '../RtkQuery/Slice/RoadSings/RoadSingsApi';
import { useAddNewBookingMutation } from '../RtkQuery/Slice/Booking/BookingApi';
import toast from 'react-hot-toast';

export const useSimilarCampaign = (originalBooking) => {
  // Form state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [printingId, setPrintingId] = useState(originalBooking?.printing_id || '');
  const [productType, setProductType] = useState(originalBooking?.product_type || '');
  
  // UI state
  const [showRoadSigns, setShowRoadSigns] = useState(false);
  const [replacedSigns, setReplacedSigns] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch customers
  // اختيار العميل عبر CustomerSearchSelect (بحث من الخادم) - كان يحمّل أول 100 عميل فقط.
  const customersData = null;
  const isLoadingCustomers = false;
  
  // Fetch road signs with date filters
  const { 
    data: roadSignsResponse, 
    isLoading: isLoadingRoadSigns,
    isFetching: isFetchingRoadSigns,
  } = useGetRoadSignsQuery(
    { 
      start_date: startDate, 
      end_date: endDate 
    },
    { skip: !showRoadSigns || !startDate || !endDate }
  );
  
  const [addBooking] = useAddNewBookingMutation();
  
  // Get original road signs from the booking
  const originalSigns = originalBooking?.roadsigns || [];
  const originalSignsIds = originalSigns.map(sign => sign.id);
  
  // Get all road signs from API response
  const allRoadSigns = roadSignsResponse?.data || [];
  
  // Process road signs with availability status
  const getRoadSignsWithAvailability = useCallback(() => {
    return originalSigns.map(originalSign => {
      const apiSign = allRoadSigns.find(s => s.id === originalSign.id);
      
      const isReplaced = !!replacedSigns[originalSign.id];
      
      let isAvailable = false;
      let conflictBookings = [];
      
      if (isReplaced) {
        isAvailable = true;
      } else if (apiSign) {
        const hasConflict = apiSign.bookings && apiSign.bookings.length > 0;
        isAvailable = !hasConflict;
        conflictBookings = apiSign.bookings || [];
      } else {
        isAvailable = false;
      }
      
      return {
        ...originalSign,
        isAvailable,
        hasConflict: !isAvailable && !isReplaced,
        conflictBookings,
        isReplaced,
        replacementId: replacedSigns[originalSign.id]?.id,
        replacementData: replacedSigns[originalSign.id]?.data,
        apiData: apiSign || null
      };
    });
  }, [originalSigns, allRoadSigns, replacedSigns]);
  
  const roadSigns = getRoadSignsWithAvailability();
  
  const allSignsAvailable = roadSigns.length > 0 && 
    roadSigns.every(sign => sign.isAvailable);
  
  const isFormValid = startDate && endDate && customerId && printingId && productType && allSignsAvailable;
  
  const handleApplyDates = useCallback(() => {
    if (!startDate || !endDate) {
      toast.error('يرجى اختيار تاريخ البداية والنهاية');
      return;
    }
    setShowRoadSigns(true);
    setReplacedSigns({});
  }, [startDate, endDate]);
  
  const handleReplaceSign = useCallback((oldSignId, newSignId, newSignData) => {
    setReplacedSigns(prev => ({
      ...prev,
      [oldSignId]: { id: newSignId, data: newSignData }
    }));
    toast.success('تم تبديل اللوحة بنجاح');
  }, []);
  
  const handleReset = useCallback(() => {
    setStartDate('');
    setEndDate('');
    setCustomerId('');
    setPrintingId(originalBooking?.printing_id || '');
    setProductType(originalBooking?.product_type || '');
    setShowRoadSigns(false);
    setReplacedSigns({});
  }, [originalBooking?.printing_id, originalBooking?.product_type]);
  
  const handleSubmit = useCallback(async () => {
    if (!isFormValid) {
      toast.error('يرجى التأكد من جميع البيانات');
      return false;
    }
    
    setIsSubmitting(true);
    
    try {
      const finalRoadSigns = roadSigns.map(sign => {
        let finalSignId = sign.id;
        let bookingFaces = sign.pivot?.booking_faces || 1;
        let numberOfPanels = sign.pivot?.number_of_reserved_panels || 1;
        
        if (sign.isReplaced && replacedSigns[sign.id]) {
          finalSignId = replacedSigns[sign.id].id;
        }
        
        return {
          road_sign_id: finalSignId,
          booking_faces: bookingFaces,
          number_of_reserved_panels: numberOfPanels,
          start_date: startDate,  // ✅ ADD start_date to each road sign
          end_date: endDate,      // ✅ ADD end_date to each road sign
        };
      });
      
      const bookingData = {
        customer_id: customerId,
        type: originalBooking.type,
        start_date: startDate,
        end_date: endDate,
        roadsigns: finalRoadSigns,
        product_type: parseInt(productType),  // ✅ Ensure it's a number
        notes: `نسخة من الحملة رقم ${originalBooking.id}`,
        printing_id: parseInt(printingId),    // ✅ Ensure it's a number
      };
      
      await addBooking(bookingData).unwrap();
      toast.success('تم إنشاء الحملة بنجاح');
      handleReset();
      return true;
    } catch (error) {
      toast.error(error?.data?.message || 'فشل في إنشاء الحملة');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [isFormValid, roadSigns, replacedSigns, customerId, startDate, endDate, printingId, productType, originalBooking, addBooking, handleReset]);
  
  return {
    startDate,
    endDate,
    customerId,
    printingId,
    productType,
    showRoadSigns,
    roadSigns,
    allSignsAvailable,
    isFormValid,
    isSubmitting,
    isLoading: isLoadingRoadSigns || isFetchingRoadSigns,
    isLoadingCustomers,
    customers: customersData?.data || [],
    setStartDate,
    setEndDate,
    setCustomerId,
    setPrintingId,
    setProductType,
    handleApplyDates,
    handleReplaceSign,
    handleSubmit,
    handleReset,
  };
};