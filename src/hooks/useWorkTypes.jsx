import { useState, useCallback } from "react";
import {
  useGetWorkTypesQuery,
  useAddWorkTypeMutation,
  useUpdateWorkTypeMutation,
  useDeleteWorkTypeMutation,
} from "../RtkQuery/Slice/WorkTypesApi/WorkTypesApi";
import { toast } from "sonner";

export const useWorkTypes = () => {
  const [open, setOpen] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedWorkType, setSelectedWorkType] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: workTypesData,
    isLoading,
    isFetching,
  } = useGetWorkTypesQuery();

  const [addWorkType, { isLoading: isAdding }] = useAddWorkTypeMutation();
  const [updateWorkType, { isLoading: isUpdating }] = useUpdateWorkTypeMutation();
  const [deleteWorkType, { isLoading: isDeleting }] = useDeleteWorkTypeMutation();

  const workTypes = workTypesData?.data || [];

  const filteredWorkTypes = searchQuery
    ? workTypes.filter((wt) =>
        wt.type.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : workTypes;

  const handleAdd = useCallback(
    async (data) => {
      try {
        await addWorkType(data).unwrap();
        toast.success("تم إضافة نوع العمل بنجاح");
        setOpen(false);
        return true;
      } catch (error) {
        toast.error(error?.data?.message || "فشل في إضافة نوع العمل");
        return false;
      }
    },
    [addWorkType]
  );

  const handleEdit = useCallback((workType) => {
    setSelectedWorkType(workType);
    setOpenEdit(true);
  }, []);

  const handleUpdate = useCallback(
    async (data) => {
      try {
        await updateWorkType({ id: selectedWorkType.id, ...data }).unwrap();
        toast.success("تم تحديث نوع العمل بنجاح");
        setOpenEdit(false);
        setSelectedWorkType(null);
        return true;
      } catch (error) {
        toast.error(error?.data?.message || "فشل في تحديث نوع العمل");
        return false;
      }
    },
    [updateWorkType, selectedWorkType]
  );

  const handleDelete = useCallback((workType) => {
    setSelectedWorkType(workType);
    setOpenDelete(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    try {
      await deleteWorkType(selectedWorkType.id).unwrap();
      toast.success("تم حذف نوع العمل بنجاح");
      setOpenDelete(false);
      setSelectedWorkType(null);
      return true;
    } catch (error) {
      toast.error(error?.data?.message || "فشل في حذف نوع العمل");
      return false;
    }
  }, [deleteWorkType, selectedWorkType]);

  return {
    workTypes: filteredWorkTypes,
    isLoading,
    isFetching,
    isAdding,
    isUpdating,
    isDeleting,
    open,
    setOpen,
    openEdit,
    setOpenEdit,
    openDelete,
    setOpenDelete,
    selectedWorkType,
    searchQuery,
    setSearchQuery,
    handleAdd,
    setSelectedWorkType,
    handleEdit,
    handleUpdate,
    handleDelete,
    handleConfirmDelete,
  };
};