import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Icon } from '@iconify/react';
import { Skeleton } from '@/components/ui/skeleton';
import { productTypeMap } from '../../../Static/StaticData';

// Utility function to access nested properties
const getNestedValue = (obj, path) => {
  if (!obj || !path) return undefined;
  try {
    return path.split('.').reduce((current, key) => {
      return current && typeof current === 'object' && key in current ? current[key] : undefined;
    }, obj);
  } catch (error) {
    console.error(`Error accessing path ${path}:`, error);
    return undefined;
  }
};

const DialogShow = ({ show, handleClose, data, fields, arrayKey, arrayFields, loading }) => {
  

  return (
    <Dialog  dir="rtl" open={show} onOpenChange={handleClose}>
      <DialogContent  className="sm:max-w-[600px] dialog-content overflow-auto max-h-[80vh] flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-lg">
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
                  <div key={i} className="flex items-start gap-3 p-3 rounded-md bg-gray-50 dark:bg-gray-700/50">
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
                                    {field.key === 'type' && arrayKey === 'products'
                                      ? productTypeMap[value] || 'Unknown'
                                      : field.format && value !== undefined && value !== null
                                        ? field.format(value)
                                        : value !== undefined && value !== null
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