import React from "react";
import { DynamicTable } from "../../utils/Tables/DynamicTable";
import HeaderComponent from "../../utils/HeaderComponent";
import { DeleteDialog } from "../../utils/Dialogs/DeleteDialog/DeleteDialog";
import { DialogAddWorkType } from "../../utils/Dialogs/DialogAddWorkType";
import { DialogEditWorkType } from "../../utils/Dialogs/DialogEditWorkType";
import { WorkTypesColumns } from "../../utils/Tables/ColumnsTable/WorkTypesColumns";
import { useWorkTypes } from "../../hooks/useWorkTypes";
import { Permissions } from "../../Static/StaticData";
import { Loader, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const WorkTypesPage = () => {
  const {
    workTypes,
    isLoading,
    isFetching,
    isAdding,
    isUpdating,
    isDeleting,
    open,
    setOpen,
    openEdit,
    setOpenEdit,
    openDelete,
    setOpenDelete,
    selectedWorkType,
    searchQuery,
    setSearchQuery,
    handleAdd,
    handleEdit,
    handleUpdate,
    handleDelete,
    handleConfirmDelete,
  } = useWorkTypes();

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center">
        <Loader className="h-8 w-8 animate-spin text-blue-500" />
        <p className="mt-2 text-gray-600">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-full mx-auto space-y-6">
      <HeaderComponent
        title={"أنواع الأعمال"}
        titleBtn={"إضافة نوع عمل"}
     permission={Permissions.CreateBrokers}
        setShow={setOpen}
      />

      {/* Search */}
      <div className="flex items-center gap-2 max-w-md">
        <Search className="h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder="البحث بنوع العمل..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
      </div>

      <DynamicTable
        data={workTypes}
        columns={WorkTypesColumns}
        isLoading={isFetching}
        //onEdit={handleEdit}
        onDelete={handleDelete}
        permissions={{
          edit: Permissions.ViewRegions,
          delete: Permissions.DeleteBrokers,
        }}
      />

      <DialogAddWorkType
        show={open}
        handleClose={() => setOpen(false)}
        onSubmit={handleAdd}
        isLoading={isAdding}
      />

      <DialogEditWorkType
        show={openEdit}
        handleClose={() => setOpenEdit(false)}
        initData={selectedWorkType}
        onSubmit={handleUpdate}
        isLoading={isUpdating}
        key={selectedWorkType?.id || Math.random()}
      />

      <DeleteDialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        title="حذف نوع العمل"
        description={`هل أنت متأكد من حذف "${selectedWorkType?.type}"؟`}
      />
    </div>
  );
};

export default WorkTypesPage;