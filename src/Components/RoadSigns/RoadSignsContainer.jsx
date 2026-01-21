import { useState, useMemo } from "react";
import { useGetRoadSignsModelQuery } from "../../RtkQuery/Slice/RoadSings/RoadSingsApi";
import LoadingGet from "../../utils/Loading/LoadingGet/LoadingGet";
import SummariesCard from "../Summaries/SummariesCard";
import HeaderComponent from "../../utils/HeaderComponent";
import { DialogAddRoadSign } from "../../utils/Dialogs/EditAddDialog/Add/DialogAddRoadSign";
import { Permissions } from "../../Static/StaticData";
import RoadSignsMapView from "./RoadSignsMapView";
import TableRoadSigns from "./TableRoadSigns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapIcon, SatelliteIcon, TableIcon, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster, toast } from "react-hot-toast";
import {
  useGetCitiesQuery,
  useAddNewRegionMutation,
  useAddNewCityMutation,
} from "../../RtkQuery/Slice/CitiesAndRegions/CitiesAndRegionsApi";

import RoadSignsReport from "../../Components/Report/RoadSignsReport"; // Adjust the path as needed

const RoadSignsContainer = () => {
  const { data, isFetching } = useGetRoadSignsModelQuery();
  const [open, setOpen] = useState(false);
  const [activeView, setActiveView] = useState("map");
  
  // State for تفاصيل اللوحات tab
  const [activeSection, setActiveSection] = useState("mapView");

  // NEW STATE FOR REGION MODAL
  const [showRegionModal, setShowRegionModal] = useState(false);
  // NEW STATE FOR CITY MODAL
  const [showCityModal, setShowCityModal] = useState(false);

  if (isFetching) {
    return (
      <div className="w-full h-full flex-col flex justify-center items-center">
        <LoadingGet />
        <p>جاري التحميل ... </p>
      </div>
    );
  }

  return (
    <div dir="rtl" className="p-4">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-500">اللوحات الطرقية</h1>

          {/* Buttons in table view */}
          {activeView === "table" && activeSection === "mapView" && (
            <div className="flex items-center gap-3">
              <HeaderComponent
                title={""}
                titleBtn={"إضافة لوحة"}
                setShow={setOpen}
                permission={Permissions.CreateRoadSigns}
              />

              {/* NEW BUTTON "إضافة منطقة" */}
              <Button
                onClick={() => setShowRegionModal(true)}
                className="bg-white text-gray-700 text-lg"
              >
                + إضافة منطقة
              </Button>

              {/* NEW BUTTON "إضافة مدينة" */}
              <Button
                onClick={() => setShowCityModal(true)}
                className="bg-white text-gray-700 text-lg"
              >
                + إضافة مدينة
              </Button>
            </div>
          )}
        </div>

        {/* Main Tabs for switching between Map View and تفاصيل اللوحات */}
        <Tabs value={activeSection} onValueChange={setActiveSection} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mapView" className="flex items-center gap-2">
              <MapIcon className="w-4 h-4" />
              عرض اللوحات
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              تفاصيل اللوحات
            </TabsTrigger>
          </TabsList>

          {/* Map View Section (Your existing tabs) */}
          <TabsContent value="mapView" className="mt-4">
            {/* Tabs inside Map View */}
            <Tabs value={activeView} onValueChange={setActiveView}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="map" className="flex items-center gap-2">
                  <MapIcon className="w-4 h-4" />
                  الخريطة
                </TabsTrigger>
                <TabsTrigger value="satellite" className="flex items-center gap-2">
                  <SatelliteIcon className="w-4 h-4" />
                  القمر الاصطناعي
                </TabsTrigger>
                <TabsTrigger value="table" className="flex items-center gap-2">
                  <TableIcon className="w-4 h-4" />
                  الجدول
                </TabsTrigger>
              </TabsList>

              <TabsContent value="map" className="mt-4">
                <RoadSignsMapView viewType="map" />
              </TabsContent>

              <TabsContent value="satellite" className="mt-4">
                <RoadSignsMapView viewType="satellite" />
              </TabsContent>

              <TabsContent value="table" className="mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {data?.map((item, ind) => (
                    <SummariesCard
                      key={ind}
                      title={item.model}
                      count={item.count || 0}
                      endPoint={`road_signs/${item.model}`}
                      facesNumber={item.faces_number || 0}
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* تفاصيل اللوحات Section - Shows the RoadSignsReport */}
          <TabsContent value="details" className="mt-4">
            <RoadSignsReport isWeeklyReport={false} />
          </TabsContent>
        </Tabs>
      </div>

      <DialogAddRoadSign show={open} handleClose={() => setOpen(false)} />

      {/* NEW REGION MODAL */}
      {showRegionModal && (
        <AddRegionModal onClose={() => setShowRegionModal(false)} />
      )}

      {/* NEW CITY MODAL */}
      {showCityModal && (
        <AddCityModal onClose={() => setShowCityModal(false)} />
      )}
      <Toaster position="top-center" />
    </div>
  );
};

export default RoadSignsContainer;

const AddRegionModal = ({ onClose }) => {
  const { data: cities } = useGetCitiesQuery();
  const [addRegion, { isLoading }] = useAddNewRegionMutation();

  const [form, setForm] = useState({
    name: "",
    city_id: "",
    is_active: "1", // Default to "1" (متوفر)
  });

  const handleSubmit = async () => {
    try {
      await addRegion(form).unwrap();
      toast.success("تمت إضافة المنطقة بنجاح");
      onClose();
    } catch (err) {
      toast.error("حدث خطأ أثناء الإضافة");
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      dir="rtl"
    >
      <div className="bg-white p-6 rounded-lg w-[350px]">
        <h2 className="text-xl font-bold mb-4 text-gray-700">إضافة منطقة</h2>

        {/* الاسم */}
        <label className="block mb-2 text-gray-700">الاسم :</label>
        <input
          className="w-full border p-2 rounded mb-3 text-gray-700"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        {/* المدينة */}
        <label className="block mb-2 text-gray-700">المدينة :</label>
        <select
          className="w-full border p-2 rounded mb-3 text-gray-700"
          value={form.city_id}
          onChange={(e) => setForm({ ...form, city_id: e.target.value })}
        >
          <option value="">اختر المدينة</option>
          {cities?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* متوفر */}
        <label className="block mb-2 text-gray-700">متوفر :</label>
        <div className="w-full border p-2 rounded mb-4 text-gray-700 bg-gray-50">
          نعم
        </div>

        <div className="flex justify-between mt-4">
          <Button onClick={onClose} variant="secondary">
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            إضافة
          </Button>
        </div>
      </div>
    </div>
  );
};

const AddCityModal = ({ onClose }) => {
  const [addCity, { isLoading }] = useAddNewCityMutation();

  const [form, setForm] = useState({
    name: "",
    is_active: "1", // Default to "1" (متوفر)
  });

  const handleSubmit = async () => {
    try {
      await addCity(form).unwrap();
      toast.success("تمت إضافة المدينة بنجاح");
      onClose();
    } catch (err) {
      toast.error("حدث خطأ أثناء الإضافة");
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      dir="rtl"
    >
      <div className="bg-white p-6 rounded-lg w-[350px]">
        <h2 className="text-xl font-bold mb-4 text-gray-700">إضافة مدينة</h2>

        {/* الاسم */}
        <label className="block mb-2 text-gray-700">الاسم :</label>
        <input
          className="w-full border p-2 rounded mb-3 text-gray-700"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        {/* متوفر */}
        <label className="block mb-2 text-gray-700">متوفر :</label>
        <div className="w-full border p-2 rounded mb-4 text-gray-700 bg-gray-50">
          نعم
        </div>

        <div className="flex justify-between mt-4">
          <Button onClick={onClose} variant="secondary">
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            إضافة
          </Button>
        </div>
      </div>
    </div>
  );
};