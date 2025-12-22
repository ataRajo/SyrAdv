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
import { useGetCustomersQuery } from "../../RtkQuery/Slice/Customers/CustomersApi"; // Import customers query
import { Button } from "@/components/ui/button"; 
import { Icon } from "@iconify/react"; // Add this import


const STATUS_FILTER_OPTIONS = [
  { label: "الكل", value: "all" },
  { label: PAYMENT_STATUS.WAITING.label, value: PAYMENT_STATUS.WAITING.value.toString() },
  { label: PAYMENT_STATUS.ACCEPTED.label, value: PAYMENT_STATUS.ACCEPTED.value.toString() },
  { label: PAYMENT_STATUS.REJECTED.label, value: PAYMENT_STATUS.REJECTED.value.toString() },
];

const CUSTOMER_FILTER_OPTIONS = [
  { label: "جميع العملاء", value: "all" },
];

const PaymentsContainer = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const { data: payments = [], isLoading: isFetchingPayments } = useGetPaymentsQuery();
  const { data: customers = [], isLoading: isFetchingCustomers } = useGetCustomersQuery(); // Get customers

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

  // Prepare customer options
  const customerOptions = useMemo(() => {
    const options = [...CUSTOMER_FILTER_OPTIONS];
    customers?.forEach(customer => {
      if (customer.company_name) {
        options.push({
          label: customer.company_name,
          value: customer.id.toString(),
          customerData: customer // Store full customer data for PDF
        });
      }
    });
    return options;
  }, [customers]);

  // Get selected customer data for PDF
  const selectedCustomerData = useMemo(() => {
    if (customerFilter === "all") return null;
    return customerOptions.find(opt => opt.value === customerFilter)?.customerData || null;
  }, [customerFilter, customerOptions]);

  // ✅ Filtered payments for "All Payments" tab
  const filteredPayments = useMemo(() => {
    let filtered = payments;
    
    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === parseInt(statusFilter));
    }
    
    // Apply customer filter
    if (customerFilter !== "all") {
      filtered = filtered.filter((p) => p.customer_id === parseInt(customerFilter));
    }
    
    return filtered;
  }, [payments, statusFilter, customerFilter]);

  // Prepare data for PDF export (filtered by customer)
  const pdfCustomerData = useMemo(() => {
    if (!selectedCustomerData) {
      // If no customer selected, return all payments (or empty)
      return dataInvoicePdf || {};
    }
    
    // Return customer data with their payments only
    return {
      ...selectedCustomerData,
      payments: filteredPayments.filter(p => p.customer_id === selectedCustomerData.id),
      company_name: selectedCustomerData.company_name,
      id: selectedCustomerData.id,
    };
  }, [selectedCustomerData, filteredPayments, dataInvoicePdf]);

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
                customer={pdfCustomerData}
                showCustomerTable={!!selectedCustomerData}
                showCustomerPaymentsTable={true}
                disabled={!filteredPayments.length}
                title={selectedCustomerData ? `دفعات ${selectedCustomerData.company_name}` : "دفعات جميع العملاء"}
              />
              <InvoiceExcel
                customer={pdfCustomerData}
                showCustomerTable={false}
                showCustomerPaymentsTable={true}
                disabled={!filteredPayments.length}
              />
            </div>

            {/* Filters Section */}
            <div className="flex gap-4 justify-end mb-4 flex-wrap">
              {/* Customer Filter */}
              <div className="min-w-[200px]">
                <Select
                  value={customerFilter}
                  onValueChange={(val) => setCustomerFilter(val)}
                  disabled={isFetchingCustomers}
                >
                  <SelectTrigger className="w-full bg-white border text-right">
                    <SelectValue placeholder="تصفية حسب العميل" />
                  </SelectTrigger>
                  <SelectContent>
                    {customerOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="min-w-[180px]">
                <Select
                  value={statusFilter}
                  onValueChange={(val) => setStatusFilter(val)}
                >
                  <SelectTrigger className="w-full bg-white border text-right">
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
              
              {(statusFilter !== "all" || customerFilter !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStatusFilter("all");
                    setCustomerFilter("all");
                  }}
                  className="h-10"
                >
                  مسح الفلاتر
                </Button>
              )}
            </div>

          {(statusFilter !== "all" || customerFilter !== "all") && (
  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm">
        <Icon 
          icon="mdi:filter" 
          className="text-blue-500 dark:text-blue-400" 
        />
        <span className="font-medium text-blue-800 dark:text-blue-300">
          التصفية الحالية:
        </span>
        <div className="flex flex-wrap gap-2">
          {statusFilter !== "all" && (
            <span className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-full text-xs font-medium">
              <Icon icon="mdi:flag" className="w-3 h-3" />
              {STATUS_FILTER_OPTIONS.find(opt => opt.value === statusFilter)?.label}
            </span>
          )}
          {customerFilter !== "all" && (
            <span className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 px-3 py-1.5 rounded-full text-xs font-medium">
              <Icon icon="mdi:account" className="w-3 h-3" />
              {customerOptions.find(opt => opt.value === customerFilter)?.label}
            </span>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setStatusFilter("all");
          setCustomerFilter("all");
        }}
        className="h-8 px-3 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800 hover:text-blue-700 dark:hover:text-blue-300"
      >
        <Icon icon="mdi:close-circle" className="ml-1 w-4 h-4" />
        مسح الفلاتر
      </Button>
    </div>
  </div>
)}

            {/* Dynamic Table */}
            <DynamicTable
              data={filteredPayments}
              columns={PaymentsColumns}
              isLoading={isFetchingPayments || isFetchingCustomers}
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