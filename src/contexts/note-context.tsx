"use client";

import { TMemberInNote, TNote } from "@/types/note.type";
import {
	createContext,
	Dispatch,
	ReactNode,
	useContext,
	useState,
} from "react";

type NoteContextType = {
	currentNote: TNote | null;
	setCurrentNote: Dispatch<TNote | null>;
	differentNotesPublished: TNote[];
	setDifferentNotesPublished: Dispatch<TNote[]>;
	membersInNote: TMemberInNote[];
	setMembersInNote: Dispatch<TMemberInNote[]>;
};

const Context = createContext<NoteContextType | null>(null);

const NoteContext = ({ children }: { children: ReactNode }) => {
	const [currentNote, setCurrentNote] = useState<TNote | null>(null);
	const [differentNotesPublished, setDifferentNotesPublished] = useState<
		TNote[]
	>([]);
	const [membersInNote, setMembersInNote] = useState<TMemberInNote[]>([]);

	const value = {
		currentNote,
		setCurrentNote,
		differentNotesPublished,
		setDifferentNotesPublished,
		membersInNote,
		setMembersInNote,
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

export { NoteContext, useNote };
