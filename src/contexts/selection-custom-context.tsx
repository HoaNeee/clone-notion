import { createContext, useCallback, useContext, useState } from "react";

const initialState = {
	isSelectionManyBlock: false,
	isSelectionManyLineInListNode: false,
};

type SelectionCustomState = typeof initialState;
type SelectionCustomStateKey = keyof typeof initialState;
type SelectionCustomStateValue<Key extends SelectionCustomStateKey> =
	SelectionCustomState[Key];

type SelectionCustomContextType = {
	selectionState: SelectionCustomState;
	updateSelectionCustomState: (
		key: SelectionCustomStateKey,
		value: SelectionCustomStateValue<SelectionCustomStateKey>
	) => void;
};

const Context = createContext<SelectionCustomContextType | undefined>(
	undefined
);

const SelectionCustomContext = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const [state, setState] = useState(initialState);

	// const [editor] = useLexicalComposerContext();

	const updateSelectionCustomState = useCallback(
		(
			key: SelectionCustomStateKey,
			value: SelectionCustomStateValue<SelectionCustomStateKey>
		) => {
			setState((prev) => {
				return {
					...prev,
					[key]: value,
				};
			});
		},
		[]
	);

	// const $updateSelectionCustom = useCallback(() => {
	// 	const selection = $getSelection();
	// 	if ($isRangeSelection(selection)) {
	// 		const unionNode = new Set();

	// 		selection.getNodes().forEach((node) => {
	// 			if ($isElementNode(node)) {
	// 				const block = node.getTopLevelElementOrThrow();
	// 				unionNode.add(block);
	// 			}
	// 		});

	// 		if (unionNode.size > 1) {
	// 			updateSelectionCustomState("isSelectionManyBlock", true);
	// 		} else {
	// 			updateSelectionCustomState("isSelectionManyBlock", false);
	// 		}
	// 	}
	// }, [updateSelectionCustomState]);

	// useEffect(() => {
	// 	return mergeRegister(
	// 		editor.registerUpdateListener(({ editorState }) => {
	// 			editorState.read(
	// 				() => {
	// 					$updateSelectionCustom();
	// 				},
	// 				{ editor }
	// 			);
	// 		}),
	// 		editor.registerCommand(
	// 			SELECTION_CHANGE_COMMAND,
	// 			() => {
	// 				$updateSelectionCustom();
	// 				return false;
	// 			},
	// 			COMMAND_PRIORITY_LOW
	// 		)
	// 	);
	// }, [editor, $updateSelectionCustom]);

	const value = {
		selectionState: state,
		updateSelectionCustomState,
	};

	return <Context.Provider value={value}>{children}</Context.Provider>;
};

const useSelectionCustom = () => {
	const context = useContext(Context);

	if (!context) {
		throw new Error(
			"useSelectionCustom must be used within a SelctionCustomProvider"
		);
	}
	return context;
};

export { SelectionCustomContext, useSelectionCustom };
