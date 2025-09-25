import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createListItemNode,
  $createListNode,
  $isListItemNode,
  $isListNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListNode,
} from "@lexical/list";
import { $getNearestNodeOfType, mergeRegister } from "@lexical/utils";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_LOW,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  getDOMSelection,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from "lexical";
import { Dispatch, useCallback, useEffect, useRef, useState } from "react";
import {
  Bold,
  Code,
  Italic,
  Redo2,
  Strikethrough,
  TextAlignCenter,
  TextAlignEnd,
  TextAlignJustify,
  TextAlignStart,
  Underline,
  Undo2,
} from "lucide-react";
import { $createHeadingNode, $isHeadingNode } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import {
  $createCodeNode,
  $isCodeHighlightNode,
  $isCodeNode,
  CodeHighlightNode,
  CodeNode,
} from "@lexical/code";
import {
  $createLinkNode,
  $isLinkNode,
  TOGGLE_LINK_COMMAND,
} from "@lexical/link";
import { useToolbarState } from "@/contexts/toolbar-context";

function Divider() {
  return <div className="divider" />;
}

type ListHeading = "h1" | "h2" | "h3";
type ListTags = "ul" | "ol";
type ListLanguagesCode = "javascript" | "java" | "c++";

export default function ToolbarPlugin({
  showToolbar,
  setShowToolbar,
}: {
  showToolbar?: boolean;
  setShowToolbar?: Dispatch<boolean>;
}) {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const { toolbarState } = useToolbarState();

  const list: ListHeading[] = ["h1", "h2", "h3"];
  const listLanguageCode: ListLanguagesCode[] = ["c++", "java", "javascript"];

  function onClickHeading(tag: ListHeading) {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(tag));
      }
    });
  }

  const hideToolbar = () => {
    setShowToolbar?.(false);
  };

  return (
    <div className={"toolbar "} ref={toolbarRef}>
      <div className="flex items-center gap-3">
        <button
          className="toolbar-item spaced disabled:text-gray-300"
          onClick={() => {
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                $setBlocksType(selection, () => $createParagraphNode());
              }
            });
            hideToolbar();
          }}
        >
          A
        </button>
        {list.map((tag, index) => (
          <button
            key={index}
            className={`toolbar-item spaced disabled:text-gray-300 ${
              tag === toolbarState.blockType ? "text-pink-500" : ""
            }`}
            onClick={() => {
              onClickHeading(tag);
              hideToolbar();
            }}
          >
            {tag}
          </button>
        ))}
      </div>
      <button
        className={`toolbar-item spaced disabled:text-gray-300 ${
          toolbarState.blockType === "ul" ? "text-pink-500" : ""
        }`}
        onClick={() => {
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
          hideToolbar();
        }}
      >
        UL
      </button>
      <button
        className={`toolbar-item spaced disabled:text-gray-300 ${
          toolbarState.blockType === "ol" ? "text-pink-500" : ""
        }`}
        onClick={() => {
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
          hideToolbar();
        }}
      >
        OL
      </button>
      <button
        className={`toolbar-item spaced disabled:text-gray-300 ${
          toolbarState.blockType === "code" ? "text-pink-500" : ""
        }`}
        onClick={() => {
          editor.update(() => {
            let selection = $getSelection();
            if (!selection) {
              return;
            }
            if (!$isRangeSelection(selection) || selection.isCollapsed()) {
              $setBlocksType(selection, () => $createCodeNode("javascript"));
            } else {
              const textContent = selection.getTextContent();
              const codeNode = $createCodeNode("javascript");
              selection.insertNodes([codeNode]);
              selection = $getSelection();
              if ($isRangeSelection(selection)) {
                selection.insertRawText(textContent);
              }
            }
          });
        }}
      >
        Code block
      </button>
      <button
        disabled={!toolbarState.canUndo}
        onClick={() => {
          editor.dispatchCommand(UNDO_COMMAND, undefined);
        }}
        className="toolbar-item spaced disabled:text-gray-300"
        aria-label="Undo"
      >
        <Undo2 />
      </button>
      <button
        disabled={!toolbarState.canRedo}
        onClick={() => {
          editor.dispatchCommand(REDO_COMMAND, undefined);
        }}
        className="toolbar-item disabled:text-gray-300"
        aria-label="Redo"
      >
        <Redo2 />
      </button>
      <Divider />
      {!(toolbarState.blockType === "code") ? (
        <>
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
            }}
            className={
              "toolbar-item spaced " + (toolbarState.isBold ? "active" : "")
            }
            aria-label="Format Bold"
          >
            <Bold size={22} strokeWidth={2} />
          </button>
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
            }}
            className={
              "toolbar-item spaced " + (toolbarState.isItalic ? "active" : "")
            }
            aria-label="Format Italics"
          >
            <Italic size={22} />
          </button>
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
            }}
            className={
              "toolbar-item spaced " +
              (toolbarState.isUnderline ? "active" : "")
            }
            aria-label="Format Underline"
          >
            <Underline size={22} />
          </button>
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
            }}
            className={
              "toolbar-item spaced " +
              (toolbarState.isStrikethrough ? "active" : "")
            }
            aria-label="Format Strikethrough"
          >
            <Strikethrough size={22} />
          </button>
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code");
            }}
            className={
              "toolbar-item spaced " + (toolbarState.isCode ? "active" : "")
            }
            aria-label="Format CodeBlock"
          >
            <Code size={22} />
          </button>
          <button
            className={`toolbar-item spaced disabled:text-gray-300 ${
              toolbarState.isLink ? "text-pink-500" : ""
            }`}
            onClick={() => {
              if (toolbarState.isLink) {
                editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
              } else {
                editor.dispatchCommand(TOGGLE_LINK_COMMAND, "https://");
              }
            }}
          >
            Link
          </button>
          <Divider />
        </>
      ) : (
        <div className="flex items-center gap-2">
          {listLanguageCode.map((lang, index) => (
            <button
              key={index}
              className={`toolbar-item spaced capitalize ${
                toolbarState.codeLanguage === lang ? "text-pink-500" : ""
              }`}
              onClick={() => {
                editor.update(() => {
                  let selection = $getSelection();
                  if (!selection) {
                    return;
                  }
                  if (
                    !$isRangeSelection(selection) ||
                    selection.isCollapsed()
                  ) {
                    $setBlocksType(selection, () => $createCodeNode(lang));
                  } else {
                    const textContent = selection.getTextContent();
                    const codeNode = $createCodeNode(lang);
                    selection.insertNodes([codeNode]);
                    selection = $getSelection();
                    if ($isRangeSelection(selection)) {
                      selection.insertRawText(textContent);
                    }
                  }
                });
              }}
            >
              {lang}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left");
        }}
        className="toolbar-item spaced"
        aria-label="Left Align"
      >
        <TextAlignStart size={22} />
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center");
        }}
        className="toolbar-item spaced"
        aria-label="Center Align"
      >
        <TextAlignCenter size={22} />
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right");
        }}
        className="toolbar-item spaced"
        aria-label="Right Align"
      >
        <TextAlignEnd size={22} />
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "justify");
        }}
        className="toolbar-item"
        aria-label="Justify Align"
      >
        <TextAlignJustify size={22} />
      </button>{" "}
    </div>
  );
}
