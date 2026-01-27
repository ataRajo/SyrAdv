import { Button } from "@/components/ui/button";
import { ShoppingCart, FileText, Printer, Eye } from "lucide-react";

const OrdersHeader = ({ 
  unreadOrdersCount, 
  sortedDataLength, 
  exportToWord, 
  generatePDFViaPrint,
  markAllOrdersAsRead 
}) => {
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-foreground">
            إدارة الطلبات
          </h2>
          
          {unreadOrdersCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
                <div className="absolute -top-2 -right-2">
                  <div className="relative">
                    <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></div>
                    <div className="relative inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 border-2 border-white rounded-full">
                      {unreadOrdersCount}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
         
          <Button
            onClick={exportToWord}
            disabled={sortedDataLength === 0}
            variant="outline"
            className="flex items-center gap-2 bg-purple-50 border-purple-200 hover:bg-purple-100"
          >
            <FileText className="w-4 h-4" />
            تصدير Word
          </Button>
          <Button
            onClick={generatePDFViaPrint}
            disabled={sortedDataLength === 0}
            variant="outline"
            className="flex items-center gap-2 bg-green-50 border-green-200 hover:bg-green-100"
          >
            <Printer className="w-4 h-4" />
            طباعة (pdf)
          </Button>
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 p-4 rounded-lg border border-border mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg text-foreground">إحصائيات الطلبات</h3>
            <p className="text-sm text-muted-foreground">الطلبات النشطة الحالية</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {sortedDataLength}
              </div>
              <div className="text-sm text-muted-foreground">إجمالي الطلبات</div>
            </div>
            
            {unreadOrdersCount > 0 && (
              <div className="text-center">
                <div className="relative">
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {unreadOrdersCount}
                  </div>
                  <div className="text-sm text-muted-foreground">طلبات غير مقروءة</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default OrdersHeader;