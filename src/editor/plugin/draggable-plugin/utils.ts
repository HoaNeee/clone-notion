import {
	$getNearestNodeFromDOMNode,
	$isElementNode,
	LexicalEditor,
} from "lexical";

export function getBlockFromCursorBlock(
	editor: LexicalEditor,
	cursorBlock?: HTMLElement | null
) {
	if (!cursorBlock) {
		return null;
	}
	const node = $getNearestNodeFromDOMNode(cursorBlock, editor._editorState);

	if (!node) {
		return null;
	}

	const block = node.getTopLevelElementOrThrow();

	if ($isElementNode(block)) {
		return block;
	}
	return null;
}

export const getTranslate = (element: HTMLDivElement) => {
	const style = window.getComputedStyle(element);
	const matrix = new DOMMatrixReadOnly(style.transform);
	return { x: matrix.m41, y: matrix.m42 };
};
