"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useCallback, useEffect } from "react";
import { updateSelectionWithBlock } from "./draggable-plugin/utils";
import { $getSelection, $isRangeSelection } from "lexical";

const ClickOutSidePlugin = ({
	anchorElem,
	openningFloatingToolbar,
}: {
	anchorElem?: HTMLElement;
	openningFloatingToolbar: boolean;
}) => {
	const [editor] = useLexicalComposerContext();

	const blur = useCallback(
		(e: MouseEvent) => {
			if (typeof document === "undefined" || !anchorElem) {
				return;
			}

			const toolbarElement = document.querySelector(".toolbar");
			const editLinkElement = document.querySelector(".floating-edit-link");
			const notOutSideElems = document.querySelectorAll(".not-outside");

			editor.update(() => {
				const selection = $getSelection();
				if ($isRangeSelection(selection)) {
					const content = selection.getTextContent();
					if (content && !openningFloatingToolbar) {
						return;
					}
				}

				if (e.target instanceof Node) {
					if (toolbarElement && toolbarElement.contains(e.target)) {
						return;
					}

					if (editLinkElement && editLinkElement.contains(e.target)) {
						return;
					}

					let isOutSide = true;

					if (notOutSideElems.length > 0) {
						for (const node of notOutSideElems) {
							if (node.contains(e.target)) {
								isOutSide = false;
							}
						}
					}

					if (!isOutSide) {
						return;
					}

					if (!anchorElem.contains(e.target)) {
						console.log("mouse up outside plugin");
						const X = e.clientX;
						const Y = e.clientY;

						const root = editor.getRootElement();

						if (!root) {
							return;
						}
						const nodes = root.childNodes;
						let isRight = false;
						const nodeMaps = new Map<number, HTMLElement>();

						for (const node of nodes) {
							if (node instanceof HTMLElement) {
								const rect = node.getBoundingClientRect();
								let top = rect.top;
								nodeMaps.set(top, node);

								top += rect.height;
								nodeMaps.set(top, node);
								if (X > rect.left) {
									isRight = true;
								}
							}
						}

						let cursorBlock = nodes[0] as HTMLElement;
						let minTop = Infinity;
						nodeMaps.forEach((value, key) => {
							const abs = Math.abs(key - Y);
							if (minTop > abs) {
								cursorBlock = value;
								minTop = abs;
							}
						});

						updateSelectionWithBlock(
							editor,
							cursorBlock,
							isRight ? "end" : "start"
						);
					}
				}
			});
		},
		[editor, anchorElem, openningFloatingToolbar]
	);

	//event blur while toolbar is openning -> hide, or set pointer
	useEffect(() => {
		const element = document.body;

		element.addEventListener("mouseup", blur);

		return () => {
			element.removeEventListener("mouseup", blur);
		};
	}, [blur]);
	return null;
};

export default ClickOutSidePlugin;
