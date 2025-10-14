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
	$insertNodes,
	$isRangeSelection,
	CAN_REDO_COMMAND,
	CAN_UNDO_COMMAND,
	COMMAND_PRIORITY_CRITICAL,
	COMMAND_PRIORITY_LOW,
	ElementFormatType,
	FORMAT_ELEMENT_COMMAND,
	FORMAT_TEXT_COMMAND,
	getDOMSelection,
	LexicalEditor,
	REDO_COMMAND,
	SELECTION_CHANGE_COMMAND,
	UNDO_COMMAND,
} from "lexical";
import { Dispatch, useCallback, useEffect, useRef, useState } from "react";
import {
	Bold,
	ChevronDown,
	Code,
	FileImage,
	Image,
	ImageIcon,
	Italic,
	Link,
	Logs,
	Plus,
	Redo,
	Redo2,
	SquareMenu,
	Strikethrough,
	TextAlignCenter,
	TextAlignEnd,
	TextAlignJustify,
	TextAlignStart,
	Underline,
	Undo,
	Undo2,
} from "lucide-react";
import {
	$createHeadingNode,
	$isHeadingNode,
	$isQuoteNode,
} from "@lexical/rich-text";
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
import {
	blockTypeToBlockName,
	useToolbarState,
} from "@/contexts/toolbar-context";
import { formatCode } from "./utils";
import { $createImageNode } from "../../nodes/image-node";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
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
import { getIconFromKey } from "@/utils/key-blocks";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUploadComponent } from "@/components/file-upload-component";
import { listLanguageCode } from "@/editor/utils";
import DialogInsertImage from "@/editor/components/dialog-insert-image";

type KeyBlock = keyof typeof blockTypeToBlockName;

function Divider() {
	return <Separator orientation="vertical" className="mx-1.5 min-h-6" />;
}

function DropdownToolbarBlock({ blockType }: { blockType: KeyBlock }) {
	const Icon = getIconFromKey(blockType);

	return (
		<DropdownMenu modal={false}>
			<DropdownMenuTrigger asChild>
				<Button size={"sm"} variant={"ghost"} className="">
					<div className="font-normal capitalize justify-between flex min-w-32 items-center">
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
						onBlockChange={(type) => {
							console.log(type);
						}}
						size="medium"
						selected="background"
					/>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

const MenuFormatText = ({ editor }: { editor: LexicalEditor }) => {
	const {
		toolbarState: { isLink, blockType, codeLanguage },
	} = useToolbarState();

	if (blockType === "code") {
		return (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button className={``} variant={"ghost"}>
						<div className="font-normal capitalize justify-between flex min-w-22 items-center">
							<div className="flex items-center gap-2">
								<span>{codeLanguage}</span>
							</div>
							<ChevronDown className="" />
						</div>
					</Button>
				</DropdownMenuTrigger>

				<DropdownMenuContent>
					<DropdownMenuGroup>
						{listLanguageCode.map(({ key, name }, index) => (
							<DropdownMenuItem
								key={index}
								className="text-base capitalize cursor-pointer"
								onClick={() => {
									formatCode(editor, "", "", key);
								}}
							>
								{name}
							</DropdownMenuItem>
						))}
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		);
	}

	return (
		<div className="flex items-center">
			<Button
				onClick={() => {
					editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
				}}
				variant={"ghost"}
				className={``}
				aria-label="Format Bold"
			>
				<Bold size={22} strokeWidth={2} />
			</Button>
			<Button
				variant={"ghost"}
				onClick={() => {
					editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
				}}
				className={``}
				aria-label="Format Italics"
			>
				<Italic size={22} />
			</Button>
			<Button
				variant={"ghost"}
				onClick={() => {
					editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
				}}
				className={``}
				aria-label="Format Underline"
			>
				<Underline size={22} />
			</Button>
			<Button
				variant={"ghost"}
				onClick={() => {
					editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
				}}
				className={``}
				aria-label="Format Strikethrough"
			>
				<Strikethrough size={22} />
			</Button>
			<Button
				variant={"ghost"}
				onClick={() => {
					editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code");
				}}
				className={``}
				aria-label="Format CodeBlock"
			>
				<Code size={22} />
			</Button>
			<Button
				className={``}
				variant={"ghost"}
				onClick={() => {
					if (isLink) {
						editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
					} else {
						editor.dispatchCommand(TOGGLE_LINK_COMMAND, "https://");
					}
				}}
			>
				<Link />
			</Button>
		</div>
	);
};

const DropdownMenuFormatAlign = ({ editor }: { editor: LexicalEditor }) => {
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
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button className={``} variant={"ghost"}>
					<div className="font-normal capitalize justify-between flex min-w-32 items-center">
						<div className="flex items-center gap-2">
							<Icon />
							<span>{getItemActiveFromKey(elementFormat).LABEL}</span>
						</div>
						<ChevronDown className="" />
					</div>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="min-w-46">
				<DropdownMenuGroup>
					{aligns.map(({ COMAND, ICON: Icon, LABEL }, index) => (
						<DropdownMenuItem
							key={index}
							onClick={() => {
								editor.dispatchCommand(
									FORMAT_ELEMENT_COMMAND,
									COMAND as ElementFormatType
								);
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
}: {
	editor: LexicalEditor;
}) => {
	const [openDialogInsertImage, setOpenDialogInsertImage] = useState(false);

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button className={`font-normal`} variant={"ghost"}>
						<Plus />
						<span>Insert</span>
						<ChevronDown className="" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start" className="min-w-46">
					<DropdownMenuGroup>
						<DropdownMenuItem
							className="cursor-pointer text-base capitalize"
							onClick={() => setOpenDialogInsertImage(true)}
						>
							<FileImage className="size-5" />
							Image
						</DropdownMenuItem>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
			<DialogInsertImage
				editor={editor}
				open={openDialogInsertImage}
				setOpen={setOpenDialogInsertImage}
			/>
		</>
	);
};

const ToolbarComponent = ({ editor }: { editor: LexicalEditor }) => {
	const toolbarRef = useRef<HTMLDivElement | null>(null);
	const { toolbarState } = useToolbarState();

	return (
		<div className={"toolbar"} ref={toolbarRef}>
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
				className="toolbar-item disabled:text-gray-300"
				aria-label="Redo"
			>
				<Redo2 />
			</Button>
			<Divider />
			<DropdownToolbarBlock blockType={toolbarState.blockType} />
			<Divider />
			<MenuFormatText editor={editor} />
			<Divider />
			<DropdownMenuInsertSpecialBlock editor={editor} />
			<Divider />
			<DropdownMenuFormatAlign editor={editor} />
		</div>
	);
};

export default function ToolbarPlugin({ editor }: { editor: LexicalEditor }) {
	return (
		// <Popover>
		// 	<PopoverTrigger asChild className="not-outside">
		// 		<Button
		// 			className="fixed top-14 right-0 rounded-full"
		// 			size={"icon"}
		// 			variant={"outline"}
		// 		>
		// 			<SquareMenu />
		// 		</Button>
		// 	</PopoverTrigger>
		// 	<PopoverContent side="left" className="w-full p-0">
		// 	</PopoverContent>
		// </Popover>
		<ToolbarComponent editor={editor} />
	);
}
