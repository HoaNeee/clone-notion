"use client";

import { logAction } from "@/lib/utils";
import { TMemberInNote, TNote } from "@/types/note.type";
import { get, patch } from "@/utils/request";
import {
	createContext,
	Dispatch,
	ReactNode,
	SetStateAction,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import { useWorkspace } from "./workspace-context";

enum ErrorNoteEnum {
	NO_PERMISSION = "NO_PERMISSION",
	NOT_FOUND = "NOT_FOUND",
	UNKNOWN = "UNKNOWN",
	NONE = "NONE",
}

type NoteContextType = {
	currentNote: TNote | null;
	setCurrentNote: Dispatch<TNote | null>;
	differentNotesPublished: TNote[];
	setDifferentNotesPublished: Dispatch<TNote[]>;
	membersInNote: TMemberInNote[];
	setMembersInNote: Dispatch<TMemberInNote[]>;
	setNoteFavorites: Dispatch<SetStateAction<TNote[]>>;
	noteFavorites: TNote[];
	onFavoriteNote: (
		note: TNote,
		workspace_id: number,
		action: "add" | "remove"
	) => void | Promise<void>;
	errorNote: ErrorNoteEnum;
	setErrorNote: Dispatch<SetStateAction<ErrorNoteEnum>>;
};

const Context = createContext<NoteContextType | null>(null);

const NoteContext = ({ children }: { children: ReactNode }) => {
	const [currentNote, setCurrentNote] = useState<TNote | null>(null);
	const [differentNotesPublished, setDifferentNotesPublished] = useState<
		TNote[]
	>([]);
	const [membersInNote, setMembersInNote] = useState<TMemberInNote[]>([]);
	const [noteFavorites, setNoteFavorites] = useState<TNote[]>([]);
	const [errorNote, setErrorNote] = useState<ErrorNoteEnum>(ErrorNoteEnum.NONE);

	const { currentWorkspace, isGuestInWorkspace } = useWorkspace();

	const onFavoriteNote = useCallback(
		async (note: TNote, workspace_id: number, action: "add" | "remove") => {
			try {
				await patch(
					`/notes/favorites/update/${action}/${note.id}?workspace_id=${workspace_id}`,
					{}
				);

				if (action === "add") {
					if (!noteFavorites.find((n) => n.id === note.id)) {
						setNoteFavorites((prev) => [note, ...prev]);
					}
				} else if (action === "remove") {
					setNoteFavorites((prev) => prev.filter((n) => n.id !== note.id));
				}
			} catch (error) {
				logAction("Error favorite note:", error);
			}
		},
		[noteFavorites]
	);

	const getFavoriteNotes = useCallback(async (workspace_id: number) => {
		try {
			const res = (await get(`/notes/favorites/${workspace_id}`)) as {
				favoriteNotes: TNote[];
			};
			if (res.favoriteNotes) {
				setNoteFavorites(res.favoriteNotes);
			}
		} catch (error) {
			logAction("Error get favorite notes:", error);
		}
	}, []);

	useEffect(() => {
		if (currentWorkspace && !currentWorkspace.is_guest && !isGuestInWorkspace) {
			getFavoriteNotes(currentWorkspace.id);
		}
	}, [currentWorkspace, getFavoriteNotes, isGuestInWorkspace]);

	const value = {
		currentNote,
		setCurrentNote,
		differentNotesPublished,
		setDifferentNotesPublished,
		membersInNote,
		setMembersInNote,
		noteFavorites,
		setNoteFavorites,
		onFavoriteNote,
		errorNote,
		setErrorNote,
	};

	return <Context.Provider value={value}>{children}</Context.Provider>;
};

const useNote = () => {
	const context = useContext(Context);
	if (!context) {
		throw new Error("useNote must be used within a NoteContext");
	}
	return context;
};

export { NoteContext, useNote, ErrorNoteEnum };
