"use client";

import React, {
	Dispatch,
	SetStateAction,
	useCallback,
	useEffect,
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

const BtnAddNew = ({
	folder,
	openCollapsibleFolder,
	setOpenCollapsibleFolder,
	openDropdown,
	setOpenDropdown,
}: {
	folder: TFolder;
	openCollapsibleFolder: boolean;
	setOpenCollapsibleFolder: Dispatch<boolean>;
	openDropdown: boolean;
	setOpenDropdown: Dispatch<boolean>;
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
				setOpenCollapsibleFolder(true);
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

	return (
		<DropdownMenu onOpenChange={setOpenDropdown} open={openDropdown}>
			<DropdownMenuTrigger>
				<div className="relative">
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
			<DropdownMenuContent className="min-w-46">
				<DropdownMenuGroup>
					<DropdownMenuLabel className="text-neutral-500 text-xs">
						{getTitle(folder.title, folder.type)}
					</DropdownMenuLabel>
					<DropdownMenuItem
						onClick={() => handleAddNew("folder")}
						className="cursor-pointer"
					>
						<Folder />
						New Folder
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={() => handleAddNew("note")}
						className="cursor-pointer"
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
	setIsEditable,
	openDropdown,
	setOpenDropdown,
}: {
	item: TFolder | TNote;
	setIsEditable: Dispatch<boolean>;
	openDropdown: boolean;
	setOpenDropdown: Dispatch<boolean>;
}) => {
	const [openDialogDelete, setOpenDialogDelete] = useState(false);

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
								className="hover:bg-gray-200 rounded-sm px-0.5"
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
							>
								<Baseline />
								Rename
							</DropdownMenuItem>
							<DropdownMenuItem
								className="cursor-pointer"
								onClick={() => setOpenDialogDelete(true)}
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
							className="hover:bg-gray-200 rounded-sm px-0.5"
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
						>
							<Baseline />
							Rename
						</DropdownMenuItem>
						<DropdownMenuItem
							className="cursor-pointer"
							onClick={() => setOpenDialogDelete(true)}
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
}: {
	children: React.ReactNode;
	item: TFolder;
	className?: string;
	onDrop?: (item: TFolder | TNote, next_item: TFolder) => void | Promise<void>;
	type?: TFolder["type"];
	data: (TFolder | TNote)[];
}) => {
	const { rootFolder } = useFolderState();

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
			className={`block ${isOver && canDrop ? "bg-blue-100/30" : ""} ${
				className || ""
			}`}
			ref={(val) => {
				drop(val);
			}}
		>
			{children}
		</div>
	);
};

const NavItem = ({
	item,
	data,
}: {
	item: TFolder | TNote;
	data: (TFolder | TNote)[];
}) => {
	const { fetchDataTree, onUpdate, foldersDefaultOpen, setFoldersDefaultOpen } =
		useFolderState();

	const [openCollapsibleFolder, setOpenCollapsibleFolder] = useState(false);
	const [isEditable, setIsEditable] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);
	const [folderTitle, setFolderTitle] = useState<TFolder["title"]>(
		item.type === "folder" ? item.title : ""
	);
	const [noteTitle, setNoteTitle] = useState<TFolder["title"]>(
		item.type === "note" ? item.title : ""
	);
	const [openDropdownAction, setOpenDropdownAction] = useState(false);
	const [openDropdownAddNew, setOpenDropdownAddNew] = useState(false);

	const navItemElementRef = useRef<HTMLLIElement | HTMLDivElement | null>(null);
	const params = useParams();
	const slug = params.slug as string | undefined;

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

	const [{ isDragging: isDraggingFolder }, dragFolder] = useDrag(() => ({
		type: "folder",
		item: item as TFolder,
		collect(monitor) {
			return { isDragging: !!monitor.isDragging(), item: monitor.getItem() };
		},
	}));

	const [{ isDragging: isDraggingNote }, dragNote] = useDrag(() => ({
		type: "folder",
		item: item as TNote,
		collect(monitor) {
			return { isDragging: !!monitor.isDragging() };
		},
	}));

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

	const handleUpdate = async (
		id: number,
		payload: Partial<TFolder | TNote>,
		type: TFolder["type"]
	) => {
		setIsUpdating(true);
		try {
			await onUpdate(id, payload, type);
			setIsEditable(false);
		} catch (error) {
			console.log(error);
		} finally {
			setIsUpdating(false);
		}
	};

	const onOpenChange = (val: boolean) => {
		if (val) {
			fetchData(item.id);
		}
		setOpenCollapsibleFolder(val);
	};

	const onDrop = useCallback(
		async (item: TFolder | TNote, folder: TFolder) => {
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
				fetchData(folder.id);
			}
			setOpenCollapsibleFolder(true);
			try {
				setIsUpdating(true);
				await onUpdate(item.id, payload, item.type);
			} catch (error) {
				console.log(error);
			} finally {
				setIsUpdating(false);
			}
		},
		[openCollapsibleFolder, fetchData, onUpdate]
	);

	if (item.type === "note") {
		const note = item as TNote;
		return (
			<>
				{(openDropdownAction || openDropdownAddNew) && <MyOverlay />}
				{isEditable ? (
					<>
						<input
							autoFocus
							className="px-2 py-1 w-full outline-[1px] rounded-sm outline-gray-200 text-sm"
							onBlur={() => {
								handleUpdate(
									item.id,
									{ folder_id: note.folder_id, title: noteTitle },
									item.type
								);
							}}
							onKeyUp={(e) => {
								if (!e.shiftKey && e.key === "Enter") {
									handleUpdate(
										item.id,
										{ folder_id: note.folder_id, title: noteTitle },
										item.type
									);
								}
							}}
							value={noteTitle}
							onChange={(e) => setNoteTitle(e.target.value)}
						/>
						{isUpdating && (
							<div className="absolute right-2 top-1/2 transform -translate-y-1/2">
								<Spinner />
							</div>
						)}
					</>
				) : (
					<SidebarMenuItem
						className="group/item"
						ref={(val) => {
							dragNote(val);
							navItemElementRef.current = val;
						}}
						data-type={note.type}
						data-id={note.id}
						style={{
							opacity: isDraggingNote ? 0.5 : 1,
							pointerEvents: isDraggingNote ? "none" : "auto",
						}}
					>
						<SidebarMenuButton
							className={`cursor-pointer relative ${
								slug && slug === note.slug
									? "bg-neutral-200/40 hover:bg-neutral-200"
									: ""
							}`}
						>
							<Link
								href={note.slug || "/"}
								className="flex gap-2 relative z-0 flex-1 text-sm text-neutral-500 font-medium"
							>
								<FileText size={20} className="" />
								<span className="max-w-full text-ellipsis line-clamp-1">
									{getTitle(note.title, note.type)}
								</span>
							</Link>
							<div className="group-hover/item:opacity-100 hover:bg-gray-200 text-neutral-500 rounded-sm opacity-0 transition-opacity absolute right-2 top-1/2 transform -translate-y-1/2">
								<DropdownFolderNoteAction
									item={note}
									setIsEditable={setIsEditable}
									openDropdown={openDropdownAction}
									setOpenDropdown={setOpenDropdownAction}
								/>
							</div>
						</SidebarMenuButton>
					</SidebarMenuItem>
				)}
			</>
		);
	}

	if (item.type === "folder") {
		const folder = item as TFolder;
		return (
			<>
				{(openDropdownAction || openDropdownAddNew) && <MyOverlay />}
				<Collapsible
					open={openCollapsibleFolder}
					onOpenChange={onOpenChange}
					draggable={true}
					data-type={folder.type}
					data-id={folder.id}
					ref={(val) => {
						dragFolder(val);
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
										item.id,
										{ parent_id: folder.parent_id, title: folderTitle },
										"folder"
									);
								}}
								onKeyUp={(e) => {
									if (!e.shiftKey && e.key === "Enter") {
										handleUpdate(
											item.id,
											{ parent_id: folder.parent_id, title: folderTitle },
											"folder"
										);
									}
								}}
								value={folderTitle}
								onChange={(e) => setFolderTitle(e.target.value)}
							/>
							{isUpdating && (
								<div className="absolute right-2 top-1/2 transform -translate-y-1/2">
									<Spinner />
								</div>
							)}
						</>
					) : (
						<DraggingContainer item={folder} onDrop={onDrop} data={data}>
							<SidebarMenuItem className="group/item text-neutral-500">
								<CollapsibleTrigger asChild>
									<SidebarMenuButton className="cursor-pointer relative ">
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

										<span className="max-w-full text-ellipsis line-clamp-1 font-medium ">
											{folder.title || "New Folder"}
										</span>
									</SidebarMenuButton>
								</CollapsibleTrigger>

								<div className="group-hover/item:opacity-100 opacity-0 text-neutral-500 transition-opacity absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1 items-center">
									<DropdownFolderNoteAction
										item={item}
										setIsEditable={setIsEditable}
										openDropdown={openDropdownAction}
										setOpenDropdown={setOpenDropdownAction}
									/>
									<BtnAddNew
										folder={folder}
										setOpenCollapsibleFolder={setOpenCollapsibleFolder}
										openCollapsibleFolder={openCollapsibleFolder}
										openDropdown={openDropdownAddNew}
										setOpenDropdown={setOpenDropdownAddNew}
									/>
								</div>
							</SidebarMenuItem>
						</DraggingContainer>
					)}

					<CollapsibleContent>
						<div className="px-2 text-sm text-neutral-500">
							<NavList data={folder.children || []} />
						</div>
					</CollapsibleContent>
				</Collapsible>
			</>
		);
	}
};

const NavList = ({
	data,
	itemWorking,
	setItemWorking,
}: {
	data: (TFolder | TNote)[];
	itemWorking?: TFolder | TNote | null;
	setItemWorking?: Dispatch<SetStateAction<TFolder | TNote | null>>;
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

	return data.length ? (
		<SidebarMenu className="" ref={listRef}>
			{data.map((item, index) => {
				return (
					<NavItem
						item={item}
						key={`${item.id}-${item.type}-${index}`}
						data={data}
					/>
				);
			})}
		</SidebarMenu>
	) : (
		<p className="text-center text-sm">Empty Folder</p>
	);
};

const NavListContainer = () => {
	const { newData, itemWorking, setItemWorking } = useFolderState();

	return (
		<NavList
			data={newData}
			itemWorking={itemWorking}
			setItemWorking={setItemWorking}
		/>
	);
};

const SidebarNavMain = () => {
	const { newData, rootFolder, onUpdate } = useFolderState();
	const [isUpdating, setIsUpdating] = useState(false);

	const sidebarRef = useRef<HTMLDivElement | null>(null);

	const handleDropItem = async (item: TFolder | TNote, next: TFolder) => {
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
			setIsUpdating(true);
			await onUpdate(item.id, payload, item.type);
		} catch (error) {
			console.log(error);
		} finally {
			setIsUpdating(false);
		}
	};

	return (
		<SidebarGroup className="list-container" ref={sidebarRef}>
			<SidebarGroupLabel className="text-sm" asChild>
				<DraggingContainer
					onDrop={handleDropItem}
					data={newData}
					item={rootFolder}
				>
					Main
				</DraggingContainer>
			</SidebarGroupLabel>
			<NavListContainer />
		</SidebarGroup>
	);
};

export default SidebarNavMain;
