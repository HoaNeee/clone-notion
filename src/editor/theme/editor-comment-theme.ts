import type { EditorThemeClasses } from "lexical";

import { rootTheme } from "./editor-theme";

const CommentEditorTheme: EditorThemeClasses = {
	...rootTheme,
	paragraph: "CommentEditorTheme__paragraph",
};

export default CommentEditorTheme;
