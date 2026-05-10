import {
  useGetRolesQuery,
  useUpdateUsersMutation,
} from "../../../../RtkQuery/Slice/Users/UsersApi";
import { useGetCitiesQuery } from "../../../../RtkQuery/Slice/CitiesAndRegions/CitiesAndRegionsApi";
import { UserFields } from "../../Data/DynamicDialogConfiguration/UsersDialogConfiguration/UserFields";
import { userValidationSchema } from "../../Data/DynamicDialogConfiguration/UsersDialogConfiguration/UserValidationSchema";
import DynamicDialog from "../DynamicDialog";

export const DialogEditUser = ({ show, handleClose, initData }) => {
  const { data: rolesData, isSuccess: rolesSuccess } = useGetRolesQuery();
  const { data: citiesData, isSuccess: citiesSuccess } = useGetCitiesQuery();

  // Update fields with department options
  const updatedFields = UserFields.map(field => {
    if (field.name === 'department' && citiesSuccess) {
      return {
        ...field,
        type: 'select',
        options: citiesData.map((city) => ({
          value: city.name,  // Send the NAME as string
          label: city.name,  // Display the NAME
        })),
      };
    }
    return field;
  });

  const selectData = {
    roles: {
      data: rolesSuccess
        ? rolesData.map((role) => ({
            id: role,
            name: role,
          }))
        : [],
    },
  };

  const transformedInitialValues = {
    ...initData,
    roles:
      Array.isArray(initData.roles) && initData.roles.length > 0
        ? typeof initData.roles[0] === "object"
          ? initData.roles[0].name
          : initData.roles[0]
        : "",
    department: initData.department || "", // Add department to initial values
  };

  const onSubmitTransform = (values) => ({
    ...values,
    roles: values.roles ? [values.roles] : [],
    department: values.department, // Send department name as string
  });

  return (
    <DynamicDialog
      show={show}
      handleClose={handleClose}
      title="تعديل مدير"
      fields={updatedFields}
      validationSchema={userValidationSchema}
      mutationHook={useUpdateUsersMutation}
      initialValues={transformedInitialValues}
      selectData={selectData}
      onSubmitTransform={onSubmitTransform}
    />
  );
};