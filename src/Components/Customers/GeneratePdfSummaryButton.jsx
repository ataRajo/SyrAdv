// GeneratePdfSummaryButton.jsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { useLazyGetOneBookingsQuery } from "../../RtkQuery/Slice/Booking/BookingApi";
import { Loader2 } from "lucide-react";

export const GeneratePdfSummaryButton = ({ selectedBookingIds }) => {
  const [triggerGetBooking] = useLazyGetOneBookingsQuery();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!selectedBookingIds || selectedBookingIds.length === 0) {
      alert("يرجى اختيار حجز واحد على الأقل");
      return;
    }
    setIsGenerating(true);
    try {
      const results = await Promise.all(
        selectedBookingIds.map((id) => triggerGetBooking(id).unwrap())
      );
      
      // Use window.location to navigate with state
      const url = `/dashboard/bookings/summary`;
      const state = { bookingsData: results };
      
      // Store data in sessionStorage
      sessionStorage.setItem('summaryBookingsData', JSON.stringify(results));
      
      // Navigate using window.location
      window.location.href = url;
      
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
      alert("فشل جلب بيانات الحجوزات");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleGenerate}
      disabled={isGenerating || selectedBookingIds.length === 0}
      className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white disabled:opacity-50"
      size="sm"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          جاري التوليد...
        </>
      ) : (
        <>
          <Icon icon="mdi:file-pdf-box" className="text-lg" />
          توليد PDF ({selectedBookingIds.length})
        </>
      )}
    </Button>
  );
};

export default GeneratePdfSummaryButton;