/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import {
	EditorState,
	EditorThemeClasses,
	HTMLConfig,
	Klass,
	LexicalEditor,
	LexicalNode,
	LexicalNodeReplacement,
	ParagraphNode,
	TextNode,
} from "lexical";
import { useEffect, useState } from "react";

import {
	InitialEditorStateType,
	LexicalComposer,
} from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { ToolbarContext } from "@/contexts/toolbar-context";
import { SelectionCustomContext } from "@/contexts/selection-custom-context";
import { FloatingToolbarContext } from "@/contexts/floating-toolbar-context";
import { ImageNode } from "./nodes/image-node";
import { rootTheme } from "./theme/editor-theme";
import { editorRootName } from "@/lib/contants";
import MyPlugin from "./my-plugin";
import { sampleData } from "@/data/sampleStateData";

const MyEditor = () => {
	const [editorState, setEditorState] = useState<string>(sampleData);

	function onError(error: any) {
		console.error(error);
	}

	const initialConfig: Readonly<{
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
		],
		editorState,
	};

	function onChange(editorState: EditorState) {
		const editorStateJSON = editorState.toJSON();

		// However, we still have a JavaScript object, so we need to convert it to an actual string with JSON.stringify
		const json = JSON.stringify(editorStateJSON);
		setEditorState(json);
		// console.log("call change");
	}

	function MyOnChangePlugin({
		onChange,
	}: {
		onChange: (editor: EditorState) => void;
	}) {
		const [editor] = useLexicalComposerContext();
		useEffect(() => {
			return editor.registerUpdateListener(({ editorState }) => {
				onChange(editorState);
			});
		}, [editor, onChange]);
		return null;
	}

	return (
		<LexicalComposer initialConfig={initialConfig}>
			<ToolbarContext>
				<SelectionCustomContext>
					<FloatingToolbarContext>
						<MyPlugin />
						<MyOnChangePlugin onChange={onChange} />
					</FloatingToolbarContext>
				</SelectionCustomContext>
			</ToolbarContext>
		</LexicalComposer>
	);
};

export default MyEditor;
