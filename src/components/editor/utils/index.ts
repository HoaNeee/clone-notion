import {
	$createRangeSelection,
	$isRangeSelection,
	$setSelection,
	BaseSelection,
	LexicalEditor,
} from "lexical";

function setSelectionFromBaseSelection(
	editor: LexicalEditor,
	baseSelection: BaseSelection
) {
	editor.update(() => {
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
	});
}

export { setSelectionFromBaseSelection };
