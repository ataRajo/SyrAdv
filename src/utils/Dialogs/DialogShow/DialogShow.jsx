import React, { useState } from 'react';
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
import { productTypeMap } from '../../../Static/StaticData';
import defaultImage from '@/assets/images/adv_syrian.png';

// ✅ Helper: safely get nested values
const getNestedValue = (obj, path) => {
  if (!obj || !path) return undefined;
  try {
    return path.split('.').reduce((current, key) => {
      return current && typeof current === 'object' && key in current
        ? current[key]
        : undefined;
    }, obj);
  } catch (error) {
    console.error(`Error accessing path ${path}:`, error);
    return undefined;
  }
};

// ✅ Helper: faster image resolver (no slow fallback)
const getImageUrl = (image) => {
  if (!image || typeof image !== 'string' || image.trim() === '') {
    return defaultImage;
  }

  // If backend sends a URL BUT it doesn't contain a real file → fallback
  if (image.startsWith('http')) {
    const hasValidFile = /\.(png|jpg|jpeg|webp|gif)$/i.test(image);
    return hasValidFile ? image : defaultImage;
  }

  // For stored relative paths
  return `https://road.levantmenu.ae/storage/${image}`;
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
    <Dialog dir="rtl" open={show} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] dialog-content overflow-auto max-h-[80vh] flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <DialogHeader className="border-b border-gray-100 dark:border-gray-700 pb-4">
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            التفاصيل
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-6">
            {loading ? (
              <div className="grid gap-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-md bg-gray-50 dark:bg-gray-700/50"
                  >
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-5 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !data || (!fields && !arrayKey) ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                لا تتوفر بيانات
              </p>
            ) : (
              <>
                {/* ✅ Instant image preview (no delay) */}
                <div className="flex justify-center mb-4 bg-white">
                  <img
                    src={imageUrl}
                    alt="preview"
                    className="w-40 h-40 object-cover rounded-md shadow"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = defaultImage;
                    }}
                  />
                </div>

                {/* ✅ Normal field rendering */}
                {fields && !Array.isArray(data) && (
                  <div className="grid gap-4">
                    {fields.map((field) => {
                      const value = getNestedValue(data, field.key);
                      return (
                        <div
                          dir="rtl"
                          key={field.key}
                          className="flex items-start gap-3 p-3 rounded-md bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors"
                        >
                          <Icon
                            icon={field.icon}
                            className="text-muted-foreground text-xl shrink-0 mt-1"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              {field.label}
                            </p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[400px]">
                              {field.format && value !== undefined && value !== null
                                ? field.format(value)
                                : value !== undefined && value !== null
                                ? value
                                : 'N/A'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ✅ Bookings Section - REMOVED EYE ICON BUTTON */}
                {data?.bookings && data.bookings.length > 0 && (
                  <div className="mt-6 border-t pt-6">
                    <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                      الحجوزات
                    </h4>
                    <div className="space-y-3">
                      {data.bookings.map((booking, index) => (
                        <div key={booking.id} className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-3">
                            <Icon icon="mdi:account" className="text-blue-600 dark:text-blue-400 text-xl" />
                            <div>
                              {/*
                              <p className="font-medium text-gray-900 dark:text-gray-100">حجز #{index + 1}</p>
                              
                              */}
                              <p className="text-lg text-gray-600 dark:text-gray-400">
                                {booking.customer?.full_name || "لا يوجد اسم"}
                              </p>
                              {booking.start_date && (
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                  من {booking.start_date.split('T')[0]} 
                                  {booking.end_date && ` إلى ${booking.end_date.split('T')[0]}`}
                                </p>
                              )}
                            </div>
                          </div>
                          {/* REMOVED THE EYE ICON BUTTON */}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ✅ Show message if no bookings */}
                {data && (!data.bookings || data.bookings.length === 0) && (
                  <div className="mt-6 border-t pt-6">
                    <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                      الحجوزات
                    </h4>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border">
                      <Icon icon="mdi:calendar-remove" className="text-gray-400 text-2xl mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">لا توجد حجوزات</p>
                    </div>
                  </div>
                )}

                {/* ✅ Array data */}
                {arrayKey && Array.isArray(data) && arrayFields && (
                  <div className="mt-6">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                      {arrayKey.charAt(0).toUpperCase() + arrayKey.slice(1)}
                    </p>
                    <div className="space-y-4">
                      {data.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start text-right gap-3 p-3 rounded-md bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors"
                        >
                          <Icon
                            icon={arrayFields[0]?.icon || 'mdi:tag-outline'}
                            className="text-muted-foreground text-xl shrink-0 mt-1"
                          />
                          <div className="flex-1">
                            {arrayFields.map((field) => {
                              const value = getNestedValue(item, field.key);
                              return (
                                <div key={field.key}>
                                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    {field.label}
                                  </p>
                                  <p className="text-sm text-gray-900 dark:text-gray-100">
                                    {field.key === 'type' &&
                                    arrayKey === 'products'
                                      ? productTypeMap[value] || 'Unknown'
                                      : field.format &&
                                        value !== undefined &&
                                        value !== null
                                      ? field.format(value)
                                      : value !== undefined &&
                                        value !== null
                                      ? value
                                      : 'N/A'}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="border-t border-gray-100 dark:border-gray-700 pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DialogShow;