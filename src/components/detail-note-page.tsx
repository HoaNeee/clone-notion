"use client";

import { useFolderState } from "@/contexts/folder-context";
import MyEditor from "@/editor/my-editor";
import { TFolder } from "@/types/folder.type";
import { TNote } from "@/types/note.type";
import { get } from "@/utils/request";
import React, { useCallback, useEffect, useState } from "react";
import NoteHeader from "./note-header";
import { handleError } from "@/utils/error-handler";

const DetailNotePage = ({ slug }: { slug: string }) => {
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
      const err = handleError(error);
      if (err.isForbidden) {
        setIsForbidden(true);
      } else {
        console.log(error);
      }
      return;
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
      <div className="mt-10 text-center text-red-500">
        You do not have permission to access this note.
      </div>
    );
  }

  if (!note) {
    return <></>;
  }

  return (
    <DetailNotePageContainer note={note}>
      <MyEditor editorStateInitial={note.content} note={note} />
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
      <div className="p-3 w-full h-full relative flex flex-col items-center">
        <div className="pl-15 max-w-4xl pt-16 pb-6 w-full">
          <h1 className="text-4xl font-bold">{note.title || "New File"}</h1>
        </div>
        {children}
      </div>
    </div>
  );
};

export default DetailNotePage;
