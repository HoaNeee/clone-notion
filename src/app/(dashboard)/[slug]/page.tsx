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

const getNoteDetail = async (slug: string, token?: string) => {
  try {
    const res = await get(`/notes/detail/${slug}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res;
  } catch (error) {
    const err = handleError(error);
    if (err.isNotFound) {
      return notFound();
    }
    return error;
  }
};

const NoteDetail = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const slug = (await params).slug;
  const token = (await cookies()).get("note_jwt_token")?.value;

  const noteDetail = await getNoteDetail(slug, token);

  if (!(noteDetail instanceof Error)) {
    //NEED TO FIX THIS LATER
    if (noteDetail.isOtherWorkspace) {
      const note = noteDetail.note as TNote;
      return (
        <DetailNotePageContainer note={note}>
          <MyEditor
            editorStateInitial={note.content}
            note={note}
            editable={false}
          />
        </DetailNotePageContainer>
      );
    }
  }

  if (!token) {
    return <AuthDialog />;
  }

  return (
    <div className="w-full h-full">
      <DetailNotePage slug={slug} />
    </div>
  );
};

export default NoteDetail;
