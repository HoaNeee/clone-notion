import {
	createContext,
	Dispatch,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import {
	$getSelection,
	$isElementNode,
	$isRangeSelection,
	CAN_REDO_COMMAND,
	CAN_UNDO_COMMAND,
	COMMAND_PRIORITY_CRITICAL,
	ElementFormatType,
	LexicalEditor,
	SELECTION_CHANGE_COMMAND,
} from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $isEditorIsNestedEditor, mergeRegister } from "@lexical/utils";
import { $isHeadingNode, $isQuoteNode } from "@lexical/rich-text";
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
	isImageNode: false,
	isImageCaption: false,
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
	activeEditor: LexicalEditor;
};

const Context = createContext<ToolbarContextType | undefined>(undefined);

const useUpdateToolbar = ({
	editor,
	updateToolbarState,
	setActiveEditor,
	activeEditor,
}: {
	editor: LexicalEditor;
	updateToolbarState<Key extends ToolbarStateKey>(
		key: Key,
		value: ToolbarStateValue<Key>
	): void;
	setActiveEditor: Dispatch<LexicalEditor>;
	activeEditor: LexicalEditor;
}) => {
	const $updateToolbar = useCallback(() => {
		const selection = $getSelection();

		if ($isRangeSelection(selection)) {
			const root = editor.getRootElement();
			const rootImageCaption = activeEditor.getRootElement();

			if (editor !== activeEditor && $isEditorIsNestedEditor(activeEditor)) {
				if (
					rootImageCaption &&
					root?.className !== rootImageCaption?.className
				) {
					updateToolbarState("isImageCaption", true);
					updateToolbarState("isImageNode", true);
				}
			} else {
				updateToolbarState("isImageCaption", false);
				updateToolbarState("isImageNode", false);
			}

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

			const block = node.getTopLevelElement();

			if ($isElementNode(block)) {
				const elementFormat = block.getFormatType() || "left";
				updateToolbarState("elementFormat", elementFormat);
			}

			if (block) {
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
		}
	}, [updateToolbarState, editor, activeEditor]);

	useEffect(() => {
		return editor.registerCommand(
			SELECTION_CHANGE_COMMAND,
			(_, newEdittor) => {
				$updateToolbar();
				setActiveEditor(newEdittor);
				return false;
			},
			COMMAND_PRIORITY_CRITICAL
		);
	}, [editor, setActiveEditor, $updateToolbar]);

	useEffect(() => {
		return activeEditor.getEditorState().read(
			() => {
				$updateToolbar();
			},
			{ editor: activeEditor }
		);
	}, [activeEditor, $updateToolbar]);

	useEffect(() => {
		return mergeRegister(
			activeEditor.registerUpdateListener(({ editorState }) => {
				editorState.read(
					() => {
						$updateToolbar();
					},
					{ editor: activeEditor }
				);
			}),
			activeEditor.registerCommand(
				CAN_UNDO_COMMAND,
				(payload) => {
					updateToolbarState("canUndo", payload);
					return false;
				},
				COMMAND_PRIORITY_CRITICAL
			),
			activeEditor.registerCommand(
				CAN_REDO_COMMAND,
				(payload) => {
					updateToolbarState("canRedo", payload);
					return false;
				},
				COMMAND_PRIORITY_CRITICAL
			)
		);
	}, [activeEditor, editor, $updateToolbar, updateToolbarState]);
};

export const ToolbarContext = ({ children }: { children: React.ReactNode }) => {
	const [toolbarState, setToolbarState] = useState(initialState);
	const [editor] = useLexicalComposerContext();
	const [activeEditor, setActiveEditor] = useState<LexicalEditor>(editor);

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

	useUpdateToolbar({
		editor,
		activeEditor,
		updateToolbarState,
		setActiveEditor,
	});

	const value = {
		toolbarState,
		updateToolbarState,
		activeEditor,
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
