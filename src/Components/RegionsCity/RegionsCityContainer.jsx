import React, { useContext } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "react-hot-toast";
import { DeleteDialog } from "../../utils/Dialogs/DeleteDialog/DeleteDialog";
// import { RegionsCityContext, RegionsCityContextApi } from "./RegionsCityContext";
import CitiesTap from "./CitiesTap";
import RegionsTab from "./RegionsTab";
import { RegionsCityContext , RegionsCityContextApi } from "../../Context/RegionsCityContextApi";

const RegionsCityContent = () => {
  const {
    deleteDialogCityOpen,
    setDeleteDialogCityOpen,
    isLoadingDeleteCity,
    deleteDialogRegionOpen,
    setDeleteDialogRegionOpen,
    isLoadingDeleteRegion,
    handleDelete,
  } = useContext(RegionsCityContext);

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold mb-4">إدارة المدن و المناطق</h1>
      <Tabs defaultValue="cities" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cities">المدن</TabsTrigger>
          <TabsTrigger value="regions">المناطق</TabsTrigger>
        </TabsList>
        <CitiesTap />
        <RegionsTab />
      </Tabs>
      <DeleteDialog
        open={deleteDialogCityOpen}
        onClose={() => setDeleteDialogCityOpen(false)}
        loading={isLoadingDeleteCity}
        onConfirm={() => handleDelete("city")}
      />
      <DeleteDialog
        open={deleteDialogRegionOpen}
        onClose={() => setDeleteDialogRegionOpen(false)}
        loading={isLoadingDeleteRegion}
        onConfirm={() => handleDelete("region")}
      />
      <Toaster />
    </div>
  );
};

const RegionsCityContainer = () => {
  return (
    <RegionsCityContextApi>
      <RegionsCityContent />
    </RegionsCityContextApi>
  );
};

export default RegionsCityContainer;