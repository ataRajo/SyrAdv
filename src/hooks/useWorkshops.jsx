import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  useGetWorkshopsQuery,
  useAddWorkshopMutation,
  useUpdateWorkshopMutation,
  useDeleteWorkshopMutation,
  useAssignOrdersToWorkshopMutation,
  useGetOrdersNeedingReassignmentQuery,
  useReassignOrdersToWorkshopMutation,
  useGetWorkshopActivityFeedQuery,
  useLazyGetWorkshopWeeklyReportQuery,
  useGetAllWorkshopsWeeklyReportQuery,
  useGetMyWorkshopTeamMembersQuery,
  useAssignOrdersToWorkerMutation,
} from "../RtkQuery/Slice/Workshops/WorkshopsApi";
import { useGetOrdersQuery } from "../RtkQuery/Slice/Orders/OrdersApi";
import { useGetUsersQuery } from "../RtkQuery/Slice/Users/UsersApi";

/**
 * كل ما تحتاجه واجهة "مسؤول الورشة" (لوحة React) في مكان واحد - نفس نمط
 * useAccounting(). راجع DEVELOPER_GUIDE.md، الجزء الثالث والرابع، لسياق كل
 * نقطة API هنا.
 */
export const useWorkshops = () => {
  // ---- إدارة الورشات (CRUD) ----------------------------------------------
  const [workshopDialogOpen, setWorkshopDialogOpen] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState(null);
  const [deleteWorkshopTarget, setDeleteWorkshopTarget] = useState(null);

  const { data: workshops = [], isFetching: isFetchingWorkshops } = useGetWorkshopsQuery({});

  const [addWorkshopMutation, { isLoading: isAddingWorkshop }] = useAddWorkshopMutation();
  const [updateWorkshopMutation, { isLoading: isUpdatingWorkshop }] = useUpdateWorkshopMutation();
  const [deleteWorkshopMutation, { isLoading: isDeletingWorkshop }] = useDeleteWorkshopMutation();

  // تُعيد الورشة المحفوظة نفسها (لا true/false فقط) - طلب العميل: إسناد
  // مدير الورشة مباشرة من نموذج الورشة يحتاج معرف الورشة الجديدة فور
  // إنشائها (لضبط users.workshop_id للمدير المختار) - راجع WorkshopsListTab.
  const saveWorkshop = useCallback(
    async (data) => {
      try {
        let workshop;
        if (editingWorkshop) {
          const result = await updateWorkshopMutation({ id: editingWorkshop.id, ...data }).unwrap();
          workshop = result?.data ?? { id: editingWorkshop.id, ...data };
          toast.success("تم تحديث بيانات الورشة بنجاح");
        } else {
          const result = await addWorkshopMutation(data).unwrap();
          workshop = result?.data;
          toast.success("تم إنشاء الورشة بنجاح");
        }
        setWorkshopDialogOpen(false);
        setEditingWorkshop(null);
        return workshop ?? true;
      } catch (error) {
        toast.error(error?.data?.message || "فشل حفظ بيانات الورشة");
        return false;
      }
    },
    [editingWorkshop, addWorkshopMutation, updateWorkshopMutation]
  );

  const confirmDeleteWorkshop = useCallback(async () => {
    if (!deleteWorkshopTarget) return;
    try {
      await deleteWorkshopMutation(deleteWorkshopTarget.id).unwrap();
      toast.success("تم حذف الورشة بنجاح");
      setDeleteWorkshopTarget(null);
    } catch (error) {
      // رسالة الباك-إند الشارحة (مثال: "لديها أوامر غير منفَّذة بعد") تصل هنا حرفيًا.
      toast.error(error?.data?.message || "فشل حذف الورشة");
    }
  }, [deleteWorkshopTarget, deleteWorkshopMutation]);

  // ---- إسناد الأوامر الصباحي ----------------------------------------------
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [assignTargetWorkshopId, setAssignTargetWorkshopId] = useState("");

  // الأوامر غير المؤكَّدة بعد (status=false) هي المرشَّح الطبيعي للإسناد -
  // نفس فلتر تبويب "الطلبات الحالية" الموجود أصلًا في OrdersTab.jsx.
  const { data: unassignedOrdersRaw = [], isFetching: isFetchingUnassignedOrders } =
    useGetOrdersQuery({ status: false });

  const assignableOrders = useMemo(
    () => (Array.isArray(unassignedOrdersRaw) ? unassignedOrdersRaw.filter((o) => !o.workshop_id) : []),
    [unassignedOrdersRaw]
  );

  const toggleOrderSelection = useCallback((orderId) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  }, []);

  const [assignOrdersMutation, { isLoading: isAssigningOrders }] = useAssignOrdersToWorkshopMutation();

  const assignSelectedOrders = useCallback(async () => {
    if (!assignTargetWorkshopId || selectedOrderIds.length === 0) {
      toast.error("اختر ورشة وأمرًا واحدًا على الأقل");
      return false;
    }
    try {
      const result = await assignOrdersMutation({
        workshop_id: Number(assignTargetWorkshopId),
        order_ids: selectedOrderIds,
      }).unwrap();
      const assignedCount = result?.data?.assigned ?? selectedOrderIds.length;
      toast.success(`تم إسناد ${assignedCount} أمر للورشة بنجاح`);
      setSelectedOrderIds([]);
      return true;
    } catch (error) {
      toast.error(error?.data?.message || "فشل إسناد الأوامر");
      return false;
    }
  }, [assignTargetWorkshopId, selectedOrderIds, assignOrdersMutation]);

  // ---- إعادة إسناد الأوامر المتأخرة (طلب صريح) -----------------------------
  // "عندما العامل يستلم طلبات ولم ينفذها كلها (للساعة 7 مساءً بتوقيت
  // سوريا) يجب اعادة فرز الطلبات واسنادها لورشات جديدة أو لنفس الورشة
  // (على حسب قرار الإدمن)". الباك-إند يُعلِّم هذه الأوامر تلقائيًا
  // (needs_reassignment_at، أمر جدولة 19:00 دمشق) - هنا فقط جلب القائمة
  // وتنفيذ قرار المسؤول.
  const { data: reassignmentOrders = [], isFetching: isFetchingReassignmentOrders } =
    useGetOrdersNeedingReassignmentQuery();

  const [selectedReassignmentOrderIds, setSelectedReassignmentOrderIds] = useState([]);
  const [reassignTargetWorkshopId, setReassignTargetWorkshopId] = useState("");

  const toggleReassignmentOrderSelection = useCallback((orderId) => {
    setSelectedReassignmentOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  }, []);

  const [reassignOrdersMutation, { isLoading: isReassigningOrders }] =
    useReassignOrdersToWorkshopMutation();

  const reassignSelectedOrders = useCallback(async () => {
    if (!reassignTargetWorkshopId || selectedReassignmentOrderIds.length === 0) {
      toast.error("اختر ورشة (نفس الورشة أو ورشة جديدة) وأمرًا واحدًا على الأقل");
      return false;
    }
    try {
      const result = await reassignOrdersMutation({
        workshop_id: Number(reassignTargetWorkshopId),
        order_ids: selectedReassignmentOrderIds,
      }).unwrap();
      const count = result?.data?.reassigned ?? selectedReassignmentOrderIds.length;
      toast.success(`تمت إعادة إسناد ${count} أمر بنجاح`);
      setSelectedReassignmentOrderIds([]);
      return true;
    } catch (error) {
      toast.error(error?.data?.message || "فشلت إعادة إسناد الأوامر");
      return false;
    }
  }, [reassignTargetWorkshopId, selectedReassignmentOrderIds, reassignOrdersMutation]);

  // ---- مدير الورشة: فريقه وإسناد أوامر لعامل بعينه -------------------------
  // منفصل عمدًا عن assignSelectedOrders أعلاه (ذاك يُسنِد لورشة كاملة
  // كفريق، هذا يُسنِد لعامل بعينه ضمن ورشة المدير نفسه). راجع
  // DEVELOPER_GUIDE.md، الجزء الثاني عشر.
  const { data: myTeamMembers = [] } = useGetMyWorkshopTeamMembersQuery();

  // استعلام مستقل بفلتر status=pending ثابت (وليس مربوطًا بـ activityFilters
  // أعلاه/أدناه، التي يُغيّرها تبويب "بث الإنجاز الحي" بحرية) - قائمة أوامر
  // ورشتي التي لم تُنفَّذ بعد بعد بصرف النظر عن مُسنَدها الحالي، مصدر
  // بيانات تبويب "إسناد لعامل".
  const { data: assignableTeamOrdersResponse, isFetching: isFetchingAssignableTeamOrders } =
    useGetWorkshopActivityFeedQuery({ status: "pending", per_page: 100 });
  const assignableTeamOrders = assignableTeamOrdersResponse?.data ?? [];

  const [workerAssignTargetId, setWorkerAssignTargetId] = useState("");
  const [selectedTeamOrderIds, setSelectedTeamOrderIds] = useState([]);

  const [assignToWorkerMutation, { isLoading: isAssigningToWorker }] =
    useAssignOrdersToWorkerMutation();

  const toggleTeamOrderSelection = useCallback((orderId) => {
    setSelectedTeamOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  }, []);

  const assignSelectedOrdersToWorker = useCallback(async () => {
    if (!workerAssignTargetId || selectedTeamOrderIds.length === 0) {
      toast.error("اختر عاملًا وأمرًا واحدًا على الأقل");
      return false;
    }
    try {
      const result = await assignToWorkerMutation({
        worker_id: Number(workerAssignTargetId),
        order_ids: selectedTeamOrderIds,
      }).unwrap();
      const assignedCount = result?.data?.assigned ?? selectedTeamOrderIds.length;
      toast.success(`تم إسناد ${assignedCount} أمر للعامل بنجاح`);
      setSelectedTeamOrderIds([]);
      return true;
    } catch (error) {
      toast.error(error?.data?.message || "فشل إسناد الأوامر للعامل");
      return false;
    }
  }, [workerAssignTargetId, selectedTeamOrderIds, assignToWorkerMutation]);

  // ---- بث الإنجاز الحي (Activity Feed) ------------------------------------
  // قائمة عمال الورشات (دور 'workshop') - لفلترة "من استلم"/"من نفَّذ" -
  // طلب صريح: "شوف الطلبات مين العمال يلي مستلمين الطلبات بالتفصيل".
  // نفس مصدر البيانات المُستخدَم أصلًا في WorkshopsListTab's MembersDialog.
  const { data: allUsersForFilter = [] } = useGetUsersQuery();
  const workshopWorkers = useMemo(
    () => allUsersForFilter.filter((u) => (u.roles ?? []).some((r) => r.name === "workshop")),
    [allUsersForFilter]
  );

  const [activityFilters, setActivityFilters] = useState({});
  const { data: activityFeedResponse, isFetching: isFetchingActivityFeed } =
    useGetWorkshopActivityFeedQuery(activityFilters, {
      // استفتاء دوري كل 30 ثانية - بديل بسيط لعدم وجود WebSocket مُهيَّأ
      // (موثَّق في DEVELOPER_GUIDE.md كقرار مقصود).
      pollingInterval: 30000,
    });
  const activityFeed = activityFeedResponse?.data ?? [];

  // ---- تقرير المكافآت الأسبوعي --------------------------------------------
  const [weeklyReportWeekStart, setWeeklyReportWeekStart] = useState("");
  const { data: allWorkshopsWeeklyReport, isFetching: isFetchingWeeklyReport } =
    useGetAllWorkshopsWeeklyReportQuery(weeklyReportWeekStart || undefined);

  const [triggerSingleWorkshopReport, { isFetching: isFetchingSingleWorkshopReport }] =
    useLazyGetWorkshopWeeklyReportQuery();

  const getSingleWorkshopReport = useCallback(
    async (id) => {
      try {
        const result = await triggerSingleWorkshopReport({ id, week_start: weeklyReportWeekStart || undefined }).unwrap();
        return result;
      } catch (error) {
        toast.error(error?.data?.message || "فشل جلب تقرير الورشة");
        return null;
      }
    },
    [triggerSingleWorkshopReport, weeklyReportWeekStart]
  );

  return {
    // CRUD
    workshops,
    isFetchingWorkshops,
    workshopDialogOpen,
    setWorkshopDialogOpen,
    editingWorkshop,
    setEditingWorkshop,
    saveWorkshop,
    isAddingWorkshop,
    isUpdatingWorkshop,
    deleteWorkshopTarget,
    setDeleteWorkshopTarget,
    confirmDeleteWorkshop,
    isDeletingWorkshop,

    // Assign
    assignableOrders,
    isFetchingUnassignedOrders,
    selectedOrderIds,
    toggleOrderSelection,
    setSelectedOrderIds,
    assignTargetWorkshopId,
    setAssignTargetWorkshopId,
    assignSelectedOrders,
    isAssigningOrders,

    // إعادة إسناد الأوامر المتأخرة
    reassignmentOrders,
    isFetchingReassignmentOrders,
    selectedReassignmentOrderIds,
    toggleReassignmentOrderSelection,
    setSelectedReassignmentOrderIds,
    reassignTargetWorkshopId,
    setReassignTargetWorkshopId,
    reassignSelectedOrders,
    isReassigningOrders,

    // Activity feed
    activityFeed,
    isFetchingActivityFeed,
    activityFilters,
    setActivityFilters,
    workshopWorkers,

    // Workshop manager: team + assign-to-worker
    myTeamMembers,
    assignableTeamOrders,
    isFetchingAssignableTeamOrders,
    workerAssignTargetId,
    setWorkerAssignTargetId,
    selectedTeamOrderIds,
    toggleTeamOrderSelection,
    setSelectedTeamOrderIds,
    assignSelectedOrdersToWorker,
    isAssigningToWorker,

    // Weekly report
    allWorkshopsWeeklyReport,
    isFetchingWeeklyReport,
    weeklyReportWeekStart,
    setWeeklyReportWeekStart,
    getSingleWorkshopReport,
    isFetchingSingleWorkshopReport,
  };
};
