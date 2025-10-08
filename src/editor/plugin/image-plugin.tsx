import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";
import { $wrapNodeInElement, mergeRegister } from "@lexical/utils";
import {
	$createParagraphNode,
	$createRangeSelection,
	$getSelection,
	$insertNodes,
	$isNodeSelection,
	$isRootOrShadowRoot,
	$setSelection,
	COMMAND_PRIORITY_EDITOR,
	COMMAND_PRIORITY_HIGH,
	COMMAND_PRIORITY_LOW,
	createCommand,
	DRAGOVER_COMMAND,
	DRAGSTART_COMMAND,
	DROP_COMMAND,
	LexicalCommand,
	LexicalEditor,
} from "lexical";
import {
	$createImageNode,
	$isImageNode,
	ImagePayload,
} from "../nodes/image-node";

export type ImageInsertPayload = Readonly<ImagePayload>;

export const INSERT_IMAGE_COMMAND: LexicalCommand<ImageInsertPayload> =
	createCommand("INSERT_IMAGE_COMMAND");

const ImagePlugin = () => {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		return mergeRegister(
			editor.registerCommand(
				INSERT_IMAGE_COMMAND,
				(payload) => {
					const imageNode = $createImageNode(payload);
					$insertNodes([imageNode]);
					if ($isRootOrShadowRoot(imageNode.getParentOrThrow())) {
						$wrapNodeInElement(imageNode, $createParagraphNode).selectEnd();
					}

					return true;
				},
				COMMAND_PRIORITY_EDITOR
			),
			editor.registerCommand<DragEvent>(
				DRAGSTART_COMMAND,
				$onDragStart,
				COMMAND_PRIORITY_HIGH
			),
			editor.registerCommand<DragEvent>(
				DRAGOVER_COMMAND,
				$onDragover,
				COMMAND_PRIORITY_LOW
			),
			editor.registerCommand<DragEvent>(
				DROP_COMMAND,
				(e) => $onDrop(e, editor),
				COMMAND_PRIORITY_HIGH
			)
		);
	}, [editor]);

	return null;
};

const DEFAULT_SRC =
	"data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

const $onDragStart = (e: DragEvent): boolean => {
	const node = getImageNodeInSelection();

	if (!node) {
		return false;
	}

	const img = document.createElement("img");
	img.src = DEFAULT_SRC;

	const dataTransfer = e.dataTransfer;

	if (!dataTransfer) {
		return false;
	}

	dataTransfer.setData("text/plain", "_");
	dataTransfer.setDragImage(img, 0, 0);
	dataTransfer.setData(
		"application/x-lexical-drag",
		JSON.stringify({
			data: {
				altText: node.__altText,
				caption: node.__caption,
				height: node.__height,
				key: node.getKey(),
				maxWidth: node.__maxWidth,
				showCaption: node.__showCaption,
				src: node.__src,
				width: node.__width,
				status: node.__status,
			},
			type: "image",
		})
	);

	return true;
};

const $onDragover = (e: DragEvent) => {
	const node = getImageNodeInSelection();
	if (!node) {
		return false;
	}

	if (!canDrop(e)) {
		e.preventDefault();
	}

	return true;
};

const $onDrop = (e: DragEvent, editor: LexicalEditor) => {
	const node = getImageNodeInSelection();
	if (!node) {
		return false;
	}

	const dataTransfer = getDragImageData(e);

	if (!dataTransfer) {
		return false;
	}
	e.preventDefault();
	if (canDrop(e)) {
		const range = getDragSelection(e);

		node.remove();

		if (range !== null) {
			const rangeSelection = $createRangeSelection();
			rangeSelection.applyDOMRange(range);
			$setSelection(rangeSelection);
		}

		editor.dispatchCommand(INSERT_IMAGE_COMMAND, dataTransfer);
	}

	return true;
};

const getImageNodeInSelection = () => {
	const selection = $getSelection();

	if ($isNodeSelection(selection)) {
		const nodes = selection.getNodes();

		if ($isImageNode(nodes[0])) {
			return nodes[0];
		}
	}

	return null;
};

const getDragImageData = (e: DragEvent): ImageInsertPayload | null => {
	const dataTransfer = e.dataTransfer?.getData("application/x-lexical-drag");
	if (!dataTransfer) {
		return null;
	}

	const { type, data } = JSON.parse(dataTransfer);

	if (type === "image") {
		return data;
	}

	return null;
};

const getDragSelection = (e: DragEvent) => {
	const caretPostion = document.caretPositionFromPoint(e.clientX, e.clientY);

	if (caretPostion) {
		const { offsetNode, offset } = caretPostion;
		const range = document.createRange();
		range.setStart(offsetNode, offset);
		range.setEnd(offsetNode, offset);
		return range;
	}

	return null;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function canDrop(_e: DragEvent) {
	//do some thing here...
	return true;
}

export default ImagePlugin;
