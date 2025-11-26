"use client";

import { useFolderState } from "@/contexts/folder-context";
import MyEditor from "@/editor/my-editor";
import { TFolder } from "@/types/folder.type";
import { TNote } from "@/types/note.type";
import { get } from "@/utils/request";
import React, { useCallback, useEffect, useState } from "react";
import { TWorkspace } from "@/types/workspace.type";
import { logAction, sleep } from "@/lib/utils";
import { useWorkspace } from "@/contexts/workspace-context";
import { useNote } from "@/contexts/note-context";
import DetailNotePageContainer from "./detail-note-page-container";

const DetailNotePage = ({ slug, token }: { slug: string; token?: string }) => {
	const [folderExistsToOpen, setFolderExistsToOpen] = useState<TFolder[]>([]);

	const { fetchDataTree, setFoldersDefaultOpen } = useFolderState();
	const { setCurrentWorkspace, currentWorkspace } = useWorkspace();
	const { currentNote, setCurrentNote, setDifferentNotesPublished } = useNote();
	const [loading, setLoading] = useState<boolean>(true);

	const getNoteDetail = useCallback(
		async (slug: string) => {
			try {
				setLoading(true);

				//simulate loading
				await sleep(1000);

				const res = (await get(`/notes/detail/${slug}`)) as {
					note: TNote;
					folder: {
						folder: TFolder;
						foldersBreadcrumb: TFolder[];
					} | null;
					workspace: TWorkspace;
					differentNotesPublished: TNote[];
				};

				// console.log(res);

				setCurrentNote(res.note);
				if (res.folder) {
					setFolderExistsToOpen(res.folder.foldersBreadcrumb);
				}
				if (
					res.workspace &&
					(!currentWorkspace || currentWorkspace.id !== res.workspace.id)
				) {
					console.log("set workspace from note detail:", res.workspace);
					setCurrentWorkspace({
						...res.workspace,
					});

					if (!res.workspace.is_guest) {
						localStorage.setItem(
							"last_workspace_id",
							res.workspace.id.toString()
						);
					}
				}
				setDifferentNotesPublished(res.differentNotesPublished);
			} catch (error) {
				logAction("Error fetching note detail:", error);
				setCurrentNote(null);
				setDifferentNotesPublished([]);
				setCurrentWorkspace(null);
			} finally {
				setLoading(false);
			}
		},
		[
			setCurrentWorkspace,
			setCurrentNote,
			setDifferentNotesPublished,
			currentWorkspace,
		]
	);

	useEffect(() => {
		if (slug) {
			getNoteDetail(slug);
		}
	}, [getNoteDetail, slug]);

	useEffect(() => {
		if (folderExistsToOpen.length === 0) {
			return;
		}

		const fetchFolders = async () => {
			for (const folder of folderExistsToOpen) {
				await fetchDataTree(folder.id);
			}
			setFoldersDefaultOpen(folderExistsToOpen.reverse());
		};
		fetchFolders();
	}, [folderExistsToOpen, fetchDataTree, setFoldersDefaultOpen]);

	if (loading) {
		return <>Loading...</>;
	}

	if (token && !currentNote) {
		return (
			<div className="mt-10 text-center text-red-500">
				You do not have permission to access this note.
			</div>
		);
	}

	if (!currentNote) {
		return null;
	}

	return (
		<DetailNotePageContainer note={currentNote} token={token}>
			<MyEditor editorStateInitial={currentNote.content} note={currentNote} />
		</DetailNotePageContainer>
	);
};

export default DetailNotePage;
