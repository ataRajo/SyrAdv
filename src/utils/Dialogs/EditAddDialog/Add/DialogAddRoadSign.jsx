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
import DynamicDialog from "../DynamicDialog";
import {
  roadSignValidationSchema1,
  roadSignValidationSchema2,
} from "../../Data/DynamicDialogConfiguration/RoadSignDialogConfiguration/roadSignValidationSchema";
import { showToast } from "../../../Notifictions/showToast";

export const DialogAddRoadSign = ({ show, handleClose }) => {
  const [regions, setRegions] = useState([]);
  const [cityId, setCityId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [faceNumber, setFaceNumber] = useState(1);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [formValues, setFormValues] = useState({
    ...roadSignInitialValues,
    direction_two: "",
    panels_number: 1,
  });

  useEffect(() => {
    const superAdminInfo = JSON.parse(localStorage.getItem("SuperAdminInfo")) || {};
    console.log("🔐 Model Component - Current Token:", superAdminInfo?.token);
  }, []);

  const handleLocationSelect = (locationData) => {
    setSelectedLocation(locationData);

    // ✅ CRITICAL: Update form values with coordinates
    setFormValues(prevValues => ({
      ...prevValues,
      latitudeX: locationData.lat,
      longitudeY: locationData.lng,
      place: locationData.address
    }));

    console.log("✅ Coordinates updated:", {
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
      const result = await activeRegionsByCityMutation(cityId).unwrap();
      setRegions(result);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (cityId) {
      getRegionsByCityId(cityId);
    } else {
      setRegions([]);
    }
  }, [cityId]);

  useEffect(() => {
    if (!show) {
      setFormValues({
        ...roadSignInitialValues,
        direction_two: "",
        panels_number: 1,
      });
      setSelectedLocation(null);
      setCityId("");
      setTemplateId("");
      setFaceNumber(1);
      setRegions([]);
    }
  }, [show]);

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
    console.log("🔍 FORM VALUES FOR TRANSFORM:", values);

    const formData = new FormData();

    // Always append all required fields
    formData.append('city_id', values?.city_id || '');
    formData.append('region_id', values?.region_id || '');
    formData.append('template_id', values?.template_id || '');
    formData.append('panels_number', values?.panels_number || 1);
    formData.append('direction_one', values?.direction_one || '');
    formData.append('direction_two', values?.direction_two || "غير محدد");
    formData.append('place', values?.place || '');

    // ✅ FIXED: Get coordinates from form values
    let lat = 0;
    let lng = 0;

    // Check form values first
    if (values?.latitudeX !== undefined && values?.latitudeX !== null && values?.latitudeX !== '') {
      lat = parseFloat(values.latitudeX);
      console.log("📍 Using latitudeX from form:", lat);
    } else if (selectedLocation?.lat) {
      lat = selectedLocation.lat;
      console.log("📍 Using latitudeX from selectedLocation:", lat);
    }

    if (values?.longitudeY !== undefined && values?.longitudeY !== null && values?.longitudeY !== '') {
      lng = parseFloat(values.longitudeY);
      console.log("📍 Using longitudeY from form:", lng);
    } else if (selectedLocation?.lng) {
      lng = selectedLocation.lng;
      console.log("📍 Using longitudeY from selectedLocation:", lng);
    }

    console.log("🎯 Final coordinates:", { lat, lng });

    // Append coordinates as numbers
    formData.append('latitudeX', lat);
    formData.append('longitudeY', lng);

    // Handle images based on face number
    if (values?.image) {
      if (faceNumber === 1) {
        formData.append('image', values?.image);
        console.log("🖼️ Single face: image appended");
      } else if (faceNumber === 2) {
        formData.append('image', values?.image);
        formData.append('image2', values?.image);
        console.log("🖼️ Two faces: image and image2 appended");
      }
    }

    // Debug output
    console.log("📤 Final FormData:");
    for (let [key, val] of formData.entries()) {
      console.log(`${key}: ${val} (type: ${typeof val})`);
    }

    return formData;
  };

  const handleCityChange = (value) => {
    setCityId(value);
    setFormValues(prev => ({
      ...prev,
      city_id: value,
      region_id: ""
    }));
    console.log("City changed to:", value);
  };

  const handleRegionChange = (value) => {
    setFormValues(prev => ({
      ...prev,
      region_id: value
    }));
    console.log("Region changed to:", value);
  };

  const handleTemplateChange = (value) => {
    setTemplateId(value);
    const temp = tempProd?.find((item) => item.id == value);
    const faces = temp?.faces_number || 1;
    setFaceNumber(faces);
    setFormValues(prev => ({
      ...prev,
      template_id: value
    }));
    console.log("Template changed to:", value, "Face number:", faces);
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
      initialValues={formValues}
      selectData={selectData}
      onSubmitTransform={onSubmitTransform}
      handleLocationSelect={handleLocationSelect}
      selectedLocation={selectedLocation}
      onFieldChange={(fieldName, value) => {
        setFormValues(prev => ({
          ...prev,
          [fieldName]: value
        }));

        if (fieldName === "city_id") {
          handleCityChange(value);
        }
        if (fieldName === "region_id") {
          handleRegionChange(value);
        }
        if (fieldName === "template_id") {
          handleTemplateChange(value);
        }

        if (fieldName === "place" && selectedLocation) {
          console.log("Place updated, clearing selected location");
          setSelectedLocation(null);
        }
      }}
    />
  );
};