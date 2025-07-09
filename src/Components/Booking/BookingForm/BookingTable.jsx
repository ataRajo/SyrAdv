import React, { memo, useContext, useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShoppingCart, Trash2 } from "lucide-react";
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
  const [selectedSign, setSelectedSign] = useState(null);
  const [dateRanges, setDateRanges] = useState([]);
  const [isSignAvailable, setIsSignAvailable] = useState(false);

  useEffect(() => {
    setStartDate(formik.values.start_date);
    setEndDate(formik.values.end_date);
  }, [formik.values.start_date, formik.values.end_date]);

  console.log(dateRanges);
  const handleShowDialog = (sign) => {
    setSelectedSign(sign);

    const mainStartDate = new Date(formik.values.start_date);
    const mainEndDate = new Date(formik.values.end_date);
    const bookedRanges = sign.booking_dates.map((range) => ({
      start: new Date(range.start_date),
      end: new Date(range.end_date),
    }));

    let isAvailable = true;
    let availablePanels = sign.panels_number - sign.total_panels_on_date;
    for (const booked of bookedRanges) {
      if (
        (mainStartDate >= booked.start && mainStartDate <= booked.end) ||
        (mainEndDate >= booked.start && mainEndDate <= booked.end) ||
        (mainStartDate <= booked.start && mainEndDate >= booked.end)
      ) {
        isAvailable = false;
        break;
      }
    }

    setIsSignAvailable(isAvailable);
    setDateRanges(
      isAvailable
        ? [
            {
              startDate: formik.values.start_date,
              endDate: formik.values.end_date,
              booking_faces: 1,
            },
          ]
        : [{ startDate: "", endDate: "", booking_faces: 1 }]
    );
    setIsDialogOpen(true);
  };

  const addDateRange = () => {
    console.log("addDateRange");
    setDateRanges([
      ...dateRanges,
      { startDate: "", endDate: "", booking_faces: 1 },
    ]);
  };

  const removeDateRange = (index) => {
    console.log("removeDateRange");
    if (dateRanges.length > 1) {
      setDateRanges(dateRanges.filter((_, i) => i !== index));
    }
  };

  const updateDateRange = (index, field, value) => {
    const newRanges = [...dateRanges];
    newRanges[index][field] = value;
    setDateRanges(newRanges);
  };

  const updateBookingFaces = (index, value) => {
    const newRanges = [...dateRanges];
    const maxPanels = getMaxAvailablePanels(
      newRanges[index].startDate,
      newRanges[index].endDate
    );
    const parsedValue = parseInt(value) || 1;
    newRanges[index].booking_faces = Math.min(parsedValue, maxPanels);
    setDateRanges(newRanges);
  };

  const getMaxAvailablePanels = (startDate, endDate) => {
    if (!selectedSign || !startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    let maxPanels = selectedSign.panels_number;
    console.log(maxPanels);

    for (const range of selectedSign.available_date_ranges) {
      const rangeStart = new Date(range.start_date);
      const rangeEnd = new Date(range.end_date);
      if (
        (start >= rangeStart && start <= rangeEnd) ||
        (end >= rangeStart && end <= rangeEnd) ||
        (start <= rangeStart && end >= rangeEnd)
      ) {
        maxPanels = Math.min(maxPanels, range.available_panels);
      }
    }

    // for (const booked of selectedSign.booking_dates) {
    //   const bookedStart = new Date(booked.start_date);
    //   const bookedEnd = new Date(booked.end_date);
    //   if (
    //     (start >= bookedStart && start <= bookedEnd) ||
    //     (end >= bookedStart && end <= bookedEnd) ||
    //     (start <= bookedStart && end >= bookedEnd)
    //   ) {
    //     maxPanels = 0; // غير متاح إذا كان هناك تعارض
    //   }
    // }

    return maxPanels;
  };

  const validateDateRanges = () => {
    if (!selectedSign) return false;

    const bookedRanges = selectedSign.booking_dates.map((range) => ({
      start: new Date(range.start_date),
      end: new Date(range.end_date),
    }));

    for (const range of dateRanges) {
      if (!range.startDate || !range.endDate || !range.booking_faces) {
        return false;
      }

      const start = new Date(range.startDate);
      const end = new Date(range.endDate);
      const maxPanels = getMaxAvailablePanels(range.startDate, range.endDate);

      if (
        start >= end ||
        range.booking_faces > maxPanels ||
        range.booking_faces < 1
      ) {
        return false;
      }

      // for (const booked of bookedRanges) {
      //   if (
      //     (start >= booked.start && start <= booked.end) ||
      //     (end >= booked.start && end <= booked.end) ||
      //     (start <= booked.start && end >= booked.end)
      //   ) {
      //     return false;
      //   }
      // }
    }
    return true;
  };

  const handleAddToCartWithDates = () => {
    if (isSignAvailable || validateDateRanges()) {
      const validRanges = dateRanges.filter(
        (range) => range.startDate && range.endDate && range.booking_faces
      );
      if (validRanges.length > 0) {
        addToCart({
          ...selectedSign,
          customDateRanges: validRanges,
        });
        setIsDialogOpen(false);
      } else {
        alert("يرجى إدخال تواريخ وعدد لوحات صالحة على الأقل لمدى زمني واحد");
      }
    } else {
      alert(
        "يرجى اختيار تواريخ وعدد لوحات صالحة دون تعارض مع الحجوزات الحالية"
      );
    }
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
        اللوحات الطرقية
      </h2>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Label
            htmlFor="city"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
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
          <Label
            htmlFor="region"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            المنطقة
          </Label>
          <select
            id="region"
            value={regionId}
            onChange={handleRegionChange}
            disabled={isRegionsLoading || !cityId}
            className={`w-full ${
              isRegionsLoading || !cityId
                ? `dark:bg-gray-700`
                : `dark:bg-gray-900`
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
          <Label
            htmlFor="model"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
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
              <TableHead className="text-right">نموذج</TableHead>
              <TableHead className="text-right">عدد الوجوه</TableHead>
              {/* <TableHead className="text-right">عدد الوجوه المحجوزة</TableHead> */}
              <TableHead className="text-right">عدد الأمتار</TableHead>
              <TableHead className="text-right">القياس</TableHead>
              <TableHead className="text-right">المنطقة</TableHead>
              <TableHead className="text-right">مكان التموضع</TableHead>
              <TableHead className="text-right">الاتجاه</TableHead>
              {/* <TableHead className="text-right">الوجوه المتاحة</TableHead>
              <TableHead className="text-right">اللوحات المتاحة</TableHead> */}
              <TableHead className="text-right">إجراء</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isRoadSignsFetching ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-4">
                  جاري التحميل...
                </TableCell>
              </TableRow>
            ) : !roadSigns || roadSigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-4">
                  لا توجد لوحات متوفرة لهذه الفترة
                </TableCell>
              </TableRow>
            ) : (
              roadSigns.map((sign) => (
                <TableRow
                  key={sign.id}
                  className={` ${
                    addedSignIds?.has?.(sign.id)
                      ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <TableCell className="truncate max-w-[120px] sm:max-w-[150px]">
                    {sign.template?.model || "غير متوفر"}
                  </TableCell>
                  <TableCell>{sign.panels_number || 0}</TableCell>
                  {/* <TableCell>{sign.total_panels_on_date || 0}</TableCell> */}
                  <TableCell>{sign.template.printing_space || 0}</TableCell>
                  <TableCell>{sign.template?.size || "غير متوفر"}</TableCell>
                  <TableCell className="truncate max-w-[120px] sm:max-w-[150px]">
                    {sign.region?.name || "غير متوفر"}
                  </TableCell>
                  <TableCell className="truncate max-w-[120px] sm:max-w-[150px]">
                    {sign.place || "غير متوفر"}
                  </TableCell>
                  <TableCell className="truncate max-w-[120px] sm:max-w-[150px]">
                    {sign.directions || "غير متوفر"}
                  </TableCell>
                  {/* <TableCell>
                    {sign.panels_number - sign.total_panels_on_date === 0
                      ? "لا يوجد أي لوحات متاحة"
                      : `${
                          sign.panels_number - sign.total_panels_on_date
                        } لوحة متاحة`}
                  </TableCell> */}
                  {/* <TableCell>
                    {sign.available_date_ranges?.reduce(
                      (sum, range) => sum + (range.available_panels || 0),
                      0
                    ) || 0}{" "}
                    لوحة
                  </TableCell> */}
                  <TableCell className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleShowDialog(sign)}
                      className={`flex items-center gap-2 ${
                        addedSignIds?.has?.(sign.id)
                          ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300"
                          : "bg-white dark:bg-gray-700"
                      }`}
                      // disabled={addedSignIds?.has?.(sign.id)}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      <span>إضافة</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          dir="rtl"
          className="sm:max-w-[600px] overflow-y-auto dark:bg-gray-800"
        >
          <DialogHeader>
            <DialogTitle className="text-right text-gray-800 dark:text-gray-100">
              اختيار تواريخ وعدد اللوحات
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2">
                التواريخ المتاحة
              </h3>
              {selectedSign?.available_date_ranges?.length > 0 ? (
                <ul className="list-disc pr-4 text-gray-600 dark:text-gray-300">
                  {selectedSign?.available_date_ranges.map((range, index) => (
                    <li key={index}>
                      من {range.start_date} إلى {range.end_date} ({range.days}{" "}
                      أيام، {range.available_panels} لوحات متاحة)
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600 dark:text-gray-300">
                  لا توجد تواريخ متاحة
                </p>
              )}
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2">
                التواريخ المحجوزة
              </h3>
              {selectedSign?.booking_dates?.length > 0 ? (
                <ul className="list-disc pr-4 text-gray-600 dark:text-gray-300">
                  {selectedSign?.booking_dates.map((range, index) => (
                    <li key={index}>
                      من {range.start_date} إلى {range.end_date} ({range.days}{" "}
                      أيام، {range.panels_reserved} لوحات محجوزة)
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600 dark:text-gray-300">
                  لا توجد تواريخ محجوزة
                </p>
              )}
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2">
                تواريخ الحجز وعدد اللوحات
              </h3>
              {isSignAvailable ? (
                <div className="flex flex-col sm:flex-row gap-4 mb-4 items-center">
                  <div className="flex-1">
                    <Label className="text-gray-700 dark:text-gray-300">
                      تاريخ البداية
                    </Label>
                    <input
                      type="date"
                      value={dateRanges[0].startDate}
                      disabled
                      className="w-full p-2 border border-gray-300 dark:bg-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-gray-700 dark:text-gray-300">
                      تاريخ النهاية
                    </Label>
                    <input
                      type="date"
                      value={dateRanges[0].endDate}
                      disabled
                      className="w-full p-2 border border-gray-300 dark:bg-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-gray-700 dark:text-gray-300">
                      عدد اللوحات
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      max={
                        selectedSign?.panels_number -
                        selectedSign?.total_panels_on_date
                      }
                      value={dateRanges[0].booking_faces}
                      onChange={(e) => updateBookingFaces(0, e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:bg-gray-900 rounded-md text-right"
                    />
                  </div>
                </div>
              ) : (
                <>
                  {dateRanges.map((range, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row gap-4 mb-4 items-center"
                    >
                      <div className="flex-1">
                        <Label className="text-gray-700 dark:text-gray-300">
                          تاريخ البداية
                        </Label>
                        <input
                          type="date"
                          value={range.startDate}
                          
                          onChange={(e) =>
                            updateDateRange(index, "startDate", e.target.value)
                          }
                          disabled={
                            selectedSign?.available_date_ranges?.length == 0
                          }
                          className="w-full p-2 border border-gray-300 dark:bg-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-gray-700 dark:text-gray-300">
                          تاريخ النهاية
                        </Label>
                        <input
                          type="date"
                          value={range.endDate}
                          onChange={(e) =>
                            updateDateRange(index, "endDate", e.target.value)
                          }
                          disabled={
                            selectedSign?.available_date_ranges?.length == 0
                          }
                          className="w-full p-2 border border-gray-300 dark:bg-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-gray-700 dark:text-gray-300">
                          عدد اللوحات
                        </Label>
                        <Input
                          type="number"
                          min="1"
                          max={getMaxAvailablePanels(
                            range.startDate,
                            range.endDate
                          )}
                          value={range.booking_faces}
                          onChange={(e) =>
                            updateBookingFaces(index, e.target.value)
                          }
                          className="w-full p-2 border border-gray-300 dark:bg-gray-900 rounded-md text-right"
                          disabled={
                            selectedSign?.available_date_ranges?.length == 0
                          }
                        />
                      </div>
                      {dateRanges.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeDateRange(index)}
                          className="mt-6"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addDateRange}
                    className="mt-2"
                    disabled={selectedSign?.available_date_ranges?.length == 0}
                  >
                    إضافة مدى تاريخي آخر
                  </Button>
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={handleAddToCartWithDates}
              disabled={!isSignAvailable && !validateDateRanges()}
            >
              إضافة إلى السلة
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
