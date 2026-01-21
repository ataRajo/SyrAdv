import { IconCirclePlusFilled, IconMail, type Icon } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge, // Add this import
} from "@/components/ui/sidebar"
import { Link, useLocation } from "react-router"
import { useAuth } from "../Context/AuthProvider"
import { useState, useEffect } from "react"

export function NavMain({
  items
}) {
  const { pathname } = useLocation()
  const {hasPermission} =  useAuth()
  const [notificationCount, setNotificationCount] = useState(0)

  // Get notification count from localStorage
  useEffect(() => {
    const getNotificationCount = () => {
      const count = localStorage.getItem('bookingsNotificationCount') || '0'
      setNotificationCount(parseInt(count))
    }
    
    // Check initially
    getNotificationCount()
    
    // Listen for storage changes
    const handleStorageChange = (e) => {
      if (e.key === 'bookingsNotificationCount') {
        getNotificationCount()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Poll for changes every 2 seconds (simple approach)
    const interval = setInterval(getNotificationCount, 2000)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  const isActive = (url) => {
    return pathname === url || pathname.startsWith(`${url}/`)
  }
  
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-1">
        <SidebarMenu>
          {/* <SidebarMenuItem className="flex items-center gap-2">
          </SidebarMenuItem> */}
        </SidebarMenu>
        <SidebarMenu className="space-y-1">
          { items?.length>0 && items && items?.map((item) => (
            hasPermission(item.permission) ?
            (<Link 
              key={item.title}
              to={item.url}
              className={`block transition-all duration-200 relative ${
                isActive(item.url) 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-accent hover:text-accent-foreground'
              } rounded-md`}
            >
              <SidebarMenuItem>
                <SidebarMenuButton 
                  tooltip={item.title}
                  className={`w-full ${
                    isActive(item.url) ? 'font-medium' : 'font-normal'
                  }`}
                >
                  {item.icon && (
                    <item.icon className={`${
                      isActive(item.url) ? 'text-primary-foreground' : 'text-muted-foreground'
                    }`} 
                    size={20} 
                    />
                  )}
                  <span className="mr-2">{item.title}</span>
                  
                  {/* Notification badge for bookings */}
                  {item.url === "/dashboard/bookings" && notificationCount > 0 && (
                    <SidebarMenuBadge className="bg-red-500 text-white">
                      {notificationCount}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </Link>) : null
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}