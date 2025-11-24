import { useEffect, useState } from "react";
import {
  useGetActiveRegionsByCityMutation,
  useGetCitiesQuery,
} from "../../../../RtkQuery/Slice/CitiesAndRegions/CitiesAndRegionsApi";
import {
  useAddRoadSignMutation,
  useGetTemplateProductsQuery,
} from "../../../../RtkQuery/Slice/RoadSings/RoadSingsApi";
import { isAvailableRoadSign } from "../../../../Static/StaticData";
import {
  roadSignFields1,
  roadSignFields2,
} from "../../Data/DynamicDialogConfiguration/RoadSignDialogConfiguration/roadSignFields";
import { roadSignInitialValues } from "../../Data/DynamicDialogConfiguration/RoadSignDialogConfiguration/roadSignInitialValues";
// import { roadSignValidationSchema } from "../../Data/DynamicDialogConfiguration/RoadSignDialogConfiguration/roadSignValidationSchema";
import DynamicDialog from "../DynamicDialog";
import {
  roadSignValidationSchema1,
  roadSignValidationSchema2,
} from "../../Data/DynamicDialogConfiguration/RoadSignDialogConfiguration/roadSignValidationSchema";
import { showToast } from "../../../Notifictions/showToast";

export const DialogAddRoadSign = ({ show, handleClose }) => {
  const [regions, setRegions] = useState([]);
  const [cityId, setCityId] = useState([]);
  const [templateId, setTemplateId] = useState([]);
  const [faceNumber, setFaceNumber] = useState(1);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [formInitialValues, setFormInitialValues] = useState(roadSignInitialValues);

  useEffect(() => {
    // Check token on component mount
    const superAdminInfo = JSON.parse(localStorage.getItem("SuperAdminInfo")) || {};
    console.log("🔐 Model Component - Current Token:", superAdminInfo?.token);
  }, []);


 const handleLocationSelect = (locationData) => {
    setSelectedLocation(locationData);

    const updatedValues = {
      ...roadSignInitialValues,
      latitudeX: locationData.lat.toString(),    // Auto-fill latitude
      longitudeY: locationData.lng.toString(),   // Auto-fill longitude  
      place: locationData.address                // Auto-fill address
    };
    
    setFormInitialValues(updatedValues);
    
    showToast("success", "تم اختيار الموقع وتعبئة الحقول تلقائياً");
    console.log("✅ تم تعبئة الحقول:", {
      latitudeX: locationData.lat,
      longitudeY: locationData.lng,
      place: locationData.address
    });
  };



  const { data: citiesData, isSuccess: isCitiesSuccess } = useGetCitiesQuery();

  const [
    activeRegionsByCityMutation,
    { isSuccess: isSuccessActiveRegionsByCityMutation },
  ] = useGetActiveRegionsByCityMutation();
  const { data: tempProd, isSuccess: isTempProdSuccess } =
    useGetTemplateProductsQuery();

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
        : [{ id: 0, name: "جاري تحميل المناطق ..." }],
    },
    template_id: {
      data: isTempProdSuccess ? tempProd : [],
    },
    is_available: {
      data: isAvailableRoadSign,
    },
  };

  const onSubmitTransform = (values) => {

    const formData = new FormData();

    formData.append('city_id', values?.city_id);
    formData.append('direction_one', values?.direction_one);
    formData.append('direction_two', values?.direction_two);
    formData.append('panels_number', values?.panels_number);
    formData.append('place', values?.place);
    formData.append('region_id', values?.region_id);
    formData.append('template_id', values?.template_id);

    if (values?.image)
      formData.append('image', values?.image);

    

    formData.append('latitudeX', values?.latitudeX);
    formData.append('longitudeY', values?.longitudeY);
    return formData;
  }
  const handleCityChange = (value) => {
    setCityId(value);
    console.log(value);
  };

  const handleTemplateChange = (value) => {
    setTemplateId(value);
    const temp = tempProd.find((item) => item.id == value);
    setFaceNumber(temp?.faces_number);
  };

  

  
  return (
   <DynamicDialog
      show={show}
      handleClose={handleClose}
      title="إضافة لوحة طرقية"
      fields={faceNumber == 1 ? roadSignFields1 : roadSignFields2}
      validationSchema={
        faceNumber == 1 ? roadSignValidationSchema1 : roadSignValidationSchema2
      }
      mutationHook={useAddRoadSignMutation}
      initialValues={formInitialValues} // ✅ Use updated values with map data
      selectData={selectData}
      onSubmitTransform={onSubmitTransform}
      handleLocationSelect={handleLocationSelect} // ✅ Pass the function
      selectedLocation={selectedLocation} // ✅ Pass the data
      onFieldChange={(fieldName, value) => {
        if (fieldName === "city_id") {
          handleCityChange(value);
        }
        if (fieldName === "template_id") {
          handleTemplateChange(value);
        }
      }}
    />
  );
};
