"use client";

import React from "react";
import { SidebarGroup, useSidebar } from "./ui/sidebar";
// import AppLogo from "./app-logo";

import { Power } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

const AppSidebarHeader = () => {
	const { open } = useSidebar();

	return <SidebarGroup>Header</SidebarGroup>;
};

export default AppSidebarHeader;
