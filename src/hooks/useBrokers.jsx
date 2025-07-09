import React, { useState, useCallback } from "react";
import {
  useDeleteBrokerMutation,
  useGetBrokersQuery,
} from "../RtkQuery/Slice/Brokers/BrokersApi";
import { Permissions } from "../Static/StaticData";

const useBrokers = () => {
  const [open, setOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectBroker, setSelectBroker] = useState({});

  const { data: brokers, isFetching , isLoading} = useGetBrokersQuery(undefined, {
    refetchOnMountOrArgChange: false,
  });

  const [deleteBroker, { isLoading: isDeleting }] = useDeleteBrokerMutation();

  // Handles the edit action for a broker
  const handleEdit = useCallback((row) => {
    if (!row) {
      console.error("No row data provided for edit operation.");
      return;
    }
    setSelectBroker(row);
    setOpenEdit(true);
  }, []);

  // Handles the delete action for a broker
  const handleDelete = useCallback((row) => {
    if (!row) {
      console.error("No row data provided for delete operation.");
      return;
    }
    setSelectBroker(row);
    setOpenDelete(true);
  }, []);

  // Confirms and executes the deletion of the selected broker
  const onConfirmDelete = useCallback(async () => {
    if (selectBroker.id) {
      try {
        await deleteBroker(selectBroker.id).unwrap();
        setOpenDelete(false);
        setSelectBroker({}); // Clear selected broker after deletion
      } catch (error) {
        console.error("Failed to delete broker:", error);
      }
    }
  }, [deleteBroker, selectBroker.id]);

  const permissions = {
    delete: Permissions.DeleteBrokers,
    show: Permissions.ViewBrokers,
    edit: Permissions.EditBrokers,
  };

  return {
    permissions,
    open,
    setOpen,
    openDelete,
    setOpenDelete,
    openEdit,
    setOpenEdit,
    selectBroker,
    setSelectBroker,
    brokers,
    isFetching,
    isDeleting,
    handleEdit,
    handleDelete,
    onConfirmDelete,
    isLoading
  };
};

export default useBrokers;
