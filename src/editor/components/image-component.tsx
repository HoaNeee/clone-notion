/* eslint-disable @next/next/no-img-element */
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createParagraphNode,
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  $setSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  COMMAND_PRIORITY_NORMAL,
  DRAGSTART_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  LexicalEditor,
  NodeKey,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { mergeRegister } from "@lexical/utils";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import ImageResizer from "./image-resizer";
import { $isImageNode, ImageStatus } from "../nodes/image-node";
import { LexicalNestedComposer } from "@lexical/react/LexicalNestedComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { editorImageCaptionName } from "@/lib/contants";
import { useToolbarState } from "@/contexts/toolbar-context";
import { useFloatingToolbar } from "@/contexts/floating-toolbar-context";
import { postImage } from "@/utils/request";

interface ImageProps {
  src: string;
  altText: string;
  width: "inherit" | number;
  height: "inherit" | number;
  nodeKey: NodeKey;
  resizable: boolean;
  caption: LexicalEditor;
  showCaption: boolean;
  captionsEnable: boolean;
  maxWidth: number;
  status?: ImageStatus;
}

const useSuspenseImage = (props: ImageProps) => {
  const { status, nodeKey } = props;
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (status === "initial") {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isImageNode(node)) {
          node.setStatus("uploading");
        }
      });
    }

    async function uploadImage() {
      try {
        let file: File | null = null;

        editor.getEditorState().read(() => {
          const node = $getNodeByKey(nodeKey);
          if ($isImageNode(node)) {
            file = node.getCurrentFile() || null;
          }
        });

        if (!file) {
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));

        //fake upload
        //upload file here and get the src
        //const res = await postImage('thumbnail', file);
        //console.log(res);

        const src = URL.createObjectURL(file);

        //fake upload result
        const rand = Math.floor(Math.random() * 10);

        if (rand >= 2) {
          //set src here
          editor.update(() => {
            const node = $getNodeByKey(nodeKey);
            if ($isImageNode(node)) {
              node.setSrc(src || node.getSrc());
              node.setStatus("success");
            }
          });
        } else {
          throw new Error("Upload failed");
        }
      } catch (error) {
        console.log(error);
        editor.update(() => {
          const node = $getNodeByKey(nodeKey);
          if ($isImageNode(node)) {
            node.setStatus("failed");
          }
        });
      }
    }

    if (status === "uploading") {
      uploadImage();
    }
  }, [status, nodeKey, editor]);

  return null;
};

const LazyImage = (props: {
  src: string;
  altText: string;
  width: number | "inherit";
  height: number | "inherit";
  maxWidth: number;
  imageRef: { current: HTMLImageElement | null };
  status?: ImageStatus;
  className?: string;
}) => {
  const { src, altText, width, height, maxWidth, imageRef, status, className } =
    props;

  if (status === "uploading" || status === "initial") {
    return (
      <div className="relative">
        <img
          src={src}
          ref={imageRef}
          alt={altText}
          width={width}
          height={height}
          style={{ maxWidth: maxWidth }}
        />
        <div className="absolute bottom-0 right-0 z-20 text-white">
          Uploading
        </div>
        <div className="absolute bottom-0 right-0 z-19 w-full h-full bg-black/70" />
      </div>
    );
  }

  if (status === "failed") {
    return <>Error</>;
  }

  return (
    <img
      src={src}
      ref={imageRef}
      alt={altText}
      width={width}
      height={height}
      style={{ maxWidth: maxWidth }}
      className={className}
    />
  );
};

const ImageComponent = (props: ImageProps) => {
  const {
    src,
    altText,
    width,
    height,
    nodeKey,
    resizable,
    maxWidth,
    status,
    caption,
    captionsEnable,
    showCaption,
  } = props;
  const [editor] = useLexicalComposerContext();
  const [isSelected, setIsSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);
  useSuspenseImage(props);
  const {
    updateToolbarState,
    toolbarState: { isImageCaption },
  } = useToolbarState();

  const {
    floatingToolbarState: { openningFloatingToolbar },
    updateFloatingToolbarState,
  } = useFloatingToolbar();

  const [isResizing, setIsResizing] = useState(false);
  const [showCaptionState, setShowCaptionState] = useState(false);

  const editable = useMemo(() => editor && editor.isEditable(), [editor]);

  const imageRef = useRef<HTMLImageElement | null>(null);
  const btnCaptionRef = useRef<HTMLButtonElement | null>(null);
  const activeEditorRef = useRef<LexicalEditor | null>(null);
  const captionEditorRef = useRef<HTMLDivElement | null>(null);

  const isInNodeSelection = useMemo(() => {
    return (
      isSelected &&
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        return $isNodeSelection(selection) && selection.has(nodeKey);
      })
    );
  }, [editor, nodeKey, isSelected]);

  const onClick = useCallback(
    (e: MouseEvent) => {
      if (status !== "success") {
        return false;
      }

      if (isResizing) {
        return true;
      }

      const parent = imageRef.current?.parentElement;
      if (
        e.target === imageRef.current ||
        (parent && parent.contains(e.target as HTMLElement))
      ) {
        clearSelection();
        updateToolbarState("isImageNode", true);
        updateToolbarState("isImageCaption", false);
        updateFloatingToolbarState("openningFloatingToolbar", false);
        setIsSelected(true);

        const activeEditor = activeEditorRef.current;
        if (
          activeEditor &&
          activeEditor.getRootElement() === captionEditorRef.current
        ) {
          activeEditor.update(() => {
            $setSelection(null);
          });
        }

        return true;
      }

      return false;
    },
    [
      clearSelection,
      setIsSelected,
      isResizing,
      status,
      updateToolbarState,
      updateFloatingToolbarState,
    ]
  );

  const $onEnter = useCallback(
    (e: KeyboardEvent) => {
      if (!e.shiftKey) {
        if (isImageCaption) {
          e.preventDefault();
          const node = $getNodeByKey(nodeKey);
          if ($isImageNode(node)) {
            const parent = node.getParent();
            if (parent) {
              parent.insertAfter($createParagraphNode()).selectEnd();
            }
          }
          return true;
        } else if (isInNodeSelection && captionEditorRef.current && caption) {
          e.preventDefault();
          caption.focus();
          setIsSelected(false);
          updateToolbarState("isImageCaption", true);
          return true;
        } else if (!showCaption || !captionsEnable) {
          const btnCaption = btnCaptionRef.current;
          if (!btnCaption) {
            return false;
          }

          if (!btnCaption.classList.contains("focused")) {
            e.preventDefault();
            btnCaption.classList.add("focused");
            btnCaption.focus();
          }

          return true;
        }
      }

      return false;
    },
    [
      isImageCaption,
      nodeKey,
      isInNodeSelection,
      caption,
      setIsSelected,
      updateToolbarState,
      showCaption,
      captionsEnable,
    ]
  );
  const $onEscape = useCallback(
    (e: KeyboardEvent) => {
      const activeEditor = activeEditorRef.current;
      const captionEditor = captionEditorRef.current;
      if (!activeEditor || !captionEditor || !isImageCaption) {
        return false;
      }

      e.preventDefault();

      const root = activeEditor.getRootElement();
      if (root === captionEditor) {
        clearSelection();
        setIsSelected(true);
        activeEditor.blur();
        if (openningFloatingToolbar) {
          updateFloatingToolbarState("openningFloatingToolbar", false);
          updateFloatingToolbarState("canShow", false);
          updateFloatingToolbarState("isSelectionHasTextContent", false);
        }
        return true;
      }

      return false;
    },
    [
      isImageCaption,
      setIsSelected,
      clearSelection,
      openningFloatingToolbar,
      updateFloatingToolbarState,
    ]
  );

  const setShowCaption = useCallback(
    (value = true) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isImageNode(node)) {
          setShowCaptionState(value);
          node.setShowCaption(value);
        }
      });
    },
    [editor, nodeKey]
  );

  const $onBackSpace = useCallback(
    (e: KeyboardEvent) => {
      const activeEditor = activeEditorRef.current;

      if (!activeEditor) {
        return false;
      }

      const root = activeEditor.getRootElement();

      if (
        root === e.target &&
        captionEditorRef.current &&
        captionEditorRef.current === root
      ) {
        activeEditor.getEditorState().read(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const node = selection.anchor.getNode();
            const parent = node.getParent();
            if (node.getType() === "root") {
              setShowCaption(false);
              clearSelection();
              setIsSelected(true);
            } else if (parent) {
              const textContent = parent.getTextContent();
              if (!textContent) {
                setShowCaption(false);
                clearSelection();
                setIsSelected(true);
              }
            }
          }
        });
        return true;
      }

      return false;
    },
    [setShowCaption, clearSelection, setIsSelected]
  );

  useEffect(() => {
    if (!editable) {
      return;
    }

    return mergeRegister(
      editor.registerCommand(
        DRAGSTART_COMMAND,
        (e) => {
          if (e.target === imageRef.current && !isSelected) {
            e.preventDefault();
            return true;
          }

          return false;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor, isSelected, editable]);

  useEffect(() => {
    if (!editable) {
      return;
    }

    return mergeRegister(
      editor.registerCommand<MouseEvent>(
        CLICK_COMMAND,
        onClick,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_, _editor) => {
          activeEditorRef.current = _editor;
          return false;
        },
        COMMAND_PRIORITY_NORMAL
      ),
      editor.registerCommand(KEY_ENTER_COMMAND, $onEnter, COMMAND_PRIORITY_LOW),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        $onEscape,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        $onBackSpace,
        COMMAND_PRIORITY_LOW
      )
    );
  }, [
    editor,
    onClick,
    isImageCaption,
    $onEnter,
    $onEscape,
    $onBackSpace,
    editable,
  ]);

  useEffect(() => {
    if (showCaptionState && showCaption) {
      if (captionEditorRef.current) {
        captionEditorRef.current.focus();
        setShowCaptionState(false);
      }
    }
  }, [showCaptionState, nodeKey, showCaption, editor]);

  const onResizeStart = () => {
    setIsResizing(true);
  };

  const onResizeEnd = (
    width: "inherit" | number,
    height: "inherit" | number
  ) => {
    setIsResizing(false);

    editor.update(() => {
      const node = $getNodeByKey(nodeKey);

      if ($isImageNode(node)) {
        node.setWidthAndHeight(width, height);
      }
    });
  };

  const isFocused = (isSelected || isResizing) && status === "success";
  const draggable = (isFocused || isInNodeSelection) && status === "success";

  return (
    <Suspense fallback={null}>
      <>
        <div
          draggable={draggable}
          style={{ cursor: isFocused ? "grab" : "default" }}
        >
          <LazyImage
            width={width}
            height={height}
            maxWidth={maxWidth}
            altText={altText}
            src={src}
            imageRef={imageRef}
            status={status}
          />
        </div>

        {showCaption && (
          <div
            className={`${editorImageCaptionName}-container absolute bottom-0 left-0 w-full bg-white/70 py-2 overflow-hidden max-h-full`}
          >
            <LexicalNestedComposer initialEditor={caption}>
              <HistoryPlugin />
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    placeholder={
                      <div
                        className={`${editorImageCaptionName}__placeholder absolute top-1/2 transform -translate-y-1/2 left-0 ml-1 select-none pointer-events-none text-sm text-gray-800`}
                      >
                        Enter a caption...
                      </div>
                    }
                    aria-placeholder={""}
                    ref={captionEditorRef}
                    className={`${editorImageCaptionName} node-key-${nodeKey} w-full pl-1 text-sm outline-0 overflow-hidden`}
                  />
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
            </LexicalNestedComposer>
          </div>
        )}

        {resizable && isFocused && editable && (
          <ImageResizer
            editor={editor}
            imageRef={imageRef}
            onResizeStart={onResizeStart}
            onResizeEnd={onResizeEnd}
            maxWidth={maxWidth}
            setShowCaption={setShowCaption}
            showCaption={showCaption}
            captionEnable={captionsEnable}
            btnCaptionRef={btnCaptionRef}
            caption={caption}
          />
        )}
      </>
    </Suspense>
  );
};

export default ImageComponent;
