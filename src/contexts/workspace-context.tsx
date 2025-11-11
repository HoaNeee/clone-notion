"use client";

import { getValueInLocalStorage, logAction, sleep } from "@/lib/utils";
import { TWorkspace } from "@/types/workspace.type";
import { get, post } from "@/utils/request";
import {
	createContext,
	Dispatch,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import { useAuth } from "./auth-context";
import { useRouter } from "next/navigation";
import { TFolder } from "@/types/folder.type";
import { TNote } from "@/types/note.type";

type WorkspaceContextType = {
	workspaces: TWorkspace[];
	workspacesBeInvited: TWorkspace[];
	currentWorkspace: TWorkspace | null;
	setCurrentWorkspace: (workspace: TWorkspace | null) => void;
	isGuestInWorkspace: boolean;
	setIsGuestInWorkspace: Dispatch<boolean>;
	getDefaultWorkspace: () => Promise<TWorkspace | null>;
	createNewWorkspace: (
		payload: Partial<TWorkspace>
	) => Promise<TWorkspace | null>;
};

const Context = createContext<WorkspaceContextType | null>(null);

const WorkspaceContext = ({
	children,
	token,
}: {
	children: React.ReactNode;
	token?: string;
}) => {
	const [workspaces, setWorkspaces] = useState<TWorkspace[]>([]);
	const [workspacesBeInvited, setWorkspacesBeInvited] = useState<TWorkspace[]>(
		[]
	);
	const [currentWorkspace, setCurrentWorkspace] = useState<TWorkspace | null>(
		null
	);
	const [isGuestInWorkspace, setIsGuestInWorkspace] = useState<boolean>(false);

	const {
		state: { user },
	} = useAuth();

	const getAllWorkspaces = useCallback(async () => {
		try {
			const res = await get("/workspaces");
			setWorkspaces(res.workspaces);
			setWorkspacesBeInvited(res.workspacesBeInvited);
		} catch (error) {
			logAction("Error fetching workspaces", error);
		}
	}, []);

	useEffect(() => {
		if (token && user) {
			getAllWorkspaces();
		}
	}, [getAllWorkspaces, token, user]);

	const getDefaultWorkspace = useCallback(async () => {
		try {
			const res = await get("/workspaces/default");

			if (res && res.id) {
				return res as TWorkspace;
			}
			return null;
		} catch (error) {
			logAction("Error fetching default workspace", error);
			return null;
		}
	}, []);

	const createNewWorkspace = useCallback(
		async (payload: Partial<TWorkspace>) => {
			try {
				await sleep(1000);
				const res = await post("/workspaces/create-new", payload);
				if (res && res.id) {
					setWorkspaces((prev) => [res, ...prev]);
					return res as TWorkspace;
				}
				return null;
			} catch (error) {
				logAction("Error creating workspace:", error);
				return null;
			}
		},
		[]
	);

	const value = {
		workspaces,
		workspacesBeInvited,
		currentWorkspace,
		setCurrentWorkspace,
		isGuestInWorkspace,
		setIsGuestInWorkspace,
		getDefaultWorkspace,
		createNewWorkspace,
	};
	return <Context.Provider value={value}>{children}</Context.Provider>;
};

const useWorkspace = () => {
	const context = useContext(Context);
	if (!context) {
		throw new Error("useWorkspace must be used within a WorkspaceContext");
	}

	return context;
};

export { WorkspaceContext, useWorkspace };
