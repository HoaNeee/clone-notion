import { TWorkspaceRole } from "./workspace.type";

export type TNote = {
  id: number;
  user_id: number;
  folder_id: number;
  title: string;
  content: string;
  deleted: number;
  slug: string;
  type: "folder" | "note";
  status: TNoteStatus;
  status_permission: TNotePermission;
  permission: TNotePermission; //shared permission
  role: TWorkspaceRole;
  is_in_teamspace: boolean;
  deleted_at: string;
  deleted_by: TNoteUserPublic | null;
  last_updated_by: TNoteUserPublic | null;
  created_by: TNoteUserPublic | null;
  createdAt: string;
  updatedAt: string;
};

//shared and private maybe the same
export type TNoteStatus = "private" | "public" | "workspace" | "shared";
export type TNotePermission = "view" | "edit" | "admin" | "comment";

type TNoteUserPublic = {
  id: number;
  fullname: string;
  email: string;
  avatar: string;
};

export type TMemberInNote = {
  id: number;
  fullname: string;
  email: string;
  avatar: string;
  permission: TNotePermission;
};
