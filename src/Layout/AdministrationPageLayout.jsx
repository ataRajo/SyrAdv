import React, { useState } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Menu, X } from "lucide-react";
import { navLinksAdministrationPage } from "../Static/StaticData";
import { useAuth } from "../Context/AuthProvider";

const AdministrationPageLayout = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const {hasPermission} = useAuth()

  const isActive = (path) => {
    if (path === "") {
      return location.pathname.endsWith("administration-page");
    }
    return location.pathname.includes(path);
  };

  return (
    <div style={{ direction: "rtl" }} className="flex flex-col h-full">
      <nav className="bg-card border-b">
        <div className="flex items-center justify-between p-4">
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

          <div className="hidden sm:flex gap-2">
            {
            navLinksAdministrationPage.map((link) => (
              
              (hasPermission(link.permission)) ?
              (
                <Button
                key={link.to}
                asChild
                variant={isActive(link.to) ? "default" : "ghost"}
                className={cn(
                  "justify-start",
                  !isActive(link.to) &&
                    "text-muted-foreground hover:text-primary"
                )}
              >
                <Link to={link.to}>{link.text}</Link>
              </Button>
              ) : null
            ))}
          </div>
        </div>

        <div
          className={cn(
            "sm:hidden overflow-hidden transition-all duration-300 ease-in-out",
            mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="flex flex-col gap-2 p-2 border-t">
            {navLinksAdministrationPage.map((link) => (

              
                (hasPermission(link.permission)) ?
                (
                  <Button
                key={link.to}
                asChild
                variant={isActive(link.to) ? "default" : "ghost"}
                className={cn(
                  "justify-start w-full transition-colors",
                  !isActive(link.to) &&
                    "text-muted-foreground hover:text-primary"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Link to={link.to}>{link.mobileText}</Link>
              </Button>
                ) : null

              
              
            ))}
          </div>
        </div>
      </nav>

      {/* <ScrollArea className="flex-1 h-full"> */}
      <div className="p-4 md:p-6  space-y-4">
        <Outlet />
      </div>
      {/* </ScrollArea> */}
    </div>
  );
};

export default AdministrationPageLayout;
