import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Copy, Loader2, Calendar, User, Printer, Package, AlertCircle } from 'lucide-react';
import { useSimilarCampaign } from '../../hooks/useSimilarCampaign';
import { RoadSignsList } from './RoadSignsList';
import { productTypeOptions } from '../../Static/StaticData';
import axios from 'axios';
import { BASE_URL } from '../../Api/baseUrl';

export const CreateSimilarCampaign = ({ booking ,  printTypes ,loadingPrintTypes}) => {
  const [open, setOpen] = useState(false);
  
  const {
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
    isLoading,
    isLoadingCustomers,
    customers,
    setStartDate,
    setEndDate,
    setCustomerId,
    setPrintingId,
    setProductType,
    handleApplyDates,
    handleReplaceSign,
    handleSubmit,
    handleReset,
  } = useSimilarCampaign(booking);
  
  const handleDialogChange = (newOpen) => {
    setOpen(newOpen);
    if (!newOpen) {
      handleReset();
    }
  };
  
  const onSubmit = async () => {
    const success = await handleSubmit();
    if (success) {
      setOpen(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-blue-600 border-blue-200">
          <Copy className="h-4 w-4 ml-1" />
          إنشاء حملة مماثلة
        </Button>
      </DialogTrigger>
      
      <DialogContent className="rtl w-[95vw] max-w-[800px] max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5 text-blue-500" />
            إنشاء حملة مماثلة - الحملة رقم {booking.id}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Form Fields */}
          <div className="space-y-4">
            <h3 className="font-semibold border-b pb-2">معلومات الحملة الجديدة</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  تاريخ البداية *
                </label>
                <input
                  type="date"
                  className="w-full border rounded-lg p-2 text-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              {/* End Date */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  تاريخ النهاية *
                </label>
                <input
                  type="date"
                  className="w-full border rounded-lg p-2 text-sm"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || new Date().toISOString().split('T')[0]}
                />
              </div>
              
              {/* Customer */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <User className="h-4 w-4 text-orange-500" />
                  اختيار العميل *
                </label>
<select
  className="w-full border rounded-lg p-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  value={customerId}
  onChange={(e) => setCustomerId(e.target.value)}
  disabled={isLoadingCustomers}
>
                  <option value="">-- اختر عميل --</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.company_name || customer.full_name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Product Type */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <Package className="h-4 w-4 text-orange-500" />
                  نوع المنتج *
                </label>
               <select
  className="w-full border rounded-lg p-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  value={productType}
  onChange={(e) => setProductType(e.target.value)}
>
                  <option value="">-- اختر نوع المنتج --</option>
                  {productTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Printing Type */}
              <div className="space-y-2 md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <Printer className="h-4 w-4 text-orange-500" />
                  نوع الطباعة *
                </label>
            <select
  className="w-full border rounded-lg p-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  value={printingId}
  onChange={(e) => setPrintingId(e.target.value)}
  disabled={loadingPrintTypes}
>
                  <option value="">-- اختر نوع الطباعة --</option>
                  {printTypes.map(print => (
                    <option key={print.id} value={print.id}>
                      {print.type} - {parseFloat(print.price).toLocaleString()} ل.س
                    </option>
                  ))}
                </select>
                {loadingPrintTypes && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    جاري تحميل أنواع الطباعة...
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Original Campaign Info */}
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm font-semibold mb-2">عدد اللوحات في الحملة الأصلية: {booking.roadsigns?.length || 0}</p>
            <div className="text-xs text-gray-500">
              {booking.roadsigns?.map(s => s.roadsign_code).join(', ')}
            </div>
            {booking.printing_id && (
              <p className="text-xs text-gray-500 mt-2">
                نوع الطباعة الأصلي: {booking.printing_id}
              </p>
            )}
            {booking.product_type && (
              <p className="text-xs text-gray-500 mt-1">
                نوع المنتج الأصلي: {productTypeOptions.find(p => p.value === booking.product_type)?.label || booking.product_type}
              </p>
            )}
          </div>
          
          {/* Apply Button */}
          {startDate && endDate && !showRoadSigns && (
            <Button onClick={handleApplyDates} className="w-full bg-blue-600 hover:bg-blue-700">
              تطبيق التاريخ والتحقق من توفر اللوحات
            </Button>
          )}
          
          {/* Loading */}
          {showRoadSigns && isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          )}
          
          {/* Road Signs List */}
          {showRoadSigns && !isLoading && (
            <RoadSignsList
              roadSigns={roadSigns}
              startDate={startDate}
              endDate={endDate}
              onReplaceSign={handleReplaceSign}
            />
          )}
          
          {/* Validation Message */}
          {showRoadSigns && !isLoading && !allSignsAvailable && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <p className="text-sm text-yellow-700">
                  يرجى تبديل جميع اللوحات غير المتاحة (الحمراء) قبل إنشاء الحملة
                </p>
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              إلغاء
            </Button>
            <Button 
              onClick={onSubmit}
              disabled={!isFormValid || isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 ml-1 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                'إنشاء الحملة'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};