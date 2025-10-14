import React from "react";
import { useState } from "react";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import CodeHighlightShikiPlugin from "./plugin/code-highlight-shiki-plugin";
import FloatingToolbarPlugin from "./plugin/floating-toolbar-plugin/floating-toolbar-plugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import dynamic from "next/dynamic";
import FloatingEditLinkPlugin from "./plugin/floating-edit-link-plugin/floating-edit-link-plugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import MarkDownShortcutPlugin from "./plugin/markdown-shortcut-plugin";
import ToolbarPlugin from "./plugin/toolbar-plugin/toolbar-plugin";
import ClickOutSidePlugin from "./plugin/click-outside-plugin";
import SelectionCustomPlugin from "./plugin/selection-custom-plugin";
import ImagePlugin from "./plugin/image-plugin";
import DragDropPaste from "./plugin/drag-drop-paste-plugin";
import { useToolbarState } from "@/contexts/toolbar-context";
import ComponentPickerPlugin from "./plugin/component-picker-plugin";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { SquareMenu } from "lucide-react";
import CodeActionMenuPlugin from "./plugin/code-action-plugin/code-action-pluin";

const DraggableBlockPlugin = dynamic(
	() => import("./plugin/draggable-plugin/draggable-block-plugin"),
	{ ssr: false }
);

const MyPlugin = () => {
	const { activeEditor } = useToolbarState();

	const [floatingAnchorElement, setFloatingAnchorElement] =
		useState<HTMLDivElement>();
	const [isEditLink, setIsEditLink] = useState(false);
	const [openMenuDrag, setOpenMenuDrag] = useState(false);
	const [openToolbar, setOpenToolbar] = useState(false);

	const onRef = (_element: HTMLDivElement | null) => {
		if (_element) {
			setFloatingAnchorElement(_element);
		}
	};

	return (
		<div className="editor-container">
			<ToolbarPlugin editor={activeEditor} />

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
				<AutoFocusPlugin defaultSelection={"rootStart"} />

				<ListPlugin />
				<CodeHighlightShikiPlugin />
				{/* <LexicalAutoLinkPlugin /> */}
				{/* <SelectionAlwaysOnDisplay /> */}
				<LinkPlugin />
				<MarkDownShortcutPlugin />
				<TabIndentationPlugin />
				<ImagePlugin />
				<DragDropPaste />
				<ComponentPickerPlugin />

				{floatingAnchorElement && (
					<>
						{!isEditLink && (
							<DraggableBlockPlugin
								anchorElem={floatingAnchorElement}
								openMenuDrag={openMenuDrag}
								setOpenMenuDrag={setOpenMenuDrag}
							/>
						)}
						<FloatingToolbarPlugin
							anchorElem={floatingAnchorElement}
							isEditLink={isEditLink}
							setIsEditLink={setIsEditLink}
							editor={activeEditor}
						/>
						<FloatingEditLinkPlugin
							anchorElem={floatingAnchorElement}
							isEditLink={isEditLink}
							setIsEditLink={setIsEditLink}
						/>
						{!openMenuDrag && (
							<ClickOutSidePlugin anchorElem={floatingAnchorElement} />
						)}
						<CodeActionMenuPlugin anchorElem={floatingAnchorElement} />
					</>
				)}
				<SelectionCustomPlugin />
			</div>
		</div>
	);
};

export default MyPlugin;
