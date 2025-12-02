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
	SidebarGroup,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "./ui/sidebar";
import {
	Check,
	ChevronDown,
	CornerUpLeft,
	FileIcon,
	FolderIcon,
	ListFilter,
	Settings,
	Trash,
	Trash2,
	X,
} from "lucide-react";
import DialogSetting from "./settings/dialog-setting";
import { MyInput } from "./ui/input";
import { useWorkspace } from "@/contexts/workspace-context";
import { get, patch } from "@/utils/request";
import { logAction, sleep } from "@/lib/utils";
import { TNote } from "@/types/note.type";
import { Button } from "./ui/button";
import { useParams, useRouter } from "next/navigation";
import { TFolder } from "@/types/folder.type";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useFolderState } from "@/contexts/folder-context";
import lodash from "lodash";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import AlertDialogConfirm from "./alert-dialog-confirm";
import { useNote } from "@/contexts/note-context";
import { Spinner } from "./ui/spinner";

const NoteTrashItem = ({
	note,
	setOpen,
	selected,
	onDelete,
	onRestore,
}: {
	note: TNote;
	setOpen: React.Dispatch<React.SetStateAction<boolean>>;
	selected?: boolean;
	onRestore: (id: number, type: TFolder["type"]) => void | Promise<void>;
	onDelete: (id: number, type: TFolder["type"]) => void | Promise<void>;
}) => {
	const [openDialogConfirm, setOpenDialogConfirm] = useState(false);

	const btnRestoreRef = React.useRef<HTMLButtonElement>(null);
	const btnDeleteRef = React.useRef<HTMLButtonElement>(null);

	const router = useRouter();

	const onClickToNote = useCallback(
		(e: React.MouseEvent) => {
			if (
				btnRestoreRef.current?.contains(e.target as Node) ||
				btnDeleteRef.current?.contains(e.target as Node)
			) {
				e.preventDefault();
				return;
			}

			router.push(`/${note.slug}`);
			setOpen(false);
		},
		[note, router, setOpen]
	);

	return (
		<>
			<div
				onClick={onClickToNote}
				className={`hover:bg-accent hover:text-accent-foreground flex items-center justify-between px-2 py-1 rounded-sm cursor-pointer ${
					selected ? "bg-accent" : ""
				}`}
			>
				<div className="flex items-center flex-1 gap-2">
					<FileIcon size={18} className="text-neutral-500" />
					<p className="text-sm">{note.title || "Untitled Note"}</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant={"ghost"}
						className="size-5 rounded-xs text-neutral-400 hover:bg-neutral-200"
						ref={btnRestoreRef}
						onClick={() => onRestore(note.id, note.type)}
					>
						<CornerUpLeft />
					</Button>
					<Button
						variant={"ghost"}
						className="size-5 rounded-xs text-neutral-400 hover:bg-neutral-200"
						ref={btnDeleteRef}
						onClick={() => setOpenDialogConfirm(true)}
					>
						<Trash />
					</Button>
				</div>
			</div>
			<AlertDialogConfirm
				open={openDialogConfirm}
				setOpen={setOpenDialogConfirm}
				dialogType="column"
				icon={Trash}
				description="Are you sure you want to delete this note? This action will remove data from our server."
				title="Are you sure?"
				okButton={
					<Button
						variant={"destructive"}
						className="opacity-80"
						onClick={() => onDelete(note.id, note.type)}
					>
						Continue
					</Button>
				}
			/>
		</>
	);
};

const FolderTrashItem = ({
	folder,
	selected,
	onRestore,
	onDelete,
}: {
	folder: TFolder;
	setOpen: React.Dispatch<React.SetStateAction<boolean>>;
	selected?: boolean;
	onRestore: (id: number, type: TFolder["type"]) => void | Promise<void>;
	onDelete: (id: number, type: TFolder["type"]) => void | Promise<void>;
}) => {
	const [openDialogConfirm, setOpenDialogConfirm] = useState(false);

	const btnRestoreRef = React.useRef<HTMLButtonElement>(null);
	const btnDeleteRef = React.useRef<HTMLButtonElement>(null);

	return (
		<>
			<div
				onClick={(e) => e.preventDefault()}
				className={`hover:bg-accent hover:text-accent-foreground flex items-center justify-between px-2 py-1 rounded-sm cursor-pointer ${
					selected ? "bg-accent" : ""
				}`}
			>
				<div className="flex items-center flex-1 gap-2">
					<FolderIcon size={18} className="text-neutral-500" />
					<p className="text-sm">{folder.title || "Untitled Folder"}</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant={"ghost"}
						className="size-5 rounded-xs text-neutral-400 hover:bg-neutral-200"
						ref={btnRestoreRef}
						onClick={() => onRestore(folder.id, folder.type)}
					>
						<CornerUpLeft />
					</Button>
					<Button
						variant={"ghost"}
						className="size-5 rounded-xs text-neutral-400 hover:bg-neutral-200"
						ref={btnDeleteRef}
						onClick={() => setOpenDialogConfirm(true)}
					>
						<Trash />
					</Button>
				</div>
			</div>
			<AlertDialogConfirm
				open={openDialogConfirm}
				setOpen={setOpenDialogConfirm}
				dialogType="column"
				icon={Trash}
				description="Are you sure you want to delete this folder? This action will remove data from our server."
				title="Are you sure?"
				okButton={
					<Button
						variant={"destructive"}
						className="opacity-80"
						onClick={() => onDelete(folder.id, folder.type)}
					>
						Continue
					</Button>
				}
			/>
		</>
	);
};

const DropdownFilterType = ({
	ref,
	filterTypes,
	setFilterTypes,
	open,
	setOpen,
}: {
	ref: React.RefObject<HTMLDivElement | null>;
	filterTypes: string[];
	setFilterTypes: Dispatch<SetStateAction<string[]>>;
	open: boolean;
	setOpen: Dispatch<boolean>;
}) => {
	const listTypeOptions = [
		{ label: "Folder", value: "folder", icon: <FolderIcon /> },
		{ label: "Note", value: "note", icon: <FileIcon /> },
	];

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild>
				<Button
					variant={"ghost"}
					className="items-center h-5 font-normal text-[13px] gap-1.5 p-0 rounded-sm"
				>
					<ListFilter className="size-3.5 text-neutral-500/80" />
					<p>Type</p>
					<ChevronDown className="text-neutral-500/80" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="start"
				side="bottom"
				className="min-w-48"
				ref={ref}
			>
				<div className="bg-neutral-50 min-h-8 flex justify-between px-2 py-1 mt-1 mb-3 border rounded-sm">
					<div className="flex flex-row flex-wrap gap-1">
						{filterTypes.length ? (
							filterTypes.map((type, key) => (
								<div
									key={key}
									className="bg-neutral-200 h-fit inline-flex items-center gap-1 px-1 text-sm capitalize border rounded-sm"
								>
									{type}
									<button
										className="hover:bg-neutral-300 cursor-pointer"
										onClick={() => {
											setFilterTypes((prev) => {
												return prev.filter((tp) => tp !== type);
											});
										}}
									>
										<X size={14} className="text-neutral-500" />
									</button>
								</div>
							))
						) : (
							<div className="flex items-center justify-center w-full h-full">
								<p className="text-neutral-500 text-xs">No type selected</p>
							</div>
						)}
					</div>
					{filterTypes.length ? (
						<div className="flex items-center justify-center">
							<button
								className="h-fit p-0.5 cursor-pointer rounded-xs text-neutral-500"
								onClick={() => setFilterTypes([])}
							>
								<X size={14} />
							</button>
						</div>
					) : null}
				</div>

				<DropdownMenuGroup>
					{listTypeOptions.map((opt, key) => {
						const active = filterTypes.includes(opt.value);

						return (
							<DropdownMenuItem
								key={key}
								className={`p-0 px-2 py-0.5 justify-between cursor-pointer ${
									active ? "bg-accent text-accent-foreground" : ""
								}`}
								onClick={(e) => {
									e.preventDefault();
									if (active) {
										setFilterTypes((prev) => {
											return prev.filter((tp) => tp !== opt.value);
										});
									} else {
										setFilterTypes((prev) => [...prev, opt.value]);
									}
								}}
							>
								<div className="flex items-center gap-2">
									{opt.icon}
									{opt.label}
								</div>
								{active ? <Check /> : null}
							</DropdownMenuItem>
						);
					})}
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

const DropdownFilterFolderPrivate = ({
	selectedFolderIds,
	setSelectedFolderIds,
	open,
	setOpen,
}: {
	selectedFolderIds: number[];
	setSelectedFolderIds: Dispatch<SetStateAction<number[]>>;
	open: boolean;
	setOpen: Dispatch<boolean>;
}) => {
	const { data } = useFolderState();
	const [folders, setFolders] = useState<TFolder[]>([]);

	useEffect(() => {
		const folderList = data.filter(
			(item) => item.type === "folder"
		) as TFolder[];
		setFolders(folderList);
	}, [data]);

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild>
				<Button
					variant={"ghost"}
					className="items-center h-5 font-normal text-[13px] gap-1.5 p-0 rounded-sm"
				>
					<FolderIcon className="size-3.5 text-neutral-500/80" />
					<p>In Folder</p>
					<ChevronDown className="text-neutral-500/80" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" side="bottom" className="w-64">
				<div className="bg-neutral-50 min-h-8 flex justify-between px-2 py-1 mt-1 mb-3 border rounded-sm">
					<div className="flex flex-row flex-wrap gap-1">
						{selectedFolderIds.length ? (
							selectedFolderIds.map((id, key) => (
								<div
									key={key}
									className="bg-neutral-200 h-fit inline-flex items-center gap-1 px-1 text-sm capitalize border rounded-sm"
								>
									{folders.find((folder) => folder.id === id)?.title ||
										"Untitled Folder"}
									<button
										className="hover:bg-neutral-300 cursor-pointer"
										onClick={() => {
											setSelectedFolderIds((prev) => {
												return prev.filter((tp) => tp !== id);
											});
										}}
									>
										<X size={14} className="text-neutral-500" />
									</button>
								</div>
							))
						) : (
							<div className="flex items-center justify-center w-full h-full">
								<p className="text-neutral-500 text-xs">No folders selected</p>
							</div>
						)}
					</div>

					{selectedFolderIds.length ? (
						<div className="flex items-center justify-center">
							<button
								className="h-fit p-0.5 cursor-pointer rounded-xs text-neutral-500"
								onClick={() => {
									setSelectedFolderIds([]);
								}}
							>
								<X size={14} />
							</button>
						</div>
					) : null}
				</div>

				<DropdownMenuGroup className="flex flex-col gap-0.5">
					{folders.map((folder) => {
						const active = selectedFolderIds.includes(folder.id);

						return (
							<DropdownMenuItem
								key={folder.id}
								className={`p-0 px-2 py-0.5 justify-between cursor-pointer ${
									active ? "bg-accent text-accent-foreground" : ""
								}`}
								onClick={(e) => {
									e.preventDefault();
									if (active) {
										setSelectedFolderIds((prev) => {
											return prev.filter((id) => id !== folder.id);
										});
									} else {
										setSelectedFolderIds((prev) => [...prev, folder.id]);
									}
								}}
							>
								<div className="flex items-center gap-2">
									<FolderIcon />
									{folder.title}
								</div>
								{active ? <Check /> : null}
							</DropdownMenuItem>
						);
					})}
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

const TrashFilterAction = ({
	dropdownFilterTypeRef,
	filterTypes,
	setFilterTypes,
	selectedFolderIds,
	setSelectedFolderIds,
	openFilterType,
	setOpenFilterType,
	openFilterFolder,
	setOpenFilterFolder,
}: {
	dropdownFilterTypeRef: React.RefObject<HTMLDivElement | null>;
	filterTypes: string[];
	setFilterTypes: React.Dispatch<React.SetStateAction<string[]>>;
	selectedFolderIds: number[];
	setSelectedFolderIds: Dispatch<SetStateAction<number[]>>;
	openFilterType: boolean;
	setOpenFilterType: Dispatch<boolean>;
	openFilterFolder: boolean;
	setOpenFilterFolder: Dispatch<boolean>;
}) => {
	return (
		<div
			className="flex items-center gap-2 my-3 text-sm"
			ref={dropdownFilterTypeRef}
		>
			<DropdownFilterType
				ref={dropdownFilterTypeRef}
				filterTypes={filterTypes}
				setFilterTypes={setFilterTypes}
				open={openFilterType}
				setOpen={setOpenFilterType}
			/>
			<DropdownFilterFolderPrivate
				selectedFolderIds={selectedFolderIds}
				setSelectedFolderIds={setSelectedFolderIds}
				open={openFilterFolder}
				setOpen={setOpenFilterFolder}
			/>
		</div>
	);
};

const PopoverTrash = ({
	open,
	setOpen,
}: {
	open: boolean;
	setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
	const { currentWorkspace } = useWorkspace();
	const { setData, data } = useFolderState();
	const { currentNote, setCurrentNote } = useNote();

	const [trashData, setTrashData] = useState<(TNote | TFolder)[]>([]);
	const [filterTypes, setFilterTypes] = useState<string[]>(["folder", "note"]);
	const [selectedFolderIds, setSelectedFolderIds] = useState<number[]>([]);
	const [openFilterType, setOpenFilterType] = useState(false);
	const [openFilterFolder, setOpenFilterFolder] = useState(false);
	const [loading, setLoading] = useState(false);
	const [searchValue, setSearchValue] = useState("");
	const [selectedIndex, setSelectedIndex] = useState(-1);

	const listTrashElementRef = React.useRef<HTMLDivElement | null>(null);
	const dropdownFilterTypeRef = React.useRef<HTMLDivElement | null>(null);
	const queryNoteRef = useRef(new URLSearchParams());
	const queryFolderRef = useRef(new URLSearchParams());
	const openFilterTypeRef = useRef(false);
	const openFilterFolderRef = useRef(false);
	const searchValueRef = useRef("");

	const router = useRouter();
	const params = useParams();
	const slug = params.slug as string | undefined;

	const debounceFetchDataTrash = React.useRef(
		lodash.debounce(
			(
				workspace_id: number,
				query_note?: Record<string, string>,
				query_folder?: Record<string, string>
			) => fetchDataTrash(workspace_id, query_note, query_folder),
			700
		)
	).current;

	const getNotes = useCallback(
		async (workspace_id: number, query?: Record<string, string>) => {
			try {
				const newQuery = new URLSearchParams(query || {}).toString();

				const api = `/trash/notes/${workspace_id}?${newQuery}`;

				const res = (await get(api)) as {
					notes: TNote[];
				};
				return res.notes;
			} catch (error) {
				logAction("Error fetching trash notes:", error);
				return null;
			}
		},
		[]
	);

	const getFolders = useCallback(
		async (workspace_id: number, query?: Record<string, string>) => {
			try {
				const newQuery = new URLSearchParams(query || {}).toString();

				const api = `/trash/folders/${workspace_id}?${newQuery}`;
				const res = (await get(api)) as {
					folders: TFolder[];
				};
				return res.folders;
			} catch (error) {
				logAction("Error fetching trash folders:", error);
				return null;
			}
		},
		[]
	);

	const fetchDataTrash = useCallback(
		async (
			workspace_id: number,
			query_note?: Record<string, string>,
			query_folder?: Record<string, string>
		) => {
			if (!workspace_id) {
				return;
			}

			try {
				setLoading(true);

				let data = [] as (TNote | TFolder)[];

				await sleep(500);

				if (filterTypes.includes("note") && filterTypes.includes("folder")) {
					const [notes, folders] = await Promise.all([
						getNotes(workspace_id, query_note),
						getFolders(workspace_id, query_folder),
					]);
					if (notes && folders) {
						data = [...notes, ...folders];
					}
				} else if (filterTypes.includes("note")) {
					const notes = await getNotes(workspace_id, query_note);
					if (notes) {
						data = notes;
					}
				} else if (filterTypes.includes("folder")) {
					const folders = await getFolders(workspace_id, query_folder);
					if (folders) {
						data = folders;
					}
				}
				data = data.sort((a, b) => {
					const dateA = new Date(a.updatedAt).getTime();
					const dateB = new Date(b.updatedAt).getTime();
					return dateB - dateA;
				});
				setTrashData(data);
			} catch (error) {
				logAction("Error fetching trash data:", error);
			} finally {
				setLoading(false);
			}
		},
		[getNotes, getFolders, filterTypes]
	);

	useEffect(() => {
		if (!currentWorkspace || !open) return;
		const current_query_note = queryNoteRef.current;
		const current_query_folder = queryFolderRef.current;

		const folder_ids_query = selectedFolderIds.join(",");
		current_query_note.set("folder_ids", folder_ids_query);
		current_query_folder.set("parent_ids", folder_ids_query);

		const object_query_note = Object.fromEntries(current_query_note);
		const object_query_folder = Object.fromEntries(current_query_folder);

		fetchDataTrash(currentWorkspace.id, object_query_note, object_query_folder);
	}, [currentWorkspace, open, fetchDataTrash, selectedFolderIds]);

	useEffect(() => {
		if (!currentWorkspace) return;

		const current_query_note = queryNoteRef.current;
		const current_query_folder = queryFolderRef.current;

		current_query_note.set("search", searchValue.trim());
		current_query_folder.set("search", searchValue.trim());

		const object_query_note = Object.fromEntries(current_query_note);
		const object_query_folder = Object.fromEntries(current_query_folder);

		if (searchValue.trim()) {
			searchValueRef.current = searchValue.trim();

			debounceFetchDataTrash(
				currentWorkspace.id,
				object_query_note,
				object_query_folder
			);
		} else {
			if (searchValueRef.current) {
				debounceFetchDataTrash(
					currentWorkspace.id,
					object_query_note,
					object_query_folder
				);
				searchValueRef.current = "";
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchValue, currentWorkspace]);

	const onMouseMove = (e: MouseEvent) => {
		const listElement = listTrashElementRef.current;

		if (!listElement) return;
		if (!listElement.contains(e.target as Node)) {
			return;
		}

		const target = e.target;

		const childs = listElement.childNodes;

		childs.forEach((child, index) => {
			if (child === target || child.contains(target as Node)) {
				setSelectedIndex(index);
			}
		});
	};

	useEffect(() => {
		const listElement = listTrashElementRef.current;

		if (!listElement) return;

		let current_index = 0;

		const onKeyDown = (e: KeyboardEvent) => {
			if (openFilterFolderRef.current || openFilterTypeRef.current) {
				return;
			}

			if (e.key === "ArrowDown") {
				e.preventDefault();
				setSelectedIndex((prev) => {
					current_index = (prev + 1) % trashData.length;
					return current_index;
				});
			}
			if (e.key === "ArrowUp") {
				e.preventDefault();
				setSelectedIndex((prev) => {
					current_index = (prev - 1 + trashData.length) % trashData.length;
					return current_index;
				});
			}
			if (e.key === "Enter") {
				e.preventDefault();
				const selectedItem = trashData[current_index];
				if (selectedItem) {
					if (selectedItem.type === "note") {
						const note = selectedItem as TNote;
						router.push(`/${note.slug}`);
						setOpen(false);
					}
				}
			}
		};

		document.addEventListener("keydown", onKeyDown);
		document.addEventListener("mousemove", onMouseMove);

		if (!open) {
			setSelectedIndex(-1);
			document.removeEventListener("keydown", onKeyDown);
			document.removeEventListener("mousemove", onMouseMove);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, trashData]);

	const handleRestore = useCallback(
		async (id: number, type: TFolder["type"]) => {
			if (!currentWorkspace) {
				return;
			}
			try {
				const res = (await patch(
					`/trash/${type}/restore/${id}?workspace_id=${currentWorkspace.id}`
				)) as TFolder | TNote;
				setTrashData((prev) => {
					const newData = prev.filter((it) => {
						if (it.id === id && it.type === type) {
							return false;
						}
						return true;
					});
					return newData;
				});

				setData([...data, res]);
				if (!currentNote) {
					return;
				}

				const clean_slug = slug ? slug.toLowerCase() : "";
				const clean_note_slug = currentNote.slug
					? currentNote.slug.toLowerCase()
					: "";

				if (clean_note_slug === clean_slug) {
					setCurrentNote({
						...currentNote,
						deleted: 0,
					});
				}
			} catch (error) {
				logAction(error);
			}
		},
		[currentWorkspace, setData, data, currentNote, slug, setCurrentNote]
	);

	const handleDelete = useCallback(
		async (id: number, type: TFolder["type"]) => {
			if (!currentWorkspace) {
				return;
			}
			try {
				await patch(
					`/trash/${type}/delete/${id}?workspace_id=${currentWorkspace.id}`
				);
				setTrashData((prev) => {
					const newData = prev.filter((it) => {
						if (it.id === id && it.type === type) {
							return false;
						}
						return true;
					});
					return newData;
				});
			} catch (error) {
				logAction(error);
			}
		},
		[currentWorkspace]
	);

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
					className="h-56 w-sm px-2 py-3"
				>
					<div className="flex flex-col h-full">
						<MyInput
							placeholder="Search page..."
							autoFocus
							value={searchValue}
							onChange={(e) => setSearchValue(e.target.value)}
						/>
						<TrashFilterAction
							dropdownFilterTypeRef={dropdownFilterTypeRef}
							filterTypes={filterTypes}
							setFilterTypes={setFilterTypes}
							selectedFolderIds={selectedFolderIds}
							setSelectedFolderIds={setSelectedFolderIds}
							openFilterType={openFilterType}
							openFilterFolder={openFilterFolder}
							setOpenFilterType={(val) => {
								openFilterTypeRef.current = val;
								setOpenFilterType(val);
							}}
							setOpenFilterFolder={(val) => {
								openFilterFolderRef.current = val;
								setOpenFilterFolder(val);
							}}
						/>
						{loading ? (
							<div className="flex-1 flex items-center justify-center">
								<Spinner className="text-neutral-500 dark:text-neutral-400" />
							</div>
						) : trashData.length ? (
							<div className="flex flex-col gap-1" ref={listTrashElementRef}>
								{trashData.map((item, index) => {
									const key = `trash-item-${item.type}-${item.id}`;
									if (item.type === "note") {
										const note = item as TNote;
										return (
											<NoteTrashItem
												key={key}
												note={note}
												setOpen={setOpen}
												selected={selectedIndex === index}
												onRestore={handleRestore}
												onDelete={handleDelete}
											/>
										);
									}
									const folder = item as TFolder;

									return (
										<FolderTrashItem
											key={key}
											folder={folder}
											setOpen={setOpen}
											selected={selectedIndex === index}
											onDelete={handleDelete}
											onRestore={handleRestore}
										/>
									);
								})}
							</div>
						) : (
							<div className="text-neutral-500 dark:text-neutral-400 flex flex-col items-center justify-center flex-1 gap-2 py-8">
								<Trash size={20} />
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
