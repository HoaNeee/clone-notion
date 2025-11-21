export type TWorkspace = {
  id: number;
  title: string;
  icon_url?: string;
  icon_id?: string;
  member_count: number;
  role: TWorkspaceRole;
  owner_id: number;
  is_guest: boolean | null;
  deleted: boolean;
  deletedAt?: string;
  pos: number;
  createdAt: string;
  updatedAt: string;
};

export type TWorkspaceMember = {
  id: number; //it is user id
  fullname: string;
  email: string;
  avatar?: string;
  role: TWorkspaceRole;
};

export interface TWorkspaceSetting {
  id: number;
  workspace_id: number;
  is_profile: number;
  is_hover_card: number;
  is_allow_access_from_non_members: number;
  is_allow_members_invite_guests: number;
  is_allow_members_adding_guests: number;
  is_allow_members_adding_other_members: number;
  is_allow_any_user_request_to_added: number;
  createdAt: string;
  updatedAt: string;
}

export type TWorkspaceRole = "admin" | "member";
