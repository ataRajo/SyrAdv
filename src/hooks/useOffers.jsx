import { useState, useCallback } from "react";
import {
  useGetOffersQuery,
  useCreateOfferMutation,
  useUpdateOfferMutation,
  useDeleteOfferMutation,
} from "../RtkQuery/Slice/Offers/offersApiSlice";
import toast from "react-hot-toast";

export const useOffers = (initialParams = {}) => {
  const [params, setParams] = useState({
    page: 1,
    per_page: 15,
    search: "",
    active: "",
    expired: "",
    work_type_id: "",
    ...initialParams,
  });

  const [showModal, setShowModal] = useState(false);
  // ← أضيف: العرض الجاري تعديله (null = وضع إضافة عرض جديد)
  const [editingOffer, setEditingOffer] = useState(null);

  // Fetch offers
  const {
    data: offersData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetOffersQuery(params, {
    refetchOnMountOrArgChange: true,
  });

  // Mutations
  const [createOffer, { isLoading: isCreating }] = useCreateOfferMutation();
  const [updateOffer, { isLoading: isUpdating }] = useUpdateOfferMutation();
  const [deleteOffer, { isLoading: isDeleting }] = useDeleteOfferMutation();

  // ===== FILTER HANDLERS =====
  
  const handleSearch = useCallback((searchTerm) => {
    setParams((prev) => ({ ...prev, search: searchTerm, page: 1 }));
  }, []);

  const handleActiveFilter = useCallback((activeValue) => {
    const value = activeValue === "" ? "" : activeValue === "true";
    setParams((prev) => ({ ...prev, active: value, page: 1 }));
  }, []);

  const handleExpiredFilter = useCallback((expiredValue) => {
    const value = expiredValue === "" ? "" : expiredValue === "true";
    setParams((prev) => ({ ...prev, expired: value, page: 1 }));
  }, []);

  // ← أضيف: فلترة العروض حسب نوع العمل، حتى يقدر المستخدم يرجع للعروض
  // اللي عملها لفئة معيّنة من الزبائن (طلب صريح).
  const handleWorkTypeFilter = useCallback((workTypeId) => {
    setParams((prev) => ({ ...prev, work_type_id: workTypeId, page: 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    setParams({
      page: 1,
      per_page: 15,
      search: "",
      active: "",
      expired: "",
      work_type_id: "",
    });
  }, []);

  // ===== MODAL HANDLERS =====

  const openCreateModal = useCallback(() => {
    setEditingOffer(null);
    setShowModal(true);
  }, []);

  // ← أضيف: فتح المودال بوضع التعديل (يشمل إعادة تفعيل عرض منتهي)
  const openEditModal = useCallback((offer) => {
    setEditingOffer(offer);
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingOffer(null);
  }, []);

  // ===== SUBMIT & DELETE =====

  const handleSubmit = useCallback(
    async (formData) => {
      try {
        if (editingOffer) {
          await updateOffer({ id: editingOffer.id, ...formData }).unwrap();
          toast.success("تم تعديل العرض بنجاح");
        } else {
          await createOffer(formData).unwrap();
          toast.success("تم إنشاء العرض بنجاح");
        }
        closeModal();
        refetch();
        return { success: true };
      } catch (err) {
        const errorMessage = err?.data?.message || "حدث خطأ أثناء الحفظ";
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [createOffer, updateOffer, editingOffer, closeModal, refetch]
  );

  // ← أضيف: تفعيل/تعطيل العرض مباشرة من الجدول (بدون فتح المودال) -
  // "يا بفعلو نفسو" من الطلب الأصلي.
  const handleToggleStatus = useCallback(
    async (offer) => {
      const newStatus = offer.status === "active" ? "expired" : "active";
      try {
        await updateOffer({ id: offer.id, status: newStatus }).unwrap();
        toast.success(
          newStatus === "active" ? "تم تفعيل العرض بنجاح" : "تم تعطيل العرض بنجاح"
        );
        refetch();
        return { success: true };
      } catch (err) {
        const errorMessage = err?.data?.message || "فشل في تغيير حالة العرض";
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [updateOffer, refetch]
  );

  const handleDelete = useCallback(
    async (id) => {
      if (!window.confirm("هل أنت متأكد من حذف هذا العرض؟")) return;

      try {
        await deleteOffer(id).unwrap();
        toast.success("تم حذف العرض بنجاح");
        refetch();
        return { success: true };
      } catch (err) {
        const errorMessage = err?.data?.message || "فشل في حذف العرض";
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [deleteOffer, refetch]
  );

  return {
    // Data
    offers: offersData?.offers || [],
    isLoading,
    isFetching,
    error,

    // Modal state
    showModal,
    editingOffer,
    isSubmitting: isCreating || isUpdating,
    isTogglingStatus: isUpdating,

    // Filter state
    filters: {
      search: params.search,
      active: params.active,
      expired: params.expired,
      work_type_id: params.work_type_id,
    },

    // Actions
    setShowModal,
    openCreateModal,
    openEditModal,
    closeModal,
    handleSubmit,
    handleDelete,
    handleToggleStatus,
    handleSearch,
    handleActiveFilter,
    handleExpiredFilter,
    handleWorkTypeFilter,
    clearFilters,
    refetch,
  };
};