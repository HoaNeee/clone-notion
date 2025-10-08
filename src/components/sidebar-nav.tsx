/* eslint-disable @typescript-eslint/no-explicit-any */
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

export type MenuItem = {
	icon?: React.ReactNode | string;
	href?: string;
	label?: string;
	onClick?: () => void | Promise<void>;
};

interface Props {
	menu: MenuItem[];
	group?: boolean;
	labelGroup?: string;
	renderItem?: (item: MenuItem, key: any) => React.ReactNode;
}

const SidebarNavList = (props: Props) => {
	const { labelGroup, group, menu, renderItem } = props;

	const label = group ? (
		<SidebarGroupLabel className="text-sm">{labelGroup}</SidebarGroupLabel>
	) : null;

	return (
		<SidebarGroup>
			{label}
			<SidebarMenu className="gap-1.5">
				{menu.map((item, index) => {
					return renderItem ? renderItem(item, index) : null;
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
					<SidebarMenuButton className="cursor-pointer">
						{item.icon || null}
						<span className="text-base">{item.label}</span>
					</SidebarMenuButton>
				</Link>
			) : (
				<SidebarMenuButton className="cursor-pointer" onClick={item.onClick}>
					{item.icon || null}
					<span className="text-base">{item.label}</span>
				</SidebarMenuButton>
			)}
		</SidebarMenuItem>
	);
};

export { SidebarNavList, SidebarNavItem };
