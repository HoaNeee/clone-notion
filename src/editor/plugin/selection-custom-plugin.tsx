import {
	$getSelection,
	$isElementNode,
	$isRangeSelection,
	COMMAND_PRIORITY_LOW,
	KEY_ESCAPE_COMMAND,
	SELECTION_CHANGE_COMMAND,
} from "lexical";
import { useCallback, useEffect } from "react";
import { mergeRegister } from "@lexical/utils";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useSelectionCustom } from "@/contexts/selection-custom-context";
import { $isListItemNode } from "@lexical/list";
import { useFloatingToolbar } from "@/contexts/floating-toolbar-context";

const SelectionCustomPlugin = () => {
	const [editor] = useLexicalComposerContext();

	const { updateSelectionCustomState } = useSelectionCustom();
	const {
		floatingToolbarState: { openningFloatingToolbar },
		updateFloatingToolbarState,
	} = useFloatingToolbar();

	const $updateSelectionCustom = useCallback(() => {
		const selection = $getSelection();
		if ($isRangeSelection(selection)) {
			const unionNode = new Set();
			const nodes = selection.getNodes();
			nodes.forEach((node) => {
				if ($isElementNode(node)) {
					const block = node.getTopLevelElementOrThrow();
					unionNode.add(block);
				}
			});

			if (unionNode.size > 1) {
				updateSelectionCustomState("isSelectionManyBlock", true);
			} else {
				updateSelectionCustomState("isSelectionManyBlock", false);
			}

			const listItemNode = nodes.filter((node) => $isListItemNode(node));
			updateSelectionCustomState(
				"isSelectionManyLineInListNode",
				listItemNode.length >= 2
			);

			// console.log(nodes);
		}
	}, [updateSelectionCustomState]);

	const $onEscape = useCallback(
		(e: KeyboardEvent) => {
			const root = editor.getRootElement();
			if (root === e.target) {
				if (openningFloatingToolbar) {
					updateFloatingToolbarState("openningFloatingToolbar", false);
					updateFloatingToolbarState("isSelectionHasTextContent", false);
				}
			}

			return false;
		},
		[openningFloatingToolbar, updateFloatingToolbarState, editor]
	);

	useEffect(() => {
		return mergeRegister(
			editor.registerUpdateListener(({ editorState }) => {
				editorState.read(
					() => {
						$updateSelectionCustom();
					},
					{ editor }
				);
			}),
			editor.registerCommand(
				SELECTION_CHANGE_COMMAND,
				() => {
					$updateSelectionCustom();
					return false;
				},
				COMMAND_PRIORITY_LOW
			),
			editor.registerCommand(
				KEY_ESCAPE_COMMAND,
				$onEscape,
				COMMAND_PRIORITY_LOW
			)
		);
	}, [editor, $updateSelectionCustom, $onEscape]);

	return null;
};

export default SelectionCustomPlugin;
