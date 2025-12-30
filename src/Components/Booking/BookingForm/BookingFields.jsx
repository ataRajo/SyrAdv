import React, { memo, useContext, useEffect, useState, useMemo, useRef } from "react";
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
import { useGetRoadSignsDirectionsQuery } from "../../../RtkQuery/Slice/RoadSings/RoadSingsApi";
import axios from "axios";
import { BASE_URL } from "../../../Api/baseUrl";

const DAYS_PER_PERIOD = 14;
const EXTRA_DAYS = 2;
const TOTAL_DAYS_PER_PERIOD = DAYS_PER_PERIOD + EXTRA_DAYS;

const BookingFields = () => {
  const { formik, customers, isLoadingCustomers, bookingData } =
    useContext(BookingContext);

  const [printingTypes, setPrintingTypes] = useState([]);
  const [loadingPrintingTypes, setLoadingPrintingTypes] = useState(false);
  
  // استخدام Redux query
  const { 
    data: directionsData = [], 
    isLoading: loadingDirections,
    error: directionsError 
  } = useGetRoadSignsDirectionsQuery();

  // ✅ حالة للبحث أثناء الكتابة
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

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

  const calculateVisibleEndDate = (startDateString, numberOfPeriods) => {
    if (!startDateString) return "";
    const startDate = new Date(startDateString);
    const totalDays = numberOfPeriods * DAYS_PER_PERIOD;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + totalDays);
    return endDate.toISOString().slice(0, 10);
  };

  const handleStartDateChange = (event) => {
    formik.handleChange(event);
    const newStartDate = event.target.value;

    if (newStartDate) {
      formik.setFieldValue("units", 1);
      const newEndDate = calculateEndDate(newStartDate, 1);
      formik.setFieldValue("end_date", newEndDate);
      const visibleEndDate = calculateVisibleEndDate(newStartDate, 1);
      formik.setFieldValue("visible_end_date", visibleEndDate);
    } else {
      formik.setFieldValue("units", "");
      formik.setFieldValue("end_date", "");
      formik.setFieldValue("visible_end_date", "");
    }
  };

  const handleEndDateChange = (event) => {
    const newEndDate = event.target.value;
    formik.setFieldValue("end_date", newEndDate);

    const startDate = formik.values.start_date;

    if (startDate && newEndDate) {
      const start = new Date(startDate);
      const end = new Date(newEndDate);
      
      const diffTime = end.getTime() - start.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      
      const totalInclusiveDays = Math.ceil(diffDays) + 1;
      const rawPeriods = (totalInclusiveDays - 2) / 14;
      const periods = Math.ceil(rawPeriods);
      
      formik.setFieldValue("units", periods);
      
      const visibleEndDate = calculateVisibleEndDate(startDate, periods);
      formik.setFieldValue("visible_end_date", visibleEndDate);
    }
  };

  const handlePeriodsChange = (value) => {
    const numberOfPeriods = parseInt(value, 10);
    formik.setFieldValue("units", numberOfPeriods);

    if (formik.values.start_date && !isNaN(numberOfPeriods)) {
      const newEndDate = calculateEndDate(formik.values.start_date, numberOfPeriods);
      formik.setFieldValue("end_date", newEndDate);
      const visibleEndDate = calculateVisibleEndDate(formik.values.start_date, numberOfPeriods);
      formik.setFieldValue("visible_end_date", visibleEndDate);
    }
  };

  // ✅ تحضير جميع الاتجاهات مع قيمة فارغة لـ "كل الاتجاهات"
  const allDirections = useMemo(() => {
    if (!directionsData || !Array.isArray(directionsData)) {
      return [{ value: "", label: "كل الاتجاهات" }];
    }
    
    const options = [{ value: "", label: "كل الاتجاهات" }];
    
    // إضافة الاتجاهات الفريدة والمصفاة
    const uniqueDirections = new Set();
    directionsData.forEach((dir) => {
      if (dir && dir.trim() !== "") {
        uniqueDirections.add(dir.trim());
      }
    });
    
    Array.from(uniqueDirections).sort().forEach(dir => {
      options.push({
        value: dir,
        label: dir
      });
    });
    
    return options;
  }, [directionsData]);

  // ✅ تصفية الاتجاهات عند الكتابة
  const filteredDirections = useMemo(() => {
    if (searchQuery.trim() === "") {
      return allDirections;
    } else {
      const query = searchQuery.toLowerCase();
      return allDirections.filter(option => 
        option.value.toLowerCase().includes(query) || 
        option.label.toLowerCase().includes(query)
      );
    }
  }, [searchQuery, allDirections]);

  // ✅ عند تغيير القيمة المختارة
  const handleDirectionSelect = (value) => {
    formik.setFieldValue("direction", value === "" ? "" : value);
    setSearchQuery(value || "");
    setShowDropdown(false);
  };

  // ✅ عند الكتابة في حقل البحث
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value === "") {
      formik.setFieldValue("direction", "");
    } else if (allDirections.some(opt => opt.value === value)) {
      formik.setFieldValue("direction", value);
    }
    
    setShowDropdown(true);
  };

  // ✅ عند النقر خارج القائمة
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ✅ عند التركيز على الحقل
  const handleFocus = () => {
    setShowDropdown(true);
  };

  // ✅ تهيئة قيمة البحث من formik
  useEffect(() => {
    const directionValue = bookingData?.direction || formik.values.direction || "";
    setSearchQuery(directionValue);
  }, [formik.values.direction, bookingData?.direction]);

  useEffect(() => {
    const fetchPrintingTypes = async () => {
      try {
        setLoadingPrintingTypes(true);
        
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

      {/* تاريخ النهاية الفعلي */}
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

      {/* الاتجاه مع خاصية البحث */}
      <div ref={dropdownRef} className="relative">
        <label className="block text-sm font-medium mb-2">الاتجاه</label>
        
        <div className="relative">
          <Input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={handleFocus}
            placeholder="ابحث أو اختر الاتجاه..."
            className="w-full p-2 border dark:bg-gray-900 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 text-right"
            disabled={loadingDirections}
          />
          
          {/* Dropdown arrow */}
          <div 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            {loadingDirections ? (
              <span className="text-gray-400">...</span>
            ) : (
              <span className="text-gray-400">▼</span>
            )}
          </div>
        </div>
        
        {/* ✅ Dropdown Menu */}
        {showDropdown && filteredDirections.length > 0 && (
          <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {filteredDirections.map((option, index) => (
              <div
                key={index}
                className={`px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  (formik.values.direction || "") === option.value ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                } ${option.value === "" ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}
                onClick={() => handleDirectionSelect(option.value)}
              >
                <div className="flex justify-between items-center">
                  <span className={option.value === "" ? 'font-semibold text-gray-700 dark:text-gray-300' : ''}>
                    {option.label}
                  </span>
                  {(formik.values.direction || "") === option.value && (
                    <span className="text-blue-500">✓</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* ✅ No results message */}
        {showDropdown && searchQuery && filteredDirections.length === 1 && filteredDirections[0].value === "" && (
          <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
            <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-right">
              لا توجد نتائج لـ "{searchQuery}"
            </div>
          </div>
        )}
        
        {/* ✅ رسالة الخطأ */}
        {formik.errors.direction && formik.touched.direction && (
          <div className="text-red-500 text-sm mt-1">
            {formik.errors.direction}
          </div>
        )}
        
        {/* ✅ تلميح الاستخدام */}
        <div className="mt-1 text-xs text-gray-500">
          {loadingDirections ? 'جاري تحميل الاتجاهات...' : 
           searchQuery ? `البحث: "${searchQuery}" - ${filteredDirections.length} نتيجة` : 
           'اكتب للبحث في الاتجاهات أو اختر من القائمة'}
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

      {/* نوع الطباعة */}
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