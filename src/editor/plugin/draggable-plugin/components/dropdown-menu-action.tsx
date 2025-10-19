"use client";

import React, { Dispatch, useCallback, useEffect, useState } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "../../../../components/ui/dropdown-menu";
import { LexicalEditor } from "lexical";
import { useToolbarState } from "@/contexts/toolbar-context";
import {
	deleteBlock,
	formatBulletList,
	formatCode,
	formatHeading,
	formatNumberedList,
	formatParagraph,
	formatQuote,
} from "../../toolbar-plugin/utils";
import { Braces, Check, LucideProps, Trash } from "lucide-react";
import DropdownMenuBlock from "../../../components/dropdown-menu-block";
import { useSelectionCustom } from "@/contexts/selection-custom-context";
import { listLanguageCode } from "@/editor/utils";
import { getIconFromKeyBlock, listKeyBlocks } from "@/utils/list-action";
import { appName } from "@/lib/contants";

interface DropdownMenuActionProps {
	editor: LexicalEditor;
	open?: boolean;
	setOpen?: Dispatch<boolean>;
	lockMenu?: () => void;
	cursorBlock?: HTMLElement | null;
	onClose?: () => void;
	trigger?: React.ReactNode;
	align?: "start" | "center" | "end";
	alignOffset?: number;
	side?: "left" | "right" | "top" | "bottom" | undefined;
	sideOffset?: number;
	fixPosition?: { x: number; y: number };
}

type IconType = React.ForwardRefExoticComponent<
	Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
>;

type DataFiltered = {
	label: string;
	items: {
		key: string;
		name: string;
		icon?: IconType;
	}[];
};

enum ActionLabelType {
	Blocks = "blocks",
	Languages = "languages",
	Actions = "actions",
}

const DropdownMenuFilteredItem = ({
	label,
	key_action,
	icon,
	name,
	editor,
	onClose,
}: {
	label: ActionLabelType;
	key_action: string;
	icon?: IconType;
	name: string;
	editor: LexicalEditor;
	onClose?: () => void;
}) => {
	const {
		selectionState: { isSelectionManyBlock, isSelectionManyLineInListNode },
	} = useSelectionCustom();

	const {
		toolbarState: { blockType, codeLanguage },
	} = useToolbarState();

	const onActionChange = useCallback(
		(label: string, key: string) => {
			const cleanLabel = label.toLowerCase();

			switch (cleanLabel) {
				case ActionLabelType.Blocks:
					handleBlockChange({
						editor,
						blockName: key,
						current_blockType: blockType,
						isSelectionManyBlock,
						isSelectionManyLineInListNode,
					});
					break;
				case ActionLabelType.Languages:
					formatCode(editor, blockType, codeLanguage, key);
					break;
				case ActionLabelType.Actions:
					if (key === "delete") {
						deleteBlock(editor);
					}
					break;
				default:
					break;
			}

			onClose?.();
		},
		[
			editor,
			blockType,
			isSelectionManyBlock,
			isSelectionManyLineInListNode,
			onClose,
			codeLanguage,
		]
	);

	const Icon = icon as IconType;

	if (label === ActionLabelType.Actions && key_action === "delete") {
		return (
			<DropdownMenuItem
				onClick={() => {
					onActionChange(label, key_action);
				}}
				className={`flex capitalize cursor-pointer gap-1.5 w-full group`}
			>
				<div className="flex items-center justify-between gap-1.5 w-full group-hover:text-destructive group-focus:text-destructive transition-colors">
					<div className="flex items-center flex-1 gap-1">
						<Icon className="hover:text-destructive" />
						{name}
					</div>
					<span className="text-gray-400">Del</span>
				</div>
			</DropdownMenuItem>
		);
	}

	return (
		<DropdownMenuItem
			onClick={() => {
				onActionChange(label, key_action);
			}}
			className={`flex capitalize cursor-pointer gap-1.5 w-full`}
		>
			{icon !== undefined && <Icon />}
			{name}
		</DropdownMenuItem>
	);
};

const DropdownMenuFiltered = ({
	inputValue,
	editor,
	onClose,
}: {
	inputValue: string;
	editor: LexicalEditor;
	onClose?: () => void;
}) => {
	const {
		toolbarState: { blockType },
	} = useToolbarState();

	const [data, setData] = useState<DataFiltered[]>([]);
	const [filteredData, setFilteredData] = useState<DataFiltered[]>([]);

	useEffect(() => {
		const clean = listKeyBlocks.map(({ key, title }) => ({
			key,
			name: title,
			icon: getIconFromKeyBlock(key),
		}));

		const actions = [{ key: "delete", name: "Delete", icon: Trash }];

		setData([
			{ label: ActionLabelType.Blocks, items: clean },
			{ label: ActionLabelType.Actions, items: actions },
		]);

		return () => setData([]);
	}, []);

	useEffect(() => {
		if (blockType === "code") {
			const clean = listLanguageCode.map(({ key, name }) => ({ key, name }));
			setData((prev) => [
				...prev,
				{ label: ActionLabelType.Languages, items: clean },
			]);
			return;
		}
	}, [blockType]);

	useEffect(() => {
		if (!inputValue.trim().length) {
			setFilteredData(data);
			return;
		}

		const lowercasedInput = inputValue.toLowerCase();
		const filtered = data
			.filter((group) => {
				const newItem = group.items.filter(
					(item) =>
						item.name.toLowerCase().includes(lowercasedInput) ||
						item.key.toLowerCase().includes(lowercasedInput)
				);

				return newItem.length;
			})
			.map((group) => ({
				...group,
				items: group.items.filter(
					(item) =>
						item.name.toLowerCase().includes(lowercasedInput) ||
						item.key.toLowerCase().includes(lowercasedInput)
				),
			}));

		setFilteredData(filtered);
	}, [inputValue, data]);

	return (
		<>
			{filteredData.map(({ items, label }, index) => (
				<DropdownMenuGroup key={index}>
					<DropdownMenuLabel className="text-neutral-600 text-xs font-medium capitalize">
						{label}
					</DropdownMenuLabel>
					{items.map(({ key, name, icon }) => (
						<DropdownMenuFilteredItem
							key={key}
							key_action={key}
							name={name}
							icon={icon}
							label={label as ActionLabelType}
							editor={editor}
							onClose={onClose}
						/>
					))}
				</DropdownMenuGroup>
			))}
		</>
	);
};

const DropdownMenuAction = (props: DropdownMenuActionProps) => {
	const {
		open,
		setOpen,
		lockMenu,
		editor,
		onClose,
		trigger,
		align = "center",
		alignOffset = -35,
		side = "left",
		sideOffset = 25,
		fixPosition,
	} = props;
	const {
		toolbarState: { blockType, codeLanguage },
	} = useToolbarState();

	const {
		selectionState: { isSelectionManyBlock, isSelectionManyLineInListNode },
	} = useSelectionCustom();

	const [isFocusedInput, setIsFocusedInput] = useState(false);
	const [inputValueSearch, setInputValueSearch] = useState("");

	const inputSearchRef = React.useRef<HTMLInputElement>(null);
	const dropdownContentRef = React.useRef<HTMLDivElement>(null);

	const onBlockChange = useCallback(
		(blockName: string) => {
			handleBlockChange({
				editor,
				blockName,
				current_blockType: blockType,
				isSelectionManyBlock,
				isSelectionManyLineInListNode,
			});
			onClose?.();
		},
		[
			editor,
			blockType,
			isSelectionManyBlock,
			isSelectionManyLineInListNode,
			onClose,
		]
	);

	const onKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			const inputSearch = inputSearchRef.current;
			const dropdownContent = dropdownContentRef.current;

			function handleInputBlur() {
				if (!inputSearch || !dropdownContent) {
					return;
				}
				setIsFocusedInput(false);
				inputSearch.blur();
				dropdownContent.focus();
			}

			if (isFocusedInput) {
				const char = e.key.length === 1 ? e.key : "";
				if (e.key === "Backspace" || e.ctrlKey || e.metaKey) {
					return;
				}
				e.preventDefault();
				e.stopPropagation();
				if (
					e.key === "Escape" ||
					e.key === "ArrowDown" ||
					e.key === "ArrowUp" ||
					e.key === "Enter"
				) {
					handleInputBlur();
				} else if (char) {
					setInputValueSearch((prev) => prev + char);
				}
			}
		},
		[isFocusedInput]
	);

	useEffect(() => {
		if (!open) {
			setInputValueSearch("");
			setIsFocusedInput(false);
		}

		//set focus to input when open because the event was be override by selection change
		const cb = ({ x, y }: { x: number; y: number }) => {
			const rootElement = editor.getRootElement();
			const dropdownContent = dropdownContentRef.current;

			if (!rootElement || !dropdownContent) {
				return;
			}

			const GAP = 16;

			let maxX = Infinity;
			let maxY = Infinity;

			if (rootElement.parentElement) {
				const { right } = rootElement.parentElement.getBoundingClientRect();
				maxX = right - dropdownContent.clientWidth - GAP;
				maxY = window.innerHeight - dropdownContent.clientHeight - GAP;
			}

			x = Math.min(x, maxX);
			y = Math.min(y, maxY);

			if (dropdownContent) {
				if (dropdownContent.parentElement) {
					dropdownContent.parentElement.classList.add(
						"dropdown-portal-menu-action-wrapper"
					);
					dropdownContent.parentElement.style.setProperty(
						"--data-position-x",
						`${x}px`
					);
					dropdownContent.parentElement.style.setProperty(
						"--data-position-y",
						`${y}px`
					);
				}
			}
		};

		let timeout = null;
		if (open && fixPosition) {
			timeout = setTimeout(() => cb(fixPosition), 0);
		}

		return () => {
			if (timeout) {
				clearTimeout(timeout);
			}
		};
	}, [open, fixPosition, editor]);

	return (
		<DropdownMenu open={open} modal={false} onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild>
				{trigger ? trigger : <span />}
			</DropdownMenuTrigger>

			<DropdownMenuContent
				align={align}
				alignOffset={alignOffset}
				sideOffset={sideOffset}
				side={side}
				className="w-56 min-h-20 z-[9999] not-outside dropdown-content"
				onMouseMove={() => {
					lockMenu?.();
				}}
				onKeyDown={onKeyDown}
				ref={dropdownContentRef}
			>
				<div
					className="px-2 mt-2 mb-4"
					contentEditable={false}
					draggable={false}
				>
					<input
						className="outline-1 focus:outline-ring focus:ring-2 px-2 py-1 rounded-sm"
						value={inputValueSearch}
						onChange={(e) => setInputValueSearch(e.target.value)}
						onFocus={() => {
							setIsFocusedInput(true);
						}}
						onBlur={() => {
							setIsFocusedInput(false);
						}}
						type="text"
						placeholder="Search actions..."
						ref={inputSearchRef}
						autoFocus
						name={`${appName}-dropdown-input-search-action`}
					/>
				</div>
				{!inputValueSearch.trim().length ? (
					<>
						<DropdownMenuGroup>
							<DropdownMenuBlock onBlockChange={onBlockChange} />
							{blockType === "code" && (
								<DropdownMenuSub>
									<DropdownMenuSubTrigger className="ml-1 cursor-pointer">
										<div className="flex items-center gap-1">
											<Braces size={16} className="text-gray-500" />
											Language
										</div>
									</DropdownMenuSubTrigger>
									<DropdownMenuSubContent sideOffset={5} className="z-[10000]">
										{listLanguageCode.map(({ key, name }, index) => (
											<DropdownMenuItem
												key={index}
												className="flex justify-between capitalize cursor-pointer"
												onClick={(e) => {
													e.preventDefault();
													e.stopPropagation();
													formatCode(editor, blockType, codeLanguage, key);
													onClose?.();
												}}
											>
												{name}
												{codeLanguage === name && <Check />}
											</DropdownMenuItem>
										))}
									</DropdownMenuSubContent>
								</DropdownMenuSub>
							)}
						</DropdownMenuGroup>

						<DropdownMenuGroup>
							<DropdownMenuLabel className="text-neutral-600 text-xs font-medium capitalize">
								Actions
							</DropdownMenuLabel>
							<DropdownMenuItem
								onClick={() => onBlockChange("delete")}
								className="group ml-1 cursor-pointer"
							>
								<div className="flex items-center justify-between gap-1.5 w-full group-hover:text-destructive group-focus:text-destructive transition-colors">
									<div className="flex items-center flex-1 gap-1">
										<Trash className="hover:text-destructive" />
										Delete
									</div>
									<span className="text-gray-400">Del</span>
								</div>
							</DropdownMenuItem>
						</DropdownMenuGroup>
					</>
				) : (
					<DropdownMenuFiltered
						inputValue={inputValueSearch}
						editor={editor}
						onClose={onClose}
					/>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

function handleBlockChange({
	editor,
	blockName,
	current_blockType,
	isSelectionManyBlock,
	isSelectionManyLineInListNode,
}: {
	editor: LexicalEditor;
	blockName: string;
	current_blockType: string;
	isSelectionManyBlock: boolean;
	isSelectionManyLineInListNode: boolean;
}) {
	editor.update(() => {
		switch (blockName) {
			case "paragraph":
				formatParagraph(editor);
				break;
			case "h1":
				formatHeading(editor, current_blockType, "h1");
				break;
			case "h2":
				formatHeading(editor, current_blockType, "h2");
				break;
			case "h3":
				formatHeading(editor, current_blockType, "h3");
				break;
			case "ul":
				formatBulletList(
					editor,
					current_blockType,
					isSelectionManyBlock,
					isSelectionManyLineInListNode
				);
				break;
			case "ol":
				formatNumberedList(
					editor,
					current_blockType,
					isSelectionManyBlock,
					isSelectionManyLineInListNode
				);
				break;
			case "code":
				formatCode(editor, current_blockType, undefined, "javascript");
				break;
			case "quote":
				formatQuote(editor, current_blockType);
				break;
			case "delete":
				deleteBlock(editor);
				break;
			default:
				break;
		}
	});
}

export default DropdownMenuAction;
