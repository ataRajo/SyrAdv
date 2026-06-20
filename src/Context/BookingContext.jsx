import { createContext, useState, useEffect, useMemo } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useGetCustomersQuery } from "../RtkQuery/Slice/Customers/CustomersApi";
import { showToast } from "../utils/Notifictions/showToast";
import { useNavigate, useParams } from "react-router";
import { useGetRoadSignsQuery } from "../RtkQuery/Slice/RoadSings/RoadSingsApi";
import {
  useAddNewBookingMutation,
  useCalculateReservationMutation,
  useGetOneBookingsQuery,
  useUpdateBookingsMutation,
} from "../RtkQuery/Slice/Booking/BookingApi";
import { useGetCompanyQuery } from "../RtkQuery/Slice/Auth/AuthApi";
import { Toaster } from "react-hot-toast";

export const BookingContext = createContext();

export const BookingContextApi = ({ children, bookingId }) => {
  const isEditMode = !!bookingId;
  const { id } = useParams();
  const navigate = useNavigate();
  const superAdminInfo = JSON.parse(localStorage.getItem("SuperAdminInfo"));

  // States
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSigns, setSelectedSigns] = useState([]);
  const [addedSignIds, setAddedSignIds] = useState(new Set());
  const [calculationResult, setCalculationResult] = useState(null);
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountType, setDiscountType] = useState("1");
  const [discountValue, setDiscountValue] = useState("");
  const [contractDialog, setContractDialog] = useState(false);
  const [notes, setNotes] = useState("");
  const [queryParams, setQueryParams] = useState({});
  const [individualCalculations, setIndividualCalculations] = useState({});
  const [individualLoadingStates, setIndividualLoadingStates] = useState({}); // New state for individual loading states

  // RTK Query hooks
  const { data: roadSigns, isLoading: isLoadingRoadSigns } =
    useGetRoadSignsQuery(queryParams);
  const { data: bookingData, isLoading: isLoadingBooking } =
    useGetOneBookingsQuery(id, {
      skip: !isEditMode,
    });
 
const { data: customersResponse, isLoading: isLoadingCustomers } = useGetCustomersQuery({
  //page: customerPage,
  per_page: 80
});



const customers = customersResponse?.data || [];
  const [addNewBooking, { isLoading: isLoadingAdd }] =
    useAddNewBookingMutation();
  const [updateBookings, { isLoading: isLoadingUpdate }] =
    useUpdateBookingsMutation();
  const [calculateReservation, { isLoading: isLoadingCalculateReservation }] =
    useCalculateReservationMutation();

  const { data: company, isFetching: isCompanyFetching } = useGetCompanyQuery();

  // Validation schema
  const validationSchema = Yup.object({
    customer_id: Yup.string().required("حقل الزبون مطلوب"),
    type: Yup.string().required("حقل نوع الحجز مطلوب"),
    start_date: Yup.string().required("حقل تاريخ البداية مطلوب"),
    end_date: Yup.string().required("حقل تاريخ النهاية مطلوب"),
    product_type: Yup.string().required("حقل نوع المنتج مطلوب"),
  });

// Formik setup
const formik = useFormik({
  initialValues: {
    customer_id: "",
    type: "",
    start_date: "",
    end_date: "",
    product_type: "",
    printing_id: "", // Add this
    units: "1", // Add this
  },
  validationSchema,
  onSubmit: async (values, { resetForm }) => { 
    try {
       const advertisingPrice = calculationResult?.amount?.total_advertising_price || 0;
    const printingPrice = calculationResult?.amount?.total_printing_price || 0;
    let finalPrice = advertisingPrice + printingPrice;
    
    if (discountValue) {
      const discountNum = parseFloat(discountValue);
      let discountedAdvertisingPrice;
      
      if (discountType === "1") {
        // Fixed amount discount
        discountedAdvertisingPrice = Math.max(0, advertisingPrice - discountNum);
      } else {
        // Percentage discount
        discountedAdvertisingPrice = advertisingPrice * (1 - discountNum / 100);
      }
      
      finalPrice = discountedAdvertisingPrice + printingPrice;
    }
    
    const bookingPayload = {
      customer_id: parseInt(values.customer_id),
      type: parseInt(values.type),
      start_date: values.start_date,
      end_date: values.end_date,
      roadsigns: selectedSigns.flatMap((sign) =>
        sign.dateRanges.map((range) => ({
          road_sign_id: sign.road_sign_id,
          booking_faces: range.booking_faces,
          number_of_reserved_panels: range.booking_faces,
          start_date: range.startDate,
          end_date: range.endDate,
          units: range.units || 1,
        }))
      ),
      product_type: parseInt(values.product_type),
      printing_id: parseInt(values.printing_id),
      notes,
      discount_type: discountValue ? parseInt(discountType) : null,
      value: discountValue ? parseFloat(discountValue) : null,
      total_price: finalPrice, // Add final price here
      advertising_price: advertisingPrice,
      printing_price: printingPrice,
      discounted_advertising_price: discountValue ? 
        (discountType === "1" ? Math.max(0, advertisingPrice - parseFloat(discountValue)) : 
         advertisingPrice * (1 - parseFloat(discountValue) / 100)) : 
        advertisingPrice,
    };

      if (isEditMode) {
        bookingPayload.id = id;
        await updateBookings(bookingPayload).unwrap();
        showToast("success", "تم تعديل الحجز بنجاح");
      } else {
        await addNewBooking(bookingPayload).unwrap();
        showToast("success", "تم إضافة الحجز بنجاح");
      }

      resetForm();
      setSelectedSigns([]);
      setAddedSignIds(new Set());
      setCalculationResult(null);
      setIndividualCalculations({});
      setIndividualLoadingStates({});
      setShowDiscount(false);
      setDiscountType("1");
      setDiscountValue("");
      setNotes("");
      setOpenDialog(false);
      setContractDialog(false);
      navigate("/dashboard/bookings");
    } catch (error) {
      showToast(
        "error",
        error.data?.message || "حدث خطأ ما، يرجى المحاولة مرة أخرى"
      );
    }
  },
});

  // Populate form with booking data in edit mode
 useEffect(() => {
  if (isEditMode && bookingData && !isLoadingBooking) {
    formik.setValues({
      customer_id: bookingData.customer_id.toString(),
      type: bookingData.type.toString(),
      start_date: bookingData.start_date.split("T")[0],
      end_date: bookingData.end_date.split("T")[0],
      product_type: bookingData.product_type.toString(),
      printing_id: bookingData.printing_id?.toString() || "", // Add this
      units: bookingData.units?.toString() || "1", // Add this
    });
    // ... rest of the code


    
  }
}, [bookingData, isEditMode, isLoadingBooking]);
  // Set notes for new bookings
  useEffect(() => {
    if (!isEditMode) {
      setNotes(superAdminInfo?.user?.company?.contract_note || "");
    }
  }, [isEditMode]);

  // Update query params
  useEffect(() => {
    if (formik.values.start_date && formik.values.end_date) {
      setQueryParams({
        start_date: formik.values.start_date,
        end_date: formik.values.end_date,
      });
    } else {
      setQueryParams({});
    }
  }, [formik.values.start_date, formik.values.end_date]);


useEffect(() => {
  console.log("🟡 formik.isSubmitting changed to:", formik.isSubmitting);
}, [formik.isSubmitting]);

useEffect(() => {
  console.log("🟡 selectedSigns count changed to:", selectedSigns.length);
}, [selectedSigns.length]);

  // Remove unavailable signs
  useEffect(() => {
    if (roadSigns && selectedSigns.length > 0) {
      const availableSignIds = new Set(roadSigns?.data?.map((sign) => sign.id));
      const unavailableSigns = selectedSigns.filter(
        (sign) => !availableSignIds.has(sign.road_sign_id)
      );
      if (unavailableSigns.length > 0) {
        setSelectedSigns(
          selectedSigns.filter((sign) =>
            availableSignIds.has(sign.road_sign_id)
          )
        );
        setAddedSignIds(
          new Set([...addedSignIds].filter((id) => availableSignIds.has(id)))
        );
        showToast(
          "warning",
          "تمت إزالة بعض اللوحات من السلة لأنها غير متوفرة في الفترة المحددة"
        );
      }
    }
  }, [roadSigns]);

  // Initial value for the notes field in case of addition booking
  useEffect(() => {
    if (!isEditMode) {
      setNotes(company?.contract_note);
    }
  }, [isCompanyFetching]);

  // Handlers
 const addToCart = (sign) => {
  if (!formik.values.start_date) {
    showToast("error", "يرجى إدخال تاريخ البدء.");
    return;
  }

  if (!formik.values.end_date) {
    showToast("error", "يرجى إدخال تاريخ الانتهاء.");
    return;
  }

  if (!formik.values.customer_id) {
    showToast("error", "يرجى اختيار العميل.");
    return;
  }

  if (!formik.values.type) {
    showToast("error", "يرجى إدخال نوع الحجز.");
    return;
  }

  if (!formik.values.product_type) {
    showToast("error", "يرجى إدخال نوع المنتج.");
    return;
  }

  if (!formik.values.printing_id) {
    showToast("error", "يرجى إدخال رقم الطباعة.");
    return;
  }

  // Use cartId if provided (for individual bookings), otherwise create one
  const uniqueCartId = sign.cartId || `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const dateRanges = sign.customDateRanges
    ? sign.customDateRanges
    : [
        {
          startDate: formik.values.start_date,
          endDate: formik.values.end_date,
          booking_faces: 1,
          units: 1,
        },
      ];

  // Create a new booking with unique ID
  const newBooking = {
    cartId: uniqueCartId, // Use unique cart ID instead of road_sign_id for grouping
    road_sign_id: sign.id,
    max_faces: sign.panels_number,
    dateRanges,
    // Store the original sign data for display
    template: sign.template,
    region: sign.region,
    place: sign.place,
    directions: sign.directions,
  };

  setSelectedSigns(prev => [...prev, newBooking]);
  setAddedSignIds(new Set([...addedSignIds, sign.id]));
  showToast("success", `تم إضافة عنصر إلى السلة`);
};

  const updateSignFaces = (road_sign_id, rangeIndex, updates) => {
    setSelectedSigns(
      selectedSigns.map((sign) =>
        sign.road_sign_id === road_sign_id
          ? {
              ...sign,
              dateRanges: sign.dateRanges.map((range, index) =>
                index === rangeIndex
                  ? {
                      ...range,
                      booking_faces: updates.booking_faces || range.booking_faces,
                      startDate: updates.startDate || range.startDate,
                      endDate: updates.endDate || range.endDate,
                      units: updates.units || range.units || 1,
                    }
                  : range
              ),
            }
          : sign
      )
    );
  };

const removeFromCart = (cartId) => {
  console.log("Removing cartId:", cartId);
  
  const bookingToRemove = selectedSigns.find(sign => sign.cartId === cartId);
  
  if (bookingToRemove) {
    setSelectedSigns(prev => prev.filter(sign => sign.cartId !== cartId));
    setAddedSignIds(prev => new Set([...prev].filter(id => id !== bookingToRemove.road_sign_id)));
    showToast("success", "تم إزالة الحجز من السلة");
  }
  
  setCalculationResult(null);
  setShowDiscount(false);
  setDiscountValue("");
};

const getFinalPrice = () => {
  if (!calculationResult) return 0;
  
  const advertisingPrice = calculationResult.amount?.total_advertising_price || 0;
  const printingPrice = calculationResult.amount?.total_printing_price || 0;
  
  if (!discountValue) {
    return advertisingPrice + printingPrice;
  }
  
  const discountNum = parseFloat(discountValue);
  let discountedAdvertisingPrice;
  
  if (discountType === "1") {
    // Fixed amount discount
    discountedAdvertisingPrice = Math.max(0, advertisingPrice - discountNum);
  } else {
    // Percentage discount
    discountedAdvertisingPrice = advertisingPrice * (1 - discountNum / 100);
  }
  
  // Add printing price back
  return discountedAdvertisingPrice + printingPrice;
};

 const calculateTotal = async () => {
  try {
    // Check if printing_id is provided
    if (!formik.values.printing_id) {
      showToast("error", "يرجى إدخال رقم الطباعة قبل الحساب");
      return;
    }

    const payload = {
      product_type: parseInt(formik.values.product_type),
      roadsigns: selectedSigns.flatMap((sign) =>
        sign.dateRanges.map((range) => ({
          road_sign_id: sign.road_sign_id,
          booking_faces: range.booking_faces,
          start_date: range.startDate,
          end_date: range.endDate,
          number_of_reserved_panels: range.booking_faces,
          units: range.units || 1,
        }))
      ),
      start_date: formik.values.start_date,
      end_date: formik.values.end_date,
      printing_id: parseInt(formik.values.printing_id), // Add this line
    };
    
    const response = await calculateReservation(payload).unwrap();

    setCalculationResult(response);
    showToast(
      "success",
      `السعر الإجمالي: ${
        response?.price_per_period.toFixed(2) || "غير متوفر"
      } (رقم الطباعة: ${formik.values.printing_id})`
    );
  } catch (error) {
    showToast("error", `${error.data?.message || error.message}`);
  }
};
  // New function: Calculate individual booking price
const calculateBookingPrice = async (cartId) => {
  try {
    // Check if printing_id is provided
    if (!formik.values.printing_id) {
      showToast("error", "يرجى إدخال رقم الطباعة قبل حساب سعر الحجز الفردي");
      return;
    }

    // Set loading state for this specific booking
    setIndividualLoadingStates(prev => ({
      ...prev,
      [cartId]: true
    }));

    // Find the booking by cartId
    const bookingSign = selectedSigns.find(sign => sign.cartId === cartId);
    if (!bookingSign) {
      showToast("error", "الحجز غير موجود");
      setIndividualLoadingStates(prev => ({
        ...prev,
        [cartId]: false
      }));
      return;
    }

    const payload = {
      product_type: parseInt(formik.values.product_type),
      roadsigns: bookingSign.dateRanges.map((range) => ({
        road_sign_id: bookingSign.road_sign_id,
        booking_faces: range.booking_faces,
        start_date: range.startDate,
        end_date: range.endDate,
        number_of_reserved_panels: range.booking_faces,
        units: range.units || 1,
      })),
      start_date: formik.values.start_date,
      end_date: formik.values.end_date,
      printing_id: parseInt(formik.values.printing_id), // Add this line
    };

    const response = await calculateReservation(payload).unwrap();

    setIndividualCalculations(prev => ({
      ...prev,
      [cartId]: {
        price_per_period: response.price_per_period,
        amount: response.amount,
        units: response.units,
      }
    }));

    showToast(
      "success",
      `سعر الحجز: ${response?.price_per_period.toFixed(2)} $ (رقم الطباعة: ${formik.values.printing_id})`
    );
  } catch (error) {
    showToast("error", `خطأ في حساب سعر الحجز: ${error.data?.message || error.message}`);
  } finally {
    // Clear loading state for this specific booking
    setIndividualLoadingStates(prev => ({
      ...prev,
      [cartId]: false
    }));
  }
};
  const handleDiscountValueChange = (e) => {
    const value = e.target.value;
    if (discountType === "1" && calculationResult) {
      if (value <= calculationResult?.price_per_period) {
        setDiscountValue(value);
      } else {
        setDiscountValue(calculationResult?.price_per_period);
        showToast("error", "قيمة الحسم لا يمكن أن تتجاوز السعر الإجمالي");
      }
    } else if (discountType === "2") {
      if (value <= 100) {
        setDiscountValue(value);
      } else {
        setDiscountValue(100);
        showToast("error", "قيمة الحسم لا يمكن أن تتجاوز 100%");
      }
    }
  };

const calculateDiscountedPrice = useMemo(
  () => (advertisingOnly = false) => {
    if (!calculationResult) {
      return advertisingOnly 
        ? calculationResult?.amount?.total_advertising_price 
        : calculationResult?.price_per_period;
    }

    if (advertisingOnly) {
      // Discount only on advertising price
      const advertisingPrice = calculationResult.amount?.total_advertising_price || 0;
      
      if (!discountValue) return advertisingPrice;
      
      const discountNum = parseFloat(discountValue);
      
      if (discountType === "1") {
        // Fixed amount discount
        return Math.max(0, advertisingPrice - discountNum);
      } else {
        // Percentage discount
        return advertisingPrice * (1 - discountNum / 100);
      }
    } else {
      // Calculate total price with discount applied to advertising only
      const advertisingPrice = calculationResult.amount?.total_advertising_price || 0;
      const printingPrice = calculationResult.amount?.total_printing_price || 0;
      
      if (!discountValue) {
        return advertisingPrice + printingPrice;
      }
      
      const discountNum = parseFloat(discountValue);
      let discountedAdvertisingPrice;
      
      if (discountType === "1") {
        // Fixed amount discount
        discountedAdvertisingPrice = Math.max(0, advertisingPrice - discountNum);
      } else {
        // Percentage discount
        discountedAdvertisingPrice = advertisingPrice * (1 - discountNum / 100);
      }
      
      // Add printing price back
      return discountedAdvertisingPrice + printingPrice;
    }
  },
  [calculationResult, discountValue, discountType]
);




  // Group selected signs by booking (road_sign_id)
// Group selected signs by cartId (each booking is separate)
const groupedBookings = useMemo(() => {
  const groups = {};
  selectedSigns.forEach((sign) => {
    const roadSign = roadSigns?.data?.find(rs => rs.id === sign.road_sign_id);
    const signKey = sign.cartId; // Use cartId instead of road_sign_id
    
    if (!groups[signKey]) {
      groups[signKey] = {
        cartId: sign.cartId, // Use cartId as identifier
        road_sign_id: sign.road_sign_id,
        roadSign: roadSign || sign, // Use stored sign data if roadSign not found
        dateRanges: [],
        totalFaces: 0,
        totalUnits: 0,
        individualCalculation: individualCalculations[sign.cartId] || null,
        isLoading: individualLoadingStates[sign.cartId] || false,
      };
    }
    
    sign.dateRanges.forEach(range => {
      groups[signKey].dateRanges.push({
        ...range,
        bookingIndex: groups[signKey].dateRanges.length
      });
      groups[signKey].totalFaces += range.booking_faces;
      groups[signKey].totalUnits += range.units || 1;
    });
  });
  
  return Object.values(groups);
}, [selectedSigns, roadSigns, individualCalculations, individualLoadingStates]);

  // Context value
  const contextValue = {
    isEditMode,
    openDialog,
    setOpenDialog,
    selectedSigns,
    addedSignIds,
    calculationResult,
    showDiscount,
    setShowDiscount,
    discountType,
    setDiscountType,
    discountValue,
    setDiscountValue,
    contractDialog,
    setContractDialog,
    notes,
    setNotes,
    queryParams,
    roadSigns,
    isLoadingRoadSigns,
    bookingData,
    isLoadingBooking,
    customers,
    isLoadingCustomers,
    isLoadingAdd,
    isLoadingUpdate,
    formik,
    addToCart,
    updateSignFaces,
    removeFromCart,
    calculateTotal,
    calculateBookingPrice,
    handleDiscountValueChange,
    calculateDiscountedPrice,
    isLoadingCalculateReservation,
    groupedBookings,
    individualCalculations,
    individualLoadingStates, // Add individual loading states to context
  };

  return (
    <BookingContext.Provider value={contextValue}>
      {children}
      <Toaster />
    </BookingContext.Provider>
  );
};