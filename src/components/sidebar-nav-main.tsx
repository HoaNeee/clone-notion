"use client";

import React, {
	Dispatch,
	SetStateAction,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	Baseline,
	ChevronRight,
	Ellipsis,
	File,
	FileText,
	Folder,
	Plus,
	Trash2,
} from "lucide-react";
import { TFolder } from "@/types/folder.type";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
} from "./ui/sidebar";
import Link from "next/link";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "./ui/collapsible";
import { TNote } from "@/types/note.type";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Spinner } from "./ui/spinner";
import AlertDialogConfirm from "./alert-dialog-confirm";
import { useFolderState } from "@/contexts/folder-context";
import MyOverlay from "./overlay";
import { defaultEditorState } from "@/lib/contants";
import { useParams } from "next/navigation";
import { useDrag, useDrop } from "react-dnd";
import { useWorkspace } from "@/contexts/workspace-context";
import { useNote } from "@/contexts/note-context";
import { logAction } from "@/lib/utils";
import { TWorkspaceRole } from "@/types/workspace.type";

const existIds = new Set<number>();

const getTitle = (title: string, type: TFolder["type"]) => {
	if (!title) {
		if (type === "folder") {
			return "New Folder";
		}
		return "New File";
	}
	return title;
};

function canDropItem(itemDragging: TFolder | TNote, itemDrop: TFolder) {
	if (itemDragging.type === "note") {
		itemDragging = itemDragging as TNote;
		return itemDragging.folder_id !== itemDrop.id;
	}

	let isCanDrop = false;

	if (itemDragging.type === "folder") {
		itemDragging = itemDragging as TFolder;

		if (
			itemDragging.id === itemDrop.id ||
			itemDrop.parent_id === itemDragging.id ||
			itemDrop.id === itemDragging.parent_id
		) {
			isCanDrop = false;
		} else {
			isCanDrop = !Find(itemDragging, itemDrop);
		}

		function Find(itemDragging: TFolder, itemDrop: TFolder) {
			const childs = itemDragging.children;
			if (childs && childs.length) {
				for (let child of childs) {
					if (child.type === "folder") {
						child = child as TFolder;
						if (child.id === itemDrop.id) {
							return true;
						} else if (child.children.length) {
							if (Find(child, itemDrop)) {
								return true;
							}
						}
					}
				}
			}
		}
	}

	return isCanDrop;
}

const DropdownAddNew = ({
	folder,
	openCollapsibleFolder,
	openDropdown,
	dropdownContentRef,
	role,
	setOpenCollapsibleFolder,
	setOpenDropdown,
}: {
	folder: TFolder;
	openCollapsibleFolder?: boolean;
	setOpenCollapsibleFolder?: Dispatch<boolean>;
	openDropdown: boolean;
	setOpenDropdown: Dispatch<boolean>;
	dropdownContentRef?: { current: HTMLDivElement | null };
	role: TWorkspaceRole;
}) => {
	const [isCreating, setIsCreating] = useState(false);

	const { fetchDataTree, onAddNew } = useFolderState();

	const fetchData = useCallback(
		async (id: number) => {
			try {
				if (!existIds.has(id)) {
					await fetchDataTree(id);
					existIds.add(id);
				}
			} catch (error) {
				console.log(error);
			}
		},
		[fetchDataTree]
	);

	const handleAddNew = useCallback(
		async (type: TFolder["type"]) => {
			setIsCreating(true);
			try {
				let payload: Partial<TFolder | TNote> = {};

				if (type === "folder") {
					payload = {
						parent_id: folder.id,
						user_id: folder.user_id,
						title: "New Folder",
					};
				}

				if (type === "note") {
					payload = {
						folder_id: folder.id,
						user_id: folder.user_id,
						content: defaultEditorState,
					};
				}

				if (!openCollapsibleFolder && folder.id && !existIds.has(folder.id)) {
					await onAddNew(type, payload, false);
					await fetchData(folder.id);
				} else {
					await onAddNew(type, payload, true);
				}
				setOpenCollapsibleFolder?.(true);
			} catch (error) {
				console.log(error);
			} finally {
				setIsCreating(false);
			}
		},
		[
			folder,
			openCollapsibleFolder,
			setOpenCollapsibleFolder,
			fetchData,
			onAddNew,
		]
	);

	const disableButton = role === "member";

	return (
		<DropdownMenu onOpenChange={setOpenDropdown} open={openDropdown}>
			<DropdownMenuTrigger>
				<div className="text-neutral-500 relative">
					<Plus
						size={20}
						className={`hover:bg-gray-200 rounded-sm px-0.5 ${
							isCreating ? "opacity-0" : "opacity-100"
						}`}
					/>
					<Spinner
						className={`absolute top-1/2 transform -translate-y-1/2 transition-opacity left-0 flex items-center justify-center pointer-events-none ${
							isCreating ? "opacity-100" : "opacity-0"
						}`}
					/>
				</div>
			</DropdownMenuTrigger>
			<DropdownMenuContent ref={dropdownContentRef} className="min-w-46">
				<DropdownMenuGroup>
					<DropdownMenuLabel className="text-neutral-500 text-xs">
						{getTitle(folder.title, folder.type)}
					</DropdownMenuLabel>
					<DropdownMenuItem
						onClick={() => handleAddNew("folder")}
						className="cursor-pointer"
						disabled={disableButton}
					>
						<Folder />
						New Folder
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={() => handleAddNew("note")}
						className="cursor-pointer"
						disabled={disableButton}
					>
						<File />
						New File
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

const DropdownFolderNoteAction = ({
	item,
	openDropdown,
	role,
	setIsEditable,
	setOpenDropdown,
}: {
	item: TFolder | TNote;
	setIsEditable: Dispatch<boolean>;
	openDropdown: boolean;
	setOpenDropdown: Dispatch<boolean>;
	role: TWorkspaceRole;
}) => {
	const [openDialogDelete, setOpenDialogDelete] = useState(false);

	const disableButton = useMemo(() => role === "member", [role]);

	const { onDelete } = useFolderState();

	const handleDelete = async (id: number, type: TFolder["type"]) => {
		try {
			await onDelete(id, type);
			setOpenDialogDelete(false);
		} catch (error) {
			console.log(error);
		}
	};

	if (item.type === "note") {
		item = item as TNote;
		return (
			<>
				<DropdownMenu
					modal={false}
					open={openDropdown}
					onOpenChange={setOpenDropdown}
				>
					<DropdownMenuTrigger asChild>
						<div className="relative">
							<Ellipsis
								size={20}
								className="hover:bg-gray-200 rounded-sm px-0.5 "
							/>
						</div>
					</DropdownMenuTrigger>
					<DropdownMenuContent className="min-w-46 not-outside">
						<DropdownMenuGroup>
							<DropdownMenuLabel className="text-neutral-500 text-xs">
								{getTitle(item.title, item.type)}
							</DropdownMenuLabel>
							<DropdownMenuItem
								disabled={disableButton}
								onClick={() => setIsEditable(true)}
								className="cursor-pointer"
							>
								<Baseline />
								Rename
							</DropdownMenuItem>
							<DropdownMenuItem
								className="cursor-pointer"
								onClick={() => setOpenDialogDelete(true)}
								disabled={disableButton}
							>
								<Trash2 className="text-destructive" />
								<span className="text-destructive">Remove</span>
							</DropdownMenuItem>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
				<AlertDialogConfirm
					open={openDialogDelete}
					setOpen={setOpenDialogDelete}
					onOk={() => handleDelete(item.id, item.type)}
					description={
						<p>
							Are you sure you want to delete{" "}
							<span className="font-medium">{`"${getTitle(
								item.title,
								item.type
							)}"`}</span>
							? This action cannot be undone.
						</p>
					}
				/>
			</>
		);
	}

	return (
		<>
			<DropdownMenu
				modal={false}
				open={openDropdown}
				onOpenChange={setOpenDropdown}
			>
				<DropdownMenuTrigger asChild>
					<div className="relative">
						<Ellipsis
							size={20}
							className="hover:bg-gray-200 rounded-sm px-0.5 text-neutral-500"
						/>
					</div>
				</DropdownMenuTrigger>
				<DropdownMenuContent className="min-w-46 not-outside">
					<DropdownMenuGroup>
						<DropdownMenuLabel className="text-neutral-500 text-xs">
							{getTitle(item.title, item.type)}
						</DropdownMenuLabel>
						<DropdownMenuItem
							onClick={() => setIsEditable(true)}
							className="cursor-pointer"
							disabled={disableButton}
						>
							<Baseline />
							Rename
						</DropdownMenuItem>
						<DropdownMenuItem
							className="cursor-pointer"
							onClick={() => setOpenDialogDelete(true)}
							disabled={disableButton}
						>
							<Trash2 className="text-destructive" />
							<span className="text-destructive">Remove</span>
						</DropdownMenuItem>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
			<AlertDialogConfirm
				open={openDialogDelete}
				setOpen={setOpenDialogDelete}
				onOk={() => handleDelete(item.id, item.type)}
				description={
					<p>
						Are you sure you want to delete{" "}
						<span className="font-medium">{`"${getTitle(
							item.title,
							item.type
						)}"`}</span>
						? This folder can contain other notes and folders and this action
						cannot be undone.
					</p>
				}
			/>
		</>
	);
};

const DraggingContainer = ({
	children,
	item,
	className,
	onDrop,
	type = "folder",
	data,
	rootFolder,
	onClick,
}: {
	children: React.ReactNode;
	item: TFolder;
	className?: string;
	onDrop?: (item: TFolder | TNote, next_item: TFolder) => void | Promise<void>;
	type?: TFolder["type"];
	data: (TFolder | TNote)[];
	rootFolder: TFolder;
	onClick?: () => void;
}) => {
	const [{ isOver, canDrop }, drop] = useDrop(
		() => ({
			accept: ["folder", "note"],
			drop(itemDragging) {
				onDrop?.(itemDragging as TFolder | TNote, item);
			},
			collect(monitor) {
				return {
					isOver: !!monitor.isOver(),
					canDrop: !!monitor.canDrop(),
				};
			},
			canDrop(itemDragging) {
				const newItemDragging = itemDragging as TFolder;
				const itemDrop = item as TFolder;

				const isCanDrop = canDropItem(newItemDragging, itemDrop);

				return isCanDrop;
			},
		}),
		[item, data, type]
	);

	//isOver + canDrop + hover => add class
	useEffect(() => {
		const elements = document.querySelectorAll(`div[data-id="${item.id}"]`);
		const cn = "nav-item-dragging";

		for (const el of elements) {
			const type = el.getAttribute("data-type");
			if (type === item.type) {
				if (el instanceof HTMLElement) {
					if (isOver && canDrop) {
						el.classList.add(cn);
					} else {
						el.classList.remove(cn);
					}
				}
				return;
			}
		}

		const list = document.querySelector(".list-container");
		if (!list) {
			return;
		}

		if (item.id === rootFolder.id) {
			if (isOver && canDrop) {
				list.classList.add(cn);
			} else {
				list.classList.remove(cn);
			}
		}
	}, [rootFolder, isOver, canDrop, item]);

	return (
		<div
			className={`block ${isOver && canDrop ? "bg-[#77c5f81a]" : ""} ${
				className || ""
			}`}
			ref={(val) => {
				drop(val);
			}}
			onClick={onClick}
		>
			{children}
		</div>
	);
};

const NavItemNote = ({ note, role }: { note: TNote; role: TWorkspaceRole }) => {
	const { onUpdate } = useFolderState();

	const [isEditable, setIsEditable] = useState(false);
	const [openDropdownAction, setOpenDropdownAction] = useState(false);
	const [noteTitle, setNoteTitle] = useState<TFolder["title"]>(
		note.type === "note" ? note.title : ""
	);
	const [isUpdating, setIsUpdating] = useState(false);

	const params = useParams();
	const slug = params.slug as string | undefined;
	const active = slug && note.type === "note" && slug === (note as TNote).slug;

	const [{ isDragging: isDraggingNote }, dragNote] = useDrag(() => ({
		type: "folder",
		item: note as TNote,
		collect(monitor) {
			return { isDragging: !!monitor.isDragging() };
		},
	}));

	const handleUpdate = useCallback(
		async (id: number, payload: Partial<TNote>, type: TFolder["type"]) => {
			setIsUpdating(true);
			try {
				await onUpdate({
					id,
					payload,
					type,
					isUpdateData: true,
					is_in_teamspace: note.is_in_teamspace,
				});
				setIsEditable(false);
			} catch (error) {
				logAction("Error updating item note:", error);
			} finally {
				setIsUpdating(false);
			}
		},
		[onUpdate, note]
	);

	return (
		<>
			{openDropdownAction && <MyOverlay />}
			{isEditable ? (
				<SidebarMenuItem className="relative">
					<input
						autoFocus
						className="px-2 py-1 w-full outline-[1px] rounded-sm outline-gray-200 text-sm"
						onBlur={() => {
							handleUpdate(
								note.id,
								{ folder_id: note.folder_id, title: noteTitle },
								note.type
							);
						}}
						onKeyUp={(e) => {
							if (!e.shiftKey && e.key === "Enter") {
								handleUpdate(
									note.id,
									{ folder_id: note.folder_id, title: noteTitle },
									note.type
								);
							}
						}}
						value={noteTitle || ""}
						onChange={(e) => setNoteTitle(e.target.value)}
					/>
					{isUpdating && (
						<div className="right-2 top-1/2 absolute transform -translate-y-1/2">
							<Spinner />
						</div>
					)}
				</SidebarMenuItem>
			) : (
				<SidebarMenuItem
					className="group/item"
					ref={(val) => {
						dragNote(val);
					}}
					data-type={note.type}
					data-id={note.id}
					style={{
						opacity: isDraggingNote ? 0.5 : 1,
						pointerEvents: isDraggingNote ? "none" : "auto",
					}}
				>
					<SidebarMenuButton
						className={`cursor-pointer relative text-neutral-500 hover:text-black/80 transition-colors ${
							active
								? "bg-neutral-200/40 hover:bg-neutral-200 text-black/70"
								: ""
						}`}
					>
						<Link
							href={note.slug || "/"}
							className="relative z-0 flex flex-1 gap-2 text-sm font-medium"
						>
							<FileText size={20} className="" />
							<span className="text-ellipsis line-clamp-1 max-w-full">
								{getTitle(note.title, note.type)}
							</span>
						</Link>
						<SidebarMenuAction asChild showOnHover>
							<div className="right-4 hover:bg-transparent flex items-center">
								<DropdownFolderNoteAction
									item={note}
									setIsEditable={setIsEditable}
									openDropdown={openDropdownAction}
									setOpenDropdown={setOpenDropdownAction}
									role={role}
								/>
							</div>
						</SidebarMenuAction>
					</SidebarMenuButton>
				</SidebarMenuItem>
			)}
		</>
	);
};

const NavItemFolder = ({
	folder,
	rootFolder,
	data,
	role,
}: {
	folder: TFolder;
	rootFolder: TFolder;
	data: (TFolder | TNote)[];
	role: TWorkspaceRole;
}) => {
	const { fetchDataTree, onUpdate, foldersDefaultOpen, setFoldersDefaultOpen } =
		useFolderState();

	const [isEditable, setIsEditable] = useState(false);
	const [openDropdownAction, setOpenDropdownAction] = useState(false);
	const [openDropdownAddNew, setOpenDropdownAddNew] = useState(false);
	const [openCollapsibleFolder, setOpenCollapsibleFolder] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);
	const [folderTitle, setFolderTitle] = useState<TFolder["title"]>(
		folder.type === "folder" ? folder.title : ""
	);

	const navItemElementRef = useRef<HTMLDivElement | null>(null);

	const [{ isDragging: isDraggingFolder }, dragFolder] = useDrag(() => ({
		type: "folder",
		item: folder as TFolder,
		collect(monitor) {
			return { isDragging: !!monitor.isDragging(), item: monitor.getItem() };
		},
	}));

	const fetchData = useCallback(
		async (id: number, is_in_teamspace: boolean) => {
			try {
				if (!existIds.has(id)) {
					await fetchDataTree(id, is_in_teamspace);
					existIds.add(id);
				}
			} catch (error) {
				logAction("Error fetching folder data tree:", error);
			}
		},
		[fetchDataTree]
	);

	//open default when reload
	useEffect(() => {
		const navItemElement = navItemElementRef.current;

		if (!navItemElement) {
			return;
		}

		if (foldersDefaultOpen && foldersDefaultOpen.length) {
			for (const folder of foldersDefaultOpen) {
				const type = navItemElement.getAttribute("data-type");
				const id = navItemElement.getAttribute("data-id");
				if (type === "folder" && id === folder.id.toString()) {
					setFoldersDefaultOpen(
						foldersDefaultOpen.filter((f) => f.id !== folder.id)
					);
					setOpenCollapsibleFolder(true);
				}
			}
		}
	}, [foldersDefaultOpen, setFoldersDefaultOpen]);

	useEffect(() => {
		if (rootFolder && folder.type === "folder" && rootFolder.id === folder.id) {
			setOpenCollapsibleFolder(true);
		}
	}, [rootFolder, folder]);

	const onOpenChange = (val: boolean, is_in_teamspace: boolean) => {
		if (val) {
			fetchData(folder.id, is_in_teamspace);
		}
		setOpenCollapsibleFolder(val);
	};

	const handleUpdate = async (
		id: number,
		payload: Partial<TFolder | TNote>,
		type: TFolder["type"]
	) => {
		setIsUpdating(true);
		try {
			await onUpdate({ id, payload, type });
			setIsEditable(false);
		} catch (error) {
			logAction("Error updating item folder:", error);
		} finally {
			setIsUpdating(false);
		}
	};

	const onDrop = useCallback(
		async (item: TFolder | TNote, folder: TFolder) => {
			//item -> dragged item, folder -> drop to folder (default is folder)
			let payload = {
				...item,
			} as Partial<TFolder | TNote>;

			if (item.type === "folder") {
				payload = {
					...payload,
					parent_id: folder.id,
				};
			}

			if (item.type === "note") {
				payload = {
					folder_id: folder.id,
				};
			}

			if (!openCollapsibleFolder && !existIds.has(folder.id)) {
				fetchData(folder.id, folder.is_in_teamspace);
			}
			setOpenCollapsibleFolder(true);
			try {
				if (!!item.is_in_teamspace !== !!folder.is_in_teamspace) {
					console.log("Confirm");
				}
				setIsUpdating(true);
				// await onUpdate(item.id, payload, item.type);
				console.log("Update item drop:", item, "to folder:", folder);
			} catch (error) {
				logAction("Error updating item drop:", error);
			} finally {
				setIsUpdating(false);
			}
		},
		[openCollapsibleFolder, fetchData]
	);

	return (
		<>
			{(openDropdownAction || openDropdownAddNew) && <MyOverlay />}
			<Collapsible
				open={openCollapsibleFolder}
				onOpenChange={(val) => onOpenChange(val, folder.is_in_teamspace)}
				data-type={folder.type}
				data-id={folder.id}
				ref={(val) => {
					if (
						!(
							rootFolder &&
							folder.type === "folder" &&
							rootFolder.id === folder.id
						)
					) {
						dragFolder(val);
					}
					navItemElementRef.current = val;
				}}
				style={{
					opacity: isDraggingFolder ? 0.5 : 1,
					pointerEvents: isDraggingFolder ? "none" : "auto",
				}}
				//confirm
				onDrop={(e) => {
					if (isDraggingFolder) {
						e.preventDefault();
						e.stopPropagation();
					}
				}}
			>
				{isEditable ? (
					<>
						<input
							autoFocus
							className="px-2 py-1 w-full outline-[1px] rounded-sm outline-gray-200 text-sm"
							onBlur={() => {
								handleUpdate(
									folder.id,
									{ parent_id: folder.parent_id, title: folderTitle },
									"folder"
								);
							}}
							onKeyUp={(e) => {
								if (!e.shiftKey && e.key === "Enter") {
									handleUpdate(
										folder.id,
										{ parent_id: folder.parent_id, title: folderTitle },
										"folder"
									);
								}
							}}
							value={folderTitle}
							onChange={(e) => setFolderTitle(e.target.value)}
						/>
						{isUpdating && (
							<div className="right-2 top-1/2 absolute transform -translate-y-1/2">
								<Spinner />
							</div>
						)}
					</>
				) : (
					<DraggingContainer
						item={folder}
						onDrop={onDrop}
						data={data}
						rootFolder={rootFolder}
					>
						<SidebarMenuItem className="group/item text-neutral-500">
							<CollapsibleTrigger asChild>
								<SidebarMenuButton className="relative cursor-pointer">
									<div className="relative font-medium">
										<Folder
											size={20}
											className="group-hover/item:opacity-0 flex items-center justify-center pointer-events-none"
										/>
										<div
											className={`group-hover/item:opacity-100 opacity-0 group-hover/item:z-999 absolute top-0 left-0 items-center justify-center transition-all hover:bg-gray-200/80 active:bg-gray-300 rounded-sm transform ${
												openCollapsibleFolder ? "rotate-90" : ""
											}`}
										>
											<ChevronRight size={20} />
										</div>
									</div>

									<span className="text-ellipsis line-clamp-1 max-w-full font-medium">
										{folder.title || "New Folder"}
									</span>
								</SidebarMenuButton>
							</CollapsibleTrigger>

							<SidebarMenuAction asChild showOnHover>
								<div className="right-4 hover:bg-transparent flex items-center">
									<DropdownFolderNoteAction
										item={folder}
										setIsEditable={setIsEditable}
										openDropdown={openDropdownAction}
										setOpenDropdown={setOpenDropdownAction}
										role={role}
									/>
									<DropdownAddNew
										folder={folder}
										setOpenCollapsibleFolder={setOpenCollapsibleFolder}
										openCollapsibleFolder={openCollapsibleFolder}
										openDropdown={openDropdownAddNew}
										setOpenDropdown={setOpenDropdownAddNew}
										role={role}
									/>
								</div>
							</SidebarMenuAction>
						</SidebarMenuItem>
					</DraggingContainer>
				)}

				<CollapsibleContent>
					<div className="text-neutral-500 px-2 text-sm">
						<NavList
							data={folder.children || []}
							rootFolder={rootFolder}
							role={role}
						/>
					</div>
				</CollapsibleContent>
			</Collapsible>
		</>
	);
};

const NavList = ({
	data,
	itemWorking,
	setItemWorking,
	rootFolder,
	role = "member",
}: {
	data: (TFolder | TNote)[];
	itemWorking?: TFolder | TNote | null;
	setItemWorking?: Dispatch<SetStateAction<TFolder | TNote | null>>;
	rootFolder: TFolder | null;
	role?: TWorkspaceRole;
}) => {
	const listRef = useRef<HTMLUListElement | null>(null);

	//adjust update
	useEffect(() => {
		const list = listRef.current;
		if (!list) {
			return;
		}

		let timeout = null;
		if (itemWorking) {
			const elements = list.querySelectorAll(`[data-id="${itemWorking.id}"]`);

			for (const el of elements) {
				const type = el.getAttribute("data-type");
				if (type === itemWorking.type) {
					const className = "nav-sidebar-item-focused";
					el.classList.add(className);
					timeout = setTimeout(() => {
						el.classList.remove(className);
						setItemWorking?.(null);
					}, 5000);
					return;
				}
			}
		}

		return () => {
			if (timeout) {
				clearTimeout(timeout);
			}
		};
	}, [data, itemWorking, setItemWorking]);

	if (!rootFolder) {
		return null;
	}

	return data.length ? (
		<SidebarMenu className="" ref={listRef}>
			{data.map((item, index) => {
				if (item.type === "note") {
					return (
						<NavItemNote
							note={item as TNote}
							key={`${item.id}-${item.type}-${index}`}
							role={role}
						/>
					);
				}
				if (item.type === "folder") {
					return (
						<NavItemFolder
							folder={item as TFolder}
							rootFolder={rootFolder}
							data={data}
							key={`${item.id}-${item.type}-${index}`}
							role={role}
						/>
					);
				}
				return null;
			})}
		</SidebarMenu>
	) : (
		<p className="text-sm text-center">Empty Folder</p>
	);
};

const ListPrivate = ({
	rootFolder,
	data,
	itemWorking,
	setItemWorking,
	role = "admin",
}: {
	rootFolder: TFolder;
	data: (TFolder | TNote)[];
	itemWorking?: TFolder | TNote | null;
	setItemWorking?: Dispatch<SetStateAction<TFolder | TNote | null>>;
	role?: TWorkspaceRole;
}) => {
	const [openCollapsible, setOpenCollapsible] = useState(true);
	const [openDropdownAddNew, setOpenDropdownAddNew] = useState(false);

	const sidebarRef = useRef<HTMLDivElement | null>(null);

	const dropdownContentRef = useRef<HTMLDivElement | null>(null);

	const [{ isOver, canDrop }, drop] = useDrop(
		() => ({
			accept: ["folder", "note"],
			drop(itemDragging) {
				if (rootFolder) {
					handleDropItemToRoot(itemDragging as TFolder | TNote, rootFolder);
				}
			},
			collect(monitor) {
				return {
					isOver: !!monitor.isOver(),
					canDrop: !!monitor.canDrop(),
				};
			},
			canDrop(itemDragging) {
				const newItemDragging = itemDragging as TFolder | TNote;

				if (!rootFolder) {
					return false;
				}

				const itemDrop = rootFolder;

				const isCanDrop = canDropItem(newItemDragging, itemDrop);

				return isCanDrop;
			},
		}),
		[rootFolder, data]
	);

	useEffect(() => {
		const sidebarElem = sidebarRef.current;

		if (!rootFolder || !sidebarElem) {
			return;
		}

		existIds.add(rootFolder.id);

		const cn = "nav-item-dragging";

		if (isOver && canDrop) {
			sidebarElem.classList.add(cn);
		} else {
			sidebarElem.classList.remove(cn);
		}
	}, [rootFolder, isOver, canDrop]);

	const handleDropItemToRoot = useCallback(
		async (item: TFolder | TNote, next: TFolder) => {
			let payload = {
				...item,
			} as Partial<TFolder | TNote>;

			if (item.type === "folder") {
				payload = {
					...payload,
					parent_id: next.id,
				};
			}

			if (item.type === "note") {
				payload = {
					folder_id: next.id,
				};
			}
			try {
				if (!!item.is_in_teamspace !== !!next.is_in_teamspace) {
					console.log("Confirm");
				}

				// setIsUpdating(true);
				// await onUpdate(item.id, payload, item.type);

				console.log("Update item drop:", item, "to root folder:", next);
			} catch (error) {
				console.log(error);
			} finally {
				// setIsUpdating(false);
			}
		},
		[]
	);

	const $onClick = useCallback(
		(e: React.MouseEvent) => {
			const dropdownContent = dropdownContentRef.current;

			if (!dropdownContent) {
				setOpenCollapsible(!openCollapsible);
				return;
			}

			if (dropdownContent.contains(e.target as Node)) {
				return;
			}

			setOpenCollapsible(!openCollapsible);
		},
		[setOpenCollapsible, openCollapsible]
	);

	return (
		<SidebarGroup className="list-container" ref={sidebarRef}>
			<Collapsible open={openCollapsible} defaultOpen={true} draggable={false}>
				<CollapsibleTrigger asChild draggable={false}>
					<SidebarGroupLabel
						className="group/item hover:bg-neutral-100 relative flex items-center justify-between cursor-pointer mb-0.5"
						asChild
						onClick={$onClick}
					>
						<DraggingContainer
							onDrop={handleDropItemToRoot}
							data={data}
							item={rootFolder}
							rootFolder={rootFolder}
						>
							<div className="">
								<span className="text-neutral-400 text-xs font-semibold">
									Private
								</span>
								<div className="group-hover/item:opacity-100 text-neutral-500 right-2 top-1/2 absolute flex items-center gap-1 transition-opacity transform -translate-y-1/2 opacity-0">
									<DropdownAddNew
										folder={rootFolder}
										openDropdown={openDropdownAddNew}
										setOpenDropdown={setOpenDropdownAddNew}
										setOpenCollapsibleFolder={setOpenCollapsible}
										openCollapsibleFolder={openCollapsible}
										dropdownContentRef={dropdownContentRef}
										role={role}
									/>
								</div>
							</div>
						</DraggingContainer>
					</SidebarGroupLabel>
				</CollapsibleTrigger>

				<CollapsibleContent className="h-full">
					<NavList
						data={data}
						rootFolder={rootFolder}
						itemWorking={itemWorking}
						setItemWorking={setItemWorking}
						role={role}
					/>
				</CollapsibleContent>
			</Collapsible>

			{openCollapsible && (
				<div
					className="min-h-5"
					draggable={false}
					ref={(val) => {
						drop(val);
					}}
				/>
			)}
		</SidebarGroup>
	);
};

const ListTeamspace = ({
	data,
	rootFolder,
	itemWorking,
	setItemWorking,
	role,
}: {
	data: (TFolder | TNote)[];
	rootFolder: TFolder | null;
	itemWorking: TNote | TFolder | null;
	setItemWorking: Dispatch<SetStateAction<TNote | TFolder | null>>;
	role: TWorkspaceRole;
}) => {
	return (
		<SidebarGroup>
			<SidebarGroupLabel className="text-neutral-400 text-xs font-semibold">
				Teamspaces
			</SidebarGroupLabel>
			<NavList
				data={data}
				rootFolder={rootFolder}
				itemWorking={itemWorking}
				setItemWorking={setItemWorking}
				role={role}
			/>
			<SidebarMenuItem>
				<SidebarMenuButton className="cursor-pointer text-neutral-500">
					<Plus />
					Invite Members
				</SidebarMenuButton>
			</SidebarMenuItem>
		</SidebarGroup>
	);
};

const SidebarNavMain = () => {
	const {
		dataTree,
		rootFolder,
		dataTreeInTeamspace,
		rootFolderInTeamspace,
		itemWorking,
		setItemWorking,
	} = useFolderState();

	const { isGuestInWorkspace, currentWorkspace } = useWorkspace();
	const { currentNote, differentNotesPublished } = useNote();

	//note shared
	if (isGuestInWorkspace && currentNote) {
		return (
			<SidebarGroup>
				<SidebarGroupLabel className="text-neutral-400 text-xs font-semibold">
					Shared
				</SidebarGroupLabel>
				<SidebarMenu>
					<SidebarMenuItem className="group/item">
						<SidebarMenuButton
							className={`cursor-pointer relative text-neutral-500 hover:text-black/80 transition-colors`}
						>
							<Link
								href={currentNote.slug || "/"}
								className="relative z-0 flex flex-1 gap-2 text-sm font-medium"
							>
								<FileText size={20} className="" />
								<span className="text-ellipsis line-clamp-1 max-w-full">
									{getTitle(currentNote.title, currentNote.type)}
								</span>
							</Link>
							<SidebarMenuAction asChild showOnHover>
								<div className="right-4 hover:bg-transparent flex items-center">
									<div className="relative">
										<Ellipsis
											size={20}
											className="hover:bg-gray-200 rounded-sm px-0.5 "
										/>
									</div>
								</div>
							</SidebarMenuAction>
						</SidebarMenuButton>
					</SidebarMenuItem>
					{differentNotesPublished && differentNotesPublished.length
						? differentNotesPublished.map((note) => (
								<SidebarMenuItem className="group/item" key={note.id}>
									<SidebarMenuButton
										className={`cursor-pointer relative text-neutral-500 hover:text-black/80 transition-colors`}
									>
										<Link
											href={note.slug || "/"}
											className="relative z-0 flex flex-1 gap-2 text-sm font-medium"
										>
											<FileText size={20} className="" />
											<span className="text-ellipsis line-clamp-1 max-w-full">
												{getTitle(note.title, note.type)}
											</span>
										</Link>
										<SidebarMenuAction asChild showOnHover>
											<div className="right-4 hover:bg-transparent flex items-center">
												<div className="relative">
													<Ellipsis
														size={20}
														className="hover:bg-gray-200 rounded-sm px-0.5 "
													/>
												</div>
											</div>
										</SidebarMenuAction>
									</SidebarMenuButton>
								</SidebarMenuItem>
						  ))
						: null}
				</SidebarMenu>
			</SidebarGroup>
		);
	}

	if (!rootFolder) {
		return null;
	}

	return (
		<>
			<ListPrivate rootFolder={rootFolder} data={dataTree} role="admin" />
			<ListTeamspace
				data={dataTreeInTeamspace}
				rootFolder={rootFolderInTeamspace}
				itemWorking={itemWorking}
				setItemWorking={setItemWorking}
				role={currentWorkspace?.role || "member"}
			/>
		</>
	);
};

export default SidebarNavMain;
