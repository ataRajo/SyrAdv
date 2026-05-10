import {
  useGetTemplateProductsQuery,
  useUpdateRoadSignMutation,
} from "../../../../RtkQuery/Slice/RoadSings/RoadSingsApi";
import { roadSignFieldsEdit } from "../../Data/DynamicDialogConfiguration/RoadSignDialogConfiguration/roadSignFields";
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
      data: regionsData,
      isSuccess: isRegionsSuccess,
      isLoading: isRegionsLoading 
    }
  ] = useGetActiveRegionsByCityMutation();
  
  const { data: tempProd, isSuccess: isTempProdSuccess } =
    useGetTemplateProductsQuery();

  const [cityId, setCityId] = useState(initData?.city_id || "");
  const [selectedLocation, setSelectedLocation] = useState(null);

  const handleLocationSelect = (locationData) => {
    setSelectedLocation(locationData);
    showToast("success", "تم اختيار الموقع بنجاح");
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
      loading: isRegionsLoading,
    },
    template_id: {
      data: isTempProdSuccess ? tempProd : [],
    },
    is_available: {
      data: isAvailableRoadSign,
    },
  };

  const onSubmitTransform = (values) => {
    console.log("Original values:", values);
    
    
    // Helper function to safely convert to number
    const safeToNumber = (value) => {
      if (value === '' || value === null || value === undefined) {
        return null;
      }
      const num = Number(value);
      return isNaN(num) ? null : num;
    };

    // Create FormData
    const formData = new FormData();
    
    // Add _method for PUT
    formData.append('_method', 'PUT');
    
    // Add regular fields
    const addIfNotEmpty = (key, value) => {
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value);
      }
    };
    
    // City and Region
    const cityIdValue = safeToNumber(values.city_id);
    if (cityIdValue !== null) addIfNotEmpty('city_id', cityIdValue);
    
    const regionIdValue = safeToNumber(values.region_id);
    if (regionIdValue !== null) addIfNotEmpty('region_id', regionIdValue);
    
    // Product and availability
    if (values.product_id) {
      const productIdValue = parseInt(values.product_id, 10);
      if (!isNaN(productIdValue)) addIfNotEmpty('product_id', productIdValue);
    }
    
    if (values.is_available) {
      const isAvailableValue = parseInt(values.is_available, 10);
      if (!isNaN(isAvailableValue)) addIfNotEmpty('is_available', isAvailableValue);
    }
    
    // Numbers
    const facesNumberValue = safeToNumber(values.faces_number);
    if (facesNumberValue !== null) addIfNotEmpty('faces_number', facesNumberValue);
    
    const advertisingMetersValue = safeToNumber(values.advertising_meters);
    if (advertisingMetersValue !== null) addIfNotEmpty('advertising_meters', advertisingMetersValue);
    
    const printingMetersValue = safeToNumber(values.printing_meters);
    if (printingMetersValue !== null) addIfNotEmpty('printing_meters', printingMetersValue);
    
    // Coordinates
    let latValue = safeToNumber(values.latitudeX);
    let lngValue = safeToNumber(values.longitudeY);
    
    if (latValue === null) latValue = 0;
    if (lngValue === null) lngValue = 0;
    
    formData.append('latitudeX', latValue);
    formData.append('longitudeY', lngValue);
    
    // Text fields
    if (values.place && values.place.trim() !== '') {
      formData.append('place', values.place);
    }
    
    if (values.directions && values.directions.trim() !== '') {
      formData.append('directions', values.directions);
    }
    
    // ✅ Handle main image - ONLY send if it's a File (new upload)
    if (values.image instanceof File) {
      console.log("Adding NEW main image:", values.image.name);
      formData.append('image', values.image);
    } else {
      console.log("SKIPPING main image (keeping existing)");
    }
    
    if (values.location_image1 instanceof File) {
      console.log("Adding NEW location_image1:", values.location_image1.name);
      formData.append('location_image1', values.location_image1);
    } else {
      console.log("SKIPPING location_image1 (keeping existing)");
    }
    
    if (values.location_image2 instanceof File) {
      console.log("Adding NEW location_image2:", values.location_image2.name);
      formData.append('location_image2', values.location_image2);
    } else {
      console.log("SKIPPING location_image2 (keeping existing)");
    }
    
    console.log("Final FormData being sent:");
    for (let pair of formData.entries()) {
      if (pair[1] instanceof File) {
        console.log(pair[0], ":", "FILE:", pair[1].name);
      } else {
        console.log(pair[0], ":", pair[1]);
      }
    }
    
    return formData;
  };
  
  const handleCityChange = (value) => {
    setCityId(value);
  };

  const transformedInitialValues = useMemo(() => {
    if (!initData) return {};
    
    const safeToString = (value) => {
      if (value === null || value === undefined) return "";
      return String(value);
    };
    
    console.log("initData:", initData);
    
    return {
      ...initData,
      city_id: initData?.city_id ? String(initData?.city_id) : "",
      region_id: initData?.region_id ? String(initData.region_id) : "",
      is_available: initData?.is_available ? String(initData?.is_available) : "",
      number: initData?.number ? String(initData.number) : "",
      latitudeX: safeToString(initData?.latitudeX),
      longitudeY: safeToString(initData?.longitudeY),
      // Keep image paths for display only - they won't be sent
      image: initData?.image || null,
      location_image1: initData?.location_image1 || null,
      location_image2: initData?.location_image2 || null,
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
      selectedLocation={selectedLocation}
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