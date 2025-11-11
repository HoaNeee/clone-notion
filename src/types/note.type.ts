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
	role: "admin" | "member";
	is_in_teamspace: boolean;
	deletedAt: string;
	createdAt: string;
	updatedAt: string;
};

//shared and private maybe the same
export type TNoteStatus = "private" | "public" | "workspace" | "shared";
export type TNotePermission = "view" | "edit" | "admin" | "comment";

export type TMemberInNote = {
	id: number;
	fullname: string;
	email: string;
	avatar: string;
	permission: TNotePermission;
};
