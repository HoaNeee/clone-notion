import { $createCodeNode } from "@lexical/code";
import {
	$createListItemNode,
	$createListNode,
	$isListItemNode,
	INSERT_CHECK_LIST_COMMAND,
	INSERT_ORDERED_LIST_COMMAND,
	INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list";
import {
	$createHeadingNode,
	$createQuoteNode,
	HeadingTagType,
} from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import {
	$createParagraphNode,
	$createRangeSelection,
	$getNodeByKey,
	$getSelection,
	$isRangeSelection,
	$setSelection,
	LexicalEditor,
} from "lexical";
import {
	setFocusCaretSelectionWithBlock,
	setFocusCaretSelectionWithParent,
} from "../../utils/set-selection";

export const formatParagraph = (editor: LexicalEditor) => {
	editor.update(() => {
		const selection = $getSelection();
		$setBlocksType(selection, () => $createParagraphNode());
	});
};

export const formatHeading = (
	editor: LexicalEditor,
	blockType: string,
	headingSize: HeadingTagType
) => {
	if (blockType !== headingSize) {
		editor.update(() => {
			const selection = $getSelection();
			if ($isRangeSelection(selection)) {
				$setBlocksType(selection, () => $createHeadingNode(headingSize));
			}
		});
	}
};

export const formatBulletList = (
	editor: LexicalEditor,
	blockType: string,
	isSelectionManyBlock?: boolean,
	isManyLine?: boolean
) => {
	editor.update(() => {
		const selection = $getSelection();
		if ($isRangeSelection(selection)) {
			const node = selection.anchor.getNode();
			const parent = node.getParent();
			const listNode = $createListNode("bullet");
			if (!isSelectionManyBlock) {
				if (isManyLine) {
					const nodes = selection.getNodes();
					const listItemNode = nodes.filter((node) => $isListItemNode(node));

					for (const node of listItemNode) {
						const newNode = $createListItemNode();
						newNode.append(...node.getChildren());
						listNode.append(newNode);
						node.replace(listNode);
					}

					setFocusCaretSelectionWithBlock(editor, "end");
					return;
				}

				if (parent) {
					const listItemNode = $createListItemNode();
					listItemNode.append(...parent.getChildren());
					listNode.append(listItemNode);
					parent.replace(listNode);
				}
				setFocusCaretSelectionWithParent(editor, "end");
			} else {
				editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
				setFocusCaretSelectionWithBlock(editor, "end");
			}
		}
	});
};

export const formatCheckList = (editor: LexicalEditor, blockType: string) => {
	if (blockType !== "check") {
		editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
	} else {
		formatParagraph(editor);
	}
};

export const formatNumberedList = (
	editor: LexicalEditor,
	blockType: string,
	isSelectionManyBlock?: boolean,
	isManyLine?: boolean
) => {
	editor.update(() => {
		const selection = $getSelection();
		if ($isRangeSelection(selection)) {
			const node = selection.anchor.getNode();
			const parent = node.getParent();
			const listNode = $createListNode("number");
			if (!isSelectionManyBlock) {
				if (isManyLine) {
					const nodes = selection.getNodes();
					const listItemNode = nodes.filter((node) => $isListItemNode(node));

					for (const node of listItemNode) {
						const newNode = $createListItemNode();
						newNode.append(...node.getChildren());
						listNode.append(newNode);
						node.replace(listNode);
					}
					setFocusCaretSelectionWithBlock(editor, "end");
					return;
				}

				if (parent) {
					const listItemNode = $createListItemNode();
					listItemNode.append(...parent.getChildren());
					listNode.append(listItemNode);
					parent.replace(listNode);
				}

				setFocusCaretSelectionWithParent(editor, "end");
			} else {
				editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
				setFocusCaretSelectionWithBlock(editor, "end");
			}
		}
	});
};

export const formatQuote = (editor: LexicalEditor, blockType: string) => {
	if (blockType !== "quote") {
		editor.update(() => {
			const selection = $getSelection();
			$setBlocksType(selection, () => $createQuoteNode());
		});
	}
};

export const formatCode = (
	editor: LexicalEditor,
	blockType: string,
	currentLang = "javascript",
	lang = "javascript"
) => {
	if (blockType !== "code" || currentLang !== lang) {
		editor.update(() => {
			let selection = $getSelection();
			if (!selection) {
				return;
			}
			if (!$isRangeSelection(selection) || selection.isCollapsed()) {
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
	}
};
export const deleteBlock = (editor: LexicalEditor) => {
	editor.update(() => {
		const selection = $getSelection();
		if (!selection) {
			return;
		}
		if ($isRangeSelection(selection)) {
			const node = selection.anchor.getNode();
			const block = node.getTopLevelElementOrThrow();
			block.remove();
		}
	});
};
