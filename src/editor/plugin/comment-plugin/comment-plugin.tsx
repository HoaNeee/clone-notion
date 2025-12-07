import type { Provider } from "@lexical/yjs";
import type {
	EditorState,
	LexicalCommand,
	LexicalEditor,
	NodeKey,
	RangeSelection,
} from "lexical";
import type { JSX } from "react";
import type { Doc } from "yjs";

import {
	$createMarkNode,
	$getMarkIDs,
	$isMarkNode,
	$unwrapMarkNode,
	$wrapSelectionInMarkNode,
	MarkNode,
} from "@lexical/mark";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { ClearEditorPlugin } from "@lexical/react/LexicalClearEditorPlugin";
import { useCollaborationContext } from "@lexical/react/LexicalCollaborationContext";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { EditorRefPlugin } from "@lexical/react/LexicalEditorRefPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import { createDOMRange, createRectsFromDOMRange } from "@lexical/selection";
import { $isRootTextContentEmpty, $rootTextContent } from "@lexical/text";
import { mergeRegister, registerNestedElementResolver } from "@lexical/utils";
import {
	$getNodeByKey,
	$getSelection,
	$isRangeSelection,
	$isTextNode,
	CLEAR_EDITOR_COMMAND,
	COLLABORATION_TAG,
	COMMAND_PRIORITY_EDITOR,
	COMMAND_PRIORITY_NORMAL,
	createCommand,
	getDOMSelection,
	KEY_ESCAPE_COMMAND,
} from "lexical";
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import * as React from "react";
import { createPortal } from "react-dom";

import {
	Comment,
	Comments,
	CommentStore,
	createComment,
	createThread,
	createUID,
	Thread,
	useCommentStore,
} from "./commenting";
import ContentEditable from "../../components/ui/content-editable";
import CommentEditorTheme from "@/editor/theme/editor-comment-theme";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useNote } from "@/contexts/note-context";
import { del, post } from "@/utils/request";
import { logAction } from "@/lib/utils";
import { MessageSquareText, Send, Trash, Trash2 } from "lucide-react";
import AlertDialogConfirm from "@/components/alert-dialog-confirm";
import { TNotePermission } from "@/types/note.type";
import moment from "moment";

export const INSERT_INLINE_COMMAND: LexicalCommand<void> = createCommand(
	"INSERT_INLINE_COMMAND"
);

async function createThreadAPI(
	payload_thread: Partial<Thread>,
	payload_comment: Partial<Comment>,
	note_id: number
): Promise<{ thread: Thread; comment: Comment } | null> {
	try {
		const res = (await post(`/notes/${note_id}/threads/create`, {
			thread: payload_thread,
			comment: payload_comment,
		})) as {
			thread: Thread;
			comment: Comment;
		};
		return res || null;
	} catch (error) {
		logAction("Error creating thread:", error);
		return null;
	}
}

async function createCommentAPI(
	payload: Partial<Comment>,
	note_id: number
): Promise<Comment | null> {
	try {
		const res = (await post(`/notes/${note_id}/comments/create`, payload)) as {
			comment: Comment;
		};
		return res.comment || null;
	} catch (error) {
		logAction("Error creating thread:", error);
		return null;
	}
}

async function deleteCommentAPI(
	comment_id: number,
	note_id: number,
	author_id: number
) {
	try {
		await del(
			`/notes/${note_id}/comments/delete/${comment_id}?author_id=${author_id}`
		);
	} catch (error) {
		throw error;
	}
}

async function deleteThreadAPI(
	thread_id: number,
	note_id: number,
	author_id: number
) {
	try {
		await del(
			`/notes/${note_id}/threads/delete/${thread_id}?author_id=${author_id}`
		);
	} catch (error) {
		throw error;
	}
}

function AddCommentBox({
	anchorKey,
	editor,
	onAddComment,
}: {
	anchorKey: NodeKey;
	editor: LexicalEditor;
	onAddComment: () => void;
}): JSX.Element {
	const boxRef = useRef<HTMLDivElement>(null);

	const updatePosition = useCallback(() => {
		const boxElem = boxRef.current;
		const rootElement = editor.getRootElement();
		const anchorElement = editor.getElementByKey(anchorKey);

		if (boxElem !== null && rootElement !== null && anchorElement !== null) {
			const { right } = rootElement.getBoundingClientRect();
			const { top } = anchorElement.getBoundingClientRect();
			boxElem.style.left = `${right - 20}px`;
			boxElem.style.top = `${top - 30}px`;
		}
	}, [anchorKey, editor]);

	useEffect(() => {
		window.addEventListener("resize", updatePosition);

		return () => {
			window.removeEventListener("resize", updatePosition);
		};
	}, [editor, updatePosition]);

	useLayoutEffect(() => {
		updatePosition();
	}, [anchorKey, editor, updatePosition]);

	return (
		<div className="CommentPlugin_AddCommentBox" ref={boxRef}>
			<button
				className="CommentPlugin_AddCommentBox_button flex items-center justify-center text-secondary"
				onClick={onAddComment}
			>
				<MessageSquareText size={20} />
			</button>
		</div>
	);
}

function EscapeHandlerPlugin({
	onEscape,
}: {
	onEscape: (e: KeyboardEvent) => boolean;
}): null {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		return editor.registerCommand(
			KEY_ESCAPE_COMMAND,
			(event: KeyboardEvent) => {
				return onEscape(event);
			},
			COMMAND_PRIORITY_NORMAL
		);
	}, [editor, onEscape]);

	return null;
}

function PlainTextEditor({
	className,
	autoFocus,
	onEscape,
	onChange,
	editorRef,
	placeholder = "Type a comment...",
	placeholderClassName,
	disabled = false,
}: {
	autoFocus?: boolean;
	className?: string;
	editorRef?: { current: null | LexicalEditor };
	onChange: (editorState: EditorState, editor: LexicalEditor) => void;
	onEscape: (e: KeyboardEvent) => boolean;
	placeholder?: string;
	placeholderClassName?: string;
	disabled?: boolean;
}) {
	const initialConfig = {
		namespace: "Commenting",
		nodes: [],
		onError: (error: Error) => {
			throw error;
		},
		theme: CommentEditorTheme,
	};

	return (
		<LexicalComposer initialConfig={initialConfig}>
			<div
				className={`CommentPlugin_CommentInputBox_EditorContainer ${
					disabled ? "cursor-not-allowed pointer-events-none opacity-50" : ""
				}`}
			>
				<PlainTextPlugin
					contentEditable={
						<ContentEditable
							placeholder={placeholder}
							className={className}
							placeholderClassName={placeholderClassName}
						/>
					}
					ErrorBoundary={LexicalErrorBoundary}
				/>
				<OnChangePlugin onChange={onChange} />
				<HistoryPlugin />
				{autoFocus !== false && <AutoFocusPlugin />}
				<EscapeHandlerPlugin onEscape={onEscape} />
				<ClearEditorPlugin />
				{editorRef !== undefined && <EditorRefPlugin editorRef={editorRef} />}
			</div>
		</LexicalComposer>
	);
}

function useOnChange(
	setContent: (text: string) => void,
	setCanSubmit: (canSubmit: boolean) => void
) {
	return useCallback(
		(editorState: EditorState, _editor: LexicalEditor) => {
			editorState.read(() => {
				setContent($rootTextContent());
				setCanSubmit(!$isRootTextContentEmpty(_editor.isComposing(), true));
			});
		},
		[setCanSubmit, setContent]
	);
}

function CommentInputBox({
	editor,
	cancelAddComment,
	submitAddComment,
}: {
	cancelAddComment: () => void;
	editor: LexicalEditor;
	submitAddComment: (
		commentOrThread: Comment | Thread,
		isInlineComment: boolean,
		thread?: Thread,
		selection?: RangeSelection | null
	) => void;
}) {
	const [content, setContent] = useState("");
	const [canSubmit, setCanSubmit] = useState(false);
	const boxRef = useRef<HTMLDivElement>(null);
	const selectionState = useMemo(
		() => ({
			container: document.createElement("div"),
			elements: [],
		}),
		[]
	);
	const selectionRef = useRef<RangeSelection | null>(null);
	const author = useCollabAuthor();
	const note = useNote().currentNote;

	const updateLocation = useCallback(() => {
		editor.getEditorState().read(() => {
			const selection = $getSelection();

			if ($isRangeSelection(selection)) {
				selectionRef.current = selection.clone();
				const anchor = selection.anchor;
				const focus = selection.focus;
				const range = createDOMRange(
					editor,
					anchor.getNode(),
					anchor.offset,
					focus.getNode(),
					focus.offset
				);

				const boxElem = boxRef.current;
				if (range !== null && boxElem !== null) {
					const { left, bottom, width } = range.getBoundingClientRect();
					const selectionRects = createRectsFromDOMRange(editor, range);
					let correctedLeft =
						selectionRects.length === 1 ? left + width / 2 - 125 : left - 125;
					if (correctedLeft < 10) {
						correctedLeft = 10;
					}
					boxElem.style.left = `${correctedLeft}px`;
					boxElem.style.top = `${
						bottom +
						20 +
						(window.pageYOffset || document.documentElement.scrollTop)
					}px`;
					const selectionRectsLength = selectionRects.length;
					const { container } = selectionState;
					const elements: Array<HTMLSpanElement> = selectionState.elements;
					const elementsLength = elements.length;

					for (let i = 0; i < selectionRectsLength; i++) {
						const selectionRect = selectionRects[i];
						let elem: HTMLSpanElement = elements[i];
						if (elem === undefined) {
							elem = document.createElement("span");
							elements[i] = elem;
							container.appendChild(elem);
						}
						const color = "255, 212, 0";
						const style = `position:absolute;top:${
							selectionRect.top +
							(window.pageYOffset || document.documentElement.scrollTop)
						}px;left:${selectionRect.left}px;height:${
							selectionRect.height
						}px;width:${
							selectionRect.width
						}px;background-color:rgba(${color}, 0.3);pointer-events:none;z-index:5;`;
						elem.style.cssText = style;
					}
					for (let i = elementsLength - 1; i >= selectionRectsLength; i--) {
						const elem = elements[i];
						container.removeChild(elem);
						elements.pop();
					}
				}
			}
		});
	}, [editor, selectionState]);

	useLayoutEffect(() => {
		updateLocation();
		const container = selectionState.container;
		const body = document.body;
		if (body !== null) {
			body.appendChild(container);
			return () => {
				body.removeChild(container);
			};
		}
	}, [selectionState.container, updateLocation]);

	useEffect(() => {
		window.addEventListener("resize", updateLocation);

		return () => {
			window.removeEventListener("resize", updateLocation);
		};
	}, [updateLocation]);

	const onEscape = (event: KeyboardEvent): boolean => {
		event.preventDefault();
		cancelAddComment();
		return true;
	};

	const submitComment = async () => {
		if (canSubmit && note) {
			let quote = editor.getEditorState().read(() => {
				const selection = selectionRef.current;
				return selection ? selection.getTextContent() : "";
			});
			if (quote.length > 100) {
				quote = quote.slice(0, 99) + "…";
			}
			const note_id = note.id;

			const thread_payload: Partial<Thread> = {
				quote,
				ref_author_id: author.id,
			};
			const comment_payload: Partial<Comment> = {
				content,
				ref_author_id: author.id,
				author: author.name,
			};

			const res = await createThreadAPI(
				thread_payload,
				comment_payload,
				note_id
			);

			if (!res || !res.thread || !res.comment) {
				return;
			}

			const { thread: newThread, comment: newComment } = res;

			const thread = createThread(
				quote,
				note_id,
				author.id,
				[
					createComment(
						content,
						author.name,
						author.id,
						newThread.id.toString(),
						newComment.id.toString()
					),
				],
				newThread.id.toString()
			);

			submitAddComment(thread, true, undefined, selectionRef.current);
			selectionRef.current = null;
		}
	};

	const onChange = useOnChange(setContent, setCanSubmit);

	return (
		<div className="CommentPlugin_CommentInputBox" ref={boxRef}>
			<PlainTextEditor
				className="CommentPlugin_CommentInputBox_Editor"
				onEscape={onEscape}
				onChange={onChange}
			/>
			<div className="grid grid-cols-2 gap-2 p-2">
				<Button onClick={cancelAddComment} variant={"outline"}>
					Cancel
				</Button>
				<Button onClick={submitComment} disabled={!canSubmit}>
					Comment
				</Button>
			</div>
		</div>
	);
}

function CommentsComposer({
	submitAddComment,
	thread,
	placeholder,
	disabledInput = false,
}: {
	placeholder?: string;
	submitAddComment: (
		commentOrThread: Comment,
		isInlineComment: boolean,
		thread?: Thread
	) => void;
	thread?: Thread;
	disabledInput?: boolean;
}) {
	const [content, setContent] = useState("");
	const [canSubmit, setCanSubmit] = useState(false);
	const editorRef = useRef<LexicalEditor>(null);
	const { id: userId, name: author } = useCollabAuthor();

	const onChange = useOnChange(setContent, setCanSubmit);

	const submitComment = async () => {
		if (canSubmit) {
			if (!thread) {
				return;
			}

			const newComment = await createCommentAPI(
				{
					content,
					author,
					note_thread_id: thread.id.toString(),
				},
				thread.note_id
			);

			if (!newComment || newComment === null) {
				return;
			}

			const comment = createComment(
				content,
				author,
				userId,
				thread.id.toString(),
				newComment.id.toString()
			);
			submitAddComment(comment, false, thread);
			const editor = editorRef.current;
			if (editor !== null) {
				editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
			}
		}
	};

	return (
		<>
			<PlainTextEditor
				className="CommentPlugin_CommentsPanel_Editor"
				autoFocus={false}
				onEscape={() => {
					return true;
				}}
				onChange={onChange}
				editorRef={editorRef}
				placeholder={placeholder}
				placeholderClassName="text-sm top-3"
				disabled={disabledInput}
			/>

			<button
				className="absolute top-5 right-5 z-10 hover:not-disabled:cursor-pointer hover:not-disabled:text-primary text-secondary transition-colors rounded-sm p-1"
				onClick={submitComment}
				disabled={!canSubmit}
			>
				<Send size={18} className="" />
			</button>
		</>
	);
}

function CommentsPanelListComment({
	comment,
	deleteComment,
	thread,
	// rtf,
	showDelete = true,
}: {
	comment: Comment;
	deleteComment: (commentOrThread: Comment | Thread, thread?: Thread) => void;
	rtf: Intl.RelativeTimeFormat;
	thread?: Thread;
	showDelete?: boolean;
}): JSX.Element {
	const timestamp = comment.timestamp || new Date().toISOString();

	const time = moment(new Date(comment?.createdAt || timestamp)).fromNow();

	const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

	const handleDeleteComment = async () => {
		try {
			await deleteCommentAPI(
				Number(comment.id),
				Number(thread?.note_id || 0),
				Number(comment.ref_author_id)
			);
			deleteComment(comment, thread);
			setOpenDeleteDialog(false);
		} catch (error) {
			logAction("Error deleting comment:", error);
		}
	};

	return (
		<li className="CommentPlugin_CommentsPanel_List_Comment group relative">
			<div className="CommentPlugin_CommentsPanel_List_Details">
				<span className="CommentPlugin_CommentsPanel_List_Comment_Author">
					{comment.author}
				</span>
				<span className="CommentPlugin_CommentsPanel_List_Comment_Time">
					· {time}
				</span>
			</div>
			<p
				className={
					comment.deleted ? "CommentPlugin_CommentsPanel_DeletedComment" : ""
				}
			>
				{comment.deleted ? "[Deleted Comment]" : comment.content}
			</p>
			{!comment.deleted && showDelete && (
				<>
					<AlertDialogConfirm
						open={openDeleteDialog}
						setOpen={setOpenDeleteDialog}
						trigger={
							<Button
								onClick={() => {}}
								className="absolute top-1/2 transform -translate-y-1/2 right-4 size-6 text-secondary group-hover:opacity-100 opacity-0 transition-opacity group-hover:pointer-events-auto pointer-events-none rounded-sm"
								variant={"ghost"}
							>
								<Trash2 />
							</Button>
						}
						title="Delete Comment"
						description="Are you sure you want to delete this comment?"
						dialogType="column"
						okButton={
							<Button
								variant={"destructive"}
								className="opacity-80"
								onClick={handleDeleteComment}
							>
								Delete
							</Button>
						}
					/>
				</>
			)}
		</li>
	);
}

function CommentsPanelList({
	activeIDs,
	comments,
	deleteCommentOrThread,
	listRef,
	submitAddComment,
	markNodeMap,
	disabledInput = false,
}: {
	activeIDs: Array<string>;
	comments: Comments;
	deleteCommentOrThread: (
		commentOrThread: Comment | Thread,
		thread?: Thread
	) => void;
	listRef: { current: null | HTMLUListElement };
	markNodeMap: Map<string | number, Set<NodeKey>>;
	submitAddComment: (
		commentOrThread: Comment | Thread,
		isInlineComment: boolean,
		thread?: Thread
	) => void;
	disabledInput?: boolean;
}): JSX.Element {
	const [editor] = useLexicalComposerContext();
	const [counter, setCounter] = useState(0);

	const author = useCollabAuthor();

	const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

	const rtf = useMemo(
		() =>
			new Intl.RelativeTimeFormat("en", {
				localeMatcher: "best fit",
				numeric: "auto",
				style: "short",
			}),
		[]
	);

	useEffect(() => {
		// Used to keep the time stamp up to date
		const id = setTimeout(() => {
			setCounter(counter + 1);
		}, 10000);

		return () => {
			clearTimeout(id);
		};
	}, [counter]);

	return (
		<ul className="CommentPlugin_CommentsPanel_List" ref={listRef}>
			{comments.map((commentOrThread) => {
				let showDelete = false;

				const id = commentOrThread.id;
				if (commentOrThread.type === "thread") {
					showDelete = (commentOrThread as Thread).ref_author_id === author.id;

					const handleClickThread = () => {
						const markNodeKeys = markNodeMap.get(id);
						if (
							markNodeKeys !== undefined &&
							(activeIDs === null || activeIDs.indexOf(id) === -1)
						) {
							const activeElement = document.activeElement;
							// Move selection to the start of the mark, so that we
							// update the UI with the selected thread.
							editor.update(
								() => {
									const markNodeKey = Array.from(markNodeKeys)[0];
									const markNode = $getNodeByKey<MarkNode>(markNodeKey);
									if ($isMarkNode(markNode)) {
										markNode.selectStart();
									}
								},
								{
									onUpdate() {
										// Restore selection to the previous element
										if (activeElement !== null) {
											(activeElement as HTMLElement).focus();
										}
									},
									//
									tag: [COLLABORATION_TAG],
								}
							);
						}
					};

					const handleDeleteThread = async () => {
						try {
							await deleteThreadAPI(
								Number((commentOrThread as Thread).id),
								Number((commentOrThread as Thread).note_id),
								Number((commentOrThread as Thread).ref_author_id)
							);
							deleteCommentOrThread(commentOrThread);
							setOpenDeleteDialog(false);
						} catch (error) {
							logAction("Error deleting thread:", error);
						}
					};

					return (
						<li
							key={id}
							onClick={handleClickThread}
							className={`CommentPlugin_CommentsPanel_List_Thread ${
								markNodeMap.has(id) ? "interactive" : ""
							} ${activeIDs.indexOf(id) === -1 ? "" : "active"}`}
						>
							<div className="CommentPlugin_CommentsPanel_List_Thread_QuoteBox group relative">
								<blockquote className="CommentPlugin_CommentsPanel_List_Thread_Quote">
									{"> "}
									<span>{commentOrThread.quote}</span>
								</blockquote>
								{/* INTRODUCE DELETE THREAD HERE*/}
								{showDelete ? (
									<AlertDialogConfirm
										open={openDeleteDialog}
										setOpen={setOpenDeleteDialog}
										trigger={
											<Button
												className="absolute top-2 right-4 size-6 text-secondary group-hover:opacity-100 opacity-0 transition-opacity group-hover:pointer-events-auto pointer-events-none rounded-sm"
												variant={"ghost"}
												size={"sm"}
											>
												<Trash />
											</Button>
										}
										title="Delete Thread"
										description="Are you sure you want to delete this thread? All comments associated with this thread will also be deleted."
										dialogType="column"
										okButton={
											<Button
												variant={"destructive"}
												className="opacity-80"
												onClick={handleDeleteThread}
											>
												Delete
											</Button>
										}
									/>
								) : null}
							</div>
							<ul className="CommentPlugin_CommentsPanel_List_Thread_Comments">
								{commentOrThread.comments.map((comment) => (
									<CommentsPanelListComment
										key={comment.id}
										comment={comment}
										deleteComment={deleteCommentOrThread}
										thread={commentOrThread}
										rtf={rtf}
										showDelete={showDelete}
									/>
								))}
							</ul>
							<div className="CommentPlugin_CommentsPanel_List_Thread_Editor">
								<CommentsComposer
									submitAddComment={submitAddComment}
									thread={commentOrThread}
									placeholder="Reply to comment..."
									disabledInput={disabledInput}
								/>
							</div>
						</li>
					);
				}

				showDelete = (commentOrThread as Comment).ref_author_id === author.id;

				return (
					<CommentsPanelListComment
						key={id}
						comment={commentOrThread}
						deleteComment={deleteCommentOrThread}
						rtf={rtf}
						showDelete={showDelete}
					/>
				);
			})}
		</ul>
	);
}

function CommentsPanel({
	activeIDs,
	deleteCommentOrThread,
	comments,
	submitAddComment,
	markNodeMap,
	disabledInput,
}: {
	activeIDs: Array<string>;
	comments: Comments;
	deleteCommentOrThread: (
		commentOrThread: Comment | Thread,
		thread?: Thread
	) => void;
	markNodeMap: Map<string, Set<NodeKey>>;
	submitAddComment: (
		commentOrThread: Comment | Thread,
		isInlineComment: boolean,
		thread?: Thread
	) => void;
	disabledInput?: boolean;
}): JSX.Element {
	const listRef = useRef<HTMLUListElement>(null);
	const isEmpty = comments.length === 0;

	return (
		<div className="CommentPlugin_CommentsPanel relative">
			<h2 className="p-2 border-b font-semibold text-xl">Comments</h2>
			{isEmpty ? (
				<div className="CommentPlugin_CommentsPanel_Empty">No Comments</div>
			) : (
				<CommentsPanelList
					activeIDs={activeIDs}
					comments={comments}
					deleteCommentOrThread={deleteCommentOrThread}
					listRef={listRef}
					submitAddComment={submitAddComment}
					markNodeMap={markNodeMap}
					disabledInput={disabledInput}
				/>
			)}
		</div>
	);
}

function useCollabAuthor(): { name: string; id: number } {
	const { user } = useAuth().state;
	// const collabContext = useCollaborationContext();
	// const { yjsDocMap, name } = collabContext;

	// return yjsDocMap.has("comments")
	// 	? {
	// 			name,
	// 			id: Math.floor(Math.random() * 1000000),
	// 	  }
	// 	: {
	// 			name: user?.fullname || "Anonymous",
	// 			id: user?.id || 0,
	// 	  };

	return {
		name: user?.fullname || "Anonymous",
		id: user?.id || Number(createUID(true)),
	};
}

export default function CommentPlugin({
	providerFactory,
	permissionInNote,
}: {
	providerFactory?: (id: string, yjsDocMap: Map<string, Doc>) => Provider;
	permissionInNote?: TNotePermission;
}): JSX.Element {
	const { threadComments, showThreadComments, setShowThreadComments } =
		useNote();

	const collabContext = useCollaborationContext();
	const [editor] = useLexicalComposerContext();
	const commentStore = useMemo(
		() => new CommentStore(editor, threadComments),
		[editor, threadComments]
	);
	const comments = useCommentStore(commentStore);
	const markNodeMap = useMemo<Map<string, Set<NodeKey>>>(() => {
		return new Map();
	}, []);
	const [activeAnchorKey, setActiveAnchorKey] = useState<NodeKey | null>();
	const [activeIDs, setActiveIDs] = useState<Array<string>>([]);
	const [showCommentInput, setShowCommentInput] = useState(false);

	const { yjsDocMap } = collabContext;

	useEffect(() => {
		if (providerFactory) {
			const provider = providerFactory("comments", yjsDocMap);
			return commentStore.registerCollaboration(provider);
		}
	}, [commentStore, providerFactory, yjsDocMap]);

	const cancelAddComment = useCallback(() => {
		editor.update(() => {
			const selection = $getSelection();
			// Restore selection
			if (selection !== null) {
				selection.dirty = true;
			}
		});
		setShowCommentInput(false);
	}, [editor]);

	const deleteCommentOrThread = useCallback(
		(comment: Comment | Thread, thread?: Thread) => {
			if (comment.type === "comment") {
				const deletionInfo = commentStore.deleteCommentOrThread(
					comment,
					thread
				);
				if (!deletionInfo) {
					return;
				}
				const { markedComment, index } = deletionInfo;
				commentStore.addComment(markedComment, thread, index);
			} else {
				commentStore.deleteCommentOrThread(comment);
				// Remove ids from associated marks
				const id = thread !== undefined ? thread.id : comment.id;
				const markNodeKeys = markNodeMap.get(id);
				if (markNodeKeys !== undefined) {
					// Do async to avoid causing a React infinite loop
					setTimeout(() => {
						editor.update(() => {
							for (const key of markNodeKeys) {
								const node: null | MarkNode = $getNodeByKey(key);
								if ($isMarkNode(node)) {
									node.deleteID(id);
									if (node.getIDs().length === 0) {
										$unwrapMarkNode(node);
									}
								}
							}
						});
					});
				}
			}
		},
		[commentStore, editor, markNodeMap]
	);

	const submitAddComment = useCallback(
		(
			commentOrThread: Comment | Thread,
			isInlineComment: boolean,
			thread?: Thread,
			selection?: RangeSelection | null
		) => {
			commentStore.addComment(commentOrThread, thread);
			if (isInlineComment) {
				editor.update(() => {
					if ($isRangeSelection(selection)) {
						const isBackward = selection.isBackward();
						const id = commentOrThread.id;

						// Wrap content in a MarkNode
						$wrapSelectionInMarkNode(selection, isBackward, id);
					}
				});
				setShowCommentInput(false);
			}
			setShowThreadComments(true);
		},
		[commentStore, editor, setShowThreadComments]
	);

	useEffect(() => {
		const changedElems: Array<HTMLElement> = [];
		for (let i = 0; i < activeIDs.length; i++) {
			const id = activeIDs[i];
			const keys = markNodeMap.get(id);
			if (keys !== undefined) {
				for (const key of keys) {
					const elem = editor.getElementByKey(key);
					if (elem !== null) {
						elem.classList.add("selected");
						changedElems.push(elem);
						setShowThreadComments(true);
					}
				}
			}
		}
		return () => {
			for (let i = 0; i < changedElems.length; i++) {
				const changedElem = changedElems[i];
				changedElem.classList.remove("selected");
			}
		};
	}, [activeIDs, editor, markNodeMap, setShowThreadComments]);

	useEffect(() => {
		const markNodeKeysToIDs: Map<NodeKey, Array<string>> = new Map();

		return mergeRegister(
			registerNestedElementResolver<MarkNode>(
				editor,
				MarkNode,
				(from: MarkNode) => {
					return $createMarkNode(from.getIDs());
				},
				(from: MarkNode, to: MarkNode) => {
					// Merge the IDs
					const ids = from.getIDs();
					ids.forEach((id) => {
						to.addID(id);
					});
				}
			),
			editor.registerMutationListener(
				MarkNode,
				(mutations) => {
					editor.getEditorState().read(() => {
						for (const [key, mutation] of mutations) {
							const node: null | MarkNode = $getNodeByKey(key);
							let ids: NodeKey[] = [];

							if (mutation === "destroyed") {
								ids = markNodeKeysToIDs.get(key) || [];
							} else if ($isMarkNode(node)) {
								ids = node.getIDs();
							}

							for (let i = 0; i < ids.length; i++) {
								const id = ids[i];
								let markNodeKeys = markNodeMap.get(id);
								markNodeKeysToIDs.set(key, ids);

								if (mutation === "destroyed") {
									if (markNodeKeys !== undefined) {
										markNodeKeys.delete(key);
										if (markNodeKeys.size === 0) {
											markNodeMap.delete(id);
										}
									}
								} else {
									if (markNodeKeys === undefined) {
										markNodeKeys = new Set();
										markNodeMap.set(id, markNodeKeys);
									}
									if (!markNodeKeys.has(key)) {
										markNodeKeys.add(key);
									}
								}
							}
						}
					});
				},
				{ skipInitialization: false }
			),
			editor.registerUpdateListener(({ editorState, tags }) => {
				editorState.read(() => {
					const selection = $getSelection();
					let hasActiveIds = false;
					let hasAnchorKey = false;

					if ($isRangeSelection(selection)) {
						const anchorNode = selection.anchor.getNode();

						if ($isTextNode(anchorNode)) {
							const commentIDs = $getMarkIDs(
								anchorNode,
								selection.anchor.offset
							);
							if (commentIDs !== null) {
								setActiveIDs(commentIDs);
								hasActiveIds = true;
							}
							if (!selection.isCollapsed()) {
								setActiveAnchorKey(anchorNode.getKey());
								hasAnchorKey = true;
							}
						}
					}
					if (!hasActiveIds) {
						setActiveIDs((_activeIds) =>
							_activeIds.length === 0 ? _activeIds : []
						);
					}
					if (!hasAnchorKey) {
						setActiveAnchorKey(null);
					}
					if (!tags.has(COLLABORATION_TAG) && $isRangeSelection(selection)) {
						setShowCommentInput(false);
					}
				});
			}),
			editor.registerCommand(
				INSERT_INLINE_COMMAND,
				() => {
					const domSelection = getDOMSelection(editor._window);
					if (domSelection !== null) {
						domSelection.removeAllRanges();
					}
					setShowCommentInput(true);
					return true;
				},
				COMMAND_PRIORITY_EDITOR
			)
		);
	}, [editor, markNodeMap]);

	const onAddComment = () => {
		editor.dispatchCommand(INSERT_INLINE_COMMAND, undefined);
	};

	const disabledInput = permissionInNote === "view";

	return (
		<>
			{showCommentInput &&
				createPortal(
					<CommentInputBox
						editor={editor}
						cancelAddComment={cancelAddComment}
						submitAddComment={submitAddComment}
					/>,
					document.body
				)}

			{activeAnchorKey !== null &&
				activeAnchorKey !== undefined &&
				!showCommentInput &&
				permissionInNote === "comment" &&
				createPortal(
					<AddCommentBox
						anchorKey={activeAnchorKey}
						editor={editor}
						onAddComment={onAddComment}
					/>,
					document.body
				)}

			{showThreadComments &&
				createPortal(
					<CommentsPanel
						comments={comments}
						submitAddComment={submitAddComment}
						deleteCommentOrThread={deleteCommentOrThread}
						activeIDs={activeIDs}
						markNodeMap={markNodeMap}
						disabledInput={disabledInput}
					/>,
					document.body
				)}
		</>
	);
}
