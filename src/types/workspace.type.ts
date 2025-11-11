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
	createdAt: string;
	updatedAt: string;
};

export type TWorkspaceMember = {
	id: number;
	fullname: string;
	email: string;
	avatar?: string;
	role: TWorkspaceRole;
};

export type TWorkspaceRole = "admin" | "member";
