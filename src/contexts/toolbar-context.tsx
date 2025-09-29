import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import {
	$getSelection,
	$isNodeSelection,
	$isRangeSelection,
	CAN_REDO_COMMAND,
	CAN_UNDO_COMMAND,
	COMMAND_PRIORITY_LOW,
	ElementFormatType,
	SELECTION_CHANGE_COMMAND,
} from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import { $isHeadingNode, $isQuoteNode } from "@lexical/rich-text";
import { $isLinkNode } from "@lexical/link";
import { $isListNode } from "@lexical/list";
import { $isCodeNode } from "@lexical/code";

export const blockTypeToBlockName = {
	paragraph: "Normal",
	h1: "Heading 1",
	h2: "Heading 2",
	h3: "Heading 3",
	h4: "Heading 4",
	h5: "Heading 5",
	h6: "Heading 6",
	bullet: "Bulleted List",
	number: "Numbered List",
	ul: "Bulleted List",
	ol: "Numbered List",
	code: "Code Block",
	check: "Check List",
	quote: "Quote",
};

const initialState = {
	isUnderline: false,
	isBold: false,
	isItalic: false,
	isLink: false,
	canRedo: false,
	canUndo: false,
	isCode: false,
	isStrikethrough: false,
	isLowercase: false,
	isUppercase: false,
	isCapitalize: false,
	blockType: "paragraph " as keyof typeof blockTypeToBlockName,
	elementFormat: "left" as ElementFormatType,
	codeLanguage: "",
};

type ToolbarState = typeof initialState;
type ToolbarStateKey = keyof ToolbarState;
type ToolbarStateValue<Key extends ToolbarStateKey> = ToolbarState[Key];

type ToolbarContextType = {
	toolbarState: ToolbarState;
	updateToolbarState<Key extends ToolbarStateKey>(
		key: Key,
		value: ToolbarStateValue<Key>
	): void;
};

const Context = createContext<ToolbarContextType | undefined>(undefined);

export const ToolbarContext = ({ children }: { children: React.ReactNode }) => {
	const [toolbarState, setToolbarState] = useState(initialState);
	const [editor] = useLexicalComposerContext();

	const updateToolbarState = useCallback(
		(key: ToolbarStateKey, value: ToolbarStateValue<ToolbarStateKey>) => {
			setToolbarState((prev) => {
				return {
					...prev,
					[key]: value,
				};
			});
		},
		[]
	);

	const $updateToolbar = useCallback(() => {
		const selection = $getSelection();

		if ($isRangeSelection(selection)) {
			// Update text format
			updateToolbarState("isBold", selection.hasFormat("bold"));
			updateToolbarState("isItalic", selection.hasFormat("italic"));
			updateToolbarState("isCode", selection.hasFormat("code"));
			updateToolbarState(
				"isStrikethrough",
				selection.hasFormat("strikethrough")
			);
			updateToolbarState("isUnderline", selection.hasFormat("underline"));
			updateToolbarState("isLowercase", selection.hasFormat("lowercase"));
			updateToolbarState("isUppercase", selection.hasFormat("uppercase"));
			updateToolbarState("isCapitalize", selection.hasFormat("capitalize"));

			//other
			const node = selection.anchor.getNode();

			const block = node.getTopLevelElementOrThrow();

			if ($isHeadingNode(block)) {
				const tag = block.getTag();
				updateToolbarState("blockType", tag);
			} else if ($isListNode(block)) {
				const tag = block.getTag();
				updateToolbarState("blockType", tag);
			} else if ($isCodeNode(block)) {
				updateToolbarState("blockType", "code");
				const language = block.getLanguage() as string;
				updateToolbarState("codeLanguage", language);
			} else if ($isQuoteNode(block)) {
				updateToolbarState("blockType", "quote");
			} else {
				updateToolbarState("blockType", "paragraph");
				updateToolbarState("codeLanguage", "");
			}
		}
	}, [updateToolbarState]);

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
				() => {
					$updateToolbar();
					return false;
				},
				COMMAND_PRIORITY_LOW
			),
			editor.registerCommand(
				CAN_UNDO_COMMAND,
				(payload) => {
					updateToolbarState("canUndo", payload);
					return false;
				},
				COMMAND_PRIORITY_LOW
			),
			editor.registerCommand(
				CAN_REDO_COMMAND,
				(payload) => {
					updateToolbarState("canRedo", payload);
					return false;
				},
				COMMAND_PRIORITY_LOW
			)
		);
	}, [editor, $updateToolbar, updateToolbarState]);

	const value = {
		toolbarState,
		updateToolbarState,
	};

	return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useToolbarState = () => {
	const context = useContext(Context);

	if (!context) {
		throw new Error("useToolbarState must be used within a ToolbarProvider");
	}

	return context;
};
