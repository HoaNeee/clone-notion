import {
  $createRangeSelection,
  $getNearestNodeFromDOMNode,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $setSelection,
  COMMAND_PRIORITY_LOW,
  DRAGOVER_COMMAND,
  DRAGSTART_COMMAND,
  DROP_COMMAND,
  KEY_DOWN_COMMAND,
  KEY_ESCAPE_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import { useCallback, useEffect } from "react";
import { mergeRegister } from "@lexical/utils";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useSelectionCustom } from "@/contexts/selection-custom-context";
import { $isListItemNode } from "@lexical/list";
import { useFloatingToolbar } from "@/contexts/floating-toolbar-context";
import { $isImageNode } from "../nodes/image-node";
import { $isCodeNode } from "@lexical/code";

const SelectionCustomPlugin = () => {
  const [editor] = useLexicalComposerContext();

  const { updateSelectionCustomState } = useSelectionCustom();
  const {
    floatingToolbarState: { openningFloatingToolbar },
    updateFloatingToolbarState,
  } = useFloatingToolbar();

  const $updateSelectionCustom = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const unionNode = new Set();
      const nodes = selection.getNodes();
      nodes.forEach((node) => {
        if ($isElementNode(node)) {
          const block = node.getTopLevelElementOrThrow();
          unionNode.add(block);
        }
      });

      if (unionNode.size > 1) {
        updateSelectionCustomState("isSelectionManyBlock", true);
      } else {
        updateSelectionCustomState("isSelectionManyBlock", false);
      }

      const listItemNode = nodes.filter((node) => $isListItemNode(node));
      updateSelectionCustomState(
        "isSelectionManyLineInListNode",
        listItemNode.length >= 2
      );

      // console.log(nodes);
    }
  }, [updateSelectionCustomState]);

  const $onEscape = useCallback(
    (e: KeyboardEvent) => {
      const root = editor.getRootElement();
      if (root === e.target) {
        if (openningFloatingToolbar) {
          updateFloatingToolbarState("openningFloatingToolbar", false);
          updateFloatingToolbarState("isSelectionHasTextContent", false);
        }
      }

      return false;
    },
    [openningFloatingToolbar, updateFloatingToolbarState, editor]
  );

  function $onDragStart() {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const textContent = selection.getTextContent();
      if (textContent) {
        return true;
      }
    }
    return false;
  }

  function $onDragOver(e: DragEvent) {
    //Do some thing here

    if (!canDrop(e)) {
      e.preventDefault();
    }

    return false;
  }

  function $onDrop(e: DragEvent) {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const node = selection.anchor.getNode();

      if ($isCodeNode(node) || $isCodeNode(node.getParent())) {
        return false;
      }

      const textContent = selection.getTextContent();
      if (textContent) {
        const range = getDragSelection(e);
        if (range !== null && e.dataTransfer && canDrop(e)) {
          selection.removeText();
          const rangeSelection = $createRangeSelection();
          rangeSelection.applyDOMRange(range);
          $setSelection(rangeSelection);
          rangeSelection.insertText(
            e.dataTransfer?.getData("text/plain") || ""
          );
        }

        return true;
      }
    }
    return false;
  }

  const $onKeydown = useCallback(
    (e: KeyboardEvent) => {
      let isHasTextContentInSelection = false;

      editor.getEditorState().read(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const textContent = selection.getTextContent();
          if (textContent) {
            isHasTextContentInSelection = true;
          }
        }
      });

      if (
        e.key === "b" &&
        (e.ctrlKey || e.metaKey) &&
        isHasTextContentInSelection
      ) {
        e.stopPropagation();
        e.preventDefault();
      }
      return false;
    },
    [editor]
  );

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(
          () => {
            $updateSelectionCustom();
          },
          { editor }
        );
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          $updateSelectionCustom();
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        $onEscape,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        DRAGSTART_COMMAND,
        $onDragStart,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        DRAGOVER_COMMAND,
        $onDragOver,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(DROP_COMMAND, $onDrop, COMMAND_PRIORITY_LOW),

      editor.registerCommand(KEY_DOWN_COMMAND, $onKeydown, COMMAND_PRIORITY_LOW)
    );
  }, [editor, $updateSelectionCustom, $onEscape, $onKeydown]);

  return null;
};

const getDragSelection = (e: DragEvent) => {
  const caretPostion = document.caretPositionFromPoint(e.clientX, e.clientY);

  if (caretPostion) {
    const { offsetNode, offset } = caretPostion;
    const range = document.createRange();
    range.setStart(offsetNode, offset);
    range.setEnd(offsetNode, offset);
    return range;
  }

  return null;
};

function canDrop(e: DragEvent) {
  if (e.target instanceof Node) {
    const node = $getNearestNodeFromDOMNode(e.target);

    if (!node || $isImageNode(node)) {
      return false;
    }
  }

  return true;
}

export default SelectionCustomPlugin;
