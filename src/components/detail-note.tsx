"use client";

import { useFolderState } from "@/contexts/folder-context";
import MyEditor from "@/editor/my-editor";
import { TFolder } from "@/types/folder.type";
import { TNote } from "@/types/note.type";
import { get } from "@/utils/request";
import React, { useCallback, useEffect, useState } from "react";

const DetailNote = ({ slug }: { slug: string }) => {
	const [folderExistsToOpen, setFolderExistsToOpen] = useState<TFolder[]>([]);
	const [note, setNote] = useState<TNote | null>(null);

	//FIX THEN LATER: handle forbidden access note
	const [isForbidden, setIsForbidden] = useState(false);

	const { fetchDataTree, setFoldersDefaultOpen } = useFolderState();

	const getNoteDetail = useCallback(async () => {
		try {
			const res = await get(`/notes/detail/${slug}`);
			setNote(res.note);
			setFolderExistsToOpen(res.folders);
		} catch (error) {
			if (
				error instanceof Error &&
				error.message.toLowerCase().includes("forbidden")
			) {
				setIsForbidden(true);
			}
		}
	}, [slug]);

	useEffect(() => {
		getNoteDetail();
	}, [getNoteDetail]);

	useEffect(() => {
		if (folderExistsToOpen.length === 0) {
			return;
		}

		const fetchFolders = async () => {
			if (folderExistsToOpen.length > 0) {
				for (const folder of folderExistsToOpen) {
					await fetchDataTree(folder.id);
				}
				setFoldersDefaultOpen(folderExistsToOpen.reverse());
			}
		};
		fetchFolders();
	}, [folderExistsToOpen, fetchDataTree, setFoldersDefaultOpen]);

	if (isForbidden) {
		return (
			<div className="text-center text-red-500 mt-10">
				You do not have permission to access this note.
			</div>
		);
	}

	if (!note) {
		return <></>;
	}

	return (
		<div className="w-full h-full">
			<div className="max-w-4xl mx-auto pl-15  mt-16 mb-6">
				<h1 className="font-bold text-4xl">{note.title}</h1>
			</div>
			<MyEditor editorStateInitial={note.content} note={note} />
		</div>
	);
};

export default DetailNote;
