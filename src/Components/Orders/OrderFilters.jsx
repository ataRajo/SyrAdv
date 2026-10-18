import { Button } from "@/components/ui/button";
import { Calendar, Building, MapPin, ShoppingCart, User } from "lucide-react";
import CustomerSearchSelect from "../Common/CustomerSearchSelect";

const OrderFilters = ({
  selectedCustomerId,
  setSelectedCustomerId,
  orderType,
  setOrderType,
  selectedDate,
  setSelectedDate,
  cityId,
  setCityId,
  regionId,
  setRegionId,
  customersList = [],
  isLoadingCustomers = false,
  cities = [],
  regions = [],
  isCitiesLoading = false,
  sortedData = [],
  isHistoryTab = false,
  // يُستدعى مع كائن الزبون المختار (لعرض اسمه في الشارات والتصدير) - القائمة
  // لم تعد تُحمَّل كاملة، البحث يتم من الخادم عبر CustomerSearchSelect.
  onCustomerSelected,
}) => {
  const selectedCustomerName = selectedCustomerId 
    ? customersList.find(c => c.id.toString() === selectedCustomerId.toString())?.company_name || selectedCustomerId
    : '';

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="flex flex-col">
          <label className="mb-2 text-sm font-medium text-foreground">
            تصفية بالعميل
          </label>
          <CustomerSearchSelect
            value={selectedCustomerId || ""}
            onChange={(id, customer) => {
              setSelectedCustomerId(id || "");
              onCustomerSelected?.(customer || null);
            }}
            selectedCustomer={customersList.find((c) => String(c.id) === String(selectedCustomerId)) || null}
            allowAll
            allValue=""
            allLabel="جميع العملاء"
            disabled={isLoadingCustomers}
            triggerClassName="h-[42px] rounded-lg bg-card shadow-sm"
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-2 text-sm font-medium text-foreground">
            نوع الطلب
          </label>
          <div className="flex flex-wrap gap-4 bg-card p-4 rounded-lg shadow-sm border border-border">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="radio"
                name={`orderType${isHistoryTab ? 'History' : ''}`}
                value=""
                checked={!orderType}
                onChange={() => setOrderType("")}
                className="text-gray-500 focus:ring-gray-500 h-4 w-4 accent-gray-500"
              />
              <span className="text-gray-600 font-medium">الكل</span>
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="radio"
                name={`orderType${isHistoryTab ? 'History' : ''}`}
                value="release"
                checked={orderType === "release"}
                onChange={(e) => setOrderType(e.target.value)}
                className="text-red-500 focus:ring-red-500 h-4 w-4 accent-red-500"
              />
              <span className="text-red-600 font-medium">فك</span>
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="radio"
                name={`orderType${isHistoryTab ? 'History' : ''}`}
                value="installation"
                checked={orderType === "installation"}
                onChange={(e) => setOrderType(e.target.value)}
                className="text-green-500 focus:ring-green-500 h-4 w-4 accent-green-500"
              />
              <span className="text-green-600 font-medium">تركيب</span>
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="radio"
                name={`orderType${isHistoryTab ? 'History' : ''}`}
                value="swap"
                checked={orderType === "swap"}
                onChange={(e) => setOrderType(e.target.value)}
                className="text-amber-500 focus:ring-amber-500 h-4 w-4 accent-amber-500"
              />
              <span className="text-amber-600 font-medium">فك وتركيب</span>
            </label>
          </div>
        </div>
        
        <div className="flex flex-col">
          <label className="mb-2 text-sm font-medium text-foreground">
            تصفية بالتاريخ
          </label>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="p-2.5 border rounded-lg bg-card text-foreground text-sm shadow-sm focus:ring-2 focus:ring-primary focus:border-primary w-full"
            />
          </div>
        </div>

        <div className="flex flex-col">
          <label className="mb-2 text-sm font-medium text-foreground">
            المدينة
          </label>
          <select
            value={cityId}
            onChange={(e) => setCityId(e.target.value)}
            className="p-2.5 border rounded-lg bg-card text-foreground text-sm shadow-sm focus:ring-2 focus:ring-primary focus:border-primary w-full disabled:bg-muted disabled:text-muted-foreground transition-colors duration-200"
            disabled={isCitiesLoading}
          >
            <option value="">جميع المدن</option>
            {Array.isArray(cities) && cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="flex flex-col">
          <label className="mb-2 text-sm font-medium text-foreground">
            المنطقة (التموضع)
          </label>
          <select
            value={regionId}
            onChange={(e) => setRegionId(e.target.value)}
            className="p-2.5 border rounded-lg bg-card text-foreground text-sm shadow-sm focus:ring-2 focus:ring-primary focus:border-primary w-full disabled:bg-muted disabled:text-muted-foreground transition-colors duration-200"
            disabled={!regions || regions.length === 0}
          >
            <option value="">جميع المناطق</option>
            {Array.isArray(regions) && regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedCustomerId && !isHistoryTab && (
        <FilterCard
          icon={Building}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          title="التصفية حسب العميل:"
          value={selectedCustomerName}
          count={sortedData.length}
          onClear={() => setSelectedCustomerId("")}
          gradientFrom="from-blue-50"
          gradientTo="to-indigo-50"
          borderColor="border-blue-200"
          textColor="text-blue-700"
        />
      )}

      {selectedDate && (
        <FilterCard
          icon={Calendar}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          title="التصفية حسب تاريخ الفك/التركيب:"
value={new Date(selectedDate).toLocaleDateString('ar-EG')}
          onClear={() => setSelectedDate("")}
          gradientFrom="from-green-50"
          gradientTo="to-emerald-50"
          borderColor="border-green-200"
          textColor="text-green-700"
        />
      )}

      {cityId && (
        <FilterCard
          icon={MapPin}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          title="التصفية حسب المدينة:"
          value={cities.find(c => c.id.toString() === cityId.toString())?.name || cityId}
          onClear={() => setCityId("")}
          gradientFrom="from-purple-50"
          gradientTo="to-pink-50"
          borderColor="border-purple-200"
          textColor="text-purple-700"
        />
      )}

      {regionId && (
        <FilterCard
          icon={MapPin}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          title="التصفية حسب المنطقة:"
          value={regions.find(r => r.id.toString() === regionId.toString())?.name || regionId}
          onClear={() => setRegionId("")}
          gradientFrom="from-amber-50"
          gradientTo="to-orange-50"
          borderColor="border-amber-200"
          textColor="text-amber-700"
        />
      )}
    </>
  );
};

const FilterCard = ({ 
  icon: Icon, 
  iconBg, 
  iconColor, 
  title, 
  value, 
  count, 
  onClear,
  gradientFrom,
  gradientTo,
  borderColor,
  textColor
}) => (
  <div className={`mb-4 p-4 bg-gradient-to-r ${gradientFrom} ${gradientTo} dark:from-gray-900 dark:to-gray-800 border ${borderColor} dark:border-gray-700 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md`}>
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className={`p-2 ${iconBg} dark:bg-opacity-30 rounded-lg`}>
          <Icon className={`w-5 h-5 ${iconColor} dark:${iconColor.replace('600', '400')}`} />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {title}
            </span>
            <span className={`px-3 py-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md ${textColor} dark:text-opacity-90 font-semibold text-sm`}>
              {value}
            </span>
          </div>
          {count !== undefined && (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-500/10 dark:bg-blue-500/20 rounded-full text-blue-700 dark:text-blue-300 font-medium text-sm flex items-center gap-1">
                <ShoppingCart className="w-4 h-4" />
                {count} طلب
              </span>
            </div>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClear}
        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 group"
      >
        <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        إزالة التصفية
      </Button>
    </div>
  </div>
);

export default OrderFilters;