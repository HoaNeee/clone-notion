import {
	$createRangeSelection,
	$getNearestNodeFromDOMNode,
	$getSelection,
	$isElementNode,
	$isRangeSelection,
	$setSelection,
	BaseSelection,
	ElementNode,
	LexicalEditor,
} from "lexical";

function setSelectionFromBaseSelection(
	editor: LexicalEditor,
	baseSelection: BaseSelection
) {
	editor.update(() => {
		if ($isRangeSelection(baseSelection)) {
			const newSelection = $createRangeSelection();
			newSelection.focus.set(
				baseSelection.focus.key,
				baseSelection.focus.offset,
				baseSelection.focus.type
			);
			newSelection.anchor.set(
				baseSelection.anchor.key,
				baseSelection.anchor.offset,
				baseSelection.anchor.type
			);
			$setSelection(newSelection);
		}
	});
}

type Direction = "start" | "next" | "end" | "prev" | "default";

function select(node: ElementNode, direc: Direction = "default") {
	if (node) {
		switch (direc) {
			case "start":
				node.selectStart();
				break;
			case "prev":
				node.selectPrevious();
				break;
			case "end":
				node.selectEnd();
				break;
			case "next":
				node.selectNext();
				break;
			default:
				node.select();
				break;
		}
	}
}

function setFocusCaretSelectionWithParent(
	editor: LexicalEditor,
	direc: Direction = "default",
	textContent?: boolean
) {
	editor.update(() => {
		const selection = $getSelection();
		if ($isRangeSelection(selection)) {
			const node = selection.anchor.getNode();
			const parent = node.getParent();

			if (parent) {
				if (textContent) {
					const content = selection.getTextContent();
					if (content) {
						select(parent, direc);
					}
				} else {
					select(parent, direc);
				}
				return parent;
			}
		}
	});
	return null;
}

function setFocusCaretSelectionWithBlock(
	editor: LexicalEditor,
	direc: Direction = "default",
	textContent?: boolean
) {
	editor.update(() => {
		const selection = $getSelection();
		if ($isRangeSelection(selection)) {
			const node = selection.anchor.getNode();
			const block = node.getTopLevelElementOrThrow();
			if (block) {
				if (textContent) {
					const content = selection.getTextContent();
					if (content) {
						select(block, direc);
					}
				} else {
					select(block, direc);
				}

				return block;
			}
		}
	});
	return null;
}

function setFocusCaretSelectionWithNearestNodeFromCursorBlock(
	editor: LexicalEditor,
	cursorBlock?: HTMLElement | null,
	direc: Direction = "default"
) {
	if (!cursorBlock) {
		return;
	}

	editor.update(() => {
		const node = $getNearestNodeFromDOMNode(cursorBlock);

		if (!node) {
			return null;
		}

		const block = node.getTopLevelElementOrThrow();

		if ($isElementNode(block)) {
			select(block, direc);
			return block;
		}
	});
	return null;
}

export {
	setSelectionFromBaseSelection,
	setFocusCaretSelectionWithBlock,
	setFocusCaretSelectionWithParent,
	setFocusCaretSelectionWithNearestNodeFromCursorBlock,
};
