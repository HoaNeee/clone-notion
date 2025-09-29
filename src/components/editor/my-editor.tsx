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
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import CodeHighlightShikiPlugin from "./plugin/code-highlight-shiki-plugin";
import FloatingToolbarPlugin from "./plugin/floating-toolbar-plugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { LinkNode, AutoLinkNode } from "@lexical/link";

import dynamic from "next/dynamic";
import FloatingEditLinkPlugin from "./plugin/floating-edit-link-plugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import MarkDownShortcutPlugin from "./plugin/markdown-shortcut-plugin";
import ToolbarPlugin from "./plugin/toolbar-plugin/toolbar-plugin";
import { ToolbarContext } from "@/contexts/toolbar-context";
import ClickOutSidePlugin from "./plugin/click-outside-plugin";

const DraggableBlockPlugin = dynamic(
	() => import("./plugin/draggable-plugin/draggable-block-plugin"),
	{ ssr: false }
);

const sampleData = `{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"The playground is a demo environment built with ","type":"text","version":1},{"detail":0,"format":16,"mode":"normal","style":"","text":"@lexical/react","type":"text","version":1},{"detail":0,"format":0,"mode":"normal","style":"","text":". Try typing in ","type":"text","version":1},{"detail":0,"format":1,"mode":"normal","style":"","text":"some text","type":"text","version":1},{"detail":0,"format":0,"mode":"normal","style":"","text":" with ","type":"text","version":1},{"detail":0,"format":2,"mode":"normal","style":"","text":"different","type":"text","version":1},{"detail":0,"format":0,"mode":"normal","style":"","text":" formats.","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Make sure to check out the various plugins in the toolbar. You can also use #hashtags or @-mentions too!","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"If you'd like to find out more about Lexical, you can:","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""},{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Visit the ","type":"text","version":1},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Lexical website","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"link","version":1,"rel":null,"target":null,"title":null,"url":"https://lexical.dev/"},{"detail":0,"format":0,"mode":"normal","style":"","text":" for documentation and more information.","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"listitem","version":1,"value":1},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Check out the code on our ","type":"text","version":1},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"GitHub repository","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"link","version":1,"rel":null,"target":null,"title":null,"url":"https://github.com/facebook/lexical"},{"detail":0,"format":0,"mode":"normal","style":"","text":".","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"listitem","version":1,"value":2},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Playground code can be found ","type":"text","version":1},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"here","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"link","version":1,"rel":null,"target":null,"title":null,"url":"https://github.com/facebook/lexical/tree/main/packages/lexical-playground"},{"detail":0,"format":0,"mode":"normal","style":"","text":".","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"listitem","version":1,"value":3},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Join our ","type":"text","version":1},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Discord Server","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"link","version":1,"rel":null,"target":null,"title":null,"url":"https://discord.com/invite/KmG4wQnnD9"},{"detail":0,"format":0,"mode":"normal","style":"","text":" and chat with the team.","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"listitem","version":1,"value":4}],"direction":null,"format":"","indent":0,"type":"list","version":1,"listType":"bullet","start":1,"tag":"ul"},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Lastly, we're constantly adding cool new features to this playground. So make sure you check back here when you next get a chance","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""}],"direction":null,"format":"","indent":0,"type":"root","version":1}}
`;

const MyEditor = () => {
	const [editorState, setEditorState] = useState<string>(sampleData);
	const [floatingAnchorElement, setFloatingAnchorElement] =
		useState<HTMLDivElement>();
	const [openningFloatingToolbar, setOpenningFloatingToolbar] = useState(false);
	const [isEditLink, setIsEditLink] = useState(false);
	const [openMenuDrag, setOpenMenuDrag] = useState(false);

	const onRef = (_element: HTMLDivElement | null) => {
		if (_element) {
			setFloatingAnchorElement(_element);
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
			lowercase: "editor-text-lowercase",
			uppercase: "editor-text-uppercase",
			capitalize: "editor-text-capitalize",
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
			QuoteNode,
		],
		editorState,
	};

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

	function onError(error: any) {
		console.error(error);
	}

	return (
		<>
			<LexicalComposer initialConfig={initialConfig}>
				<ToolbarContext>
					<div className="editor-container">
						<ToolbarPlugin />
						<div className="editor-inner max-w-4xl mx-auto">
							<RichTextPlugin
								contentEditable={
									<div
										ref={(e) => {
											onRef(e);
										}}
									>
										<ContentEditable
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
							{/* <LexicalAutoLinkPlugin /> */}
							<LinkPlugin />
							<MarkDownShortcutPlugin />
							<TabIndentationPlugin />
							{/* <SelectionAlwaysOnDisplay /> */}
							{floatingAnchorElement && (
								<>
									{!openningFloatingToolbar && !isEditLink && (
										<DraggableBlockPlugin
											anchorElem={floatingAnchorElement}
											openMenuDrag={openMenuDrag}
											setOpenMenuDrag={setOpenMenuDrag}
										/>
									)}
									<FloatingToolbarPlugin
										anchorElem={floatingAnchorElement}
										setOpenningFloatingToolbar={setOpenningFloatingToolbar}
										isEditLink={isEditLink}
										setIsEditLink={setIsEditLink}
									/>
									<FloatingEditLinkPlugin
										anchorElem={floatingAnchorElement}
										isEditLink={isEditLink}
										setIsEditLink={setIsEditLink}
									/>
									{!openMenuDrag && (
										<ClickOutSidePlugin
											anchorElem={floatingAnchorElement}
											openningFloatingToolbar={openningFloatingToolbar}
										/>
									)}
								</>
							)}
						</div>
					</div>
				</ToolbarContext>
			</LexicalComposer>
		</>
	);
};

export default MyEditor;
