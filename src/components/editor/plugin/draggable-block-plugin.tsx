"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { DraggableBlockPlugin_EXPERIMENTAL } from "@lexical/react/LexicalDraggableBlockPlugin";
import { $createParagraphNode, $getNearestNodeFromDOMNode } from "lexical";
import { useEffect, useRef, useState } from "react";
import ToolbarPlugin from "./toolbar-plugin";

const DRAGGABLE_BLOCK_MENU_CLASSNAME = "draggable-block-menu";

function isOnMenu(element: HTMLElement): boolean {
	return !!element.closest(`.${DRAGGABLE_BLOCK_MENU_CLASSNAME}`);
}

export default function DraggableBlockPlugin({
	anchorElem = document.body,
}: {
	anchorElem?: HTMLElement;
}) {
	const [editor] = useLexicalComposerContext();
	const menuRef = useRef<HTMLDivElement>(null);
	const targetLineRef = useRef<HTMLDivElement>(null);
	const [draggableElement, setDraggableElement] = useState<HTMLElement | null>(
		null
	);
	const [showToolbar, setShowToolbar] = useState(false);

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

	return (
		<>
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
						>
							+
						</button>
						<div
							className="icon"
							onClick={(e) => {
								setShowToolbar(!showToolbar);
								console.log(e);
								console.log(e.currentTarget.offsetLeft);
								console.log(e.currentTarget.offsetTop);
							}}
						>
							keo
						</div>
					</div>
				}
				targetLineComponent={
					<div ref={targetLineRef} className="draggable-block-target-line" />
				}
				isOnMenu={isOnMenu}
				onElementChanged={setDraggableElement}
			/>
			{
				<ToolbarPlugin
					showToolbar={showToolbar}
					setShowToolbar={setShowToolbar}
				/>
			}
		</>
	);
}
