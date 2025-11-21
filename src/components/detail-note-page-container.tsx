import { TNote } from "@/types/note.type";
import NoteHeader from "./note-header";
import { Button } from "./ui/button";
import { MessageSquareText } from "lucide-react";

const DetailNotePageContainer = ({
  note,
  children,
  token,
}: {
  note: TNote;
  children: React.ReactNode;
  token?: string;
}) => {
  return (
    <div className="w-full h-full">
      {token ? (
        <NoteHeader note={note} />
      ) : (
        <header className="min-h-8 sticky top-0 left-0 z-20 flex flex-col w-full py-1 text-sm bg-white">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-2">
              <p>{note?.title || "New File"}</p>
            </div>
            <div className="flex items-center gap-0">
              <Button
                variant={"ghost"}
                size={"sm"}
                className="h-7 text-neutral-400 text-sm font-normal"
              >
                <p>Edited 3 days ago</p>
              </Button>

              <Button
                variant={"ghost"}
                size={"sm"}
                className="h-7 text-sm font-normal"
              >
                <MessageSquareText />
              </Button>
            </div>
          </div>
        </header>
      )}
      <div className="relative flex flex-col items-center w-full h-full p-3">
        <div className="pl-15 w-full max-w-4xl pt-16 pb-6">
          <h1 className="text-4xl font-bold">{note.title || "New File"}</h1>
        </div>
        {children}
      </div>
    </div>
  );
};

export default DetailNotePageContainer;
