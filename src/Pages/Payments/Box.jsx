import { DynamicTable } from "../../utils/Tables/DynamicTable";
import { BoxColumns } from "../../utils/Tables/ColumnsTable/BoxColumns";
import useMangePayments from "../../hooks/useMangePayments";
import { useGetUsersQuery } from "../../RtkQuery/Slice/Users/UsersApi";
import { useGetCustomersQuery } from "../../RtkQuery/Slice/Customers/CustomersApi";
import { useAuth } from "../../Context/AuthProvider";

const Box = () => {
  const { 
    dataBox, 
    fromDate, 
    setFromDate, 
    toDate, 
    setToDate, 
    isFetchingBox,
    selectedUser,
    setSelectedUser,
    selectedCustomer,
    setSelectedCustomer
  } = useMangePayments();

  const { hasPermission } = useAuth();

  //const {hasRole} = useAuth()


  {/*
    
    if (!hasRole('super_admin')) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-600">غير مسموح بالوصول</h2>
        <p>ليس لديك صلاحية لعرض الصندوق</p>
      </div>
    );
  }


    */}
    

  // Fetch users and customers
  const { data: usersData, isLoading: isLoadingUsers } = useGetUsersQuery();
  const { data: customersData, isLoading: isLoadingCustomers } = useGetCustomersQuery();


  // Get the actual data array - try different possible structures
  const usersArray = usersData?.data || usersData || [];
  const customersArray = customersData?.data || customersData || [];

  return (
    <div>
      {/* Filters Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
        {/* Date From Filter */}
        <div className="flex flex-col">
          <label className="mb-2 text-sm font-medium text-foreground">
            من
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="p-2.5 border rounded-lg bg-card text-foreground text-sm shadow-sm focus:ring-2 focus:ring-primary focus:border-primary w-full transition-colors duration-200"
          />
        </div>

        {/* Date To Filter */}
        <div className="flex flex-col">
          <label className="mb-2 text-sm font-medium text-foreground">
            إلى
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="p-2.5 border rounded-lg bg-card text-foreground text-sm shadow-sm focus:ring-2 focus:ring-primary focus:border-primary w-full transition-colors duration-200"
          />
        </div>

        {/* Employee Filter */}
        <div className="flex flex-col">
          <label className="mb-2 text-sm font-medium text-foreground">
            الموظفين
          </label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="p-2.5 border rounded-lg bg-card text-foreground text-sm shadow-sm focus:ring-2 focus:ring-primary focus:border-primary w-full transition-colors duration-200"
            disabled={isLoadingUsers}
          >
            
            <option value="">جميع الموظفين</option>
            {Array.isArray(usersArray) && usersArray.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name || user.full_name || user.username || `User ${user.id}`}
              </option>
            ))}
          </select>
          {isLoadingUsers && <span className="text-xs text-gray-500 mt-1">جاري التحميل...</span>}
          {!isLoadingUsers && Array.isArray(usersArray) && (
            <span className="text-xs text-gray-500 mt-1">({usersArray.length} موظف)</span>
          )}
        </div>

        {/* Customer Filter */}
        <div className="flex flex-col">
          <label className="mb-2 text-sm font-medium text-foreground">
            الزبائن
          </label>
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="p-2.5 border rounded-lg bg-card text-foreground text-sm shadow-sm focus:ring-2 focus:ring-primary focus:border-primary w-full transition-colors duration-200"
            disabled={isLoadingCustomers}
          >
            <option value="">جميع الزبائن</option>
            {Array.isArray(customersArray) && customersArray.length > 0 ? (
              customersArray.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.full_name} - {customer.company_name}
                </option>
              ))
            ) : (
              <option value="" disabled>
                لا توجد بيانات
              </option>
            )}
          </select>
          {isLoadingCustomers && <span className="text-xs text-gray-500 mt-1">جاري التحميل...</span>}
          {!isLoadingCustomers && Array.isArray(customersArray) && (
            <span className="text-xs text-gray-500 mt-1">({customersArray.length} زبون)</span>
          )}
        </div>
      </div>

      


      <DynamicTable
        data={dataBox}
        isLoading={isFetchingBox}
        columns={BoxColumns}
      />
    </div>
  );
};

export default Box;
