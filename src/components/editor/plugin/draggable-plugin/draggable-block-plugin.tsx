"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { DraggableBlockPlugin_EXPERIMENTAL } from "@lexical/react/LexicalDraggableBlockPlugin";
import { $createParagraphNode, $getNearestNodeFromDOMNode } from "lexical";
import { Dispatch, useCallback, useRef, useState } from "react";

import { GripVertical, Plus } from "lucide-react";
import DropdownMenuAction from "@/components/editor/plugin/draggable-plugin/dropdown-menu-action";
import { getTranslate, updateSelectionWithBlock } from "./utils";
import MyOverlay from "@/components/overlay";

// const DRAGGABLE_BLOCK_MENU_CLASSNAME = "draggable-block-menu";

export default function DraggableBlockPlugin({
	anchorElem = document.body,
	openMenuDrag,
	setOpenMenuDrag,
}: {
	anchorElem?: HTMLElement;
	openMenuDrag: boolean;
	setOpenMenuDrag: Dispatch<boolean>;
}) {
	const [editor] = useLexicalComposerContext();
	const menuRef = useRef<HTMLDivElement>(null);
	const targetLineRef = useRef<HTMLDivElement>(null);
	const [draggableElement, setDraggableElement] = useState<HTMLElement | null>(
		null
	);
	const [positionMenu, setPositionMenu] = useState({ x: 0, y: 0 });

	const [cursorBlock, setCursorBlock] = useState<HTMLElement | null>();
	const lockOpenRef = useRef(false);

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

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function isOnMenu(_element: HTMLElement): boolean {
		if (openMenuDrag) {
			lockMenu();
		}

		return !!openMenuDrag;
	}

	function lockMenu() {
		if (menuRef.current) {
			menuRef.current.style.opacity = "1";
			menuRef.current.style.transform = `translate(${positionMenu.x}px, ${positionMenu.y}px)`;
		}
	}

	function hideMenuDrag() {
		if (menuRef.current) {
			menuRef.current.style.opacity = "0";
		}
	}

	function showMenuAction() {
		if (!menuRef.current) {
			return;
		}

		const pos = getTranslate(menuRef.current);
		setPositionMenu(pos);
		setCursorBlock(draggableElement);
		setOpenMenuDrag(!openMenuDrag);
		lockOpenRef.current = !openMenuDrag;
	}

	const hideMenu = useCallback(() => {
		lockOpenRef.current = false;
		setOpenMenuDrag(false);
		updateSelectionWithBlock(editor, cursorBlock);
		setCursorBlock(null);
	}, [setOpenMenuDrag, cursorBlock, editor]);

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
					onClick={hideMenu}
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
							onMouseDown={() => {
								setCursorBlock(draggableElement);
								updateSelectionWithBlock(editor, draggableElement);
							}}
						>
							<Plus size={20} />
						</button>
						<button
							className={`icon ${openMenuDrag ? "bg-[#d4d4d4]" : ""}`}
							onClick={showMenuAction}
							onMouseDown={() => {
								setCursorBlock(draggableElement);
								updateSelectionWithBlock(editor, draggableElement);
							}}
						>
							<GripVertical size={20} />
						</button>
						<DropdownMenuAction
							open={openMenuDrag}
							setOpen={() => {
								if (lockOpenRef.current) {
									setOpenMenuDrag(true);
								} else {
									hideMenu();
								}
							}}
							lockMenu={lockMenu}
							cursorBlock={cursorBlock}
							editor={editor}
							onClose={() => {
								hideMenu();
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
