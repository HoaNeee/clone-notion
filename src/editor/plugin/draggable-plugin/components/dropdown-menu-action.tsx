"use client";

import React, { Dispatch } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "../../../../components/ui/dropdown-menu";
import { LexicalEditor } from "lexical";
import { useToolbarState } from "@/contexts/toolbar-context";
import {
	deleteBlock,
	formatBulletList,
	formatCode,
	formatHeading,
	formatNumberedList,
	formatParagraph,
	formatQuote,
} from "../../toolbar-plugin/utils";
import { Braces, Check, Trash } from "lucide-react";
import DropdownMenuBlock from "../../../components/dropdown-menu-block";
import { useSelectionCustom } from "@/contexts/selection-custom-context";

interface Props {
	editor: LexicalEditor;
	open?: boolean;
	setOpen?: Dispatch<boolean>;
	lockMenu?: () => void;
	cursorBlock?: HTMLElement | null;
	onClose?: () => void;
	trigger?: React.ReactNode;
	align?: "start" | "center" | "end";
	alignOffset?: number;
	side?: "left" | "right" | "top" | "bottom" | undefined;
	sideOffset?: number;
}

const languages = ["javascript", "java", "c++"];

const DropdownMenuAction = (props: Props) => {
	const {
		open,
		setOpen,
		lockMenu,
		editor,
		onClose,
		trigger,
		align = "center",
		alignOffset = -35,
		side = "left",
		sideOffset = 25,
	} = props;
	const {
		toolbarState: { blockType, codeLanguage },
	} = useToolbarState();

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
				case "delete":
					deleteBlock(editor);
					break;
				default:
					break;
			}
		});
		onClose?.();
	}

	return (
		<DropdownMenu open={open} modal={false} onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild>
				{trigger ? trigger : <span />}
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align={align}
				alignOffset={alignOffset}
				sideOffset={sideOffset}
				side={side}
				className="w-56 min-h-20 z-[9999]"
				onMouseMove={(e) => {
					e.stopPropagation();
					lockMenu?.();
				}}
			>
				<DropdownMenuGroup>
					<DropdownMenuBlock onBlockChange={onBlockChange} />
					{blockType === "code" && (
						<DropdownMenuSub>
							<DropdownMenuSubTrigger className="ml-1 cursor-pointer">
								<div className="flex items-center gap-1">
									<Braces size={16} className="text-gray-500" />
									Language
								</div>
							</DropdownMenuSubTrigger>
							<DropdownMenuPortal>
								<DropdownMenuSubContent sideOffset={5} className="z-[10000]">
									{languages.map((lang, index) => (
										<DropdownMenuItem
											key={index}
											className="capitalize cursor-pointer justify-between flex"
											onClick={(e) => {
												e.preventDefault();
												e.stopPropagation();
												onClose?.();
												formatCode(editor, blockType, codeLanguage, lang);
											}}
										>
											{lang}
											{codeLanguage === lang && <Check />}
										</DropdownMenuItem>
									))}
								</DropdownMenuSubContent>
							</DropdownMenuPortal>
						</DropdownMenuSub>
					)}
				</DropdownMenuGroup>

				<DropdownMenuGroup>
					<DropdownMenuLabel className="text-neutral-600 text-sm font-medium capitalize">
						Actions
					</DropdownMenuLabel>
					<DropdownMenuItem
						onClick={() => onBlockChange("delete")}
						className="ml-1 cursor-pointer group"
					>
						<div className="flex items-center justify-between gap-1.5 w-full group-hover:text-destructive transition-colors">
							<div className="flex items-center gap-1 flex-1">
								<Trash className="hover:text-destructive" />
								Delete
							</div>
							<span className="text-gray-400">Del</span>
						</div>
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default DropdownMenuAction;
