/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, {
	Dispatch,
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
	List,
	Plus,
	Trash2,
} from "lucide-react";
import { del, get, patch, post } from "@/utils/request";
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
import { Input } from "./ui/input";
import AlertDialogConfirm from "./alert-dialog-confirm";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

const getTitle = (title: string, type: TFolder["type"]) => {
	if (!title) {
		if (type === "folder") {
			return "New Folder";
		}
		return "New File";
	}
	return title;
};

const BtnAddNew = ({
	item,
	onAddNew,
}: {
	item: TFolder | TNote;
	onAddNew: (val: TFolder | TNote) => void | Promise<void>;
}) => {
	const [isCreating, setIsCreating] = useState(false);

	const handleAddNew = async (type: "folder" | "note") => {
		setIsCreating(true);
		if (type === "folder") {
			const folder = item as TFolder;
			try {
				const payload = {
					count_child: 0,
					count_child_note: 0,
					parent_id: folder.id,
					user_id: folder.user_id,
					title: "New Folder",
				};
				const res = await post("/folders/create", { ...payload });
				onAddNew({
					...payload,
					...res,
					type: "folder",
				});
			} catch (error) {
				console.log(error);
			} finally {
				setIsCreating(false);
			}
		} else if (type === "note") {
			const note = item as TNote;
		}
	};

	return (
		<DropdownMenu>
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
						{getTitle(item.title, item.type)}
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

const DropdownFolderAction = ({
	item,
	setIsEditable,
	onDelete,
}: {
	item: TFolder | TNote;
	setIsEditable: Dispatch<boolean>;
	onDelete?: (id: number, type: TFolder["type"]) => void | Promise<void>;
}) => {
	const [openDialogDelete, setOpenDialogDelete] = useState(false);

	const hanldeDelete = async () => {
		try {
			const res = await del(`/folders/delete/${item.id}`);
			console.log(res);
			onDelete?.(item.id, item.type);
			setOpenDialogDelete(false);
		} catch (error) {
			console.log(error);
		}
	};

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<div className="relative">
						<Ellipsis
							size={20}
							className="hover:bg-gray-200 rounded-sm px-0.5"
						/>
					</div>
				</DropdownMenuTrigger>
				<DropdownMenuContent className="min-w-46">
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
				onOk={hanldeDelete}
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

const NavItem = ({
	item,
	onUpdate,
	onDelete,
}: {
	item: TFolder | TNote;
	onUpdate: (
		id: number,
		val: Partial<TFolder | TNote>,
		type: TFolder["type"]
	) => void | Promise<void>;
	onDelete?: (id: number, type: TFolder["type"]) => void | Promise<void>;
}) => {
	const [openCollapsibleFolder, setOpenCollapsibleFolder] = useState(false);
	const [folderAdded, setFolderAdded] = useState<TFolder | undefined | null>();
	const [noteAdded, setNoteAdded] = useState<TNote | undefined | null>();
	const [isEditable, setIsEditable] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);
	const [needUpdate, setNeedUpdate] = useState(false);
	const [folderTitle, setFolderTitle] = useState<TFolder["title"]>(
		item.type === "folder" ? item.title : ""
	);

	const [{ isDragging }, drag] = useDrag(() => ({
		type: "folder",
		item: item,
		collect(monitor) {
			return { isDragging: !!monitor.isDragging() };
		},
	}));

	const handleUpdate = async (
		id: number,
		payload: Partial<TFolder | TNote>,
		type: TFolder["type"]
	) => {
		try {
			setIsUpdating(true);
			if (type === "folder") {
				const newPayload = {
					...payload,
				} as Partial<TFolder>;

				delete newPayload.createdAt;
				delete newPayload.updatedAt;
				delete newPayload.id;

				await patch(`/folders/update/${id}`, newPayload);
				onUpdate(id, newPayload, "folder");
			} else if (type === "note") {
				const newPayload = { ...payload } as Partial<TNote>;
				delete newPayload.createdAt;
				delete newPayload.updatedAt;
				delete newPayload.id;

				onUpdate(id, newPayload, "note");
				console.log(newPayload);
			}
			setIsEditable(false);
		} catch (error) {
			console.log(error);
		} finally {
			setIsUpdating(false);
		}
	};

	const handleAddNew = useCallback(
		(val: TFolder | TNote) => {
			if (val.type === "folder") {
				if (!openCollapsibleFolder) {
					setNeedUpdate(false);
				} else {
					setNeedUpdate(true);
				}
				setOpenCollapsibleFolder(true);
				setFolderAdded(val as TFolder);
			} else if (val.type === "note") {
				setNoteAdded(val as TNote);
				setNeedUpdate(true);
			}
		},
		[openCollapsibleFolder]
	);

	if (item.type === "note") {
		const note = item as TNote;
		return (
			<SidebarMenuItem className="group/item">
				{!isEditable ? (
					<SidebarMenuButton className="cursor-pointer relative">
						<Link
							href={note.slug}
							className="flex gap-2 relative z-0 flex-1 text-sm text-neutral-500 font-medium"
						>
							<FileText size={20} className="" />
							<span className="max-w-full text-ellipsis line-clamp-1">
								{getTitle(item.title, item.type)}
							</span>
						</Link>
						<div className="group-hover/item:opacity-100 hover:bg-gray-200 text-neutral-500 rounded-sm opacity-0 transition-opacity absolute right-2 top-1/2 transform -translate-y-1/2">
							<Ellipsis size={18} className="" />
						</div>
					</SidebarMenuButton>
				) : (
					<Input />
				)}
			</SidebarMenuItem>
		);
	}

	if (item.type === "folder") {
		const folder = item as TFolder;
		return isEditable ? (
			<SidebarMenuItem className="group/item text-neutral-500 relative">
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
			</SidebarMenuItem>
		) : (
			<Collapsible
				open={openCollapsibleFolder}
				onOpenChange={setOpenCollapsibleFolder}
				draggable={true}
				data-type={folder.type}
				data-id={folder.id}
				ref={drag as any}
			>
				<DraggingContainer
					item={folder}
					onDrop={(current_item, next_item) => {
						console.log(current_item);
						console.log(next_item);
						onDelete?.(current_item.id, "folder");
					}}
				>
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
							<DropdownFolderAction
								item={item}
								setIsEditable={setIsEditable}
								onDelete={onDelete}
							/>
							<BtnAddNew item={folder} onAddNew={handleAddNew} />
						</div>
					</SidebarMenuItem>
				</DraggingContainer>

				<CollapsibleContent>
					<div className="px-2 py-1 text-sm text-neutral-500">
						<NavListContainer
							folder_id={folder.id}
							setFolderAdded={setFolderAdded}
							folderAdded={folderAdded}
							noteAdded={noteAdded}
							setNoteAdded={setNoteAdded}
							needUpdate={needUpdate}
						/>
					</div>
				</CollapsibleContent>
			</Collapsible>
		);
	}
};

const DraggingContainer = ({
	children,
	item,
	className,
	onDrop,
}: {
	children: React.ReactNode;
	item: TFolder;
	className?: string;
	onDrop?: (item: TFolder, next_item: TFolder) => void;
}) => {
	const [{ isOver, canDrop }, drop] = useDrop(
		() => ({
			accept: "folder",
			drop(itemDragging) {
				onDrop?.(itemDragging as TFolder, item);
			},
			collect(monitor) {
				return { isOver: !!monitor.isOver(), canDrop: !!monitor.canDrop() };
			},
		}),
		[item]
	);

	return (
		<div
			className={`block ${isOver ? "bg-blue-100/30" : ""} ${className}`}
			ref={drop as any}
		>
			{children}
		</div>
	);
};

const NavList = ({
	folders,
	notes,
	listRef,
	onUpdate,
	onDelete,
}: {
	folders: TFolder[];
	notes: TNote[];
	onUpdate: (
		id: number,
		val: Partial<TFolder | TNote>,
		type: TFolder["type"]
	) => void | Promise<void>;
	listRef: { current: HTMLUListElement | null };
	onDelete?: (id: number, type: TFolder["type"]) => void | Promise<void>;
}) => {
	return (
		<SidebarMenu className="" ref={listRef}>
			{folders.map((item, index) => {
				return (
					<NavItem
						item={item}
						key={index}
						onUpdate={onUpdate}
						onDelete={onDelete}
					/>
				);
			})}
			{notes.map((item, index) => {
				return (
					<NavItem
						item={item}
						key={index}
						onUpdate={onUpdate}
						onDelete={onDelete}
					/>
				);
			})}
		</SidebarMenu>
	);
};

const NavListContainer = ({
	folder_id,
	folderAdded,
	noteAdded,
	needUpdate,
	setFolderAdded,
	setNoteAdded,
}: {
	folder_id?: number | null;
	folderAdded?: TFolder | null;
	noteAdded?: TNote | null;
	needUpdate?: boolean;
	setFolderAdded?: Dispatch<TFolder | undefined | null>;
	setNoteAdded?: Dispatch<TNote | undefined | null>;
}) => {
	const [folders, setFolders] = useState<TFolder[]>([]);
	const [notes, setNotes] = useState<TNote[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [lastFolderAdded, setLastFolderAdded] = useState<
		TFolder | null | undefined
	>();
	const listRef = useRef<HTMLUListElement | null>(null);

	const getFolders = useCallback(async () => {
		const res = await get(`/folders${folder_id ? "/detail/" + folder_id : ""}`);
		const datas = res.folders.map((fo: TFolder) => ({
			...fo,
			type: "folder",
		}));
		setFolders(datas);
	}, [folder_id]);

	const getNotes = useCallback(async () => {
		const res = await get(
			`/notes${folder_id ? "?folder_id=" + folder_id : ""}`
		);
		const datas = res.notes.map((no: TNote) => ({ ...no, type: "note" }));
		setNotes(datas);
	}, [folder_id]);

	useEffect(() => {
		const fetchData = async () => {
			try {
				setIsLoading(true);
				await Promise.all([getFolders(), getNotes()]);
			} catch (error) {
				console.log(error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchData();
	}, [getFolders, getNotes]);

	const updateListStateTree = useCallback(() => {
		if (folderAdded && !isLoading) {
			if (needUpdate) {
				setFolders([folderAdded, ...folders]);
				setLastFolderAdded(folderAdded);
			}
			updateListRef(folderAdded.id);
			setFolderAdded?.(null);
		}

		if (lastFolderAdded) {
			updateListRef(lastFolderAdded.id);
			setLastFolderAdded(null);
		}

		if (noteAdded && !isLoading) {
			setNotes([noteAdded, ...notes]);
			setNoteAdded?.(null);
		}
	}, [
		folders,
		isLoading,
		notes,
		lastFolderAdded,
		folderAdded,
		noteAdded,
		needUpdate,
		setFolderAdded,
		setNoteAdded,
	]);

	useEffect(() => {
		updateListStateTree();
	}, [updateListStateTree]);

	const updateListRef = (id: number) => {
		const list = listRef.current;
		if (!list) {
			return;
		}
		list.childNodes.forEach((el) => {
			if (el instanceof HTMLElement) {
				const dataId = el.getAttribute("data-id");
				if (Number(dataId) === id) {
					const className = "nav-sidebar-focused";
					el.classList.add(className);
					setTimeout(() => {
						el.classList.remove(className);
					}, 5000);
				}
			}
		});
	};

	const handleUpdate = (
		id: number,
		val: Partial<TFolder | TNote>,
		type: TFolder["type"]
	) => {
		console.log(id, folders);
		if (type === "folder") {
			const folder = val as TFolder;
			const copy = [...folders];
			const idx = copy.findIndex((fo) => fo.id === id);
			if (idx !== -1) {
				copy[idx] = { ...copy[idx], ...folder };
				setFolders(copy);
			}
		}
		if (type === "note") {
			//do some thing here
		}
	};

	const handleDelete = (id: number, type: TFolder["type"]) => {
		console.log(id, folders);
		if (type === "folder") {
			const copy = [...folders];
			setFolders(copy.filter((f) => f.id !== id));
		} else if (type === "note") {
			setNotes((prev) => prev.filter((n) => n.id !== id));
		}
	};

	return folders.length || notes.length ? (
		<NavList
			folders={folders}
			notes={notes}
			onUpdate={handleUpdate}
			listRef={listRef}
			onDelete={handleDelete}
		/>
	) : (
		<div className="text-center">Empty folder</div>
	);
};

const SidebarNavMain = () => {
	const [rootFolder, setRootFolder] = useState<TFolder>();

	useEffect(() => {
		const getData = async () => {
			try {
				const res = await get("/folders/root");
				setRootFolder(res);
			} catch (error) {
				console.log(error);
			}
		};
		getData();
	}, []);

	return (
		<DndProvider backend={HTML5Backend}>
			<SidebarGroup>
				<SidebarGroupLabel className="text-sm" asChild>
					{rootFolder && (
						<DraggingContainer className="" item={rootFolder}>
							Main
						</DraggingContainer>
					)}
				</SidebarGroupLabel>
				<NavListContainer folder_id={rootFolder?.id} />
			</SidebarGroup>
		</DndProvider>
	);
};

export default SidebarNavMain;
