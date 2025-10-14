import React from "react";
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarRail,
} from "./ui/sidebar";
import AppSidebarHeader from "./sidebar-header";
import SidebarNavMainContainer from "./sidebar-nav-main";

const AppSidebar = () => {
	return (
		<Sidebar side="left" className="not-outside">
			<SidebarHeader>
				<AppSidebarHeader />
			</SidebarHeader>
			<SidebarContent>
				<SidebarNavMainContainer />
			</SidebarContent>
			<SidebarRail />
		</Sidebar>
	);
};

export default AppSidebar;
