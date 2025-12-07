import React from "react";
import DetailNotePage from "@/components/detail-note-page";
import { notFound } from "next/navigation";
import { get } from "@/utils/request";
import { cookies } from "next/headers";
import AuthDialog from "@/components/auth-dialog";
import { handleError } from "@/utils/error-handler";
import MyEditor from "@/editor/my-editor";
import { logAction } from "@/lib/utils";
import DetailNotePageContainer from "@/components/detail-note-page-container";
import { ApiNoteDetailResponse } from "@/types/response";

const getNoteDetail = async (slug: string, token?: string) => {
	try {
		const res = await get(`/notes/detail/${slug}`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
			next: {
				revalidate: 0, // disable cache
			},
		});
		return res as ApiNoteDetailResponse;
	} catch (error) {
		logAction("Error fetching note detail:", error);
		const err = handleError(error);
		if (err.isNotFound) {
			return notFound();
		}
		return new Error(err.message || "Unknown error occurred");
	}
};

const NoteDetail = async ({
	params,
}: {
	params: Promise<{ slug: string }>;
}) => {
	const slug = (await params).slug;
	const token = (await cookies()).get("note_jwt_token")?.value;

	if (!token) {
		const res = await getNoteDetail(slug, token);
		if (res instanceof Error) {
			return <>Error: {res.message}</>;
		}

		if (res.is_need_login) {
			return <AuthDialog />;
		}

		return (
			<DetailNotePageContainer
				note={res.note}
				threadComments={res.note_comments || []}
			>
				<MyEditor
					editorStateInitial={res.note.content}
					note={res.note}
					editable={
						res.note.status_permission === "admin" ||
						res.note.status_permission === "edit"
					}
					permissionInNote={res.note.permission || res.note.status_permission}
				/>
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
