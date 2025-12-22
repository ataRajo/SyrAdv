import React, { memo, useContext, useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  periodOptions,
  productTypeOptions,
  typeOptions,
} from "../../../Static/StaticData";
import { BookingContext } from "../../../Context/BookingContext";
import axios from "axios";
import { BASE_URL } from "../../../Api/baseUrl"; 

const DAYS_PER_PERIOD = 14;
const EXTRA_DAYS = 2;
const TOTAL_DAYS_PER_PERIOD = DAYS_PER_PERIOD + EXTRA_DAYS; // Now 16 days per period

const BookingFields = () => {
  const { formik, customers, isLoadingCustomers, bookingData } =
    useContext(BookingContext);

  // Add state for printing types
  const [printingTypes, setPrintingTypes] = useState([]);
  const [loadingPrintingTypes, setLoadingPrintingTypes] = useState(false);

  /** ✅ Calculates the end date based on start date + periods (including extra days) */
  const calculateEndDate = (startDateString, numberOfPeriods) => {
    if (!startDateString) return "";
    const startDate = new Date(startDateString);
    const totalDays = numberOfPeriods * TOTAL_DAYS_PER_PERIOD;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + totalDays);
    return endDate.toISOString().slice(0, 10);
  };


const calculatePeriodsFromDates = (startDate, endDate) => {
  if (!startDate || !endDate) return 1;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const diffTime = end.getTime() - start.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  const totalInclusiveDays = Math.ceil(diffDays) + 1;
  
  const rawPeriods = (totalInclusiveDays - 2) / 14;
  const periods = Math.ceil(rawPeriods);
  
  return Math.min(Math.max(periods, 1), 24);
};

  /** ✅ Calculate the visible end date (without extra days) for display */
  const calculateVisibleEndDate = (startDateString, numberOfPeriods) => {
    if (!startDateString) return "";
    const startDate = new Date(startDateString);
    const totalDays = numberOfPeriods * DAYS_PER_PERIOD; // Only 14 days for display
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + totalDays);
    return endDate.toISOString().slice(0, 10);
  };

  const handleStartDateChange = (event) => {
    formik.handleChange(event);
    const newStartDate = event.target.value;

    if (newStartDate) {
      // Automatically set 1 period and calculate end_date
      formik.setFieldValue("units", 1);
      
      // Set the actual end date (with extra days)
      const newEndDate = calculateEndDate(newStartDate, 1);
      formik.setFieldValue("end_date", newEndDate);
      
      // Also calculate and set the visible end date for user reference
      const visibleEndDate = calculateVisibleEndDate(newStartDate, 1);
      formik.setFieldValue("visible_end_date", visibleEndDate);
    } else {
      formik.setFieldValue("units", "");
      formik.setFieldValue("end_date", "");
      formik.setFieldValue("visible_end_date", "");
    }
  };

  // In BookingFields.js - Update handleEndDateChange with DEBUG:

const handleEndDateChange = (event) => {
  const newEndDate = event.target.value;
  formik.setFieldValue("end_date", newEndDate);

  const startDate = formik.values.start_date;

  if (startDate && newEndDate) {
    // DEBUG: Let's see exactly what we're calculating
    const start = new Date(startDate);
    const end = new Date(newEndDate);
    
    // Calculate total days INCLUDING both start and end
    const diffTime = end.getTime() - start.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    console.log("🔍 DEBUG PERIOD CALCULATION:");
    console.log("Start Date:", startDate, "(", start.toDateString(), ")");
    console.log("End Date:", newEndDate, "(", end.toDateString(), ")");
    console.log("Time Difference (ms):", diffTime);
    console.log("Days Difference:", diffDays);
    console.log("Days Difference (rounded):", Math.ceil(diffDays));
    
    // CORRECT: Count inclusive days (Jan 1 to Jan 31 = 31 days)
    const totalInclusiveDays = Math.ceil(diffDays) + 1;
    console.log("Total Inclusive Days:", totalInclusiveDays);
    
    const rawPeriods = (totalInclusiveDays - 2) / 14;
    const periods = Math.ceil(rawPeriods);
    
    console.log("Formula: (", totalInclusiveDays, "- 2) ÷ 14 =", rawPeriods);
    console.log("Rounded up periods:", periods);
    
    formik.setFieldValue("units", periods);
    
    const visibleEndDate = calculateVisibleEndDate(startDate, periods);
    formik.setFieldValue("visible_end_date", visibleEndDate);
  }
};


  const handlePeriodsChange = (value) => {
    const numberOfPeriods = parseInt(value, 10);
    formik.setFieldValue("units", numberOfPeriods);

    if (formik.values.start_date && !isNaN(numberOfPeriods)) {
      // Set actual end date (with extra days)
      const newEndDate = calculateEndDate(formik.values.start_date, numberOfPeriods);
      formik.setFieldValue("end_date", newEndDate);
      
      // Set visible end date (without extra days)
      const visibleEndDate = calculateVisibleEndDate(formik.values.start_date, numberOfPeriods);
      formik.setFieldValue("visible_end_date", visibleEndDate);
    }
  };

  // Fetch printing types
  useEffect(() => {
    const fetchPrintingTypes = async () => {
      try {
        setLoadingPrintingTypes(true);
        
        // Get token from localStorage (same as PrintPrice component)
        const getAuthToken = () => {
          try {
            const raw = localStorage.getItem("SuperAdminInfo");
            const info = raw ? JSON.parse(raw) : null;
            return info?.user?.token || info?.token || null;
          } catch (error) {
            console.error("Error getting token:", error);
            return null;
          }
        };

        const token = getAuthToken();
        
        const response = await axios.get(`${BASE_URL}/printings`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        });
        
        setPrintingTypes(response.data || []);
      } catch (error) {
        console.error("Error fetching printing types:", error);
        setPrintingTypes([]);
      } finally {
        setLoadingPrintingTypes(false);
      }
    };

    fetchPrintingTypes();
  }, []);

  // Initialize visible_end_date on mount
  useEffect(() => {
    if (formik.values.start_date && formik.values.units && !formik.values.visible_end_date) {
      const visibleEndDate = calculateVisibleEndDate(
        formik.values.start_date, 
        formik.values.units
      );
      formik.setFieldValue("visible_end_date", visibleEndDate);
    }
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* الزبون */}
      <div>
        <label className="block text-sm font-medium mb-2">الزبون</label>
        <Select
          onValueChange={(value) => formik.setFieldValue("customer_id", value)}
          value={
            bookingData?.customer_id?.toString() ||
            formik.values.customer_id?.toString() ||
            ""
          }
        >
          <SelectTrigger className="w-full text-right">
            <SelectValue placeholder="اختر الزبون" />
          </SelectTrigger>
          <SelectContent>
            {isLoadingCustomers ? (
              <SelectItem value="loading">جاري التحميل...</SelectItem>
            ) : (
              customers?.map((customer) => (
                <SelectItem key={customer.id} value={customer.id.toString()}>
                  {customer.full_name} - {customer.company_name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* نوع الحجز */}
      <div>
        <label className="block text-sm font-medium mb-2">نوع الحجز</label>
        <Select
          onValueChange={(value) => formik.setFieldValue("type", value)}
          value={
            bookingData?.type?.toString() ||
            formik.values.type?.toString() ||
            ""
          }
        >
          <SelectTrigger className="w-full text-right">
            <SelectValue placeholder="اختر نوع الحجز" />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* تاريخ البداية */}
      <div>
        <label className="block text-sm font-medium mb-2">تاريخ البداية</label>
        <Input
          type="date"
          name="start_date"
          onChange={handleStartDateChange}
          onBlur={formik.handleBlur}
          value={formik.values.start_date || ""}
          className="w-full text-right"
        />
      </div>

      {/* الدورة (الفترات) */}
      <div>
        <label className="block text-sm font-medium mb-2">
          الدورة (الفترات)
        </label>
        <Select
          onValueChange={handlePeriodsChange}
          value={formik.values.units?.toString() || ""}
        >
          <SelectTrigger className="w-full text-right">
            <SelectValue placeholder="اختر عدد الفترات" />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="text-xs text-gray-500 mt-1">
          كل فترة = {DAYS_PER_PERIOD} يوم + {EXTRA_DAYS} أيام إضافية
        </div>
      </div>

      {/* تاريخ النهاية الفعلي (مع الأيام الإضافية) */}
      <div>
        <label className="block text-sm font-medium mb-2">تاريخ النهاية الفعلي</label>
        <Input
          type="date"
          name="end_date"
          onChange={handleEndDateChange}
          onBlur={formik.handleBlur}
          value={formik.values.end_date || ""}
          className="w-full text-right"
        />
        <div className="text-xs text-gray-500 mt-1">
          يتضمن {EXTRA_DAYS} أيام إضافية لكل فترة
        </div>
      </div>

      {/* تاريخ النهاية الظاهر (بدون الأيام الإضافية) */}
      <div>
        <label className="block text-sm font-medium mb-2">تاريخ النهاية الظاهر</label>
        <Input
          type="date"
          name="visible_end_date"
          readOnly
          value={formik.values.visible_end_date || ""}
          className="w-full text-right bg-gray-50"
        />
        <div className="text-xs text-gray-500 mt-1">
          للعرض فقط (بدون الأيام الإضافية)
        </div>
      </div>

      {/* نوع المنتج */}
      <div>
        <label className="block text-sm font-medium mb-2">نوع المنتج</label>
        <Select
          onValueChange={(value) => formik.setFieldValue("product_type", value)}
          value={
            bookingData?.product_type?.toString() ||
            formik.values.product_type?.toString() ||
            ""
          }
        >
          <SelectTrigger className="w-full text-right">
            <SelectValue placeholder="اختر نوع المنتج" />
          </SelectTrigger>
          <SelectContent>
            {productTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}  
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">نوع الطباعة *</label>
        <Select
          onValueChange={(value) => formik.setFieldValue("printing_id", value)}
          value={
            bookingData?.printing_id?.toString() ||
            formik.values.printing_id?.toString() ||
            ""
          }
        >
          <SelectTrigger className="w-full text-right">
            <SelectValue placeholder={loadingPrintingTypes ? "جاري التحميل..." : "اختر نوع الطباعة"} />
          </SelectTrigger>
          <SelectContent>
            {loadingPrintingTypes ? (
              <SelectItem value="loading" disabled>
                جاري تحميل أنواع الطباعة...
              </SelectItem>
            ) : printingTypes.length === 0 ? (
              <SelectItem value="empty" disabled>
                لا توجد أنواع طباعة متاحة
              </SelectItem>
            ) : (
              printingTypes.map((printingType) => (
                <SelectItem key={printingType.id} value={printingType.id.toString()}>
                  {printingType.type} - {printingType.price?.toLocaleString()} ل.س
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {formik.errors.printing_id && formik.touched.printing_id && (
          <div className="text-red-500 text-sm mt-1">
            {formik.errors.printing_id}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(BookingFields);