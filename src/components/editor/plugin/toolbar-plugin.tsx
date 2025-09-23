/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$createListItemNode,
	$createListNode,
	$isListItemNode,
	$isListNode,
	INSERT_ORDERED_LIST_COMMAND,
	INSERT_UNORDERED_LIST_COMMAND,
	ListNode,
} from "@lexical/list";
import { $getNearestNodeOfType, mergeRegister } from "@lexical/utils";
import {
	$createParagraphNode,
	$getSelection,
	$isRangeSelection,
	CAN_REDO_COMMAND,
	CAN_UNDO_COMMAND,
	COMMAND_PRIORITY_LOW,
	FORMAT_ELEMENT_COMMAND,
	FORMAT_TEXT_COMMAND,
	getDOMSelection,
	REDO_COMMAND,
	SELECTION_CHANGE_COMMAND,
	UNDO_COMMAND,
} from "lexical";
import { Dispatch, useCallback, useEffect, useRef, useState } from "react";
import {
	Bold,
	Code,
	Italic,
	Redo2,
	Strikethrough,
	TextAlignCenter,
	TextAlignEnd,
	TextAlignJustify,
	TextAlignStart,
	Underline,
	Undo2,
} from "lucide-react";
import { $createHeadingNode, $isHeadingNode } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import {
	$createCodeNode,
	$isCodeHighlightNode,
	$isCodeNode,
	CodeHighlightNode,
	CodeNode,
} from "@lexical/code";
import {
	$createLinkNode,
	$isLinkNode,
	TOGGLE_LINK_COMMAND,
} from "@lexical/link";

function Divider() {
	return <div className="divider" />;
}

type ListHeading = "h1" | "h2" | "h3";
type ListTags = "ul" | "ol";
type ListLanguagesCode = "javascript" | "java" | "c++";

export default function ToolbarPlugin({
	showToolbar,
	setShowToolbar,
}: {
	showToolbar?: boolean;
	setShowToolbar?: Dispatch<boolean>;
}) {
	const [editor] = useLexicalComposerContext();
	const toolbarRef = useRef<HTMLDivElement | null>(null);
	const [canUndo, setCanUndo] = useState(false);
	const [canRedo, setCanRedo] = useState(false);
	const [isBold, setIsBold] = useState(false);
	const [isItalic, setIsItalic] = useState(false);
	const [isUnderline, setIsUnderline] = useState(false);
	const [isStrikethrough, setIsStrikethrough] = useState(false);
	const [isCode, setIsCode] = useState(false);
	const [headingBlock, setHeadingBlock] = useState<ListHeading>();
	const [listBlock, setListBlock] = useState<ListTags>();
	const [codeBlock, setCodeBlock] = useState(false);
	const [languageCode, setLanguageCode] = useState<ListLanguagesCode>();
	const [isLink, setIsLink] = useState(false);

	const $updateToolbar = useCallback(() => {
		const selection = $getSelection();

		if ($isRangeSelection(selection)) {
			// Update text format
			setIsBold(selection.hasFormat("bold"));
			setIsItalic(selection.hasFormat("italic"));
			setIsUnderline(selection.hasFormat("underline"));
			setIsStrikethrough(selection.hasFormat("strikethrough"));
			setIsCode(selection.hasFormat("code"));

			//other
			const node = selection.anchor.getNode();

			const parent = node.getParent();
			if ($isHeadingNode(parent)) {
				const tag = parent.getTag();
				setHeadingBlock(tag as ListHeading);
			} else {
				setHeadingBlock(undefined);
			}

			if ($isLinkNode(parent)) {
				setIsLink(true);
			} else {
				setIsLink(false);
			}

			const listNode = $getNearestNodeOfType(node, ListNode);

			if ($isListNode(listNode)) {
				const tag = listNode.getTag() as ListTags;
				setListBlock(tag);
			} else {
				setListBlock(undefined);
			}

			const codeNode = $getNearestNodeOfType(node, CodeNode);
			if ($isCodeNode(codeNode)) {
				setCodeBlock(true);
				const language = codeNode.getLanguage() as ListLanguagesCode;
				setLanguageCode(language);
			} else {
				setCodeBlock(false);
				setLanguageCode(undefined);
			}
		}
	}, [editor]);

	useEffect(() => {
		return mergeRegister(
			editor.registerUpdateListener(({ editorState }) => {
				editorState.read(
					() => {
						$updateToolbar();
					},
					{ editor }
				);
			}),
			editor.registerCommand(
				SELECTION_CHANGE_COMMAND,
				(_payload, _newEditor) => {
					$updateToolbar();
					return false;
				},
				COMMAND_PRIORITY_LOW
			),
			editor.registerCommand(
				CAN_UNDO_COMMAND,
				(payload) => {
					setCanUndo(payload);
					return false;
				},
				COMMAND_PRIORITY_LOW
			),
			editor.registerCommand(
				CAN_REDO_COMMAND,
				(payload) => {
					setCanRedo(payload);
					return false;
				},
				COMMAND_PRIORITY_LOW
			)
		);
	}, [editor, $updateToolbar]);

	const list: ListHeading[] = ["h1", "h2", "h3"];
	const listLanguageCode: ListLanguagesCode[] = ["c++", "java", "javascript"];

	function onClickHeading(tag: ListHeading) {
		editor.update(() => {
			const selection = $getSelection();
			if ($isRangeSelection(selection)) {
				$setBlocksType(selection, () => $createHeadingNode(tag));
			}
		});
	}

	const hideToolbar = () => {
		setShowToolbar?.(false);
	};

	return (
		showToolbar && (
			<div className={"toolbar absolute top-0 left-0"} ref={toolbarRef}>
				<div className="flex items-center gap-3">
					<button
						className="toolbar-item spaced disabled:text-gray-300"
						onClick={() => {
							editor.update(() => {
								const selection = $getSelection();
								if ($isRangeSelection(selection)) {
									$setBlocksType(selection, () => $createParagraphNode());
								}
							});
							hideToolbar();
						}}
					>
						A
					</button>
					{list.map((tag, index) => (
						<button
							key={index}
							className={`toolbar-item spaced disabled:text-gray-300 ${
								tag === headingBlock ? "text-pink-500" : ""
							}`}
							onClick={() => {
								onClickHeading(tag);
								hideToolbar();
							}}
						>
							{tag}
						</button>
					))}
				</div>
				<button
					className={`toolbar-item spaced disabled:text-gray-300 ${
						listBlock === "ul" ? "text-pink-500" : ""
					}`}
					onClick={() => {
						editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
						hideToolbar();
					}}
				>
					UL
				</button>
				<button
					className={`toolbar-item spaced disabled:text-gray-300 ${
						listBlock === "ol" ? "text-pink-500" : ""
					}`}
					onClick={() => {
						editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
						hideToolbar();
					}}
				>
					OL
				</button>
				<button
					className={`toolbar-item spaced disabled:text-gray-300 ${
						codeBlock ? "text-pink-500" : ""
					}`}
					onClick={() => {
						editor.update(() => {
							let selection = $getSelection();
							if (!selection) {
								return;
							}
							if (!$isRangeSelection(selection) || selection.isCollapsed()) {
								$setBlocksType(selection, () => $createCodeNode("javascript"));
							} else {
								const textContent = selection.getTextContent();
								const codeNode = $createCodeNode("javascript");
								selection.insertNodes([codeNode]);
								selection = $getSelection();
								if ($isRangeSelection(selection)) {
									selection.insertRawText(textContent);
								}
							}
						});
					}}
				>
					Code block
				</button>
				<button
					disabled={!canUndo}
					onClick={() => {
						editor.dispatchCommand(UNDO_COMMAND, undefined);
					}}
					className="toolbar-item spaced disabled:text-gray-300"
					aria-label="Undo"
				>
					<Undo2 />
				</button>
				<button
					disabled={!canRedo}
					onClick={() => {
						editor.dispatchCommand(REDO_COMMAND, undefined);
					}}
					className="toolbar-item disabled:text-gray-300"
					aria-label="Redo"
				>
					<Redo2 />
				</button>
				<Divider />
				{!codeBlock ? (
					<>
						<button
							onClick={() => {
								editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
							}}
							className={"toolbar-item spaced " + (isBold ? "active" : "")}
							aria-label="Format Bold"
						>
							<Bold size={22} strokeWidth={2} />
						</button>
						<button
							onClick={() => {
								editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
							}}
							className={"toolbar-item spaced " + (isItalic ? "active" : "")}
							aria-label="Format Italics"
						>
							<Italic size={22} />
						</button>
						<button
							onClick={() => {
								editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
							}}
							className={"toolbar-item spaced " + (isUnderline ? "active" : "")}
							aria-label="Format Underline"
						>
							<Underline size={22} />
						</button>
						<button
							onClick={() => {
								editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
							}}
							className={
								"toolbar-item spaced " + (isStrikethrough ? "active" : "")
							}
							aria-label="Format Strikethrough"
						>
							<Strikethrough size={22} />
						</button>
						<button
							onClick={() => {
								editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code");
							}}
							className={"toolbar-item spaced " + (isCode ? "active" : "")}
							aria-label="Format CodeBlock"
						>
							<Code size={22} />
						</button>
						<button
							className={`toolbar-item spaced disabled:text-gray-300 ${
								isLink ? "text-pink-500" : ""
							}`}
							onClick={() => {
								if (isLink) {
									editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
								} else {
									editor.dispatchCommand(TOGGLE_LINK_COMMAND, "https://");
								}
							}}
						>
							Link
						</button>
						<Divider />
					</>
				) : (
					<div className="flex items-center gap-2">
						{listLanguageCode.map((lang, index) => (
							<button
								key={index}
								className={`toolbar-item spaced capitalize ${
									languageCode === lang ? "text-pink-500" : ""
								}`}
								onClick={() => {
									editor.update(() => {
										let selection = $getSelection();
										if (!selection) {
											return;
										}
										if (
											!$isRangeSelection(selection) ||
											selection.isCollapsed()
										) {
											$setBlocksType(selection, () => $createCodeNode(lang));
										} else {
											const textContent = selection.getTextContent();
											const codeNode = $createCodeNode(lang);
											selection.insertNodes([codeNode]);
											selection = $getSelection();
											if ($isRangeSelection(selection)) {
												selection.insertRawText(textContent);
											}
										}
									});
								}}
							>
								{lang}
							</button>
						))}
					</div>
				)}
				<button
					onClick={() => {
						editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left");
					}}
					className="toolbar-item spaced"
					aria-label="Left Align"
				>
					<TextAlignStart size={22} />
				</button>
				<button
					onClick={() => {
						editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center");
					}}
					className="toolbar-item spaced"
					aria-label="Center Align"
				>
					<TextAlignCenter size={22} />
				</button>
				<button
					onClick={() => {
						editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right");
					}}
					className="toolbar-item spaced"
					aria-label="Right Align"
				>
					<TextAlignEnd size={22} />
				</button>
				<button
					onClick={() => {
						editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "justify");
					}}
					className="toolbar-item"
					aria-label="Justify Align"
				>
					<TextAlignJustify size={22} />
				</button>{" "}
			</div>
		)
	);
}
