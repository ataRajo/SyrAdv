import { useState, useMemo } from "react";
import { DynamicTable } from "../../utils/Tables/DynamicTable";
import HeaderComponent from "../../utils/HeaderComponent";
import { PaymentsColumns, PAYMENT_STATUS } from "../../utils/Tables/ColumnsTable/PaymentsColumns";
import { DialogAddPayments } from "../../utils/Dialogs/EditAddDialog/Add/DialogAddPayments";
import InvoicePdf from "./InvoicePdf";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeleteDialog } from "../../utils/Dialogs/DeleteDialog/DeleteDialog";
import { Permissions } from "../../Static/StaticData";
import InvoiceExcel from "./InvoiceExcel";
import useMangePayments from "../../hooks/useMangePayments";
import { ViewImageDialog } from "./ViewImageDialog";
import { useGetPaymentsQuery } from "../../RtkQuery/Slice/Payments/PaymentsApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_FILTER_OPTIONS = [
  { label: "الكل", value: "all" },
  { label: PAYMENT_STATUS.WAITING.label, value: PAYMENT_STATUS.WAITING.value.toString() },
  { label: PAYMENT_STATUS.ACCEPTED.label, value: PAYMENT_STATUS.ACCEPTED.value.toString() },
  { label: PAYMENT_STATUS.REJECTED.label, value: PAYMENT_STATUS.REJECTED.value.toString() },
];

const PaymentsContainer = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: payments = [], isLoading: isFetchingPayments } = useGetPaymentsQuery();

  const {
    openAdd,
    setOpenAdd,
    openDelete,
    setOpenDelete,
    isLoadingConfirm,
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
    dataInvoicePdf,
    permissions,
    openViewImage,
    setOpenViewImage,
    selectedPayment,
  } = useMangePayments();

  // ✅ Filtered payments for "All Payments" tab
  const filteredPayments = useMemo(() => {
    if (statusFilter === "all") return payments;
    return payments.filter((p) => p.status === parseInt(statusFilter));
  }, [payments, statusFilter]);

  return (
    <>
      <Tabs
        dir="rtl"
        defaultValue="payments"
        onValueChange={setActiveTab}
        className="w-full p-4"
      >
        <TabsList className="grid w-full grid-cols-3 bg-card rounded-lg border border-border">
          <TabsTrigger value="payments" className="text-xs md:text-sm font-medium">
            جميع الدفعات
          </TabsTrigger>
          <TabsTrigger value="received" className="text-xs md:text-sm font-medium">
            الدفعات المستلمة
          </TabsTrigger>
          <TabsTrigger value="not-received" className="text-xs md:text-sm font-medium">
            الدفعات غير المستلمة
          </TabsTrigger>
        </TabsList>

        {/* All Payments */}
        <TabsContent value="payments">
          <div className="p-0 w-full mx-auto space-y-6 overflow-x-auto">
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

            {/* Status Filter */}
            <div className="flex justify-end mb-4">
              <Select
                value={statusFilter}
                onValueChange={(val) => setStatusFilter(val)}
              >
                <SelectTrigger className="w-[180px] bg-white border text-right">
                  <SelectValue placeholder="تصفية حسب الحالة" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FILTER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dynamic Table */}
            <DynamicTable
              data={filteredPayments}
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

        {/* Not Received Payments */}
        <TabsContent value="not-received">
          <div className="w-full mx-auto space-y-6 overflow-x-auto">
            <DynamicTable
              data={paymentIsNotReceived || []}
              columns={PaymentsColumns}
              isLoading={isFetchingPaymentsNotReceived}
              onShow={onShow}
              onDelete={handleDelete}
              onConfirmOrder={onConfirmPayment}
              permissions={permissions}
            />
          </div>
        </TabsContent>

        {/* Received Payments */}
        <TabsContent value="received">
          <div className="w-full mx-auto space-y-6 overflow-x-auto">
            <DynamicTable
              data={paymentIsReceived || []}
              columns={PaymentsColumns}
              isLoading={isFetchingPaymentsReceived}
              onShow={onShow}
              permissions={permissions}
              onDelete={handleDelete}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Confirm Dialog */}
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

      {/* View Image Dialog */}
      <ViewImageDialog
        show={openViewImage}
        handleClose={() => setOpenViewImage(false)}
        payment={
          selectedPayment
            ? {
                ...selectedPayment,
                payment_image: selectedPayment.payment_image
                  ? `https://road.levantmenu.ae/storage/${selectedPayment.payment_image}`
                  : null,
              }
            : null
        }
      />

      {/* Delete Dialog */}
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
