"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { EditorState } from "lexical";
import { useState } from "react";
import {
	InitialEditorStateType,
	LexicalComposer,
} from "@lexical/react/LexicalComposer";
import { ToolbarContext } from "@/contexts/toolbar-context";
import { SelectionCustomContext } from "@/contexts/selection-custom-context";
import { FloatingToolbarContext } from "@/contexts/floating-toolbar-context";
import MyPlugin from "./my-plugin";
import MyOnChangePlugin from "./plugin/my-on-change-plugin";
import { initialConfig } from "./configs/initial-config";
import lodash from "lodash";
import { TNote, TNotePermission } from "@/types/note.type";
import { patch } from "@/utils/request";
import { logAction } from "@/lib/utils";
import { useNote } from "@/contexts/note-context";
import { useAuth } from "@/contexts/auth-context";

const MyEditor = ({
	editorStateInitial,
	note,
	editable = true,
	permissionInNote,
}: {
	editorStateInitial: string | undefined;
	note: TNote | null;
	editable?: boolean;
	permissionInNote?: TNotePermission;
}) => {
	const [editorState, setEditorState] = useState<string>(
		editorStateInitial || ""
	);

	const currentNote = useNote().currentNote;
	const setCurrentNote = useNote().setCurrentNote;
	const user = useAuth().state.user;
	const setSavingContent = useNote().setSavingContent;

	const onUpdate = useCallback(
		async (id: number = 0, content: string) => {
			try {
				if (!id) return;
				console.log("saving...");
				setSavingContent(true);

				await patch(`/notes/update-content/${id}`, { content });

				setCurrentNote((prev) => {
					if (prev) {
						return {
							...prev,
							content,
							updatedAt: new Date().toISOString(),
							last_updated_by: {
								id: user?.id || 0,
								fullname: user?.fullname || "Unknown",
								email: user?.email || "unknown@example.com",
								avatar: user?.avatar || "",
							},
						};
					}
					return prev;
				});
			} catch (error) {
				logAction("Error update note content:", error);
			} finally {
				setSavingContent(false);
			}
		},
		[setSavingContent, setCurrentNote, user]
	);

	//set current note when user is guest (not logged in)
	useEffect(() => {
		if (note && !currentNote && !user) {
			setCurrentNote(note);
		}
	}, [note, currentNote, setCurrentNote, user]);

	const debounceSave = useRef(
		lodash.debounce((state) => {
			console.log("Auto saving...");
			onUpdate(note?.id, state);
		}, 1000)
	).current;

	const onChange = useCallback(
		async (editorStateParam: EditorState) => {
			const editorStateJSON = editorStateParam.toJSON();

			// However, we still have a JavaScript object, so we need to convert it to an actual string with JSON.stringify
			const json = JSON.stringify(editorStateJSON);

			if (json !== editorState) {
				setEditorState(json);
				debounceSave(json);
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[editorState]
	);

	useEffect(() => {
		if (typeof window === "undefined") return;

		const keyboardSave = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "s") {
				e.preventDefault();

				console.log("Manually saving...");
				onUpdate(note?.id, editorState);
			}
		};

		window.addEventListener("keydown", keyboardSave);
		return () => {
			window.removeEventListener("keydown", keyboardSave);
		};
	}, [editorState, note?.id, onUpdate]);

	if (!note) {
		return null;
	}

	return (
		<LexicalComposer
			initialConfig={{
				...initialConfig,
				editorState: editorStateInitial as InitialEditorStateType,
			}}
		>
			<ToolbarContext>
				<SelectionCustomContext>
					<FloatingToolbarContext>
						<MyPlugin editable={editable} permissionInNote={permissionInNote} />
						<MyOnChangePlugin onChange={onChange} />
					</FloatingToolbarContext>
				</SelectionCustomContext>
			</ToolbarContext>
		</LexicalComposer>
	);
};

export default MyEditor;
