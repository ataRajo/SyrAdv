import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ShoppingCart, FileText, Printer, Eye } from "lucide-react";
import {DynamicTable} from "../../utils/Tables/DynamicTable";
import {DialogEditOrders} from "../../utils/Dialogs/EditAddDialog/Edit/DialogEditOrders";
import DialogShow from "../../utils/Dialogs/DialogShow/DialogShow";
import { DeleteDialog } from "../../utils/Dialogs/DeleteDialog/DeleteDialog";
import { OrderFieldsShow } from "../../utils/Dialogs/Data/Show/OrderFieldsShow";
import OrderFilters from "./OrderFilters";
import OrdersHeader from "./OrdersHeader";
import ExportService from "./OrderExportService";
import { useGetCustomersQuery } from "../../RtkQuery/Slice/Customers/CustomersApi";
import useMangeOrders from "../../hooks/useMangeOrders";
import { createEnhancedOrdersColumns } from "../../utils/Tables/ColumnsTable/OrdersColumns";

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

  const exportService = new ExportService();

  useEffect(() => {
    if (data && Array.isArray(data)) {
      const activeOrders = data.filter(order => order.status == 0);
      const unreadOrders = activeOrders.filter(order => !viewedOrderIds.has(order.id));
      setUnreadOrdersCount(unreadOrders.length);
    }
  }, [data, viewedOrderIds]);

  const handleViewDetails = (order) => {
    if (!viewedOrderIds.has(order.id)) {
      setViewedOrderIds(prev => new Set([...prev, order.id]));
      setUnreadOrdersCount(prev => Math.max(0, prev - 1));
    }
    
    setSelectedOrder(order);
    setOpenShow(true);
  };

  const handleDownloadIndividualPDF = async (order) => {
    await exportService.downloadIndividualPDF(order, toast);
  };

  const exportToWord = async () => {
    if (sortedData.length === 0) {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }

    const selectedCustomerName = selectedCustomerId 
      ? customersList.find(c => c.id.toString() === selectedCustomerId.toString())?.company_name || 'عميل'
      : 'جميع العملاء';

    await exportService.exportToWord(sortedData, selectedCustomerName, customersList, toast);
  };

  const generatePDFViaPrint = async () => {
    if (sortedData.length === 0) {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }

    const selectedCustomerName = selectedCustomerId 
      ? customersList.find(c => c.id.toString() === selectedCustomerId.toString())?.company_name || 'عميل'
      : 'جميع العملاء';

    await exportService.generatePDFViaPrint(sortedData, selectedCustomerName, customersList, toast);
  };

  const markAllOrdersAsRead = () => {
    if (data && Array.isArray(data)) {
      const activeOrders = data.filter(order => order.status == 0);
      const allOrderIds = new Set(activeOrders.map(order => order.id));
      setViewedOrderIds(allOrderIds);
      setUnreadOrdersCount(0);
      toast.success("تم تعليم جميع الطلبات كمقروءة");
    }
  };

  const sortedData = useMemo(() => {
    const today = new Date();
    let filteredData = Array.isArray(data) ? data.filter((order) => order.status == 0) : [];
    
    // Filter by customer
    if (selectedCustomerId) {
      filteredData = filteredData.filter(order => {
        if (order.customer_id && order.customer_id.toString() === selectedCustomerId.toString()) {
          return true;
        }
        
        if (order.customer?.id && order.customer.id.toString() === selectedCustomerId.toString()) {
          return true;
        }
        
        if (order.customer_new?.id && order.customer_new.id.toString() === selectedCustomerId.toString()) {
          return true;
        }
        
        return false;
      });
    }
    
    // Filter by order type (فك/تركيب) - FIXED BASED ON YOUR DATA
    if (orderType) {
      filteredData = filteredData.filter(order => {
        // Based on your JSON, type: 1 = فك (release), type: 2 = تركيب (installation)
        if (orderType === "release") {
          // فك orders - type = 1
          return order.type === 1;
        } else if (orderType === "installation") {
          // تركيب orders - type = 2
          return order.type === 2;
        }
        return true;
      });
    }
    
    // Filter by date
    if (selectedDate) {
      filteredData = filteredData.filter(order => {
        const orderDate = new Date(order.action_date);
        const selected = new Date(selectedDate);
        
        return orderDate.getFullYear() === selected.getFullYear() &&
               orderDate.getMonth() === selected.getMonth() &&
               orderDate.getDate() === selected.getDate();
      });
    }
    
    // Filter by city
    if (cityId) {
      filteredData = filteredData.filter(order => 
        order.road_sign?.city?.id?.toString() === cityId.toString() ||
        order.city_id?.toString() === cityId.toString()
      );
    }
    
    // Filter by region
    if (regionId) {
      filteredData = filteredData.filter(order => 
        order.road_sign?.region?.id?.toString() === regionId.toString() ||
        order.region_id?.toString() === regionId.toString()
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
  }, [data, selectedCustomerId, selectedDate, cityId, regionId, orderType]); // Added orderType to dependencies

  // Add order type filter card
  const shouldShowOrderTypeFilter = useMemo(() => {
    return orderType && orderType !== "";
  }, [orderType]);

  const getOrderTypeDisplayValue = useMemo(() => {
    if (orderType === "release") return "فك";
    if (orderType === "installation") return "تركيب";
    return "";
  }, [orderType]);

  // Add debugging to see what's happening
  useEffect(() => {
    console.log("Current orderType filter:", orderType);
    console.log("Filtered data count:", sortedData.length);
    
    if (orderType && data) {
      const allActiveOrders = Array.isArray(data) ? data.filter(order => order.status == 0) : [];
      const releaseOrders = allActiveOrders.filter(order => order.type === 1);
      const installationOrders = allActiveOrders.filter(order => order.type === 2);
      
      console.log("Total active orders:", allActiveOrders.length);
      console.log("Release orders (type=1):", releaseOrders.length);
      console.log("Installation orders (type=2):", installationOrders.length);
    }
  }, [orderType, sortedData, data]);

  // Use the function to create enhanced columns
  const columns = useMemo(() => 
    createEnhancedOrdersColumns(viewedOrderIds, handleViewDetails, handleDownloadIndividualPDF), 
    [viewedOrderIds]
  );

  return (
    <div className="p-4 sm:p-6 max-w-full mx-auto space-y-6 bg-background rounded-lg shadow-sm dark:shadow-gray-800">
      <OrdersHeader 
        unreadOrdersCount={unreadOrdersCount}
        sortedDataLength={sortedData.length}
        exportToWord={exportToWord}
        generatePDFViaPrint={generatePDFViaPrint}
        markAllOrdersAsRead={markAllOrdersAsRead}
      />
      
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
        sortedData={sortedData}
      />
      
      {/* Order Type Filter Card */}
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
      
      <DynamicTable
        data={sortedData}
        columns={columns}
        isLoading={isFetching}
        onEdit={handleEdit}
        onShow={handleShow}
        onConfirmOrder={onConfirmOrder}
        permissions={permission}
        className="bg-card rounded-lg shadow-sm border border-border w-full"
      />
      
      <DialogEditOrders
        show={openEdit}
        handleClose={() => setOpenEdit(false)}
        initData={selectedOrder}
      />
      
      <DialogShow
        show={openShow}
        handleClose={() => {
          setOpenShow(false);
          setSelectedOrder(null);
        }}
        data={selectedOrder}
        fields={OrderFieldsShow}
      />
      
      <DeleteDialog
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        title={isConfirmAction ? "عملية تأكيد الطلب" : "عملية إلغاء تأكيد الطلب"}
        description={`هل تريد ${isConfirmAction ? "تأكيد" : "إلغاء تأكيد"} هذا الطلب؟`}
        confirmText="نعم"
        onConfirm={handleConfirmOrUnconfirm}
        loading={iLoadingConfirm}
        titleLoading={`${isConfirmAction ? "جاري التأكيد " : "جاري إلغاء تأكيد"}`}
      />
    </div>
  );
};

export default OrdersTab;