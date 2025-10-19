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
import { useFolderState } from "@/contexts/folder-context";
import { TNote } from "@/types/note.type";
import { defaultEditorState } from "@/lib/contants";
import { sampleData } from "../data/sampleStateData";

const MyEditor = ({
	editorStateInitial,
	note,
}: {
	editorStateInitial: string;
	note: TNote;
}) => {
	const [editorState, setEditorState] = useState<string>(
		editorStateInitial || defaultEditorState
	);

	const { onUpdate } = useFolderState();

	const handleSave = async (state: string) => {
		//save data here
		const payload = {
			content: state,
		};

		try {
			// await onUpdate(note.id, payload, "note");
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

	return (
		<LexicalComposer
			initialConfig={{
				...initialConfig,
				editorState: editorState as InitialEditorStateType,
			}}
		>
			<ToolbarContext>
				<SelectionCustomContext>
					<FloatingToolbarContext>
						<MyPlugin />
						<MyOnChangePlugin onChange={onChange} />
					</FloatingToolbarContext>
				</SelectionCustomContext>
			</ToolbarContext>
		</LexicalComposer>
	);
};

export default MyEditor;
