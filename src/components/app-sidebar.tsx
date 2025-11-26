import React from "react";

import AppSidebarClient from "./app-sidebar-client";
import { Sidebar } from "./ui/sidebar";

const AppSidebar = () => {
	return (
		<>
			<Sidebar
				side="left"
				collapsible="offcanvas"
				className="flex-row *:data-[sidebar=sidebar]:flex-row z-21"
			>
				<AppSidebarClient />
			</Sidebar>
		</>
	);
};

export default AppSidebar;
