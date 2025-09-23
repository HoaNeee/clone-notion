"use client";

import React from "react";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "./ui/sidebar";
import Link from "next/link";

type MenuItem = {
	icon?: React.ReactNode | string;
	href?: string;
	label?: string;
	onClick?: () => void | Promise<void>;
};

interface Props {
	menu: MenuItem[];
	group?: boolean;
	labelGroup?: string;
}

const SidebarNavList = (props: Props) => {
	const { labelGroup, group, menu } = props;

	const label = group ? (
		<SidebarGroupLabel className="text-sm">{labelGroup}</SidebarGroupLabel>
	) : null;

	return (
		<SidebarGroup>
			{label}
			<SidebarMenu className="gap-1.5">
				{menu.map((item, index) => {
					return <SidebarNavItem key={index} item={item} />;
				})}
			</SidebarMenu>
		</SidebarGroup>
	);
};
const SidebarNavItem = ({ item }: { item?: MenuItem }) => {
	if (!item) {
		return <></>;
	}

	return (
		<SidebarMenuItem>
			{item.href ? (
				<Link href={item.href}>
					<SidebarMenuButton className="cursor-pointer" tooltip={"Create Link"}>
						{item.icon || null}
						<span className="text-base">{item.label}</span>
					</SidebarMenuButton>
				</Link>
			) : (
				<SidebarMenuButton
					className="cursor-pointer"
					tooltip={"Create Link"}
					onClick={item.onClick}
				>
					{item.icon || null}
					<span className="text-base">{item.label}</span>
				</SidebarMenuButton>
			)}
		</SidebarMenuItem>
	);
};

export { SidebarNavList, SidebarNavItem };
