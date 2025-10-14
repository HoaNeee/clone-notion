import React, { useEffect, useMemo, useState } from "react";
import {
	LexicalTypeaheadMenuPlugin,
	MenuOption,
	useBasicTypeaheadTriggerMatch,
} from "@lexical/react/LexicalTypeaheadMenuPlugin";
import { Baseline, LucideProps } from "lucide-react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$createParagraphNode,
	$getSelection,
	$isRangeSelection,
	LexicalEditor,
	TextNode,
} from "lexical";
import { createPortal } from "react-dom";
import { $setBlocksType } from "@lexical/selection";
import { $createHeadingNode, HeadingTagType } from "@lexical/rich-text";
import { $createCodeNode } from "@lexical/code";
import DialogInsertImage from "../components/dialog-insert-image";
import {
	INSERT_ORDERED_LIST_COMMAND,
	INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list";

class ComponentPickerOption extends MenuOption {
	title: string;
	icon:
		| React.ReactNode
		| React.ForwardRefExoticComponent<
				Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
		  >;
	keywords: string[];
	keyboardShortcut?: string;
	onSelect: (query: string) => void;

	constructor(
		title: string,
		options: {
			icon:
				| React.ReactNode
				| React.ForwardRefExoticComponent<
						Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
				  >;
			keywords?: string[];
			keyboardShortcut?: string;
			onSelect: (query: string) => void;
		}
	) {
		super(title);
		this.title = title;
		this.icon = options.icon;
		this.keywords = options.keywords || [];
		this.keyboardShortcut = options.keyboardShortcut;
		this.onSelect = options.onSelect;
	}
}

function getBaseOptions(
	editor: LexicalEditor,
	setShowModalInsertImage: React.Dispatch<React.SetStateAction<boolean>>
) {
	return [
		new ComponentPickerOption("Paragraph", {
			icon: Baseline,
			keywords: ["text", "normal"],
			onSelect: () => {
				editor.update(() => {
					const selection = $getSelection();
					if ($isRangeSelection(selection)) {
						$setBlocksType(selection, () => $createParagraphNode());
					}
				});
			},
		}),
		...["1", "2", "3"].map(
			(level) =>
				new ComponentPickerOption(`Heading ${level}`, {
					icon: Baseline,
					keywords: ["text", "heading"],
					onSelect: () => {
						editor.update(() => {
							const selection = $getSelection();
							if ($isRangeSelection(selection)) {
								const lv = `h${level}` as HeadingTagType;
								$setBlocksType(selection, () => $createHeadingNode(lv));
							}
						});
					},
				})
		),
		new ComponentPickerOption("Bulleted List", {
			icon: Baseline,
			keywords: ["list", "bullet", "ul"],
			onSelect: () => {
				editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
			},
		}),
		new ComponentPickerOption("Numbered List", {
			icon: Baseline,
			keywords: ["list", "numbered", "ol"],
			onSelect: () => {
				editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
			},
		}),
		new ComponentPickerOption("Code Block", {
			icon: Baseline,
			keywords: ["code", "block", "bash"],
			onSelect: () => {
				editor.update(() => {
					const selection = $getSelection();
					if ($isRangeSelection(selection)) {
						$setBlocksType(selection, () => $createCodeNode("javascript"));
					}
				});
			},
		}),
		new ComponentPickerOption("Image", {
			icon: Baseline,
			keywords: ["media", "image", "picture"],
			onSelect: () => {
				setShowModalInsertImage(true);
			},
		}),
	];
}

const ComponentPickerItem = ({
	index,
	onMouseDown,
	option,
	onClick,
	isSelected,
}: {
	index: number;
	option: ComponentPickerOption;
	onMouseDown: (e: React.MouseEvent) => void;
	onClick: (e: React.MouseEvent) => void;
	isSelected: boolean;
}) => {
	const Icon = option.icon as React.ForwardRefExoticComponent<
		Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
	>;

	const itemRef = React.useRef<HTMLLIElement>(null);

	useEffect(() => {
		if (isSelected && itemRef.current) {
			itemRef.current.scrollIntoView({ block: "nearest" });
		}
	}, [isSelected]);

	return (
		<li
			ref={itemRef}
			key={index}
			onMouseEnter={onMouseDown}
			onClick={onClick}
			className={`px-2 py-2 flex items-center gap-2 text-sm cursor-pointer hover:bg-neutral-200 hover:text-black ${
				isSelected ? "bg-neutral-200 text-black" : ""
			}`}
		>
			{Icon && <Icon size={18} />}
			{option.title}
		</li>
	);
};

const ComponentPickerPlugin = () => {
	const [editor] = useLexicalComposerContext();

	const [queryString, setQueryString] = useState<string | null>(null);
	const [showModalInsertImage, setShowModalInsertImage] = useState(false);

	const checkTrigger = useBasicTypeaheadTriggerMatch("/", {
		minLength: 0,
		allowWhitespace: true,
	});

	const options = useMemo(() => {
		const options = getBaseOptions(editor, setShowModalInsertImage);

		if (!queryString) {
			return options;
		}

		const regext = new RegExp(queryString, "i");
		return options.filter(
			(option) =>
				regext.test(option.title) ||
				option.keywords.some((keyword) => regext.test(keyword))
		);
	}, [editor, queryString]);

	const onSelectOption = (
		option: ComponentPickerOption,
		node: TextNode | null,
		closeMenu: () => void,
		queryString: string
	) => {
		editor.update(() => {
			node?.remove();
			option.onSelect(queryString);
			closeMenu();
		});
	};

	return (
		<>
			<LexicalTypeaheadMenuPlugin<ComponentPickerOption>
				onQueryChange={setQueryString}
				options={options}
				triggerFn={checkTrigger}
				onSelectOption={onSelectOption}
				menuRenderFn={(
					anchorElemRef,
					{
						selectOptionAndCleanUp,
						options,
						selectedIndex,
						setHighlightedIndex,
					}
				) => {
					if (anchorElemRef.current && options.length) {
						return createPortal(
							<div className="bg-white shadow-2xl rounded-md min-w-50 absolute not-outside overflow-hidden">
								<ul
									className="text-base flex flex-col overflow-y-auto max-h-50"
									style={{
										scrollbarWidth: "none",
									}}
								>
									{options.map((option, index) => {
										const isSelected = index === selectedIndex;

										return (
											<ComponentPickerItem
												key={index}
												index={index}
												option={option}
												onMouseDown={() => {}}
												onClick={() => {
													setHighlightedIndex(index);
													selectOptionAndCleanUp(option);
												}}
												isSelected={isSelected}
											/>
										);
									})}
								</ul>
							</div>,
							anchorElemRef.current
						);
					}

					return null;
				}}
			/>
			<DialogInsertImage
				open={showModalInsertImage}
				editor={editor}
				setOpen={setShowModalInsertImage}
			/>
		</>
	);
};

export default ComponentPickerPlugin;
