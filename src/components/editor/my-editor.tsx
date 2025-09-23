/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useRef } from "react";
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

import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import {
	InitialEditorStateType,
	LexicalComposer,
} from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { HeadingNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import CodeHighlightShikiPlugin from "./plugin/code-highlight-shiki-plugin";
import FloatingToolbarPlugin from "./plugin/floating-toolbar-plugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { LinkNode, AutoLinkNode } from "@lexical/link";

import dynamic from "next/dynamic";
import FloatingEditLinkPlugin from "./plugin/floating-edit-link-plugin";
import LexicalAutoLinkPlugin from "./plugin/auto-link-plugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";

const DraggableBlockPlugin = dynamic(
	() => import("./plugin/draggable-block-plugin"),
	{ ssr: false }
);

const sampleData = `{"root":{"children":[{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"asdasdasdasdasdasdasd","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"link","version":1,"rel":"noreferrer","target":null,"title":null,"url":"https://"}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"sadasdasdasdaaa","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""}],"direction":null,"format":"","indent":0,"type":"root","version":1}}
`;

const MyEditor = () => {
	const [editorState, setEditorState] = useState<string>(sampleData);
	const [floatingElement, setFloatingElement] = useState<HTMLDivElement>();

	const onRef = (_element: HTMLDivElement | null) => {
		if (_element) {
			setFloatingElement(_element);
		}
	};

	function onChange(editorState: EditorState) {
		const editorStateJSON = editorState.toJSON();

		// However, we still have a JavaScript object, so we need to convert it to an actual string with JSON.stringify
		setEditorState(JSON.stringify(editorStateJSON));
	}

	const theme: EditorThemeClasses = {
		code: "editor-code",
		heading: {
			h1: "editor-heading-h1",
			h2: "editor-heading-h2",
			h3: "editor-heading-h3",
			h4: "editor-heading-h4",
			h5: "editor-heading-h5",
		},
		image: "editor-image",
		link: "editor-link",
		list: {
			listitem: "editor-listitem",
			nested: {
				listitem: "editor-nested-listitem",
			},
			ol: "editor-list-ol",
			ul: "editor-list-ul",
		},
		paragraph: "editor-paragraph",
		placeholder: "editor-placeholder",
		quote: "editor-quote",
		text: {
			bold: "editor-text-bold",
			code: "editor-text-code",
			hashtag: "editor-text-hashtag",
			italic: "editor-text-italic",
			overflowed: "editor-text-overflowed",
			strikethrough: "editor-text-strikethrough",
			underline: "editor-text-underline",
			underlineStrikethrough: "editor-text-underlineStrikethrough",
		},
	};

	const initialConfig: Readonly<{
		namespace: string;
		nodes?: ReadonlyArray<Klass<LexicalNode> | LexicalNodeReplacement>;
		onError: (error: Error, editor: LexicalEditor) => void;
		editable?: boolean;
		theme?: EditorThemeClasses;
		editorState?: InitialEditorStateType;
		html?: HTMLConfig;
	}> = {
		namespace: "MyEditor",
		theme,
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
		],
		// editorState,
	};

	function MyOnChangePlugin({
		onChange,
	}: {
		onChange: (editor: EditorState) => void;
	}) {
		// Access the editor through the LexicalComposerContext
		const [editor] = useLexicalComposerContext();
		// Wrap our listener in useEffect to handle the teardown and avoid stale references.
		useEffect(() => {
			// most listeners return a teardown function that can be called to clean them up.
			return editor.registerUpdateListener(({ editorState }) => {
				// call onChange here to pass the latest state up to the parent.

				onChange(editorState);
			});
		}, [editor, onChange]);
		return null;
	}

	function onError(error: any) {
		console.error(error);
	}

	// Catch any errors that occur during Lexical updates and log them
	// or throw them as needed. If you don't throw them, Lexical will
	// try to recover gracefully without losing user data.

	return (
		<LexicalComposer initialConfig={initialConfig}>
			<div className="editor-container">
				{/* <ToolbarPlugin /> */}
				<div className="editor-inner">
					<RichTextPlugin
						contentEditable={
							<div
								ref={(e) => {
									onRef(e);
								}}
							>
								<ContentEditable
									style={{
										padding: "16px 54px",
									}}
									className={"editor-input"}
									aria-placeholder={""}
									placeholder={
										<div className="editor-placeholder">
											{<div>Write somthing</div>}
										</div>
									}
								/>
							</div>
						}
						ErrorBoundary={LexicalErrorBoundary}
					/>
					<HistoryPlugin />
					<AutoFocusPlugin />
					<MyOnChangePlugin onChange={onChange} />
					<ListPlugin />
					<CodeHighlightShikiPlugin />
					<DraggableBlockPlugin anchorElem={floatingElement} />
					<LexicalAutoLinkPlugin />
					<LinkPlugin />
					<TabIndentationPlugin />
				</div>
				<FloatingToolbarPlugin />
				<FloatingEditLinkPlugin />
			</div>
		</LexicalComposer>
	);
};

export default MyEditor;
