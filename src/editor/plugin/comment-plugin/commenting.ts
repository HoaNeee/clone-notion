import type { LexicalEditor } from "lexical";

import { Provider, TOGGLE_CONNECT_COMMAND } from "@lexical/yjs";
import { COMMAND_PRIORITY_LOW } from "lexical";
import { useEffect, useState } from "react";
import {
	Array as YArray,
	Map as YMap,
	Transaction,
	YArrayEvent,
	YEvent,
} from "yjs";
import { TComment, TThread } from "@/types/note.type";

export type Comment = TComment;

export type Thread = TThread;
export type Comments = Array<Thread | Comment>;

export function createUID(isNumber: boolean = false): string {
	const uid = Math.random().toString(36).substring(0, 6);
	const uidNumber = Math.floor(Math.random() * 1000000);
	return isNumber ? uidNumber.toString() : uid;
}

export function createComment(
	content: string,
	author: string,
	ref_author_id: number,
	note_thread_id: string,
	id?: string,
	timestamp?: number,
	deleted?: boolean
): Comment {
	return {
		author,
		content,
		deleted: deleted === undefined ? false : deleted,
		id: id === undefined ? createUID() : id,
		timestamp:
			timestamp === undefined
				? performance.timeOrigin + performance.now()
				: timestamp,
		type: "comment",
		note_thread_id,
		ref_author_id,
	};
}

export function createThread(
	quote: string,
	note_id: number,
	ref_author_id: number,
	comments: Array<Comment>,
	id?: string
): Thread {
	return {
		comments,
		id: id === undefined ? createUID() : id,
		note_id,
		quote,
		type: "thread",
		ref_author_id,
	};
}

function cloneThread(thread: Thread): Thread {
	return {
		comments: Array.from(thread.comments),
		id: thread.id,
		ref_author_id: thread.ref_author_id,
		quote: thread.quote,
		type: "thread",
		note_id: thread.note_id,
	};
}

function markDeleted(comment: Comment): Comment {
	return {
		author: comment.author,
		content: "[Deleted Comment]",
		deleted: true,
		id: comment.id,
		timestamp: comment.timestamp,
		type: "comment",
		note_thread_id: comment.note_thread_id,
		ref_author_id: comment.ref_author_id,
	};
}

function triggerOnChange(commentStore: CommentStore): void {
	const listeners = commentStore._changeListeners;
	for (const listener of listeners) {
		listener();
	}
}

export class CommentStore {
	_editor: LexicalEditor;
	_comments: Comments;
	_changeListeners: Set<() => void>;
	_collabProvider: null | Provider;

	constructor(editor: LexicalEditor, initialComments?: Comments) {
		this._comments = initialComments || [];
		this._editor = editor;
		this._collabProvider = null;
		this._changeListeners = new Set();
	}

	isCollaborative(): boolean {
		return this._collabProvider !== null;
	}

	getComments(): Comments {
		return this._comments;
	}

	addComment(
		commentOrThread: Comment | Thread,
		thread?: Thread,
		offset?: number
	): void {
		const nextComments = Array.from(this._comments);
		// The YJS types explicitly use `any` as well.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const sharedCommentsArray: YArray<any> | null = this._getCollabComments();

		if (thread !== undefined && commentOrThread.type === "comment") {
			for (let i = 0; i < nextComments.length; i++) {
				const comment = nextComments[i];
				if (comment.type === "thread" && comment.id === thread.id) {
					const newThread = cloneThread(comment);
					nextComments.splice(i, 1, newThread);
					const insertOffset =
						offset !== undefined ? offset : newThread.comments.length;
					if (this.isCollaborative() && sharedCommentsArray !== null) {
						const parentSharedArray = sharedCommentsArray
							.get(i)
							.get("comments");
						this._withRemoteTransaction(() => {
							const sharedMap = this._createCollabSharedMap(commentOrThread);
							parentSharedArray.insert(insertOffset, [sharedMap]);
						});
					}
					newThread.comments.splice(insertOffset, 0, commentOrThread);
					break;
				}
			}
		} else {
			const insertOffset = offset !== undefined ? offset : nextComments.length;
			if (this.isCollaborative() && sharedCommentsArray !== null) {
				this._withRemoteTransaction(() => {
					const sharedMap = this._createCollabSharedMap(commentOrThread);
					sharedCommentsArray.insert(insertOffset, [sharedMap]);
				});
			}
			nextComments.splice(insertOffset, 0, commentOrThread);
		}
		this._comments = nextComments;

		console.log("Added comment/thread:", commentOrThread);
		console.log("Current comments state:", this._comments);

		triggerOnChange(this);
	}

	deleteCommentOrThread(
		commentOrThread: Comment | Thread,
		thread?: Thread
	): { markedComment: Comment; index: number } | null {
		const nextComments = Array.from(this._comments);
		// The YJS types explicitly use `any` as well.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const sharedCommentsArray: YArray<any> | null = this._getCollabComments();
		let commentIndex: number | null = null;

		if (thread !== undefined) {
			for (let i = 0; i < nextComments.length; i++) {
				const nextComment = nextComments[i];
				if (nextComment.type === "thread" && nextComment.id === thread.id) {
					const newThread = cloneThread(nextComment);
					nextComments.splice(i, 1, newThread);
					const threadComments = newThread.comments;
					commentIndex = threadComments.findIndex(
						(c) => c.id === commentOrThread.id
					);
					if (this.isCollaborative() && sharedCommentsArray !== null) {
						const parentSharedArray = sharedCommentsArray
							.get(i)
							.get("comments");
						this._withRemoteTransaction(() => {
							parentSharedArray.delete(commentIndex);
						});
					}
					threadComments.splice(commentIndex, 1);
					break;
				}
			}
		} else {
			commentIndex = nextComments.findIndex((c) => c.id === commentOrThread.id);
			if (this.isCollaborative() && sharedCommentsArray !== null) {
				this._withRemoteTransaction(() => {
					sharedCommentsArray.delete(commentIndex as number);
				});
			}
			nextComments.splice(commentIndex, 1);
		}
		this._comments = nextComments;
		triggerOnChange(this);

		if (commentOrThread.type === "comment") {
			return {
				index: commentIndex as number,
				markedComment: markDeleted(commentOrThread),
			};
		}

		return null;
	}

	registerOnChange(onChange: () => void): () => void {
		const changeListeners = this._changeListeners;
		changeListeners.add(onChange);
		return () => {
			changeListeners.delete(onChange);
		};
	}

	_withRemoteTransaction(fn: () => void): void {
		const provider = this._collabProvider;
		if (provider !== null) {
			// @ts-expect-error doc does exist
			const doc = provider.doc;
			doc.transact(fn, this);
		}
	}

	_withLocalTransaction(fn: () => void): void {
		const collabProvider = this._collabProvider;
		try {
			this._collabProvider = null;
			fn();
		} finally {
			this._collabProvider = collabProvider;
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	_getCollabComments(): null | YArray<any> {
		const provider = this._collabProvider;
		if (provider !== null) {
			// @ts-expect-error doc does exist
			const doc = provider.doc;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			return doc.get("comments", YArray) as YArray<any>;
		}
		return null;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	_createCollabSharedMap(commentOrThread: Comment | Thread): YMap<any> {
		const sharedMap = new YMap();
		const type = commentOrThread.type;
		const id = commentOrThread.id;
		sharedMap.set("type", type);
		sharedMap.set("id", id);
		if (type === "comment") {
			sharedMap.set("author", commentOrThread.author);
			sharedMap.set("content", commentOrThread.content);
			sharedMap.set("deleted", commentOrThread.deleted);
			sharedMap.set("timestamp", commentOrThread.timestamp);
			sharedMap.set("note_thread_id", commentOrThread.note_thread_id);
		} else {
			sharedMap.set("quote", commentOrThread.quote);
			const commentsArray = new YArray();
			commentOrThread.comments.forEach((comment, i) => {
				const sharedChildComment = this._createCollabSharedMap(comment);
				commentsArray.insert(i, [sharedChildComment]);
			});
			sharedMap.set("comments", commentsArray);
		}
		return sharedMap;
	}

	registerCollaboration(provider: Provider): () => void {
		this._collabProvider = provider;
		const sharedCommentsArray = this._getCollabComments();

		const connect = () => {
			provider.connect();
		};

		const disconnect = () => {
			try {
				provider.disconnect();
			} catch (_e) {
				// Do nothing
			}
		};

		const unsubscribe = this._editor.registerCommand(
			TOGGLE_CONNECT_COMMAND,
			(payload) => {
				if (connect !== undefined && disconnect !== undefined) {
					const shouldConnect = payload;

					if (shouldConnect) {
						console.log("Comments connected!");
						connect();
					} else {
						console.log("Comments disconnected!");
						disconnect();
					}
				}

				return false;
			},
			COMMAND_PRIORITY_LOW
		);

		const onSharedCommentChanges = (
			// The YJS types explicitly use `any` as well.
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			events: Array<YEvent<any>>,
			transaction: Transaction
		) => {
			if (transaction.origin !== this) {
				for (let i = 0; i < events.length; i++) {
					const event = events[i];

					if (event instanceof YArrayEvent) {
						const target = event.target;
						const deltas = event.delta;
						let offset = 0;

						for (let s = 0; s < deltas.length; s++) {
							const delta = deltas[s];
							const insert = delta.insert;
							const retain = delta.retain;
							const del = delta.delete;
							const parent = target.parent;
							const parentThread =
								target === sharedCommentsArray
									? undefined
									: parent instanceof YMap &&
									  (this._comments.find((t) => t.id === parent.get("id")) as
											| Thread
											| undefined);

							if (Array.isArray(insert)) {
								insert
									.slice()
									.reverse()
									// eslint-disable-next-line @typescript-eslint/no-explicit-any
									.forEach((map: YMap<any>) => {
										const id = map.get("id");
										const type = map.get("type");

										const commentOrThread =
											type === "thread"
												? createThread(
														map.get("quote"),
														map.get("note_id"),
														map.get("ref_user_id"),
														map
															.get("comments")
															.toArray()
															.map(
																(
																	innerComment: Map<
																		string,
																		string | number | boolean
																	>
																) =>
																	createComment(
																		innerComment.get("content") as string,
																		innerComment.get("author") as string,
																		innerComment.get("ref_author_id") as number,
																		innerComment.get(
																			"note_thread_id"
																		) as string,
																		innerComment.get("id") as string,
																		innerComment.get("timestamp") as number,
																		innerComment.get("deleted") as boolean
																	)
															),
														id
												  )
												: createComment(
														map.get("content"),
														map.get("author"),
														id,
														map.get("timeStamp"),
														map.get("deleted")
												  );
										this._withLocalTransaction(() => {
											this.addComment(
												commentOrThread,
												parentThread as Thread,
												offset
											);
										});
									});
							} else if (typeof retain === "number") {
								offset += retain;
							} else if (typeof del === "number") {
								for (let d = 0; d < del; d++) {
									const commentOrThread =
										parentThread === undefined || parentThread === false
											? this._comments[offset]
											: parentThread.comments[offset];
									this._withLocalTransaction(() => {
										this.deleteCommentOrThread(
											commentOrThread,
											parentThread as Thread
										);
									});
									offset++;
								}
							}
						}
					}
				}
			}
		};

		if (sharedCommentsArray === null) {
			return () => null;
		}

		sharedCommentsArray.observeDeep(onSharedCommentChanges);

		connect();

		return () => {
			sharedCommentsArray.unobserveDeep(onSharedCommentChanges);
			unsubscribe();
			this._collabProvider = null;
		};
	}
}

export function useCommentStore(commentStore: CommentStore): Comments {
	const [comments, setComments] = useState<Comments>(
		commentStore.getComments()
	);

	useEffect(() => {
		return commentStore.registerOnChange(() => {
			setComments(commentStore.getComments());
		});
	}, [commentStore]);

	return comments;
}
