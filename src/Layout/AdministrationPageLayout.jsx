// AdministrationPageLayout.jsx
import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, X, Bell, AlertCircle } from "lucide-react";
import { navLinksAdministrationPage } from "../Static/StaticData";
import { useAuth } from "../Context/AuthProvider";
import NotificationsModal from "../Components/NotificationNavBar/NotificationsModal";
import { useGetOrdersQuery } from "../RtkQuery/Slice/Orders/OrdersApi";

const AdministrationPageLayout = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { hasPermission } = useAuth();
  
  // State for notification counts
  const [paymentsNotificationCount, setPaymentsNotificationCount] = useState(0);
  const [paymentsOverdueCount, setPaymentsOverdueCount] = useState(0);
  const [ordersNotificationCount, setOrdersNotificationCount] = useState(0);

  // Get orders data
  const { data: orders = [], isLoading: isLoadingOrders } = useGetOrdersQuery();

  // Calculate orders count
  useEffect(() => {
    if (orders && Array.isArray(orders)) {
      const activeOrders = orders.filter(order => order.status === 0).length;
      setOrdersNotificationCount(activeOrders);
      
      // Store in localStorage if you want to share with other components
      localStorage.setItem('ordersNotificationCount', activeOrders.toString());
    }
  }, [orders]);

  // Get payments notification count from localStorage
  useEffect(() => {
    const getNotificationCounts = () => {
      const paymentsCount = localStorage.getItem('paymentsNotificationCount') || '0';
      const overdueCount = localStorage.getItem('paymentsOverdueCount') || '0';
      setPaymentsNotificationCount(parseInt(paymentsCount));
      setPaymentsOverdueCount(parseInt(overdueCount));
    };
    
    // Check initially
    getNotificationCounts();
    
    // Listen for storage changes
    const handleStorageChange = (e) => {
      if (e.key === 'paymentsNotificationCount' || e.key === 'paymentsOverdueCount') {
        getNotificationCounts();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Poll for changes every 2 seconds
    const interval = setInterval(getNotificationCounts, 2000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const isActive = (path) => {
    if (path === "") {
      return location.pathname.endsWith("administration-page");
    }
    return location.pathname.includes(path);
  };

  // Helper function to render notification badge
  const renderNotificationBadge = (count, overdueCount = 0, isMobile = false) => {
    if (count <= 0) return null;
    
    if (isMobile) {
      return (
        <div className="flex items-center gap-1">
          <span className="bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
            {count}
          </span>
          {overdueCount > 0 && (
            <AlertCircle className="text-amber-500 w-4 h-4" />
          )}
        </div>
      );
    }
    
    return (
      <div className="absolute -top-2 -right-2 flex flex-col items-center">
        <div className="relative">
          {overdueCount > 0 && (
            <div className="animate-ping absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500 opacity-75"></div>
          )}
          <span className="bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center relative">
            {count > 99 ? "99+" : count}
          </span>
        </div>
        {/*
        
        {overdueCount > 0 && (
          <div className="text-[10px] text-amber-600 font-bold mt-0.5">
            {overdueCount} متأخرة
          </div>
        )}
        */}


        
      </div>
    );
  };

  return (
    <div style={{ direction: "rtl" }} className="flex flex-col h-full min-h-screen bg-background">
      <nav className="bg-card border-b sticky top-0 z-50">
        <div className="flex items-center justify-between p-3 md:p-4 max-w-full">
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          {/* Desktop navigation - hidden on mobile */}
          <div className="hidden sm:flex sm:flex-wrap sm:gap-1 md:gap-2 items-center flex-1">
            {/* الروابط العادية */}
            <div className="flex flex-wrap items-center gap-1 md:gap-2">
              {navLinksAdministrationPage.map((link) => (
                hasPermission(link.permission) && (
                  <Button
                    key={link.to}
                    asChild
                    variant={isActive(link.to) ? "default" : "ghost"}
                    className={cn(
                      "justify-start relative min-h-[40px] whitespace-nowrap text-sm md:text-base",
                      !isActive(link.to) &&
                        "text-muted-foreground hover:text-primary"
                    )}
                  >
                    <Link to={link.to} className="flex items-center gap-1 md:gap-2 px-2 md:px-4">
                      <span className="hidden lg:inline">{link.text}</span>
                      <span className="lg:hidden">{link.mobileText || link.text}</span>
                      
                      {/* Show orders notification badge */}
                      {link.to === "orders" && renderNotificationBadge(ordersNotificationCount)}
                      
                      {/* Show payments notification badge */}
                      {link.to === "payments" && renderNotificationBadge(
                        paymentsNotificationCount, 
                        paymentsOverdueCount
                      )}
                    </Link>
                  </Button>
                )
              ))}
            </div>
          </div>

         
              {/*
              
            <Button
              variant="ghost"
              onClick={() => setNotificationsOpen(true)}
              className="flex items-center gap-2 relative"
              size="icon"
            >
              <Bell className="h-5 w-5" />
            </Button>
              
              */}

          <div className="hidden sm:block">
          
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={cn(
            "sm:hidden overflow-hidden transition-all duration-300 ease-in-out w-full",
            mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          )}
        >

          {/*
          <Button
              variant="ghost"
              onClick={() => {
                setMobileMenuOpen(false);
                setNotificationsOpen(true);
              }}
              className="justify-start w-full px-4 py-3 h-auto"
            >
              <Bell className="h-5 w-5 ml-2" />
              <span>الإشعارات</span>
            </Button>
          
          */}
          <div className="flex flex-col gap-1 p-2 border-t">
            

            {/* الروابط العادية للجوال */}
            {navLinksAdministrationPage.map((link) => (
              hasPermission(link.permission) && (
                <Button
                  key={link.to}
                  asChild
                  variant={isActive(link.to) ? "default" : "ghost"}
                  className={cn(
                    "justify-start w-full relative transition-colors px-4 py-3 h-auto",
                    !isActive(link.to) &&
                      "text-muted-foreground hover:text-primary"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link to={link.to} className="flex items-center justify-between w-full">
                    <span className="text-sm">{link.mobileText || link.text}</span>
                    
                    {/* Show notification badges for mobile */}
                    {link.to === "orders" && renderNotificationBadge(
                      ordersNotificationCount, 
                      0, 
                      true
                    )}
                    
                    {link.to === "payments" && renderNotificationBadge(
                      paymentsNotificationCount, 
                      paymentsOverdueCount, 
                      true
                    )}
                  </Link>
                </Button>
              )
            ))}
          </div>
        </div>
      </nav>

      {/* استدعاء NotificationsModal منفصل */}
      <NotificationsModal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={[]} // Empty array - no static notifications
        unreadCount={0}
      />

      {/* المحتوى الرئيسي - Responsive padding */}
      <div className="flex-1 p-3 sm:p-4 md:p-5 lg:p-6 space-y-3 sm:space-y-4 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default AdministrationPageLayout;