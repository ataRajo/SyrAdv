import {
  useGetRolesQuery,
  useUpdateUsersMutation,
} from "../../../../RtkQuery/Slice/Users/UsersApi";
import { UserFields } from "../../Data/DynamicDialogConfiguration/UsersDialogConfiguration/UserFields";
import { userValidationSchema } from "../../Data/DynamicDialogConfiguration/UsersDialogConfiguration/UserValidationSchema";
import DynamicDialog from "../DynamicDialog";

export const DialogEditUser = ({ show, handleClose, initData }) => {
  const { data: rolesData, isSuccess } = useGetRolesQuery();

  const selectData = isSuccess
    ? {
        roles: {
          data: rolesData.map((role) => ({
            id: role,
            name: role,
          })),
        },
      }
    : { roles: { data: [] } };

  const transformedInitialValues = {
    ...initData,
    roles:
      Array.isArray(initData.roles) && initData.roles.length > 0
        ? typeof initData.roles[0] === "object"
          ? initData.roles[0].name
          : initData.roles[0]
        : "",
  };

  const onSubmitTransform = (values) => ({
    ...values,
    roles: values.roles ? [values.roles] : [],
  });

  return (
    <DynamicDialog
      show={show}
      handleClose={handleClose}
      title="تعديل مدير"
      fields={UserFields}
      validationSchema={userValidationSchema}
      mutationHook={useUpdateUsersMutation}
      initialValues={transformedInitialValues}
      selectData={selectData}
      onSubmitTransform={onSubmitTransform}
    />
  );
};
