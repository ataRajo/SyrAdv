import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { showToast } from '../utils/Notifictions/showToast';
import { useDeleteTemplateMutation, useGetTemplatesQuery } from '../RtkQuery/Slice/Template/TemplateApi';
import { Permissions } from '../Static/StaticData';

const useTemplates = () => {
  const { id } = useParams();
  const { data, isLoading, isSuccess } = useGetTemplatesQuery(id);
  const [show, setShow] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openShow, setOpenShow] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [deleteTemplate, { isLoading: isDeleting }] =
    useDeleteTemplateMutation();
  const navigate = useNavigate();

  const [initData, setInitDat] = useState({});

  // Redirects if no data is found
  useEffect(() => {
    if (data?.length === 0) {
      navigate("/dashboard/models");
    }
  }, [data, navigate]); // Added navigate to dependencies

  // Handles opening the edit modal
  const handleEdit = useCallback((template) => {
    setSelectedTemplate(template);
    setInitDat(template);
    setOpenEdit(true);
  }, []); // Setters are stable

  // Handles opening the delete confirmation modal
  const handleDelete = useCallback((template) => {
    setSelectedTemplate(template);
    setOpenDelete(true);
  }, []); // Setters are stable

  // Handles opening the view modal
  const handleShow = useCallback((template) => {
    setSelectedTemplate(template);
    setOpenShow(true);
  }, []); // Setters are stable

  // Confirms and executes template deletion
  const handleConfirmDelete = useCallback(async () => {
    if (selectedTemplate) {
      try {
        await deleteTemplate(selectedTemplate.id).unwrap();
        setOpenDelete(false);
        setSelectedTemplate(null);
        // Assuming showToast is globally available or imported
        // If not, ensure it's imported or handled appropriately
        showToast("success", "تم الحذف بنجاح");
      } catch (error) {
        showToast("error", error); // Assuming error can be directly passed to showToast
      }
    }
  }, [selectedTemplate, deleteTemplate]); // Dependencies for useCallback

  const permissions = {
    delete: Permissions.DeleteRoadSigns,
    show: Permissions.ViewTemplates,
    edit: Permissions.EditTemplates,
  };

  return {
    id,
    data,
    isLoading,
    isSuccess,
    show,
    setShow,
    openDelete,
    setOpenDelete,
    openEdit,
    setOpenEdit,
    openShow,
    setOpenShow,
    selectedTemplate,
    setSelectedTemplate,
    isDeleting,
    initData,
    setInitDat,
    handleEdit,
    handleDelete,
    handleShow,
    handleConfirmDelete,
    permissions,
  };
};

export default useTemplates;