// src/pages/CustomersPage.jsx
import CustomersContainer from "../../Components/Customers/CustomersContainer";
import HeaderComponent from "../../utils/HeaderComponent";

import useSearch from "../../hooks/useSearch";
import InvoicePdf from "../../Components/Payments/InvoicePdf";
import { Permissions } from "../../Static/StaticData";
import InvoiceExcel from "../../Components/Payments/InvoiceExcel";

import CustomerFormDialog from "./CustomerFormDialog";
import { Toaster } from "react-hot-toast";
import useCustomers from "../../hooks/useCustomers";

const CustomersPage = () => {
  const {
    isFormDialogOpen,
    setIsFormDialogOpen,
    handleFormSuccess,
     customers,
    addNewCustomer,
    isSuccess,
    isFetching,
    isAdding,
  } = useCustomers({});

  const { searchQuery, setSearchQuery, filteredData } = useSearch(
    isSuccess ? customers : [],
    "full_name"
  );

  return (
    <div>
      <HeaderComponent
        title={"الزبائن"}
        permission={Permissions.CreateCustomers}
        setShow={setIsFormDialogOpen}
        titleBtn={"إضافة زبون جديد"}
      />
      <div className="p-4" dir="rtl">
        <div className="my-2 flex gap-3 justify-between items-center">
          <InvoicePdf
            howCustomerTable={false}
            customer={customers}
            showCustomerRemainingTable={true}
          />
          <InvoiceExcel
            howCustomerTable={false}
            customer={customers}
            showCustomerRemainingTable={true}
          />
        </div>
        <input
          type="text"
          placeholder="ابحث عن الزبون باسم المستخدم"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 my-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <CustomersContainer isFetching={isFetching} customers={filteredData} />

      <CustomerFormDialog
        open={isFormDialogOpen}
        onOpenChange={(isOpen) => {
          setIsFormDialogOpen(isOpen);
        }}
        onSuccess={handleFormSuccess}
        addNewCustomerMutation={addNewCustomer}
        isAdding={isAdding}
      />
      <Toaster />
    </div>
  );
};

export default CustomersPage;
