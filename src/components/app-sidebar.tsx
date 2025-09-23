import React from "react";
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarRail,
} from "./ui/sidebar";
import SidebarNavMain from "./sidebar-nav-main";
import AppSidebarHeader from "./sidebar-header";

const AppSidebar = () => {
	return (
		<Sidebar side="left">
			<SidebarHeader>
				<AppSidebarHeader />
			</SidebarHeader>
			<SidebarContent>
				<SidebarNavMain />
			</SidebarContent>
			<SidebarRail />
		</Sidebar>
	);
};

export default AppSidebar;
