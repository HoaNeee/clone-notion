import React from "react";
import DetailNote from "@/components/detail-note";
import { notFound } from "next/navigation";
import { get } from "@/utils/request";
import NoteHeader from "@/components/note-header";
import { cookies } from "next/headers";
import AuthDialog from "@/components/auth-dialog";

const getNoteDetail = async (slug: string) => {
	try {
		const res = await get(`/notes/detail/${slug}`);
		return res;
	} catch (error) {
		console.log(error);
		return notFound();
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
		return <AuthDialog />;
	}

	return (
		<div className="w-full h-full">
			<NoteHeader />
			<div className="p-3 w-full h-full relative">
				<DetailNote slug={slug} />
			</div>
		</div>
	);
};

export default NoteDetail;
