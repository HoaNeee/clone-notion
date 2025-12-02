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
import { TNote } from "@/types/note.type";
import { patch } from "@/utils/request";

const MyEditor = ({
	editorStateInitial,
	note,
	editable = true,
}: {
	editorStateInitial: string | undefined;
	note: TNote | null;
	editable?: boolean;
}) => {
	const [editorState, setEditorState] = useState<string>(
		editorStateInitial || ""
	);

	const onUpdate = useCallback(async (id: number, payload: Partial<TNote>) => {
		try {
			const newPayload = { ...payload } as Partial<TNote>;
			delete newPayload.createdAt;
			delete newPayload.updatedAt;
			delete newPayload.id;

			const res = await patch(`/notes/update/${id}`, newPayload);

			console.log(res);
		} catch (error) {
			throw error;
		}
	}, []);

	const handleSave = async (state: string) => {
		//save data here
		const payload = {
			content: state,
		};

		try {
			// await onUpdate(note.id, payload);
		} catch (error) {
			console.error("Error saving note:", error);
		}
	};

	const debounceSave = useRef(
		lodash.debounce((state) => {
			console.log("Auto saving...");
			handleSave(state);
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
				debounceSave.flush();
			}
		};

		window.addEventListener("keydown", keyboardSave);
		return () => {
			window.removeEventListener("keydown", keyboardSave);
		};
	}, [debounceSave]);

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
						<MyPlugin editable={editable} />
						<MyOnChangePlugin onChange={onChange} />
					</FloatingToolbarContext>
				</SelectionCustomContext>
			</ToolbarContext>
		</LexicalComposer>
	);
};

export default MyEditor;
