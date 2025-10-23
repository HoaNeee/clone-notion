import React from "react";
import { Sidebar, SidebarContent, SidebarHeader } from "./ui/sidebar";
import AppSidebarHeader from "./sidebar-header";
import SidebarNavMainContainer from "./sidebar-nav-main";
import SidebarNavSetting from "./sidebar-nav-setting";

const AppSidebar = () => {
  return (
    <Sidebar side="left" className="not-outside group/sidebar">
      <SidebarHeader>
        <AppSidebarHeader />
      </SidebarHeader>
      <SidebarContent>
        <SidebarNavMainContainer />
        <SidebarNavSetting />
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
