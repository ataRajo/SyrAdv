import React from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { useBookingDocuments } from "../../hooks/useBookingDocuments";

/**
 * Drop this into any existing booking/contract page (e.g. the component
 * behind the `/dashboard/booking/:id` route) to add the three document
 * actions: download the contract as PDF, preview it in the browser, and
 * download the itemized road-sign price list as a Word document.
 *
 * <BookingDocumentButtons bookingId={booking.id} />
 */
const BookingDocumentButtons = ({ bookingId, className = "" }) => {
  const { openContractPdf, openContractView, openRoadSignList, loadingAction } =
    useBookingDocuments();

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <Button
        size="sm"
        onClick={() => openContractPdf(bookingId)}
        disabled={loadingAction === "contract-pdf"}
      >
        <Icon icon="mdi:file-pdf-box" className="w-4 h-4 ml-1" />
        {loadingAction === "contract-pdf" ? "جارٍ التحضير..." : "تحميل العقد (PDF)"}
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={() => openContractView(bookingId)}
        disabled={loadingAction === "contract-view"}
      >
        <Icon icon="mdi:eye-outline" className="w-4 h-4 ml-1" />
        {loadingAction === "contract-view" ? "جارٍ التحضير..." : "معاينة العقد"}
      </Button>

      <Button
        size="sm"
        variant="secondary"
        onClick={() => openRoadSignList(bookingId)}
        disabled={loadingAction === "roadsign-list"}
      >
        <Icon icon="mdi:file-word-box" className="w-4 h-4 ml-1" />
        {loadingAction === "roadsign-list" ? "جارٍ التحضير..." : "قائمة اللوحات (Word)"}
      </Button>
    </div>
  );
};

export default BookingDocumentButtons;
