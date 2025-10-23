import React, { useEffect } from "react";
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
import CodeActionMenuPlugin from "./plugin/code-action-plugin/code-action-pluin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import TableHoverActionsPlugin from "./plugin/table-hover-action-plugin";
import TableActionMenuPlugin from "./plugin/table-action-plugin";

const DraggableBlockPlugin = dynamic(
  () => import("./plugin/draggable-plugin/draggable-block-plugin"),
  { ssr: false }
);

const TableCellResizerPlugin = dynamic(
  () => import("./plugin/table-resizer-plugin"),
  { ssr: false }
);

const MyPlugin = ({ editable = true }: { editable?: boolean }) => {
  const {
    activeEditor,
    toolbarState: { blockType },
  } = useToolbarState();

  const [floatingAnchorElement, setFloatingAnchorElement] =
    useState<HTMLDivElement>();
  const [isEditLink, setIsEditLink] = useState(false);
  const [openMenuDrag, setOpenMenuDrag] = useState(false);

  const onRef = (_element: HTMLDivElement | null) => {
    if (_element) {
      setFloatingAnchorElement(_element);
    }
  };

  useEffect(() => {
    if (activeEditor) {
      activeEditor.setEditable(editable);
    }
  }, [editable, activeEditor]);

  return (
    <div className="editor-container">
      {editable && (
        <ToolbarPlugin editor={activeEditor} setIsEditLink={setIsEditLink} />
      )}
      <div className="max-w-4xl mx-auto w-full h-full relative bg-white">
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
                    {<div>Write somthing here..., press {"/"} for command</div>}
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
        <TablePlugin hasHorizontalScroll hasCellMerge />
        <TableCellResizerPlugin />

        {blockType !== "code" && <ComponentPickerPlugin />}

        {floatingAnchorElement && editable && (
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
            <TableHoverActionsPlugin anchorElem={floatingAnchorElement} />
            <TableActionMenuPlugin
              anchorElem={floatingAnchorElement}
              cellMerge
            />
          </>
        )}
        {floatingAnchorElement && (
          <CodeActionMenuPlugin anchorElem={floatingAnchorElement} />
        )}
        <SelectionCustomPlugin />
      </div>
    </div>
  );
};

export default MyPlugin;
