// src/Components/Broker/BrokerNavbar.jsx
import { useNavigate, useLocation } from "react-router";
import { 
  Home, 
  Calendar, 
  CreditCard, 
  Users, 
  LogOut,
  Bell,
  User,
  MapPin,
  Menu,
  X,
  Map,
  Plus,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useBrokerAuthentication } from "../../Hooks/useBrokerAuthentication";
import { useState } from "react";

export function BrokerNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logoutBroker, getBrokerUser, isLoggingOut } = useBrokerAuthentication();
  const brokerUser = getBrokerUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logoutBroker();  // Now this is async
    // The redirect happens inside logoutBroker, so no need to navigate here
  };

  // Rest of your component remains the same...
  const getUserInitials = () => {
    if (brokerUser?.full_name) {
      return brokerUser.full_name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    if (brokerUser?.username) {
      return brokerUser.username.substring(0, 2).toUpperCase();
    }
    return "BR";
  };

  const navItems = [
    { icon: Home, label: "الرئيسية", href: "/broker/welcome" },
    { icon: Map, label: "الخريطة", href: "/broker/map" },
    { icon: ClipboardList, label: "حجوزاتي", href: "/broker/bookings" },
    { icon: Users, label: "العملاء", href: "/broker/clients" },
    { icon: MapPin, label: "المدن والمناطق", href: "/broker/cities-regions" },
  ];

  const isActive = (href) => {
    if (location.pathname === href) return true;
    if (href === "/broker/bookings" && location.pathname.startsWith("/broker/bookings")) return true;
    return false;
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-lg border-b border-white/20 shadow-lg">
        <div className="w-full px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo - same as before */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-white hover:bg-white/20"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <div 
                className="cursor-pointer"
                onClick={() => navigate("/broker/welcome")}
              >
                <h2 className="text-xl md:text-2xl font-bold text-white">منصة الوسيط</h2>
              </div>
            </div>

            {/* Desktop Navigation - same as before */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Button
                    key={item.label}
                    variant="ghost"
                    className={cn(
                      "text-white hover:bg-white/20 transition-all duration-200",
                      active && "bg-white/20 border-b-2 border-blue-500 rounded-none"
                    )}
                    onClick={() => navigate(item.href)}
                  >
                    <Icon className="h-4 w-4 ml-2" />
                    {item.label}
                  </Button>
                );
              })}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2 md:gap-4">
              <Button
                className="bg-green-600 hover:bg-green-700 text-white hidden md:flex"
                onClick={() => navigate("/broker/bookings/create")}
              >
                <Plus className="h-4 w-4 ml-2" />
                حجز جديد
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="hidden md:block text-right">
                  <p className="text-white text-sm font-medium">
                    {brokerUser?.full_name || brokerUser?.username || "الوسيط"}
                  </p>
                  <Badge className="bg-blue-600 text-xs">وسيط معتمد</Badge>
                </div>
                <Avatar className="h-8 w-8 md:h-10 md:w-10 cursor-pointer hover:opacity-80 transition-opacity">
                  <AvatarFallback className="bg-blue-600 text-white">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Logout Button with loading state */}
              <Button
                variant="ghost"
                size="icon"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
                ) : (
                  <LogOut className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu - same as before */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-slate-900/95 backdrop-blur-lg border-t border-white/20">
            <div className="px-4 py-3 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Button
                    key={item.label}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-white hover:bg-white/20",
                      active && "bg-white/20"
                    )}
                    onClick={() => {
                      navigate(item.href);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <Icon className="h-4 w-4 ml-2" />
                    {item.label}
                  </Button>
                );
              })}
              
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white mt-2"
                onClick={() => {
                  navigate("/broker/bookings/create");
                  setIsMobileMenuOpen(false);
                }}
              >
                <Plus className="h-4 w-4 ml-2" />
                حجز جديد
              </Button>
              
              <div className="pt-3 border-t border-white/20">
                <div className="flex items-center gap-3 p-2">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-600 text-white">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-right">
                    <p className="text-white text-sm font-medium">
                      {brokerUser?.full_name || brokerUser?.username || "الوسيط"}
                    </p>
                    <Badge className="bg-blue-600 text-xs">وسيط معتمد</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      <div className="h-16"></div>
    </>
  );
}