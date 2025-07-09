import { DynamicTable } from "../../utils/Tables/DynamicTable";
import HeaderComponent from "../../utils/HeaderComponent";
import { DialogAddBroker } from "../../utils/Dialogs/EditAddDialog/Add/DialogAddBroker";
import { DialogEditBroker } from "../../utils/Dialogs/EditAddDialog/Edit/DialogEditBroker";
import { DeleteDialog } from "../../utils/Dialogs/DeleteDialog/DeleteDialog";
import { BrokersColumns } from "../../utils/Tables/ColumnsTable/BrokersColumns";
import { Permissions } from "../../Static/StaticData";
import { Loader } from "lucide-react";
import useBrokers from "../../hooks/useBrokers";

const BrokersContainer = () => {
  const {
    open,
    setOpen,
    openDelete,
    setOpenDelete,
    openEdit,
    setOpenEdit,
    selectBroker,
    brokers,
    isLoading,
    isFetching,
    isDeleting,
    handleEdit,
    handleDelete,
    onConfirmDelete,
    permissions,
  } = useBrokers();

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center">
        <Loader />
        <p>جاري التحميل ...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-full mx-auto space-y-6">
      <HeaderComponent
        title={"الوسطاء"}
        titleBtn={"إضافة وسيط"}
        permission={Permissions.CreateBrokers}
        setShow={setOpen}
      />
      <DynamicTable
        data={brokers || []}
        columns={BrokersColumns}
        isLoading={isFetching}
        onEdit={handleEdit}
        onDelete={handleDelete}
        permissions={permissions}
      />
      <DialogAddBroker show={open} handleClose={() => setOpen(false)} />
      <DialogEditBroker
        show={openEdit}
        handleClose={() => setOpenEdit(false)}
        initData={selectBroker}
        key={selectBroker.id || Math.random()}
      />
      <DeleteDialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={onConfirmDelete}
        loading={isDeleting}
      />
    </div>
  );
};

export default BrokersContainer;
