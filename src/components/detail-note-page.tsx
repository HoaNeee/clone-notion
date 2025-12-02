"use client";

import { useFolderState } from "@/contexts/folder-context";
import MyEditor from "@/editor/my-editor";
import { TFolder } from "@/types/folder.type";
import { get } from "@/utils/request";
import React, { useCallback, useEffect, useState } from "react";
import { logAction, sleep } from "@/lib/utils";
import { useWorkspace } from "@/contexts/workspace-context";
import { ErrorNoteEnum, useNote } from "@/contexts/note-context";
import DetailNotePageContainer from "./detail-note-page-container";
import RequestPage from "./request-page";
import { setLastWorkspaceInLocalStorage } from "@/utils/workspace";
import { ApiNoteDetailResponse } from "@/types/response";

const DetailNotePage = ({ slug, token }: { slug: string; token?: string }) => {
	const [folderExistsToOpen, setFolderExistsToOpen] = useState<TFolder[]>([]);

	const { fetchDataTree, setFoldersDefaultOpen } = useFolderState();
	const { setCurrentWorkspace, currentWorkspace } = useWorkspace();
	const {
		currentNote,
		setCurrentNote,
		setDifferentNotesPublished,
		errorNote,
		setErrorNote,
	} = useNote();

	const [loading, setLoading] = useState<boolean>(true);

	const getNoteDetail = useCallback(
		async (slug: string) => {
			try {
				setLoading(true);

				//simulate loading
				await sleep(1000);

				const res = (await get(
					`/notes/detail/${slug}`
				)) as ApiNoteDetailResponse;

				if (res.is_need_login) {
					setErrorNote(ErrorNoteEnum.NO_PERMISSION);
					return;
				}
				if (res.is_need_request_access) {
					setErrorNote(ErrorNoteEnum.NO_PERMISSION);
				}

				if (res.note) {
					setCurrentNote(res.note);
				}
				if (res.folder) {
					setFolderExistsToOpen(res.folder.folders_breadcrumb);
				}
				if (
					res.workspace &&
					(!currentWorkspace || currentWorkspace.id !== res.workspace.id)
				) {
					setCurrentWorkspace({
						...res.workspace,
					});

					if (
						!res.workspace.is_guest &&
						!res.is_need_login &&
						!res.is_need_request_access
					) {
						setLastWorkspaceInLocalStorage({
							workspace_id: res.workspace.id,
							user_id: res.current_user_id,
						});
					}
				}
				setDifferentNotesPublished(res.different_notes_published);
			} catch (error) {
				logAction("Error fetching note detail:", error);
				setErrorNote(ErrorNoteEnum.UNKNOWN);
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
			setErrorNote,
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

	if (errorNote === ErrorNoteEnum.NOT_FOUND) {
		return <>Not found</>;
	}

	if (errorNote === ErrorNoteEnum.NO_PERMISSION) {
		return <RequestPage workspace={currentWorkspace} />;
	}

	if (errorNote === ErrorNoteEnum.UNKNOWN) {
		return <>An unknown error occurred.</>;
	}

	return (
		<DetailNotePageContainer note={currentNote} token={token} loading={loading}>
			<MyEditor editorStateInitial={currentNote?.content} note={currentNote} />
		</DetailNotePageContainer>
	);
};

export default DetailNotePage;
