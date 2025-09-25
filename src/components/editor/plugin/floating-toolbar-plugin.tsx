import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection, getDOMSelection } from "lexical";
import React, { useCallback, useEffect, useRef } from "react";
import { setFloatingElemPosition } from "../utils/set-floating-toolbar";
import { mergeRegister } from "@lexical/utils";
import { $isCodeNode } from "@lexical/code";
import { getDOMRangeRect } from "../utils/get-dom-range-rect";

const FloatingToolbarPlugin = () => {
  const floatingToolbarRef = useRef<HTMLDivElement | null>(null);
  const [editor] = useLexicalComposerContext();

  const $updateFloatingToolbar = useCallback(() => {
    const selection = $getSelection();

    if ($isRangeSelection(selection)) {
      const node = selection.anchor.getNode();
      const parent = node.getParent();

      if ($isCodeNode(node) || $isCodeNode(parent)) {
        if (floatingToolbarRef.current) {
          floatingToolbarRef.current.style.opacity = "0";
          floatingToolbarRef.current.style.transform = `translate(-10000px, -10000px)`;
        }
        return;
      }

      const nativeSelection = getDOMSelection(editor._window);
      const rootElement = editor.getRootElement();
      const content = selection.getTextContent();

      if (!rootElement || !floatingToolbarRef.current) {
        return;
      }

      if (content) {
        const rect = getDOMRangeRect({
          nativeSelection,
          rootElement,
        }) as DOMRect;

        setFloatingElemPosition(rect, floatingToolbarRef.current, rootElement);
      } else {
        floatingToolbarRef.current.style.opacity = "0";
        floatingToolbarRef.current.style.transform = `translate(-10000px, -10000px)`;
      }
    }
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(
          () => {
            $updateFloatingToolbar();
          },
          { editor }
        );
      })
    );
  }, [editor, $updateFloatingToolbar]);

  return (
    <div
      className="cursor-none bg-amber-500 absolute top-0 left-0 z-20 transition-opacity opacity-0 pointer-events-none"
      ref={floatingToolbarRef}
    >
      Floating toolbar
      <button
        onClick={() => {
          console.log("click");
        }}
      >
        Click
      </button>
    </div>
  );
};

export default FloatingToolbarPlugin;
