"use client";

import React, { useEffect, useState } from "react";
import {
	SidebarGroup,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "./ui/sidebar";
import { CornerUpLeft, FileIcon, Settings, Trash, Trash2 } from "lucide-react";
import DialogSetting from "./settings/dialog-setting";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { MyInput } from "./ui/input";
import { useWorkspace } from "@/contexts/workspace-context";
import { get } from "@/utils/request";
import { logAction } from "@/lib/utils";
import { TNote } from "@/types/note.type";
import { Button } from "./ui/button";

const PopoverTrash = ({
	open,
	setOpen,
}: {
	open: boolean;
	setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
	const { currentWorkspace } = useWorkspace();
	const [trashNotes, setTrashNotes] = useState<TNote[]>([]);

	useEffect(() => {
		if (!currentWorkspace || !open) return;

		const fetchNotes = async () => {
			try {
				const res = await get(`/trash/${currentWorkspace.id}`);
				setTrashNotes(res.notes);
			} catch (error) {
				logAction("Error fetching trash notes:", error);
			}
		};

		fetchNotes();
	}, [currentWorkspace, open]);

	return (
		<>
			<Popover modal={true} open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<SidebarMenuButton className="font-semibold cursor-pointer">
						<div className="flex items-center gap-2">
							<Trash2 size={20} />
							<p>Trash</p>
						</div>
					</SidebarMenuButton>
				</PopoverTrigger>
				<PopoverContent
					align="center"
					side="right"
					className="px-2 py-3 min-h-50 min-w-sm"
				>
					<div className="flex flex-col">
						<MyInput placeholder="Search page..." />
						<div className="text-sm my-2">Action</div>
						{trashNotes.length ? (
							<div className="flex flex-col gap-1">
								{trashNotes.map((note) => (
									<div
										key={note.id}
										className="w-full flex items-center justify-between text-sm px-2 py-1 rounded-md hover:bg-accent hover:text-accent-foreground"
									>
										<div className="flex gap-2 items-center">
											<FileIcon size={16} className="text-neutral-500" />
											<p className="text-sm">{note.title || "Untitled Note"}</p>
										</div>
										<div className="flex items-center gap-2">
											<Button
												variant={"ghost"}
												className="size-5 rounded-xs text-neutral-500"
											>
												<CornerUpLeft />
											</Button>
											<Button variant={"ghost"} className="size-5 rounded-xs">
												<Trash />
											</Button>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="flex-1 justify-center flex items-center py-8 flex-col gap-2 text-neutral-500 dark:text-neutral-400">
								<Trash size={16} />
								<p className="text-primary">No Result</p>
							</div>
						)}
					</div>
				</PopoverContent>
			</Popover>
		</>
	);
};

const SidebarNavSetting = () => {
	const [openDialogSetting, setOpenDialogSetting] = useState(false);
	const [openPopoverTrash, setOpenPopoverTrash] = useState(false);

	return (
		<>
			<SidebarGroup className="py-0">
				<SidebarMenu className="text-neutral-600 dark:text-neutral-400">
					<SidebarMenuItem className="cursor-pointer">
						<SidebarMenuButton
							className="font-semibold cursor-pointer"
							onClick={() => setOpenDialogSetting(true)}
						>
							<div className="flex items-center gap-2">
								<Settings size={20} />
								<p>Settings</p>
							</div>
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem className="cursor-pointer">
						<PopoverTrash
							open={openPopoverTrash}
							setOpen={setOpenPopoverTrash}
						/>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarGroup>
			<DialogSetting open={openDialogSetting} setOpen={setOpenDialogSetting} />
		</>
	);
};

export default SidebarNavSetting;
