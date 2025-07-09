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

const TableRoadSigns = ({ isLoading }) => {
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [open, setOpen] = useState(false);
  const [openShow, setOpenShow] = useState(false);
  const [selectedRoadSign, setSelectedRoadSign] = useState(null);
  const {id} = useParams()

  const [deleteRoadSign, { isLoading: isDeleting }] =
    useDeleteRoadSignMutation();
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
        onDelete={handleDelete}
        onShow={handleShow}
        permissions={permissions}
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

export default TableRoadSigns;
