"use client";

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
import { useWorkspace } from "./workspace-context";
import { logAction } from "@/lib/utils";
import { useNote } from "./note-context";

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
  dataTree: (TFolder | TNote)[];
  dataInTeamspace: (TFolder | TNote)[];
  rootFolderInTeamspace: TFolder | null;
  dataTreeInTeamspace: (TFolder | TNote)[];
  rootFolder: TFolder | null;
  itemWorking: TFolder | TNote | null;
  foldersDefaultOpen: TFolder[] | null;
  isLoading: boolean;
  fetchDataTree: (id: number, is_in_teamspace?: boolean) => Promise<void>;
  onUpdate: ({
    id,
    payload,
    type,
    isUpdateData,
    is_in_teamspace,
  }: {
    id: number;
    payload: Partial<TFolder | TNote>;
    type: TFolder["type"];
    isUpdateData?: boolean;
    is_in_teamspace?: boolean;
  }) => void | Promise<void>;
  onAddNew: (
    type: TFolder["type"],
    payload: Partial<TFolder | TNote>,
    updateData?: boolean,
    is_in_teamspace?: boolean
  ) => void | Promise<void>;
  setData: Dispatch<SetStateAction<(TFolder | TNote)[]>>;
  onDelete: (
    id: number,
    type: TFolder["type"],
    updateData?: boolean,
    is_in_teamspace?: boolean
  ) => void | Promise<void>;
  setItemWorking: Dispatch<SetStateAction<TFolder | TNote | null>>;
  setFoldersDefaultOpen: Dispatch<SetStateAction<TFolder[] | null>>;
  setDataInTeamspace: Dispatch<SetStateAction<(TFolder | TNote)[]>>;
  setRootFolder: Dispatch<SetStateAction<TFolder | null>>;
  setRootFolderInTeamspace: Dispatch<SetStateAction<TFolder | null>>;
};

const FolderContext = ({
  children,
  rootFolder,
  rootFolderInTeamspace,
  setRootFolder,
  setRootFolderInTeamspace,
}: {
  children: React.ReactNode;
  rootFolder: TFolder | null;
  rootFolderInTeamspace: TFolder | null;
  setRootFolder: Dispatch<SetStateAction<TFolder | null>>;
  setRootFolderInTeamspace: Dispatch<SetStateAction<TFolder | null>>;
}) => {
  const [data, setData] = useState<(TFolder | TNote)[]>([]);
  const [dataTree, setDataTree] = useState<(TFolder | TNote)[]>([]);
  const [dataInTeamspace, setDataInTeamspace] = useState<(TFolder | TNote)[]>(
    []
  );
  const [dataTreeInTeamspace, setDataTreeInTeamspace] = useState<
    (TFolder | TNote)[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [itemWorking, setItemWorking] = useState<TFolder | TNote | null>(null);
  const [foldersDefaultOpen, setFoldersDefaultOpen] = useState<
    TFolder[] | null
  >(null);

  const { currentWorkspace } = useWorkspace();
  const { currentNote } = useNote();

  const router = useRouter();

  const existIdsRef = useRef(new Set<number>());
  const params = useParams();
  const slugRef = useRef(params.slug as string | undefined);

  useEffect(() => {
    if (rootFolder) {
      existIdsRef.current.add(rootFolder.id);
    }
    if (rootFolderInTeamspace) {
      existIdsRef.current.add(rootFolderInTeamspace.id);
    }
  }, [rootFolder, rootFolderInTeamspace]);

  const getFolders = async (
    folder_id?: number | null,
    workspace_id?: number | null
  ) => {
    const api = `/folders${folder_id ? "/detail/" + folder_id : ""}${
      workspace_id ? "?workspace_id=" + workspace_id : ""
    }`;

    const res = await get(api);

    const newData: TFolder[] = res.folders.map((f: TFolder) => {
      return {
        ...f,
        type: "folder",
        children: [],
      };
    });

    return newData;
  };

  const getNotes = async (
    folder_id?: number | null,
    workspace_id?: number | null
  ) => {
    let api = `/notes`;
    if (folder_id && workspace_id) {
      api += "?";
      if (folder_id) {
        api += "folder_id=" + folder_id;
      }
      if (workspace_id) {
        api += "&workspace_id=" + workspace_id;
      }
    } else if (folder_id) {
      api += "?folder_id=" + folder_id;
    } else if (workspace_id) {
      api += "?workspace_id=" + workspace_id;
    }

    const res = await get(api);
    const newData = res.notes.map((no: TNote) => ({ ...no, type: "note" }));
    return newData;
  };

  const getNotesTeamspace = async (
    folder_id?: number | null,
    workspace_id?: number | null
  ) => {
    let api = `/notes/teamspaces`;
    if (folder_id && workspace_id) {
      api += "?";
      if (folder_id) {
        api += "folder_id=" + folder_id;
      }
      if (workspace_id) {
        api += "&workspace_id=" + workspace_id;
      }
    } else if (folder_id) {
      api += "?folder_id=" + folder_id;
    } else if (workspace_id) {
      api += "?workspace_id=" + workspace_id;
    }

    const res = await get(api);
    if (!res || !Array.isArray(res.notes)) {
      setDataInTeamspace([]);
      return;
    }
    const newData = res.notes.map((no: TNote) => ({ ...no, type: "note" }));
    return newData;
  };

  const getFoldersTeamspace = async (workspace_id?: number | null) => {
    const api = `/folders/teamspaces?${
      workspace_id ? "workspace_id=" + workspace_id : ""
    }`;

    const res = await get(api);
    if (!res || !Array.isArray(res.folders)) {
      setDataInTeamspace([]);
      return;
    }
    const newData = res.folders.map((f: TFolder) => ({
      ...f,
      type: "folder",
      children: [],
    }));
    return newData;
  };

  const fetchInitialDataPrivate = useCallback(async () => {
    if (!rootFolder || !currentWorkspace || currentWorkspace.is_guest) {
      setData([]);
      return;
    }

    let workspace_id = null;

    if (rootFolder.workspace_id !== currentWorkspace.id) {
      workspace_id = currentWorkspace.id;
    } else {
      workspace_id = rootFolder.workspace_id;
    }

    if (!workspace_id) {
      return;
    }

    const [folders, notes] = await Promise.all([
      getFolders(undefined, workspace_id),
      getNotes(undefined, workspace_id),
    ]);

    setData([...folders, ...notes]);
  }, [rootFolder, currentWorkspace]);

  const fetchInitialDataInTeamspace = useCallback(async () => {
    if (
      !rootFolderInTeamspace ||
      !currentWorkspace ||
      currentWorkspace.is_guest
    ) {
      setDataInTeamspace([]);
      return;
    }

    let workspace_id = null;

    if (rootFolderInTeamspace.workspace_id !== currentWorkspace.id) {
      workspace_id = currentWorkspace.id;
    } else {
      workspace_id = rootFolderInTeamspace.workspace_id;
    }

    if (!workspace_id) {
      return;
    }

    const notes = await getNotesTeamspace(undefined, workspace_id);
    const folders = await getFoldersTeamspace(workspace_id);

    if (notes && folders && Array.isArray(notes) && Array.isArray(folders)) {
      setDataInTeamspace([
        {
          ...rootFolderInTeamspace,
          children: [],
          type: "folder",
        },
        ...folders,
        ...notes,
      ]);
    } else {
      setDataInTeamspace([]);
    }
  }, [rootFolderInTeamspace, currentWorkspace]);

  const fetchDataTree = useCallback(
    async (folder_id: number, is_in_teamspace?: boolean) => {
      const existIds = existIdsRef.current;

      if (existIds.has(folder_id)) {
        return;
      }

      existIds.add(folder_id);

      try {
        setIsLoading(true);
        const [folders, notes] = await Promise.all([
          getFolders(folder_id, currentWorkspace?.id),
          getNotes(folder_id, currentWorkspace?.id),
        ]);

        if (is_in_teamspace) {
          setDataInTeamspace((prev) => [...prev, ...folders, ...notes]);
        } else {
          setData((prev) => [...prev, ...folders, ...notes]);
        }
      } catch (error) {
        logAction("Error fetching folder tree data:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [currentWorkspace]
  );

  const onUpdate = useCallback(
    async ({
      id,
      payload,
      type,
      isUpdateData = true,
      is_in_teamspace = false,
    }: {
      id: number;
      payload: Partial<TFolder | TNote>;
      type: TFolder["type"];
      isUpdateData?: boolean;
      is_in_teamspace?: boolean;
    }) => {
      const slug = slugRef.current;

      try {
        const setDataHelper = (
          dispatchData: Dispatch<SetStateAction<(TFolder | TNote)[]>>,
          type: TFolder["type"],
          payload: Partial<TFolder | TNote>,
          cb?: (val: string) => void,
          data?: TFolder | TNote
        ) => {
          if (type === "folder") {
            const folderUpdate = payload as Partial<TFolder>;
            dispatchData((prev) => {
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
          if (type === "note") {
            const noteUpdate = payload as Partial<TNote>;
            dispatchData((prev) => {
              return prev.map((n) => {
                if (n.type === "note" && n.id === id) {
                  n = n as TNote;
                  if (
                    noteUpdate.folder_id &&
                    noteUpdate.folder_id !== n.folder_id
                  ) {
                    setItemWorking(n);
                  } else if (
                    noteUpdate.title &&
                    noteUpdate.title !== n.title &&
                    slug
                  ) {
                    cb?.((data as TNote)?.slug as string);
                  }
                  return { ...n, ...noteUpdate, ...data };
                }

                return n;
              });
            });
          }
        };

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
            if (is_in_teamspace) {
              setDataHelper(
                setDataInTeamspace,
                type,
                folderUpdate,
                undefined,
                undefined
              );
            } else {
              setDataHelper(setData, type, folderUpdate, undefined, undefined);
            }
          }
        }

        if (type === "note") {
          const newPayload = { ...payload } as Partial<TNote>;
          delete newPayload.createdAt;
          delete newPayload.updatedAt;
          delete newPayload.id;

          const res = (await patch(`/notes/update/${id}`, newPayload)) as TNote;

          let newSlug = null;

          if (isUpdateData) {
            if (is_in_teamspace) {
              setDataHelper(
                setDataInTeamspace,
                type,
                newPayload,
                (val: string) => {
                  newSlug = val;
                },
                res
              );
            } else {
              setDataHelper(
                setData,
                type,
                newPayload,
                (val: string) => {
                  newSlug = val;
                },
                res
              );
            }
          }

          let noteUpdating = null;
          if (is_in_teamspace) {
            noteUpdating = dataInTeamspace.find(
              (it) => it.type === "note" && it.id === id
            ) as TNote;
          } else {
            noteUpdating = data.find(
              (it) => it.type === "note" && it.id === id
            ) as TNote;
          }

          if (!noteUpdating || !currentNote) {
            return;
          }

          if (
            newSlug &&
            newSlug !== slug &&
            noteUpdating.slug === currentNote.slug
          ) {
            router.replace(`/${newSlug}`);
          }
        }
      } catch (error) {
        throw error;
      }
    },
    [router, currentNote, data, dataInTeamspace]
  );

  const onDelete = useCallback(
    async (
      id: number,
      type: TFolder["type"],
      updateData = true,
      is_in_teamspace = false
    ) => {
      try {
        if (type === "folder") {
          await del(`/folders/delete/${id}`);
        }
        if (type === "note") {
          await del(`/notes/delete/${id}`);
        }

        if (updateData) {
          const copy = [...(is_in_teamspace ? dataInTeamspace : data)];
          const filter = copy.filter((it) => {
            if (it.type !== type) {
              return true;
            }
            return it.id !== id;
          });
          if (is_in_teamspace) {
            setDataInTeamspace(filter);
          } else {
            setData(filter);
          }
        }
      } catch (error) {
        throw error;
      }
    },
    [data, dataInTeamspace]
  );

  const onAddNew = useCallback(
    async (
      type: TFolder["type"],
      payload: Partial<TFolder | TNote>,
      updateData: boolean = true,
      is_in_teamspace: boolean = false
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
            if (is_in_teamspace || newPayload.is_in_teamspace) {
              setDataInTeamspace((prev) => [newPayload, ...prev]);
            } else {
              setData((prev) => [newPayload, ...prev]);
            }
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
            if (is_in_teamspace || newPayload.is_in_teamspace) {
              setDataInTeamspace((prev) => [newPayload, ...prev]);
            } else {
              setData((prev) => [newPayload, ...prev]);
            }
          }
        }
      } catch (error) {
        throw error;
      }
    },
    []
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        await Promise.all([
          fetchInitialDataPrivate(),
          fetchInitialDataInTeamspace(),
        ]);
      } catch (error) {
        logAction("Error fetching initial folder data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [fetchInitialDataPrivate, fetchInitialDataInTeamspace]);

  useEffect(() => {
    if (rootFolder) {
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

      setDataTree(folders);
    }
  }, [data, rootFolder]);

  useEffect(() => {
    if (rootFolderInTeamspace) {
      let folders = createTreeData(dataInTeamspace, rootFolderInTeamspace.id);
      folders = [
        ...folders,
        ...dataInTeamspace.filter((it) => {
          if (it.type === "note") {
            const note = it as TNote;
            return note.folder_id === rootFolderInTeamspace.id;
          }
          return false;
        }),
      ];

      setDataTreeInTeamspace([
        {
          ...rootFolderInTeamspace,
          children: folders,
          type: "folder",
        },
      ]);
    }
  }, [dataInTeamspace, rootFolderInTeamspace]);

  const value = {
    data,
    isLoading,
    dataInTeamspace,
    dataTree,
    dataTreeInTeamspace,
    rootFolderInTeamspace,
    rootFolder,
    foldersDefaultOpen,
    itemWorking,
    fetchDataTree,
    onUpdate,
    setData,
    onDelete,
    setItemWorking,
    onAddNew,
    setFoldersDefaultOpen,
    setDataInTeamspace,
    setRootFolder,
    setRootFolderInTeamspace,
  };

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

const FolderContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [rootFolder, setRootFolder] = useState<TFolder | null>(null);
  const [rootFolderInTeamspace, setRootFolderInTeamspace] =
    useState<TFolder | null>(null);

  const { currentWorkspace, setIsGuestInWorkspace } = useWorkspace();

  useEffect(() => {
    const fetchRootFolders = async (workspace_id: number) => {
      try {
        const res = (await get(
          `/folders/root?workspace_id=${workspace_id}`
        )) as {
          rootFolderPrivate: TFolder | null;
          rootFolderTeamspace: TFolder | null;
        };
        setRootFolder(res.rootFolderPrivate);
        setRootFolderInTeamspace(res.rootFolderTeamspace);
        setIsGuestInWorkspace(!!!res.rootFolderPrivate);
      } catch (error) {
        logAction("Error fetching root folders:", error);
        setRootFolder(null);
        setRootFolderInTeamspace(null);
        setIsGuestInWorkspace(true);
      }
    };

    if (currentWorkspace) {
      fetchRootFolders(currentWorkspace.id);
    } else {
      setRootFolder(null);
      setRootFolderInTeamspace(null);
      setIsGuestInWorkspace(true);
    }
  }, [currentWorkspace, setIsGuestInWorkspace]);

  return (
    <FolderContext
      rootFolder={rootFolder}
      rootFolderInTeamspace={rootFolderInTeamspace}
      setRootFolder={setRootFolder}
      setRootFolderInTeamspace={setRootFolderInTeamspace}
    >
      {children}
    </FolderContext>
  );
};

export { FolderContext, useFolderState, FolderContextProvider };
