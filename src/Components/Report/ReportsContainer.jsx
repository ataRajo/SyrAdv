 import { DynamicTable } from "../../utils/Tables/DynamicTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Loader } from "lucide-react";
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
  } = useReports();

  // Handle loading state
  if (isBookingsDateLoading) {
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

      {/*  Filters */}
      <div className="flex justify-between flex-wrap items-center gap-3 mb-5">
        <div className="flex-1">
          <Label
            htmlFor="region"
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
              isBookingsDateLoading ? `dark:bg-gray-700` : `dark:bg-gray-900`
            } p-2 border border-gray-300 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 `}
          >
            <option value={""}>اختر المنتج</option>
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
        <div className="flex flex-col flex-1">
          <label className="mb-2 text-sm font-medium text-right text-foreground">
            {" "}
            من{" "}
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="p-2.5 border rounded-lg bg-card text-foreground text-sm shadow-sm focus:ring-2 focus:ring-primary focus:border-primary w-full transition-colors duration-200"
          />
        </div>
        <div className="flex flex-col flex-1 ">
          <label className="mb-2 text-sm font-medium text-right  text-foreground">
            إلى{" "}
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="p-2.5 border rounded-lg bg-card text-foreground text-sm shadow-sm focus:ring-2 focus:ring-primary focus:border-primary w-full transition-colors duration-200"
          />
        </div>
      </div>

      <ReportPdf
        customers={data?.customers}
        globalModelCounts={data?.globalModelCounts}
        total_advertising_space_all_customers={
          data?.total_advertising_space_all_customers
        }
        from_date={fromDate}
        to_date={toDate}
        product={productTypeOptions[productId - 1 || 0]?.label}
      />
      {/* Tabs for switching between bookings and unbooked signs */}
      <Tabs
        defaultValue="customer-booking"
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full overflow-auto  grid-cols-5 justify-between flex bg-card rounded-lg border border-border">
          <TabsTrigger value="customer-booking" className="text-sm font-medium">
            حجوزات الزبائن
          </TabsTrigger>
          <TabsTrigger value="model-booking" className="text-sm font-medium">
            النماذج المحجوزة
          </TabsTrigger>
        </TabsList>

        {/* customer-booking This Date Tables */}
        <TabsContent value="customer-booking">
          <div className="my-3 text-center text-red-600 text-[20px]">
            <span> عدد الأمتار الإعلانية الإجمالي : </span>
            <span>{data?.total_advertising_space_all_customers} </span>
          </div>

          {data?.customers?.map((customer, ind) => {
            return (
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
            );
          })}
        </TabsContent>

        {/* model-booking This Date Tables */}
        <TabsContent value="model-booking">
          <div className="my-3 text-center text-red-600 text-[20px]">
            <span> عدد الأمتار الإعلانية الإجمالي : </span>
            <span>{data?.total_advertising_space_all_customers} </span>
          </div>
          <DynamicTable
            data={data?.globalModelCounts || []}
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
