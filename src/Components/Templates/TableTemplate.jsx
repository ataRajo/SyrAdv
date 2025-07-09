import { DynamicTable } from "../../utils/Tables/DynamicTable";
import { DialogAddTemplate } from "../../utils/Dialogs/EditAddDialog/Add/DialogAddTemplate";
import { DeleteDialog } from "../../utils/Dialogs/DeleteDialog/DeleteDialog";
import { DialogEditTemplate } from "../../utils/Dialogs/EditAddDialog/Edit/DialogEditTemplate";
import { TemplateFieldsShow } from "../../utils/Dialogs/Data/Show/TamplatefieldsShow";
import DialogShow from "../../utils/Dialogs/DialogShow/DialogShow";
import { TemplateColumns } from "../../utils/Tables/ColumnsTable/TamplateColumn";
import useTemplates from "../../hooks/useTemplates";
const TableTemplate = () => {
  const {
    data,
    isLoading,
    show,
    setShow,
    openDelete,
    setOpenDelete,
    openEdit,
    setOpenEdit,
    openShow,
    setOpenShow,
    selectedTemplate,
    setSelectedTemplate,
    isDeleting,
    initData,
    handleEdit,
    handleDelete,
    handleShow,
    handleConfirmDelete,
    permissions,
  } = useTemplates();
  return (
    <div className="p-4 sm:p-6 max-w-full mx-auto space-y-6 overflow-x-auto">
      <DynamicTable
        data={data || []}
        columns={TemplateColumns}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onShow={handleShow}
        permissions={permissions}
      />

      <DialogAddTemplate show={show} handleClose={() => setShow(false)} />
      <DeleteDialog
        open={openDelete}
        onClose={() => {
          setOpenDelete(false);
          setSelectedTemplate(null);
        }}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
      />
      <DialogEditTemplate
        show={openEdit}
        handleClose={() => setOpenEdit(false)}
        initData={initData}
      />
      <DialogShow
        show={openShow}
        handleClose={() => {
          setOpenShow(false);
          setSelectedTemplate(null);
        }}
        data={selectedTemplate}
        fields={TemplateFieldsShow}
      />
    </div>
  );
};

export default TableTemplate;
