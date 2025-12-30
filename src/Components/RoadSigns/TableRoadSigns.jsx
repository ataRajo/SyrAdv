import React, { useEffect, useState, useMemo } from "react";
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
import { useGetRoadSignsDirectionsQuery } from "../../RtkQuery/Slice/RoadSings/RoadSingsApi";

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

  // ✅ استخدام API الاتجاهات
  const { 
    data: directionsData = [], 
    isLoading: loadingDirections 
  } = useGetRoadSignsDirectionsQuery();

  // Get customers for the dropdown
  const { 
    data: customersData, 
    isLoading: isCustomersLoading,
    error: customersError,
    isSuccess: isCustomersSuccess
  } = useGetCustomersQuery();

  // Get hook with ALL filter states including customer_id and direction
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
    // ✅ الحصول على قيم الاتجاه
    direction,
    setDirection,
    handleDirectionChange,
    // ✅ Get customer-related values from hook
    customerId,
    setCustomerId,
  } = useGetRoadSignsByFilter();

  // ✅ حالة للبحث أثناء الكتابة
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredDirections, setFilteredDirections] = useState([]);

  useEffect(() => {
    setModel(id);
  }, [id]);

  // ✅ تحضير جميع الاتجاهات مع قيمة فارغة لـ "كل الاتجاهات"
  const allDirections = useMemo(() => {
    if (!directionsData || !Array.isArray(directionsData)) {
      return [{ value: "", label: "كل الاتجاهات" }];
    }
    
    const options = [{ value: "", label: "كل الاتجاهات" }];
    
    // إضافة الاتجاهات الفريدة والمصفاة
    const uniqueDirections = new Set();
    directionsData.forEach((dir) => {
      if (dir && dir.trim() !== "") {
        uniqueDirections.add(dir.trim());
      }
    });
    
    Array.from(uniqueDirections).sort().forEach(dir => {
      options.push({
        value: dir,
        label: dir
      });
    });
    
    return options;
  }, [directionsData]);

  // ✅ تصفية الاتجاهات عند الكتابة
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredDirections(allDirections);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = allDirections.filter(option => 
        option.value.toLowerCase().includes(query) || 
        option.label.toLowerCase().includes(query)
      );
      setFilteredDirections(filtered);
    }
  }, [searchQuery, allDirections]);

  // ✅ عند تغيير القيمة المختارة
  const handleDirectionSelect = (value) => {
    handleDirectionChange(value);
    setSearchQuery(value || "");
    setShowDropdown(false);
  };

  // ✅ عند الكتابة في حقل البحث
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value === "") {
      handleDirectionChange("");
    } else if (allDirections.some(opt => opt.value === value)) {
      handleDirectionChange(value);
    }
    
    setShowDropdown(true);
  };

  // ✅ عند النقر خارج القائمة
  const handleBlur = () => {
    setTimeout(() => {
      setShowDropdown(false);
    }, 200);
  };

  // ✅ عند التركيز على الحقل
  const handleFocus = () => {
    setShowDropdown(true);
  };

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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-6">
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
            value={customerId || ""}
            onChange={handleCustomerFilterChange}
            disabled={isCustomersLoading}
            className="w-full p-2 border dark:bg-gray-900 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">جميع العملاء</option>
            
            {isCustomersLoading && <option>جاري تحميل العملاء ...</option>}
            
            {customersError && <option className="text-red-500">خطأ في تحميل العملاء</option>}
            
            {customersList.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.full_name || customer.name || customer.username || `العميل #${customer.id}`}
                {customer.company_name && ` - ${customer.company_name}`}
              </option>
            ))}
            
            {!isCustomersLoading && !customersError && customersList.length === 0 && (
              <option disabled>لا توجد عملاء</option>
            )}
          </select>
          
          <div className="mt-1 text-xs text-gray-500">
            {isCustomersLoading ? 'جاري التحميل...' : 
             customersError ? 'خطأ!' : 
             customersList.length > 0 ? `تم تحميل ${customersList.length} عميل` : 'لا توجد بيانات'}
          </div>
        </div>

        {/* ✅ Direction Filter with Search */}
        <div className="relative">
          <Label htmlFor="direction" className="block text-sm font-medium text-gray-700 mb-1">
            الاتجاه
          </Label>
          
          <div className="relative">
            <Input
              id="direction"
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder="ابحث أو اختر الاتجاه..."
              className="w-full p-2 border dark:bg-gray-900 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
              disabled={loadingDirections}
            />
            
            {/* Dropdown arrow */}
            <div 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              {loadingDirections ? (
                <span className="text-gray-400">...</span>
              ) : (
                <span className="text-gray-400">▼</span>
              )}
            </div>
          </div>
          
          {/* ✅ Dropdown Menu */}
          {showDropdown && filteredDirections.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {filteredDirections.map((option, index) => (
                <div
                  key={index}
                  className={`px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    direction === option.value ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                  } ${option.value === "" ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}
                  onClick={() => handleDirectionSelect(option.value)}
                >
                  <div className="flex justify-between items-center">
                    <span className={option.value === "" ? 'font-semibold text-gray-700 dark:text-gray-300' : ''}>
                      {option.label}
                    </span>
                    {direction === option.value && (
                      <span className="text-blue-500">✓</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* ✅ No results message */}
          {showDropdown && searchQuery && filteredDirections.length === 1 && filteredDirections[0].value === "" && (
            <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
              <div className="px-3 py-2 text-gray-500 dark:text-gray-400">
                لا توجد نتائج لـ "{searchQuery}"
              </div>
            </div>
          )}
          
          <div className="mt-1 text-xs text-gray-500">
            {direction ? `تم اختيار: ${direction}` : 'اكتب للبحث في الاتجاهات'}
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
              setCustomerId("");
              setDirection("");
              setSearchQuery("");
              setShowDropdown(false);
            }}
            className="w-full mb-5 border-gray-300 hover:bg-gray-100"
          >
            مسح الفلاتر
          </Button>
        </div>
      </div>

      {/* ✅ عرض الفلتر النشط */}
      {(direction || customerId) && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              فلاتر نشطة:
            </span>
            
            {direction && (
              <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">
                <span className="text-sm text-blue-700 dark:text-blue-400">
                  الاتجاه: {direction}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setDirection("");
                    setSearchQuery("");
                  }}
                  className="text-blue-500 hover:text-blue-700 text-xs"
                >
                  ✕
                </button>
              </div>
            )}
            
            {customerId && customerId !== "" && (
              <div className="flex items-center gap-1 bg-green-100 dark:bg-green-800 px-2 py-1 rounded">
                <span className="text-sm text-green-700 dark:text-green-400">
                  العميل: {customersList.find(c => c.id == customerId)?.full_name || `#${customerId}`}
                </span>
                <button
                  type="button"
                  onClick={() => setCustomerId("")}
                  className="text-green-500 hover:text-green-700 text-xs"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
            {customerId && customerId !== "" && (
              <span className="mr-4">
                <span className="font-medium"> | العميل:</span> {
                  customersList.find(c => c.id == customerId)?.full_name || `#${customerId}`
                }
              </span>
            )}
            {direction && (
              <span className="mr-4">
                <span className="font-medium"> | الاتجاه:</span> {direction}
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

// باقي الكود كما هو...

// Helper function for customer filter
const filterRoadSignsByCustomer = (roadSigns, customerId) => {
  if (!customerId || customerId === "") return roadSigns;
  
  if (customerId === "none") {
    return roadSigns.filter(roadSign => 
      !roadSign.bookings || roadSign.bookings.length === 0
    );
  }
  
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