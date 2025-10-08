"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { DraggableBlockPlugin_EXPERIMENTAL } from "@lexical/react/LexicalDraggableBlockPlugin";
import {
	$createParagraphNode,
	$getNearestNodeFromDOMNode,
	$getPreviousSelection,
	$getSelection,
	$isRangeSelection,
	$setSelection,
} from "lexical";
import { Dispatch, useCallback, useEffect, useRef, useState } from "react";
import { GripVertical, Plus } from "lucide-react";
import DropdownMenuAction from "@/editor/plugin/draggable-plugin/dropdown-menu-action";
import { getBlockFromCursorBlock, getTranslate } from "./utils";
import MyOverlay from "@/components/overlay";
import { setFocusCaretSelectionWithNearestNodeFromCursorBlock } from "../../utils/set-selection";
import { useSelectionCustom } from "@/contexts/selection-custom-context";
import { useFloatingToolbar } from "@/contexts/floating-toolbar-context";

// const DRAGGABLE_BLOCK_MENU_CLASSNAME = "draggable-block-menu";

function DraggableBlock({
	anchorElem = document.body,
	openMenuDrag,
	setOpenMenuDrag,
}: {
	anchorElem?: HTMLElement;
	openMenuDrag: boolean;
	setOpenMenuDrag: Dispatch<boolean>;
	openningFloatingToolbar: boolean;
}) {
	const [editor] = useLexicalComposerContext();
	const {
		selectionState: { isSelectionManyBlock },
	} = useSelectionCustom();

	const { updateFloatingToolbarState } = useFloatingToolbar();

	const menuRef = useRef<HTMLDivElement>(null);
	const targetLineRef = useRef<HTMLDivElement>(null);
	const [draggableElement, setDraggableElement] = useState<HTMLElement | null>(
		null
	);
	const [positionMenu, setPositionMenu] = useState({ x: 0, y: 0 });
	const [cursorBlock, setCursorBlock] = useState<HTMLElement | null>();
	const lockOpenRef = useRef(false);

	useEffect(() => {
		const scroll = (e: Event) => {
			console.log(e);
		};

		document.addEventListener("", scroll);

		return () => document.removeEventListener("scroll", scroll);
	}, [editor]);

	const setHideMenu = useCallback(() => {
		lockOpenRef.current = false;
		setOpenMenuDrag(false);
		setCursorBlock(null);
	}, [setOpenMenuDrag]);

	function hideMenuDrag() {
		if (menuRef.current) {
			menuRef.current.style.opacity = "0";
		}
	}

	function insertBlock(e: React.MouseEvent) {
		if (!draggableElement || !editor) {
			return;
		}

		editor.update(() => {
			const node = $getNearestNodeFromDOMNode(draggableElement);
			if (!node) {
				return;
			}

			const pNode = $createParagraphNode();
			if (e.altKey || e.ctrlKey) {
				node.insertBefore(pNode);
			} else {
				node.insertAfter(pNode);
			}
			pNode.select();
		});
	}

	function lockMenu() {
		if (menuRef.current) {
			menuRef.current.style.opacity = "1";
			menuRef.current.style.transform = `translate(${positionMenu.x}px, ${positionMenu.y}px)`;
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function isOnMenu(_element: HTMLElement): boolean {
		if (openMenuDrag) {
			lockMenu();
		}

		return !!openMenuDrag;
	}

	function showMenuAction() {
		if (!menuRef.current) {
			return;
		}

		const pos = getTranslate(menuRef.current);
		setPositionMenu(pos);
		setOpenMenuDrag(!openMenuDrag);
		lockOpenRef.current = !openMenuDrag;
	}

	function updateLastSelection() {
		editor.update(() => {
			const prev = $getPreviousSelection();
			if ($isRangeSelection(prev)) {
				const clone = prev.clone();
				const textContent = clone.getTextContent();
				if (textContent) {
					$setSelection(clone);
				}
			}
		});
	}

	function handleMouseDown() {
		setCursorBlock(draggableElement);
		updateFloatingToolbarState("openningFloatingToolbar", false);
		if (isSelectionManyBlock) {
			editor.update(() => {
				const selection = $getSelection();
				if ($isRangeSelection(selection)) {
					const nodes = selection.getNodes();
					const block = getBlockFromCursorBlock(editor, draggableElement);

					if (!block) {
						return;
					}

					const isCursorBlockSelection = nodes
						.map((node) => node.getKey())
						.includes(block.getKey());

					if (!isCursorBlockSelection) {
						block.selectEnd();
					}
				}
			});
		}

		if (!isSelectionManyBlock) {
			setFocusCaretSelectionWithNearestNodeFromCursorBlock(
				editor,
				draggableElement
			);
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const hanldeOpenMenu = () => {
		if (lockOpenRef.current) {
			setOpenMenuDrag(true);
		} else {
			setHideMenu();
		}
	};

	return (
		<>
			{openMenuDrag && (
				<MyOverlay
					onMouseEnter={(e) => {
						e.stopPropagation();
					}}
					onMouseMove={(e) => {
						lockMenu();
						e.stopPropagation();
					}}
					onClick={() => {
						setHideMenu();
						updateLastSelection();

						if (!isSelectionManyBlock) {
							setFocusCaretSelectionWithNearestNodeFromCursorBlock(
								editor,
								draggableElement
							);
						}
					}}
				/>
			)}

			<DraggableBlockPlugin_EXPERIMENTAL
				anchorElem={anchorElem}
				menuRef={menuRef}
				targetLineRef={targetLineRef}
				menuComponent={
					<div ref={menuRef} className="draggable-block-menu">
						<button
							title="Click to add below"
							className="icon icon-plus"
							onClick={insertBlock}
							onMouseDown={handleMouseDown}
						>
							<Plus size={20} />
						</button>
						<button
							className={`icon ${openMenuDrag ? "bg-[#d4d4d4]" : ""}`}
							onClick={showMenuAction}
							onMouseDown={handleMouseDown}
						>
							<GripVertical size={20} />
						</button>
						<DropdownMenuAction
							open={openMenuDrag}
							setOpen={setOpenMenuDrag}
							lockMenu={lockMenu}
							cursorBlock={cursorBlock}
							editor={editor}
							onClose={() => {
								setHideMenu();
								hideMenuDrag();
							}}
						/>
					</div>
				}
				targetLineComponent={
					<div ref={targetLineRef} className="draggable-block-target-line" />
				}
				isOnMenu={isOnMenu}
				onElementChanged={(e) => {
					setDraggableElement(e);
				}}
			/>
		</>
	);
}

export default function DraggableBlockPlugin({
	anchorElem = document.body,
	openMenuDrag,
	setOpenMenuDrag,
}: {
	anchorElem?: HTMLElement;
	openMenuDrag: boolean;
	setOpenMenuDrag: Dispatch<boolean>;
}) {
	const {
		selectionState: { isSelectionManyBlock },
	} = useSelectionCustom();
	const {
		floatingToolbarState: { openningFloatingToolbar },
	} = useFloatingToolbar();

	if (openningFloatingToolbar && !isSelectionManyBlock) {
		return null;
	}

	return (
		<DraggableBlock
			anchorElem={anchorElem}
			openMenuDrag={openMenuDrag}
			setOpenMenuDrag={setOpenMenuDrag}
			openningFloatingToolbar={openningFloatingToolbar}
		/>
	);
}
