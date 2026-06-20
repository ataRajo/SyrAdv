import { useState, useCallback } from "react";
import {
  useGetOffersQuery,
  useCreateOfferMutation,
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
    ...initialParams,
  });

  const [showModal, setShowModal] = useState(false);

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

  const clearFilters = useCallback(() => {
    setParams({
      page: 1,
      per_page: 15,
      search: "",
      active: "",
      expired: "",
    });
  }, []);

  // ===== MODAL HANDLERS =====

  const openCreateModal = useCallback(() => {
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
  }, []);

  // ===== SUBMIT & DELETE =====

  const handleSubmit = useCallback(
    async (formData) => {
      try {
        await createOffer(formData).unwrap();
        toast.success("تم إنشاء العرض بنجاح");
        closeModal();
        refetch();
        return { success: true };
      } catch (err) {
        const errorMessage = err?.data?.message || "حدث خطأ أثناء الحفظ";
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [createOffer, closeModal, refetch]
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
    isSubmitting: isCreating,

    // Filter state
    filters: {
      search: params.search,
      active: params.active,
      expired: params.expired,
    },

    // Actions
    setShowModal,
    openCreateModal,
    closeModal,
    handleSubmit,
    handleDelete,
    handleSearch,
    handleActiveFilter,
    handleExpiredFilter,
    clearFilters,
    refetch,
  };
};