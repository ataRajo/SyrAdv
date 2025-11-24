import React, { memo, useContext, useEffect } from "react";
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

// Define the duration of a single period in days
const DAYS_PER_PERIOD = 14;

const BookingFields = () => {
  const { formik, customers, isLoadingCustomers, bookingData } =
    useContext(BookingContext);

  /** ✅ Calculates the end date based on start date + periods */
  const calculateEndDate = (startDateString, numberOfPeriods) => {
    if (!startDateString) return "";
    const startDate = new Date(startDateString);
    const totalDays = numberOfPeriods * DAYS_PER_PERIOD;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + totalDays);
    return endDate.toISOString().slice(0, 10);
  };

  /** ✅ Calculates the number of 28-day periods between two dates */
  const calculatePeriodsFromDates = (startDate, endDate) => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end - start;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    const periods = Math.ceil(diffDays / DAYS_PER_PERIOD);
    return Math.min(Math.max(periods, 1), 12); // Limit between 1–12
  };

  /** ✅ When start_date changes */
  const handleStartDateChange = (event) => {
    formik.handleChange(event);
    const newStartDate = event.target.value;

    if (newStartDate) {
      // Automatically set 1 period and calculate end_date
      formik.setFieldValue("units", 1);
      const newEndDate = calculateEndDate(newStartDate, 1);
      formik.setFieldValue("end_date", newEndDate);
    } else {
      formik.setFieldValue("units", "");
      formik.setFieldValue("end_date", "");
    }
  };

  /** ✅ When user manually changes the end date — auto-update periods */
  const handleEndDateChange = (event) => {
    formik.handleChange(event);
    const newEndDate = event.target.value;
    const startDate = formik.values.start_date;

    if (startDate && newEndDate) {
      const periods = calculatePeriodsFromDates(startDate, newEndDate);
      formik.setFieldValue("units", periods);
    }
  };

  /** ✅ When user manually changes the number of periods */
  const handlePeriodsChange = (value) => {
    const numberOfPeriods = parseInt(value, 10);
    formik.setFieldValue("units", numberOfPeriods);

    if (formik.values.start_date && !isNaN(numberOfPeriods)) {
      const newEndDate = calculateEndDate(
        formik.values.start_date,
        numberOfPeriods
      );
      formik.setFieldValue("end_date", newEndDate);
    }
  };

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
      </div>

      {/* تاريخ النهاية */}
      <div>
        <label className="block text-sm font-medium mb-2">تاريخ النهاية</label>
        <Input
          type="date"
          name="end_date"
          onChange={handleEndDateChange} // ✅ new handler added here
          onBlur={formik.handleBlur}
          value={formik.values.end_date || ""}
          className="w-full text-right"
        />
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
    </div>
  );
};

export default memo(BookingFields);
