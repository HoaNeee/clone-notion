"use client";

import { useFolderState } from "@/contexts/folder-context";
import MyEditor from "@/editor/my-editor";
import { TFolder } from "@/types/folder.type";
import { TNote } from "@/types/note.type";
import { get } from "@/utils/request";
import React, { useCallback, useEffect, useState } from "react";

const DetailNote = ({ slug }: { slug: string }) => {
	const [folderExists, setFolderExists] = useState<TFolder[]>([]);
	const [note, setNote] = useState<TNote | null>(null);

	const { fetchDataTree, setFoldersDefaultOpen } = useFolderState();

	const getNoteDetail = useCallback(async () => {
		try {
			const res = await get(`/notes/detail/${slug}`);
			setNote(res.note);
			setFolderExists(res.folders);
		} catch (error) {
			console.log(error);
		}
	}, [slug]);

	useEffect(() => {
		getNoteDetail();
	}, [getNoteDetail]);

	useEffect(() => {
		if (folderExists.length === 0) {
			return;
		}

		const fetchFolders = async () => {
			if (folderExists.length > 0) {
				for (const folder of folderExists) {
					await fetchDataTree(folder.id);
				}
				setFoldersDefaultOpen(folderExists.reverse());
			}
		};
		fetchFolders();
	}, [folderExists, fetchDataTree, setFoldersDefaultOpen]);

	if (!note) {
		return <></>;
	}

	return <MyEditor editorStateInitial={note.content} note={note} />;
};

export default DetailNote;
