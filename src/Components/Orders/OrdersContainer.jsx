import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader } from "lucide-react";
import useMangeOrders from "../../hooks/useMangeOrders";
import OrdersTab from "./OrdersTab";
import HistoryTab from "./HistoryTab";

const OrdersContainer = () => {
  const {
    setActiveTab,
    data,
    isLoading,
    history,
    permission,
  } = useMangeOrders();

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center">
        <Loader />
        <p className="text-muted-foreground text-sm">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="orders" onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full overflow-auto grid-cols-2 justify-between flex bg-card rounded-lg border border-border">
        <TabsTrigger value="orders" className="text-sm font-medium">
          الطلبات (الأقرب أولاً)
        </TabsTrigger>
        <TabsTrigger value="history" className="text-sm font-medium">
          الأرشيف
        </TabsTrigger>
      </TabsList>

      <TabsContent value="orders">
        <OrdersTab data={data} permission={permission} />
      </TabsContent>

      <TabsContent value="history">
        <HistoryTab history={history} permission={permission} />
      </TabsContent>
    </Tabs>
  );
};

export default OrdersContainer;