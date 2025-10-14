import {
	$createRangeSelection,
	$getNearestNodeFromDOMNode,
	$getSelection,
	$isRangeSelection,
	$setSelection,
	COMMAND_PRIORITY_LOW,
	DRAGOVER_COMMAND,
	DRAGSTART_COMMAND,
	DROP_COMMAND,
	FORMAT_TEXT_COMMAND,
	getDOMSelection,
	LexicalEditor,
	SELECTION_CHANGE_COMMAND,
	TextFormatType,
} from "lexical";
import React, {
	Dispatch,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { setFloatingElemPosition } from "./utils";
import { mergeRegister } from "@lexical/utils";
import { $isCodeNode } from "@lexical/code";
import { getDOMRangeRect } from "../../utils/get-dom-range-rect";
import {
	blockTypeToBlockName,
	useToolbarState,
} from "@/contexts/toolbar-context";
import { createPortal } from "react-dom";
import { getTranslate } from "../draggable-plugin/utils";
import { Button } from "@/components/ui/button";
import {
	Bold,
	CaseLower,
	CaseSensitive,
	CaseUpper,
	ChevronDown,
	Code,
	Ellipsis,
	Italic,
	Link,
	Strikethrough,
	Underline,
} from "lucide-react";
import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip";
import { TooltipContent } from "@radix-ui/react-tooltip";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	deleteBlock,
	formatBulletList,
	formatCode,
	formatHeading,
	formatNumberedList,
	formatParagraph,
	formatQuote,
} from "../toolbar-plugin/utils";
import MyOverlay from "@/components/overlay";
import DropdownMenuBlock from "../../components/dropdown-menu-block";
import { Separator } from "@/components/ui/separator";
import DropdownMenuAction from "../draggable-plugin/components/dropdown-menu-action";
import { useSelectionCustom } from "@/contexts/selection-custom-context";
import {
	setFocusCaretSelectionWithNearestNodeFromCursorBlock,
	setFocusCaretSelectionWithParent,
} from "../../utils/set-selection";
import { useFloatingToolbar } from "@/contexts/floating-toolbar-context";
import lodash from "lodash";
import { $isImageNode } from "@/editor/nodes/image-node";

const FloatingToolbar = ({
	anchorElem,
	editor,
	setIsEditLink,
}: {
	anchorElem?: HTMLElement;
	editor: LexicalEditor;
	isEditLink: boolean;
	setIsEditLink: Dispatch<boolean>;
}) => {
	const floatingToolbarRef = useRef<HTMLDivElement | null>(null);

	const {
		toolbarState: {
			isLink,
			isBold,
			isCode,
			isItalic,
			isStrikethrough,
			isUnderline,
			isLowercase,
			isUppercase,
			isCapitalize,
			blockType,
			isImageNode,
		},
	} = useToolbarState();

	const {
		selectionState: { isSelectionManyBlock, isSelectionManyLineInListNode },
	} = useSelectionCustom();

	const {
		floatingToolbarState: { canShow, openningFloatingToolbar },
		updateFloatingToolbarState,
		onRef,
	} = useFloatingToolbar();

	const setHideToolbar = useCallback(() => {
		updateFloatingToolbarState("canShow", false);
		updateFloatingToolbarState("isSelectionHasTextContent", false);
	}, [updateFloatingToolbarState]);

	const [openMenuBlock, setOpenMenuBlock] = useState(false);
	const [openMenuAction, setOpenMenuAction] = useState(false);
	const [cursorBlock, setCursorBlock] = useState<HTMLElement | undefined>();

	const $updateFloatingToolbar = useCallback(() => {
		if (!anchorElem) {
			return;
		}
		const floatingToolbar = floatingToolbarRef.current;

		if (!floatingToolbar) {
			return;
		}

		const selection = $getSelection();

		if ($isRangeSelection(selection)) {
			const node = selection.anchor.getNode();
			const parent = node.getParent();

			if ($isCodeNode(node) || $isCodeNode(parent)) {
				hideFloatingToolbar(floatingToolbar);
				setHideToolbar();
				return;
			}

			const nativeSelection = getDOMSelection(editor._window);
			const content = selection.getTextContent();

			if (content) {
				const rect = getDOMRangeRect({
					nativeSelection,
					rootElement: anchorElem,
				}) as DOMRect;

				setFloatingElemPosition(rect, floatingToolbar, anchorElem, isLink);
				updateFloatingToolbarState("isSelectionHasTextContent", true);
			} else {
				setHideToolbar();
				hideFloatingToolbar(floatingToolbar);
			}
		} else {
			setHideToolbar();
		}
	}, [editor, anchorElem, isLink, setHideToolbar, updateFloatingToolbarState]);

	useEffect(() => {
		return mergeRegister(
			editor.registerUpdateListener(({ editorState }) => {
				editorState.read(
					() => {
						$updateFloatingToolbar();
					},
					{ editor }
				);
			}),
			editor.registerCommand(
				SELECTION_CHANGE_COMMAND,
				() => {
					$updateFloatingToolbar();
					return false;
				},
				COMMAND_PRIORITY_LOW
			)
		);
	}, [editor, $updateFloatingToolbar]);

	//fixed floating toolbar
	useEffect(() => {
		const floatingToolbar = floatingToolbarRef.current;

		if (!floatingToolbar || !anchorElem) {
			return;
		}

		const rect = floatingToolbar.getBoundingClientRect();
		const originalTop = rect.top + window.scrollY;
		const { x, y } = getTranslate(floatingToolbar);
		const GAP = 15;

		const fixed = () => {
			floatingToolbar.style.position = "fixed";
			floatingToolbar.style.top = `${GAP}px`;
			floatingToolbar.style.left = `${rect.x}px`;
			floatingToolbar.style.transform = `translate(0px, 0px)`;
		};

		const absolute = () => {
			floatingToolbar.style.position = "absolute";
			floatingToolbar.style.top = `0px`;
			floatingToolbar.style.left = `0px`;
			floatingToolbar.style.transform = `translate(${x}px, ${y}px)`;
		};

		const update = () => {
			const scrollY = window.scrollY;
			if (scrollY + GAP >= originalTop) {
				fixed();
			} else {
				absolute();
			}
		};

		if (openningFloatingToolbar) {
			window.addEventListener("scroll", update);
		} else {
			window.removeEventListener("scroll", update);
			absolute();
		}

		return () => {
			window.removeEventListener("scroll", update);
		};
	}, [canShow, openningFloatingToolbar, anchorElem]);

	const hideFloatingToolbar = (floatingToolbar: HTMLElement) => {
		floatingToolbar.style.opacity = "0";
		floatingToolbar.style.transform = `translate(-10000px, -10000px)`;
	};

	function onBlockChange(blockName: string) {
		if (!editor) {
			return;
		}

		editor.update(() => {
			switch (blockName) {
				case "paragraph":
					formatParagraph(editor);
					break;
				case "h1":
					formatHeading(editor, blockType, "h1");
					break;
				case "h2":
					formatHeading(editor, blockType, "h2");
					break;
				case "h3":
					formatHeading(editor, blockType, "h3");
					break;
				case "ul":
					formatBulletList(
						editor,
						blockType,
						isSelectionManyBlock,
						isSelectionManyLineInListNode
					);
					break;
				case "ol":
					formatNumberedList(
						editor,
						blockType,
						isSelectionManyBlock,
						isSelectionManyLineInListNode
					);
					break;
				case "code":
					formatCode(editor, blockType);
					break;
				case "quote":
					formatQuote(editor, blockType);
					break;
				case "delete":
					deleteBlock(editor);
					break;
				default:
					break;
			}
			if (!isSelectionManyLineInListNode) {
				setFocusCaretSelectionWithParent(editor, "end", true);
			}
			setHideToolbar();
		});
	}

	const buttons = [
		{
			key: "bold",
			icon: Bold,
			active: isBold,
			title: "Bold",
		},
		{
			key: "italic",
			icon: Italic,
			active: isItalic,
			title: "Italic",
		},
		{
			key: "code",
			icon: Code,
			active: isCode,
			title: "Insert Code Block",
		},
		{
			key: "underline",
			icon: Underline,
			active: isUnderline,
			title: "Underline",
		},
		{
			key: "strikethrough",
			icon: Strikethrough,
			active: isStrikethrough,
			title: "Strikethrough",
		},
		{
			key: "lowercase",
			icon: CaseLower,
			active: isLowercase,
			title: "Lowercase",
		},
		{
			key: "uppercase",
			icon: CaseUpper,
			active: isUppercase,
			title: "Uppercase",
		},
		{
			key: "capitalize",
			icon: CaseSensitive,
			active: isCapitalize,
			title: "Capitalize",
		},
		{
			key: "insertLink",
			icon: Link,
			active: isLink,
			title: "Insert Link",
		},
	];

	function handleShowMenuAction() {
		editor.update(() => {
			const selection = $getSelection();
			if ($isRangeSelection(selection)) {
				const node = selection.anchor.getNode();
				if (node) {
					const dom = editor.getElementByKey(node.getKey());
					if (dom) {
						setCursorBlock(dom);
					}
				}
			}
		});
		setOpenMenuAction(true);
		setHideToolbar();
	}

	return (
		<>
			{openMenuBlock && <MyOverlay onClick={() => setOpenMenuBlock(false)} />}
			{openMenuAction && <MyOverlay onClick={() => setOpenMenuAction(false)} />}
			<div
				className={`opacity-0 z-[9997] absolute top-0 left-0 rounded-md bg-transparent ${
					openningFloatingToolbar
						? "shadow-[0_5px_10px_#0000004d]"
						: "cursor-none pointer-events-none"
				}`}
				ref={(val) => {
					floatingToolbarRef.current = val;
					onRef(val);
				}}
				onMouseDown={(e) => {
					e.preventDefault();
				}}
			>
				<div
					className={`${
						openningFloatingToolbar
							? "opacity-100 bg-white rounded-md shadow-2xl flex items-center gap-1 w-full"
							: "opacity-0"
					} p-1`}
				>
					{/* menu block */}
					{openningFloatingToolbar && !isSelectionManyBlock && !isImageNode && (
						<Tooltip delayDuration={500} disableHoverableContent>
							<TooltipTrigger asChild>
								<div className="not-outside flex items-center justify-center">
									<DropdownMenu
										open={openMenuBlock}
										modal={false}
										onOpenChange={setOpenMenuBlock}
									>
										<DropdownMenuTrigger asChild>
											<Button
												size={"sm"}
												variant={"ghost"}
												className="font-normal capitalize"
											>
												{blockTypeToBlockName[blockType]} <ChevronDown />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent
											align="center"
											side="right"
											className="w-56 min-h-20 z-[9999] not-outside"
										>
											<DropdownMenuBlock onBlockChange={onBlockChange} />
										</DropdownMenuContent>
									</DropdownMenu>
									<Separator
										orientation="vertical"
										style={{
											height: 24,
										}}
										className="mx-2"
									/>
								</div>
							</TooltipTrigger>
							{!openMenuBlock && (
								<TooltipContent
									align="center"
									side="top"
									sideOffset={10}
									className="bg-neutral-700 rounded-md text-white  p-2 text-sm"
								>
									Block
								</TooltipContent>
							)}
						</Tooltip>
					)}

					{buttons.map(({ key, icon: Icon, active, title }, index) => (
						<Tooltip key={index} delayDuration={500} disableHoverableContent>
							<TooltipTrigger asChild>
								{key === "insertLink" && isImageNode ? null : (
									<Button
										key={index}
										variant={"ghost"}
										onClick={() => {
											if (key === "insertLink") {
												if (isLink) {
													editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
													setIsEditLink(false);
												} else {
													editor.dispatchCommand(
														TOGGLE_LINK_COMMAND,
														"https://"
													);
													setIsEditLink(true);
												}
												return;
											}

											editor.dispatchCommand(
												FORMAT_TEXT_COMMAND,
												key as TextFormatType
											);
										}}
										className={`${
											active && "shadow bg-gray-200 hover:bg-gray-300"
										}`}
									>
										<Icon />
									</Button>
								)}
							</TooltipTrigger>
							<TooltipContent
								align="center"
								side="top"
								sideOffset={10}
								className="bg-neutral-700 rounded-md text-white  p-2 text-sm"
							>
								<div className="">{title}</div>
							</TooltipContent>
						</Tooltip>
					))}

					{/* menu action */}
					{!isSelectionManyBlock && !isImageNode && (
						<>
							{openningFloatingToolbar && (
								<Separator
									orientation="vertical"
									style={{
										height: 24,
									}}
									className="mx-2"
								/>
							)}
							<Button
								variant={"ghost"}
								className="text-gray-500"
								onClick={handleShowMenuAction}
							>
								<Ellipsis />
							</Button>
							<DropdownMenuAction
								open={openMenuAction}
								setOpen={(val) => {
									setOpenMenuAction(val);
								}}
								editor={editor}
								onClose={() => {
									setOpenMenuAction(false);
									setCursorBlock(undefined);
									setFocusCaretSelectionWithNearestNodeFromCursorBlock(
										editor,
										cursorBlock,
										"end"
									);
								}}
								side="right"
							/>
						</>
					)}
				</div>
			</div>
		</>
	);
};

const FloatingToolbarPlugin = ({
	anchorElem = document.body,
	isEditLink,
	setIsEditLink,
	editor,
}: {
	anchorElem?: HTMLElement;
	isEditLink: boolean;
	setIsEditLink: Dispatch<boolean>;
	editor: LexicalEditor;
}) => {
	const {
		floatingToolbarState: { isSelectionHasTextContent, canShow },
		updateFloatingToolbarState,
	} = useFloatingToolbar();

	const debounceShowFloatingToolbar = React.useRef(
		lodash.debounce(() => {
			updateFloatingToolbarState("openningFloatingToolbar", true);
		}, 200)
	).current;

	useEffect(() => {
		if (!anchorElem) {
			return;
		}

		const element = document.body;

		const mouseUp = () => {
			if (!canShow && !isEditLink) {
				updateFloatingToolbarState("canShow", true);
			}
		};

		if (canShow && isSelectionHasTextContent) {
			debounceShowFloatingToolbar();
		} else {
			updateFloatingToolbarState("openningFloatingToolbar", false);
		}

		const keyup = (e: KeyboardEvent) => {
			if (e.ctrlKey && e.key === "a") {
				updateFloatingToolbarState("canShow", true);
			}
		};

		element.addEventListener("keyup", keyup);

		if (isSelectionHasTextContent) {
			element.addEventListener("mouseup", mouseUp);
		} else {
			element.removeEventListener("mouseup", mouseUp);
		}

		return () => {
			element.removeEventListener("mouseup", mouseUp);
			element.removeEventListener("keyup", keyup);
		};
	}, [
		canShow,
		isSelectionHasTextContent,
		anchorElem,
		isEditLink,
		updateFloatingToolbarState,
		debounceShowFloatingToolbar,
	]);

	function $onDragStart() {
		const selection = $getSelection();
		if ($isRangeSelection(selection)) {
			const textContent = selection.getTextContent();
			if (textContent) {
				return true;
			}
		}
		return false;
	}

	function $onDragOver(e: DragEvent) {
		//Do some thing here

		if (!canDrop(e)) {
			e.preventDefault();
		}

		return false;
	}

	function $onDrop(e: DragEvent) {
		const selection = $getSelection();
		if ($isRangeSelection(selection)) {
			const node = selection.anchor.getNode();

			if ($isCodeNode(node) || $isCodeNode(node.getParent())) {
				return false;
			}

			const textContent = selection.getTextContent();
			if (textContent) {
				const range = getDragSelection(e);
				if (range !== null && e.dataTransfer && canDrop(e)) {
					selection.removeText();
					const rangeSelection = $createRangeSelection();
					rangeSelection.applyDOMRange(range);
					$setSelection(rangeSelection);
					rangeSelection.insertText(
						e.dataTransfer?.getData("text/plain") || ""
					);
				}

				return true;
			}
		}
		return false;
	}

	useEffect(() => {
		if (!editor) {
			return;
		}

		return mergeRegister(
			editor.registerCommand(
				DRAGSTART_COMMAND,
				$onDragStart,
				COMMAND_PRIORITY_LOW
			),

			editor.registerCommand(
				DRAGOVER_COMMAND,
				$onDragOver,
				COMMAND_PRIORITY_LOW
			),

			editor.registerCommand(DROP_COMMAND, $onDrop, COMMAND_PRIORITY_LOW)
		);
	}, [editor]);

	useEffect(() => {
		if (isEditLink) {
			updateFloatingToolbarState("canShow", false);
		} else {
			updateFloatingToolbarState("canShow", true);
		}
	}, [updateFloatingToolbarState, isEditLink]);

	return createPortal(
		<FloatingToolbar
			anchorElem={anchorElem}
			editor={editor}
			isEditLink={isEditLink}
			setIsEditLink={setIsEditLink}
		/>,
		anchorElem as HTMLElement
	);
};

const getDragSelection = (e: DragEvent) => {
	const caretPostion = document.caretPositionFromPoint(e.clientX, e.clientY);

	if (caretPostion) {
		const { offsetNode, offset } = caretPostion;
		const range = document.createRange();
		range.setStart(offsetNode, offset);
		range.setEnd(offsetNode, offset);
		return range;
	}

	return null;
};

function canDrop(e: DragEvent) {
	if (e.target instanceof Node) {
		const node = $getNearestNodeFromDOMNode(e.target);

		if (!node || $isImageNode(node)) {
			return false;
		}
	}

	return true;
}

export default FloatingToolbarPlugin;
