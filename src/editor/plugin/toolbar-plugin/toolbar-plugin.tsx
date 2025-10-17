import {
  ElementFormatType,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  LexicalEditor,
  REDO_COMMAND,
  UNDO_COMMAND,
} from "lexical";
import { Dispatch, useCallback, useRef, useState } from "react";
import {
  Bold,
  Check,
  ChevronDown,
  Code,
  FileImage,
  Italic,
  Link,
  Plus,
  Redo2,
  SquareMenu,
  Strikethrough,
  Table,
  TextAlignCenter,
  TextAlignEnd,
  TextAlignJustify,
  TextAlignStart,
  Underline,
  Undo2,
} from "lucide-react";
import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import {
  blockTypeToBlockName,
  useToolbarState,
} from "@/contexts/toolbar-context";
import {
  formatBulletList,
  formatCode,
  formatHeading,
  formatNumberedList,
  formatParagraph,
  formatQuote,
} from "./utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import DropdownMenuBlock from "@/editor/components/dropdown-menu-block";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getIconFromKeyBlock } from "@/utils/list-action";
import { Separator } from "@/components/ui/separator";
import { listLanguageCode } from "@/editor/utils";
import DialogInsertImage from "@/editor/components/dialog-insert-image";
import { useSelectionCustom } from "@/contexts/selection-custom-context";
import DialogInsertTable from "@/editor/components/dialog-insert-table";

type KeyBlock = keyof typeof blockTypeToBlockName;

function Divider() {
  return <Separator orientation="vertical" className="mx-1.5 min-h-6" />;
}

function DropdownToolbarBlock({
  blockType,
  editor,
  onClose,
}: {
  blockType: KeyBlock;
  editor: LexicalEditor;
  onClose: () => void;
}) {
  const Icon = getIconFromKeyBlock(blockType);

  const {
    selectionState: { isSelectionManyBlock, isSelectionManyLineInListNode },
  } = useSelectionCustom();

  function onBlockChange(blockName: string) {
    editor.update(() => {
      switch (blockName) {
        case "paragraph":
          formatParagraph(editor);
          break;
        case "h1":
          formatHeading(editor, blockType, "h1");
          break;
        case "h2":
          formatHeading(editor, blockType, "h2");
          break;
        case "h3":
          formatHeading(editor, blockType, "h3");
          break;
        case "ul":
          formatBulletList(
            editor,
            blockType,
            isSelectionManyBlock,
            isSelectionManyLineInListNode
          );
          break;
        case "ol":
          formatNumberedList(
            editor,
            blockType,
            isSelectionManyBlock,
            isSelectionManyLineInListNode
          );
          break;
        case "code":
          formatCode(editor, blockType);
          break;
        case "quote":
          formatQuote(editor, blockType);
          break;
        default:
          break;
      }
      onClose();
    });
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button size={"sm"} variant={"ghost"} className="">
          <div className="min-w-32 flex items-center justify-between font-normal capitalize">
            <div className="flex items-center gap-2">
              <Icon />
              <span>{blockTypeToBlockName[blockType as KeyBlock]} </span>
            </div>
            <ChevronDown className="" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-56 min-h-20 z-[9999] not-outside"
      >
        <DropdownMenuGroup>
          <DropdownMenuBlock
            onBlockChange={(blockType) => {
              onBlockChange(blockType);
            }}
            size="medium"
            selected="background"
          />
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const MenuFormatText = ({
  editor,
  onClose,
  setIsEditLink,
}: {
  editor: LexicalEditor;
  onClose: () => void;
  setIsEditLink: Dispatch<boolean>;
}) => {
  const {
    toolbarState: {
      isLink,
      blockType,
      codeLanguage,
      isBold,
      isItalic,
      isUnderline,
      isStrikethrough,
      isCode,
    },
  } = useToolbarState();

  if (blockType === "code") {
    return (
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button className={``} variant={"ghost"}>
            <div className="min-w-22 flex items-center justify-between font-normal capitalize">
              <div className="flex items-center gap-2">
                <span>{codeLanguage}</span>
              </div>
              <ChevronDown className="" />
            </div>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="not-outside min-w-36">
          <DropdownMenuGroup>
            {listLanguageCode.map(({ key, name }, index) => (
              <DropdownMenuItem
                key={index}
                className="text-base capitalize cursor-pointer justify-between"
                onClick={() => {
                  formatCode(editor, blockType, codeLanguage, key);
                  onClose();
                }}
              >
                {name}
                {codeLanguage === key && <Check className="" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  const cnActive = `bg-gray-200 hover:bg-gray-300`;

  return (
    <div className="flex items-center">
      <Button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
        }}
        variant={"ghost"}
        className={isBold ? cnActive : ""}
        aria-label="Format Bold"
      >
        <Bold size={22} strokeWidth={2} />
      </Button>
      <Button
        variant={"ghost"}
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
        }}
        className={isItalic ? cnActive : ""}
        aria-label="Format Italics"
      >
        <Italic size={22} />
      </Button>
      <Button
        variant={"ghost"}
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
        }}
        className={isUnderline ? cnActive : ""}
        aria-label="Format Underline"
      >
        <Underline size={22} />
      </Button>
      <Button
        variant={"ghost"}
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
        }}
        className={isStrikethrough ? cnActive : ""}
        aria-label="Format Strikethrough"
      >
        <Strikethrough size={22} />
      </Button>
      <Button
        variant={"ghost"}
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code");
        }}
        className={isCode ? cnActive : ""}
        aria-label="Format CodeBlock"
      >
        <Code size={22} />
      </Button>
      <Button
        className={isLink ? cnActive : ""}
        variant={"ghost"}
        onClick={() => {
          if (isLink) {
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
            setIsEditLink(false);
          } else {
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, "https://");
            setIsEditLink(true);
          }
        }}
      >
        <Link />
      </Button>
    </div>
  );
};

const DropdownMenuFormatAlign = ({
  editor,
  onClose,
}: {
  editor: LexicalEditor;
  onClose: () => void;
}) => {
  const {
    toolbarState: { elementFormat },
  } = useToolbarState();

  const aligns = [
    { COMAND: "left", ICON: TextAlignStart, LABEL: "Left Align" },
    { COMAND: "center", ICON: TextAlignCenter, LABEL: "Center Align" },
    { COMAND: "right", ICON: TextAlignEnd, LABEL: "Right Align" },
    { COMAND: "justify", ICON: TextAlignJustify, LABEL: "Justify Align" },
  ];

  const getItemActiveFromKey = (key: string) => {
    return aligns.find((item) => item.COMAND === key) || aligns[0];
  };

  const Icon = getItemActiveFromKey(elementFormat).ICON;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button className={``} variant={"ghost"}>
          <div className="min-w-32 flex items-center justify-between font-normal capitalize">
            <div className="flex items-center gap-2">
              <Icon />
              <span>{getItemActiveFromKey(elementFormat).LABEL}</span>
            </div>
            <ChevronDown className="" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-46 not-outside">
        <DropdownMenuGroup>
          {aligns.map(({ COMAND, ICON: Icon, LABEL }, index) => (
            <DropdownMenuItem
              key={index}
              onClick={() => {
                editor.dispatchCommand(
                  FORMAT_ELEMENT_COMMAND,
                  COMAND as ElementFormatType
                );
                onClose();
              }}
              className="cursor-pointer"
            >
              <Icon />
              {LABEL}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const DropdownMenuInsertSpecialBlock = ({
  editor,
  onClose,
}: {
  editor: LexicalEditor;
  onClose: () => void;
}) => {
  const [openDialogInsertImage, setOpenDialogInsertImage] = useState(false);
  const [openDialogInsertTable, setOpenDialogInsertTable] = useState(false);

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button className={`font-normal not-outside`} variant={"ghost"}>
            <Plus />
            <span>Insert</span>
            <ChevronDown className="" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-46 not-outside">
          <DropdownMenuGroup>
            <DropdownMenuItem
              className="text-base capitalize cursor-pointer"
              onClick={() => setOpenDialogInsertImage(true)}
            >
              <FileImage className="size-5" />
              Image
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-base capitalize cursor-pointer"
              onClick={() => setOpenDialogInsertTable(true)}
            >
              <Table className="size-5" />
              Table
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogInsertImage
        editor={editor}
        open={openDialogInsertImage}
        setOpen={setOpenDialogInsertImage}
        onCloseParent={onClose}
      />
      <DialogInsertTable
        open={openDialogInsertTable}
        setOpen={setOpenDialogInsertTable}
        editor={editor}
        onCloseParent={onClose}
      />
    </>
  );
};

const ToolbarComponent = ({
  editor,
  setIsEditLink,
}: {
  editor: LexicalEditor;
  setIsEditLink: Dispatch<boolean>;
}) => {
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const { toolbarState, updateToolbarState } = useToolbarState();

  const onClose = useCallback(() => {
    updateToolbarState("openToolbarPopover", false);
  }, [updateToolbarState]);

  return (
    <div className={"toolbar not-outside"} ref={toolbarRef}>
      <Button
        disabled={!toolbarState.canUndo}
        onClick={() => {
          editor.dispatchCommand(UNDO_COMMAND, undefined);
        }}
        size={"sm"}
        variant={"ghost"}
        aria-label="Undo"
      >
        <Undo2 />
      </Button>
      <Button
        disabled={!toolbarState.canRedo}
        onClick={() => {
          editor.dispatchCommand(REDO_COMMAND, undefined);
        }}
        size={"sm"}
        variant={"ghost"}
        aria-label="Redo"
      >
        <Redo2 />
      </Button>
      <Divider />
      <DropdownToolbarBlock
        blockType={toolbarState.blockType}
        editor={editor}
        onClose={onClose}
      />
      <Divider />
      <MenuFormatText
        editor={editor}
        onClose={onClose}
        setIsEditLink={setIsEditLink}
      />
      <Divider />
      <DropdownMenuInsertSpecialBlock editor={editor} onClose={onClose} />
      <Divider />
      <DropdownMenuFormatAlign editor={editor} onClose={onClose} />
    </div>
  );
};

export default function ToolbarPlugin({
  editor,
  setIsEditLink,
}: {
  editor: LexicalEditor;
  setIsEditLink: Dispatch<boolean>;
}) {
  const {
    toolbarState: { openToolbarPopover },
    updateToolbarState,
  } = useToolbarState();

  return (
    <Popover
      open={openToolbarPopover}
      onOpenChange={(val) => {
        updateToolbarState("openToolbarPopover", val);
      }}
    >
      <PopoverTrigger asChild className="not-outside">
        <Button
          className="top-14 fixed right-0 rounded-full"
          size={"icon"}
          variant={"outline"}
        >
          <SquareMenu />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="left" className="w-full p-0">
        <ToolbarComponent editor={editor} setIsEditLink={setIsEditLink} />
      </PopoverContent>
    </Popover>
  );
}
