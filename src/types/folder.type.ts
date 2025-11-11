import { TNote } from "./note.type";

export type TFolder = {
	id: number;
	user_id: number;
	parent_id: number | null;
	workspace_id: number;
	is_in_teamspace: boolean;
	title: string;
	createdAt: string;
	updatedAt: string;
	deleted: number;
	deletedAt: string | null;
	type: "folder" | "note";
	count_child?: number;
	count_child_note?: number;
	children: (TFolder | TNote)[];
};
