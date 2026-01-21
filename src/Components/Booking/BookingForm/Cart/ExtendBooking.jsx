import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { 
  useGetOneBookingsQuery, 
  useExtendBookingMutation,
  useCalculateReservationMutation,
  useMoveBookingMutation
} from "../../../../RtkQuery/Slice/Booking/BookingApi";
import { showToast } from "../../../../../src/utils/Notifictions/showToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@iconify/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowRightLeft, 
  X, 
  Search, 
  Calendar, 
  CalendarOff,
  Palette,
  RefreshCw,
  DollarSign,
  Check,
  XCircle,
  HelpCircle,
  AlertTriangle
} from "lucide-react";
import useGetRoadSignsByFilter from "../../../../hooks/useGetRoadSignsByFilter";
import { Separator } from "@/components/ui/separator";

import axios from "axios"
import { BASE_URL } from "../../../../Api/baseUrl";

const fetchPrintingTypes = async () => {
  try {
    const raw = localStorage.getItem("SuperAdminInfo");
    const info = raw ? JSON.parse(raw) : null;
    const token = info?.user?.token || info?.token || null;
    
    const response = await axios.get(`${BASE_URL}/printings`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });
    
    return response.data || [];
  } catch (error) {
    console.error("Error fetching printing types:", error);
    return [];
  }
};

const ExtendBooking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: booking, isLoading, error, refetch } = useGetOneBookingsQuery(id);
  const [extendBooking, { isLoading: isExtending }] = useExtendBookingMutation();
  const [calculateReservation, { isLoading: isCalculating }] = useCalculateReservationMutation();
  const [moveBooking, { isLoading: isMoving }] = useMoveBookingMutation();
  
  const [newEndDate, setNewEndDate] = useState("");
  const [calculatedAmount, setCalculatedAmount] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState("percentage");
  const [selectedRoadSigns, setSelectedRoadSigns] = useState([]);
  
  // New state for design option
  const [useNewDesign, setUseNewDesign] = useState(false);
  const [printingTypes, setPrintingTypes] = useState([]);
  const [selectedPrintingType, setSelectedPrintingType] = useState(null);
  const [isFetchingPrintingTypes, setIsFetchingPrintingTypes] = useState(false);
  const [designPriceInfo, setDesignPriceInfo] = useState(null);
  
  // Move booking states
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [moveSignId, setMoveSignId] = useState("");
  const [newRoadSignId, setNewRoadSignId] = useState("");
  const [availableRoadSigns, setAvailableRoadSigns] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Use the same hook as TableRoadSigns to fetch all road signs
  const {
    roadSigns: allRoadSigns,
    isRoadSignsFetching,
    isError,
  } = useGetRoadSignsByFilter();

  useEffect(() => {
    if (booking?.end_date) {
      setNewEndDate(booking.end_date.split('T')[0]);
    }
    if (booking?.roadsigns) {
      // Initialize with all road signs selected
      setSelectedRoadSigns(booking.roadsigns.map(sign => sign.id));
    }
  }, [booking]);

  useEffect(() => {
    const fetchPrintTypes = async () => {
      if (useNewDesign) {
        setIsFetchingPrintingTypes(true);
        try {
          const types = await fetchPrintingTypes();
          setPrintingTypes(types);
          
          // Auto-select the first printing type or keep existing selection
          if (types.length > 0 && !selectedPrintingType) {
            setSelectedPrintingType(types[0].id);
          }
        } catch (error) {
          console.error("Failed to fetch printing types:", error);
          showToast("error", "فشل في تحميل أنواع الطباعة");
          setPrintingTypes([]); // Empty array on error
        } finally {
          setIsFetchingPrintingTypes(false);
        }
      } else {
        setSelectedPrintingType(null);
        setDesignPriceInfo(null);
      }
    };
    
    fetchPrintTypes();
  }, [useNewDesign]);

  // Calculate price when printing type changes
  useEffect(() => {
    if (useNewDesign && selectedPrintingType && newEndDate && selectedRoadSigns.length > 0) {
      const calculateDesignPrice = async () => {
        try {
          const currentEndDate = new Date(booking.end_date);
          const extendedEndDate = new Date(newEndDate);
          
          if (extendedEndDate <= currentEndDate) return;
          
          const extensionStartDate = new Date(currentEndDate);
          extensionStartDate.setDate(extensionStartDate.getDate() + 1);
          
          const formatDate = (date) => {
            return date.toISOString().split('T')[0];
          };

          const startDateStr = formatDate(extensionStartDate);
          const endDateStr = formatDate(extendedEndDate);

          const selectedSignsData = booking.roadsigns.filter(sign => 
            selectedRoadSigns.includes(sign.id)
          );

          const calculateData = {
            start_date: startDateStr,
            end_date: endDateStr,
            roadsigns: selectedSignsData.map(sign => ({
              road_sign_id: sign.id,
              booking_faces: sign.pivot.booking_faces,
              number_of_reserved_panels: sign.pivot.number_of_reserved_panels,
              start_date: startDateStr,
              end_date: endDateStr
            })),
            product_type: booking.product_type,
            printing_id: selectedPrintingType,
            is_extend: false, // Set to false when calculating price with new design
            include_design_cost: true
          };

          // Use the RTK mutation for both cases
          const result = await calculateReservation(calculateData).unwrap();
          
          if (result?.amount?.total_price) {
            setDesignPriceInfo({
              printingCost: result.amount.printing_cost || 0,
              originalPrice: result.amount.original_price || result.amount.total_price,
              totalPrice: result.amount.total_price
            });
          }
        } catch (error) {
          console.error("Error calculating design price:", error);
          setDesignPriceInfo(null);
        }
      };
      
      calculateDesignPrice();
    }
  }, [useNewDesign, selectedPrintingType, newEndDate, selectedRoadSigns, booking]);

  // Get the selected road sign details
  const selectedSignDetails = useMemo(() => {
    if (!booking?.roadsigns || !moveSignId) return null;
    return booking.roadsigns.find(sign => sign.id == moveSignId);
  }, [booking?.roadsigns, moveSignId]);

  // Filter available road signs based on conditions
  useEffect(() => {
    if (isMoveDialogOpen && selectedSignDetails && allRoadSigns) {
      // Get template ID and size from selected sign
      const currentTemplateId = selectedSignDetails.template?.id;
      const currentSize = selectedSignDetails.size || 
                         (selectedSignDetails.width && selectedSignDetails.height ? 
                          `${selectedSignDetails.width}×${selectedSignDetails.height}` : null);

      // Filter all road signs based on conditions
      const filtered = allRoadSigns.filter(sign => {
        if (!sign) return false;
        
        // Don't include the same road sign
        if (sign.id == moveSignId) return false;
        
        // Condition 1: Same template
        if (!sign.template || sign.template.id !== currentTemplateId) {
          return false;
        }
        
        // Condition 2: Same size (if available)
        if (currentSize) {
          const signSize = sign.size || 
                          (sign.width && sign.height ? 
                           `${sign.width}×${sign.height}` : null);
          if (signSize !== currentSize) return false;
        }
        
        // Condition 3: Available (not booked) - MOST IMPORTANT
        // Check if sign has any bookings at all
        const hasAnyBookings = sign.bookings && Array.isArray(sign.bookings) && sign.bookings.length > 0;
        const hasPivotBookings = sign.pivot && sign.pivot.booking_faces && sign.pivot.booking_faces > 0;
        
        // If no bookings at all, it's available
        if (!hasAnyBookings && !hasPivotBookings) {
          return true;
        }
        
        // If there are bookings, check if any are active
        if (hasAnyBookings) {
          const hasActiveBookings = sign.bookings.some(booking => 
            booking.status === 1 || 
            booking.status === "approved" ||
            booking.status === "active" ||
            booking.status === "confirmed"
          );
          
          // If there are active bookings, it's NOT available
          if (hasActiveBookings) {
            return false;
          }
          
          // If all bookings are inactive (cancelled, rejected, etc.), it's available
          const allInactive = sign.bookings.every(booking => 
            booking.status === 0 || 
            booking.status === "cancelled" || 
            booking.status === "rejected" ||
            booking.status === "expired"
          );
          
          return allInactive;
        }
        
        return false;
      });
      
      setAvailableRoadSigns(filtered || []);
    }
  }, [isMoveDialogOpen, selectedSignDetails, moveSignId, allRoadSigns]);

  // Check if selected road sign has active bookings
  const hasActiveBookings = useMemo(() => {
    if (!selectedSignDetails) return false;
    
    return selectedSignDetails.bookings && 
           Array.isArray(selectedSignDetails.bookings) && 
           selectedSignDetails.bookings.some(booking => 
             booking.status === 1 || 
             booking.status === "approved" ||
             booking.status === "active" ||
             booking.status === "confirmed"
           );
  }, [selectedSignDetails]);

  // Get the first active booking for the selected sign
  const firstActiveBooking = useMemo(() => {
    if (!selectedSignDetails?.bookings) return null;
    return selectedSignDetails.bookings.find(booking => 
      booking.status === 1 || 
      booking.status === "approved" ||
      booking.status === "active" ||
      booking.status === "confirmed"
    );
  }, [selectedSignDetails]);

  const handleToggleRoadSign = (signId) => {
    setSelectedRoadSigns(prev => {
      const newSelected = prev.includes(signId)
        ? prev.filter(id => id !== signId)
        : [...prev, signId];
      
      if (calculatedAmount) {
        setCalculatedAmount(null);
        setDiscount(0);
      }
      if (designPriceInfo) {
        setDesignPriceInfo(null);
      }
      
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    if (booking?.roadsigns) {
      const allIds = booking.roadsigns.map(sign => sign.id);
      setSelectedRoadSigns(allIds);
      
      if (calculatedAmount) {
        setCalculatedAmount(null);
        setDiscount(0);
      }
      if (designPriceInfo) {
        setDesignPriceInfo(null);
      }
    }
  };

  const handleDeselectAll = () => {
    setSelectedRoadSigns([]);
    
    if (calculatedAmount) {
      setCalculatedAmount(null);
      setDiscount(0);
    }
    if (designPriceInfo) {
      setDesignPriceInfo(null);
    }
  };

  const calculateFinalPrice = (price) => {
    if (!price) return 0;
    
    let finalPrice = price;
    
    if (discount > 0) {
      if (discountType === "percentage") {
        finalPrice = price - (price * discount / 100);
      } else {
        finalPrice = price - discount;
      }
    }
    
    return Math.max(0, Math.round(finalPrice));
  };

  // Move Booking Handler
  const handleMoveBooking = async () => {
    if (!moveSignId || !newRoadSignId) {
      showToast("error", "يرجى اختيار اللوحة الحالية واللوحة الجديدة");
      return;
    }

    if (moveSignId === newRoadSignId) {
      showToast("error", "يجب اختيار لوحة جديدة مختلفة عن اللوحة الحالية");
      return;
    }

    if (!firstActiveBooking) {
      showToast("error", "اللوحة المختارة ليس لها حجز نشط");
      return;
    }

    const newSign = availableRoadSigns.find(sign => sign.id == newRoadSignId);
    const currentSign = selectedSignDetails;

    if (!newSign) {
      showToast("error", "اللوحة المختارة غير متاحة");
      return;
    }

    if (newSign.template?.id !== currentSign.template?.id) {
      showToast("error", "اللوحة الجديدة لا تطابق النموذج");
      return;
    }

    try {
      await moveBooking({
        booking_id: firstActiveBooking.id,
        old_roadsign_id: moveSignId,
        new_roadsign_id: newRoadSignId
      }).unwrap();

      showToast("success", "تم نقل الحجز بنجاح");
      setIsMoveDialogOpen(false);
      refetch();
      
      // Reset form
      setMoveSignId("");
      setNewRoadSignId("");
      setAvailableRoadSigns([]);
      setSearchTerm("");
    } catch (error) {
      console.error("Move booking error:", error);
      showToast("error", error.data?.message || "حدث خطأ أثناء نقل الحجز");
    }
  };

  const handleCalculatePrice = async () => {
    if (!newEndDate) {
      showToast("error", "يرجى اختيار تاريخ نهاية جديد أولاً");
      return;
    }

    if (selectedRoadSigns.length === 0) {
      showToast("error", "يرجى اختيار لوحة إعلانية واحدة على الأقل");
      return;
    }

    const currentEndDate = new Date(booking.end_date);
    const extendedEndDate = new Date(newEndDate);
    
    if (extendedEndDate <= currentEndDate) {
      showToast("error", "يجب أن يكون التاريخ الجديد بعد تاريخ النهاية الحالي");
      return;
    }

    try {
      const extensionStartDate = new Date(currentEndDate);
      extensionStartDate.setDate(extensionStartDate.getDate() + 1);
      
      const formatDate = (date) => {
        return date.toISOString().split('T')[0];
      };

      const startDateStr = formatDate(extensionStartDate);
      const endDateStr = formatDate(extendedEndDate);

      const selectedSignsData = booking.roadsigns.filter(sign => 
        selectedRoadSigns.includes(sign.id)
      );

      const calculateData = {
        start_date: startDateStr,
        end_date: endDateStr,
        roadsigns: selectedSignsData.map(sign => ({
          road_sign_id: sign.id,
          booking_faces: sign.pivot.booking_faces,
          number_of_reserved_panels: sign.pivot.number_of_reserved_panels,
          start_date: startDateStr,
          end_date: endDateStr
        })),
        product_type: booking.product_type,
        printing_id: useNewDesign ? selectedPrintingType : booking.printing_id,
        is_extend: !useNewDesign, // false when useNewDesign is true
        include_design_cost: useNewDesign
      };

      // Always use the RTK mutation for calculation
      const result = await calculateReservation(calculateData).unwrap();
      
      const amount = result?.amount?.total_price;
      setCalculatedAmount(amount);
      
      if (useNewDesign && result?.amount) {
        setDesignPriceInfo({
          printingCost: result.amount.printing_cost || 0,
          originalPrice: result.amount.original_price || amount,
          totalPrice: amount
        });
      }
      
      showToast("success", "تم حساب السعر الجديد بنجاح");
    } catch (error) {
      console.error("Calculation error:", error);
      showToast("error", error.data?.message || "حدث خطأ أثناء حساب السعر");
    }
  };

const handleExtendBooking = async () => {
  if (!newEndDate) {
    showToast("error", "يرجى اختيار تاريخ نهاية جديد");
    return;
  }

  if (selectedRoadSigns.length === 0) {
    showToast("error", "يرجى اختيار لوحة إعلانية واحدة على الأقل");
    return;
  }

  try {
    const finalPrice = useNewDesign && designPriceInfo 
      ? calculateFinalPrice(designPriceInfo.totalPrice)
      : calculateFinalPrice(calculatedAmount);

    const selectedSignsData = booking.roadsigns.filter(sign => 
      selectedRoadSigns.includes(sign.id)
    );

    const currentEndDate = new Date(booking.end_date);
    const extensionStartDate = new Date(currentEndDate);
    extensionStartDate.setDate(extensionStartDate.getDate() + 1);
    
    const formatDate = (date) => {
      return date.toISOString().split('T')[0];
    };

    const startDateStr = formatDate(extensionStartDate);
    const endDateStr = formatDate(new Date(newEndDate));

    const extendData = {
      end_date: endDateStr,
      roadsigns: selectedSignsData.map(sign => ({
        road_sign_id: sign.id,
        booking_faces: sign.pivot.booking_faces,
        number_of_reserved_panels: sign.pivot.number_of_reserved_panels,
        start_date: startDateStr,
        end_date: endDateStr
      })),
      product_type: booking.product_type,
      printing_id: useNewDesign ? selectedPrintingType : booking.printing_id,
      is_extend: !useNewDesign, // false when useNewDesign is true
      total_price: finalPrice,
      discount: discount > 0 ? {
        amount: discount,
        type: discountType,
        original_price: calculatedAmount
      } : null,
      include_design_cost: useNewDesign
    };

    await extendBooking({ id, ...extendData }).unwrap();
    
    const successMsg = useNewDesign 
      ? `تم تمديد الحجز مع تصميم جديد ${discount > 0 ? 'مع الخصم ' : ''}بنجاح`
      : `تم تمديد الحجز ${discount > 0 ? 'مع الخصم ' : ''}بنجاح`;
    
    showToast("success", successMsg);
    navigate("/dashboard/bookings");
  } catch (error) {
    console.error("Extend booking error:", error);
    
    // Get the fucking error message
    let errorMessage = error.data?.message || "حدث خطأ أثناء تمديد الحجز";
    
    // Check for unavailable road signs in the error
    if (error.data?.unavailable && Array.isArray(error.data.unavailable)) {
      const unavailableItems = error.data.unavailable;
      
      // Collect all unavailable road sign IDs and details
      const unavailableDetails = [];
      
      unavailableItems.forEach(item => {
        const roadSignId = item.road_sign_id;
        // Find the road sign in current booking
        const roadSign = booking.roadsigns.find(sign => sign.id == roadSignId);
        
        if (roadSign) {
          unavailableDetails.push({
            id: roadSignId,
            place: roadSign.place || `اللوحة #${roadSignId}`,
            code: roadSign.roadsign_code || `RS-${roadSignId}`,
            template: roadSign.template?.model || "غير محدد"
          });
        } else {
          unavailableDetails.push({
            id: roadSignId,
            place: `اللوحة #${roadSignId}`,
            code: `ID: ${roadSignId}`,
            template: "غير معروف"
          });
        }
      });
      
      if (unavailableDetails.length > 0) {
        // Create a detailed error message
        const signList = unavailableDetails.map(sign => 
          `${sign.place} (${sign.code}) - النموذج: ${sign.template}`
        ).join('\n');
        
        errorMessage = `${errorMessage}\n\nاللوحات غير المتاحة:\n${signList}`;
        
        // Also show alternatives if available
        if (unavailableItems[0]?.alternatives && unavailableItems[0].alternatives.length > 0) {
          const alternatives = unavailableItems[0].alternatives.map(alt => 
            `${alt.place} (${alt.roadsign_code || `RS-${alt.id}`})`
          ).join('، ');
          
          errorMessage += `\n\nالبدائل المتاحة: ${alternatives}`;
        }
      }
    }
    
    // Show the fucking error with all details
    showToast("error", errorMessage);
    
    // Also log for debugging
    console.warn("Extend API error details:", {
      message: error.data?.message,
      unavailable: error.data?.unavailable,
      error
    });
  }
};

  // Filter available signs by search term
  const filteredAvailableSigns = useMemo(() => {
    if (!availableRoadSigns) return [];
    
    if (!searchTerm.trim()) {
      return availableRoadSigns;
    }
    
    const term = searchTerm.toLowerCase();
    return availableRoadSigns.filter(sign => {
      return (
        (sign.place && sign.place.toLowerCase().includes(term)) ||
        (sign.roadsign_code && sign.roadsign_code.toLowerCase().includes(term)) ||
        (sign.directions && sign.directions.toLowerCase().includes(term)) ||
        (sign.direction && sign.direction.toLowerCase().includes(term)) ||
        (sign.template?.model && sign.template.model.toLowerCase().includes(term)) ||
        (sign.id && sign.id.toString().includes(term))
      );
    });
  }, [availableRoadSigns, searchTerm]);

  // Get selected printing type details
  const selectedPrintingTypeDetails = useMemo(() => {
    if (!selectedPrintingType || !printingTypes.length) return null;
    return printingTypes.find(type => type.id == selectedPrintingType);
  }, [selectedPrintingType, printingTypes]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 text-center">
        <div className="text-red-500 text-xl">خطأ في تحميل بيانات الحجز</div>
        <Button onClick={() => navigate("/dashboard/bookings")} className="mt-4">
          العودة إلى الحجوزات
        </Button>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto p-6 text-center">
        <div className="text-xl">الحجز غير موجود</div>
        <Button onClick={() => navigate("/dashboard/bookings")} className="mt-4">
          العودة إلى الحجوزات
        </Button>
      </div>
    );
  }

  const allSelected = selectedRoadSigns.length === booking.roadsigns?.length;
  const noneSelected = selectedRoadSigns.length === 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon icon="mdi:calendar-plus" className="text-2xl text-orange-500" />
          <h1 className="text-2xl font-bold">تمديد الحجز #{booking.id}</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Move Booking Button */}
          <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <ArrowRightLeft className="w-4 h-4 text-blue-500" />
                تبديل لوحة
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-center flex items-center justify-center gap-2">
                  <ArrowRightLeft className="w-5 h-5" />
                  تبديل موقع اللوحة
                </DialogTitle>
                <DialogDescription>
                  نقل اللوحة الإعلانية من موقعها الحالي إلى موقع جديد
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Current Road Sign Selection */}
                <div className="space-y-2">
                  <Label htmlFor="current-sign">اختر اللوحة الحالية</Label>
                  <Select
                    value={moveSignId}
                    onValueChange={(value) => {
                      setMoveSignId(value);
                      setNewRoadSignId("");
                      setSearchTerm("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر اللوحة الحالية" />
                    </SelectTrigger>
                    <SelectContent>
                      {booking?.roadsigns?.map((sign) => {
                        const signHasActive = sign.bookings && 
                                            Array.isArray(sign.bookings) && 
                                            sign.bookings.some(b => b.status === 1);
                        
                        return (
                          <SelectItem 
                            key={sign.id} 
                            value={sign.id.toString()}
                            className={signHasActive ? "bg-green-50 dark:bg-green-900/30" : ""}
                          >
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{sign.place || `اللوحة #${sign.id}`}</span>
                                {signHasActive && (
                                  <span className="text-xs bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">
                                    <Calendar className="w-3 h-3 inline mr-1" />
                                    نشط
                                  </span>
                                )}
                                {!signHasActive && (
                                  <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">
                                    <CalendarOff className="w-3 h-3 inline mr-1" />
                                    غير نشط
                                  </span>
                                )}
                              </div>
                              <span className="text-sm text-gray-500">{sign.directions || sign.direction || 'غير محدد'}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                  القالب: {sign.template?.model || "غير محدد"}
                                </span>
                                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                  الحجوزات: {sign.bookings?.filter(b => b.status === 1).length || 0}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Current Road Sign Info */}
                {selectedSignDetails && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-3">
                      معلومات اللوحة الحالية
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <InfoField label="اسم اللوحة" value={selectedSignDetails.place || `اللوحة #${selectedSignDetails.id}`} />
                      <InfoField label="كود اللوحة" value={selectedSignDetails.roadsign_code || 'غير محدد'} />
                      <InfoField label="القالب" value={selectedSignDetails.template?.model || 'غير محدد'} />
                      <InfoField label="معرف القالب" value={selectedSignDetails.template?.id || 'غير محدد'} />
                      <InfoField label="الأبعاد" value={
                        selectedSignDetails.width && selectedSignDetails.height ? 
                          `${selectedSignDetails.width} × ${selectedSignDetails.height}` : 'غير محدد'
                      } />
                      <InfoField label="الاتجاه" value={selectedSignDetails.directions || selectedSignDetails.direction || 'غير محدد'} />
                      <InfoField label="الحجوزات النشطة" value={
                        <span className={`font-semibold ${hasActiveBookings ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedSignDetails.bookings?.filter(b => b.status === 1).length || 0}
                        </span>
                      } />
                      <InfoField label="الحالة" value={
                        <span className={`font-semibold ${hasActiveBookings ? 'text-green-600' : 'text-red-600'}`}>
                          {hasActiveBookings ? '✅ مؤهلة للتبديل' : '❌ غير مؤهلة'}
                        </span>
                      } />
                    </div>
                  </div>
                )}

                {/* Available Signs Section */}
                {selectedSignDetails && hasActiveBookings && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        اختر اللوحة البديلة:
                      </Label>
                      <div className="text-xs text-gray-500">
                        {isRoadSignsFetching ? (
                          <span className="flex items-center gap-1">
                            <span className="animate-spin">⟳</span>
                            جاري التحميل...
                          </span>
                        ) : (
                          <span>متاح {availableRoadSigns.length} لوحة غير محجوزة بنفس المواصفات</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="ابحث في اللوحات المتاحة..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pr-10"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm("")}
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    {isRoadSignsFetching ? (
                      <div className="text-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="text-sm text-gray-500 mt-2">جاري تحميل اللوحات...</p>
                      </div>
                    ) : availableRoadSigns.length === 0 ? (
                      <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg text-center">
                        <div className="text-3xl mb-2">🚫</div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                          لا توجد لوحات متاحة للتبديل
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          جميع اللوحات بنفس النموذج ({selectedSignDetails.template?.model}) محجوزة
                        </p>
                        <div className="mt-3 text-xs text-gray-500">
                          <p className="font-semibold mb-1">شروط التبديل:</p>
                          <ul className="mt-1 space-y-1 text-right">
                            <li>• نفس النموذج ({selectedSignDetails.template?.model})</li>
                            <li>• غير محجوزة (بدون حجوزات نشطة)</li>
                            <li>• نفس الأبعاد إن وجدت</li>
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="border rounded-lg overflow-hidden">
                        <div className="max-h-60 overflow-y-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                              <tr>
                                <th className="p-2 text-right">#</th>
                                <th className="p-2 text-right">اللوحة</th>
                                <th className="p-2 text-right">الكود</th>
                                <th className="p-2 text-right">القالب</th>
                                <th className="p-2 text-right">اختيار</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredAvailableSigns.map((sign, index) => (
                                <tr 
                                  key={sign.id} 
                                  className={`border-t hover:bg-gray-50 dark:hover:bg-gray-800 ${
                                    newRoadSignId == sign.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                                  }`}
                                >
                                  <td className="p-2">{index + 1}</td>
                                  <td className="p-2">
                                    <div>
                                      <div className="font-medium">{sign.place || `#${sign.id}`}</div>
                                      <div className="text-xs text-gray-500">{sign.directions || sign.direction || 'غير محدد'}</div>
                                    </div>
                                  </td>
                                  <td className="p-2">{sign.roadsign_code || `RS-${sign.id}`}</td>
                                  <td className="p-2">
                                    <div className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded inline-block">
                                      {sign.template?.model || 'غير محدد'}
                                    </div>
                                  </td>
                                  <td className="p-2">
                                    <button
                                      onClick={() => setNewRoadSignId(sign.id.toString())}
                                      className={`px-3 py-1 rounded text-xs ${
                                        newRoadSignId == sign.id 
                                          ? 'bg-blue-500 text-white' 
                                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                      }`}
                                    >
                                      {newRoadSignId == sign.id ? 'محدد ✓' : 'اختر'}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          
                          {filteredAvailableSigns.length === 0 && searchTerm && (
                            <div className="text-center p-4 text-gray-500">
                              لا توجد نتائج للبحث "{searchTerm}"
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Selected Sign Info */}
                    {newRoadSignId && !isRoadSignsFetching && (
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-green-700 dark:text-green-300">
                            <span className="font-semibold">✅ اللوحة المختارة:</span>
                            <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                              {(() => {
                                const selected = availableRoadSigns.find(s => s.id == newRoadSignId);
                                if (!selected) return null;
                                
                                return (
                                  <>
                                    <div>الاسم: {selected.place || `اللوحة #${selected.id}`}</div>
                                    <div>الكود: {selected.roadsign_code || `RS-${selected.id}`}</div>
                                    <div>القالب: {selected.template?.model || 'غير محدد'}</div>
                                    <div>الاتجاه: {selected.directions || selected.direction || 'غير محدد'}</div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                          <div className="text-2xl">✅</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Booking Status Message */}
                {selectedSignDetails && !hasActiveBookings && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">⚠️</span>
                      <div>
                        <p className="text-sm text-yellow-800 dark:text-yellow-300 font-semibold">
                          هذه اللوحة غير مؤهلة للتبديل
                        </p>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                          اللوحة يجب أن تحتوي على حجوزات نشطة (حالة: 1 أو approved)
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          عدد الحجوزات: {selectedSignDetails.bookings?.length || 0}
                          {selectedSignDetails.bookings?.length > 0 && (
                            <span className="mr-2">
                              (النشطة: {selectedSignDetails.bookings?.filter(b => b.status === 1).length || 0})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Conditions Info */}
                {selectedSignDetails && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Icon icon="mdi:information-outline" className="text-blue-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-800 mb-2">شروط التبديل:</p>
                        <ul className="space-y-1 text-blue-700">
                          <li className="flex items-center gap-1">
                            <Icon icon="mdi:check-circle" className="text-green-500" />
                            <span className="font-semibold">نفس النموذج:</span> {selectedSignDetails.template?.model || "غير محدد"} (ID: {selectedSignDetails.template?.id})
                          </li>
                          <li className="flex items-center gap-1">
                            <Icon icon="mdi:check-circle" className="text-green-500" />
                            <span className="font-semibold">اللوحة البديلة:</span> يجب أن تكون غير محجوزة (بدون حجوزات نشطة)
                          </li>
                          <li className="flex items-center gap-1">
                            <Icon icon="mdi:check-circle" className="text-green-500" />
                            <span className="font-semibold">اللوحة الحالية:</span> يجب أن تحتوي على حجز نشط (حالة: 1)
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="flex gap-3 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsMoveDialogOpen(false);
                    setMoveSignId("");
                    setNewRoadSignId("");
                    setAvailableRoadSigns([]);
                    setSearchTerm("");
                  }}
                  disabled={isMoving}
                  className="flex-1"
                >
                  إلغاء
                </Button>
                <Button 
                  onClick={handleMoveBooking}
                  disabled={!hasActiveBookings || !newRoadSignId || isMoving || availableRoadSigns.length === 0}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {isMoving ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⟳</span>
                      جاري التبديل...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <ArrowRightLeft className="w-4 h-4" />
                      تبديل اللوحة
                    </span>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Back Button */}
          <Button 
            variant="outline" 
            onClick={() => navigate("/dashboard/bookings")}
          >
            العودة للحجوزات
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="mdi:information" className="text-blue-500" />
              معلومات الحجز الحالية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">العميل</Label>
                <p className="text-lg">{booking.customer?.company_name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">نوع الحجز</Label>
                <p className="text-lg">{booking.type === 1 ? "مؤقت" : "دائم"}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">رقم الطباعة</Label>
                <p className="text-lg">{booking.printing_id || "غير محدد"}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">تاريخ البداية</Label>
                <p className="text-lg">{new Date(booking.start_date).toLocaleDateString('ar-EG')}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">تاريخ النهاية الحالي</Label>
                <p className="text-lg">{new Date(booking.end_date).toLocaleDateString('ar-EG')}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">المدة الحالية</Label>
                <p className="text-lg">{booking.duration_of_days} يوم</p>
              </div>
              <div>
                <Label className="text-sm font-medium">السعر الحالي</Label>
                <p className="text-lg">{booking.total_price} $</p>
              </div>
              <div>
                <Label className="text-sm font-medium">نوع التصميم الحالي</Label>
                <p className="text-lg">{booking.printing_type?.type || "بدون تصميم"}</p>
              </div>
            </div>

            {/* Road Signs */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-indigo-100 dark:bg-indigo-900/30">
                    <Icon icon="mdi:sign-direction" className="text-lg text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <Label className="text-base font-semibold text-gray-800 dark:text-gray-200">
                      اللوحات الإعلانية
                    </Label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      قم بتحديد اللوحات التي تريد تضمينها في التمديد
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        {selectedRoadSigns.length}<span className="text-gray-500 dark:text-gray-400">/</span>{booking.roadsigns?.length}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                      disabled={allSelected}
                      className="h-9 px-3 text-xs border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/30"
                    >
                      <Icon icon="mdi:check-all" className="ml-1 text-green-600 dark:text-green-400" />
                      تحديد الكل
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeselectAll}
                      disabled={noneSelected}
                      className="h-9 px-3 text-xs border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30"
                    >
                      <Icon icon="mdi:close-box-multiple" className="ml-1 text-red-600 dark:text-red-400" />
                      إلغاء الكل
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                {booking.roadsigns?.map((sign, index) => {
                  const isSelected = selectedRoadSigns.includes(sign.id);
                  const signHasActiveBookings = sign.bookings && 
                                               Array.isArray(sign.bookings) && 
                                               sign.bookings.some(booking => 
                                                 booking.status === 1 || 
                                                 booking.status === "approved" ||
                                                 booking.status === "active" ||
                                                 booking.status === "confirmed"
                                               );
                  
                  return (
                    <div 
                      key={sign.id} 
                      className={`group p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer hover:scale-[1.01] hover:shadow-lg ${
                        isSelected 
                          ? 'border-green-400 dark:border-green-600 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20' 
                          : 'border-gray-300 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/40 dark:to-gray-900/40'
                      }`}
                      onClick={() => handleToggleRoadSign(sign.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              isSelected 
                                ? 'bg-green-100 dark:bg-green-900/50' 
                                : 'bg-gray-100 dark:bg-gray-800'
                            }`}>
                              <Icon 
                                icon="mdi:sign-real-estate" 
                                className={`text-lg ${
                                  isSelected 
                                    ? 'text-green-600 dark:text-green-400' 
                                    : 'text-gray-500 dark:text-gray-400'
                                }`}
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-lg text-gray-900 dark:text-gray-100">
                                  {sign.place}
                                </p>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  isSelected 
                                    ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' 
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }`}>
                                  لوحة #{index + 1}
                                </span>
                                
                                {/* Booking Status Badge */}
                                {signHasActiveBookings && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300">
                                    <Calendar className="w-3 h-3 inline mr-1" />
                                    نشط
                                  </span>
                                )}
                                
                                {/* Move button for individual sign */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 ml-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMoveSignId(sign.id);
                                    setIsMoveDialogOpen(true);
                                  }}
                                >
                                  <ArrowRightLeft className="w-4 h-4 text-blue-500" />
                                </Button>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {sign.directions}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                              <Icon icon="mdi:view-quilt" className="text-gray-500 dark:text-gray-400" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-medium">النموذج:</span> {sign.template?.model || "غير محدد"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                              <Icon icon="mdi:cube" className="text-gray-500 dark:text-gray-400" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-medium">الأوجه:</span> {sign.pivot.booking_faces}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                              <Icon icon="mdi:cube-outline" className="text-gray-500 dark:text-gray-400" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-medium">اللوحات:</span> {sign.pivot.number_of_reserved_panels}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                              <Icon icon="mdi:ruler" className="text-gray-500 dark:text-gray-400" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-medium">الأبعاد:</span> {sign.width && sign.height ? 
                                  `${sign.width} × ${sign.height}` : 'غير محدد'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-center gap-3 ml-4">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleRoadSign(sign.id);
                            }}
                            className={`p-3 rounded-full transition-all duration-300 ${
                              isSelected 
                                ? 'bg-green-500 hover:bg-green-600 shadow-lg shadow-green-200 dark:shadow-green-900/50' 
                                : 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200 dark:shadow-red-900/50'
                            }`}
                          >
                            <Icon 
                              icon={isSelected ? "mdi:check-bold" : "mdi:close-thick"} 
                              className="text-xl text-white"
                            />
                          </button>
                          
                          <div className={`px-3 py-1.5 rounded-full border text-sm font-medium ${
                            isSelected 
                              ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                              : 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          }`}>
                            {isSelected ? 'محدد للتمديد' : 'غير محدد'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3">
                  <Icon icon="mdi:information-outline" className="text-blue-600 dark:text-blue-400 text-lg" />
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                      تم تحديد {selectedRoadSigns.length} من أصل {booking.roadsigns?.length || 0} لوحة
                    </p>
                    {selectedRoadSigns.length < booking.roadsigns?.length && (
                      <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                        سيتم إزالة {booking.roadsigns?.length - selectedRoadSigns.length} لوحة من التمديد
                      </p>
                    )}
                    {selectedRoadSigns.length === 0 && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                        ⚠️ يجب تحديد لوحة واحدة على الأقل للمتابعة
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Extend Booking Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon icon="mdi:calendar-edit" className="text-green-500" />
              تمديد الحجز
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Design Change Option - COMPLETE REPLACEMENT */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-800/50 rounded-lg">
                    <Palette className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      تغيير التصميم
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      هل تريد تغيير تصميم اللوحات في فترة التمديد؟
                    </p>
                  </div>
                </div>
                
                <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-1 bg-gray-50 dark:bg-gray-800">
                  <button
                    type="button"
                    onClick={() => setUseNewDesign(true)}
                    className={`px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
                      useNewDesign
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Check className="w-4 h-4 inline mr-2" />
                    نعم
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseNewDesign(false)}
                    className={`px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
                      !useNewDesign
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white shadow-inner'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <XCircle className="w-4 h-4 inline mr-2" />
                    لا
                  </button>
                </div>
              </div>
              
              {useNewDesign && (
                <div className="mt-4 space-y-4 animate-in fade-in duration-300">
                  {/* Design Notice - Replace Alert */}
                  <div className="p-3 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 bg-yellow-100 dark:bg-yellow-800/50 rounded-md mt-0.5">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-yellow-800 dark:text-yellow-300 text-sm">
                          ملاحظة مهمة
                        </p>
                        <p className="text-yellow-700 dark:text-yellow-400 text-xs mt-1">
                          سيتم إضافة تكلفة التصميم الجديد إلى السعر النهائي للتمديد
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-blue-500" />
                      اختر نوع التصميم الجديد
                    </Label>
                    
                    {isFetchingPrintingTypes ? (
                      <div className="flex items-center justify-center p-4">
                        <RefreshCw className="w-5 h-5 animate-spin text-blue-500 mr-2" />
                        <span className="text-sm text-gray-600">جاري تحميل أنواع التصميم...</span>
                      </div>
                    ) : printingTypes.length === 0 ? (
                      <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <div className="flex items-center gap-2">
                          <XCircle className="w-5 h-5 text-red-500" />
                          <span className="text-sm text-red-700 dark:text-red-300">لا توجد أنواع تصميم متاحة</span>
                        </div>
                      </div>
                    ) : (
                      <Select
                        value={selectedPrintingType?.toString()}
                        onValueChange={(value) => setSelectedPrintingType(value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="اختر نوع التصميم" />
                        </SelectTrigger>
                        <SelectContent>
                          {printingTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              <div className="flex items-center justify-between w-full">
                                <span>{type.type}</span>
                                <span className="text-sm text-green-600 font-medium">
                                  {parseFloat(type.price || 0).toLocaleString()} ل.س
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    
                    {selectedPrintingTypeDetails && (
                      <div className="mt-2 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-600" />
                            <span className="font-medium text-green-800 dark:text-green-300">
                              {selectedPrintingTypeDetails.type}
                            </span>
                          </div>
                          <div className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-full text-sm">
                            <DollarSign className="w-3 h-3 inline mr-1" />
                            {parseFloat(selectedPrintingTypeDetails.price || 0).toLocaleString()} ل.س
                          </div>
                        </div>
                        {designPriceInfo && (
                          <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                            <p>تكلفة التصميم: {designPriceInfo.printingCost?.toLocaleString()} ل.س</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* New End Date */}
            <div>
              <Label htmlFor="end_date" className="text-sm font-medium">
                تاريخ النهاية الجديد
              </Label>
              <Input
                id="end_date"
                type="date"
                value={newEndDate}
                onChange={(e) => {
                  setNewEndDate(e.target.value);
                  setCalculatedAmount(null);
                  setDesignPriceInfo(null);
                  setDiscount(0);
                }}
                min={booking.end_date.split('T')[0]}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                يجب أن يكون التاريخ الجديد بعد {new Date(booking.end_date).toLocaleDateString('ar-EG')}
              </p>
            </div>

            {/* Selection Summary */}
            {selectedRoadSigns.length < booking.roadsigns?.length && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Icon icon="mdi:alert-circle" className="text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">ملاحظة:</p>
                    <p>سيتم تمديد {selectedRoadSigns.length} لوحة فقط من أصل {booking.roadsigns?.length}</p>
                    <p className="mt-1">اللوحات غير المحددة سيتم إزالتها من التمديد</p>
                  </div>
                </div>
              </div>
            )}

            {/* Calculate Price Button */}
            <div className="flex gap-2">
              <Button
                onClick={handleCalculatePrice}
                disabled={
                  isCalculating || 
                  !newEndDate || 
                  selectedRoadSigns.length === 0 ||
                  (useNewDesign && !selectedPrintingType)
                }
                className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
              >
                {isCalculating ? (
                  <>
                    <Icon icon="mdi:loading" className="animate-spin mr-2" />
                    جاري الحساب...
                  </>
                ) : (
                  <>
                    <Icon icon="mdi:calculator" className="mr-2" />
                    حساب السعر الجديد
                  </>
                )}
              </Button>
            </div>

            {/* Price Calculation Result */}
            {calculatedAmount && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <h3 className="font-semibold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  حساب السعر الدقيق
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>عدد اللوحات المحددة:</span>
                    <span className="font-medium">{selectedRoadSigns.length} لوحة</span>
                  </div>
                  
                  
                  {useNewDesign && designPriceInfo && (
                    <>
                      <Separator className="my-2" />
                      <div className="flex justify-between">
                        <span>سعر التمديد:</span>
                        <span className="font-medium">{designPriceInfo.originalPrice?.toLocaleString()} $</span>
                      </div>
                      <div className="flex justify-between">
                        <span>تكلفة التصميم:</span>
                        <span className="text-blue-600 font-medium">+{designPriceInfo.printingCost?.toLocaleString()} $</span>
                      </div>
                      <Separator className="my-2" />
                    </>
                  )}
                  
                  <div className="flex justify-between">
                    <span>السعر الجديد:</span>
                    <span className="text-green-600 font-bold text-lg">
                      {useNewDesign && designPriceInfo 
                        ? designPriceInfo.totalPrice?.toLocaleString() 
                        : calculatedAmount?.toLocaleString()
                      } $
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Discount Section */}
            {calculatedAmount && (
              <div className="space-y-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-orange-500" />
                    إضافة خصم
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={discountType === "percentage" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDiscountType("percentage")}
                      className="px-3"
                    >
                      %
                    </Button>
                    <Button
                      type="button"
                      variant={discountType === "fixed" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDiscountType("fixed")}
                      className="px-3"
                    >
                      $
                    </Button>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder={discountType === "percentage" ? "نسبة الخصم" : "مبلغ الخصم"}
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    min="0"
                    max={discountType === "percentage" ? "100" : undefined}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={() => setDiscount(0)}
                    disabled={discount === 0}
                    className="px-4"
                  >
                    إلغاء
                  </Button>
                </div>
                
                {discount > 0 && (
                  <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-yellow-200 dark:border-yellow-700">
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span>السعر قبل الخصم:</span>
                      <span className="font-medium">
                        {useNewDesign && designPriceInfo 
                          ? designPriceInfo.totalPrice?.toLocaleString() 
                          : calculatedAmount?.toLocaleString()
                        } $
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span>قيمة الخصم:</span>
                      <span className="text-red-600 font-medium">
                        -{discountType === "percentage" ? `${discount}%` : `${discount}$`}
                      </span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between items-center text-sm pt-2">
                      <span className="font-bold">السعر النهائي:</span>
                      <span className="text-green-600 font-bold text-lg">
                        {useNewDesign && designPriceInfo 
                          ? calculateFinalPrice(designPriceInfo.totalPrice)?.toLocaleString() 
                          : calculateFinalPrice(calculatedAmount)?.toLocaleString()
                        } $
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleExtendBooking}
                disabled={
                  isExtending || 
                  !calculatedAmount || 
                  selectedRoadSigns.length === 0 ||
                  (useNewDesign && !selectedPrintingType)
                }
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl"
              >
                {isExtending ? (
                  <>
                    <Icon icon="mdi:loading" className="animate-spin mr-2" />
                    جاري التمديد...
                  </>
                ) : (
                  <>
                    <Icon icon="mdi:calendar-plus" className="mr-2" />
                    {useNewDesign ? "تمديد مع تصميم جديد" : "تأكيد التمديد"}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard/bookings")}
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
            
            {/* Summary Alert */}
            {useNewDesign && selectedPrintingType && (
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-blue-100 dark:bg-blue-800/50 rounded-md mt-0.5">
                    <Icon icon="mdi:information-outline" className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-blue-800 dark:text-blue-300 text-sm mb-2">
                      ملخص التمديد
                    </p>
                    <div className="space-y-1 text-sm text-blue-700 dark:text-blue-400">
                      <div className="flex justify-between">
                        <span>عدد اللوحات:</span>
                        <span className="font-medium">{selectedRoadSigns.length} لوحة</span>
                      </div>
                      <div className="flex justify-between">
                        <span>نوع التصميم الجديد:</span>
                        <span className="font-medium">{selectedPrintingTypeDetails?.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>تكلفة التصميم:</span>
                        <span className="font-medium">{selectedPrintingTypeDetails?.price?.toLocaleString()} ل.س</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between">
                          <span>الخصم:</span>
                          <span className="font-medium text-red-600">
                            {discount}{discountType === "percentage" ? '%' : '$'}
                          </span>
                        </div>
                      )}
                      {designPriceInfo && (
                        <div className="pt-2 mt-2 border-t border-blue-200 dark:border-blue-700">
                          <div className="flex justify-between font-semibold">
                            <span>السعر الإجمالي:</span>
                            <span className="text-green-600">
                              {designPriceInfo.totalPrice?.toLocaleString()} $
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const InfoField = ({ label, value }) => (
  <div>
    <span className="font-medium text-gray-600 dark:text-gray-400">{label}:</span>
    <span className="text-gray-800 dark:text-white mr-2">{value}</span>
  </div>
);

export default ExtendBooking;