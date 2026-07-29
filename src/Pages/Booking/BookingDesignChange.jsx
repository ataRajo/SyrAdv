import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useGetOneBookingsQuery, useChangeAdvertisementDesignMutation } from "../../RtkQuery/Slice/Booking/BookingApi";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const BookingDesignChange = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { data: response, isLoading, error } = useGetOneBookingsQuery(id);
  const [changeDesign, { isLoading: isChanging }] = useChangeAdvertisementDesignMutation();
  
  const booking = response?.data || response;
  
  const [selectedRoadSigns, setSelectedRoadSigns] = useState([]);

  useEffect(() => {
    if (error) {
      toast.error("فشل في تحميل بيانات الحجز");
      navigate("/dashboard/bookings");
    }
  }, [error, navigate]);

  const toggleRoadSign = (roadSignId) => {
    setSelectedRoadSigns(prev => 
      prev.includes(roadSignId)
        ? prev.filter(rid => rid !== roadSignId)
        : [...prev, roadSignId]
    );
  };

  const handleSubmit = async () => {
    if (selectedRoadSigns.length === 0) {
      toast.error("يرجى اختيار لوحة واحدة على الأقل");
      return;
    }
    
    try {
      await changeDesign({ 
        id, 
        roadsignIds: selectedRoadSigns 
      }).unwrap();
      
      toast.success("تم تغيير التصميم بنجاح");
      navigate("/dashboard/bookings");
    } catch (err) {
      toast.error(err?.data?.message || "فشل في تغيير التصميم");
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 w-full mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/dashboard/bookings")}
          className="gap-2"
        >
          <Icon icon="mdi:arrow-right" />
          رجوع
        </Button>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
          <Icon icon="mdi:palette" className="text-indigo-500" />
          تغيير تصميم الحجز #{id}
        </h1>
      </div>

      {/* Booking Info Card */}
      <Card className="dark:bg-gray-900 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg dark:text-gray-200">معلومات الحجز</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">الشركة:</span>
              <p className="font-medium dark:text-gray-200">
                {booking?.customer?.company_name || "—"}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">العميل:</span>
              <p className="font-medium dark:text-gray-200">
                {booking?.customer?.full_name || "—"}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">من:</span>
              <p className="font-medium dark:text-gray-200">
                {booking?.start_date || "—"}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">إلى:</span>
              <p className="font-medium dark:text-gray-200">
                {booking?.end_date || "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Road Signs Selection */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold dark:text-gray-200 flex items-center gap-2">
          <Icon icon="mdi:sign-real-estate" className="text-indigo-500" />
          اختر اللوحات لتغيير التصميم ({booking?.roadsigns?.length || 0})
        </h2>

        {booking?.roadsigns?.map((sign) => {
          const isSelected = selectedRoadSigns.includes(sign.id);
          
          return (
            <Card 
              key={sign.id} 
              className={`dark:bg-gray-900 dark:border-gray-700 cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-indigo-500 border-indigo-500' : ''
              }`}
              onClick={() => toggleRoadSign(sign.id)}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      isSelected 
                        ? 'bg-indigo-500 border-indigo-500' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {isSelected && <Icon icon="mdi:check" className="text-white text-sm" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg dark:text-gray-200 flex items-center gap-2">
                        <Icon icon="mdi:map-marker" className="text-red-500" />
                        {sign.place}
                      </h3>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                          {sign.template?.model}
                        </Badge>
                        <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                          {sign.template?.type}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className="dark:border-gray-600"
                          style={{ borderColor: sign.template?.color, color: sign.template?.color }}
                        >
                          <span 
                            className="w-3 h-3 rounded-full inline-block ml-1" 
                            style={{ backgroundColor: sign.template?.color }}
                          />
                          اللون
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-left">
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                      {sign.roadsign_code}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                    <span className="text-gray-500 dark:text-gray-400 block">الحجم</span>
                    <span className="font-medium dark:text-gray-200">{sign.template?.size || "—"}</span>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                    <span className="text-gray-500 dark:text-gray-400 block">السعر</span>
                    <span className="font-medium dark:text-gray-200">{sign.pivot?.face_price} $</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-3 pt-4 sticky bottom-0 bg-white dark:bg-gray-900 p-4 border-t dark:border-gray-700">
        <Button
          onClick={handleSubmit}
          disabled={isChanging || selectedRoadSigns.length === 0}
          className="gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        >
          {isChanging ? (
            <Icon icon="mdi:loading" className="animate-spin" />
          ) : (
            <Icon icon="mdi:check" />
          )}
          تغيير التصميم ({selectedRoadSigns.length})
        </Button>
        
        <Button
          variant="outline"
          onClick={() => navigate("/dashboard/bookings")}
          className="gap-2"
        >
          <Icon icon="mdi:close" />
          إلغاء
        </Button>
      </div>
    </div>
  );
};

export default BookingDesignChange;