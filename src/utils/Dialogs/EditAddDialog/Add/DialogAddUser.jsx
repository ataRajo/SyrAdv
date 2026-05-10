import { useAddNewUsersMutation, useGetRolesQuery } from "../../../../RtkQuery/Slice/Users/UsersApi";
import { useGetCitiesQuery } from "../../../../RtkQuery/Slice/CitiesAndRegions/CitiesAndRegionsApi";
import { UserFields } from "../../Data/DynamicDialogConfiguration/UsersDialogConfiguration/UserFields";
import { userInitialValues } from "../../Data/DynamicDialogConfiguration/UsersDialogConfiguration/UserInitialValues";
import { userValidationSchema } from "../../Data/DynamicDialogConfiguration/UsersDialogConfiguration/UserValidationSchema";
import DynamicDialog from "../DynamicDialog";

export const DialogAddUser = ({ show, handleClose }) => {
  const { data: rolesData, isSuccess: rolesSuccess } = useGetRolesQuery();
  const { data: citiesData, isSuccess: citiesSuccess } = useGetCitiesQuery();
  
  // Create a copy of UserFields and update the department field with options
  const updatedFields = UserFields.map(field => {
    if (field.name === 'department' && citiesSuccess) {
      return {
        ...field,
        type: 'select',
        options: citiesData.map((city) => ({
          value: city.name,      
          label: city.name,    
        })),
      };
    }
    return field;
  });

  // Prepare selectData for other components if needed
  const selectData = {
    roles: {
      data: rolesSuccess 
        ? rolesData.map((role) => ({
            value: role, 
            label: role, 
          }))
        : []
    }
  };

  const onSubmitTransform = (values) => ({
    ...values,
    roles: values.roles ? [values.roles] : [],
  department: values.department, 
  });

  return (
    <DynamicDialog
      show={show}
      handleClose={handleClose}
      title="إضافة موظف"
      fields={updatedFields}
      validationSchema={userValidationSchema}
      mutationHook={useAddNewUsersMutation}
      initialValues={userInitialValues}
      selectData={selectData}
      onSubmitTransform={onSubmitTransform} 
    />
  );
};