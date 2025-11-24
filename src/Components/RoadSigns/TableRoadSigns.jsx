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
// ============ ADD DIALOG IMPORT ============
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import { useMoveBookingMutation } from "../../RtkQuery/Slice/Booking/BookingApi";


const TableRoadSigns = ({ isLoading }) => {
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [open, setOpen] = useState(false);
  const [openShow, setOpenShow] = useState(false);
  // ============ ADD EXCHANGE STATE ============
  const [openExchange, setOpenExchange] = useState(false);
  const [selectedRoadSign, setSelectedRoadSign] = useState(null);
  const {id} = useParams()

  const [deleteRoadSign, { isLoading: isDeleting }] =
    useDeleteRoadSignMutation();

      const [moveBooking, { isLoading: isMoving }] = useMoveBookingMutation();

  const {
    // startDate,
    // setStartDate,
    // endDate,
    // setEndDate,
    cityId,
    // setCityId,
    regionId,
    // setRegionId,
    roadSigns,
    isRoadSignsFetching,
    isError,
    cities,
    isCitiesLoading,
    regions,
    isRegionsLoading,
    setModel ,
    handleCityChange ,
    handleRegionChange ,


  } = useGetRoadSignsByFilter();

  console.log()
  useEffect(() => {
    setModel(id)
  } , [id])


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
    //alert(`Road Sign action for: ${roadSign.name || roadSign.id}`);
  };

  // ============ ADD EXCHANGE HANDLER ============
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

  if (isError) {
    return (
      <div className="text-center p-4 text-red-500">
        حدث خطأ أثناء جلب البيانات
      </div>
    );
  }

   const permissions = {
      delete : Permissions.DeleteRoadSigns,
      show : Permissions.ViewRegions,
      edit : Permissions.EditRoadSigns,
      // ============ ADD EXCHANGE PERMISSION ============
      exchange : Permissions.EditRoadSigns, // Use existing or create new permission
    }

  return (
    <div dir="rtl" className="p-4 sm:p-6 w-full  mx-auto space-y-6 overflow-x-auto">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Label
            htmlFor="city"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
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
        <div className="flex-1">
          <Label
            htmlFor="region"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
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
            } p-2 border border-gray-300 rounded-md  focus:outline-none focus:ring-2 focus:ring-blue-500 `}
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
        {/* <div className="flex-1">
          <Label
            htmlFor="startDate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            تاريخ البدء
          </Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        <div className="flex-1">
          <Label
            htmlFor="endDate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            تاريخ الانتهاء
          </Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div> */}
      </div>
      <Button
        onClick={() => {
          const { generatePDF } = RoadSignsPdf({ roadSigns: roadSigns || [] });
          generatePDF();
        }}
        className="mb-6 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        disabled={isRoadSignsFetching || !roadSigns?.length}
      >
        تحميل ملف تموضع اللوحات
      </Button>
      <HeaderComponent
        title={"اللوحات الطرقية"}
        titleBtn={"إضافة لوحة"}
        setShow={setOpen}
        permission={Permissions.CreateRoadSigns}
      />
      
      <DynamicTable
        data={roadSigns || []}
        columns={RoadSignColumns}
        isLoading={isRoadSignsFetching}
        onEdit={handleEdit}
        onRoadSignAction={handleRoadSignAction}
        onDelete={handleDelete}
        onShow={handleShow}
        // ============ ADD EXCHANGE PROP ============
        onExchange={handleExchange}
        permissions={permissions}
      />

      {/* ============ ADD EXCHANGE DIALOG ============ */}
      <ExchangeDialog 
        open={openExchange}
        onClose={() => setOpenExchange(false)}
        roadSign={selectedRoadSign}
        onMoveBooking={moveBooking}
          roadSigns={roadSigns} // Pass all road signs
          isMoving={isMoving}
      />
      
      <DialogEditRoadSign
        show={openEdit}
        handleClose={() => setOpenEdit(false)}
        initData={selectedRoadSign}
      />
      <DialogAddRoadSign show={open} handleClose={() => setOpen(false)} />
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


// ============ FIXED EXCHANGE DIALOG COMPONENT ============
const ExchangeDialog = ({ open, onClose, roadSign, roadSigns, onMoveBooking, isMoving }) => {
  const [selectedTargetSign, setSelectedTargetSign] = useState('');
  const [availableTargetSigns, setAvailableTargetSigns] = useState([]);

  // Check if road sign has active bookings for exchange
  const hasActiveBookings = roadSign?.bookings && 
                           roadSign.bookings.some(booking => booking.status === 1);

  // Get the first active booking for exchange
  const firstActiveBooking = roadSign?.bookings?.find(booking => booking.status === 1);

  // Get compatible road signs for exchange (same template AND available)
  useEffect(() => {
    if (open && roadSign && roadSigns) {
      const compatibleSigns = roadSigns.filter(sign => 
        // Condition 1: Not the same road sign
        sign.id !== roadSign.id &&
        // Condition 2: Same template
        sign.template_id === roadSign.template_id &&
        // Condition 3: Has available panels OR we can ignore availability for exchange
        (sign.available_date_ranges?.length > 0 || true) // Remove "|| true" if you want strict availability check
      );
      setAvailableTargetSigns(compatibleSigns);
      setSelectedTargetSign(''); // Reset selection when dialog opens
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
      // Refresh the page or data
      window.location.reload();
    } catch (error) {
      console.error('Exchange failed:', error);
      alert('فشل تبديل الموقع: ' + (error.data?.message || 'حدث خطأ'));
    }
  };

  // Return null if no roadSign
  if (!roadSign) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center">🔄 تبديل موقع اللوحة</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Road Sign Information */}
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

          {/* Exchange Eligibility Status */}
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

          {/* Target Road Sign Selection */}
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
                    {sign.name || `اللوحة #${sign.id}`} - {sign.place} - {sign.city?.name}
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

// Helper component for info fields
const InfoField = ({ label, value }) => (
  <div>
    <span className="font-medium text-gray-600 dark:text-gray-400">{label}:</span>
    <span className="text-gray-800 dark:text-white mr-2">{value}</span>
  </div>
);

export default TableRoadSigns;