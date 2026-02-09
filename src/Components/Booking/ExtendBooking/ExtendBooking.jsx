import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { 
  useGetOneBookingsQuery,
  useCalculateReservationMutation,
  useExtendBookingMutation
} from "../../../RtkQuery/Slice/Booking/BookingApi";
import { showToast } from "../../../utils/Notifictions/showToast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@iconify/react";
import { Card } from "@/components/ui/card";
import useGetRoadSignsByFilter from "../../../hooks/useGetRoadSignsByFilter";

import BookingInfoCard from "./BookingInfoCard";
import ExtendBookingForm from "./ExtendBookingForm";
import PendingMovesBanner from "./PendingMovesBanner";
import HeaderActions from "./HeaderActions";
import MoveSignDialog from "./MoveSignDialog"; // Import MoveSignDialog
import axios from "axios";
import { BASE_URL } from "../../../Api/baseUrl";

export const fetchPrintingTypes = async () => {
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
  const { data: booking, isLoading, error } = useGetOneBookingsQuery(id);
  const [calculateReservation] = useCalculateReservationMutation();
  const [extendBooking, { isLoading: isExtending }] = useExtendBookingMutation();
  
  // Add these 2 states for move dialog
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [currentMoveSignId, setCurrentMoveSignId] = useState(null);
  
  // Existing states
  const [newEndDate, setNewEndDate] = useState("");
  const [calculatedAmount, setCalculatedAmount] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState("percentage");
  const [selectedRoadSigns, setSelectedRoadSigns] = useState([]);
  const [pendingMoves, setPendingMoves] = useState([]);
  const [originalPriceDetails, setOriginalPriceDetails] = useState(null);
  
  const [useNewDesign, setUseNewDesign] = useState(false);
  const [selectedPrintingType, setSelectedPrintingType] = useState(null);
  const [designPriceInfo, setDesignPriceInfo] = useState(null);
  const [printingTypes, setPrintingTypes] = useState([]);
  const [isFetchingPrintingTypes, setIsFetchingPrintingTypes] = useState(false);

  const {
    roadSigns: allRoadSigns,
    isRoadSignsFetching,
  } = useGetRoadSignsByFilter();

  useEffect(() => {
    if (booking?.end_date) {
      setNewEndDate(booking.end_date.split('T')[0]);
    }
    if (booking?.roadsigns) {
      setSelectedRoadSigns(booking.roadsigns.map(sign => sign.id));
    }
  }, [booking]);

  // Add this function for opening move dialog
  const handleOpenMoveDialog = (signId) => {
    setCurrentMoveSignId(signId);
    setMoveDialogOpen(true);
  };

  useEffect(() => {
    const fetchPrintTypes = async () => {
      if (useNewDesign) {
        setIsFetchingPrintingTypes(true);
        try {
          const types = await fetchPrintingTypes();
          setPrintingTypes(types);
          if (types.length > 0 && !selectedPrintingType) {
            setSelectedPrintingType(types[0].id);
          }
        } catch (error) {
          console.error("Failed to fetch printing types:", error);
          showToast("error", "فشل في تحميل أنواع الطباعة");
          setPrintingTypes([]);
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

          const signsWithPendingMoves = booking.roadsigns.filter(sign => 
            selectedRoadSigns.includes(sign.id)
          ).map(sign => {
            const pendingMove = pendingMoves.find(move => move.oldSignId == sign.id);
            return {
              ...sign,
              id: pendingMove ? pendingMove.newSignId : sign.id,
              originalId: sign.id
            };
          });

          const calculateData = {
            start_date: startDateStr,
            end_date: endDateStr,
            roadsigns: signsWithPendingMoves.map(sign => ({
              road_sign_id: sign.originalId,
              booking_faces: sign.pivot.booking_faces,
              number_of_reserved_panels: sign.pivot.number_of_reserved_panels,
              start_date: startDateStr,
              end_date: endDateStr
            })),
            product_type: booking.product_type,
            printing_id: selectedPrintingType,
            is_extend: false,
            include_design_cost: true
          };

          const result = await calculateReservation(calculateData).unwrap();
          
          if (result?.amount?.total_price) {
            setOriginalPriceDetails(result.amount);
            setDesignPriceInfo({
              printingCost: result.amount.printing_cost || 0,
              originalPrice: result.amount.original_price || result.amount.total_price,
              totalPrice: result.amount.total_price
            });
          }
        } catch (error) {
          console.error("Error calculating design price:", error);
          setDesignPriceInfo(null);
          setOriginalPriceDetails(null);
        }
      };
      
      calculateDesignPrice();
    }
  }, [useNewDesign, selectedPrintingType, newEndDate, selectedRoadSigns, booking, pendingMoves]);

  const getPendingMoveForSign = (signId) => {
    return pendingMoves.find(move => move.oldSignId == signId);
  };

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
      setOriginalPriceDetails(null);
      
      if (!newSelected.includes(signId)) {
        const pendingMove = getPendingMoveForSign(signId);
        if (pendingMove) {
          setPendingMoves(prev => prev.filter(move => move.oldSignId !== signId));
          showToast("info", "تم إزالة حركة النقل للوحة", { icon: "🔄", duration: 1500 });
        }
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
      setOriginalPriceDetails(null);
    }
  };

  const handleDeselectAll = () => {
    setSelectedRoadSigns([]);
    setPendingMoves([]);
    
    if (calculatedAmount) {
      setCalculatedAmount(null);
      setDiscount(0);
    }
    if (designPriceInfo) {
      setDesignPriceInfo(null);
    }
    setOriginalPriceDetails(null);
  };

  const calculateFinalPrice = () => {
    if (!originalPriceDetails) return 0;
    
    const advertisingPrice = originalPriceDetails.total_advertising_price || 0;
    const printingPrice = originalPriceDetails.total_printing_price || 0;
    
    let finalAdvertisingPrice = advertisingPrice;
    
    if (discount > 0) {
      if (discountType === "percentage") {
        finalAdvertisingPrice = advertisingPrice * (1 - discount / 100);
      } else {
        finalAdvertisingPrice = advertisingPrice - discount;
      }
    }
    
    return Math.max(0, finalAdvertisingPrice + printingPrice);
  };

  const handleRemovePendingMove = (oldSignId) => {
    setPendingMoves(prev => prev.filter(move => move.oldSignId !== oldSignId));
    showToast("info", "تم إلغاء حركة النقل للوحة", { icon: "❌", duration: 2000 });
    
    setCalculatedAmount(null);
    setDesignPriceInfo(null);
    setOriginalPriceDetails(null);
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

      const signsWithPendingMoves = booking.roadsigns.filter(sign => 
        selectedRoadSigns.includes(sign.id)
      ).map(sign => {
        const pendingMove = pendingMoves.find(move => move.oldSignId == sign.id);
        return {
          ...sign,
          pendingMove: pendingMove || null
        };
      });

      const calculateData = {
        start_date: startDateStr,
        end_date: endDateStr,
        roadsigns: signsWithPendingMoves.map(sign => ({
          road_sign_id: sign.pendingMove?.newSignId || sign.id,
          booking_faces: sign.pivot.booking_faces,
          number_of_reserved_panels: sign.pivot.number_of_reserved_panels,
          start_date: startDateStr,
          end_date: endDateStr
        })),
        product_type: booking.product_type,
        printing_id: useNewDesign ? selectedPrintingType : booking.printing_id,
        is_extend: !useNewDesign,
        include_design_cost: useNewDesign,
        pending_moves: pendingMoves.length > 0 ? pendingMoves.map(move => ({
          old_roadsign_id: move.oldSignId,
          new_roadsign_id: move.newSignId
        })) : null
      };

      const result = await calculateReservation(calculateData).unwrap();
      
      const amount = result?.amount?.total_price;
      setCalculatedAmount(amount);
      setOriginalPriceDetails(result?.amount || {});
      
      if (useNewDesign && result?.amount) {
        setDesignPriceInfo({
          printingCost: result.amount.printing_cost || 0,
          originalPrice: result.amount.original_price || amount,
          totalPrice: amount
        });
      }
      
      showToast("success", `💰 تم حساب السعر الجديد: ${amount?.toLocaleString()} $`, {
        duration: 4000,
        richColors: true
      });
      
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
      const finalPrice = calculateFinalPrice();

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
        roadsigns: booking.roadsigns
          .filter(sign => selectedRoadSigns.includes(sign.id))
          .map(sign => {
            const pendingMove = pendingMoves.find(move => move.oldSignId == sign.id);
            return {
              road_sign_id: pendingMove ? pendingMove.newSignId : sign.id,
              booking_faces: sign.pivot.booking_faces,
              number_of_reserved_panels: sign.pivot.number_of_reserved_panels,
              start_date: startDateStr,
              end_date: endDateStr,
              original_road_sign_id: pendingMove ? sign.id : null
            };
          }),
        product_type: booking.product_type,
        printing_id: useNewDesign ? selectedPrintingType : booking.printing_id,
        is_extend: !useNewDesign,
        total_price: finalPrice,
        ...(discount > 0 && { 
          discount_type: discountType === "percentage" ? 2 : 1,
          value: discount
        }),
        include_design_cost: useNewDesign,
        moves: pendingMoves.length > 0 ? pendingMoves.map(move => ({
          old_roadsign_id: move.oldSignId,
          new_roadsign_id: move.newSignId
        })) : null
      };

      await extendBooking({ id, ...extendData }).unwrap();
      
      let successMsg = useNewDesign 
        ? `✅ تم تمديد الحجز ${selectedRoadSigns.length} لوحة مع تصميم جديد`
        : `✅ تم تمديد الحجز ${selectedRoadSigns.length} لوحة`;
      
      if (pendingMoves.length > 0) {
        successMsg += ` (تم نقل ${pendingMoves.length} لوحة)`;
      }
      
      if (discount > 0) {
        successMsg += ` مع خصم ${discount}${discountType === "percentage" ? '%' : '$'}`;
      }
      
      successMsg += " بنجاح";
      
      showToast("success", successMsg, {
        duration: 5000,
        richColors: true
      });
      
      setTimeout(() => {
        navigate("/dashboard/bookings", {
          state: {
            showSuccess: true,
            extendedBookingId: id,
            movedSigns: pendingMoves.length,
            message: successMsg
          }
        });
      }, 1500);
      
    } catch (error) {
      console.error("Extend booking error:", error);
      
      let errorMessage = error.data?.message || "حدث خطأ أثناء تمديد الحجز";
      
      if (error.data?.unavailable && Array.isArray(error.data.unavailable)) {
        const unavailableItems = error.data.unavailable;
        
        const unavailableDetails = [];
        
        unavailableItems.forEach(item => {
          const roadSignId = item.road_sign_id;
          const roadSign = booking.roadsigns.find(sign => sign.id == roadSignId);
          
          if (roadSign) {
            unavailableDetails.push({
              id: roadSignId,
              place: roadSign.place || `اللوحة #${roadSignId}`,
              code: roadSign.roadsign_code || `RS-${roadSignId}`,
              template: roadSign.template?.model || "غير محدد",
              directions: roadSign.directions || roadSign.direction || "غير محدد",
            });
          } else {
            unavailableDetails.push({
              id: roadSignId,
              place: `اللوحة #${roadSignId}`,
              code: `ID: ${roadSignId}`,
              template: "غير معروف",
              directions: "غير معروف",
            });
          }
        });
        
        if (unavailableDetails.length > 0) {
          let detailedMessage = `
            <div style="text-align: right; font-family: 'Cairo', Arial, sans-serif; direction: rtl;">
              <h3 style="color: #dc2626; margin-bottom: 15px; border-bottom: 2px solid #dc2626; padding-bottom: 5px;">
                ⚠️ بعض اللوحات غير متاحة للتمديد
              </h3>
              
              <p style="color: #4b5563; margin-bottom: 15px; font-size: 14px;">
                اللوحات التالية محجوزة في الفترة المطلوبة ولا يمكن تمديدها:
              </p>
              
              <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
          `;
          
          unavailableDetails.forEach((sign, index) => {
            detailedMessage += `
              <div style="background: white; border: 2px solid #fca5a5; border-radius: 6px; padding: 10px; margin-bottom: 8px; ${index > 0 ? 'margin-top: 8px;' : ''}">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-weight: bold; color: #dc2626; font-size: 15px;">
                      ${sign.place}
                    </div>
                    <div style="color: #6b7280; font-size: 12px; margin-top: 3px;">
                      <span>🔢 الكود: ${sign.code}</span>
                      <span style="margin-right: 10px;"> | </span>
                      <span>📐 النموذج: ${sign.template}</span>
                      <span style="margin-right: 10px;"> | </span>
                      <span>🧭 الاتجاه: ${sign.directions}</span>
                    </div>
                  </div>
                  <div style="background: #dc2626; color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: bold;">
                    ❌ محجوز
                  </div>
                </div>
              </div>
            `;
          });
          
          detailedMessage += `
              </div>
              
              <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 12px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span style="font-size: 20px;">ℹ️</span>
                  <div>
                    <p style="color: #92400e; font-weight: 600; margin: 0; font-size: 13px;">ما يجب فعله:</p>
                    <p style="color: #92400e; margin: 5px 0 0 0; font-size: 12px;">
                      قم بإلغاء تحديد اللوحات المحجوزة أعلاه للمتابعة بالتمديد
                    </p>
                  </div>
                </div>
              </div>
            </div>
          `;
          
          const modal = document.createElement('div');
          modal.style.position = 'fixed';
          modal.style.top = '0';
          modal.style.left = '0';
          modal.style.width = '100%';
          modal.style.height = '100%';
          modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
          modal.style.display = 'flex';
          modal.style.justifyContent = 'center';
          modal.style.alignItems = 'center';
          modal.style.zIndex = '9999';
          
          const modalContent = document.createElement('div');
          modalContent.style.backgroundColor = 'white';
          modalContent.style.borderRadius = '12px';
          modalContent.style.padding = '25px';
          modalContent.style.maxWidth = '90%';
          modalContent.style.maxHeight = '80%';
          modalContent.style.width = '600px';
          modalContent.style.overflowY = 'auto';
          modalContent.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.2)';
          modalContent.innerHTML = detailedMessage;
          
          const closeButton = document.createElement('button');
          closeButton.innerHTML = '✕';
          closeButton.style.position = 'absolute';
          closeButton.style.top = '15px';
          closeButton.style.left = '15px';
          closeButton.style.background = 'none';
          closeButton.style.border = 'none';
          closeButton.style.fontSize = '20px';
          closeButton.style.cursor = 'pointer';
          closeButton.style.color = '#6b7280';
          closeButton.style.padding = '5px 10px';
          closeButton.style.borderRadius = '50%';
          closeButton.onclick = () => document.body.removeChild(modal);
          closeButton.onmouseover = () => closeButton.style.backgroundColor = '#f3f4f6';
          closeButton.onmouseout = () => closeButton.style.backgroundColor = 'transparent';
          
          modalContent.appendChild(closeButton);
          modal.appendChild(modalContent);
          document.body.appendChild(modal);
          
          modal.onclick = (e) => {
            if (e.target === modal) {
              document.body.removeChild(modal);
            }
          };
          
          showToast("error", "بعض اللوحات غير متاحة للتمديد. عرض التفاصيل...");
          
          return;
        }
      }
      
      showToast("error", errorMessage);
      
      console.warn("Extend API error details:", {
        message: error.data?.message,
        unavailable: error.data?.unavailable,
        error
      });
    }
  };

  const onAddMove = (oldSignId, newSignId, oldSignData, newSignData) => {
    const existingMoveIndex = pendingMoves.findIndex(move => move.oldSignId == oldSignId);
    
    if (existingMoveIndex !== -1) {
      const updatedMoves = [...pendingMoves];
      updatedMoves[existingMoveIndex] = {
        oldSignId,
        newSignId,
        oldSignData,
        newSignData,
        timestamp: new Date().toISOString()
      };
      setPendingMoves(updatedMoves);
      showToast("info", "تم تحديث حركة النقل للوحة", { icon: "🔄", duration: 2000 });
    } else {
      setPendingMoves(prev => [...prev, {
        oldSignId,
        newSignId,
        oldSignData,
        newSignData,
        timestamp: new Date().toISOString()
      }]);
      showToast("success", "تمت إضافة حركة النقل للوحة (بانتظار التمديد)", { 
        icon: "⏳", 
        duration: 3000 
      });
    }
    
    setCalculatedAmount(null);
    setDesignPriceInfo(null);
    setOriginalPriceDetails(null);
  };

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* ADD MoveSignDialog component here */}
      <MoveSignDialog
        isOpen={moveDialogOpen}
        onClose={() => {
          setMoveDialogOpen(false);
          setCurrentMoveSignId(null);
        }}
        booking={booking}
        selectedRoadSigns={selectedRoadSigns}
        allRoadSigns={allRoadSigns}
        isRoadSignsFetching={isRoadSignsFetching}
        currentMoveSignId={currentMoveSignId}
        setCurrentMoveSignId={setCurrentMoveSignId}
        onAddMove={onAddMove}
        pendingMoves={pendingMoves}
      />

      <PendingMovesBanner 
        pendingMoves={pendingMoves}
        onClearAll={() => setPendingMoves([])}
        onRemoveMove={handleRemovePendingMove}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon icon="mdi:calendar-plus" className="text-2xl text-orange-500" />
          <h1 className="text-2xl font-bold">تمديد الحجز #{booking.id}</h1>
        </div>
        
        <HeaderActions 
          booking={booking}
          selectedRoadSigns={selectedRoadSigns}
          pendingMoves={pendingMoves}
          allRoadSigns={allRoadSigns}
          isRoadSignsFetching={isRoadSignsFetching}
          onMoveSign={onAddMove}
          onNavigateBack={() => navigate("/dashboard/bookings")}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BookingInfoCard 
          booking={booking}
          selectedRoadSigns={selectedRoadSigns}
          pendingMoves={pendingMoves}
          getPendingMoveForSign={getPendingMoveForSign}
          onToggleRoadSign={handleToggleRoadSign}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onOpenMoveDialog={handleOpenMoveDialog} // Pass the function here
        />

        <ExtendBookingForm 
          booking={booking}
          newEndDate={newEndDate}
          setNewEndDate={setNewEndDate}
          useNewDesign={useNewDesign}
          setUseNewDesign={setUseNewDesign}
          selectedPrintingType={selectedPrintingType}
          setSelectedPrintingType={setSelectedPrintingType}
          printingTypes={printingTypes}
          isFetchingPrintingTypes={isFetchingPrintingTypes}
          designPriceInfo={designPriceInfo}
          selectedRoadSigns={selectedRoadSigns}
          calculatedAmount={calculatedAmount}
          discount={discount}
          setDiscount={setDiscount}
          discountType={discountType}
          setDiscountType={setDiscountType}
          onCalculatePrice={handleCalculatePrice}
          onExtendBooking={handleExtendBooking}
          calculateFinalPrice={calculateFinalPrice}
          isExtending={isExtending}
          originalPriceDetails={originalPriceDetails}
        />
      </div>
    </div>
  );
};

export default ExtendBooking;