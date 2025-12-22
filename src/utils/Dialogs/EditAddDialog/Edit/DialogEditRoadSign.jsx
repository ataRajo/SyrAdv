import {
  useGetTemplateProductsQuery,
  useUpdateRoadSignMutation,
} from "../../../../RtkQuery/Slice/RoadSings/RoadSingsApi";
import {  roadSignFieldsEdit } from "../../Data/DynamicDialogConfiguration/RoadSignDialogConfiguration/roadSignFields";
import {
  useGetActiveRegionsByCityMutation,
  useGetCitiesQuery,
} from "../../../../RtkQuery/Slice/CitiesAndRegions/CitiesAndRegionsApi";
import DynamicDialog from "../DynamicDialog";
import { isAvailableRoadSign } from "../../../../Static/StaticData";
import { useEffect, useMemo, useState } from "react";
import { roadSignValidationSchemaEdit } from "../../Data/DynamicDialogConfiguration/RoadSignDialogConfiguration/roadSignValidationSchema";
import { showToast } from "../../../Notifictions/showToast";

export const DialogEditRoadSign = ({ show, handleClose, initData }) => {
  const { data: citiesData, isSuccess: isCitiesSuccess } = useGetCitiesQuery();
  const [
    activeRegionsByCityMutation,
    { 
      data: regionsData, // Add this to get data directly from mutation
      isSuccess: isRegionsSuccess, // Rename for clarity
      isLoading: isRegionsLoading 
    }
  ] = useGetActiveRegionsByCityMutation();
  
  const { data: tempProd, isSuccess: isTempProdSuccess } =
    useGetTemplateProductsQuery();

  // Remove the regions state and use data directly from mutation
  const [cityId, setCityId] = useState(initData?.city_id || "");
  const [selectedLocation, setSelectedLocation] = useState(null);

  const handleLocationSelect = (locationData) => {
    setSelectedLocation(locationData);
    showToast("success", "تم اختيار الموقع بنجاح");
    console.log("الموقع المختار:", locationData);
  };

  const getRegionsByCityId = async (cityId) => {
    try {
      if (cityId) {
        await activeRegionsByCityMutation(cityId);
      }
    } catch (err) {
      console.log(err);
      showToast("error", "فشل في تحميل المناطق");
    }
  };

  useEffect(() => {
    // Fetch regions when cityId changes OR on initial load if initData has city_id
    if (cityId) {
      getRegionsByCityId(cityId);
    } else if (initData?.city_id) {
      setCityId(String(initData.city_id));
      getRegionsByCityId(initData.city_id);
    }
  }, [cityId, initData?.city_id]);

  const selectData = {
    cities: {
      data: isCitiesSuccess
        ? citiesData.map((city) => ({
            id: String(city.id),
            name: city.name,
          }))
        : [],
    },

    regions: {
      data: isRegionsSuccess && regionsData
        ? regionsData.map((region) => ({
            id: String(region.id),
            name: region.name,
          }))
        : [],
      loading: isRegionsLoading, // Add loading state
    },
    template_id: {
      data: isTempProdSuccess ? tempProd : [],
    },
    is_available: {
      data: isAvailableRoadSign,
    },
  };

const onSubmitTransform = (values) => {
  // Helper function to safely convert to number
  const safeToNumber = (value) => {
    if (value === '' || value === null || value === undefined) {
      return null;
    }
    const num = Number(value);
    return isNaN(num) ? null : num;
  };

  const formData = {
    city_id: safeToNumber(values.city_id),
    region_id: safeToNumber(values.region_id),
    product_id: values.product_id ? parseInt(values.product_id, 10) : null,
    is_available: values.is_available ? parseInt(values.is_available, 10) : null,
    faces_number: safeToNumber(values.faces_number),
    advertising_meters: safeToNumber(values.advertising_meters),
    printing_meters: safeToNumber(values.printing_meters),
    // Use the helper function for latitude/longitude
    latitudeX: safeToNumber(values.latitudeX),
    longitudeY: safeToNumber(values.longitudeY),
    place: values?.place || null,
    directions: values?.directions || null,
    _method: 'PUT'
  };
  
  // Remove null values if not needed by backend
  Object.keys(formData).forEach(key => {
    if (formData[key] === null) {
      delete formData[key];
    }
  });
  
  // Handle image - if it's a File, you'll need FormData
  if (values.image && values.image instanceof File) {
    // If there's a file, use FormData
    const fd = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== undefined) {
        fd.append(key, formData[key]);
      }
    });
    fd.append('image', values.image);
    return fd;
  }
  
  // If no file, send as JSON
  return formData;
};
  const handleCityChange = (value) => {
    setCityId(value);
  };

const transformedInitialValues = useMemo(() => {
  if (!initData) return {};
  
  // Helper function to safely convert to string
  const safeToString = (value) => {
    if (value === null || value === undefined) {
      return "";
    }
    return String(value);
  };
  
  return {
    ...initData,
    city_id: initData?.city_id ? String(initData?.city_id) : "",
    region_id: initData?.region_id ? String(initData.region_id) : "",
    is_available: initData?.is_available ? String(initData?.is_available) : "",
    number: initData?.number ? String(initData.number) : "",
    image: initData?.image || null,
    // Use safeToString for latitude/longitude
    latitudeX: safeToString(initData?.latitudeX),
    longitudeY: safeToString(initData?.longitudeY),
  };
}, [initData]);
  return (
    <DynamicDialog
      show={show}
      handleClose={handleClose}
      title="تعديل لوحة طرقية"
      fields={roadSignFieldsEdit}
      validationSchema={roadSignValidationSchemaEdit}
      mutationHook={useUpdateRoadSignMutation}
      initialValues={transformedInitialValues}
      selectData={selectData}
      handleLocationSelect={handleLocationSelect}
      selectedLocation={selectedLocation} // Fix this prop - should be the state, not the function
      onSubmitTransform={onSubmitTransform}
      onFieldChange={(fieldName, value) => {
        if (fieldName === "city_id") {
          handleCityChange(value);
        }
      }}
      id={initData?.id}
    />
  );
};
