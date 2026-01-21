import React, { memo, useContext, useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShoppingCart, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
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
    pagination,
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
    direction,
    setDirection,
    handleDirectionChange,
    place,
    setPlace,
    handlePlaceChange,
    page,
    perPage,
    handlePageChange,
    handlePerPageChange,
  } = useGetRoadSignsByFilter();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [uniqueDirections, setUniqueDirections] = useState([]);
  const [uniquePlaces, setUniquePlaces] = useState([]);

  // Debug log
  React.useEffect(() => {
    console.log("Pagination in component:", pagination);
    console.log("Road signs count:", roadSigns?.length);
    console.log("Current page:", page);
    console.log("Items per page:", perPage);
  }, [pagination, roadSigns, page, perPage]);

  useEffect(() => {
    setStartDate(formik.values.start_date);
    setEndDate(formik.values.end_date);
    
    if (formik.values.direction !== undefined && formik.values.direction !== direction) {
      setDirection(formik.values.direction);
    }
    
    if (formik.values.place !== undefined && formik.values.place !== place) {
      setPlace(formik.values.place);
    }
  }, [formik.values.start_date, formik.values.end_date, formik.values.direction, formik.values.place]);

  useEffect(() => {
    if (roadSigns && roadSigns.length > 0) {
      const directions = new Set();
      const places = new Set();
      
      roadSigns.forEach(sign => {
        if (sign.directions && sign.directions.trim() !== "") {
          directions.add(sign.directions);
        }
        if (sign.place && sign.place.trim() !== "") {
          places.add(sign.place);
        }
      });
      
      setUniqueDirections(Array.from(directions).sort());
      setUniquePlaces(Array.from(places).sort());
    } else {
      setUniqueDirections([]);
      setUniquePlaces([]);
    }
  }, [roadSigns]);

  const groupedRoadSigns = React.useMemo(() => {
    if (!roadSigns) return [];

    const groups = {};
    
    roadSigns.forEach(sign => {
      // Filter out booked signs (signs with no available panels)
      const availablePanels = sign.panels_number - sign.total_panels_on_date;
      if (availablePanels <= 0) return; // Skip booked signs
      
      const key = `${sign.city?.name}_${sign.template?.model}_${sign.place}_${sign.region?.name}_${sign.directions || "غير_محدد"}`;
      
      if (!groups[key]) {
        groups[key] = {
          id: key,
          city: sign.city,
          template: sign.template,
          place: sign.place,
          region: sign.region,
          directions: sign.directions || "غير محدد",
          roadsign_code: sign.roadsign_code || "غير متوفر",  
          direction_code: sign.direction_code || "------- ",    
          signs: [],
          totalAvailable: 0,
          totalPanels: 0,
          similarSignsCount: 0
        };
      }
      
      groups[key].signs.push(sign);
      groups[key].totalAvailable += availablePanels;
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

    const signsToAdd = availableSigns.slice(0, selectedQuantity);
    
    signsToAdd.forEach((sign, index) => {
      const uniqueBooking = {
        ...sign,
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

  const isGroupAdded = (groupId) => {
    const group = groupedRoadSigns.find(g => g.id === groupId);
    if (!group) return false;
    return group.signs.some(sign => addedSignIds?.has?.(sign.id));
  };

  const handleDirectionFilterChange = (e) => {
    const value = e.target.value;
    handleDirectionChange(value);
    formik.setFieldValue("direction", value);
  };

  const handlePlaceFilterChange = (e) => {
    const value = e.target.value;
    handlePlaceChange(value);
    formik.setFieldValue("place", value);
  };

  const handleResetFilters = () => {
    setDirection("");
    setPlace("");
    formik.setFieldValue("direction", "");
    formik.setFieldValue("place", "");
  };

  const getActiveFiltersText = () => {
    const filters = [];
    if (direction) filters.push(`الاتجاه: ${direction}`);
    if (place) filters.push(`المكان: ${place}`);
    return filters.join("، ");
  };

  // Handle per page change
  const handlePerPageSelectChange = (e) => {
    const value = e.target.value;
    handlePerPageChange(value);
  };

  // Handle page change via select
  const handlePageSelectChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1) {
      handlePageChange(value);
    }
  };

  // Generate page options for select - always generate at least current page
  const generatePageOptions = () => {
    const totalPages = pagination?.last_page || 1;
    const currentPage = pagination?.current_page || 1;
    
    const pages = [];
    
    // If we don't know total pages, just show current and next
    if (totalPages === 1) {
      pages.push(1);
    } else {
      // Show pages from 1 to totalPages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  // Calculate total pages based on data
  const calculateTotalPages = () => {
    if (pagination?.last_page) {
      return pagination.last_page;
    }
    
    // If no pagination data, calculate based on items per page
    const totalItems = pagination?.total || roadSigns?.length || 0;
    if (totalItems > 0 && perPage > 0) {
      return Math.ceil(totalItems / perPage);
    }
    
    return 1;
  };

  const totalPages = calculateTotalPages();
  const currentPage = pagination?.current_page || page || 1;

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
        اللوحات الطرقية
      </h2>

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
                <option value="">كل المناطق</option>
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
            {getRoadSignsModel?.map((modelItem) => (
              <option key={modelItem.model} value={modelItem.model}>
                {`${modelItem.model} (${modelItem.count} نماذج متوفرة من هذا القياس)`}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex-1">
          <Label htmlFor="direction-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            تصفية حسب الاتجاه
          </Label>
          <select
            id="direction-filter"
            value={direction}
            onChange={handleDirectionFilterChange}
            className="w-full p-2 border dark:bg-gray-900 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">كل الاتجاهات</option>
            {uniqueDirections.map((directionName, index) => (
              <option key={index} value={directionName}>
                {directionName.length > 30 ? `${directionName.substring(0, 30)}...` : directionName}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex-1">
          <Label htmlFor="place-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            تصفية حسب مكان التموضع
          </Label>
          <select
            id="place-filter"
            value={place}
            onChange={handlePlaceFilterChange}
            className="w-full p-2 border dark:bg-gray-900 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">كل الأماكن</option>
            {uniquePlaces.map((placeName, index) => (
              <option key={index} value={placeName}>
                {placeName.length > 30 ? `${placeName.substring(0, 30)}...` : placeName}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleResetFilters}
            className="h-10 px-4"
          >
            إعادة تعيين الفلاتر
          </Button>
        </div>
      </div>

      {/* Per Page and Pagination Controls - ALWAYS SHOW THIS SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center gap-2">
          <Label htmlFor="per-page" className="text-sm text-gray-600 dark:text-gray-400">
            عرض:
          </Label>
          <select
            id="per-page"
            value={perPage}
            onChange={handlePerPageSelectChange}
            className="p-2 border dark:bg-gray-900 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="200">200</option>
          </select>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            لكل صفحة
          </span>
        </div>
        
        {/* Show result count if we have data */}
        {(roadSigns && roadSigns.length > 0) && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            عرض <span className="font-semibold">
              {pagination?.from || 1}-{pagination?.to || roadSigns.length}
            </span> من <span className="font-semibold">
              {pagination?.total || roadSigns.length}
            </span> نتيجة
          </div>
        )}
        
        {/* ALWAYS SHOW PAGE NAVIGATION */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-1">
            <Label htmlFor="page-select" className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
              الصفحة:
            </Label>
            <select
              id="page-select"
              value={currentPage}
              onChange={handlePageSelectChange}
              className="p-2 border dark:bg-gray-900 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-20"
            >
              {generatePageOptions().map((pageNum) => (
                <option key={pageNum} value={pageNum}>
                  {pageNum}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              من {totalPages}
            </span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {(direction || place) && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                فلتر نشط:
              </span>
              <span className="text-sm text-blue-600 dark:text-blue-400">
                {getActiveFiltersText()}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-6 px-2 text-xs"
            >
              إلغاء الفلاتر
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-4">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100 dark:bg-gray-800">
              <TableHead className="text-right">عدد اللوحات المتماثلة</TableHead>
              <TableHead className="text-right">المدينة</TableHead>
              <TableHead className="text-right">نموذج</TableHead>
              <TableHead className="text-right">نوع النموذج</TableHead>
              <TableHead className="text-right">عدد الوجوه</TableHead>
              <TableHead className="text-right">عدد الأمتار</TableHead>
              <TableHead className="text-right">القياس</TableHead>
              <TableHead className="text-right">كود اللوحة</TableHead>
              <TableHead className="text-right">كود الاتجاه</TableHead>
              <TableHead className="text-right">المنطقة</TableHead>
              <TableHead className="text-right">مكان التموضع</TableHead>
              <TableHead className="text-right">الاتجاه</TableHead>
              <TableHead className="text-right">إجراء</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isRoadSignsFetching ? (
              <TableRow>
                <TableCell colSpan={13} className="text-center py-4">
                  جاري التحميل...
                </TableCell>
              </TableRow>
            ) : !groupedRoadSigns || groupedRoadSigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} className="text-center py-4">
                  {getActiveFiltersText() 
                    ? `لا توجد لوحات متوفرة للبحث "${getActiveFiltersText()}" في هذه الفترة`
                    : "لا توجد لوحات متوفرة لهذه الفترة"
                  }
                </TableCell>
              </TableRow>
            ) : (
              groupedRoadSigns.map((group) => (
                <React.Fragment key={group.id}>
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
                    <TableCell className="truncate max-w-[100px] sm:max-w-[120px]">
                      {group.city?.name || "غير متوفر"}
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
                    <TableCell className="truncate max-w-[100px] sm:max-w-[120px] text-xs font-mono">
                      {group.roadsign_code || "غير متوفر"}
                    </TableCell>
                    <TableCell className="truncate max-w-[80px] sm:max-w-[100px] text-xs font-mono text-center">
                      {group.direction_code || "غير متوفر"}
                    </TableCell>
                    <TableCell className="truncate max-w-[120px] sm:max-w-[150px]">
                      {group.region?.name || "غير متوفر"}
                    </TableCell>
                    <TableCell className="truncate max-w-[120px] sm:max-w-[150px]">
                      {group.place || "غير متوفر"}
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const textElement = e.currentTarget.querySelector('.direction-text');
                            textElement.classList.toggle('line-clamp-2');
                            textElement.classList.toggle('whitespace-normal');
                          }}
                          className="text-right w-full hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded transition-colors"
                        >
                          <div className="direction-text line-clamp-2 text-sm text-gray-800 dark:text-gray-200">
                            {group.directions || "غير متوفر"}
                          </div>
                          {group.directions && group.directions.length > 60 && (
                            <span className="text-xs text-blue-600 dark:text-blue-400 mt-1 block">
                              عرض المزيد
                            </span>
                          )}
                        </button>
                      </div>
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
                            <TableCell className="truncate max-w-[100px] sm:max-w-[120px] text-sm">
                              {sign.city?.name || "غير متوفر"}
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
                            <TableCell className="truncate max-w-[100px] sm:max-w-[120px] text-xs font-mono">
                              {sign.roadsign_code || "غير متوفر"}
                            </TableCell>
                            <TableCell className="truncate max-w-[80px] sm:max-w-[100px] text-xs font-mono text-center">
                              {sign.direction_code || "غير متوفر"}
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

      {/* Show pagination at bottom too */}
      {roadSigns && roadSigns.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            الصفحة {currentPage} من {totalPages}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-1">
              <Label htmlFor="page-select-bottom" className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                الصفحة:
              </Label>
              <select
                id="page-select-bottom"
                value={currentPage}
                onChange={handlePageSelectChange}
                className="p-2 border dark:bg-gray-900 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-20"
              >
                {generatePageOptions().map((pageNum) => (
                  <option key={pageNum} value={pageNum}>
                    {pageNum}
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                من {totalPages}
              </span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

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
                <strong>المدينة:</strong> {selectedGroup?.city?.name || "غير متوفر"}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                <strong>النموذج:</strong> {selectedGroup?.template?.model}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                <strong>كود اللوحة:</strong> {selectedGroup?.roadsign_code}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                <strong>كود الاتجاه:</strong> {selectedGroup?.direction_code}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                <strong>المنطقة:</strong> {selectedGroup?.region?.name}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                <strong>مكان التموضع:</strong> {selectedGroup?.place}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                <strong>الاتجاه:</strong> {selectedGroup?.directions}
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