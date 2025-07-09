import { DynamicTable } from "../../utils/Tables/DynamicTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportBookingsColumns } from "../../utils/Tables/ColumnsTable/ReportBookingsColumns";
import { ReportUnbookedSignsColumns } from "../../utils/Tables/ColumnsTable/ReportUnbookedSignsColumns";
import { Loader } from "lucide-react";
import { Label } from "@/components/ui/label";
import useReports from "../../hooks/useReports";

const RoadSignsReport = () => {
  const {
    setActiveTab,
    cityId,
    regionId,
    model,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    cities,
    isCitiesLoading,
    regions,
    isRegionsLoading,
    getRoadSignsModel,
    isGetRoadSignsModel,
    bookingsData,
    isBookingsLoading,
    isBookingsFetching,
    unbookedSignsData,
    isUnbookedLoading,
    isUnbookedFetching,
    handleCityChange,
    handleRegionChange,
    handleModelChange,
  } = useReports();

  // Handle loading state
  if (isBookingsLoading || isUnbookedLoading) {
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
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Label
            htmlFor="city"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            المدينة
          </Label>
          <select
            id="city"
            value={cityId}
            onChange={handleCityChange}
            disabled={isCitiesLoading}
            className="w-full p-2 border dark:bg-gray-900 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">اختر مدينة</option>
            {isCitiesLoading && <option>جاري تحميل المدن ...</option>}
            {cities?.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <Label
            htmlFor="region"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            المنطقة
          </Label>
          <select
            id="region"
            value={regionId}
            onChange={handleRegionChange}
            disabled={isRegionsLoading || !cityId}
            className={`w-full ${
              isRegionsLoading || !cityId
                ? `dark:bg-gray-700`
                : `dark:bg-gray-900`
            } p-2 border border-gray-300 rounded-md  focus:outline-none focus:ring-2 focus:ring-blue-500 `}
          >
            <option value={""}>اختر منطقة</option>
            {isRegionsLoading || !cityId ? (
              <option>اختر مدينة لإظهار المناطق</option>
            ) : (
              regions?.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="flex-1">
          <Label
            htmlFor="region"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            القياس
          </Label>
          <select
            id="model"
            value={model}
            onChange={handleModelChange}
            disabled={isGetRoadSignsModel}
            className={`w-full ${
              isGetRoadSignsModel ? `dark:bg-gray-700` : `dark:bg-gray-900`
            } p-2 border border-gray-300 rounded-md  focus:outline-none focus:ring-2 focus:ring-blue-500 `}
          >
            <option value="">اختر القياس</option>
            {isGetRoadSignsModel && <option>جاري تحميل القياس ...</option>}
            {getRoadSignsModel?.map((model) => (
              <option key={model.model} value={model.model}>
                {`${model.model} (${model.count} نماذج متوفرة من هذا القياس)`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs for switching between bookings and unbooked signs */}
      <Tabs
        defaultValue="bookings"
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full overflow-auto  grid-cols-5 justify-between flex bg-card rounded-lg border border-border">
          <TabsTrigger value="bookings" className="text-sm font-medium">
            الحجوزات هذا الأسبوع
          </TabsTrigger>
          <TabsTrigger value="unbooked" className="text-sm font-medium">
            اللوحات الغير محجوزة
          </TabsTrigger>
        </TabsList>

        {/* Bookings This Week Table */}
        <TabsContent value="bookings">
          <DynamicTable
            data={bookingsData || []}
            columns={ReportBookingsColumns}
            isLoading={isBookingsFetching}
            className="bg-card rounded-lg shadow-sm border border-border w-full"
          />
        </TabsContent>

        {/* Unbooked Signs Table */}
        <TabsContent value="unbooked">
          {/* Date Filter */}
          <div className="flex justify-between items-center gap-3 mb-5">
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
          </div>
          <DynamicTable
            data={unbookedSignsData || []}
            columns={ReportUnbookedSignsColumns}
            isLoading={isUnbookedFetching}
            className="bg-card rounded-lg shadow-sm border border-border w-full"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RoadSignsReport;
