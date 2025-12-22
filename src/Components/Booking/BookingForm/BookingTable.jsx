import React, { memo, useContext, useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShoppingCart, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { BookingContext } from "../../../Context/BookingContext";
import useGetRoadSignsByFilter from "../../../hooks/useGetRoadSignsByFilter";

const BookingTable = () => {
  const { formik, addToCart, addedSignIds } = useContext(BookingContext);
  const {
    setStartDate,
    setEndDate,
    cityId,
    regionId,
    roadSigns,
    cities,
    isCitiesLoading,
    regions,
    isRegionsLoading,
    model,
    getRoadSignsModel,
    isGetRoadSignsModel,
    isRoadSignsFetching,
    handleCityChange,
    handleRegionChange,
    handleModelChange,
  } = useGetRoadSignsByFilter();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  useEffect(() => {
    setStartDate(formik.values.start_date);
    setEndDate(formik.values.end_date);
  }, [formik.values.start_date, formik.values.end_date]);

  // Group similar road signs
  const groupedRoadSigns = React.useMemo(() => {
    if (!roadSigns) return [];

    const groups = {};
    
    roadSigns.forEach(sign => {
      const key = `${sign.template?.model}_${sign.place}_${sign.region?.name}`;
      
      if (!groups[key]) {
        groups[key] = {
          id: key,
          template: sign.template,
          place: sign.place,
          region: sign.region,
          signs: [],
          totalAvailable: 0,
          totalPanels: 0,
          similarSignsCount: 0
        };
      }
      
      groups[key].signs.push(sign);
      groups[key].totalAvailable += (sign.panels_number - sign.total_panels_on_date);
      groups[key].totalPanels += sign.panels_number;
      groups[key].similarSignsCount += 1;
    });

    return Object.values(groups);
  }, [roadSigns]);

  const toggleGroup = (groupId) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const handleShowDialog = (group) => {
    setSelectedGroup(group);
    setSelectedQuantity(1);
    setIsDialogOpen(true);
  };

  const handleAddToCart = () => {
    if (!selectedGroup) return;

    // Calculate available signs (not in cart)
    const availableSigns = selectedGroup.signs.filter(sign => 
      !addedSignIds?.has?.(sign.id)
    );

    if (selectedQuantity > availableSigns.length) {
      alert(`عذراً، لا يتوفر ${selectedQuantity} لوحات. العدد المتاح هو ${availableSigns.length}`);
      return;
    }

    if (selectedQuantity < 1) {
      alert("يرجى اختيار عدد صحيح من اللوحات");
      return;
    }

    // Add EACH sign as a separate booking item with unique cartId
    const signsToAdd = availableSigns.slice(0, selectedQuantity);
    
    signsToAdd.forEach((sign, index) => {
      const uniqueBooking = {
        ...sign,
        // Create unique cart ID to prevent grouping
        cartId: `sign-${sign.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        customDateRanges: [
          {
            startDate: formik.values.start_date,
            endDate: formik.values.end_date,
            booking_faces: 1,
          },
        ],
      };
      
      addToCart(uniqueBooking);
    });

    setIsDialogOpen(false);
    setSelectedQuantity(1);
  };

  const isSignAdded = (signId) => {
    return addedSignIds?.has?.(signId);
  };

  // Fix: Check if any sign in the group is added
  const isGroupAdded = (groupId) => {
    const group = groupedRoadSigns.find(g => g.id === groupId);
    if (!group) return false;
    return group.signs.some(sign => addedSignIds?.has?.(sign.id));
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
        اللوحات الطرقية
      </h2>

      {/* Filter controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            المدينة
          </Label>
          <select
            id="city"
            value={cityId}
            onChange={handleCityChange}
            disabled={isCitiesLoading}
            className="w-full p-2 border dark:bg-gray-900 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">اختر مدينة</option>
            {isCitiesLoading && <option>جاري تحميل المدن ...</option>}
            {cities?.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <Label htmlFor="region" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            المنطقة
          </Label>
          <select
            id="region"
            value={regionId}
            onChange={handleRegionChange}
            disabled={isRegionsLoading || !cityId}
            className={`w-full ${
              isRegionsLoading || !cityId ? `dark:bg-gray-700` : `dark:bg-gray-900`
            } p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 `}
          >
            {isRegionsLoading || !cityId ? (
              <option>اختر مدينة لإظهار المناطق</option>
            ) : (
              <>
                <option>كل المناطق </option>
                {regions?.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>
        <div className="flex-1">
          <Label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            القياس
          </Label>
          <select
            id="model"
            value={model}
            onChange={handleModelChange}
            disabled={isGetRoadSignsModel}
            className={`w-full ${
              isGetRoadSignsModel ? `dark:bg-gray-700` : `dark:bg-gray-900`
            } p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 `}
          >
            <option value="">اختر القياس</option>
            {isGetRoadSignsModel && <option>جاري تحميل القياس ...</option>}
            {getRoadSignsModel?.map((model) => (
              <option key={model.model} value={model.model}>
                {`${model.model} (${model.count} نماذج متوفرة من هذا القياس)`}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100 dark:bg-gray-800">
              <TableHead className="text-right">عدد اللوحات المتماثلة</TableHead>
              <TableHead className="text-right">نموذج</TableHead>
              <TableHead className="text-right">نوع النموذج</TableHead>
              <TableHead className="text-right">عدد الوجوه</TableHead>
              <TableHead className="text-right">عدد الأمتار</TableHead>
              <TableHead className="text-right">القياس</TableHead>
              <TableHead className="text-right">المنطقة</TableHead>
              <TableHead className="text-right">مكان التموضع</TableHead>
              <TableHead className="text-right">الاتجاه</TableHead>
              <TableHead className="text-right">إجراء</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isRoadSignsFetching ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-4">
                  جاري التحميل...
                </TableCell>
              </TableRow>
            ) : !groupedRoadSigns || groupedRoadSigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-4">
                  لا توجد لوحات متوفرة لهذه الفترة
                </TableCell>
              </TableRow>
            ) : (
              groupedRoadSigns.map((group) => (
                <React.Fragment key={group.id}>
                  {/* Main Group Row */}
                  <TableRow
                    className={`${
                      isGroupAdded(group.id)
                        ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700"
                    } cursor-pointer`}
                    onClick={() => toggleGroup(group.id)}
                  >
                    <TableCell className="font-semibold">
                      <div className="flex items-center justify-between">
                        <span>{group.similarSignsCount} لوحة متماثلة</span>
                        {expandedGroups.has(group.id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="truncate max-w-[120px] sm:max-w-[150px]">
                      {group.template?.model || "غير متوفر"}
                    </TableCell>
                    <TableCell className="truncate max-w-[120px] sm:max-w-[150px]">
                      {group.template?.type || "غير محدد"}
                    </TableCell>
                    <TableCell>{group.totalPanels || 0}</TableCell>
                    <TableCell>{group.template?.printing_space || 0}</TableCell>
                    <TableCell>{group.template?.size || "غير متوفر"}</TableCell>
                    <TableCell className="truncate max-w-[120px] sm:max-w-[150px]">
                      {group.region?.name || "غير متوفر"}
                    </TableCell>
                    <TableCell className="truncate max-w-[120px] sm:max-w-[150px]">
                      {group.place || "غير متوفر"}
                    </TableCell>
                    <TableCell className="truncate max-w-[120px] sm:max-w-[150px]">
                      {group.signs[0]?.directions || "غير متوفر"}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShowDialog(group);
                        }}
                        className={`flex items-center gap-2 ${
                          isGroupAdded(group.id)
                            ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300"
                            : "bg-white dark:bg-gray-700"
                        }`}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        <span>إضافة</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                  
                  {/* Expanded view showing individual signs - FIXED */}
                  {expandedGroups.has(group.id) && (
                    <>
                      {group.signs.map((sign, index) => {
                        const isAdded = isSignAdded(sign.id);
                        return (
                          <TableRow
                            key={sign.id}
                            className={`bg-gray-50 dark:bg-gray-800 ${
                              isAdded ? "bg-green-50 dark:bg-green-900/20" : ""
                            }`}
                          >
                            <TableCell className="text-center text-sm text-gray-500">
                              #{index + 1}
                            </TableCell>
                            <TableCell className="truncate max-w-[120px] sm:max-w-[150px] text-sm">
                              {sign.template?.model || "غير متوفر"}
                            </TableCell>
                            <TableCell className="truncate max-w-[120px] sm:max-w-[150px] text-sm">
                              {sign.template?.type || "غير محدد"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {sign.panels_number || 0}
                            </TableCell>
                            <TableCell className="text-sm">
                              {sign.template?.printing_space || 0}
                            </TableCell>
                            <TableCell className="text-sm">
                              {sign.template?.size || "غير متوفر"}
                            </TableCell>
                            <TableCell className="truncate max-w-[120px] sm:max-w-[150px] text-sm">
                              {sign.region?.name || "غير متوفر"}
                            </TableCell>
                            <TableCell className="truncate max-w-[120px] sm:max-w-[150px] text-sm">
                              {sign.place || "غير متوفر"}
                            </TableCell>
                            <TableCell className="truncate max-w-[120px] sm:max-w-[150px] text-sm">
                              {sign.directions || "غير متوفر"}
                            </TableCell>
                            <TableCell className="text-sm">
                              <span className={`px-2 py-1 rounded ${
                                isAdded
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                              }`}>
                                {isAdded ? "مضاف" : "غير مضاف"}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Quantity Selection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent dir="rtl" className="sm:max-w-[500px] dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="text-right text-gray-800 dark:text-gray-100">
              اختيار عدد اللوحات
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                معلومات المجموعة:
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                <strong>النموذج:</strong> {selectedGroup?.template?.model}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                <strong>المنطقة:</strong> {selectedGroup?.region?.name}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                <strong>مكان التموضع:</strong> {selectedGroup?.place}
              </p>
            </div>

            <div>
              <Label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                عدد اللوحات المطلوبة
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={selectedGroup?.totalAvailable}
                value={selectedQuantity}
                onChange={(e) => setSelectedQuantity(parseInt(e.target.value) || 1)}
                className="w-full text-right"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                العدد المتاح: <strong>{selectedGroup?.totalAvailable}</strong> لوحة
              </p>
              {selectedQuantity > selectedGroup?.totalAvailable && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  ⚠️ العدد المطلوب يتجاوز العدد المتاح
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={handleAddToCart}
              disabled={selectedQuantity > selectedGroup?.totalAvailable || selectedQuantity < 1}
            >
              إضافة إلى السلة ({selectedQuantity} لوحة)
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default memo(BookingTable);