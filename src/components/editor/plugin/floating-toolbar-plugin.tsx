import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$getSelection,
	$isElementNode,
	$isLineBreakNode,
	$isRangeSelection,
	COMMAND_PRIORITY_LOW,
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
import { setFloatingElemPosition } from "../utils/set-floating-toolbar";
import { mergeRegister } from "@lexical/utils";
import { $isCodeNode } from "@lexical/code";
import { getDOMRangeRect } from "../utils/get-dom-range-rect";
import {
	blockTypeToBlockName,
	useToolbarState,
} from "@/contexts/toolbar-context";
import { createPortal } from "react-dom";
import { getTranslate } from "./draggable-plugin/utils";
import { Button } from "@/components/ui/button";
import {
	Bold,
	CaseLower,
	CaseSensitive,
	CaseUpper,
	ChevronDown,
	Code,
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
} from "./toolbar-plugin/utils";
import MyOverlay from "@/components/overlay";
import DropdownMenuBlock from "../dropdown-menu-block";
import { Separator } from "@/components/ui/separator";

const FloatingToolbar = ({
	anchorElem,
	editor,
	canShow,
	setCanShow,
	showWithContent,
	setShowWithContent,
	setIsEditLink,
}: {
	anchorElem?: HTMLElement;
	editor: LexicalEditor;
	canShow: boolean;
	setCanShow: Dispatch<boolean>;
	showWithContent: boolean;
	setShowWithContent: Dispatch<boolean>;
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
		},
	} = useToolbarState();

	const [openMenuBlock, setOpenMenuBlock] = useState(false);
	const [isSelectionManyBlock, setIsSelectionManyBlock] = useState(false);

	const setHideToolbar = useCallback(() => {
		setCanShow(false);
		setShowWithContent(false);
	}, [setCanShow, setShowWithContent]);

	const $updateFloatingToolbar = useCallback(() => {
		if (!anchorElem) {
			return;
		}

		const selection = $getSelection();

		if ($isRangeSelection(selection)) {
			const node = selection.anchor.getNode();
			const parent = node.getParent();

			const unionNode = new Set();

			selection.getNodes().forEach((node) => {
				if ($isElementNode(node)) {
					const block = node.getTopLevelElementOrThrow();
					unionNode.add(block);
				}
			});

			if (unionNode.size > 1) {
				setIsSelectionManyBlock(true);
			} else {
				setIsSelectionManyBlock(false);
			}

			const floatingToolbar = floatingToolbarRef.current;

			if (!floatingToolbar) {
				return;
			}

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
				setShowWithContent(true);
			} else {
				setHideToolbar();
				hideFloatingToolbar(floatingToolbar);
			}
		} else {
			setHideToolbar();
		}
	}, [editor, anchorElem, isLink, setHideToolbar, setShowWithContent]);

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

	///fixed floating toolbar
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

		const openning = canShow && showWithContent;

		if (openning) {
			window.addEventListener("scroll", update);
		} else {
			window.removeEventListener("scroll", update);
			absolute();
		}

		return () => {
			window.removeEventListener("scroll", update);
		};
	}, [canShow, showWithContent, anchorElem]);

	const hideFloatingToolbar = (floatingToolbar: HTMLElement) => {
		floatingToolbar.style.opacity = "0";
		floatingToolbar.style.transform = `translate(-10000px, -10000px)`;
	};

	function onBlockChange(blockName: string) {
		if (!editor) {
			return;
		}

		editor.update(() => {
			const selection = $getSelection();
			if ($isRangeSelection(selection)) {
				const textContent = selection.getTextContent();

				if (textContent) {
					const node = selection.anchor.getNode();
					const parent = node.getParent();
					if (parent) {
						parent.selectEnd();
					}
				}
			}

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
					formatBulletList(editor, blockType);
					break;
				case "ol":
					formatNumberedList(editor, blockType);
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

	const openning = canShow && showWithContent;

	return (
		<>
			{openMenuBlock && <MyOverlay onClick={() => setOpenMenuBlock(false)} />}
			<div
				className={`${
					canShow ? "" : "cursor-none pointer-events-none"
				} opacity-0 z-[9997] absolute top-0 left-0 rounded-md bg-transparent ${
					openning ? "shadow-[0_5px_10px_#0000004d]" : ""
				}`}
				ref={floatingToolbarRef}
				onMouseDown={(e) => {
					e.preventDefault();
				}}
			>
				<div
					className={`${
						openning
							? "opacity-100 bg-white rounded-md shadow-2xl flex items-center gap-1 w-full"
							: "opacity-0"
					} p-1`}
				>
					{openning && !isSelectionManyBlock && (
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
								<Button
									key={index}
									variant={"ghost"}
									onClick={() => {
										if (key === "insertLink") {
											if (isLink) {
												editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
												setIsEditLink(false);
											} else {
												editor.dispatchCommand(TOGGLE_LINK_COMMAND, "https://");
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
				</div>
			</div>
		</>
	);
};

const useFloatingToolbar = ({
	anchorElem,
	setOpenningFloatingToolbar,
	isEditLink,
	setIsEditLink,
}: {
	anchorElem?: HTMLElement;
	setOpenningFloatingToolbar: Dispatch<boolean>;
	isEditLink: boolean;
	setIsEditLink: Dispatch<boolean>;
}) => {
	const [editor] = useLexicalComposerContext();
	const [canShow, setCanShow] = useState(false);
	const [showWithContent, setShowWithContent] = useState(false);

	//selection when pointer was be outsite
	useEffect(() => {
		if (!anchorElem) {
			return;
		}

		const element = document.body;

		const mouseUp = () => {
			if (!canShow && !isEditLink) {
				setCanShow(true);
			}
		};

		setOpenningFloatingToolbar(canShow && showWithContent);

		const keyup = (e: KeyboardEvent) => {
			if (e.ctrlKey && e.key === "a") {
				setCanShow(true);
			}
		};

		element.addEventListener("keyup", keyup);

		if (showWithContent) {
			element.addEventListener("mouseup", mouseUp);
		} else {
			element.removeEventListener("mouseup", mouseUp);
		}

		return () => {
			element.removeEventListener("mouseup", mouseUp);
			element.removeEventListener("keyup", keyup);
		};
	}, [
		editor,
		canShow,
		showWithContent,
		anchorElem,
		setOpenningFloatingToolbar,
		isEditLink,
	]);

	//
	useEffect(() => {
		if (isEditLink) {
			setCanShow(false);
		} else {
			setCanShow(true);
		}
	}, [isEditLink]);

	return createPortal(
		<FloatingToolbar
			anchorElem={anchorElem}
			editor={editor}
			canShow={canShow}
			setCanShow={setCanShow}
			setShowWithContent={setShowWithContent}
			showWithContent={showWithContent}
			isEditLink={isEditLink}
			setIsEditLink={setIsEditLink}
		/>,
		anchorElem as HTMLElement
	);
};

const FloatingToolbarPlugin = ({
	anchorElem,
	setOpenningFloatingToolbar,
	isEditLink,
	setIsEditLink,
}: {
	anchorElem?: HTMLElement;
	setOpenningFloatingToolbar: Dispatch<boolean>;
	isEditLink: boolean;
	setIsEditLink: Dispatch<boolean>;
}) => {
	return useFloatingToolbar({
		anchorElem,
		setOpenningFloatingToolbar,
		isEditLink,
		setIsEditLink,
	});
};

export default FloatingToolbarPlugin;
