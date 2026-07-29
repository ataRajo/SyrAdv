import React, { useState, useEffect } from "react";
import { DynamicTable } from "../../utils/Tables/DynamicTable";
import { getBoxColumns } from "../../utils/Tables/ColumnsTable/BoxColumns";
import useMangePayments from "../../hooks/useMangePayments";
import { useGetUsersQuery } from "../../RtkQuery/Slice/Users/UsersApi";
import { useGetCustomersQuery } from "../../RtkQuery/Slice/Customers/CustomersApi";
import { useAuth } from "../../Context/AuthProvider";
import { Link } from "react-router";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import BoxSummaryCards from "../../Components/Box/Boxsummarycards"; 
import { CustomerDetailsDrawer } from "../../Components/Box/CustomerDetailsDrawer";

const Box = () => {
  const { 
    data, 
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

  const [selectedDetails, setSelectedDetails] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Customer pagination states
  const [customerPage, setCustomerPage] = useState(1);
  const [customerSearch, setCustomerSearch] = useState("");
  const [allCustomers, setAllCustomers] = useState([]);
  const [hasMoreCustomers, setHasMoreCustomers] = useState(false);

  const { data: usersData, isLoading: isLoadingUsers } = useGetUsersQuery();
  const { data: customersData, isLoading: isLoadingCustomers, isFetching: isFetchingCustomers } = useGetCustomersQuery({
    page: customerPage,
    per_page: 20,
    ...(customerSearch && { search: customerSearch })
  });

  // Accumulate customers from paginated responses
  useEffect(() => {
    if (customersData?.data) {
      if (customerPage === 1) {
        setAllCustomers(customersData.data);
      } else {
        setAllCustomers(prev => [...prev, ...customersData.data]);
      }
      setHasMoreCustomers(customersData.current_page < customersData.last_page);
    }
  }, [customersData, customerPage]);

  // Reset pagination when search changes
  useEffect(() => {
    setCustomerPage(1);
    setAllCustomers([]);
  }, [customerSearch]);

  const usersArray = usersData?.data || usersData || [];

  const handleViewDetails = (row) => {
    setSelectedDetails(data?.details || row);
    setIsDrawerOpen(true);
  };

  const handleCustomerSearch = (e) => {
    const value = e.target.value;
    setCustomerSearch(value);
    setCustomerPage(1);
    setAllCustomers([]);
  };

  const handleLoadMoreCustomers = () => {
    if (hasMoreCustomers && !isFetchingCustomers) {
      setCustomerPage(prev => prev + 1);
    }
  };

  const columns = getBoxColumns(handleViewDetails);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Upper Action & Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Icon icon="mdi:cash-register" className="w-6 h-6 text-primary" />
          حركة الصندوق والزبائن
        </h1>

        <Button
          asChild
          className="bg-slate-700 hover:bg-slate-800 text-white gap-2"
        >
          <Link to="/dashboard/administration-page/payments">
            <Icon icon="mdi:cash-register" className="w-5 h-5" />
            <span>إدارة الدفعات</span>
            <Icon icon="mdi:arrow-left" className="w-4 h-4" />
          </Link>
        </Button>
      </div>

      {/* Filters Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="flex flex-col">
          <label className="mb-1.5 text-xs font-semibold text-muted-foreground">من تاريخ</label>
          <input
            type="date"
            value={fromDate || ""}
            onChange={(e) => setFromDate(e.target.value)}
            className="p-2.5 border rounded-xl bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1.5 text-xs font-semibold text-muted-foreground">إلى تاريخ</label>
          <input
            type="date"
            value={toDate || ""}
            onChange={(e) => setToDate(e.target.value)}
            className="p-2.5 border rounded-xl bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1.5 text-xs font-semibold text-muted-foreground">الموظف</label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="p-2.5 border rounded-xl bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50"
            disabled={isLoadingUsers}
          >
            <option value="">جميع الموظفين</option>
            {Array.isArray(usersArray) && usersArray.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name || user.full_name || user.username}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="mb-1.5 text-xs font-semibold text-muted-foreground">الزبون</label>
          <div className="relative">
            <input
              type="text"
              placeholder="بحث عن زبون..."
              value={customerSearch}
              onChange={handleCustomerSearch}
              className="w-full p-2.5 border rounded-xl bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50 mb-2"
            />
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full p-2.5 border rounded-xl bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50 min-h-[120px]"
              disabled={isLoadingCustomers && customerPage === 1}
              size={5}
            >
              <option value="">جميع الزبائن</option>
              {Array.isArray(allCustomers) && allCustomers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.full_name} {customer.company_name ? `- ${customer.company_name}` : ""}
                </option>
              ))}
            </select>
            {isLoadingCustomers && customerPage === 1 && (
              <div className="text-center p-2 text-sm text-muted-foreground">جاري تحميل الزبائن...</div>
            )}
            {hasMoreCustomers && (
              <button
                onClick={handleLoadMoreCustomers}
                disabled={isFetchingCustomers}
                className="w-full mt-2 p-2 text-sm text-primary hover:underline disabled:opacity-50"
              >
                {isFetchingCustomers ? 'جاري التحميل...' : 'تحميل المزيد'}
              </button>
            )}
            {allCustomers.length === 0 && !isLoadingCustomers && customerSearch && (
              <div className="text-center p-2 text-sm text-muted-foreground">لا توجد نتائج</div>
            )}
          </div>
        </div>
      </div>

      {/* Cards Summary */}
      <BoxSummaryCards 
        summary={data?.summary} 
        isLoading={isFetchingBox} 
      />

      {/* Main Table */}
      <DynamicTable
        data={data?.customers || []}
        isLoading={isFetchingBox}
        columns={columns}
      />

      {/* Customer Detailed View Drawer */}
      <CustomerDetailsDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        details={selectedDetails}
      />
    </div>
  );
};

export default Box;