import React, { useState, useMemo, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ShoppingCart, FileText, Printer, Eye } from "lucide-react";
import { DynamicTable } from "../../utils/Tables/DynamicTable";
import { DialogEditOrders } from "../../utils/Dialogs/EditAddDialog/Edit/DialogEditOrders";
import DialogShow from "../../utils/Dialogs/DialogShow/DialogShow";
import { DeleteDialog } from "../../utils/Dialogs/DeleteDialog/DeleteDialog";
import { OrderFieldsShow } from "../../utils/Dialogs/Data/Show/OrderFieldsShow";
import OrderFilters from "./OrderFilters";
import OrdersHeader from "./OrdersHeader";
import ExportService from "./OrderExportService";
import { useGetCustomersQuery } from "../../RtkQuery/Slice/Customers/CustomersApi";
import useMangeOrders from "../../hooks/useMangeOrders";
import { createEnhancedOrdersColumns } from "../../utils/Tables/ColumnsTable/OrdersColumns";

const MemoizedDynamicTable = React.memo(({ data, columns, ...props }) => {
  const memoizedData = useMemo(() => data, [JSON.stringify(data)]);
  const memoizedColumns = useMemo(() => columns, [JSON.stringify(columns)]);
  
  return (
    <DynamicTable
      data={memoizedData}
      columns={memoizedColumns}
      {...props}
    />
  );
});

// Create a memoized OrdersHeader
const MemoizedOrdersHeader = React.memo(({ 
  unreadOrdersCount, 
  sortedDataLength, 
  exportToWord, 
  generatePDFViaPrint, 
  markAllOrdersAsRead 
}) => (
  <OrdersHeader 
    unreadOrdersCount={unreadOrdersCount}
    sortedDataLength={sortedDataLength}
    exportToWord={exportToWord}
    generatePDFViaPrint={generatePDFViaPrint}
    markAllOrdersAsRead={markAllOrdersAsRead}
  />
));

// Create a memoized OrderFilters
const MemoizedOrderFilters = React.memo(({
  selectedCustomerId,
  setSelectedCustomerId,
  orderType,
  setOrderType,
  selectedDate,
  setSelectedDate,
  cityId,
  setCityId,
  regionId,
  setRegionId,
  customersList,
  isLoadingCustomers,
  cities,
  regions,
  isCitiesLoading,
  sortedDataLength // Changed from sortedData to sortedDataLength
}) => (
  <OrderFilters 
    selectedCustomerId={selectedCustomerId}
    setSelectedCustomerId={setSelectedCustomerId}
    orderType={orderType}
    setOrderType={setOrderType}
    selectedDate={selectedDate}
    setSelectedDate={setSelectedDate}
    cityId={cityId}
    setCityId={setCityId}
    regionId={regionId}
    setRegionId={setRegionId}
    customersList={customersList}
    isLoadingCustomers={isLoadingCustomers}
    cities={cities}
    regions={regions}
    isCitiesLoading={isCitiesLoading}
    sortedDataLength={sortedDataLength}
  />
));

const OrdersTab = ({ data, permission }) => {
  const {
    orderType,
    setOrderType,
    cityId,
    setCityId,
    regionId,
    setRegionId,
    isCitiesLoading,
    isFetching,
    iLoadingConfirm,
    openShow,
    setOpenShow,
    openConfirm,
    setOpenConfirm,
    openEdit,
    setOpenEdit,
    isConfirmAction,
    selectedOrder,
    setSelectedOrder,
    handleEdit,
    handleShow,
    handleConfirmOrUnconfirm,
    onConfirmOrder,
    cities,
    regions,
  } = useMangeOrders();

  const { data: customersList = [], isLoading: isLoadingCustomers } = useGetCustomersQuery();
  
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [unreadOrdersCount, setUnreadOrdersCount] = useState(0);
  const [viewedOrderIds, setViewedOrderIds] = useState(new Set());

  // Memoize the export service
  const exportService = useMemo(() => new ExportService(), []);

  // Optimize sortedData calculation - MUST BE DEFINED BEFORE ANY FUNCTIONS THAT USE IT
  const sortedData = useMemo(() => {
    const today = new Date();
    let filteredData = Array.isArray(data) ? data.filter((order) => order.status == 0) : [];
    
    // Early return if no data
    if (filteredData.length === 0) return [];
    
    // Filter by customer
    if (selectedCustomerId) {
      const customerIdStr = selectedCustomerId.toString();
      filteredData = filteredData.filter(order => {
        return (
          (order.customer_id && order.customer_id.toString() === customerIdStr) ||
          (order.customer?.id && order.customer.id.toString() === customerIdStr) ||
          (order.customer_new?.id && order.customer_new.id.toString() === customerIdStr)
        );
      });
    }
    
    // Filter by order type
    if (orderType) {
      if (orderType === "release") {
        filteredData = filteredData.filter(order => order.type === 1);
      } else if (orderType === "installation") {
        filteredData = filteredData.filter(order => order.type === 2);
      }
    }
    
    // Filter by date
    if (selectedDate) {
      const selected = new Date(selectedDate);
      const selectedYear = selected.getFullYear();
      const selectedMonth = selected.getMonth();
      const selectedDay = selected.getDate();
      
      filteredData = filteredData.filter(order => {
        const orderDate = new Date(order.action_date);
        return (
          orderDate.getFullYear() === selectedYear &&
          orderDate.getMonth() === selectedMonth &&
          orderDate.getDate() === selectedDay
        );
      });
    }
    
    // Filter by city
    if (cityId) {
      const cityIdStr = cityId.toString();
      filteredData = filteredData.filter(order => 
        (order.road_sign?.city?.id?.toString() === cityIdStr) ||
        (order.city_id?.toString() === cityIdStr)
      );
    }
    
    // Filter by region
    if (regionId) {
      const regionIdStr = regionId.toString();
      filteredData = filteredData.filter(order => 
        (order.road_sign?.region?.id?.toString() === regionIdStr) ||
        (order.region_id?.toString() === regionIdStr)
      );
    }
    
    // Sort by closest date to today
    return [...filteredData].sort((a, b) => {
      const dateA = new Date(a.action_date);
      const dateB = new Date(b.action_date);
      const diffA = Math.abs(dateA - today);
      const diffB = Math.abs(dateB - today);
      return diffA - diffB;
    });
  }, [data, selectedCustomerId, selectedDate, cityId, regionId, orderType]);

  // Now define functions that use sortedData
  const exportToWord = useCallback(async () => {
    if (sortedData.length === 0) {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }

    const selectedCustomerName = selectedCustomerId 
      ? customersList.find(c => c.id.toString() === selectedCustomerId.toString())?.company_name || 'عميل'
      : 'جميع العملاء';

    await exportService.exportToWord(sortedData, selectedCustomerName, customersList, toast);
  }, [sortedData, selectedCustomerId, customersList, exportService]);

  const generatePDFViaPrint = useCallback(async () => {
    if (sortedData.length === 0) {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }

    const selectedCustomerName = selectedCustomerId 
      ? customersList.find(c => c.id.toString() === selectedCustomerId.toString())?.company_name || 'عميل'
      : 'جميع العملاء';

    await exportService.generatePDFViaPrint(sortedData, selectedCustomerName, customersList, toast);
  }, [sortedData, selectedCustomerId, customersList, exportService]);

  // Optimize the unread orders calculation
  useEffect(() => {
    if (data && Array.isArray(data)) {
      const activeOrders = data.filter(order => order.status == 0);
      const unreadCount = activeOrders.filter(order => !viewedOrderIds.has(order.id)).length;
      setUnreadOrdersCount(unreadCount);
    }
  }, [data, viewedOrderIds]);

  // Memoize event handlers
  const handleViewDetails = useCallback((order) => {
    if (!viewedOrderIds.has(order.id)) {
      setViewedOrderIds(prev => new Set([...prev, order.id]));
      setUnreadOrdersCount(prev => Math.max(0, prev - 1));
    }
    
    setSelectedOrder(order);
    setOpenShow(true);
  }, [viewedOrderIds, setSelectedOrder, setOpenShow]);

  const handleDownloadIndividualPDF = useCallback(async (order) => {
    await exportService.downloadIndividualPDF(order, toast);
  }, [exportService]);

  const markAllOrdersAsRead = useCallback(() => {
    if (data && Array.isArray(data)) {
      const activeOrders = data.filter(order => order.status == 0);
      const allOrderIds = new Set(activeOrders.map(order => order.id));
      setViewedOrderIds(allOrderIds);
      setUnreadOrdersCount(0);
      toast.success("تم تعليم جميع الطلبات كمقروءة");
    }
  }, [data]);

  // Optimize order type filter display
  const shouldShowOrderTypeFilter = useMemo(() => {
    return orderType && orderType !== "";
  }, [orderType]);

  const getOrderTypeDisplayValue = useMemo(() => {
    if (orderType === "release") return "فك";
    if (orderType === "installation") return "تركيب";
    return "";
  }, [orderType]);

  // Optimize columns creation
  const columns = useMemo(() => 
    createEnhancedOrdersColumns(viewedOrderIds, handleViewDetails, handleDownloadIndividualPDF), 
    [viewedOrderIds, handleViewDetails, handleDownloadIndividualPDF]
  );

  // Memoize Dialog components props
  const dialogEditProps = useMemo(() => ({
    show: openEdit,
    handleClose: () => setOpenEdit(false),
    initData: selectedOrder
  }), [openEdit, selectedOrder]);

  const dialogShowProps = useMemo(() => ({
    show: openShow,
    handleClose: () => {
      setOpenShow(false);
      setSelectedOrder(null);
    },
    data: selectedOrder,
    fields: OrderFieldsShow
  }), [openShow, selectedOrder]);

  const deleteDialogProps = useMemo(() => ({
    open: openConfirm,
    onClose: () => setOpenConfirm(false),
    title: isConfirmAction ? "عملية تأكيد الطلب" : "عملية إلغاء تأكيد الطلب",
    description: `هل تريد ${isConfirmAction ? "تأكيد" : "إلغاء تأكيد"} هذا الطلب؟`,
    confirmText: "نعم",
    onConfirm: handleConfirmOrUnconfirm,
    loading: iLoadingConfirm,
    titleLoading: `${isConfirmAction ? "جاري التأكيد " : "جاري إلغاء تأكيد"}`
  }), [openConfirm, isConfirmAction, iLoadingConfirm, handleConfirmOrUnconfirm]);

  return (
    <div className="p-4 sm:p-6 max-w-full mx-auto space-y-6 bg-background rounded-lg shadow-sm dark:shadow-gray-800">
      <MemoizedOrdersHeader 
        unreadOrdersCount={unreadOrdersCount}
        sortedDataLength={sortedData.length}
        exportToWord={exportToWord}
        generatePDFViaPrint={generatePDFViaPrint}
        markAllOrdersAsRead={markAllOrdersAsRead}
      />
      
      <MemoizedOrderFilters 
        selectedCustomerId={selectedCustomerId}
        setSelectedCustomerId={setSelectedCustomerId}
        orderType={orderType}
        setOrderType={setOrderType}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        cityId={cityId}
        setCityId={setCityId}
        regionId={regionId}
        setRegionId={setRegionId}
        customersList={customersList}
        isLoadingCustomers={isLoadingCustomers}
        cities={cities}
        regions={regions}
        isCitiesLoading={isCitiesLoading}
        sortedDataLength={sortedData.length} // Pass length instead of full array
      />
      
      {shouldShowOrderTypeFilter && (
        <div className="mb-4 p-4 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 border border-rose-200 dark:border-gray-700 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 dark:bg-opacity-30 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    التصفية حسب نوع الطلب:
                  </span>
                  <span className={`px-3 py-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md ${
                    orderType === "release" ? "text-red-700 dark:text-red-300" : "text-green-700 dark:text-green-300"
                  } font-semibold text-sm`}>
                    {getOrderTypeDisplayValue}
                  </span>
                </div>
                {sortedData.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-blue-500/10 dark:bg-blue-500/20 rounded-full text-blue-700 dark:text-blue-300 font-medium text-sm flex items-center gap-1">
                      <ShoppingCart className="w-4 h-4" />
                      {sortedData.length} طلب
                    </span>
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOrderType("")}
              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 group"
            >
              <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              إزالة التصفية
            </Button>
          </div>
        </div>
      )}
      
      <MemoizedDynamicTable
        data={sortedData}
        columns={columns}
        isLoading={isFetching}
        onEdit={handleEdit}
        onShow={handleShow}
        onConfirmOrder={onConfirmOrder}
        permissions={permission}
        className="bg-card rounded-lg shadow-sm border border-border w-full"
      />
      
      <DialogEditOrders {...dialogEditProps} />
      
      <DialogShow {...dialogShowProps} />
      
      <DeleteDialog {...deleteDialogProps} />
    </div>
  );
};

export default React.memo(OrdersTab);