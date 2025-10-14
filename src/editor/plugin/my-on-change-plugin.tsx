import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { EditorState } from "lexical";
import { useEffect } from "react";

const MyOnChangePlugin = ({
	onChange,
}: {
	onChange: (editor: EditorState) => void;
}) => {
	const [editor] = useLexicalComposerContext();
	useEffect(() => {
		return editor.registerUpdateListener(({ editorState }) => {
			onChange(editorState);
		});
	}, [editor, onChange]);
	return null;
};

export default MyOnChangePlugin;
