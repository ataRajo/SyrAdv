import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User, Calendar, MapPin } from "lucide-react";
import {DynamicTable} from "../../utils/Tables/DynamicTable";
import OrderFilters from "./OrderFilters";
import { useGetCustomersQuery } from "../../RtkQuery/Slice/Customers/CustomersApi";
import useMangeOrders from "../../hooks/useMangeOrders";
import { HistoryOrdersColumns } from "../../utils/Tables/ColumnsTable/HistoryOrdersColumns";

const HistoryTab = ({ history, permission }) => {
  const {
    orderType,
    setOrderType,
    cityId,
    setCityId,
    regionId,
    setRegionId,
    isFetchingHistory,
    cities,
    regions,
  } = useMangeOrders();

  const { data: customersList = [] } = useGetCustomersQuery();
  
  const [selectedCustomerIdHistory, setSelectedCustomerIdHistory] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const sortedHistory = useMemo(() => {
    if (!history || !Array.isArray(history)) return [];
    
    let filteredHistory = [...history];
    
    if (selectedCustomerIdHistory) {
      filteredHistory = filteredHistory.filter(order => {
        if (order.customer_id && order.customer_id.toString() === selectedCustomerIdHistory.toString()) {
          return true;
        }
        
        if (order.customer?.id && order.customer.id.toString() === selectedCustomerIdHistory.toString()) {
          return true;
        }
        
        if (order.customer_new?.id && order.customer_new.id.toString() === selectedCustomerIdHistory.toString()) {
          return true;
        }
        
        return false;
      });
    }
    
    if (cityId) {
      filteredHistory = filteredHistory.filter(order => 
        order.road_sign?.city?.id?.toString() === cityId.toString()
      );
    }
    
    if (regionId) {
      filteredHistory = filteredHistory.filter(order => 
        order.road_sign?.region?.id?.toString() === regionId.toString()
      );
    }
    
    return filteredHistory.sort((a, b) => new Date(b.action_date) - new Date(a.action_date));
  }, [history, selectedCustomerIdHistory, cityId, regionId]);

  return (
    <div className="p-4 sm:p-6 max-w-full mx-auto space-y-6 bg-background rounded-lg shadow-sm dark:shadow-gray-800">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-foreground">أرشيف الطلبات</h2>
        <div className="text-sm text-muted-foreground">
          إجمالي الطلبات المؤرشفة : {sortedHistory.length}
        </div>
      </div>
      
      <OrderFilters 
        selectedCustomerId={selectedCustomerIdHistory}
        setSelectedCustomerId={setSelectedCustomerIdHistory}
        orderType={orderType}
        setOrderType={setOrderType}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        cityId={cityId}
        setCityId={setCityId}
        regionId={regionId}
        setRegionId={setRegionId}
        customersList={customersList}
        cities={cities}
        regions={regions}
        isHistoryTab={true}
      />
      
      {selectedCustomerIdHistory && (
        <div className="mb-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    التصفية حسب العميل:
                  </span>
                  <span className="px-3 py-1 bg-white dark:bg-gray-800 border border-blue-100 dark:border-gray-700 rounded-md text-blue-700 dark:text-blue-300 font-semibold text-sm">
                    {customersList.find(c => c.id.toString() === selectedCustomerIdHistory.toString())?.company_name || selectedCustomerIdHistory}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-blue-500/10 dark:bg-blue-500/20 rounded-full text-blue-700 dark:text-blue-300 font-medium text-sm flex items-center gap-1">
                    <ShoppingCart className="w-4 h-4" />
                    {sortedHistory.length} طلب
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCustomerIdHistory("")}
              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 group"
            >
              <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              إزالة التصفية
            </Button>
          </div>
        </div>
      )}
      
      <DynamicTable
        data={sortedHistory}
        columns={HistoryOrdersColumns}
        isLoading={isFetchingHistory}
        permissions={permission}
        className="bg-card rounded-lg shadow-sm border border-border w-full"
      />
    </div>
  );
};

export default HistoryTab;