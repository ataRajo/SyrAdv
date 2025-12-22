import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Icon } from '@iconify/react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const defaultImage = 'https://road.levantmenu.ae/storage/default.png';

const getImageUrl = (image) => {
  if (!image || typeof image !== 'string' || image.trim() === '') {
    return defaultImage;
  }

  if (image.startsWith('http')) {
    return image;
  }

  return `https://road.levantmenu.ae/storage/${image}`;
};

const getNestedValue = (obj, path) => {
  if (!obj || !path) return undefined;
  try {
    return path.split('.').reduce((current, key) => {
      return current && typeof current === 'object' && key in current
        ? current[key]
        : undefined;
    }, obj);
  } catch (error) {
    return undefined;
  }
};

// Function to parse activity text into structured data
const parseActivityText = (activityText) => {
  if (!activityText || typeof activityText !== 'string') {
    return {
      title: 'نشاط غير معروف',
      type: 'unknown',
      details: []
    };
  }

  const result = {
    title: '',
    type: 'info',
    details: []
  };

  // Determine activity type based on keywords
  const lowerText = activityText.toLowerCase();
  if (lowerText.includes('تم تحديث')) result.type = 'update';
  else if (lowerText.includes('تم إنشاء')) result.type = 'create';
  else if (lowerText.includes('تم حذف')) result.type = 'delete';
  else if (lowerText.includes('تم تسجيل')) result.type = 'login';
  else if (lowerText.includes('تم قراءة')) result.type = 'read';

  // Parse the activity text into structured details
  const lines = activityText.split(' - ').filter(line => line.trim());
  
  if (lines.length > 0) {
    // First line is usually the main action
    result.title = lines[0].trim();
    
    // Parse details from remaining lines
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      const parts = line.split(': ');
      
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join(': ').trim();
        
        // Check if this is a before/after comparison
        if (key.includes('السابق') || key.includes('السابقة')) {
          result.details.push({
            type: 'before',
            label: key.replace('السابق', '').replace('السابقة', '').trim(),
            value: value
          });
        } else if (key.includes('الحالي') || key.includes('الحالية')) {
          result.details.push({
            type: 'after',
            label: key.replace('الحالي', '').replace('الحالية', '').trim(),
            value: value
          });
        } else {
          result.details.push({
            type: 'info',
            label: key,
            value: value
          });
        }
      } else {
        // If no colon, treat as regular text
        result.details.push({
          type: 'text',
          label: '',
          value: line
        });
      }
    }
  } else {
    result.title = activityText;
  }

  return result;
};

// Function to get icon based on activity type
const getActivityIcon = (type) => {
  switch (type) {
    case 'update': return 'mdi:pencil';
    case 'create': return 'mdi:plus-circle';
    case 'delete': return 'mdi:delete';
    case 'login': return 'mdi:login';
    case 'read': return 'mdi:eye';
    default: return 'mdi:information';
  }
};

// Function to get color based on activity type
const getActivityColor = (type) => {
  switch (type) {
    case 'update': return 'blue';
    case 'create': return 'green';
    case 'delete': return 'red';
    case 'login': return 'purple';
    case 'read': return 'orange';
    default: return 'gray';
  }
};

const DialogShow = ({
  show,
  handleClose,
  data,
  fields,
  arrayKey,
  arrayFields,
  loading,
}) => {
  const imageUrl = getImageUrl(data?.image);

  return (
    <Dialog open={show} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] h-[85vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-gray-800 rounded-lg shadow-xl">
        <DialogHeader className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
            التفاصيل
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 px-6 py-4">
          <div className="space-y-8">
            {loading ? (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <Skeleton className="h-48 w-48 rounded-lg" />
                </div>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-6 w-56" />
                    </div>
                  </div>
                ))}
              </div>
            ) : Array.isArray(data) ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                    <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-800">
                      <Icon 
                        icon="mdi:history" 
                        className="text-2xl text-blue-600 dark:text-blue-400" 
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        سجل النشاطات
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        عدد النشاطات: {data.length}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Activities List */}
                <div className="space-y-4">
                  {data.map((item, index) => {
                    const parsedActivity = parseActivityText(item.activity);
                    const activityColor = getActivityColor(parsedActivity.type);
                    const activityIcon = getActivityIcon(parsedActivity.type);
                    
                    return (
                      <div 
                        key={item.id || index} 
                        className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-lg transition-all duration-200"
                      >
                        {/* Activity Header */}
                        <div className={`p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-${activityColor}-50 to-white dark:from-${activityColor}-900/10 dark:to-gray-800/50`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                              <div className={`p-2 rounded-lg bg-${activityColor}-100 dark:bg-${activityColor}-900/30`}>
                                <Icon 
                                  icon={activityIcon}
                                  className={`text-xl text-${activityColor}-600 dark:text-${activityColor}-400`}
                                />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                    {parsedActivity.title}
                                  </h4>
                                  <Badge 
                                    variant="outline" 
                                    className={`text-${activityColor}-600 dark:text-${activityColor}-400 border-${activityColor}-200 dark:border-${activityColor}-800`}
                                  >
                                    {parsedActivity.type === 'update' && 'تحديث'}
                                    {parsedActivity.type === 'create' && 'إنشاء'}
                                    {parsedActivity.type === 'delete' && 'حذف'}
                                    {parsedActivity.type === 'login' && 'تسجيل دخول'}
                                    {parsedActivity.type === 'read' && 'قراءة'}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                  <div className="flex items-center gap-1">
                                    <Icon icon="mdi:calendar" className="h-4 w-4" />
                                    <span>
                                      {item.created_at ? new Date(item.created_at).toLocaleDateString('ar-SA') : 'غير معروف'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Icon icon="mdi:clock-outline" className="h-4 w-4" />
                                    <span>
                                      {item.created_at ? new Date(item.created_at).toLocaleTimeString('ar-SA', { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      }) : ''}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
                                  #{index + 1}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Activity Details */}
                        {parsedActivity.details.length > 0 && (
                          <div className="p-4 space-y-3">
                            {parsedActivity.details.map((detail, detailIndex) => {
                              // Group before/after pairs
                              if (detail.type === 'before' || detail.type === 'after') {
                                const afterDetail = parsedActivity.details.find(
                                  (d, i) => i > detailIndex && 
                                  d.type === (detail.type === 'before' ? 'after' : 'before') &&
                                  d.label === detail.label
                                );

                                if (detail.type === 'before' && afterDetail) {
                                  return (
                                    <div key={detailIndex} className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <Icon 
                                          icon="mdi:arrow-right" 
                                          className="h-4 w-4 text-blue-500" 
                                        />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                          {detail.label}
                                        </span>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6">
                                        <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30">
                                          <div className="flex items-center gap-2 mb-1">
                                            <Icon icon="mdi:arrow-left" className="h-4 w-4 text-red-500" />
                                            <span className="text-xs font-medium text-red-600 dark:text-red-400">السابق</span>
                                          </div>
                                          <p className="text-sm text-gray-900 dark:text-gray-100">{detail.value}</p>
                                        </div>
                                        <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30">
                                          <div className="flex items-center gap-2 mb-1">
                                            <Icon icon="mdi:arrow-right" className="h-4 w-4 text-green-500" />
                                            <span className="text-xs font-medium text-green-600 dark:text-green-400">الحالي</span>
                                          </div>
                                          <p className="text-sm text-gray-900 dark:text-gray-100">{afterDetail.value}</p>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                                
                                if (detail.type === 'after' && !parsedActivity.details.some(
                                  (d, i) => i < detailIndex && 
                                  d.type === 'before' && 
                                  d.label === detail.label
                                )) {
                                  return null; // Skip after if we already rendered it with before
                                }
                              }

                              // Regular details
                              return (
                                <div key={detailIndex} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                  {detail.type === 'info' && (
                                    <Icon icon="mdi:information" className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                  )}
                                  <div className="flex-1">
                                    {detail.label && (
                                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {detail.label}
                                      </p>
                                    )}
                                    <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                                      {detail.value}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Raw activity text (for debugging) */}
                        <div className="px-4 pb-4">
                          <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                            <details className="text-sm">
                              <summary className="cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                                عرض النص الأصلي
                              </summary>
                              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                                <p className="font-mono text-xs text-gray-600 dark:text-gray-400 break-words">
                                  {item.activity}
                                </p>
                              </div>
                            </details>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : !data ? (
              <div className="text-center py-12">
                <Icon 
                  icon="mdi:information-outline" 
                  className="text-4xl text-gray-400 mx-auto mb-4" 
                />
                <p className="text-lg text-gray-500 dark:text-gray-400">
                  لا تتوفر بيانات
                </p>
              </div>
            ) : (
              <>
                {/* Original content for non-array data */}
                {/* ... Keep all the original content here ... */}
                {/* Photo section */}
                <div className="mb-8">
                  <div className="flex flex-col items-center">
                    <div className="relative group">
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-56 h-56 object-contain bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl shadow-lg border-4 border-white dark:border-gray-700 p-2 transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = defaultImage;
                          e.target.classList.add('p-4');
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    
                    {/* Photo actions */}
                    <div className="flex gap-3 mt-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => window.open(imageUrl, '_blank')}
                      >
                        <Icon icon="mdi:eye-outline" className="mr-2 h-4 w-4" />
                        عرض بالحجم الكامل
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                        onClick={() => {
                          navigator.clipboard.writeText(imageUrl);
                        }}
                      >
                        <Icon icon="mdi:content-copy" className="mr-2 h-4 w-4" />
                        نسخ الرابط
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Details fields */}
                {fields && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Icon 
                        icon="mdi:information-box-outline" 
                        className="text-2xl text-blue-600 dark:text-blue-400" 
                      />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        المعلومات الأساسية
                      </h3>
                    </div>
                    
                    <div className="grid gap-3">
                      {fields.map((field) => {
                        const value = getNestedValue(data, field.key);
                        return (
                          <div
                            key={field.key}
                            className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800/50 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-200 hover:shadow-md"
                          >
                            {field.icon && (
                              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                                <Icon
                                  icon={field.icon}
                                  className="text-xl text-blue-600 dark:text-blue-400"
                                />
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                {field.label}
                              </p>
                              <p className="text-base font-semibold text-gray-900 dark:text-gray-100 break-words">
                                {field.format && value !== undefined && value !== null
                                  ? field.format(value)
                                  : value !== undefined && value !== null
                                  ? String(value)
                                  : <span className="text-gray-400 dark:text-gray-500">غير محدد</span>}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Bookings Section */}
                {data?.bookings && data.bookings.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-6">
                      <Icon 
                        icon="mdi:calendar-clock" 
                        className="text-2xl text-green-600 dark:text-green-400" 
                      />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        الحجوزات ({data.bookings.length})
                      </h3>
                    </div>
                    
                    <div className="space-y-3">
                      {data.bookings.map((booking, index) => (
                        <div 
                          key={booking.id || index} 
                          className="relative overflow-hidden rounded-xl border border-green-100 dark:border-green-900/30 bg-gradient-to-r from-green-50/50 to-white dark:from-green-900/10 dark:to-gray-800/50 p-4 hover:shadow-lg transition-shadow duration-200"
                        >
                          <div className="absolute top-0 right-0 w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full -translate-y-12 translate-x-12"></div>
                          
                          <div className="relative flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="p-2 rounded-full bg-white dark:bg-gray-700 shadow-sm">
                                <Icon 
                                  icon="mdi:account-circle" 
                                  className="text-3xl text-green-600 dark:text-green-400" 
                                />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-gray-100">
                                  {booking.customer?.full_name || "عميل غير معروف"}
                                </p>
                                <div className="flex items-center gap-4 mt-2">
                                  {booking.start_date && (
                                    <div className="flex items-center gap-2">
                                      <Icon 
                                        icon="mdi:calendar-start" 
                                        className="h-4 w-4 text-gray-500" 
                                      />
                                      <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {new Date(booking.start_date).toLocaleDateString('ar-SA')}
                                      </span>
                                    </div>
                                  )}
                                  
                                  {booking.end_date && (
                                    <>
                                      <Icon 
                                        icon="mdi:arrow-right" 
                                        className="h-4 w-4 text-gray-400" 
                                      />
                                      <div className="flex items-center gap-2">
                                        <Icon 
                                          icon="mdi:calendar-end" 
                                          className="h-4 w-4 text-gray-500" 
                                        />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                          {new Date(booking.end_date).toLocaleDateString('ar-SA')}
                                        </span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium">
                              #{index + 1}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No bookings message */}
                {data && (!data.bookings || data.bookings.length === 0) && (
                  <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-center py-8">
                      <div className="inline-flex p-4 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                        <Icon 
                          icon="mdi:calendar-remove" 
                          className="text-3xl text-gray-400" 
                        />
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        لا توجد حجوزات
                      </h4>
                      <p className="text-gray-500 dark:text-gray-400">
                        لم يتم حجز هذه اللوحة بعد
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <Button
            variant="outline"
            onClick={handleClose}
            className="px-6 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DialogShow;