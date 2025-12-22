import React, { useEffect, useState } from "react";
import { useDeleteRoadSignMutation } from "../../RtkQuery/Slice/RoadSings/RoadSingsApi";
import { DynamicTable } from "../../utils/Tables/DynamicTable";
import HeaderComponent from "../../utils/HeaderComponent";
import { DialogAddRoadSign } from "../../utils/Dialogs/EditAddDialog/Add/DialogAddRoadSign";
import { DialogEditRoadSign } from "../../utils/Dialogs/EditAddDialog/Edit/DialogEditRoadSign";
import { DeleteDialog } from "../../utils/Dialogs/DeleteDialog/DeleteDialog";
import { RoadSignColumns } from "../../utils/Tables/ColumnsTable/RoadSignColumns";
import { RoadSignFields } from "../../utils/Dialogs/Data/Show/RoadSignFieldsShow";
import DialogShow from "../../utils/Dialogs/DialogShow/DialogShow";
import useGetRoadSignsByFilter from "../../hooks/useGetRoadSignsByFilter";
import RoadSignsPdf from "./RoadSignsPdf";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useParams } from "react-router";
import { Permissions } from "../../Static/StaticData";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useMoveBookingMutation } from "../../RtkQuery/Slice/Booking/BookingApi";
import { useGetCustomersQuery } from "../../RtkQuery/Slice/Customers/CustomersApi"; 

const TableRoadSigns = ({ isLoading }) => {
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [open, setOpen] = useState(false);
  const [openShow, setOpenShow] = useState(false);
  const [openExchange, setOpenExchange] = useState(false);
  const [selectedRoadSign, setSelectedRoadSign] = useState(null);
  const { id } = useParams();

  const [deleteRoadSign, { isLoading: isDeleting }] = useDeleteRoadSignMutation();
  const [moveBooking, { isLoading: isMoving }] = useMoveBookingMutation();

  // Get customers for the dropdown
  const { 
    data: customersData, 
    isLoading: isCustomersLoading,
    error: customersError,
    isSuccess: isCustomersSuccess
  } = useGetCustomersQuery();

  // Debug customers API
  useEffect(() => {
    console.log("📊 Customers API Debug:");
    console.log("📦 customersData:", customersData);
    
    if (customersData) {
      console.log("👥 Customers data structure:", typeof customersData);
      
      // Check if it's an array or has data property
      if (Array.isArray(customersData)) {
        console.log("👥 Customers is array, count:", customersData.length);
      } else if (customersData.data && Array.isArray(customersData.data)) {
        console.log("👥 Customers has data property, count:", customersData.data.length);
      } else if (customersData.customers && Array.isArray(customersData.customers)) {
        console.log("👥 Customers has customers property, count:", customersData.customers.length);
      }
    }
  }, [customersData]);

  // Get hook with ALL filter states including customer_id
  const {
    cityId,
    regionId,
    roadSigns,
    isRoadSignsFetching,
    isError,
    cities,
    isCitiesLoading,
    regions,
    isRegionsLoading,
    setModel,
    handleCityChange,
    handleRegionChange,
    // ✅ Get customer-related values from hook
    customerId, // current customer_id value in hook
    setCustomerId, // function to update customer_id in hook
    handleCustomerChange, // function to handle customer change
  } = useGetRoadSignsByFilter();

  useEffect(() => {
    setModel(id);
  }, [id]);

  // ✅ Debug: Log when API call is made
  useEffect(() => {
    console.log("🔍 API REQUEST DEBUG:");
    console.log("City ID:", cityId);
    console.log("Region ID:", regionId);
    console.log("Customer ID:", customerId);
    console.log("Model:", id);
    console.log("Road Signs Data:", roadSigns);
    console.log("Is Loading:", isRoadSignsFetching);
  }, [cityId, regionId, customerId, id, roadSigns, isRoadSignsFetching]);

  const handleEdit = (roadSign) => {
    setSelectedRoadSign(roadSign);
    setOpenEdit(true);
  };

  const handleDelete = (roadSign) => {
    setSelectedRoadSign(roadSign);
    setOpenDelete(true);
  };

  const handleShow = (roadSign) => {
    setSelectedRoadSign(roadSign);
    setOpenShow(true);
  };

  const handleRoadSignAction = (roadSign) => {
    console.log('Road Sign action triggered:', roadSign);
  };

  const handleExchange = (roadSign) => {
    console.log('Exchange road sign:', roadSign);
    setSelectedRoadSign(roadSign);
    setOpenExchange(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedRoadSign) {
      try {
        await deleteRoadSign(selectedRoadSign.id).unwrap();
        setOpenDelete(false);
        setSelectedRoadSign(null);
      } catch (error) {
        console.error("Failed to delete road sign:", error);
      }
    }
  };

  // ✅ Get customers list from API response
  const getCustomersList = () => {
    if (!customersData) return [];
    
    // Try different response structures
    if (Array.isArray(customersData)) {
      return customersData;
    } else if (customersData.data && Array.isArray(customersData.data)) {
      return customersData.data;
    } else if (customersData.customers && Array.isArray(customersData.customers)) {
      return customersData.customers;
    } else if (customersData.items && Array.isArray(customersData.items)) {
      return customersData.items;
    }
    
    return [];
  };

  const customersList = getCustomersList();
  
  // ✅ Simple handler for customer filter change
  const handleCustomerFilterChange = (e) => {
    const value = e.target.value;
    console.log("🎯 Customer filter changed to:", value);
    
    // Update customer_id in hook (this will trigger API call)
    if (setCustomerId) {
      setCustomerId(value);
    } else {
      console.error("❌ setCustomerId function not found in hook!");
    }
  };

  if (isError) {
    return (
      <div className="text-center p-4 text-red-500">
        حدث خطأ أثناء جلب البيانات
      </div>
    );
  }

  const permissions = {
    delete: Permissions.DeleteRoadSigns,
    show: Permissions.ViewRegions,
    edit: Permissions.EditRoadSigns,
    exchange: Permissions.EditRoadSigns,
  };

  return (
    <div dir="rtl" className="p-4 sm:p-6 w-full mx-auto space-y-6 overflow-x-auto">
      {/* Filter Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* City Filter */}
        <div>
          <Label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
            المدينة
          </Label>
          <select
            id="city"
            value={cityId}
            onChange={handleCityChange}
            disabled={isCitiesLoading}
            className="w-full p-2 border dark:bg-gray-900 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">اختر مدينة</option>
            {isCitiesLoading && <option>جاري تحميل المدن ...</option>}
            {cities?.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </div>

        {/* Region Filter */}
        <div>
          <Label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
            المنطقة
          </Label>
          <select
            id="region"
            value={regionId}
            onChange={handleRegionChange}
            disabled={isRegionsLoading || !cityId}
            className={`w-full ${
              isRegionsLoading || !cityId
                ? `dark:bg-gray-700`
                : `dark:bg-gray-900`
            } p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="">اختر منطقة</option>
            {isRegionsLoading && <option>جاري تحميل المناطق ...</option>}
            {regions?.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
        </div>

        {/* Customer Filter */}
        <div>
          <Label htmlFor="customer" className="block text-sm font-medium text-gray-700 mb-1">
            العميل
          </Label>
          <select
            id="customer"
            value={customerId || ""} // ✅ Use customerId from hook
            onChange={handleCustomerFilterChange}
            disabled={isCustomersLoading}
            className="w-full p-2 border dark:bg-gray-900 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">جميع العملاء</option>
            <option value="none">لوحات بدون حجوزات</option>
            
            {isCustomersLoading && <option>جاري تحميل العملاء ...</option>}
            
            {customersError && <option className="text-red-500">خطأ في تحميل العملاء</option>}
            
            {customersList.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.full_name || customer.name || customer.username || `العميل #${customer.id}`}
                {customer.company_name && ` - ${customer.company_name}`}
              </option>
            ))}
            
            {/* Show message if no customers */}
            {!isCustomersLoading && !customersError && customersList.length === 0 && (
              <option disabled>لا توجد عملاء</option>
            )}
          </select>
          
          {/* Debug info */}
          <div className="mt-1 text-xs text-gray-500">
            {isCustomersLoading ? 'جاري التحميل...' : 
             customersError ? 'خطأ!' : 
             customersList.length > 0 ? `تم تحميل ${customersList.length} عميل` : 'لا توجد بيانات'}
          </div>
        </div>

        {/* Reset Filters Button */}
        <div className="flex items-end">
          <Button
            variant="outline"
            onClick={() => {
              // Reset all filters
              handleCityChange({ target: { value: "" } });
              handleRegionChange({ target: { value: "" } });
              setCustomerId(""); // Reset customer filter
            }}
            className="w-full mb-5 border-gray-300 hover:bg-gray-100"
          >
            مسح الفلاتر
          </Button>
        </div>
      </div>

     

      {/* PDF Export Button */}
      <Button
        onClick={() => {
          const { generatePDF } = RoadSignsPdf({ roadSigns: roadSigns || [] });
          generatePDF();
        }}
        className="mb-6 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        disabled={isRoadSignsFetching || !roadSigns?.length}
      >
        تحميل ملف تموضع اللوحات ({roadSigns?.length || 0})
      </Button>

      <HeaderComponent
        title={"اللوحات الطرقية"}
        titleBtn={"إضافة لوحة"}
        setShow={setOpen}
        permission={Permissions.CreateRoadSigns}
      />

      {/* Road Signs Count */}
      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">عدد اللوحات:</span> {roadSigns?.length || 0}
            {customerId && customerId !== "none" && (
              <span className="mr-4">
                <span className="font-medium"> | تم التصفية حسب العميل:</span> {
                  customersList.find(c => c.id == customerId)?.full_name || `#${customerId}`
                }
              </span>
            )}
            {customerId === "none" && (
              <span className="mr-4">
                <span className="font-medium"> | تم التصفية:</span> لوحات بدون حجوزات
              </span>
            )}
          </div>
        </div>
      </div>

      <DynamicTable
        data={roadSigns}
        columns={RoadSignColumns}
        isLoading={isRoadSignsFetching}
        onEdit={handleEdit}
        onRoadSignAction={handleRoadSignAction}
        onDelete={handleDelete}
        onShow={handleShow}
        onExchange={handleExchange}
        permissions={permissions}
        hideDeleteIcon={true}
      />

      {/* Dialogs */}
      <ExchangeDialog
        open={openExchange}
        onClose={() => setOpenExchange(false)}
        roadSign={selectedRoadSign}
        onMoveBooking={moveBooking}
        roadSigns={roadSigns}
        isMoving={isMoving}
      />

      <DialogEditRoadSign
        show={openEdit}
        handleClose={() => setOpenEdit(false)}
        initData={selectedRoadSign}
      />

      <DialogAddRoadSign
        show={open}
        handleClose={() => setOpen(false)}
      />

      <DeleteDialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
      />

      <DialogShow
        show={openShow}
        handleClose={() => {
          setOpenShow(false);
          setSelectedRoadSign(null);
        }}
        data={selectedRoadSign}
        fields={RoadSignFields}
        loading={isLoading}
      />
    </div>
  );
};

// Helper function for customer filter
const filterRoadSignsByCustomer = (roadSigns, customerId) => {
  if (!customerId || customerId === "") return roadSigns;
  
  if (customerId === "none") {
    // Show road signs without bookings
    return roadSigns.filter(roadSign => 
      !roadSign.bookings || roadSign.bookings.length === 0
    );
  }
  
  // Show road signs with bookings for this specific customer
  return roadSigns.filter(roadSign => {
    return roadSign.bookings?.some(booking => 
      booking.customer_id == customerId
    );
  });
};

const ExchangeDialog = ({ open, onClose, roadSign, roadSigns, onMoveBooking, isMoving }) => {
  const [selectedTargetSign, setSelectedTargetSign] = useState('');
  const [availableTargetSigns, setAvailableTargetSigns] = useState([]);

  const hasActiveBookings = roadSign?.bookings && 
                           roadSign.bookings.some(booking => booking.status === 1);

  const firstActiveBooking = roadSign?.bookings?.find(booking => booking.status === 1);

  useEffect(() => {
    if (open && roadSign && roadSigns) {
      const compatibleSigns = roadSigns.filter(sign => 
        sign.id !== roadSign.id &&
        sign.template_id === roadSign.template_id &&
        (sign.available_date_ranges?.length > 0 || true)
      );
      setAvailableTargetSigns(compatibleSigns);
      setSelectedTargetSign('');
    }
  }, [open, roadSign, roadSigns]);

  const handleExchange = async () => {
    if (!selectedTargetSign || !firstActiveBooking) {
      alert('يرجى اختيار لوحة جديدة للتبديل');
      return;
    }

    try {
      const result = await onMoveBooking({
        booking_id: firstActiveBooking.id,
        old_roadsign_id: roadSign.id,
        new_roadsign_id: selectedTargetSign
      }).unwrap();
      
      console.log('Exchange successful:', result);
      alert('تم تبديل الموقع بنجاح!');
      onClose();
      window.location.reload();
    } catch (error) {
      console.error('Exchange failed:', error);
      alert('فشل تبديل الموقع: ' + (error.data?.message || 'حدث خطأ'));
    }
  };

  if (!roadSign) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center">🔄 تبديل موقع اللوحة</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-3">معلومات اللوحة الحالية</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoField label="اسم اللوحة" value={roadSign.name || `اللوحة #${roadSign.id}`} />
              <InfoField label="الموقع" value={roadSign.place || 'غير محدد'} />
              <InfoField label="المدينة" value={roadSign.city?.name || 'غير محدد'} />
              <InfoField label="المنطقة" value={roadSign.region?.name || 'غير محدد'} />
              <InfoField label="القالب" value={roadSign.template?.model || 'غير محدد'} />
              <InfoField label="الحجوزات النشطة" value={roadSign.bookings?.filter(b => b.status === 1).length || 0} />
            </div>
          </div>

          {!hasActiveBookings ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 font-semibold">
                    هذه اللوحة غير مؤهلة للتبديل
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                    اللوحة يجب أن تحتوي على حجوزات نشطة
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-xl">✅</span>
                <div>
                  <p className="text-sm text-green-800 dark:text-green-300 font-semibold">
                    اللوحة مؤهلة للتبديل
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    {roadSign.bookings.filter(b => b.status === 1).length} حجز نشط
                  </p>
                </div>
              </div>
            </div>
          )}

          {hasActiveBookings && availableTargetSigns.length > 0 && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                اختر اللوحة الجديدة:
              </label>
        <select
  value={selectedTargetSign}
  onChange={(e) => setSelectedTargetSign(e.target.value)}
  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
>
  <option value="">-- اختر لوحة جديدة --</option>
  {availableTargetSigns.map(sign => (
    <option key={sign.id} value={sign.id}>
      {/* كود اللوحة و كود الاتجاه */}
      كود اللوحة: {sign.code || sign.road_sign_code || sign.roadsign_code || `RS-${sign.id}`} | 
      كود الاتجاه: {sign.direction_code || sign.direction?.code || 'N/A'} | 
      {/* الموقع والمدينة */}
      الموقع: {sign.place} | المدينة: {sign.city?.name}
      {/* اللوحات المتاحة */}
      {sign.available_date_ranges?.[0]?.available_panels > 0 && 
        ` (متاح: ${sign.available_date_ranges[0].available_panels})`
      }
    </option>
  ))}
</select>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                متاح {availableTargetSigns.length} لوحة بنفس القالب
              </p>
            </div>
          )}

          {hasActiveBookings && availableTargetSigns.length === 0 && (
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ⚠️ لا توجد لوحات أخرى بنفس القالب متاحة للتبديل
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-3 mt-6">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isMoving}
            className="flex-1"
          >
            إلغاء
          </Button>
          <Button 
            onClick={handleExchange}
            disabled={!hasActiveBookings || !selectedTargetSign || isMoving || availableTargetSigns.length === 0}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            {isMoving ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⟳</span>
                جاري التبديل...
              </span>
            ) : (
              'تبديل اللوحة'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const InfoField = ({ label, value }) => (
  <div>
    <span className="font-medium text-gray-600 dark:text-gray-400">{label}:</span>
    <span className="text-gray-800 dark:text-white mr-2">{value}</span>
  </div>
);

export default TableRoadSigns;