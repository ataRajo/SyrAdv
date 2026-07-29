import React, { useState, useMemo, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ChevronDown, ChevronUp, Eye, ShoppingCart } from "lucide-react";
import { DialogEditOrders } from "../../utils/Dialogs/EditAddDialog/Edit/DialogEditOrders";
import DialogShow from "../../utils/Dialogs/DialogShow/DialogShow";
import { DeleteDialog } from "../../utils/Dialogs/DeleteDialog/DeleteDialog";
import { OrderFieldsShow } from "../../utils/Dialogs/Data/Show/OrderFieldsShow";
import OrderFilters from "./OrderFilters";
import OrdersHeader from "./OrdersHeader";
import ExportService from "./OrderExportService";
import { useGetCustomersQuery } from "../../RtkQuery/Slice/Customers/CustomersApi";
import useMangeOrders from "../../hooks/useMangeOrders";

// ==================== SUB-COMPONENTS ====================

// Individual Template/Order Row (inside expanded section)
const TemplateRow = ({ order, onConfirm, isConfirmed }) => {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-3">
        {/* Color indicator from template */}
        <div 
          className="w-8 h-8 rounded-md border border-gray-200" 
          style={{ backgroundColor: order.road_sign?.template?.color || '#ccc' }} 
        />
        <div>
          <div className="font-medium text-sm">
            {order.road_sign?.template?.model} - {order.road_sign?.template?.size}
          </div>
          <div className="text-xs text-gray-500">{order.road_sign?.place}</div>
          <div className="text-xs text-gray-400 font-mono">{order.road_sign?.roadsign_code}</div>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500">{order.action_date}</span>
        {isConfirmed ? (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            تم التأكيد
          </Badge>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onConfirm(order.id)}
            className="h-8 px-3 border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            تأكيد
          </Button>
        )}
      </div>
    </div>
  );
};

// فك or تركيب Expandable Section
const OrderTypeSection = ({ 
  type, 
  label, 
  colorClass, 
  orders, 
  expanded, 
  onToggle, 
  onConfirmTemplate,
  onConfirmAll 
}) => {
  if (!orders || orders.length === 0) return null;

  const allConfirmed = orders.every(o => o.status === 1);
  const pendingCount = orders.filter(o => o.status === 0).length;

  return (
    <div className={`border rounded-lg overflow-hidden ${colorClass.border}`}>
      {/* Section Header */}
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${colorClass.bg}`}
      >
        <div className="flex items-center gap-3">
          <span className={`font-bold ${colorClass.text}`}>{label}</span>
          <Badge variant="outline" className="text-xs">
            {orders.length} لوحة
          </Badge>
          {allConfirmed ? (
            <Badge className="bg-green-100 text-green-800 text-xs">
              <CheckCircle className="w-3 h-3 mr-1" />
              تم التأكيد
            </Badge>
          ) : pendingCount > 0 ? (
            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
              {pendingCount} بانتظار التأكيد
            </Badge>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {!allConfirmed && onConfirmAll && (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onConfirmAll(orders.filter(o => o.status === 0).map(o => o.id));
              }}
              className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white text-xs"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              تأكيد الكل
            </Button>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="p-3 space-y-2 bg-white dark:bg-gray-900">
          {orders.map((order) => (
            <TemplateRow
              key={order.id}
              order={order}
              onConfirm={onConfirmTemplate}
              isConfirmed={order.status === 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Booking Card (Level 1)
const BookingCard = ({ booking, onConfirmTemplate, onConfirmAllBatch }) => {
  const [expandedType, setExpandedType] = useState(null); // 'release' | 'installation' | null

  const toggleType = (type) => {
    setExpandedType(expandedType === type ? null : type);
  };

  const releaseOrders = booking.releases || [];
  const installationOrders = booking.installations || [];
  const totalOrders = releaseOrders.length + installationOrders.length;
  const confirmedCount = [...releaseOrders, ...installationOrders].filter(o => o.status === 1).length;

  return (
    <Card className="mb-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge className="bg-blue-100 text-blue-800 font-mono">Booking #{booking.bookingId}</Badge>
            <span className="font-bold text-lg">{booking.customer?.company_name || "عميل غير معروف"}</span>
            {booking.customerNew?.company_name && (
              <span className="text-xs text-green-600">← {booking.customerNew.company_name}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {confirmedCount}/{totalOrders} مؤكد
            </span>
            {confirmedCount === totalOrders && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                مكتمل
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-4">
        {/* فك Section */}
        <OrderTypeSection
          type="release"
          label="فك"
          colorClass={{
            border: "border-red-200 dark:border-red-900",
            bg: "bg-red-50/50 dark:bg-red-900/10",
            text: "text-red-700 dark:text-red-400"
          }}
          orders={releaseOrders}
          expanded={expandedType === 'release'}
          onToggle={() => toggleType('release')}
          onConfirmTemplate={onConfirmTemplate}
          onConfirmAll={(ids) => onConfirmAllBatch(ids, 1)}
        />

        {/* تركيب Section */}
        <OrderTypeSection
          type="installation"
          label="تركيب"
          colorClass={{
            border: "border-green-200 dark:border-green-900",
            bg: "bg-green-50/50 dark:bg-green-900/10",
            text: "text-green-700 dark:text-green-400"
          }}
          orders={installationOrders}
          expanded={expandedType === 'installation'}
          onToggle={() => toggleType('installation')}
          onConfirmTemplate={onConfirmTemplate}
          onConfirmAll={(ids) => onConfirmAllBatch(ids, 2)}
        />
      </CardContent>
    </Card>
  );
};

// ==================== MAIN COMPONENT ====================

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
    confirmOrder,       
    cities,
    regions,
  } = useMangeOrders();

  const { data: customersList = [], isLoading: isLoadingCustomers } = useGetCustomersQuery();
  
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [unreadOrdersCount, setUnreadOrdersCount] = useState(0);
  const [viewedOrderIds, setViewedOrderIds] = useState(new Set());

  const exportService = useMemo(() => new ExportService(), []);

  // ==================== GROUP DATA BY BOOKING_ID ====================
  const bookingGroups = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    const groups = {};

    data.forEach((order) => {
      const bookingId = order.booking_id;
      if (!groups[bookingId]) {
        groups[bookingId] = {
          bookingId,
          customer: order.customer,
          customerNew: order.customer_new,
          releases: [],      // type 1 = فك
          installations: [], // type 2 = تركيب
        };
      }

      if (order.type === 1) {
        groups[bookingId].releases.push(order);
      } else if (order.type === 2) {
        groups[bookingId].installations.push(order);
      }
    });

    return Object.values(groups);
  }, [data]);

  // ==================== FILTER & SORT ====================
  const filteredGroups = useMemo(() => {
    let result = [...bookingGroups];
    const today = new Date();

    // Filter by order type (show bookings that have this type)
    if (orderType) {
      if (orderType === "release") {
        result = result.filter(b => b.releases.length > 0);
      } else if (orderType === "installation") {
        result = result.filter(b => b.installations.length > 0);
      }
    }

    // Filter by customer
    if (selectedCustomerId) {
      const customerIdStr = selectedCustomerId.toString();
      result = result.filter(b => 
        b.customer?.id?.toString() === customerIdStr ||
        b.customerNew?.id?.toString() === customerIdStr
      );
    }

    // Filter by city
    if (cityId) {
      const cityIdStr = cityId.toString();
      result = result.filter(b => 
        b.releases.some(o => o.road_sign?.city?.id?.toString() === cityIdStr) ||
        b.installations.some(o => o.road_sign?.city?.id?.toString() === cityIdStr)
      );
    }

    // Filter by region
    if (regionId) {
      const regionIdStr = regionId.toString();
      result = result.filter(b => 
        b.releases.some(o => o.road_sign?.region?.id?.toString() === regionIdStr) ||
        b.installations.some(o => o.road_sign?.region?.id?.toString() === regionIdStr)
      );
    }

    // Filter by date
    if (selectedDate) {
      const selected = new Date(selectedDate);
      const selectedYear = selected.getFullYear();
      const selectedMonth = selected.getMonth();
      const selectedDay = selected.getDate();
      
      result = result.filter(b => {
        const allOrders = [...b.releases, ...b.installations];
        return allOrders.some(order => {
          const orderDate = new Date(order.action_date);
          return (
            orderDate.getFullYear() === selectedYear &&
            orderDate.getMonth() === selectedMonth &&
            orderDate.getDate() === selectedDay
          );
        });
      });
    }

    // Sort by closest action date to today
    return result.sort((a, b) => {
      const getMinDiff = (booking) => {
        const allDates = [...booking.releases, ...b.installations].map(o => new Date(o.action_date));
        const diffs = allDates.map(d => Math.abs(d - today));
        return Math.min(...diffs);
      };
      return getMinDiff(a) - getMinDiff(b);
    });
  }, [bookingGroups, orderType, selectedCustomerId, cityId, regionId, selectedDate]);

  // ==================== UNREAD COUNT ====================
  useEffect(() => {
    if (data && Array.isArray(data)) {
      const unreadCount = data.filter(order => order.status === 0 && !viewedOrderIds.has(order.id)).length;
      setUnreadOrdersCount(unreadCount);
    }
  }, [data, viewedOrderIds]);

  // ==================== HANDLERS ====================
  
const handleConfirmTemplate = useCallback(async (orderId) => {
    try {
      await confirmOrder({ status: 1, id: [orderId] }).unwrap();
      toast.success("تم تأكيد الطلب بنجاح");
    } catch (err) {
      toast.error(err.data?.message || "خطأ في التأكيد");
    }
  }, [confirmOrder]);


  const handleConfirmAllBatch = useCallback(async (orderIds, type) => {
    if (!orderIds || orderIds.length === 0) return;
    try {
      await confirmOrder({ status: 1, id: orderIds }).unwrap();
      toast.success(`تم تأكيد ${orderIds.length} طلب بنجاح`);
    } catch (err) {
      toast.error(err.data?.message || "خطأ في التأكيد الدفعة");
    }
  }, [confirmOrder]);

  const exportToWord = useCallback(async () => {
    if (filteredGroups.length === 0) {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }
    const selectedCustomerName = selectedCustomerId 
      ? customersList.find(c => c.id.toString() === selectedCustomerId.toString())?.company_name || 'عميل'
      : 'جميع العملاء';
    
    // ✅ Flatten grouped data back to individual orders
    const flatOrders = filteredGroups.flatMap(group => [
      ...group.releases,
      ...group.installations
    ]);
    
    await exportService.exportToWord(flatOrders, selectedCustomerName, customersList, toast);
  }, [filteredGroups, selectedCustomerId, customersList, exportService]);
  const generatePDFViaPrint = useCallback(async () => {
    if (filteredGroups.length === 0) {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }
    const selectedCustomerName = selectedCustomerId 
      ? customersList.find(c => c.id.toString() === selectedCustomerId.toString())?.company_name || 'عميل'
      : 'جميع العملاء';
    
    // ✅ Flatten grouped data back to individual orders
    const flatOrders = filteredGroups.flatMap(group => [
      ...group.releases,
      ...group.installations
    ]);
    
    await exportService.generatePDFViaPrint(flatOrders, selectedCustomerName, customersList, toast);
  }, [filteredGroups, selectedCustomerId, customersList, exportService]);
  const markAllOrdersAsRead = useCallback(() => {
    if (data && Array.isArray(data)) {
      const allOrderIds = new Set(data.map(order => order.id));
      setViewedOrderIds(allOrderIds);
      setUnreadOrdersCount(0);
      toast.success("تم تعليم جميع الطلبات كمقروءة");
    }
  }, [data]);

  // ==================== RENDER ====================

  const shouldShowOrderTypeFilter = useMemo(() => {
    return orderType && orderType !== "";
  }, [orderType]);

  const getOrderTypeDisplayValue = useMemo(() => {
    if (orderType === "release") return "فك";
    if (orderType === "installation") return "تركيب";
    return "";
  }, [orderType]);

  return (
    <div className="p-4 sm:p-6 max-w-full mx-auto space-y-6 bg-background rounded-lg shadow-sm dark:shadow-gray-800">
      {/* Header */}
      <OrdersHeader 
        unreadOrdersCount={unreadOrdersCount}
        sortedDataLength={filteredGroups.length}
        exportToWord={exportToWord}
        generatePDFViaPrint={generatePDFViaPrint}
        markAllOrdersAsRead={markAllOrdersAsRead}
      />
      
      {/* Filters */}
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
        sortedDataLength={filteredGroups.length}
      />
      
      {/* Active Filter Badge */}
      {shouldShowOrderTypeFilter && (
        <div className="mb-4 p-4 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 border border-rose-200 dark:border-gray-700 rounded-lg shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 dark:bg-opacity-30 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
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
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOrderType("")}
              className="text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 border border-red-200 px-3 py-2 rounded-lg"
            >
              إزالة التصفية
            </Button>
          </div>
        </div>
      )}
      
      {/* Booking Cards List */}
      {isFetching ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">جاري التحميل...</p>
        </div>
      ) : filteredGroups.length > 0 ? (
        <div className="space-y-4">
          {filteredGroups.map((booking) => (
            <BookingCard
              key={booking.bookingId}
              booking={booking}
              onConfirmTemplate={handleConfirmTemplate}
              onConfirmAllBatch={handleConfirmAllBatch}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          لا يوجد طلبات متوفرة
        </div>
      )}
      
      {/* Dialogs */}
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
export default React.memo(OrdersTab);