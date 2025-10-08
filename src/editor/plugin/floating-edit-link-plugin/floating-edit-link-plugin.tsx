import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$getSelection,
	$isLineBreakNode,
	$isRangeSelection,
	BaseSelection,
	COMMAND_PRIORITY_CRITICAL,
	COMMAND_PRIORITY_LOW,
	getDOMSelection,
	LexicalEditor,
	SELECTION_CHANGE_COMMAND,
} from "lexical";
import React, {
	Dispatch,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import { $isCodeNode } from "@lexical/code";
import {
	$createLinkNode,
	$isAutoLinkNode,
	$isLinkNode,
	TOGGLE_LINK_COMMAND,
} from "@lexical/link";
import { setFloatingElemPositionForLinkEditor } from "./utils";
import { getSelectedNode } from "../../utils/get-selected-node";
import { getDOMRangeRect } from "../../utils/get-dom-range-rect";
import { useToolbarState } from "@/contexts/toolbar-context";
import { setSelectionFromBaseSelection } from "../../utils/set-selection";
import {
	CircleCheck,
	CircleX,
	LucideProps,
	PencilLine,
	Trash,
} from "lucide-react";

function FloatingEditLink({
	anchorElem,
	editor,
	isLink,
	isEditLink,
	setIsEditLink,
}: {
	anchorElem?: HTMLElement;
	editor: LexicalEditor;
	isLink: boolean;
	isEditLink: boolean;
	setIsEditLink: Dispatch<boolean>;
}) {
	const floatingEditLinkRef = useRef<HTMLDivElement | null>(null);
	const editLinkRef = useRef<HTMLInputElement | null>(null);

	const [editedLinkUrl, setEditedLinkUrl] = useState("");
	const [linkUrl, setLinkUrl] = useState("");
	const [lastSelection, setLastSelection] = useState<
		BaseSelection | undefined
	>();

	const $updateFloatingEditLink = useCallback(() => {
		if (!floatingEditLinkRef.current || !anchorElem) {
			return;
		}

		if (isEditLink) {
			setIsEditLink(false);
		}

		const selection = $getSelection();

		if ($isRangeSelection(selection)) {
			const node = selection.anchor.getNode();
			const parent = $findMatchingParent(node, $isLinkNode);

			const floatingEditingLink = floatingEditLinkRef.current;

			if ($isCodeNode(node) || $isCodeNode(parent)) {
				hideFloatingEditLink();
				return;
			}

			const nativeSelection = getDOMSelection(editor._window);

			if ($isLinkNode(parent)) {
				const url = parent.getURL();
				setLinkUrl(url);
				setEditedLinkUrl(url);

				const rect = getDOMRangeRect({
					nativeSelection,
					rootElement: anchorElem,
				});

				setFloatingElemPositionForLinkEditor(
					rect,
					floatingEditingLink,
					anchorElem as HTMLElement
				);

				setLastSelection(selection);
			} else {
				hideFloatingEditLink();
				setIsEditLink(false);
			}
		} else {
			hideFloatingEditLink();
			setIsEditLink(false);
		}
	}, [editor, anchorElem, setIsEditLink, isEditLink]);

	useEffect(() => {
		return mergeRegister(
			editor.registerUpdateListener(({ editorState }) => {
				editorState.read(
					() => {
						$updateFloatingEditLink();
					},
					{ editor }
				);
			}),
			editor.registerCommand(
				SELECTION_CHANGE_COMMAND,
				() => {
					$updateFloatingEditLink();
					return true;
				},
				COMMAND_PRIORITY_LOW
			)
		);
	}, [editor, $updateFloatingEditLink]);

	useEffect(() => {
		if (isEditLink && editLinkRef.current) {
			editLinkRef.current.focus();
		}
	}, [isEditLink]);

	// useEffect(() => {
	// 	const floatingEditLink = floatingEditLinkRef.current;
	// 	const editLink = editLinkRef.current;
	// 	if (!editLink || !floatingEditLink) {
	// 		return;
	// 	}

	// 	const update = (e: FocusEvent) => {
	// 		console.log(e);
	// 	};

	// 	floatingEditLink.addEventListener("focusout", update);
	// 	// editLink.addEventListener("blur", update);

	// 	return () => {
	// 		floatingEditLink.removeEventListener("focusout", update);
	// 		// editLink.removeEventListener("blur", update);
	// 	};
	// }, [isLink, editor]);

	const monitorInputInteraction = (
		event: React.KeyboardEvent<HTMLInputElement>
	) => {
		if (event.key === "Enter") {
			handleLinkSubmission(event);
		} else if (event.key === "Escape") {
			event.preventDefault();
			setIsEditLink(false);
		}
	};

	const handleLinkSubmission = (
		event: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent<HTMLElement>
	) => {
		event.preventDefault();

		editor.update(() => {
			if (linkUrl !== "") {
				editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl);
				const selection = $getSelection();
				if ($isRangeSelection(selection)) {
					const parent = getSelectedNode(selection).getParent();
					if ($isAutoLinkNode(parent)) {
						const linkNode = $createLinkNode(parent.getURL(), {
							rel: parent.__rel,
							target: parent.__target,
							title: parent.__title,
						});
						parent.replace(linkNode, true);
					}
				}
			}
			setEditedLinkUrl("https://");
			setIsEditLink(false);
			setLastSelection(undefined);
		});
	};

	const hideFloatingEditLink = () => {
		if (floatingEditLinkRef.current) {
			floatingEditLinkRef.current.style.opacity = "0";
			floatingEditLinkRef.current.style.transform = `translate(-10000px, -10000px)`;
		}
	};

	function updateSelection() {
		if (lastSelection) {
			setSelectionFromBaseSelection(editor, lastSelection);
			setLastSelection(undefined);
		}
	}

	return (
		<div
			className={`absolute top-0 left-0 opacity-0 z-[9998] transition-opacity gap-3 floating-edit-link bg-white shadow-[0_5px_10px_#0000004d] rounded-md overflow-hidden`}
			ref={floatingEditLinkRef}
		>
			{!isLink ? null : isEditLink ? (
				<div className="flex py-3 px-1 w-100 justify-between">
					<input
						type="text"
						placeholder="enter url"
						ref={editLinkRef}
						className="py-2 px-4 bg-neutral-100 w-full rounded-md ml-2 break-all"
						value={linkUrl}
						onChange={(e) => {
							setLinkUrl(e.target.value);
						}}
						onKeyDown={monitorInputInteraction}
					/>
					<div className="flex items-center gap-2 px-2">
						<ButtonIcon
							onClick={() => {
								updateSelection();
								setIsEditLink(false);
							}}
							Icon={CircleX}
						/>
						<ButtonIcon onClick={handleLinkSubmission} Icon={CircleCheck} />
					</div>
				</div>
			) : (
				<div className="flex py-3 px-1 w-100 justify-between">
					<a
						type="text"
						href={editedLinkUrl}
						className="py-2 px-4 bg-white break-all text-blue-600 underline"
						target="_blank"
					>
						{editedLinkUrl}
					</a>
					<div className="flex items-center gap-2 px-2">
						<ButtonIcon Icon={PencilLine} onClick={() => setIsEditLink(true)} />
						<ButtonIcon
							Icon={Trash}
							onClick={() => {
								editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
							}}
						/>
					</div>
				</div>
			)}
		</div>
	);
}

const useFloatingEditLink = ({
	anchorElem,
	isEditLink,
	setIsEditLink,
}: {
	anchorElem?: HTMLElement;
	isEditLink: boolean;
	setIsEditLink: Dispatch<boolean>;
}) => {
	const [isLink, setIsLink] = useState(false);
	const [editor] = useLexicalComposerContext();
	const [activeEditor, setActiveEditor] = useState<LexicalEditor | undefined>();
	const { updateToolbarState } = useToolbarState();

	function $updateToolbar() {
		const selection = $getSelection();
		if ($isRangeSelection(selection)) {
			const focusNode = getSelectedNode(selection);
			const focusLinkNode = $findMatchingParent(focusNode, $isLinkNode);
			const focusAutoLinkNode = $findMatchingParent(focusNode, $isAutoLinkNode);
			if (!(focusLinkNode || focusAutoLinkNode)) {
				setIsLink(false);
				return;
			}
			const badNode = selection
				.getNodes()
				.filter((node) => !$isLineBreakNode(node))
				.find((node) => {
					const linkNode = $findMatchingParent(node, $isLinkNode);
					const autoLinkNode = $findMatchingParent(node, $isAutoLinkNode);
					return (
						(focusLinkNode && !focusLinkNode.is(linkNode)) ||
						(linkNode && !linkNode.is(focusLinkNode)) ||
						(focusAutoLinkNode && !focusAutoLinkNode.is(autoLinkNode)) ||
						(autoLinkNode &&
							(!autoLinkNode.is(focusAutoLinkNode) ||
								autoLinkNode.getIsUnlinked()))
					);
				});
			if (!badNode) {
				setIsLink(true);
			} else {
				setIsLink(false);
			}
		}
	}

	useEffect(() => {
		return mergeRegister(
			editor.registerUpdateListener(({ editorState }) => {
				editorState.read(() => {
					$updateToolbar();
				});
			}),
			editor.registerCommand(
				SELECTION_CHANGE_COMMAND,
				(_payload, newEditor) => {
					$updateToolbar();
					setActiveEditor(newEditor);
					return false;
				},
				COMMAND_PRIORITY_CRITICAL
			)
		);
	}, [editor]);

	useEffect(() => {
		updateToolbarState("isLink", isLink);
	}, [isLink, updateToolbarState]);

	return (
		<FloatingEditLink
			anchorElem={anchorElem}
			editor={activeEditor || editor}
			isLink={isLink}
			isEditLink={isEditLink}
			setIsEditLink={setIsEditLink}
		/>
	);
};

const FloatingEditLinkPlugin = ({
	anchorElem,
	isEditLink,
	setIsEditLink,
}: {
	anchorElem?: HTMLElement;
	isEditLink: boolean;
	setIsEditLink: Dispatch<boolean>;
}) => {
	return useFloatingEditLink({ anchorElem, isEditLink, setIsEditLink });
};

const ButtonIcon = ({
	Icon,
	size = 16,
	className,
	onClick,
	title,
}: React.ComponentProps<"button"> & {
	Icon: React.ForwardRefExoticComponent<
		Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
	>;
	size?: number;
	className?: string;
}) => {
	return (
		<button
			className={
				className
					? className
					: `size-6 rounded-md text-black cursor-pointer flex items-center justify-center hover:bg-gray-100`
			}
			onClick={onClick}
			title={title}
		>
			<Icon size={size} />
		</button>
	);
};

export default FloatingEditLinkPlugin;
