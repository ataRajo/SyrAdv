import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";
import { Navigation } from "lucide-react";

const BookingInfoCard = ({
  booking,
  selectedRoadSigns,
  pendingMoves,
  getPendingMoveForSign,
  onToggleRoadSign,
  onSelectAll,
  onDeselectAll,
  onOpenMoveDialog
}) => {
  const allSelected = selectedRoadSigns.length === booking.roadsigns?.length;
  const noneSelected = selectedRoadSigns.length === 0;

  return (
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
                  onClick={onSelectAll}
                  disabled={allSelected}
                  className="h-9 px-3 text-xs border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/30"
                >
                  <Icon icon="mdi:check-all" className="ml-1 text-green-600 dark:text-green-400" />
                  تحديد الكل
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDeselectAll}
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
              const pendingMove = getPendingMoveForSign(sign.id);
              
              return (
                <RoadSignCard 
                  key={sign.id}
                  sign={sign}
                  index={index}
                  isSelected={isSelected}
                  pendingMove={pendingMove}
                  onToggle={() => onToggleRoadSign(sign.id)}
                  onOpenMoveDialog={() => onOpenMoveDialog(sign.id)}
                />
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const RoadSignCard = ({ sign, index, isSelected, pendingMove, onToggle, onOpenMoveDialog }) => {
  return (
    <div 
      className={`group p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer hover:scale-[1.01] hover:shadow-lg relative overflow-hidden ${
        isSelected 
          ? pendingMove
            ? 'border-purple-400 dark:border-purple-600 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20'
            : 'border-green-400 dark:border-green-600 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20'
          : 'border-gray-300 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/40 dark:to-gray-900/40'
      }`}
      onClick={onToggle}
    >
      {pendingMove && (
        <div className="absolute top-2 left-2">
          <Badge className="bg-purple-600 text-white text-xs animate-pulse">
            <Navigation className="w-3 h-3 inline mr-1" />
            للنقل
          </Badge>
        </div>
      )}
      
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              isSelected 
                ? pendingMove
                  ? 'bg-purple-100 dark:bg-purple-900/50'
                  : 'bg-green-100 dark:bg-green-900/50'
                : 'bg-gray-100 dark:bg-gray-800'
            }`}>
              <Icon 
                icon="mdi:sign-real-estate" 
                className={`text-lg ${
                  isSelected 
                    ? pendingMove
                      ? 'text-purple-600 dark:text-purple-400'
                      : 'text-green-600 dark:text-green-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-bold text-lg text-gray-900 dark:text-gray-100">
                  {sign.place}
                </p>
                <Badge variant="outline" className="text-xs">
                  لوحة #{index + 1}
                </Badge>
                
                {pendingMove && (
                  <div className="flex items-center gap-1 text-sm text-purple-700">
                    <Navigation className="w-3 h-3" />
                    <span className="font-medium">
                      → {pendingMove.newSignData.place}
                    </span>
                  </div>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 ml-2 hover:bg-blue-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenMoveDialog();
                  }}
                >
                  <Navigation className="w-4 h-4 text-blue-500" />
                </Button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {sign.directions}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-3 ml-4">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className={`p-3 rounded-full transition-all duration-300 hover:scale-110 ${
              isSelected 
                ? pendingMove
                  ? 'bg-purple-500 hover:bg-purple-600 shadow-lg shadow-purple-200'
                  : 'bg-green-500 hover:bg-green-600 shadow-lg shadow-green-200'
                : 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200'
            }`}
          >
            <Icon 
              icon={isSelected ? "mdi:check-bold" : "mdi:close-thick"} 
              className="text-xl text-white"
            />
          </button>
          
          <Badge className={
            isSelected 
              ? pendingMove
                ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-red-100 text-red-700 hover:bg-red-200'
          }>
            {isSelected 
              ? pendingMove ? 'للنقل' : 'محددة' 
              : 'غير محددة'}
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default BookingInfoCard;