import { DynamicTable } from "../../utils/Tables/DynamicTable";
import HeaderComponent from "../../utils/HeaderComponent";
import { PaymentsColumns } from "../../utils/Tables/ColumnsTable/PaymentsColumns";
import { DialogAddPayments } from "../../utils/Dialogs/EditAddDialog/Add/DialogAddPayments";
import InvoicePdf from "./InvoicePdf";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeleteDialog } from "../../utils/Dialogs/DeleteDialog/DeleteDialog";
 import { Permissions } from "../../Static/StaticData";
import InvoiceExcel from "./InvoiceExcel";
import useMangePayments from "../../hooks/useMangePayments";
import {ViewImageDialog} from "./ViewImageDialog"

const PaymentsContainer = () => {

  const {openAdd,
    setOpenAdd, 
    openDelete,
    setOpenDelete,
     isLoadingConfirm,
    payments,
    isFetchingPayments,
    paymentIsReceived,
    isFetchingPaymentsReceived,
    setActiveTab,
    openConfirm,
    setOpenConfirm,
    onShow,
    onConfirmPayment,
    handleConfirm,
     isLoadingDelete,
    handleDelete,
    onConfirmDelete,
    isFetchingPaymentsNotReceived,
    paymentIsNotReceived,
    dataInvoicePdf ,
    permissions ,
    openViewImage ,
    setOpenViewImage ,
    selectedPayment ,
} =  useMangePayments()

  

 

  return (
    <>
      {/* Tabs for switching between payments and unbooked signs */}
      <Tabs
        dir="rtl"
        defaultValue="payments"
        onValueChange={setActiveTab}
        className="w-full p-4 "
      >
        <TabsList className="grid w-full   grid-cols-3 bg-card rounded-lg border border-border">
          <TabsTrigger
            value="payments"
            className=" text-xs md:text-sm font-medium"
          >
            جميع الدفعات
          </TabsTrigger>
          <TabsTrigger
            value="received"
            className="text-xs md:text-sm font-medium"
          >
            الدفعات المستلمة
          </TabsTrigger>
          <TabsTrigger
            value="not-received"
            className="text-xs md:text-sm font-medium"
          >
            الدفعات غير المستلمة
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <div className=" p-0 w-full mx-auto space-y-6 overflow-x-auto">
            <HeaderComponent
              title={"المدفوعات"}
              titleBtn={"إضافة دفعة"}
              setShow={setOpenAdd}
              permission={Permissions.CreatePayments}
            />
            <div className="flex gap-3 justify-between">
              <InvoicePdf
                customer={dataInvoicePdf}
                showCustomerTable={false}
                showCustomerPaymentsTable={true}
              />

              <InvoiceExcel
                customer={dataInvoicePdf}
                showCustomerTable={false}
                showCustomerPaymentsTable={true}
              />
            </div>

            <DynamicTable
              data={payments || []}
              columns={PaymentsColumns}
              isLoading={isFetchingPayments}
              onShow={onShow}
              permissions={permissions}
              onDelete={handleDelete}
            />

            <DialogAddPayments
              show={openAdd}
              handleClose={() => setOpenAdd(false)}
            />
            
          </div>
        </TabsContent>

        <TabsContent value="not-received">
          <div className=" w-full mx-auto space-y-6 overflow-x-auto">
            <DynamicTable
              data={paymentIsNotReceived || []}
              columns={PaymentsColumns}
              isLoading={isFetchingPaymentsNotReceived}
              onShow={onShow}
              onDelete={handleDelete}
              onConfirmOrder={onConfirmPayment}
              permissions={permissions}

              // onUnconfirmOrder={onConfirmOrder}
            />
          </div>
        </TabsContent>

        <TabsContent value="received">
          <div className=" w-full mx-auto space-y-6 overflow-x-auto">
            <DynamicTable
              data={paymentIsReceived || []}
              columns={PaymentsColumns}
              isLoading={isFetchingPaymentsReceived}
              onShow={onShow}
              permissions={permissions}
              onDelete={handleDelete}
            />{" "}
          </div>
        </TabsContent>
      </Tabs>

    
      <DeleteDialog
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        title={"عملية تأكيد استلام الدفعة"}
        description="هل تريد تأكيد العملية"
        confirmText="نعم"
        titleLoading="جاري التأكيد"
        onConfirm={handleConfirm}
        loading={isLoadingConfirm}
      />
       <ViewImageDialog
        show={openViewImage}
        handleClose={() => setOpenViewImage(false)}
        imageUrl={
          selectedPayment?.payment_image
            ? `https://road.levantmenu.ae/storage/${selectedPayment.payment_image}`
            : null
        }
        paymentNumber={selectedPayment?.payment_number}
      />

      <DeleteDialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={onConfirmDelete}
        loading={isLoadingDelete}
      />
    </>
  );
};

export default PaymentsContainer;
