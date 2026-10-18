// src/pages/CustomersPage.jsx
import { useState, useMemo, useEffect } from "react";
import CustomersContainer from "../../Components/Customers/CustomersContainer";
import HeaderComponent from "../../utils/HeaderComponent";

import InvoicePdf from "../../Components/Payments/InvoicePdf";
import { Permissions } from "../../Static/StaticData";
import InvoiceExcel from "../../Components/Payments/InvoiceExcel";

import CustomerFormDialog from "./CustomerFormDialog";
import { Toaster } from "react-hot-toast";
import useCustomers from "../../hooks/useCustomers";
import { useGetWorkTypesQuery } from "../../RtkQuery/Slice/WorkTypesApi/WorkTypesApi";
import { useGetCustomersQuery } from "../../RtkQuery/Slice/Customers/CustomersApi";
import { Icon } from "@iconify/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { showToast } from "../../utils/Notifictions/showToast";  // adjust path
import { fetchAllPages } from "../../utils/export/fetchAllPages";


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
  // بحث من الخادم (اسم/شركة/هاتف/بريد/رقم) مع debounce - كان البحث يُرسَل
  // للخادم لكنه يُتجاهَل هناك، ثم يُفلتَر محليًا على الصفحة المعروضة فقط.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery]);


  // Fetch work types (تُستخدم كتابات فوق قائمة الزبائن - "الكل" + كل نوع عمل)
  const { data: workTypesData, isLoading: isWorkTypesLoading } = useGetWorkTypesQuery();

  // ← أضيف: العدد الكلي للزبائن بدون أي فلترة، ليظهر جنب تابة "الكل"
  // (نفس صلاحيات الرؤية المطبّقة على القائمة الرئيسية عبر status/work_type_id
  // تُطبَّق هنا أيضًا لأنه نفس الـ endpoint، فقط بلا فلاتر وبأقل بيانات ممكنة).
  const { data: allCustomersMeta } = useGetCustomersQuery({ page: 1, per_page: 1 });
  const totalCustomersCount = allCustomersMeta?.total ?? 0;

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
      search: debouncedSearch || undefined,
      page:currentPage , 
      per_page:itemsPerPage
    },
  });

  // كل الزبائن (لا الصفحة المعروضة فقط) بنفس الفلاتر - للتصدير PDF/Excel.
  const exportAllCustomers = () =>
    fetchAllPages("/customers", {
      status: statusFilter || undefined,
      work_type_id: workTypeFilter || undefined,
      search: debouncedSearch || undefined,
    });

  // Local filtering for search (client-side)
  // البحث يتم من الخادم الآن - لا فلترة محلية إضافية (كانت تُخفي نتائج
  // مطابقة بالشركة/الهاتف لأنها تفحص الاسم الكامل فقط).
  const filteredData = useMemo(() => {
    if (!isSuccess || !customers) return [];
    return customers;
  }, [customers, isSuccess]);

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
          {/* ⚠️ FIXED: الملف كان يخرج فارغًا (القائمة مُرقَّمة لا مصفوفة) -
              loadData يجلب كل الزبائن (كل الصفحات) بنفس الفلاتر الحالية. */}
          <InvoicePdf
            showCustomerTable={false}
            customer={customers}
            showCustomerRemainingTable={true}
            title="كشف الزبائن"
            loadData={exportAllCustomers}
          />
          <InvoiceExcel
            showCustomerTable={false}
            customer={customers}
            showCustomerRemainingTable={true}
            loadData={exportAllCustomers}
          />
        </div>

        {/* Filters Section */}
        <div className="my-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Search by Name */}
          <div className="relative">
            <Icon
              icon="mdi:magnify"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="ابحث بالاسم أو الشركة أو الهاتف أو البريد أو الرقم"
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
        </div>

        {/* تابات نوع العمل - متل تابات الحجوزات: "الكل" مع العدد الكلي،
            وجنب كل نوع عمل عدد الزبائن فيه. الضغط على تابة يفلتر الجدول
            تحت مباشرة بتفاصيل الزبائن الموجودة أصلًا (طلب صريح). */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Button
            variant={workTypeFilter === "" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setWorkTypeFilter("");
              setCurrentPage(1);
            }}
            className={`px-3 gap-2 ${workTypeFilter === "" ? "bg-blue-600 text-white" : ""}`}
          >
            <Icon icon="mdi:view-list" />
            الكل
            <Badge
              variant="secondary"
              className={
                workTypeFilter === ""
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }
            >
              {totalCustomersCount}
            </Badge>
          </Button>

          {isWorkTypesLoading ? (
            <span className="text-sm text-gray-500 dark:text-gray-400">جاري تحميل أنواع العمل...</span>
          ) : (
            workTypes.map((wt) => {
              const isActive = workTypeFilter === String(wt.id);
              return (
                <Button
                  key={wt.id}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setWorkTypeFilter(String(wt.id));
                    setCurrentPage(1);
                  }}
                  className={`px-3 gap-2 ${isActive ? "bg-blue-600 text-white" : ""}`}
                >
                  <Icon icon="mdi:briefcase-outline" />
                  {wt.type}
                  <Badge
                    variant="secondary"
                    className={
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }
                  >
                    {wt.count_of_customers ?? 0}
                  </Badge>
                </Button>
              );
            })
          )}
        </div>

        {/* Active Filters Badges */}
        {(statusFilter || searchQuery) && (
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