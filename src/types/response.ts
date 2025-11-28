import { TFolder } from "./folder.type";
import { TNote } from "./note.type";
import { TWorkspace } from "./workspace.type";

export type ApiNoteDetailResponse = {
  note: TNote;
  folder: {
    folder: TFolder;
    folders_breadcrumb: TFolder[];
  } | null;
  workspace: TWorkspace;
  different_notes_published: TNote[];
  is_need_login: boolean;
  is_need_request_access: boolean;
  current_user_id: number;
};
