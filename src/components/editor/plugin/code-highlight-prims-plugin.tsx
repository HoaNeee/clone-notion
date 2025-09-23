"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";
import { registerCodeHighlighting } from "@lexical/code";

const CodeHighlightPrimsPlugin = () => {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		return registerCodeHighlighting(editor);
	}, [editor]);

	return null;
};

export default CodeHighlightPrimsPlugin;
