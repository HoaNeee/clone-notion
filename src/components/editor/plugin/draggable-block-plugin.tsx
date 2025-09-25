"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { DraggableBlockPlugin_EXPERIMENTAL } from "@lexical/react/LexicalDraggableBlockPlugin";
import { $createParagraphNode, $getNearestNodeFromDOMNode } from "lexical";
import { useEffect, useRef, useState } from "react";

import { GripVertical, Plus } from "lucide-react";
import DropdownMenuAction from "@/components/dropdown-menu-action";

// const DRAGGABLE_BLOCK_MENU_CLASSNAME = "draggable-block-menu";

export default function DraggableBlockPlugin({
  anchorElem = document.body,
}: {
  anchorElem?: HTMLElement;
}) {
  const [editor] = useLexicalComposerContext();
  const menuRef = useRef<HTMLDivElement>(null);
  const targetLineRef = useRef<HTMLDivElement>(null);
  const [draggableElement, setDraggableElement] = useState<HTMLElement | null>(
    null
  );
  const [positionMenu, setPositionMenu] = useState({ x: 0, y: 0 });
  const [open, setOpen] = useState(false);
  const [cursorBlock, setCursorBlock] = useState<HTMLElement | null>();
  const lockOpenRef = useRef(false);

  useEffect(() => {
    if (!open) {
      setCursorBlock(null);
    }
  }, [open]);

  function insertBlock(e: React.MouseEvent) {
    if (!draggableElement || !editor) {
      return;
    }

    editor.update(() => {
      const node = $getNearestNodeFromDOMNode(draggableElement);
      if (!node) {
        return;
      }

      const pNode = $createParagraphNode();
      if (e.altKey || e.ctrlKey) {
        node.insertBefore(pNode);
      } else {
        node.insertAfter(pNode);
      }
      pNode.select();
    });
  }

  const getTranslate = (element: HTMLDivElement) => {
    const style = window.getComputedStyle(element);
    const matrix = new DOMMatrixReadOnly(style.transform);
    return { x: matrix.m41, y: matrix.m42 };
  };

  function isOnMenu(_element: HTMLElement): boolean {
    if (open) {
      blockMenu();
    }

    return !!open;
  }

  function blockMenu() {
    if (menuRef.current) {
      menuRef.current.style.opacity = "1";
      menuRef.current.style.transform = `translate(${positionMenu.x}px, ${positionMenu.y}px)`;
    }
  }

  function showMenuAction() {
    if (!menuRef.current) {
      return;
    }
    const pos = getTranslate(menuRef.current);
    setPositionMenu(pos);
    setCursorBlock(draggableElement);
    setOpen(!open);
    lockOpenRef.current = !open;
  }

  const hideMenu = () => {
    lockOpenRef.current = false;
    setOpen(false);
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[9998] pointer-events-auto"
          onMouseEnter={(e) => e.stopPropagation()}
          onClick={hideMenu}
        ></div>
      )}

      <DraggableBlockPlugin_EXPERIMENTAL
        anchorElem={anchorElem}
        menuRef={menuRef}
        targetLineRef={targetLineRef}
        menuComponent={
          <div ref={menuRef} className="draggable-block-menu">
            <button
              title="Click to add below"
              className="icon icon-plus"
              onClick={insertBlock}
            >
              <Plus size={20} />
            </button>
            <button
              className={`icon ${open ? "bg-[#d4d4d4]" : ""}`}
              onClick={showMenuAction}
            >
              <GripVertical size={20} />
            </button>
            <DropdownMenuAction
              open={open}
              setOpen={() => {
                if (lockOpenRef.current) {
                  setOpen(true);
                } else {
                  hideMenu();
                }
              }}
              blockMenu={blockMenu}
              cursorBlock={cursorBlock as HTMLElement}
              editor={editor}
              onClose={hideMenu}
            />
          </div>
        }
        targetLineComponent={
          <div ref={targetLineRef} className="draggable-block-target-line" />
        }
        isOnMenu={isOnMenu}
        onElementChanged={(e) => {
          setDraggableElement(e);
        }}
      />
    </>
  );
}
