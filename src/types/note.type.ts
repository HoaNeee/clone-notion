export type TNote = {
  id: number;
  user_id: number;
  folder_id: number;
  title: string;
  content: string;
  deleted: number;
  slug: string;
  type: "folder" | "note";
  status: "private" | "public";
  deletedAt: string;
  createdAt: string;
  updatedAt: string;
};
