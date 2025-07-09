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

export const DialogEditRoadSign = ({ show, handleClose, initData }) => {
  const { data: citiesData, isSuccess: isCitiesSuccess } = useGetCitiesQuery();
  const [
    activeRegionsByCityMutation,
    { isSuccess: isSuccessActiveRegionsByCityMutation },
  ] = useGetActiveRegionsByCityMutation();
  const { data: tempProd, isSuccess: isTempProdSuccess } =
    useGetTemplateProductsQuery();

  const [regions, setRegions] = useState([]);
  const [cityId, setCityId] = useState([]);

  const getRegionsByCityId = async (cityId) => {
    try {
      setRegions(await activeRegionsByCityMutation(cityId).unwrap());
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (cityId) {
      getRegionsByCityId(cityId);
    } else {
      getRegionsByCityId(1);
    }
  }, [cityId]);

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
      data: isSuccessActiveRegionsByCityMutation
        ? regions.map((region) => ({
            id: String(region.id),
            name: region.name,
          }))
        : [],
    },
    template_id: {
      data: isTempProdSuccess ? tempProd : [],
    },
    is_available: {
      data: isAvailableRoadSign,
    },
  };

  const onSubmitTransform = (values) => ({
    ...values,
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
      onSubmitTransform={onSubmitTransform}
      onFieldChange={(fieldName, value) => {
        if (fieldName === "city_id") {
          handleCityChange(value);
        }
       
      }}
      // styles={"overflow-visible"}
    />
  );
};
