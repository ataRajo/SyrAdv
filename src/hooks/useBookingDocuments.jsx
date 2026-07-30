import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import {
  useLazyGetContractPdfLinkQuery,
  useLazyGetContractViewLinkQuery,
  useLazyGetRoadSignListLinkQuery,
} from "../RtkQuery/Slice/Bookings/BookingDocumentsApi";

/**
 * Printing/downloading a booking's contract (PDF), a browser preview of
 * the same contract, or the itemized road-sign price list (DOCX) - all
 * three now go through a signed link obtained from an authenticated,
 * permission-gated endpoint (see BookingDocumentController) rather than
 * the old fully-public routes. Once the signed `url` comes back, it's
 * opened directly - no manual Bearer-header fetch is needed for the
 * document itself, since the signature is what authorizes it.
 */
export const useBookingDocuments = () => {
  const [loadingAction, setLoadingAction] = useState(null);

  const [fetchContractPdfLink] = useLazyGetContractPdfLinkQuery();
  const [fetchContractViewLink] = useLazyGetContractViewLinkQuery();
  const [fetchRoadSignListLink] = useLazyGetRoadSignListLinkQuery();

  const openSignedLink = useCallback(async (trigger, bookingId, actionKey, errorLabel) => {
    if (!bookingId) {
      toast.error("رقم الحجز مطلوب");
      return;
    }
    setLoadingAction(actionKey);
    try {
      const result = await trigger(bookingId).unwrap();
      const win = window.open(result.url, "_blank");
      if (!win) {
        toast.error("الرجاء السماح للنوافذ المنبثقة لعرض المستند");
      }
    } catch (error) {
      toast.error(error?.data?.message || `تعذر ${errorLabel}`);
    } finally {
      setLoadingAction(null);
    }
  }, []);

  const openContractPdf = useCallback(
    (bookingId) => openSignedLink(fetchContractPdfLink, bookingId, "contract-pdf", "تحميل العقد"),
    [fetchContractPdfLink, openSignedLink]
  );

  const openContractView = useCallback(
    (bookingId) => openSignedLink(fetchContractViewLink, bookingId, "contract-view", "معاينة العقد"),
    [fetchContractViewLink, openSignedLink]
  );

  const openRoadSignList = useCallback(
    (bookingId) => openSignedLink(fetchRoadSignListLink, bookingId, "roadsign-list", "تحميل قائمة اللوحات"),
    [fetchRoadSignListLink, openSignedLink]
  );

  return {
    openContractPdf,
    openContractView,
    openRoadSignList,
    loadingAction, // "contract-pdf" | "contract-view" | "roadsign-list" | null
  };
};

export default useBookingDocuments;
