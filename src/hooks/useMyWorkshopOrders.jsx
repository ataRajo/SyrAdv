import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import {
  useGetMyWorkshopOrdersQuery,
  useGetMyWorkshopSizeBreakdownQuery,
  useGetMyWorkshopDailySummaryQuery,
  useGetMyWorkshopAchievementsQuery,
  useReceiveWorkshopOrderMutation,
  useCompleteWorkshopOrderMutation,
} from "../RtkQuery/Slice/Workshops/WorkshopsApi";

/**
 * كل ما يحتاجه عامل الورشة (دور 'workshop') في تبويبَي "أوامري" و"إنجازي" -
 * منفصل عمدًا عن useWorkshops() (تلك للوحة الإدارية/مسؤول الورشة، صلاحيات
 * مختلفة تمامًا). راجع DEVELOPER_GUIDE.md، الجزء الثامن.
 */
export const useMyWorkshopOrders = () => {
  const [orderFilters, setOrderFilters] = useState({});
  // الباك-إند يُرجِع الآن { orders, activeRegions } لا مصفوفة مباشرة - قفل
  // المنطقة (طلب صريح): activeRegions هي المنطقة/المناطق التي لدى هذا
  // الفاعل بعينه (مدير الورشة يعمل كعامل، أو عامل عادي - المسار نفسه) فيها
  // أوامر مُستلَمة ولم تُنفَّذ بعد. راجع WorkshopsApi.jsx وMyOrdersTab.jsx.
  const { data: { orders: myOrders = [], activeRegions = [] } = {}, isFetching: isFetchingMyOrders } =
    useGetMyWorkshopOrdersQuery(orderFilters);

  const { data: sizeBreakdown, isFetching: isFetchingSizeBreakdown } =
    useGetMyWorkshopSizeBreakdownQuery();

  const { data: dailySummary, isFetching: isFetchingDailySummary } =
    useGetMyWorkshopDailySummaryQuery();

  const [achievementsRange, setAchievementsRange] = useState({});
  const { data: achievements, isFetching: isFetchingAchievements } =
    useGetMyWorkshopAchievementsQuery(achievementsRange);

  const [receiveMutation, { isLoading: isReceiving }] = useReceiveWorkshopOrderMutation();
  const [completeMutation, { isLoading: isCompleting }] = useCompleteWorkshopOrderMutation();

  const receiveOrder = useCallback(
    async (orderId, { facesCount, notes } = {}) => {
      try {
        await receiveMutation({
          orderId,
          ...(facesCount !== undefined && facesCount !== "" ? { faces_count: Number(facesCount) } : {}),
          ...(notes ? { notes } : {}),
        }).unwrap();
        toast.success("تم تسجيل الاستلام");
        return true;
      } catch (error) {
        toast.error(error?.data?.message || "فشل تسجيل الاستلام");
        return false;
      }
    },
    [receiveMutation]
  );

const completeOrder = useCallback(
  async (orderId, { beforePhoto, afterPhoto }) => {
    if (!afterPhoto) {
      toast.error("صورة بعد التنفيذ إجبارية");
      return false;
    }
    const formData = new FormData();
    if (beforePhoto) {
      formData.append("before_photo", beforePhoto);
    }
    formData.append("after_photo", afterPhoto);
    try {
      await completeMutation({ orderId, formData }).unwrap();
      toast.success("تم توثيق التنفيذ بنجاح");
      return true;
    } catch (error) {
      toast.error(error?.data?.message || "فشل توثيق التنفيذ");
      return false;
    }
  },
  [completeMutation]
);

  return {
    myOrders,
    activeRegions,
    isFetchingMyOrders,
    orderFilters,
    setOrderFilters,
    sizeBreakdown,
    isFetchingSizeBreakdown,
    dailySummary,
    isFetchingDailySummary,
    achievements,
    isFetchingAchievements,
    achievementsRange,
    setAchievementsRange,
    receiveOrder,
    isReceiving,
    completeOrder,
    isCompleting,
  };
};
