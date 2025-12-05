/* eslint-disable @typescript-eslint/no-explicit-any */
import { useWorkspace } from "@/contexts/workspace-context";
import { cn, logAction, sleep } from "@/lib/utils";
import { TNote } from "@/types/note.type";
import { get } from "@/utils/request";
import {
  Dispatch,
  ForwardRefExoticComponent,
  RefAttributes,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { SidebarMenuButton } from "../ui/sidebar";
import {
  ArrowDownUp,
  ChevronDown,
  CornerDownLeft,
  FileIcon,
  FolderIcon,
  LucideProps,
  Search,
  SearchIcon,
  User,
  X,
} from "lucide-react";
import MyOverlay from "../overlay";
import lodash from "lodash";
import { useRouter } from "next/navigation";
import { Spinner } from "../ui/spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { MyInput } from "../ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useAuth } from "@/contexts/auth-context";
import { TWorkspaceMember } from "@/types/workspace.type";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { useFolderState } from "@/contexts/folder-context";
import { TFolder } from "@/types/folder.type";
import { Skeleton } from "../ui/skeleton";

const ButtonTriggerAction = ({
  hasSelected,
  title,
  icon: Icon,
  titleSelected,
}: {
  hasSelected: boolean;
  title: string;
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
  titleSelected?: string;
}) => {
  return hasSelected ? (
    <Button
      variant="ghost"
      size="sm"
      className={`text-neutral-500 max-w-64 h-6 font-normal ${
        hasSelected
          ? "bg-blue-400/20 text-blue-500 hover:bg-blue-400/30 hover:text-blue-600 active:outline-none outline-0"
          : ""
      }`}
    >
      <Icon />
      <p className="line-clamp-1 text-ellipsis">{`${title}: ${titleSelected}`}</p>
      <ChevronDown />
    </Button>
  ) : (
    <Button
      variant="ghost"
      size="sm"
      className="text-neutral-500 h-6 font-normal"
    >
      <Icon />
      {title}
      <ChevronDown />
    </Button>
  );
};

const PopoverMenu = ({
  open,
  setOpen,
  modal,
  trigger,
  input,
  data,
  renderItem,
  content,
  onSelectItem,
  multipleSelect,
  extraSelected,
}: {
  open?: boolean;
  setOpen?: Dispatch<SetStateAction<boolean>>;
  modal?: boolean;
  trigger?: React.ReactNode;
  input?: {
    valueInput?: string;
    onChangeInput?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
  };
  data?: Array<any>;
  renderItem?: (
    item: any,
    index: number,
    isSelected: boolean
  ) => React.ReactNode;
  content?: {
    className?: string;
    align?: PopoverPrimitive.PopoverContentProps["align"];
    sideOffset?: number;
    props?: React.ComponentProps<typeof PopoverPrimitive.Content>;
  };
  onSelectItem?: (item: any) => void;
  multipleSelect?: boolean;
  extraSelected?: React.ReactNode;
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const listElementRef = useRef<HTMLDivElement | null>(null);
  const indexRef = useRef<number>(-1);

  const onMouseMove = (e: MouseEvent) => {
    const listElement = listElementRef.current;

    if (!listElement) return;
    if (!listElement.contains(e.target as Node)) {
      return;
    }

    const target = e.target;

    const childs = listElement.childNodes;

    childs.forEach((child, index) => {
      if (child === target || child.contains(target as Node)) {
        setSelectedIndex(index);
        indexRef.current = index;
      }
    });
  };

  const contentRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (node !== null) {
        if (open) {
          let current_index = indexRef.current;

          const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setSelectedIndex((prev) => {
                current_index = (prev + 1) % (data?.length || 0);
                return current_index;
              });
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setSelectedIndex((prev) => {
                current_index =
                  (prev - 1 + (data?.length || 0)) % (data?.length || 0);
                return current_index;
              });
            }

            indexRef.current = current_index;

            if (e.key === "Enter") {
              e.preventDefault();
              const selectedItem = data?.[current_index];
              if (selectedItem) {
                if (onSelectItem) {
                  onSelectItem(selectedItem);
                }
              }
              if (!multipleSelect) {
                setOpen?.(false);
              }
            }
          };

          node.addEventListener("keydown", onKeyDown);
          node.addEventListener("mousemove", onMouseMove);

          return () => {
            node.removeEventListener("keydown", onKeyDown);
            node.removeEventListener("mousemove", onMouseMove);
          };
        }
      }
    },
    [open, data, onSelectItem, multipleSelect, setOpen]
  );

  useEffect(() => {
    if (!open) {
      setSelectedIndex(-1);
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={modal}>
      {trigger ? (
        <PopoverTrigger asChild className="font-normal">
          {trigger}
        </PopoverTrigger>
      ) : (
        <PopoverTrigger>
          <span />
        </PopoverTrigger>
      )}
      <PopoverContent
        className={cn("z-10001 w-56 p-2", content?.className)}
        align={content?.align || "start"}
        sideOffset={content?.sideOffset}
        ref={contentRef}
        {...content?.props}
      >
        <div className="flex flex-col h-full">
          <MyInput
            placeholder={input?.placeholder || "Search..."}
            autoFocus
            value={input?.valueInput}
            onChange={input?.onChangeInput}
          />
          {multipleSelect ? extraSelected : null}
          {data && data.length ? (
            <div className="flex flex-col gap-0.5 mt-2" ref={listElementRef}>
              {data.map((item, index) =>
                renderItem?.(item, index, selectedIndex === index)
              )}
            </div>
          ) : (
            <div className="my-2">No data</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const DropdownSortAction = ({
  open,
  setOpen,
  selectedSort,
  onSelectSort,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  selectedSort?: string;
  onSelectSort?: (sort: string) => void;
}) => {
  const dropdownContentRef = useRef<HTMLDivElement | null>(null);

  const sorts = [
    { label: "Best matches", value: "best-matches" },
    { label: "Last Edited: Newest first", value: "last-edited-newest" },
    { label: "Last Edited: Oldest first", value: "last-edited-oldest" },
    { label: "Created: Newest first", value: "created-newest" },
    { label: "Created: Oldest first", value: "created-oldest" },
  ];

  // const onPointerDown = useCallback(
  //   (e: PointerEvent) => {
  //     if (dropdownContentRef.current?.contains(e.target as Node)) {
  //       return;
  //     }
  //     e.preventDefault();
  //     e.stopPropagation();
  //     setOpen(false);
  //   },
  //   [setOpen]
  // );

  // useEffect(() => {
  //   if (open) {
  //     document.addEventListener("pointerdown", onPointerDown, {
  //       capture: true,
  //     });
  //   } else {
  //     document.removeEventListener("pointerdown", onPointerDown, {
  //       capture: true,
  //     });
  //   }
  // }, [open, onPointerDown]);

  const hasSelected = selectedSort !== "best-matches";

  return (
    <>
      <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`text-neutral-500 h-6 font-normal active:outline-none outline-0 ${
              hasSelected
                ? "bg-blue-400/20 text-blue-500 hover:bg-blue-400/30 hover:text-blue-600"
                : ""
            }`}
          >
            <ArrowDownUp />
            {hasSelected
              ? `${sorts.find((s) => s.value === selectedSort)?.label}`
              : "Sort"}
            <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="z-10002 min-w-56"
          align="start"
          ref={dropdownContentRef}
        >
          {sorts.map((sort) => (
            <DropdownMenuItem
              key={sort.value}
              onSelect={() => onSelectSort?.(sort.value)}
              className="cursor-pointer"
            >
              {sort.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {open && <MyOverlay className="z-10001 pointer-events-auto" />}
    </>
  );
};

const DropdownCreatedByAction = ({
  open,
  setOpen,
  createdBy,
  onChangeCreatedBy,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  createdBy: number[];
  onChangeCreatedBy: (createdBy: number) => void;
}) => {
  const { membersInWorkspace } = useWorkspace();
  const {
    state: { user },
  } = useAuth();

  const [filteredMembers, setFilteredMembers] = useState<TWorkspaceMember[]>(
    []
  );
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    if (!searchValue.trim()) {
      setFilteredMembers(membersInWorkspace);
    }

    const filtered = membersInWorkspace.filter((mem) => {
      return mem.fullname
        ? mem.fullname.toLowerCase().includes(searchValue.toLowerCase())
        : false;
    });
    setFilteredMembers(filtered);
  }, [searchValue, membersInWorkspace]);

  const handleAddUser = (user: TWorkspaceMember) => {
    onChangeCreatedBy?.(user.id);
  };

  return (
    <>
      <PopoverMenu
        open={open}
        setOpen={setOpen}
        trigger={
          <div className="">
            <ButtonTriggerAction
              hasSelected={(createdBy?.length || 0) > 0}
              icon={User}
              title="Created By"
              titleSelected={membersInWorkspace
                .filter((mem) => createdBy?.includes(mem.id))
                .map((mem) => mem.fullname)
                .join(", ")}
            />
          </div>
        }
        data={filteredMembers}
        input={{
          valueInput: searchValue,
          onChangeInput: (e) => setSearchValue(e.target.value),
        }}
        multipleSelect
        extraSelected={
          <>
            {createdBy.length ? (
              <div className="bg-neutral-50 min-h-10 px-1 mt-2 border rounded">
                {createdBy.map((id) => {
                  const mem = membersInWorkspace.find((m) => m.id === id);

                  if (!mem) {
                    return null;
                  }

                  return (
                    <div
                      key={mem.id}
                      className="items-center text-xs px-1 py-0.5 gap-0 inline-flex"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="size-4.5">
                          <AvatarImage
                            src={mem.avatar || undefined}
                            alt="Avatar created by"
                          />
                          <AvatarFallback className="text-xs uppercase bg-white border">
                            {mem?.fullname?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <p>{mem.fullname || "Unlimited User"} </p>
                      </div>
                      <Button
                        className="size-3.5 p-0 rounded-xs text-xs text-neutral-500"
                        variant={"ghost"}
                        onClick={() => handleAddUser(mem)}
                      >
                        <X size={12} className="size-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </>
        }
        renderItem={(mem, index, isSelected) => {
          return (
            <div
              key={`${mem.id}-${index}`}
              className={`flex items-center gap-1.5 p-1 text-sm rounded cursor-pointer ${
                isSelected ? "bg-neutral-200/80" : ""
              }`}
              onClick={() => {
                handleAddUser(mem);
              }}
            >
              <Avatar className="size-6">
                <AvatarImage
                  src={mem.avatar || undefined}
                  alt="Avatar created by"
                />
                <AvatarFallback className="text-xs uppercase bg-white border">
                  {mem?.fullname?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <p>
                {mem.fullname || "Unlimited User"}{" "}
                {user && user.id === mem.id ? (
                  <span className="text-neutral-500">(You)</span>
                ) : null}
              </p>
            </div>
          );
        }}
        onSelectItem={(item) => {
          handleAddUser(item);
        }}
      />

      {open && <MyOverlay className="z-10001 pointer-events-auto" />}
    </>
  );
};

const DropdownFilterFolder = ({
  open,
  setOpen,
  foldersSelected,
  onChangeFoldersSelected,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  foldersSelected: number[];
  onChangeFoldersSelected: (folderId: number) => void;
}) => {
  const { data } = useFolderState();

  const [filteredData, setFilteredData] = useState<TFolder[]>([]);
  const [searchValue, setSearchValue] = useState<string>("");

  useEffect(() => {
    const folders = data.filter(
      (folder) => folder.type === "folder"
    ) as TFolder[];

    if (!searchValue.trim()) {
      setFilteredData(folders);
      return;
    }

    const filtered = folders.filter((folder) =>
      folder.title.toLowerCase().includes(searchValue.toLowerCase())
    );
    setFilteredData(filtered);
  }, [searchValue, data]);

  const handleAddSelectFolder = (folder_id: number) => {
    onChangeFoldersSelected(folder_id);
  };

  return (
    <>
      <PopoverMenu
        data={filteredData}
        open={open}
        setOpen={setOpen}
        trigger={
          <div className="">
            <ButtonTriggerAction
              hasSelected={foldersSelected.length > 0}
              icon={FolderIcon}
              title="In Folder"
              titleSelected={data
                .filter(
                  (folder) =>
                    folder.type === "folder" &&
                    foldersSelected.includes(folder.id)
                )
                .map((folder) => folder.title)
                .join(", ")}
            />
          </div>
        }
        renderItem={(item: TFolder, index, isSelected) => {
          return (
            <div
              key={index}
              className={`${isSelected ? "bg-neutral-200/80" : ""} ${
                foldersSelected.includes(item.id) ? "bg-accent" : ""
              } cursor-pointer p-1 rounded text-sm flex items-center gap-1.5`}
              onClick={() => {
                handleAddSelectFolder(item.id);
              }}
            >
              <FolderIcon size={16} className="text-neutral-500" />
              {item.title}
            </div>
          );
        }}
        onSelectItem={(item: TFolder) => {
          handleAddSelectFolder(item.id);
        }}
        input={{
          valueInput: searchValue,
          onChangeInput: (e) => setSearchValue(e.target.value),
          placeholder: "Search folder...",
        }}
        multipleSelect
        extraSelected={
          <>
            {foldersSelected.length ? (
              <div className="bg-neutral-50 min-h-10 flex flex-wrap gap-1 px-1 py-0.5 mt-2 mb-1 border rounded">
                {foldersSelected.map((folderId) => {
                  const folder = data.find(
                    (f) => f.type === "folder" && f.id === folderId
                  );

                  if (!folder) {
                    return null;
                  }

                  return (
                    <div
                      key={folder.id}
                      className="inline-flex items-center text-xs px-1 py-0.5 gap-0 h-fit"
                    >
                      <div className="flex items-center gap-2">
                        <FileIcon size={14} className="text-neutral-500" />
                        <p>{folder.title}</p>
                      </div>
                      <Button
                        className="size-3.5 p-0 rounded-xs text-xs text-neutral-500"
                        variant={"ghost"}
                        onClick={() => handleAddSelectFolder(folder.id)}
                      >
                        <X size={12} className="size-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </>
        }
      />
      {open && <MyOverlay className="z-10001 pointer-events-auto" />}
    </>
  );
};

const DataItem = ({
  note,
  selectedIndex,
  onClick,
}: {
  note: TNote;
  selectedIndex: number;
  onClick: () => void;
}) => {
  const selected = note.id === selectedIndex;

  return (
    <div
      key={note.id}
      className={`p-2  rounded-md cursor-pointer group/item relative item-search ${
        selected ? "bg-neutral-100" : ""
      }`}
      data-search-type="note"
      data-type="search-item"
      data-index={note.id}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <FileIcon size={20} className="text-neutral-400" />
        <p className="text-primary line-clamp-1 text-ellipsis group/item:hover:pr-5 w-full max-w-full font-medium">
          {note.title || "Untitled"}
        </p>
      </div>
      <div
        className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
          selected ? "opacity-100" : "opacity-0 group-hover/item:opacity-100"
        }`}
      >
        <CornerDownLeft size={14} className="text-neutral-400" />
      </div>
    </div>
  );
};

const initialFilterValue: {
  sort: string;
  createdBy: number[];
  folders: number[];
} = {
  sort: "best-matches",
  createdBy: [],
  folders: [],
};

const DialogSearch = ({
  open,
  setOpen,
  valueSearch,
  setValueSearch,
  setOpenPopoverTrash,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  valueSearch: string;
  setValueSearch?: Dispatch<SetStateAction<string>>;
  setOpenPopoverTrash?: Dispatch<SetStateAction<boolean>>;
}) => {
  const { currentWorkspace } = useWorkspace();

  const [dataSearch, setDataSearch] = useState<
    {
      label: string;
      notes: TNote[];
    }[]
  >([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentValueSearch, setCurrentValueSearch] = useState<string>("");

  const [openDropdownSort, setOpenDropdownSort] = useState<boolean>(false);
  const [openDropdownCreatedBy, setOpenDropdownCreatedBy] =
    useState<boolean>(false);
  const [openDropdownFolder, setOpenDropdownFolder] = useState<boolean>(false);
  const [filterValue, setFilterValue] = useState(initialFilterValue);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropdownContentRef = useRef<HTMLDivElement | null>(null);
  const selectedIndexRef = useRef<number>(-1);

  const router = useRouter();

  const debounceSearch = useRef(
    lodash.debounce(
      (
        val: string,
        workspace_id: number,
        query?: {
          sort: string;
          createdBy: number[];
          folders: number[];
        }
      ) => {
        handleSearch(val, workspace_id, query);
      },
      300
    )
  ).current;

  useEffect(() => {
    setSelectedIndex(0);
    if (open) {
      setCurrentValueSearch(valueSearch);
    } else {
      setCurrentValueSearch("");
    }
  }, [valueSearch, open]);

  useEffect(() => {
    setSelectedIndex(0);
    selectedIndexRef.current = 0;
    if (currentWorkspace) {
      debounceSearch(currentValueSearch, currentWorkspace.id, filterValue);
    }
  }, [currentValueSearch, debounceSearch, currentWorkspace, filterValue]);

  useEffect(() => {
    setDataSearch([]);
    setSelectedIndex(-1);
    selectedIndexRef.current = -1;
  }, [currentWorkspace]);

  const onMouseMove = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const itemElement = target.closest(".item-search") as HTMLDivElement | null;
    if (!itemElement) return;

    const type = itemElement.getAttribute("data-search-type");
    if (!type) {
      return;
    }

    const indexAttr = itemElement.getAttribute("data-index");
    if (!indexAttr) {
      return;
    }
    const index = Number(indexAttr);
    selectedIndexRef.current = index;

    setSelectedIndex(index);
  };

  const onEnter = useCallback(
    (index: number) => {
      const item = dataSearch
        .map((gr) => gr.notes)
        .flat()
        .find((note) => note.id === index);
      if (item) {
        router.push(`/${item.slug}`);
        setOpen(false);
      }
    },
    [dataSearch, router, setOpen]
  );

  const onKeyDown = useCallback(
    (
      e: React.KeyboardEvent,
      data: {
        label: string;
        notes: TNote[];
      }[]
    ) => {
      const flats = data
        .map((group) => group.notes)
        .filter((note) => note)
        .flat();

      let index = selectedIndexRef.current;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => {
          for (let i = 0; i < flats.length; i++) {
            if (flats[i].id > prev) {
              index = flats[i].id;
              return index;
            }
          }
          index = flats[0].id;
          return index;
        });
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => {
          for (let i = flats.length - 1; i >= 0; i--) {
            if (flats[i].id < prev) {
              index = flats[i].id;
              return index;
            }
          }
          index = flats[flats.length - 1].id;
          return index;
        });
      }

      if (e.key === "Enter") {
        e.preventDefault();
        onEnter(index);
      }
    },
    [onEnter]
  );

  const handleSearch = useCallback(
    async (
      key: string,
      workspace_id: number,
      query?: {
        sort: string;
        createdBy: number[];
        folders: number[];
      }
    ) => {
      try {
        setLoading(true);
        await sleep(1000);

        let api = `/search?query=${encodeURIComponent(
          key
        )}&workspace_id=${workspace_id}`;

        if (query) {
          if (query.sort) {
            api += `&sort=${query.sort}`;
          }

          if (query.createdBy.length) {
            api += `&created_by=${query.createdBy.join(",")}`;
          }

          if (query.folders.length) {
            api += `&folders=${query.folders.join(",")}`;
          }
        }

        const res = (await get(api)) as {
          label: string;
          notes: TNote[];
        }[];
        setDataSearch(res);
      } catch (error) {
        logAction("Error searching:", error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen} modal={false}>
        <DialogTrigger asChild>
          <SidebarMenuButton className="text-neutral-700 font-medium cursor-pointer">
            <Search className="text-neutral-500" /> Search
          </SidebarMenuButton>
        </DialogTrigger>

        <DialogContent
          className="min-h-156 w-1/2 px-4 py-2 shadow-2xl"
          showCloseButton={false}
          style={{
            maxWidth: "100%",
          }}
          ref={dropdownContentRef}
          onMouseMove={onMouseMove}
        >
          <DialogHeader className="hidden">
            <DialogTitle />
            <DialogDescription />
          </DialogHeader>
          <div className="flex flex-col w-full gap-2 overflow-hidden">
            <div className="flex flex-col w-full gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="relative">
                  {loading ? (
                    <Spinner className="size-5 text-neutral-400" style={{}} />
                  ) : (
                    <SearchIcon
                      className="text-neutral-500 transition-opacity"
                      size={20}
                      style={{
                        opacity: loading ? 0 : 1,
                      }}
                    />
                  )}
                </div>
                <input
                  className="placeholder:text-neutral-400/70 w-full p-2 text-lg font-normal outline-none"
                  placeholder="Search in workspace..."
                  value={valueSearch}
                  onChange={(e) => {
                    if (setValueSearch) {
                      setValueSearch(e.target.value);
                    }
                  }}
                  ref={inputRef}
                  onKeyDown={(e) => onKeyDown(e, dataSearch)}
                />
              </div>
              <div className="flex items-center w-full gap-2 overflow-x-auto">
                <DropdownSortAction
                  open={openDropdownSort}
                  setOpen={setOpenDropdownSort}
                  selectedSort={filterValue.sort}
                  onSelectSort={(sort) =>
                    setFilterValue((prev) => ({ ...prev, sort }))
                  }
                />
                <DropdownCreatedByAction
                  open={openDropdownCreatedBy}
                  setOpen={setOpenDropdownCreatedBy}
                  createdBy={filterValue.createdBy}
                  onChangeCreatedBy={(createdBy) =>
                    setFilterValue((prev) => ({
                      ...prev,
                      createdBy: prev.createdBy.includes(createdBy)
                        ? prev.createdBy.filter((id) => id !== createdBy)
                        : [...prev.createdBy, createdBy],
                    }))
                  }
                />
                <DropdownFilterFolder
                  open={openDropdownFolder}
                  setOpen={setOpenDropdownFolder}
                  foldersSelected={filterValue.folders}
                  onChangeFoldersSelected={(folderId) =>
                    setFilterValue((prev) => ({
                      ...prev,
                      folders: prev.folders.includes(folderId)
                        ? prev.folders.filter((id) => id !== folderId)
                        : [...prev.folders, folderId],
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex-1 mt-2">
              {loading ? (
                <div className="space-y-2">
                  <Label className="text-neutral-500 px-1 text-xs">
                    Best Matches
                  </Label>
                  <div className="flex flex-col gap-3">
                    {Array.from({ length: 8 }).map((_, index) => (
                      <div
                        key={index}
                        className="border-muted flex items-center gap-2 py-2 border-b"
                      >
                        <Skeleton className="size-6" />
                        <div className="space-y-1">
                          <Skeleton className="w-xl h-3" />
                          <Skeleton className="w-md h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : dataSearch.length &&
                dataSearch.some((group) => group.notes.length) ? (
                dataSearch.map((group) => {
                  if (group.notes.length) {
                    return (
                      <div className="space-y-2" key={group.label}>
                        <Label className="text-neutral-500 px-1 text-xs">
                          {group.label}
                        </Label>
                        <div className="flex flex-col gap-0 text-sm">
                          {group.notes.map((note) => {
                            return (
                              <DataItem
                                key={note.id}
                                note={note}
                                selectedIndex={selectedIndex}
                                onClick={() => onEnter(selectedIndex)}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  <div>
                    <div className="text-sm text-center">
                      <p className="text-primary/80 font-semibold">
                        No results
                      </p>
                      <p className="text-neutral-500">
                        Some results maybe in your trash.
                      </p>
                    </div>
                    <div className=" text-center">
                      <button
                        className="mt-1 text-sm text-blue-600 cursor-pointer"
                        onClick={() => {
                          setOpen(false);
                          if (setOpenPopoverTrash) {
                            setOpenPopoverTrash(true);
                          }
                        }}
                      >
                        Search in trash
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {open && <MyOverlay />}
    </>
  );
};

export default DialogSearch;
