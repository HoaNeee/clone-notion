"use client";

import React from "react";
import { SidebarNavList } from "./sidebar-nav";
import { Link } from "lucide-react";

const SidebarNavMain = () => {
	return (
		<SidebarNavList
			menu={[
				{
					label: "Home",
					onClick() {
						console.log("ok");
					},
					icon: <Link />,
					href: "/",
				},
			]}
			group
			labelGroup="Main"
		/>
	);
};

export default SidebarNavMain;
