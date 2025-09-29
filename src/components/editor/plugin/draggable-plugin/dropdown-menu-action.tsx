"use client";

import React, { Dispatch, useEffect } from "react";
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
} from "../../../ui/dropdown-menu";
import { LexicalEditor } from "lexical";
import { useToolbarState } from "@/contexts/toolbar-context";
import { updateSelectionWithBlock } from "./utils";
import {
	deleteBlock,
	formatBulletList,
	formatCode,
	formatHeading,
	formatNumberedList,
	formatParagraph,
	formatQuote,
} from "../toolbar-plugin/utils";
import { Braces, Check, Trash } from "lucide-react";
import DropdownMenuBlock from "../../dropdown-menu-block";

interface Props {
	editor: LexicalEditor;
	open?: boolean;
	setOpen?: Dispatch<boolean>;
	lockMenu?: () => void;
	cursorBlock?: HTMLElement | null;
	onClose?: () => void;
}

const languages = ["javascript", "java", "c++"];

const DropdownMenuAction = (props: Props) => {
	const { open, setOpen, lockMenu, editor, cursorBlock, onClose } = props;
	const {
		toolbarState: { blockType, codeLanguage },
	} = useToolbarState();

	useEffect(() => {
		if (!editor || !open) {
			return;
		}

		updateSelectionWithBlock(editor, cursorBlock);
	}, [open, editor, cursorBlock]);

	function onBlockChange(blockName: string) {
		if (!editor) {
			return;
		}

		onClose?.();
		editor.update(() => {
			if (!cursorBlock) {
				return;
			}

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
					formatBulletList(editor, blockType);
					break;
				case "ol":
					formatNumberedList(editor, blockType);
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
	}

	return (
		<DropdownMenu open={open} modal={false} onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild>
				<span />
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="center"
				alignOffset={-35}
				sideOffset={35}
				side="left"
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
									{languages.map((lan, index) => (
										<DropdownMenuItem
											key={index}
											className="capitalize cursor-pointer justify-between flex"
											onClick={() => {
												onClose?.();
												formatCode(editor, blockType, codeLanguage, lan);
											}}
										>
											{lan}
											{codeLanguage === lan && <Check />}
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
