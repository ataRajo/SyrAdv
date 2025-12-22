import { DynamicTable } from "../../utils/Tables/DynamicTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader, AlertCircle } from "lucide-react";
import { ReportBookingsCustomersColumns } from "../../utils/Tables/ColumnsTable/ReportBookingsCustomersColumns";
import { ReportPdf } from "./ReportPdf";
import { productTypeOptions } from "../../Static/StaticData";
import { Label } from "@/components/ui/label";
import useReports from "../../hooks/useReports";

const ReportsContainer = () => {
  const {
    setActiveTab,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    data,
    isBookingsDateLoading,
    isBookingsDateFetching,
    productId,
    setProductId,
    selectedCustomerId,
    setSelectedCustomerId,
    customersData,
    isCustomersLoading,
    customersError,
    handleCustomerChange,
  } = useReports();



  // Debug: Check customers data
  console.log("Customers in ReportsContainer:", customersData);
  console.log("Is array?", Array.isArray(customersData));
  console.log("Length?", customersData?.length);

  // Filter data based on selected customer
  const filteredData = selectedCustomerId 
    ? {
        ...data,
        customers: data?.customers?.filter(
          customer => customer.id === parseInt(selectedCustomerId)
        ) || []
      }
    : data;

  // Find selected customer for PDF title
  const selectedCustomer = selectedCustomerId 
    ? customersData?.find(c => c.id === parseInt(selectedCustomerId))
    : null;

  if (isBookingsDateLoading || isCustomersLoading) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center">
        <Loader />
        <p className="text-muted-foreground text-sm">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-full mx-auto space-y-6 bg-background rounded-lg shadow-sm dark:shadow-gray-800">
      <h2 className="text-2xl font-bold text-foreground mb-4">التقارير</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div>
          <Label
            htmlFor="customer"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            الزبون
          </Label>
          <select
            id="customer"
            value={selectedCustomerId}
            onChange={handleCustomerChange}
            disabled={isCustomersLoading || customersError}
            className={`w-full ${
              isCustomersLoading || customersError ? 'dark:bg-gray-700' : 'dark:bg-gray-900'
            } p-2 border border-gray-300 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="">جميع الزبائن</option>
            
            {customersError ? (
              <option value="" disabled>
                خطأ في تحميل الزبائن
              </option>
            ) : isCustomersLoading ? (
              <option value="" disabled>
                جاري تحميل الزبائن...
              </option>
            ) : customersData && customersData.length > 0 ? (
              customersData.map((customer) => (
                <option
                  className="text-white"
                  key={customer.id}
                  value={customer.id}
                >
                  {customer.company_name || customer.full_name || customer.email || `زبون #${customer.id}`}
                </option>
              ))
            ) : (
              <option value="" disabled>
                لا يوجد زبائن
              </option>
            )}
          </select>
          
          {customersError && (
            <div className="mt-2 flex items-center text-red-500 text-sm">
              <AlertCircle className="w-4 h-4 mr-1" />
              <span>خطأ في تحميل قائمة الزبائن</span>
            </div>
          )}
        </div>

        {/* Product Filter */}
        <div>
          <Label
            htmlFor="product"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            المنتج
          </Label>
          <select
            id="product"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            disabled={isBookingsDateLoading}
            className={`w-full ${
              isBookingsDateLoading ? 'dark:bg-gray-700' : 'dark:bg-gray-900'
            } p-2 border border-gray-300 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="">اختر المنتج</option>
            {isBookingsDateLoading ? (
              <option>يرجى الانتظار...</option>
            ) : (
              productTypeOptions?.map((product) => (
                <option
                  className="text-white"
                  key={product.value}
                  value={product.value}
                >
                  {product.label}
                </option>
              ))
            )}
          </select>
        </div>

        {/* From Date */}
        <div>
          <Label className="mb-2 text-sm font-medium text-right text-foreground">
            من
          </Label>
          <input
            type="date"
            value={fromDate || ''}
            onChange={(e) => setFromDate(e.target.value)}
            className="p-2.5 border rounded-lg bg-card text-foreground text-sm shadow-sm focus:ring-2 focus:ring-primary focus:border-primary w-full transition-colors duration-200"
          />
        </div>

        {/* To Date */}
        <div>
          <Label className="mb-2 text-sm font-medium text-right text-foreground">
            إلى
          </Label>
          <input
            type="date"
            value={toDate || ''}
            onChange={(e) => setToDate(e.target.value)}
            className="p-2.5 border rounded-lg bg-card text-foreground text-sm shadow-sm focus:ring-2 focus:ring-primary focus:border-primary w-full transition-colors duration-200"
          />
        </div>
      </div>

      {/* PDF Button */}
      <ReportPdf
        customers={filteredData?.customers}
        globalModelCounts={filteredData?.globalModelCounts}
        total_advertising_space_all_customers={filteredData?.total_advertising_space_all_customers}
        from_date={fromDate}
        to_date={toDate}
        product={productTypeOptions.find(p => p.value == productId)?.label || "غير محدد"}
        selectedCustomer={selectedCustomer}
        isFilteredByCustomer={!!selectedCustomerId}
      />

      {/* Tabs for switching between bookings and unbooked signs */}
      <Tabs
        defaultValue="customer-booking"
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full overflow-auto grid-cols-5 justify-between flex bg-card rounded-lg border border-border">
          <TabsTrigger value="customer-booking" className="text-sm font-medium">
            حجوزات الزبائن
          </TabsTrigger>
          <TabsTrigger value="model-booking" className="text-sm font-medium">
            النماذج المحجوزة
          </TabsTrigger>
        </TabsList>

        {/* Customer Booking Tab - This Date Tables */}
        <TabsContent value="customer-booking">
          <div className="my-3 text-center text-red-600 text-[20px]">
            <span> عدد الأمتار الإعلانية الإجمالي : </span>
            <span>{filteredData?.total_advertising_space_all_customers || 0} </span>
          </div>

          {selectedCustomerId && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="font-semibold text-blue-700 dark:text-blue-300">
                عرض تقرير للزبون: {selectedCustomer?.company_name || selectedCustomer?.full_name}
              </h3>
            </div>
          )}

          {filteredData?.customers?.length > 0 ? (
            filteredData.customers.map((customer, ind) => (
              <div
                dir="rtl"
                className="border-2 p-2 m-2 text-right rounded-2xl"
                key={ind}
              >
                <div className="my-3">
                  <span>اسم الشركة : </span>
                  <span>{customer?.company_name} </span>
                </div>
                <DynamicTable
                  data={customer?.roadSigns || []}
                  columns={ReportBookingsCustomersColumns}
                  isLoading={isBookingsDateFetching}
                  className="bg-card rounded-lg shadow-sm border border-border w-full"
                />
              </div>
            ))
          ) : (
            <div className="text-center p-8 text-gray-500">
              {selectedCustomerId 
                ? "لا توجد حجوزات لهذا الزبون في الفترة المحددة"
                : "لا توجد حجوزات في الفترة المحددة"
              }
            </div>
          )}
        </TabsContent>

        {/* Model Booking Tab - This Date Tables */}
        <TabsContent value="model-booking">
          <div className="my-3 text-center text-red-600 text-[20px]">
            <span> عدد الأمتار الإعلانية الإجمالي : </span>
            <span>{filteredData?.total_advertising_space_all_customers || 0} </span>
          </div>
          <DynamicTable
            data={filteredData?.globalModelCounts || []}
            columns={[
              {
                header: "النموذج ",
                accessor: "model",
                cellClassName: "text-center",
              },
              {
                header: "عدد اللوحات المحجوزة من هذا النموذج",
                accessor: "reserved_panels",
                cellClassName: "text-center",
              },
              {
                header: "عدد اللوحات المتاحة من هذا النموذج",
                accessor: "available_panels",
                cellClassName: "text-center",
              },
              {
                header: "عدد اللوحات الكلي من هذا النموذج",
                accessor: "total_panels",
                cellClassName: "text-center",
              },
            ]}
            isLoading={isBookingsDateFetching}
            className="bg-card rounded-lg shadow-sm border border-border w-full"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsContainer;