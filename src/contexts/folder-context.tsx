import { TFolder } from "@/types/folder.type";
import { TNote } from "@/types/note.type";
import { del, get, patch, post } from "@/utils/request";
import { useParams, useRouter } from "next/navigation";
import {
	createContext,
	Dispatch,
	SetStateAction,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";

function createTreeData(data: (TFolder | TNote)[], parent_id?: number) {
	const childs: (TFolder | TNote)[] = [];

	for (const item of data) {
		if (item.type === "folder") {
			const folder = item as TFolder;
			if (folder.parent_id === parent_id) {
				childs.push(folder);
				const dataChildren = createTreeData(data, folder.id);
				folder.children = [...dataChildren] as TFolder[];
			}
		}
	}

	for (const child of childs) {
		const folder = child as TFolder;
		folder.children = [
			...folder.children,
			...data.filter((it) => {
				if (it.type === "note") {
					const note = it as TNote;
					return note.folder_id === folder.id;
				}
				return false;
			}),
		];
	}

	return childs;
}

const Context = createContext<FolderContextType | null>(null);

const useFolderState = () => {
	const context = useContext(Context);

	if (!context) {
		throw new Error("useFolderState must be used within a FolderProvider");
	}

	return context;
};

type FolderContextType = {
	data: (TFolder | TNote)[];
	newData: (TFolder | TNote)[];
	rootFolder: TFolder;
	fetchDataTree: (id: number) => Promise<void>;
	isLoading: boolean;
	onUpdate: (
		id: number,
		payload: Partial<TFolder | TNote>,
		type: TFolder["type"],
		isUpdateData?: boolean
	) => void | Promise<void>;
	onAddNew: (
		type: TFolder["type"],
		payload: Partial<TFolder | TNote>,
		updateData?: boolean
	) => void | Promise<void>;
	setData: Dispatch<SetStateAction<(TFolder | TNote)[]>>;
	onDelete: (
		id: number,
		type: TFolder["type"],
		updateData?: boolean
	) => void | Promise<void>;
	itemWorking: TFolder | TNote | null;
	setItemWorking: Dispatch<SetStateAction<TFolder | TNote | null>>;
	setFoldersDefaultOpen: Dispatch<SetStateAction<TFolder[] | null>>;
	foldersDefaultOpen: TFolder[] | null;
};

const FolderContext = ({
	children,
	rootFolder,
}: {
	children: React.ReactNode;
	rootFolder: TFolder;
}) => {
	const [data, setData] = useState<(TFolder | TNote)[]>([]);
	const [newData, setNewData] = useState<(TFolder | TNote)[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [itemWorking, setItemWorking] = useState<TFolder | TNote | null>(null);
	const [foldersDefaultOpen, setFoldersDefaultOpen] = useState<
		TFolder[] | null
	>(null);

	const router = useRouter();

	const existIdsRef = useRef(new Set<number>());
	const params = useParams();
	const slug = params.slug as string | undefined;

	const getFolders = async (folder_id?: number | null) => {
		const res = await get(`/folders${folder_id ? "/detail/" + folder_id : ""}`);

		const newData: TFolder[] = res.folders.map((f: TFolder) => {
			return {
				...f,
				type: "folder",
				children: [],
			};
		});

		return newData;
	};

	const getNotes = async (folder_id?: number | null) => {
		const res = await get(
			`/notes${folder_id ? "?folder_id=" + folder_id : ""}`
		);
		const newData = res.notes.map((no: TNote) => ({ ...no, type: "note" }));
		return newData;
	};

	const fetchData = useCallback(async () => {
		try {
			setIsLoading(true);
			const [folders, notes] = await Promise.all([getFolders(), getNotes()]);

			setData([...folders, ...notes]);
		} catch (error) {
			console.log(error);
		} finally {
			setIsLoading(false);
		}
	}, []);

	const fetchDataTree = useCallback(async (folder_id: number) => {
		const existIds = existIdsRef.current;

		if (existIds.has(folder_id)) {
			return;
		}

		existIds.add(folder_id);

		try {
			setIsLoading(true);
			const [folders, notes] = await Promise.all([
				getFolders(folder_id),
				getNotes(folder_id),
			]);

			setData((prev) => [...prev, ...folders, ...notes]);
		} catch (error) {
			console.log(error);
		} finally {
			setIsLoading(false);
		}
	}, []);

	const onUpdate = useCallback(
		async (
			id: number,
			payload: Partial<TFolder | TNote>,
			type: TFolder["type"],
			isUpdateData = true
		) => {
			try {
				if (type === "folder") {
					const newPayload = {
						...payload,
					} as Partial<TFolder>;

					delete newPayload.createdAt;
					delete newPayload.updatedAt;
					delete newPayload.id;

					await patch(`/folders/update/${id}`, newPayload);

					const folderUpdate = newPayload as TFolder;

					if (isUpdateData) {
						setData((prev) => {
							return prev.map((it) => {
								if (it.type === "folder" && it.id === id) {
									it = it as TFolder;
									if (folderUpdate.parent_id !== it.parent_id) {
										setItemWorking(it);
									}
									return { ...it, ...folderUpdate };
								}

								return it;
							});
						});
					}
				}

				if (type === "note") {
					const newPayload = { ...payload } as Partial<TNote>;
					delete newPayload.createdAt;
					delete newPayload.updatedAt;
					delete newPayload.id;

					const res = await patch(`/notes/update/${id}`, newPayload);

					let newSlug = "";

					if (isUpdateData) {
						setData((prev) => {
							return prev.map((it) => {
								if (it.type === "note" && it.id === id) {
									it = it as TNote;
									if (
										newPayload.folder_id &&
										newPayload.folder_id !== it.folder_id
									) {
										setItemWorking(it);
									} else if (
										newPayload.title &&
										newPayload.title !== it.title &&
										slug &&
										slug === it.slug
									) {
										newSlug = res.slug;
									}
									return { ...it, ...newPayload, ...res };
								}

								return it;
							});
						});
					}

					if (newSlug && newSlug !== slug) {
						router.replace(`/${newSlug}`);
					}
				}
			} catch (error) {
				throw error;
			}
		},
		[router, slug]
	);

	const onDelete = useCallback(
		async (id: number, type: TFolder["type"], updateData = true) => {
			try {
				if (type === "folder") {
					await del(`/folders/delete/${id}`);
				}
				if (type === "note") {
					await del(`/notes/delete/${id}`);
				}

				if (updateData) {
					const copy = [...data];
					const filter = copy.filter((it) => {
						if (it.type !== type) {
							return true;
						}
						return it.id !== id;
					});
					setData(filter);
				}
			} catch (error) {
				throw error;
			}
		},
		[data]
	);

	const onAddNew = useCallback(
		async (
			type: TFolder["type"],
			payload: Partial<TFolder | TNote>,
			updateData: boolean = true
		) => {
			try {
				if (type === "folder") {
					payload = payload as Partial<TFolder>;

					const res = await post("/folders/create", payload);

					const newPayload = {
						...payload,
						...res,
						count_child: 0,
						count_child_note: 0,
						children: [] as TFolder[],
						type,
					};

					setItemWorking(newPayload);

					if (updateData) {
						setData((prev) => [newPayload, ...prev]);
					}
				}
				if (type === "note") {
					payload = payload as Partial<TNote>;
					const res = await post("/notes/create", payload);

					const newPayload = {
						...payload,
						...res,
						type,
					};

					setItemWorking(newPayload);

					if (updateData) {
						setData((prev) => [newPayload, ...prev]);
					}
				}
			} catch (error) {
				throw error;
			}
		},
		[]
	);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	useEffect(() => {
		let folders = createTreeData(data, rootFolder.id);
		folders = [
			...folders,
			...data.filter((it) => {
				if (it.type === "note") {
					const note = it as TNote;
					return note.folder_id === rootFolder.id;
				}
				return false;
			}),
		];

		setNewData(folders);
	}, [data, rootFolder]);

	const value = {
		data,
		newData,
		fetchDataTree,
		isLoading,
		onUpdate,
		setData,
		onDelete,
		itemWorking,
		setItemWorking,
		onAddNew,
		rootFolder,
		setFoldersDefaultOpen,
		foldersDefaultOpen,
	};

	return <Context.Provider value={value}>{children}</Context.Provider>;
};

export { FolderContext, useFolderState };
