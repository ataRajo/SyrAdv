import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Calendar , ArrowLeftRight } from 'lucide-react';
import { ReplaceSignDialog } from './ReplaceSignDialog';

const RoadSignItem = ({ sign, startDate, endDate, onReplace }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  return (
    <>
      <div className={`p-4 rounded-lg border transition-all ${
        sign.isAvailable 
          ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
          : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {sign.isAvailable ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="font-semibold">
                {sign.roadsign_code || `RS-${sign.id}`}
              </span>
   {sign.isReplaced && (
  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full flex items-center gap-1">
    <ArrowLeftRight className="h-3 w-3" />
    تم التبديل إلى: <strong>{sign.replacementData?.place || 'موقع غير محدد'}</strong>
  </span>
)}
              {!sign.isAvailable && !sign.isReplaced && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                  غير متاحة
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-sm text-gray-600 dark:text-gray-400">
              <p>📍 {sign.place || 'موقع غير محدد'}</p>
              <p>🏙️ {sign.city?.name || 'مدينة غير محددة'}</p>
              <p>📐 المقاس: {sign.template?.size || 'غير محدد'}</p>
              <p>🚦 النوع: {sign.template?.model || 'غير محدد'}</p>
            </div>
            
            {!sign.isAvailable && !sign.isReplaced && sign.conflictBookings?.length > 0 && (
              <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>
                  محجوزة: {sign.conflictBookings[0]?.pivot?.start_date} إلى {sign.conflictBookings[0]?.pivot?.end_date}
                  {sign.conflictBookings[0]?.customer?.company_name && ` (${sign.conflictBookings[0].customer.company_name})`}
                </span>
              </div>
            )}
          </div>
          
          {!sign.isAvailable && !sign.isReplaced && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setDialogOpen(true)}
              className="text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              <RefreshCw className="h-4 w-4 ml-1" />
              تبديل اللوحة
            </Button>
          )}
        </div>
      </div>
      
      <ReplaceSignDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        oldSign={sign}
        startDate={startDate}
        endDate={endDate}
        onReplace={onReplace}
      />
    </>
  );
};

export const RoadSignsList = ({ roadSigns, startDate, endDate, onReplaceSign }) => {
  if (roadSigns.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        لا توجد لوحات لعرضها
      </div>
    );
  }
  
  const availableCount = roadSigns.filter(s => s.isAvailable).length;
  const unavailableCount = roadSigns.length - availableCount;
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h3 className="font-semibold text-lg">اللوحات الإعلانية</h3>
        <div className="flex gap-3 text-sm">
          <span className="text-green-600">✅ متاحة: {availableCount}</span>
          <span className="text-red-600">❌ غير متاحة: {unavailableCount}</span>
        </div>
      </div>
      
      <div className="space-y-3">
        {roadSigns.map((sign) => (
          <RoadSignItem
            key={sign.id}
            sign={sign}
            startDate={startDate}
            endDate={endDate}
            onReplace={onReplaceSign}
          />
        ))}
      </div>
    </div>
  );
};