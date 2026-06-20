// src/Hooks/useBrokerCustomers.js
import { useState, useCallback, useMemo } from "react";
import { 
  useGetBrokerClientsQuery,
  useAddBrokerCustomerMutation 
} from "../RtkQuery/Slice/mediatorapis/MediatorApi";
import { showToast } from "../utils/Notifictions/showToast";

export const useBrokerCustomers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    full_name: "",
    username: "",
    email: "",
    phone_number: "",
    address: "",
    company_name: "",
    notes: "",
    password: "",
    password_confirmation: "",
  });

  // Fetch clients data
  const { 
    data, 
    isLoading, 
    error, 
    isFetching, 
    refetch 
  } = useGetBrokerClientsQuery({
    page: currentPage,
    per_page: itemsPerPage,
    search: searchTerm,
  });

  // Add customer mutation
  const [addBrokerCustomer, { isLoading: isAdding }] = useAddBrokerCustomerMutation();

  // Memoized data
  const clients = useMemo(() => data?.clients || [], [data]);
  const meta = useMemo(() => data?.meta || { 
    total: 0, 
    current_page: 1, 
    total_pages: 1 
  }, [data]);

  // Handle search
  const handleSearch = useCallback((e) => {
    e.preventDefault();
    setCurrentPage(1);
  }, []);

  // Handle page change
  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= meta.total_pages) {
      setCurrentPage(page);
    }
  }, [meta.total_pages]);

  // Handle items per page change
  const handleItemsPerPageChange = useCallback((value) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  }, []);

  // Handle input change for new customer form
  const handleNewCustomerInputChange = useCallback((field, value) => {
    setNewCustomer(prev => ({ ...prev, [field]: value }));
  }, []);

  // Reset new customer form
  const resetNewCustomerForm = useCallback(() => {
    setNewCustomer({
      full_name: "",
      username: "",
      email: "",
      phone_number: "",
      address: "",
      company_name: "",
      notes: "",
      password: "",
      password_confirmation: "",
    });
  }, []);

  // Open add modal
  const openAddModal = useCallback(() => {
    resetNewCustomerForm();
    setIsAddModalOpen(true);
  }, [resetNewCustomerForm]);

  // Close add modal
  const closeAddModal = useCallback(() => {
    setIsAddModalOpen(false);
    resetNewCustomerForm();
  }, [resetNewCustomerForm]);

  // Add new customer - ACTUAL API CALL
  const addCustomer = useCallback(async () => {
    // Validation
    if (!newCustomer.full_name && !newCustomer.username) {
      showToast("error", "يرجى إدخال اسم العميل أو اسم المستخدم");
      return false;
    }
    
    if (!newCustomer.email) {
      showToast("error", "يرجى إدخال البريد الإلكتروني");
      return false;
    }
    
    if (!newCustomer.phone_number) {
      showToast("error", "يرجى إدخال رقم الهاتف");
      return false;
    }
    
    if (!newCustomer.password) {
      showToast("error", "يرجى إدخال كلمة المرور");
      return false;
    }
    
    if (newCustomer.password !== newCustomer.password_confirmation) {
      showToast("error", "كلمة المرور غير متطابقة");
      return false;
    }
    
    setIsSubmitting(true);
    
    try {
      const customerData = {
        full_name: newCustomer.full_name || "",
        username: newCustomer.username || newCustomer.full_name?.replace(/\s/g, '').toLowerCase() || "",
        email: newCustomer.email,
        phone_number: newCustomer.phone_number,
        address: newCustomer.address || "",
        company_name: newCustomer.company_name || "",
        notes: newCustomer.notes || "",
        password: newCustomer.password,
        password_confirmation: newCustomer.password_confirmation,
      };
      
      console.log("Sending customer data:", customerData);
      
      // ACTUAL API CALL
      const response = await addBrokerCustomer(customerData).unwrap();
      
      console.log("Response from server:", response);
      
      showToast("success", "تم إضافة العميل بنجاح");
      closeAddModal();
      refetch();
      
      return true;
    } catch (error) {
      console.error("Add customer error details:", error);
      const message = error.data?.message || error.message || "فشل في إضافة العميل";
      showToast("error", message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [newCustomer, addBrokerCustomer, closeAddModal, refetch]);

  // Get client initials
  const getClientInitials = useCallback((client) => {
    if (client.name || client.full_name) {
      const name = client.name || client.full_name;
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    if (client.username) {
      return client.username.substring(0, 2).toUpperCase();
    }
    return "CL";
  }, []);

  // Get status badge style
  const getStatusBadge = useCallback((status) => {
    const statusMap = {
      active: { label: "نشط", className: "bg-green-600" },
      inactive: { label: "غير نشط", className: "bg-gray-600" },
      pending: { label: "قيد الانتظار", className: "bg-yellow-600" },
    };
    return statusMap[status] || statusMap.active;
  }, []);

  // Get page numbers for pagination
  const getPageNumbers = useCallback(() => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(meta.total_pages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, meta.total_pages]);

  return {
    // State
    searchTerm,
    setSearchTerm,
    currentPage,
    itemsPerPage,
    isAddModalOpen,
    isSubmitting: isSubmitting || isAdding,
    newCustomer,
    clients,
    meta,
    isLoading: isLoading || isFetching,
    error,
    
    // Actions
    handleSearch,
    goToPage,
    handleItemsPerPageChange,
    handleNewCustomerInputChange,
    openAddModal,
    closeAddModal,
    addCustomer,
    getClientInitials,
    getStatusBadge,
    getPageNumbers,
    refetch,
  };
};