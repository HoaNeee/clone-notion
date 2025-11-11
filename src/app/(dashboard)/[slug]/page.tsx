import React from "react";
import DetailNotePage, {
	DetailNotePageContainer,
} from "@/components/detail-note-page";
import { notFound } from "next/navigation";
import { get } from "@/utils/request";
import { cookies } from "next/headers";
import AuthDialog from "@/components/auth-dialog";
import { handleError } from "@/utils/error-handler";
import MyEditor from "@/editor/my-editor";
import { TNote } from "@/types/note.type";
import { TWorkspace } from "@/types/workspace.type";
import { TFolder } from "@/types/folder.type";
import { logAction } from "@/lib/utils";

const getNoteDetail = async (slug: string, token?: string) => {
	try {
		const res = await get(`/notes/detail/${slug}`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		return res as {
			note: TNote;
			folder: {
				folder: TFolder;
				foldersBreadcrumb: TFolder[];
			};
			workspace: TWorkspace;
		};
	} catch (error) {
		logAction("Error fetching note detail:", error);
		const err = handleError(error);
		if (err.isNotFound) {
			return notFound();
		}
		return error as Error;
	}
};

const NoteDetail = async ({
	params,
}: {
	params: Promise<{ slug: string }>;
}) => {
	const slug = (await params).slug;
	const token = (await cookies()).get("note_jwt_token")?.value;

	const res = await getNoteDetail(slug, token);

	if (!token) {
		if (res instanceof Error) {
			return <>Error: {res.message}</>;
		}

		if (!res || !res.note || (res && res.note.status !== "public")) {
			return <AuthDialog />;
		}

		return (
			<DetailNotePageContainer note={res.note}>
				<MyEditor editorStateInitial={res.note.content} note={res.note} />
			</DetailNotePageContainer>
		);
	}

	return (
		<div className="w-full h-full">
			<DetailNotePage slug={slug} token={token} />
		</div>
	);
};

export default NoteDetail;
