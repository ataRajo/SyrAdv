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

 const onSubmitTransform = (values) => ({
  city_id: values.city_id ? Number(values.city_id) : null,
  region_id: values.region_id ? Number(values.region_id) : null,
  product_id: values.product_id ? parseInt(values.product_id, 10) : null,
  is_available: values.is_available
    ? parseInt(values.is_available, 10)
    : null,
  faces_number: values.faces_number ? Number(values.faces_number) : null,
  advertising_meters: values.advertising_meters
    ? String(Number(values.advertising_meters))
    : null,
  printing_meters: values.printing_meters
    ? String(Number(values.printing_meters))
    : null,
  latitudeX: values?.latitudeX,
  longitudeY: values?.longitudeY,
  // Add the missing fields
  place: values?.place || null,        // مكان التموضع
  directions: values?.directions || null, // الاتجاه
});
  const handleCityChange = (value) => {
    setCityId(value);
  };

  const transformedInitialValues = useMemo(() => {
    return {
      ...initData,
      city_id: initData?.city_id ? String(initData?.city_id) : "",
      region_id: initData?.region_id ? String(initData.region_id) : "",
      is_available: initData?.is_available
        ? String(initData?.is_available)
        : "",
      number: initData?.number ? String(initData.number) : null,
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
