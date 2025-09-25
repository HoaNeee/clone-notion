/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { Dispatch, useCallback, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { $isListItemNode, $isListNode } from "@lexical/list";
import {
  $createParagraphNode,
  $getNearestNodeFromDOMNode,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  ElementNode,
  LexicalEditor,
} from "lexical";
import { $createHeadingNode, $isHeadingNode } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { useToolbarState } from "@/contexts/toolbar-context";
import { $isCodeNode } from "@lexical/code";

interface Props {
  open?: boolean;
  setOpen?: Dispatch<boolean>;
  blockMenu?: () => void;
  editor?: LexicalEditor;
  cursorBlock?: HTMLElement;
  onClose?: () => void;
}

const DropdownMenuAction = (props: Props) => {
  const { open, setOpen, blockMenu, editor, cursorBlock, onClose } = props;
  const {
    toolbarState: {},
  } = useToolbarState();

  const updateToolbar = useCallback(() => {
    if (!editor || !open || !cursorBlock) {
      return;
    }

    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const content = selection.getTextContent();
        if (content) {
          return null;
        }
      }

      const node = $getNearestNodeFromDOMNode(cursorBlock);

      if (!node) {
        return null;
      }

      const block = node.getTopLevelElementOrThrow();

      if ($isElementNode(block)) {
        block.select();
      }
    });
  }, [editor, open, cursorBlock]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    updateToolbar();
  }, [updateToolbar, open, editor]);

  if (!editor) {
    return;
  }

  return (
    <DropdownMenu open={open} modal={false} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <span />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        alignOffset={-35}
        sideOffset={35}
        side="left"
        className="w-56 min-h-20 z-[9999]"
        onMouseDown={(e) => e.stopPropagation()}
        onMouseMove={(e) => {
          e.stopPropagation();
          blockMenu?.();
        }}
        onMouseOver={(e) => {
          e.stopPropagation();
        }}
      >
        <DropdownMenuLabel>Block</DropdownMenuLabel>
        <DropdownMenuRadioGroup defaultValue={"1"} value="1">
          <DropdownMenuRadioItem
            value="1"
            onClick={() => {
              editor.update(() => {
                if (!cursorBlock) {
                  return;
                }
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                  const content = selection.getTextContent();
                  if (content) {
                    $setBlocksType(selection, () => $createParagraphNode());
                    return;
                  }
                }

                const node = $getNearestNodeFromDOMNode(
                  cursorBlock,
                  editor._editorState
                );

                if (!node) {
                  return;
                }

                const block = node.getTopLevelElementOrThrow();
                const pNode = $createParagraphNode();
                if ($isHeadingNode(block)) {
                  pNode.append(...block.getChildren());
                  block.replace(pNode);
                } else if ($isListNode(block)) {
                  const firstNode = block.getFirstChildOrThrow();
                  if ($isListItemNode(firstNode)) {
                    pNode.append(...firstNode.getChildren());
                    firstNode.replace(pNode);
                  }
                }
              });
              onClose?.();
            }}
          >
            Normal
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value="2"
            onClick={() => {
              editor.update(() => {
                if (!cursorBlock) {
                  return;
                }
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                  const content = selection.getTextContent();
                  if (content) {
                    $setBlocksType(selection, () => $createHeadingNode("h1"));
                    return;
                  }
                }
                const node = $getNearestNodeFromDOMNode(
                  cursorBlock,
                  editor._editorState
                );

                if (!node) {
                  return;
                }

                const block = node.getTopLevelElementOrThrow();

                if ($isElementNode(block)) {
                  block.select();
                }

                if ($isListNode(block) && block.getChildren().length !== 1) {
                  // const firstNode = block.getFirstChildOrThrow();
                  // console.log(firstNode);
                  // if ($isListItemNode(firstNode)) {
                  //   pNode.append(...firstNode.getChildren());
                  //   firstNode.replace(pNode);
                  // }
                  return;
                }

                const newSelection = $getSelection();
                if ($isRangeSelection(newSelection)) {
                  $setBlocksType(newSelection, () => $createHeadingNode("h1"));
                }
              });
              onClose?.();
            }}
          >
            Heading 1
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DropdownMenuAction;
