import React, { memo, useContext, useEffect } from "react"; // Added useEffect for potential future needs, though not strictly required for this logic
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { periodOptions, productTypeOptions, typeOptions } from "../../../Static/StaticData";
import { BookingContext } from "../../../Context/BookingContext";



// Define the duration of a single period in days
const DAYS_PER_PERIOD = 28;

const BookingFields = () => {
  const { formik, customers, isLoadingCustomers, bookingData } =
    useContext(BookingContext);

  /**
   * Calculates the end date based on a start date and number of periods.
   * @param {string} startDateString - The start date in 'YYYY-MM-DD' format.
   * @param {number} numberOfPeriods - The number of 28-day periods.
   * @returns {string} The calculated end date in 'YYYY-MM-DD' format.
   */
  const calculateEndDate = (startDateString, numberOfPeriods) => {
    if (!startDateString) return ''; // Return empty if no start date
    const startDate = new Date(startDateString);
    const totalDays = numberOfPeriods * DAYS_PER_PERIOD;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + totalDays);
    return endDate.toISOString().slice(0, 10);
  };

  /**
   * Handles changes to the Start Date input field.
   * Updates start_date in Formik and automatically sets the period to 1 and calculates end_date.
   * @param {Event} event - The change event from the input field.
   */
  const handleStartDateChange = (event) => {
    formik.handleChange(event); // Update start_date in Formik
    const newStartDate = event.target.value;

    if (newStartDate) {
      // Automatically set periods to 1 when a start date is chosen
      formik.setFieldValue("units", 1);
      // Calculate and set end_date based on new start_date and 1 period
      const newEndDate = calculateEndDate(newStartDate, 1);
      formik.setFieldValue("end_date", newEndDate);
    } else {
      // Clear periods and end_date if start_date is cleared
      formik.setFieldValue("units", "");
      formik.setFieldValue("end_date", "");
    }
  };

  /**
   * Handles changes to the Periods (units) select field.
   * Updates units in Formik and recalculates the end_date.
   * @param {string} value - The selected number of periods as a string.
   */
  const handlePeriodsChange = (value) => {
    const numberOfPeriods = parseInt(value, 10);
    formik.setFieldValue("units", numberOfPeriods); // Update units in Formik

    if (formik.values.start_date && !isNaN(numberOfPeriods)) {
      // Recalculate end_date based on current start_date and new number of periods
      const newEndDate = calculateEndDate(formik.values.start_date, numberOfPeriods);
      formik.setFieldValue("end_date", newEndDate);
    } else if (isNaN(numberOfPeriods)) {
      // Clear end_date if periods is cleared (e.g., set to empty string)
      formik.setFieldValue("end_date", "");
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Customer Select Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          الزبون
        </label>
        <Select
          onValueChange={(value) => formik.setFieldValue("customer_id", value)}
          value={bookingData?.customer_id?.toString() || formik.values.customer_id?.toString() || ""}
          onBlur={() => formik.setFieldTouched("customer_id", true)}
        >
          <SelectTrigger className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-right">
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
        {formik.touched.customer_id && formik.errors.customer_id && (
          <p className="text-sm text-red-500 mt-1 text-right">
            {formik.errors.customer_id}
          </p>
        )}
      </div>

      {/* Booking Type Select Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          نوع الحجز
        </label>
        <Select
          onValueChange={(value) => formik.setFieldValue("type", value)}
          value={bookingData?.type?.toString() || formik.values.type?.toString() || ""}
          onBlur={() => formik.setFieldTouched("type", true)}
        >
          <SelectTrigger className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-right">
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
        {formik.touched.type && formik.errors.type && (
          <p className="text-sm text-red-500 mt-1 text-right">
            {formik.errors.type}
          </p>
        )}
      </div>

      {/* Start Date Input Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          تاريخ البداية
        </label>
        <Input
          type="date"
          name="start_date" // Explicitly set name
          
          onChange={handleStartDateChange} // Use custom handler for start date
          onBlur={formik.handleBlur} // Keep Formik's onBlur for validation
          value={formik.values.start_date || ""} // Explicitly set value from Formik state
          className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-right"
        />
        {formik.touched.start_date && formik.errors.start_date && (
          <p className="text-sm text-red-500 mt-1 text-right">
            {formik.errors.start_date}
          </p>
        )}
      </div>

      {/* NEW: Periods Select Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          الدورة (الفترات)
        </label>
        <Select
          onValueChange={handlePeriodsChange} // Use custom handler for periods
          value={formik.values.units?.toString() || ""} // Value from Formik state
          onBlur={() => formik.setFieldTouched("units", true)} // Keep Formik's onBlur
        >
          <SelectTrigger className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-right">
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
        {formik.touched.units && formik.errors.units && (
          <p className="text-sm text-red-500 mt-1 text-right">
            {formik.errors.units}
          </p>
        )}
      </div>

      {/* End Date Input Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          تاريخ النهاية
        </label>
        <Input
          type="date"
          // End date is now primarily controlled by start_date and periods,
          // so getFieldProps is fine, making it read-only or adding custom logic here
          // if manual changes are allowed and should override auto-calculation.
          {...formik.getFieldProps("end_date")}
          className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-right"
          // readOnly // Consider making it readOnly if it's always auto-calculated
        />
        {formik.touched.end_date && formik.errors.end_date && (
          <p className="text-sm text-red-500 mt-1 text-right">
            {formik.errors.end_date}
          </p>
        )}
      </div>

      {/* Product Type Select Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          نوع المنتج
        </label>
        <Select
          onValueChange={(value) => formik.setFieldValue("product_type", value)}
          value={bookingData?.product_type?.toString() || formik.values.product_type?.toString() || ""}
          onBlur={() => formik.setFieldTouched("product_type", true)}
        >
          <SelectTrigger className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-right">
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
        {formik.touched.product_type && formik.errors.product_type && (
          <p className="text-sm text-red-500 mt-1 text-right">
            {formik.errors.product_type}
          </p>
        )}
      </div>
    </div>
  );
};

export default memo(BookingFields);