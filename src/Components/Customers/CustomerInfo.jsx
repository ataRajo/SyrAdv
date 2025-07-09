import { useParams } from "react-router";
import {
  useShowOneCustomerQuery,
} from "../../RtkQuery/Slice/Customers/CustomersApi";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { DeleteDialog } from "../../utils/Dialogs/DeleteDialog/DeleteDialog";
import { DynamicTable } from "../../utils/Tables/DynamicTable";
import { BookingCustomerColumns } from "../../utils/Tables/ColumnsTable/BookingByCustomerColumns";
import { PaymentsCustomerColumns } from "../../utils/Tables/ColumnsTable/PaymentsCustomerColumns";
import { ViewImageDialog } from "../Payments/ViewImageDialog";
import InvoicePdf from "../Payments/InvoicePdf";
import { Permissions } from "../../Static/StaticData";
import { DialogAddPayments } from "../../utils/Dialogs/EditAddDialog/Add/DialogAddPayments";
import HeaderComponent from "../../utils/HeaderComponent";
import InvoiceExcel from "../Payments/InvoiceExcel";
import CustomerFormDialog from "../../Pages/Customers/CustomerFormDialog";
import { Toaster } from "react-hot-toast";
import DetailCard from "../../utils/DetailCard";
import AddDiscountDialog from "./AddDiscountDialog";  
import { BookingCustomerDiscounts } from "../../utils/Tables/ColumnsTable/BookingCustomerDiscounts";
import useCustomers from "../../hooks/useCustomers";
import SkeletonLoader from "../../utils/SkeletonLoader";

const CustomerInfo = () => {
  const { id } = useParams();
  
  const {
    data: customer,
    isFetching,
    isLoading: isLoadingCustomer, 
    refetch, 
  } = useShowOneCustomerQuery(id);



  const {
    setOpenAddPayment,
    showBookings,
    setShowBooking,
    showPayments,
    setShowPayments,
    showDiscounts,
    setShowDiscounts,
    openViewImage,
    setOpenViewImage,
    selectedPayment,
     openDel,
    setOpenDel,
    isFormDialogOpen,
    setIsFormDialogOpen,
    isAddDiscountDialogOpen,
    setIsAddDiscountDialogOpen,
    updateCustomer,
    isUpdating,
    addDiscount,
    isAddingDiscount,
     hasPermission, 
     isDeleting,
    handleFormSuccess,
    handleDiscountSuccess,
    handelDelete,
    onShowBookingDetails,
    onShowPaymentImage,
    openAddPayment
  } =  useCustomers({refetch , id})


  
  if (isFetching) {
    return (
     <SkeletonLoader />
    );
  }

  if (!customer) {
    return (
      <div className="p-4 text-center text-red-500">
        الزبون غير متوفر
      </div>
    );
  }


  return (
    <div dir="rtl" className="p-4 md:p-6 max-w-7xl w-full mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          معلومات الزبون
        </h1>
        <div className="flex flex-wrap gap-2 justify-end">
          {hasPermission(Permissions.EditCustomers) && (
            <Button
              onClick={() => {
                setIsFormDialogOpen(true);
              }}
              variant="outline"
              className="gap-2 cursor-pointer w-full sm:w-auto"
            >
              <Icon icon="mdi:pencil" className="text-lg" />
              تعديل
            </Button>
          )}

          {hasPermission(Permissions.EditCustomers) && (
            <Button
              onClick={() => {
                setIsAddDiscountDialogOpen(true); // Open the new discount dialog
              }}
              variant="outline"
              className="gap-2 cursor-pointer w-full sm:w-auto"
            >
              <Icon icon="mdi:percent" className="text-lg" />
              إضافة حسم
            </Button>
          )}

          <Button
            onClick={() => setShowBooking((prev) => !prev)}
            variant="outline"
            className="gap-2 bg-green-500 hover:bg-green-600 text-white cursor-pointer w-full sm:w-auto"
          >
            <Icon icon="mdi:shape-outline" className="text-lg" />
            {showBookings ? "إخفاء الحجوزات" : "عرض الحجوزات"}
          </Button>

          <Button
            onClick={() => {
              setShowPayments((prev) => !prev);
            }}
            variant="outline"
            className="gap-2 bg-blue-500 hover:bg-blue-600 text-white cursor-pointer w-full sm:w-auto"
          >
            <Icon icon="mdi:currency-usd" className="text-lg" />
            {showPayments ? "إخفاء الدفعات" : "عرض الدفعات"}
          </Button>

          <Button
            onClick={() => {
              setShowDiscounts((prev) => !prev);
            }}
            variant="outline"
            className="gap-2 bg-blue-500 hover:bg-blue-600 text-white cursor-pointer w-full sm:w-auto"
          >
            <Icon icon="mdi:percent" className="text-lg" />
            {showDiscounts ? "إخفاء الحسومات" : "عرض الحسومات"}
          </Button>

          {hasPermission(Permissions.DeleteCustomers) && (
            <Button
              onClick={() => setOpenDel(true)}
              variant="destructive"
              className="gap-2 cursor-pointer w-full sm:w-auto"
            >
              <Icon icon="mdi:trash" className="text-lg" />
              حذف
            </Button>
          )}
        </div>
      </div>

      <div className="bg-background rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
          <div className="flex flex-col items-center">
            <Avatar className="w-28 h-28 md:w-36 md:h-36 border-4 border-blue-100 dark:border-blue-900">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-300 text-4xl text-white">
                {customer.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Badge variant="secondary" className="mt-4 text-base p-2">
              الرصيد المتبقي : {customer?.remaining} $
            </Badge>
          </div>

          <div className="flex-1 space-y-6 w-full">
            <div className="md:text-left text-center">
              <h2 className="text-xl md:text-2xl font-semibold mb-1">
                {customer.full_name}
              </h2>
              <p className="text-muted-foreground text-lg">
                <span className="font-semibold">الشركة: </span>
                {customer.company_name}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Phone Number */}
              <DetailCard
                icon="mdi:phone"
                title="رقم الهاتف"
                content={customer.phone_number}
                colorClass="bg-blue-50 dark:bg-blue-900/20"
              />

              {/* Alternative Phone Numbers */}
              {customer.alt_phone_number &&
                customer.alt_phone_number.length > 0 && (
                  <DetailCard
                    icon="mdi:phone-plus"
                    title="أرقام هواتف بديلة"
                    content={
                      Array.isArray(customer.alt_phone_number)
                        ? customer.alt_phone_number.join(", ")
                        : customer.alt_phone_number
                    }
                    colorClass="bg-blue-50 dark:bg-blue-900/20"
                  />
                )}

              {/* Address */}
              <DetailCard
                icon="mdi:map-marker"
                title="العنوان"
                content={customer.address}
                colorClass="bg-green-50 dark:bg-green-900/20"
              />

              {/* Commercial Registration Number */}
              {customer.commercial_registration_number && (
                <DetailCard
                  icon="mdi:file-document-box-multiple"
                  title="رقم السجل التجاري"
                  content={customer.commercial_registration_number}
                  colorClass="bg-yellow-50 dark:bg-yellow-900/20"
                />
              )}

              {/* Discount */}
              {/* <DetailCard
                icon="mdi:percent"
                title="الخصم"
                content={`${parseFloat(customer.discount).toFixed(2)}%`}
                colorClass="bg-red-50 dark:bg-red-900/20"
              /> */}

              {/* Total Paid */}
              <DetailCard
                icon="mdi:cash-multiple"
                title="إجمالي المدفوعات"
                content={`${customer.total_paid.toFixed(2)} $`}
                colorClass="bg-teal-50 dark:bg-teal-900/20"
              />

              {/* Total Due */}
              <DetailCard
                icon="mdi:cash-multiple"
                title="إجمالي المستحق"
                content={`${customer.total.toFixed(2)} $`}
                colorClass="bg-indigo-50 dark:bg-indigo-900/20"
              />

              {/* Creation Date */}
              <DetailCard
                icon="mdi:calendar-plus"
                title="تاريخ الإنشاء"
                content={new Date(customer.created_at).toLocaleDateString(
                  "en-US"
                )}
                colorClass="bg-purple-50 dark:bg-purple-900/20"
              />

              {/* Last Modified */}
              <DetailCard
                icon="mdi:calendar-sync"
                title="آخر تعديل"
                content={new Date(customer.updated_at).toLocaleDateString(
                  "en-US"
                )}
                colorClass="bg-orange-50 dark:bg-orange-900/20"
              />

              {customer.customers && customer.customers.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg border border-gray-100 dark:border-gray-800 col-span-1 sm:col-span-2">
                  <h4 className="font-semibold text-lg mb-2">
                    معلومات مدير الأعمال
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Icon
                        icon="mdi:account-box"
                        className="text-gray-600 dark:text-gray-300 text-xl"
                      />
                      <p className="font-medium">
                        {customer.customers[0].full_name}
                      </p>
                    </div>
                    {customer.customers[0].phone_number && (
                      <div className="flex items-center gap-3">
                        <Icon
                          icon="mdi:phone-in-talk"
                          className="text-gray-600 dark:text-gray-300 text-xl"
                        />
                        <p className="font-medium">
                          {customer.customers[0].phone_number}
                        </p>
                      </div>
                    )}
                    {customer.customers[0].address && (
                      <div className="flex items-center gap-3">
                        <Icon
                          icon="mdi:map-marker-radius"
                          className="text-gray-600 dark:text-gray-300 text-xl"
                        />
                        <p className="font-medium">
                          {customer.customers[0].address}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showBookings && (
        <div className="mt-8 border rounded-xl p-4 md:p-6 shadow-sm bg-background">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight mb-4">
            الحجوزات الخاصة بالزبون
          </h1>
          <DynamicTable
            data={customer?.bookings || []}
            columns={BookingCustomerColumns}
            isLoading={isLoadingCustomer}
            onShow={onShowBookingDetails}
            permissions={{
              show: Permissions.ViewBookings,
            }}
          />
        </div>
      )}

      {showPayments && (
        <div className="mt-8 border rounded-xl p-4 md:p-6 shadow-sm bg-background">
          <HeaderComponent
            title={"المدفوعات الخاصة بالزبون"}
            titleBtn={"إضافة دفعة"}
            setShow={setOpenAddPayment}
            permission={Permissions.CreatePayments}
          />
          <div className="my-4 flex flex-wrap gap-3 justify-between items-center">
            <InvoicePdf
              customer={customer}
              showCustomerTable={true}
              showCustomerPaymentsTable={true}
            />
            <InvoiceExcel
              customer={customer}
              showCustomerTable={true}
              showCustomerPaymentsTable={true}
            />
          </div>
          <DynamicTable
            data={customer?.payments || []}
            columns={PaymentsCustomerColumns}
            isLoading={isLoadingCustomer}
            onShow={onShowPaymentImage}
            permissions={{
              show: Permissions.ViewPayments,
            }}
          />
        </div>
      )}

      {showDiscounts && (
        <div className="mt-8 border rounded-xl p-4 md:p-6 shadow-sm bg-background">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight mb-4">
            الخصومات الخاصة بالزبون
          </h1>
          <DynamicTable
            data={customer?.discounts || []}
            columns={BookingCustomerDiscounts}
            isLoading={isLoadingCustomer}
          />
        </div>
      )}

      {/* Dialogs */}
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
        open={openDel}
        loading={isDeleting}
        onClose={() => setOpenDel(false)}
        onConfirm={handelDelete}
      />

      <DialogAddPayments
        show={openAddPayment}
        handleClose={() => {
          setOpenAddPayment(false) ;
          refetch()}}
        id={id}
      />

      <CustomerFormDialog
        open={isFormDialogOpen}
        onOpenChange={(isOpen) => {
          setIsFormDialogOpen(isOpen);
        }}
        initialData={customer}
        onSuccess={handleFormSuccess}
        updateCustomerMutation={updateCustomer}
        isUpdating={isUpdating}
      />

      {/* New Add Discount Dialog */}
      <AddDiscountDialog
        open={isAddDiscountDialogOpen}
        onOpenChange={(isOpen) => setIsAddDiscountDialogOpen(isOpen)}
        customerId={id}
        onSuccess={handleDiscountSuccess}
        addDiscountMutation={addDiscount}
        isAdding={isAddingDiscount}
        remainingBalance={customer?.remaining || 0} // Pass remaining balance for validation
      />
      <Toaster />
    </div>
  );
};

export default CustomerInfo;
