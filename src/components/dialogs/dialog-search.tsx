import { useWorkspace } from "@/contexts/workspace-context";
import { logAction } from "@/lib/utils";
import { TNote } from "@/types/note.type";
import { get } from "@/utils/request";
import {
	Dispatch,
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
import { CornerDownLeft, FileIcon, Search, SearchIcon } from "lucide-react";
import MyOverlay from "../overlay";
import lodash from "lodash";
import { useRouter } from "next/navigation";

const DataItem = ({
	note,
	index,
	selected,
	onClick,
}: {
	note: TNote;
	index: number;
	selected: boolean;
	onClick: () => void;
}) => {
	return (
		<div
			key={note.id}
			className={`p-2 hover:bg-neutral-100 hover:outline-1 rounded-md cursor-pointer group/item relative item-search ${
				selected ? "bg-neutral-100 outline-1" : ""
			}`}
			data-search-type="note"
			data-type="search"
			data-index={index}
			onClick={onClick}
		>
			<div className="flex items-center gap-2">
				<FileIcon size={20} className="text-neutral-400" />
				<p className="text-primary font-medium line-clamp-1 text-ellipsis max-w-full w-full group/item:hover:pr-5">
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

const DialogSearch = ({
	open,
	setOpen,
	valueSearch,
	setValueSearch,
}: {
	open: boolean;
	setOpen: Dispatch<SetStateAction<boolean>>;
	valueSearch?: string;
	setValueSearch?: Dispatch<SetStateAction<string>>;
}) => {
	const { currentWorkspace } = useWorkspace();

	const [dataSearch, setDataSearch] = useState<TNote[]>([]);
	const [selectedIndex, setSelectedIndex] = useState<number>(-1);

	const inputRef = useRef<HTMLInputElement | null>(null);
	const dropdownContentRef = useRef<HTMLDivElement | null>(null);

	const router = useRouter();

	const debounceSearch = useRef(
		lodash.debounce((val: string, workspace_id: number) => {
			handleSearch(val, workspace_id);
		}, 300)
	).current;

	useEffect(() => {
		if (valueSearch && valueSearch.trim() && currentWorkspace) {
			debounceSearch(valueSearch, currentWorkspace.id);
		}
	}, [valueSearch, debounceSearch, currentWorkspace]);

	useEffect(() => {
		setDataSearch([]);
		setSelectedIndex(-1);
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

		setSelectedIndex(index);
	};

	const onEnter = useCallback(
		(index: number) => {
			if (index >= 0 && index < dataSearch.length) {
				router.push(`/${dataSearch[index].slug}`);
				setOpen(false);
			}
		},
		[dataSearch, router, setOpen]
	);

	const onKeyDown = useCallback(
		(e: React.KeyboardEvent, length: number) => {
			if (e.key === "ArrowDown") {
				e.preventDefault();
				setSelectedIndex((prev) => {
					return (prev + 1) % length;
				});
			}

			if (e.key === "ArrowUp") {
				e.preventDefault();
				setSelectedIndex((prev) => {
					return prev - 1 < 0 ? length - 1 : prev - 1;
				});
			}

			if (e.key === "Enter") {
				e.preventDefault();
				onEnter(selectedIndex);
			}
		},
		[onEnter, selectedIndex]
	);

	const handleSearch = useCallback(
		async (key: string, workspace_id: number) => {
			try {
				const res = (await get(
					`/search?query=${encodeURIComponent(
						key
					)}&workspace_id=${workspace_id}`
				)) as TNote[];
				setDataSearch(res);
			} catch (error) {
				logAction("Error searching:", error);
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
					className="min-h-156 shadow-2xl w-1/2 py-2 px-4"
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
					<div className="w-full flex flex-col gap-2">
						<div className="mb-2 flex flex-col gap-2">
							<div className="flex items-center gap-2">
								<div>
									<SearchIcon className="text-neutral-500" />
								</div>
								<input
									className="w-full p-2 outline-none text-lg"
									placeholder="Search in workspace..."
									value={valueSearch}
									onChange={(e) => {
										if (setValueSearch) {
											setValueSearch(e.target.value);
										}
									}}
									ref={inputRef}
									onKeyDown={(e) => onKeyDown(e, dataSearch.length)}
								/>
							</div>
							<div>Action</div>
						</div>
						<div className="flex-1 ">
							{dataSearch.length ? (
								<div className="flex flex-col gap-0 text-sm">
									{dataSearch.map((note, index) => (
										<DataItem
											key={note.id}
											note={note}
											index={index}
											selected={selectedIndex === index}
											onClick={() => onEnter(index)}
										/>
									))}
								</div>
							) : (
								<div>no result</div>
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
