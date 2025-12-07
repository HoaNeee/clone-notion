/* eslint-disable @typescript-eslint/no-explicit-any */
import { editorRootName } from "@/lib/contants";
import { InitialEditorStateType } from "@lexical/react/LexicalComposer";
import {
	EditorThemeClasses,
	HTMLConfig,
	Klass,
	LexicalEditor,
	LexicalNode,
	LexicalNodeReplacement,
	ParagraphNode,
	TextNode,
} from "lexical";
import { rootTheme } from "../theme/editor-theme";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ImageNode } from "../nodes/image-node";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { MarkNode } from "@lexical/mark";

function onError(error: any) {
	console.error(error);
}

export const initialConfig: Readonly<{
	namespace: string;
	nodes?: ReadonlyArray<Klass<LexicalNode> | LexicalNodeReplacement>;
	onError: (error: Error, editor: LexicalEditor) => void;
	editable?: boolean;
	theme?: EditorThemeClasses;
	editorState?: InitialEditorStateType;
	html?: HTMLConfig;
}> = {
	namespace: `${editorRootName}`,
	theme: rootTheme,
	onError,
	nodes: [
		HeadingNode,
		ParagraphNode,
		TextNode,
		ListNode,
		ListItemNode,
		CodeNode,
		CodeHighlightNode,
		LinkNode,
		AutoLinkNode,
		QuoteNode,
		ImageNode,
		TableNode,
		TableCellNode,
		TableRowNode,
		MarkNode,
	],
};
