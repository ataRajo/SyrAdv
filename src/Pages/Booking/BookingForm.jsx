import React, { useContext } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { Toaster } from "react-hot-toast";
import BookingFields from "../../Components/Booking/BookingForm/BookingFields";
import BookingTable from "../../Components/Booking/BookingForm/BookingTable";
import CartDialog from "../../Components/Booking/BookingForm/Cart/CartDialog";
import ContractDialog from "../../Components/Booking/BookingForm/ContractDialog";
import {
  BookingContext,
  BookingContextApi,
} from "../../Context/BookingContext";

const BookingContent = () => {
  const { isEditMode, setOpenDialog, selectedSigns, isLoadingBooking, formik } =
    useContext(BookingContext);
  return (
    <div
      dir="rtl"
      className="container mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen"
    >
      <div className="flex justify-between items-center mb-8">
        {/* Booking Form Title */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
          {isEditMode ? "تعديل الحجز" : "إضافة حجز جديد"}
        </h1>

        {/* Button Add To Cart */}
        <button
          type="button"
          variant="outline"
          onClick={() => setOpenDialog(true)}
          disabled={selectedSigns.length === 0}
          className={`flex items-center gap-2 border-2 ${
            selectedSigns.length > 0
              ? "bg-red-500"
              : " border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
          }  transition-colors rounded-lg px-4 py-2`}
        >
          <ShoppingCart className="h-5 w-5  text-gray-600 dark:text-gray-300" />
          <span className="text-sm font-medium">
            سلة الحجز ({selectedSigns.length})
          </span>
        </button>
      </div>

      {isEditMode && isLoadingBooking ? (
        <div className="text-center py-4">جاري التحميل...</div>
      ) : (
        <form
          onSubmit={formik.handleSubmit}
          className="space-y-8 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg"
        >
          {/* Booking Form Inputs */}
          <BookingFields />

          {/* Booking Form Table */}
          <BookingTable />
        </form>
      )}

      <CartDialog />
      <ContractDialog />
      <Toaster />
    </div>
  );
};

// The booking form provider provides all the required data for the booking components.
const BookingForm = ({ bookingId }) => {
  return (
    <BookingContextApi bookingId={bookingId}>
      <BookingContent />
    </BookingContextApi>
  );
};

export default BookingForm;
