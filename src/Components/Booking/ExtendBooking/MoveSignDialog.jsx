import React, { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Search,
  X,
  Navigation,
  CheckCircle,
  AlertTriangle,
  MapPin
} from "lucide-react";
import { showToast } from "../../../utils/Notifictions/showToast";

const MoveSignDialog = ({
  isOpen,
  onClose,
  booking,
  selectedRoadSigns,
  allRoadSigns,
  isRoadSignsFetching,
  currentMoveSignId,
  setCurrentMoveSignId,
  onAddMove,
  pendingMoves
}) => {
  const [newRoadSignId, setNewRoadSignId] = useState("");
  const [availableRoadSigns, setAvailableRoadSigns] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSignDetails, setSelectedSignDetails] = useState(null);

  useEffect(() => {
    if (isOpen && currentMoveSignId && booking?.roadsigns) {
      const signDetails = booking.roadsigns.find(sign => sign.id == currentMoveSignId);
      setSelectedSignDetails(signDetails || null);
      
      if (signDetails && allRoadSigns) {
        const currentTemplateId = signDetails.template?.id;
        const currentSize = signDetails.size || 
                           (signDetails.width && signDetails.height ? 
                            `${signDetails.width}×${signDetails.height}` : null);

        const filtered = allRoadSigns.filter(sign => {
          if (!sign) return false;
          if (sign.id == currentMoveSignId) return false;
          
          if (!sign.template || sign.template.id !== currentTemplateId) {
            return false;
          }
          
          if (currentSize) {
            const signSize = sign.size || 
                            (sign.width && sign.height ? 
                             `${sign.width}×${sign.height}` : null);
            if (signSize !== currentSize) return false;
          }
          
          const hasAnyBookings = sign.bookings && Array.isArray(sign.bookings) && sign.bookings.length > 0;
          
          if (!hasAnyBookings) {
            return true;
          }
          
          if (hasAnyBookings) {
            const hasActiveBookings = sign.bookings.some(booking => 
              booking.status === 1 || 
              booking.status === "approved" ||
              booking.status === "active" ||
              booking.status === "confirmed"
            );
            return !hasActiveBookings;
          }
          
          return false;
        });
        
        setAvailableRoadSigns(filtered || []);
      }
    } else {
      setSelectedSignDetails(null);
      setAvailableRoadSigns([]);
      setSearchTerm("");
      setNewRoadSignId("");
    }
  }, [isOpen, currentMoveSignId, booking?.roadsigns, allRoadSigns]);

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

  const getPendingMoveForSign = (signId) => {
    return pendingMoves.find(move => move.oldSignId == signId);
  };

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

  const handleAddPendingMove = () => {
    if (!currentMoveSignId || !newRoadSignId) {
      showToast("error", "يرجى اختيار اللوحة الحالية واللوحة الجديدة");
      return;
    }

    if (currentMoveSignId === newRoadSignId) {
      showToast("error", "يجب اختيار لوحة جديدة مختلفة عن اللوحة الحالية");
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

    onAddMove(currentMoveSignId, newRoadSignId, currentSign, newSign);
    showToast("success", "تمت إضافة حركة النقل للوحة (بانتظار التمديد)", { 
      icon: "⏳", 
      duration: 3000 
    });
    
    onClose();
  };

  const InfoField = ({ label, value }) => (
    <div>
      <span className="font-medium text-gray-600 dark:text-gray-400">{label}:</span>
      <span className="text-gray-800 dark:text-white mr-2">{value}</span>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <Navigation className="w-5 h-5" />
            إضافة حركة نقل للوحة
          </DialogTitle>
          <DialogDescription>
            اختر اللوحة التي تريد نقلها إلى موقع جديد (سيتم النقل عند تأكيد التمديد)
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="current-sign">اختر اللوحة المراد نقلها</Label>
            <Select
              value={currentMoveSignId}
              onValueChange={(value) => {
                setCurrentMoveSignId(value);
                setNewRoadSignId("");
                setSearchTerm("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر اللوحة الحالية" />
              </SelectTrigger>
              <SelectContent>
                {booking?.roadsigns?.map((sign) => {
                  const isSelected = selectedRoadSigns.includes(sign.id);
                  const hasPendingMove = getPendingMoveForSign(sign.id);
                  
                  return (
                    <SelectItem 
                      key={sign.id} 
                      value={sign.id.toString()}
                      disabled={!isSelected}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{sign.place || `اللوحة #${sign.id}`}</span>
                          {!isSelected && (
                            <Badge variant="outline" className="text-xs text-gray-500">
                              غير محددة
                            </Badge>
                          )}
                          {hasPendingMove && (
                            <Badge className="bg-purple-100 text-purple-700 text-xs">
                              <MapPin className="w-3 h-3 inline mr-1" />
                              مع نقل
                            </Badge>
                          )}
                        </div>
                        {!isSelected && (
                          <span className="text-xs text-red-500 mt-1">
                            يجب تحديد اللوحة أولاً في قائمة التمديد
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

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
                <InfoField label="الاتجاه" value={selectedSignDetails.directions || selectedSignDetails.direction || 'غير محدد'} />
                <InfoField label="الحالة" value={
                  <span className={`font-semibold ${hasActiveBookings ? 'text-green-600' : 'text-yellow-600'}`}>
                    {hasActiveBookings ? '✅ مؤهلة للنقل' : '⚠️ بدون حجز نشط'}
                  </span>
                } />
              </div>
            </div>
          )}

          {selectedSignDetails && hasActiveBookings && selectedRoadSigns.includes(parseInt(currentMoveSignId)) && (
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
                    <span>متاح {availableRoadSigns.length} لوحة</span>
                  )}
                </div>
              </div>
              
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
                        {filteredAvailableSigns.map((sign, index) => {
                          const existingMoveForNewSign = pendingMoves.find(move => 
                            move.newSignId == sign.id
                          );
                          
                          return (
                            <tr 
                              key={sign.id} 
                              className={`border-t hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                                newRoadSignId == sign.id ? 'bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-300' : ''
                              } ${
                                existingMoveForNewSign ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
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
                                <Badge variant="outline" className="text-green-700 border-green-300">
                                  {sign.template?.model || 'غير محدد'}
                                </Badge>
                              </td>
                              <td className="p-2">
                                <button
                                  onClick={() => {
                                    setNewRoadSignId(sign.id.toString());
                                  }}
                                  disabled={!!existingMoveForNewSign}
                                  className={`px-3 py-1 rounded text-xs transition-all ${
                                    newRoadSignId == sign.id 
                                      ? 'bg-blue-500 text-white shadow-md' 
                                      : existingMoveForNewSign
                                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 hover:shadow-sm'
                                  }`}
                                >
                                  {newRoadSignId == sign.id ? '✓ محددة' : 
                                   existingMoveForNewSign ? 'محجوزة لنقل آخر' : 'اختر'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
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
              
              {newRoadSignId && !isRoadSignsFetching && (
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800 animate-in fade-in">
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
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedSignDetails && !selectedRoadSigns.includes(parseInt(currentMoveSignId)) && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 font-semibold">
                    هذه اللوحة غير محددة للتمديد
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                    يجب تحديد اللوحة أولاً في قائمة اللوحات الممتدة لإضافة حركة نقل لها
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-3 mt-6">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1"
          >
            إلغاء
          </Button>
          <Button 
            onClick={handleAddPendingMove}
            disabled={!currentMoveSignId || !newRoadSignId || !selectedRoadSigns.includes(parseInt(currentMoveSignId))}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              إضافة حركة نقل
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MoveSignDialog;