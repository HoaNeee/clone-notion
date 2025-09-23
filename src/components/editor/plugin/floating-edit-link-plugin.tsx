import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection, getDOMSelection } from "lexical";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { mergeRegister } from "@lexical/utils";
import { $isCodeNode } from "@lexical/code";
import {
	$createLinkNode,
	$isAutoLinkNode,
	$isLinkNode,
	TOGGLE_LINK_COMMAND,
} from "@lexical/link";
import { setFloatingElemPositionForLinkEditor } from "../utils/set-floating-edit-link";
import { getSelectedNode } from "../utils/get-selected-node";
import { getDOMRangeRect } from "../utils/get-dom-range-rect";

const FloatingEditLinkPlugin = () => {
	const floatingEditLinkRef = useRef<HTMLDivElement | null>(null);
	const editLinkRef = useRef<HTMLInputElement | null>(null);
	const [editor] = useLexicalComposerContext();

	const [isLinkEditMode, setIsLinkEditMode] = useState(false);
	const [editedLinkUrl, setEditedLinkUrl] = useState("");
	const [linkUrl, setLinkUrl] = useState("");

	const $updateFloatingEditLink = useCallback(() => {
		const selection = $getSelection();

		if ($isRangeSelection(selection)) {
			const node = selection.anchor.getNode();
			const parent = node.getParent();

			if ($isCodeNode(node) || $isCodeNode(parent)) {
				if (floatingEditLinkRef.current) {
					floatingEditLinkRef.current.style.opacity = "0";
					floatingEditLinkRef.current.style.transform = `translate(-10000px, -10000px)`;
				}
				return;
			}

			if ($isLinkNode(parent)) {
				const nativeSelection = getDOMSelection(editor._window);
				const rootElement = editor.getRootElement();

				const url = parent.getURL();
				setLinkUrl(url);

				setEditedLinkUrl(url);
				if (isLinkEditMode) {
				}

				const rect = getDOMRangeRect({ nativeSelection, rootElement });
				if (floatingEditLinkRef.current && rootElement) {
					setFloatingElemPositionForLinkEditor(
						rect,
						floatingEditLinkRef.current,
						rootElement
					);
				}
			} else {
				if (floatingEditLinkRef.current) {
					floatingEditLinkRef.current.style.opacity = "0";
					floatingEditLinkRef.current.style.transform = `translate(-10000px, -10000px)`;
					setIsLinkEditMode(false);
				}
			}
		}
	}, [editor, isLinkEditMode]);

	useEffect(() => {
		return mergeRegister(
			editor.registerUpdateListener(({ editorState }) => {
				editorState.read(
					() => {
						$updateFloatingEditLink();
					},
					{ editor }
				);
			})
		);
	}, [editor, $updateFloatingEditLink]);

	const monitorInputInteraction = (
		event: React.KeyboardEvent<HTMLInputElement>
	) => {
		if (event.key === "Enter") {
			handleLinkSubmission(event);
		} else if (event.key === "Escape") {
			event.preventDefault();
			setIsLinkEditMode(false);
		}
	};

	const handleLinkSubmission = (
		event: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent<HTMLElement>
	) => {
		event.preventDefault();

		if (linkUrl !== "") {
			editor.update(() => {
				editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl);
				const selection = $getSelection();
				if ($isRangeSelection(selection)) {
					const parent = getSelectedNode(selection).getParent();
					if ($isAutoLinkNode(parent)) {
						const linkNode = $createLinkNode(parent.getURL(), {
							rel: parent.__rel,
							target: parent.__target,
							title: parent.__title,
						});
						parent.replace(linkNode, true);
					}
				}
			});

			setEditedLinkUrl("https://");
			setIsLinkEditMode(false);
		}
	};

	useEffect(() => {
		if (isLinkEditMode && editLinkRef.current) {
			editLinkRef.current.focus();
		}
	}, [isLinkEditMode]);

	return (
		<div
			className="absolute top-0 left-0 opacity-0 z-40 transition-opacity bg-red-500 flex items-center gap-3"
			ref={floatingEditLinkRef}
		>
			{isLinkEditMode ? (
				<input
					type="text"
					placeholder="enter url"
					ref={editLinkRef}
					className="p-3 border border-black bg-white"
					value={linkUrl}
					onChange={(e) => {
						setLinkUrl(e.target.value);
					}}
					onKeyDown={monitorInputInteraction}
				/>
			) : (
				<a
					type="text"
					href={editedLinkUrl}
					className="p-3 border border-black bg-white min-w-50"
					target="_blank"
				>
					{editedLinkUrl}
				</a>
			)}
			{!isLinkEditMode ? (
				<div className="flex items-center gap-2 px-2">
					<button onClick={() => setIsLinkEditMode(true)}>edit</button>
					<button onClick={() => {}}>del</button>
				</div>
			) : (
				<div className="flex items-center gap-2 px-2">
					<button onClick={() => setIsLinkEditMode(false)}>Cancel</button>
					<button onClick={handleLinkSubmission}>OK</button>
				</div>
			)}
		</div>
	);
};

export default FloatingEditLinkPlugin;
