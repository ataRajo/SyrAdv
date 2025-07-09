import * as React from "react";


import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu
} from "@/components/ui/sidebar";
import { useGetProfileQuery } from "../RtkQuery/Slice/Auth/AuthApi";
import { useLocation } from "react-router";
import { navLinkSidebar } from "../Static/StaticData";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: profile, isSuccess } = useGetProfileQuery();

  const data = {
    user: {
      name: isSuccess ? profile.full_name : "",
      email: isSuccess ? profile.email : "",
      avatar: "/avatars/shadcn.jpg",
    },
    navMain:navLinkSidebar
  };

  return (
    <Sidebar  collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu></SidebarMenu>
      </SidebarHeader>
      <SidebarContent style={{ marginTop: "30px" }}>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}