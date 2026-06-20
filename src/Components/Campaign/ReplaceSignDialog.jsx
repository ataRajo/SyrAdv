import React, { useState, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { useGetRoadSignsQuery } from '../../RtkQuery/Slice/RoadSings/RoadSingsApi';

export const ReplaceSignDialog = ({ isOpen, onClose, oldSign, startDate, endDate, onReplace }) => {
  const [selectedSignId, setSelectedSignId] = useState('');
  const [selectedSignData, setSelectedSignData] = useState(null);
  
  // Use your existing API to fetch available signs with same template size
  const { data, isLoading } = useGetRoadSignsQuery(
    {
      template_size: oldSign?.template?.size,
      start_date: startDate,
      end_date: endDate,
    },
    { skip: !isOpen || !oldSign?.template?.size }
  );
  
  const availableSigns = useMemo(() => {
    if (!data?.data || !oldSign) return [];
    
    return data.data.filter(sign => {
      if (sign.id === oldSign.id) return false;
      
      // Check if sign has any bookings in the selected date range
      const hasConflict = sign.bookings && sign.bookings.length > 0;
      return !hasConflict;
    });
  }, [data, oldSign]);
  
  const handleSignSelect = useCallback((e) => {
    const signId = parseInt(e.target.value);
    setSelectedSignId(signId);
    const selected = availableSigns.find(s => s.id === signId);
    setSelectedSignData(selected);
  }, [availableSigns]);
  
  const handleConfirm = useCallback(() => {
    if (selectedSignId && selectedSignData) {
      onReplace(oldSign.id, selectedSignId, selectedSignData);
      onClose();
      setSelectedSignId('');
      setSelectedSignData(null);
    }
  }, [selectedSignId, selectedSignData, onReplace, oldSign.id, onClose]);
  
  const handleClose = useCallback(() => {
    onClose();
    setSelectedSignId('');
    setSelectedSignData(null);
  }, [onClose]);
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="rtl w-[95vw] max-w-[500px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            🔄 تبديل اللوحة
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Current Sign - Red background (unavailable) */}
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-semibold mb-2 text-red-700">اللوحة الحالية (غير متاحة):</p>
            <p className="text-sm">{oldSign?.roadsign_code} | {oldSign?.place}</p>
            <p className="text-xs text-gray-500 mt-1">المقاس: {oldSign?.template?.size}</p>
            {oldSign?.conflictBookings?.length > 0 && (
              <div className="mt-2 text-xs text-red-600">
                <p>محجوزة من قبل: {oldSign.conflictBookings[0]?.customer?.company_name}</p>
                <p>التاريخ: {oldSign.conflictBookings[0]?.pivot?.start_date} إلى {oldSign.conflictBookings[0]?.pivot?.end_date}</p>
              </div>
            )}
          </div>
          
          {/* Available Signs */}
          <div className="space-y-3">
            <label className="text-sm font-bold">اختر لوحة بديلة متاحة:</label>
            
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : availableSigns.length > 0 ? (
              <select
                className="w-full border rounded-lg p-2 text-sm"
                value={selectedSignId}
                onChange={handleSignSelect}
              >
                <option value="">-- اختر لوحة --</option>
                {availableSigns.map(sign => (
                  <option key={sign.id} value={sign.id}>
                    {sign.roadsign_code} | {sign.place} | {sign.city?.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-sm">لا توجد لوحات متاحة بنفس المقاس</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Selected Sign Preview */}
          {selectedSignData && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-semibold text-green-700 mb-1">اللوحة البديلة:</p>
              <p className="text-sm">{selectedSignData.roadsign_code}</p>
              <p className="text-xs text-gray-600">📍 {selectedSignData.place}</p>
              <p className="text-xs text-gray-600">🏙️ {selectedSignData.city?.name}</p>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              إلغاء
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={!selectedSignId || !selectedSignData}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              تأكيد التبديل
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};