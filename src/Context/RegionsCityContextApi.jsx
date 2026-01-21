import { createContext, useState, useMemo, useContext } from "react";
import {
  useGetCitiesQuery,
  useAddNewCityMutation,
  useUpdateCityMutation,
  useDeleteCityMutation,
  useGetRegionsQuery,
  useAddNewRegionMutation,
  useUpdateRegionMutation,
  useDeleteRegionMutation,
} from "../RtkQuery/Slice/CitiesAndRegions/CitiesAndRegionsApi";
import { showToast } from "../utils/Notifictions/showToast";

export const RegionsCityContext = createContext();

export const RegionsCityContextApi = ({ children }) => {
  // State for city form
  const [cityForm, setCityForm] = useState({ name: "", is_active: 1 });
  const [editCityId, setEditCityId] = useState(null);
  const [isCityDialogOpen, setIsCityDialogOpen] = useState(false);
  const [deleteDialogCityOpen, setDeleteDialogCityOpen] = useState(false);

  // State for region form
  const [regionForm, setRegionForm] = useState({
    name: "",
    city_id: "",
    is_active: 1,
  });
  const [editRegionId, setEditRegionId] = useState(null);
  const [isRegionDialogOpen, setIsRegionDialogOpen] = useState(false);
  const [deleteDialogRegionOpen, setDeleteDialogRegionOpen] = useState(false);
  const [cityFilter, setCityFilter] = useState("all");
  const [deleteId, setDeleteId] = useState(null);

  // RTK Query hooks
  const { data: cities = [], isLoading: isCitiesLoading } = useGetCitiesQuery();
  const { data: regions = [], isLoading: isRegionsLoading } = useGetRegionsQuery();
  const [addNewCity, { isLoading: addCityLoading }] = useAddNewCityMutation();
  const [updateCity] = useUpdateCityMutation();
  const [deleteCity, { isLoading: isLoadingDeleteCity }] = useDeleteCityMutation();
  const [addNewRegion, { isLoading: addRegionLoading }] = useAddNewRegionMutation();
  const [updateRegion] = useUpdateRegionMutation();
  const [deleteRegion, { isLoading: isLoadingDeleteRegion }] = useDeleteRegionMutation();

  // Memoized filtered regions
  const filteredRegions = useMemo(
    () =>
      cityFilter === "all"
        ? regions
        : regions.filter((region) => region.city_id === parseInt(cityFilter)),
    [regions, cityFilter]
  );

  // Generic submit handler
  const handleSubmit = async (type, id, formData, addMutation, updateMutation) => {
    try {
      if (id) {
        await updateMutation({ id, ...formData }).unwrap();
        showToast("success", `تم تعديل ${type === "city" ? "المدينة" : "المنطقة"} بنجاح`);
      } else {
        await addMutation(formData).unwrap();
        showToast("success", `تم إضافة ${type === "city" ? "المدينة" : "المنطقة"} بنجاح`);
      }
      if (type === "city") {
        setCityForm({ name: "", is_active: 1 });
        setEditCityId(null);
        setIsCityDialogOpen(false);
      } else {
        setRegionForm({ name: "", city_id: "", is_active: 1 });
        setEditRegionId(null);
        setIsRegionDialogOpen(false);
      }
    } catch (error) {
      showToast("error", `${error.data.message}`);
    }
  };

  // Generic delete handler
  const handleDelete = async (type) => {
    try {
      if (type === "city") {
        await deleteCity(deleteId).unwrap();
        showToast("success", "تم حذف المدينة بنجاح");
        setDeleteDialogCityOpen(false);
      } else {
        await deleteRegion(deleteId).unwrap();
        showToast("success", "تم حذف المنطقة بنجاح");
        setDeleteDialogRegionOpen(false);
      }
    } catch (error) {
        showToast("error", `${error.data.message}`);
    }
  };

  // Reset functions
  const resetCityForm = () => {
    setCityForm({ name: "", is_active: 1 });
    setEditCityId(null);
  };

  const resetRegionForm = () => {
    setRegionForm({ name: "", city_id: "", is_active: 1 });
    setEditRegionId(null);
  };

  // Handle opening dialog for add
  const handleAddCity = () => {
    resetCityForm();
    setIsCityDialogOpen(true);
  };

  const handleAddRegion = () => {
    resetRegionForm();
    setIsRegionDialogOpen(true);
  };

  // Handle opening dialog for edit
  const handleEditCity = (city) => {
    setCityForm({ name: city.name, is_active: city.is_active });
    setEditCityId(city.id);
    setIsCityDialogOpen(true);
  };

  const handleEditRegion = (region) => {
    setRegionForm({
      name: region.name,
      city_id: region.city_id,
      is_active: region.is_active,
    });
    setEditRegionId(region.id);
    setIsRegionDialogOpen(true);
  };

  // Handle dialog close
  const handleCityDialogClose = () => {
    setIsCityDialogOpen(false);
    // Reset form after animation
    setTimeout(() => {
      resetCityForm();
    }, 300);
  };

  const handleRegionDialogClose = () => {
    setIsRegionDialogOpen(false);
    // Reset form after animation
    setTimeout(() => {
      resetRegionForm();
    }, 300);
  };

  // Context value
  const contextValue = {
    cityForm,
    setCityForm,
    editCityId,
    setEditCityId,
    isCityDialogOpen,
    setIsCityDialogOpen,
    regionForm,
    setRegionForm,
    editRegionId,
    setEditRegionId,
    isRegionDialogOpen,
    setIsRegionDialogOpen,
    cityFilter,
    setCityFilter,
    cities,
    isCitiesLoading,
    filteredRegions,
    isRegionsLoading,
    addCityLoading,
    addRegionLoading,
    isLoadingDeleteCity,
    isLoadingDeleteRegion,
    deleteDialogCityOpen,
    setDeleteDialogCityOpen,
    deleteDialogRegionOpen,
    setDeleteDialogRegionOpen,
    deleteId,
    setDeleteId,
    handleSubmit: (type, id, formData) =>
      handleSubmit(
        type,
        id,
        formData,
        type === "city" ? addNewCity : addNewRegion,
        type === "city" ? updateCity : updateRegion
      ),
    handleEdit: (type, item) => {
      if (type === "city") {
        handleEditCity(item);
      } else {
        handleEditRegion(item);
      }
    },
    handleAddCity,
    handleAddRegion,
    handleCityDialogClose,
    handleRegionDialogClose,
    resetCityForm,
    resetRegionForm,
    handleDeleteDialog: (type, id) => {
      setDeleteId(id);
      if (type === "city") {
        setDeleteDialogCityOpen(true);
      } else {
        setDeleteDialogRegionOpen(true);
      }
    },
    handleDelete,
  };

  return (
    <RegionsCityContext.Provider value={contextValue}>
      {children}
    </RegionsCityContext.Provider>
  );
};