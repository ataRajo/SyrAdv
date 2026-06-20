// src/pages/CustomersPage.jsx
import { useState, useMemo } from "react";
import CustomersContainer from "../../Components/Customers/CustomersContainer";
import HeaderComponent from "../../utils/HeaderComponent";

import InvoicePdf from "../../Components/Payments/InvoicePdf";
import { Permissions } from "../../Static/StaticData";
import InvoiceExcel from "../../Components/Payments/InvoiceExcel";

import CustomerFormDialog from "./CustomerFormDialog";
import { Toaster } from "react-hot-toast";
import useCustomers from "../../hooks/useCustomers";
import { useGetWorkTypesQuery } from "../../RtkQuery/Slice/WorkTypesApi/WorkTypesApi";
import { Icon } from "@iconify/react";
import { Badge } from "@/components/ui/badge";
import { showToast } from "../../utils/Notifictions/showToast";  // adjust path


const STATUS_OPTIONS = [
  { value: "", label: "جميع الحالات" },
  { value: 0, label: "بدون حالة" },
  { value: 1, label: "قيد المراجعة" },
  { value: 2, label: "مقبول" },
  { value: 3, label: "مرفوض" },
];

const STATUS_COLORS = {
  0: "bg-gray-400",
  1: "bg-yellow-500",
  2: "bg-green-600",
  3: "bg-red-600",
};

const CustomersPage = () => {
  // Filter states
  const [statusFilter, setStatusFilter] = useState("");
  const [workTypeFilter, setWorkTypeFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(10);


  // Fetch work types for dropdown
  const { data: workTypesData, isLoading: isWorkTypesLoading } = useGetWorkTypesQuery();

  // Pass filters to API
  const {
    isFormDialogOpen,
    setIsFormDialogOpen,
    handleFormSuccess,
    customers,
    addNewCustomer,
    isSuccess,
    isFetching,
    isAdding,
    paginationMeta,
  } = useCustomers({
    filters: {
      status: statusFilter || undefined,
      work_type_id: workTypeFilter || undefined,
      search: searchQuery || undefined,
      page:currentPage , 
      per_page:itemsPerPage
    },
  });

  // Local filtering for search (client-side)
  const filteredData = useMemo(() => {
    if (!isSuccess || !customers) return [];
    let result = customers;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c) =>
        (c.full_name || c.fullName || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [customers, isSuccess, searchQuery]);

  const workTypes = workTypesData?.data || [];

  return (
    <div>
      <HeaderComponent
        title={"الزبائن"}
        permission={Permissions.CreateCustomers}
        setShow={setIsFormDialogOpen}
        titleBtn={"إضافة زبون جديد"}
      />

      <div className="p-4" dir="rtl">
        {/* Export Buttons */}
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

        {/* Filters Section */}
        <div className="my-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search by Name */}
          <div className="relative">
            <Icon
              icon="mdi:magnify"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="ابحث عن الزبون باسم المستخدم"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Filter by Status */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`w-full p-2 pl-8 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer text-gray-900 dark:text-gray-100 ${
                statusFilter !== ""
                  ? STATUS_COLORS[statusFilter] + " text-white"
                  : "bg-white dark:bg-gray-800"
              }`}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  {opt.label}
                </option>
              ))}
            </select>
            <Icon
              icon="mdi:chevron-down"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            />
          </div>

          {/* Filter by Work Type */}
          <div className="relative">
            <select
              value={workTypeFilter}
              onChange={(e) => setWorkTypeFilter(e.target.value)}
              disabled={isWorkTypesLoading}
              className="w-full p-2 pl-8 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:opacity-50"
            >
              <option
                value=""
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                جميع أنواع العمل
              </option>
              {workTypes.map((wt) => (
                <option
                  key={wt.id}
                  value={wt.id}
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  {wt.name || wt.title || `نوع ${wt.type}`}
                </option>
              ))}
            </select>
            <Icon
              icon="mdi:chevron-down"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            />
          </div>
        </div>

        {/* Active Filters Badges */}
        {(statusFilter || workTypeFilter || searchQuery) && (
          <div className="flex flex-wrap gap-2 mb-3">
            {statusFilter !== "" && (
              <Badge
                className={`${STATUS_COLORS[statusFilter]} text-white gap-1`}
              >
                {
                  STATUS_OPTIONS.find(
                    (s) => s.value === Number(statusFilter)
                  )?.label
                }
                <button
                  onClick={() => setStatusFilter("")}
                  className="hover:bg-white/20 rounded-full p-0.5"
                >
                  <Icon icon="mdi:close" className="text-xs" />
                </button>
              </Badge>
            )}
            {workTypeFilter !== "" && (
              <Badge
                variant="outline"
                className="gap-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800"
              >
                {workTypes.find((w) => w.id === Number(workTypeFilter))?.name ||
                  `نوع ${workTypeFilter}`}
                <button
                  onClick={() => setWorkTypeFilter("")}
                  className="hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full p-0.5"
                >
                  <Icon icon="mdi:close" className="text-xs" />
                </button>
              </Badge>
            )}
            {searchQuery && (
              <Badge
                variant="outline"
                className="gap-1 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
              >
                بحث: {searchQuery}
                <button
                  onClick={() => setSearchQuery("")}
                  className="hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full p-0.5"
                >
                  <Icon icon="mdi:close" className="text-xs" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>

      <CustomersContainer isFetching={isFetching} customers={filteredData} />
<div className="flex justify-between items-center mt-4 p-4" dir="rtl">
  <div className="flex gap-2 items-center">
    <span className="text-sm text-gray-600 dark:text-gray-400">عرض:</span>
    <select
      value={itemsPerPage}
      onChange={(e) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
      }}
      className="p-1 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
    >
      <option value={5}>5</option>
      <option value={10}>10</option>
      <option value={20}>20</option>
      <option value={50}>50</option>
    </select>
  </div>
  
  <div className="flex gap-2">
    <button
      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
      disabled={currentPage === 1}
      className="px-3 py-1 border rounded disabled:opacity-50 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
    >
      السابق
    </button>
    <span className="px-3 py-1 text-gray-900 dark:text-gray-100">صفحة {currentPage} من {paginationMeta?.lastPage || 1}</span>
    <button
      onClick={() => setCurrentPage(prev => Math.min(prev + 1, paginationMeta?.lastPage || 1))}
      disabled={currentPage === (paginationMeta?.lastPage || 1)}
      className="px-3 py-1 border rounded disabled:opacity-50 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
    >
      التالي
    </button>
  </div>
</div>

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