import { $createCodeNode } from "@lexical/code";
import {
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
	$getSelection,
	$isRangeSelection,
	LexicalEditor,
} from "lexical";

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
			$setBlocksType(selection, () => $createHeadingNode(headingSize));
		});
	}
};

export const formatBulletList = (editor: LexicalEditor, blockType: string) => {
	if (blockType !== "bullet") {
		editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
	} else {
		formatParagraph(editor);
	}
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
	blockType: string
) => {
	if (blockType !== "number") {
		editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
	} else {
		formatParagraph(editor);
	}
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
