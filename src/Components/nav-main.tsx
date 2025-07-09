import { IconCirclePlusFilled, IconMail, type Icon } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Link, useLocation } from "react-router"
import { useAuth } from "../Context/AuthProvider"

export function NavMain({
  items
}) {
  const { pathname } = useLocation()
  const {hasPermission} =  useAuth()

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
          {items?.map((item) => (
            hasPermission(item.permission) ?
            (<Link 
              key={item.title}
              to={item.url}
              className={`block transition-all duration-200 ${
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
                </SidebarMenuButton>
              </SidebarMenuItem>
            </Link>) : null
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}