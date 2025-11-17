"use client";

import { useFolderState } from "@/contexts/folder-context";
import MyEditor from "@/editor/my-editor";
import { TFolder } from "@/types/folder.type";
import { TNote } from "@/types/note.type";
import { get } from "@/utils/request";
import React, { useCallback, useEffect, useState } from "react";
import NoteHeader from "./note-header";
import { TWorkspace } from "@/types/workspace.type";
import { logAction, sleep } from "@/lib/utils";
import { useWorkspace } from "@/contexts/workspace-context";
import { useNote } from "@/contexts/note-context";

const DetailNotePage = ({ slug, token }: { slug: string; token?: string }) => {
	const [folderExistsToOpen, setFolderExistsToOpen] = useState<TFolder[]>([]);

	const { fetchDataTree, setFoldersDefaultOpen } = useFolderState();
	const { setCurrentWorkspace } = useWorkspace();
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

				setCurrentNote(res.note);
				if (res.folder) {
					setFolderExistsToOpen(res.folder.foldersBreadcrumb);
				}
				if (res.workspace) {
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
		[setCurrentWorkspace, setCurrentNote, setDifferentNotesPublished]
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
		<DetailNotePageContainer note={currentNote}>
			<MyEditor editorStateInitial={currentNote.content} note={currentNote} />
		</DetailNotePageContainer>
	);
};

export const DetailNotePageContainer = ({
	note,
	children,
}: {
	note: TNote;
	children: React.ReactNode;
}) => {
	return (
		<div className="w-full h-full">
			<NoteHeader note={note} />
			<div className="relative flex flex-col items-center w-full h-full p-3">
				<div className="pl-15 w-full max-w-4xl pt-16 pb-6">
					<h1 className="text-4xl font-bold">{note.title || "New File"}</h1>
				</div>
				{children}
			</div>
		</div>
	);
};

export default DetailNotePage;
