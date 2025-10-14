import type { JSX } from "react";

import { $isCodeNode, CodeNode, getLanguageFriendlyName } from "@lexical/code";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$getNearestNodeFromDOMNode,
	$getSelection,
	$isRangeSelection,
	isHTMLElement,
	LexicalEditor,
} from "lexical";
import { useEffect, useRef, useState } from "react";
import * as React from "react";
import { createPortal } from "react-dom";
import CopyButton from "./components/copy-button";
import { useDebounce } from "./utils";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, ChevronDown } from "lucide-react";
import { listLanguageCode } from "@/editor/utils";
import { formatCode } from "../toolbar-plugin/utils";
import { useToolbarState } from "@/contexts/toolbar-context";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { setFocusCaretSelectionWithNearestNodeFromCursorBlock } from "@/editor/utils/set-selection";
import { Input } from "@/components/ui/input";

const CODE_PADDING = 10;

interface Position {
	top: string;
	right: string;
}

const DropdownMenuLanguage = ({
	lang,
	open,
	setOpen,
	editor,
}: {
	lang: string;
	open: boolean;
	setOpen: (open: boolean) => void;
	editor: LexicalEditor;
}) => {
	const {
		toolbarState: { blockType, codeLanguage },
	} = useToolbarState();

	const [valueFilter, setValueFilter] = useState("");
	const [filteredListLanguageCode, setFilteredListLanguageCode] =
		useState(listLanguageCode);
	const [isFocusedInput, setFocusedInput] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(-1);

	const buttonTriggerRef = useRef<HTMLButtonElement>(null);

	const handleChangeLanguage = React.useCallback(
		(language: string) => {
			formatCode(editor, blockType, codeLanguage, language);
			setOpen(false);
			setValueFilter("");
			setSelectedIndex(-1);
		},
		[editor, blockType, codeLanguage, setOpen]
	);

	const updateSelectionToBlock = React.useCallback(() => {
		const buttonTrigger = buttonTriggerRef.current;

		if (!buttonTrigger) {
			return;
		}

		const { top } = buttonTrigger.getBoundingClientRect();
		const root = editor.getRootElement();

		if (!root) {
			return;
		}
		const nodes = root.childNodes;
		const nodeMaps = new Map<number, HTMLElement>();
		for (const node of nodes) {
			if (node instanceof HTMLElement) {
				const rect = node.getBoundingClientRect();
				let top = rect.top;
				nodeMaps.set(top, node);
				top += rect.height;
				nodeMaps.set(top, node);
			}
		}

		let cursorBlock = nodes[0] as HTMLElement;
		let minTop = Infinity;
		nodeMaps.forEach((value, key) => {
			const abs = Math.abs(key - top);
			if (minTop > abs) {
				cursorBlock = value;
				minTop = abs;
			}
		});

		let isCodeNode = false;
		editor.getEditorState().read(() => {
			const selection = $getSelection();
			if ($isRangeSelection(selection)) {
				const node = selection.anchor.getNode();
				const block = node.getTopLevelElement();
				if ($isCodeNode(block)) {
					isCodeNode = true;
				}
			}
		});

		if (!isCodeNode) {
			setFocusCaretSelectionWithNearestNodeFromCursorBlock(
				editor,
				cursorBlock,
				"end"
			);
		}
	}, [editor]);

	useEffect(() => {
		if (!valueFilter) {
			setFilteredListLanguageCode(listLanguageCode);
			return;
		}

		if (selectedIndex > 0) {
			setSelectedIndex(0);
		}

		const filter = valueFilter.toLowerCase();
		const result = listLanguageCode.filter(({ name, key }) => {
			return (
				name.toLowerCase().includes(filter) ||
				key.toLowerCase().includes(filter)
			);
		});

		setFilteredListLanguageCode(result);
	}, [valueFilter, selectedIndex]);

	const keyboardHandler = React.useCallback(
		(e: KeyboardEvent) => {
			if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter") {
				e.preventDefault();
				e.stopPropagation();
				setSelectedIndex((prevIndex) => {
					if (e.key === "ArrowDown") {
						return Math.min(prevIndex + 1, filteredListLanguageCode.length - 1);
					}
					if (e.key === "ArrowUp") {
						return Math.max(prevIndex - 1, 0);
					}
					if (e.key === "Enter") {
						const selectedLanguage = filteredListLanguageCode[prevIndex];
						if (selectedLanguage) {
							// console.log(selectedLanguage);
							handleChangeLanguage(selectedLanguage.key);
						}
					}
					return prevIndex;
				});
			}
		},
		[filteredListLanguageCode, handleChangeLanguage]
	);

	useEffect(() => {
		if (open) {
			updateSelectionToBlock();
			document.addEventListener("keydown", keyboardHandler);
		} else {
			document.removeEventListener("keydown", keyboardHandler);
		}

		return () => document.removeEventListener("keydown", keyboardHandler);
	}, [open, updateSelectionToBlock, keyboardHandler]);

	const dropdownItem = React.useCallback(
		({ key, name, index }: { key: string; name: string; index: number }) => {
			return (
				<button
					className={`capitalize cursor-pointer justify-between flex items-center w-full px-2 py-1.5 hover:bg-neutral-100 hover:text-black transition-colors rounded-sm ${
						selectedIndex === index ? "bg-neutral-100 text-black" : ""
					}`}
					key={key}
					onClick={() => handleChangeLanguage(key)}
				>
					{name}
					{codeLanguage === key ? (
						<Check size={16} className="text-neutral-600" />
					) : null}
				</button>
			);

			return (
				<DropdownMenuItem
					onClick={(e) => {
						// e.preventDefault();
						// e.stopPropagation();
						handleChangeLanguage(key);
						// setOpen(false);
					}}
					key={index}
					className="capitalize cursor-pointer justify-between flex items-center"
				>
					{name}
					{codeLanguage === key ? (
						<Check size={16} className="text-neutral-600" />
					) : null}
				</DropdownMenuItem>
			);
		},
		[codeLanguage, handleChangeLanguage, selectedIndex]
	);

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild className="text-xs" ref={buttonTriggerRef}>
				<button className="px-2 py-1 hover:bg-neutral-100 hover:text-black cursor-pointer transition-colors rounded-sm flex items-center gap-1 justify-between capitalize">
					{lang}
					<ChevronDown size={14} />
				</button>
			</DropdownMenuTrigger>

			<DropdownMenuContent
				align="start"
				className="text-sm min-w-40 not-ouside"
			>
				<div className="mb-2 mt-1 px-2">
					<input
						className="outline-1 px-2 py-1 rounded-sm focus:outline-ring"
						value={valueFilter}
						onChange={(e) => setValueFilter(e.target.value)}
						onFocus={() => {
							setFocusedInput(true);
						}}
						onBlur={() => {
							setFocusedInput(false);
						}}
					/>
				</div>
				<DropdownMenuGroup className="not-ouside">
					{filteredListLanguageCode.map(({ key, name }, index) =>
						dropdownItem({ key, name, index })
					)}
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

function CodeActionMenuContainer({
	anchorElem,
}: {
	anchorElem: HTMLElement;
}): JSX.Element {
	const [editor] = useLexicalComposerContext();

	const [lang, setLang] = useState("");
	const [isShown, setShown] = useState<boolean>(false);
	const [shouldListenMouseMove, setShouldListenMouseMove] =
		useState<boolean>(false);
	const [position, setPosition] = useState<Position>({
		right: "0",
		top: "0",
	});

	const [openDropdownLanguage, setOpenDropdownLanguage] = useState(false);

	const codeSetRef = useRef<Set<string>>(new Set());
	const codeDOMNodeRef = useRef<HTMLElement | null>(null);

	function getCodeDOMNode(): HTMLElement | null {
		return codeDOMNodeRef.current;
	}

	const debouncedOnMouseMove = useDebounce(
		(event: MouseEvent) => {
			const { codeDOMNode, isOutside } = getMouseInfo(event);
			if (isOutside) {
				setShown(false);
				return;
			}

			if (!codeDOMNode) {
				return;
			}

			// console.log(event);

			codeDOMNodeRef.current = codeDOMNode;

			let codeNode: CodeNode | null = null;
			let _lang = "";

			editor.update(() => {
				const maybeCodeNode = $getNearestNodeFromDOMNode(codeDOMNode);

				if ($isCodeNode(maybeCodeNode)) {
					codeNode = maybeCodeNode;
					_lang = codeNode.getLanguage() || "";
				}
			});

			if (codeNode) {
				const { y: editorElemY, right: editorElemRight } =
					anchorElem.getBoundingClientRect();
				const { y, right } = codeDOMNode.getBoundingClientRect();
				setLang(_lang);
				setShown(true);
				setPosition({
					right: `${editorElemRight - right + CODE_PADDING}px`,
					top: `${y - editorElemY + 4}px`,
				});
			}
		},
		50,
		1000
	);

	useEffect(() => {
		if (!shouldListenMouseMove) {
			return;
		}

		document.addEventListener("mousemove", debouncedOnMouseMove);

		return () => {
			setShown(false);
			debouncedOnMouseMove.cancel();
			document.removeEventListener("mousemove", debouncedOnMouseMove);
		};
	}, [shouldListenMouseMove, debouncedOnMouseMove]);

	useEffect(() => {
		return editor.registerMutationListener(
			CodeNode,
			(mutations) => {
				editor.getEditorState().read(() => {
					for (const [key, type] of mutations) {
						switch (type) {
							case "created":
								codeSetRef.current.add(key);
								break;

							case "destroyed":
								codeSetRef.current.delete(key);
								break;

							default:
								break;
						}
					}
				});
				setShouldListenMouseMove(codeSetRef.current.size > 0);
			},
			{ skipInitialization: false }
		);
	}, [editor]);

	const codeFriendlyName = getLanguageFriendlyName(lang);

	return (
		<>
			{isShown || openDropdownLanguage ? (
				<div
					className="code-action-menu-container absolute flex items-center gap-0 text-xs text-gray-500 not-outside"
					style={{ ...position }}
				>
					<DropdownMenuLanguage
						lang={codeFriendlyName}
						open={openDropdownLanguage}
						setOpen={setOpenDropdownLanguage}
						editor={editor}
					/>

					<CopyButton editor={editor} getDomNode={getCodeDOMNode} />
				</div>
			) : null}
		</>
	);
}

function getMouseInfo(event: MouseEvent): {
	codeDOMNode: HTMLElement | null;
	isOutside: boolean;
} {
	const target = event.target;

	if (isHTMLElement(target)) {
		const codeDOMNode = target.closest<HTMLElement>("code.editor-code");
		const isOutside = !(
			codeDOMNode ||
			target.closest<HTMLElement>("div.code-action-menu-container")
		);

		return { codeDOMNode, isOutside };
	} else {
		return { codeDOMNode: null, isOutside: true };
	}
}

export default function CodeActionMenuPlugin({
	anchorElem = document.body,
}: {
	anchorElem?: HTMLElement;
}): React.ReactPortal | null {
	return createPortal(
		<CodeActionMenuContainer anchorElem={anchorElem} />,
		anchorElem
	);
}
