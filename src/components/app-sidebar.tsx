import React from "react";
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarRail,
} from "./ui/sidebar";
import SidebarNavMain from "./sidebar-nav-main";
import AppSidebarHeader from "./sidebar-header";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

const AppSidebar = () => {
	return (
		<Sidebar side="left" className="not-outside">
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
