"use client";

import { logAction, sleep } from "@/lib/utils";
import {
	TWorkspace,
	TWorkspaceMember,
	TWorkspaceRole,
	TWorkspaceSetting,
} from "@/types/workspace.type";
import { get, patch, post } from "@/utils/request";
import {
	createContext,
	Dispatch,
	SetStateAction,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import { useAuth } from "./auth-context";
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
		payload: Partial<TWorkspace>,
		member_count?: number
	) => Promise<TWorkspace | null>;
	membersInWorkspace: TWorkspaceMember[];
	getDetailWorkspace: (
		workspace_id: number,
		is_guest: boolean
	) => Promise<{ workspace: TWorkspace; defaultNote: TNote | null } | null>;
	updateWorkspaceSetting: <Key extends keyof TWorkspaceSetting>(
		key: Key,
		value: TWorkspaceSetting[Key]
	) => Promise<void>;
	workspaceSetting: TWorkspaceSetting | null;
	addMembersToWorkspace: (
		workspace_id: number,
		emails: string[],
		role: TWorkspaceRole,
		message: string
	) => Promise<void>;
	setMembersInWorkspace: Dispatch<SetStateAction<TWorkspaceMember[]>>;
	allWorkspaces: TWorkspace[];
	setAllWorkspaces: Dispatch<SetStateAction<TWorkspace[]>>;
};

const Context = createContext<WorkspaceContextType | null>(null);

const WorkspaceContext = ({
	children,
	token,
}: {
	children: React.ReactNode;
	token?: string;
}) => {
	const {
		state: { user },
	} = useAuth();

	const [workspaces, setWorkspaces] = useState<TWorkspace[]>([]);
	const [workspacesBeInvited, setWorkspacesBeInvited] = useState<TWorkspace[]>(
		[]
	);
	const [currentWorkspace, setCurrentWorkspace] = useState<TWorkspace | null>(
		null
	);
	const [isGuestInWorkspace, setIsGuestInWorkspace] = useState<boolean>(false);
	const [membersInWorkspace, setMembersInWorkspace] = useState<
		TWorkspaceMember[]
	>([]);
	const [workspaceSetting, setWorkspaceSetting] =
		useState<TWorkspaceSetting | null>(null);

	const [allWorkspaces, setAllWorkspaces] = useState<TWorkspace[]>([]);

	async function getAllWorkspaces() {
		try {
			const res = await get("/workspaces");
			const { workspaces, workspacesBeInvited } = res as {
				workspaces: TWorkspace[];
				workspacesBeInvited: TWorkspace[];
			};
			const ws = workspaces.map((w) => ({
				...w,
				is_guest: false,
			}));
			const ws_be_invited = workspacesBeInvited.map((w) => ({
				...w,
				is_guest: true,
			}));
			setWorkspaces(ws);
			setWorkspacesBeInvited(ws_be_invited);
		} catch (error) {
			logAction("Error fetching workspaces", error);
		}
	}

	async function getDetailWorkspace(workspace_id: number, is_guest: boolean) {
		try {
			const res = (await get(
				`/workspaces/detail/${workspace_id}?is_guest=${is_guest ? 1 : 0}`
			)) as {
				workspace: TWorkspace;
				defaultNote: TNote | null;
			};
			return res;
		} catch (error) {
			logAction("Error fetching workspace detail", error);
			return null;
		}
	}

	useEffect(() => {
		if (token && user) {
			getAllWorkspaces();
		}
	}, [token, user]);

	useEffect(() => {
		if (workspaces && workspacesBeInvited) {
			setAllWorkspaces([...workspaces, ...workspacesBeInvited]);
		}
	}, [workspaces, workspacesBeInvited]);

	useEffect(() => {
		if (!token) {
			return;
		}

		const fetchMemberInWorkspace = async (workspace_id: number) => {
			try {
				const res = (await get(`/workspaces/members/${workspace_id}`)) as {
					members: TWorkspaceMember[];
				};
				setMembersInWorkspace(res.members);
			} catch (error) {
				logAction("Error fetching member in workspace", error);
			}
		};

		const fetchWorkspaceSetting = async (workspace_id: number) => {
			try {
				const res = (await get(`/workspaces/setting/${workspace_id}`)) as {
					setting: TWorkspaceSetting;
				};
				setWorkspaceSetting(res.setting);
			} catch (error) {
				logAction("Error fetching workspace setting", error);
			}
		};

		if (currentWorkspace) {
			if (!currentWorkspace.is_guest) {
				fetchMemberInWorkspace(currentWorkspace.id);
			}
			if (currentWorkspace.role === "admin") {
				fetchWorkspaceSetting(currentWorkspace.id);
			}
		}
	}, [currentWorkspace, token]);

	useEffect(() => {
		if (currentWorkspace && currentWorkspace.is_guest) {
			setIsGuestInWorkspace(true);
		}
	}, [currentWorkspace]);

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
		async (payload: Partial<TWorkspace>, member_count = 1) => {
			try {
				await sleep(1000);
				const res = await post("/workspaces/create-new", payload);
				if (res && res.id) {
					setWorkspaces((prev) => [res, ...prev]);
					return {
						...res,
						is_guest: false,
						role: "admin",
						member_count: member_count,
					} as TWorkspace;
				}
				return null;
			} catch (error) {
				logAction("Error creating workspace:", error);
				return null;
			}
		},
		[]
	);

	const updateWorkspaceSetting = useCallback(
		async <Key extends keyof TWorkspaceSetting>(
			key: Key,
			value: TWorkspaceSetting[Key]
		) => {
			try {
				if (!currentWorkspace || !workspaceSetting) return;

				await patch(
					`/workspaces/setting/${currentWorkspace.id}/update/${workspaceSetting.id}`,
					{
						[key]: value,
					}
				);

				setWorkspaceSetting((prev) => {
					return {
						...prev!,
						[key]: value,
					};
				});
			} catch (error) {
				logAction("Error updating workspace setting:", error);
			}
		},
		[currentWorkspace, workspaceSetting]
	);

	const addMembersToWorkspace = useCallback(
		async (
			workspace_id: number,
			emails: string[],
			role: TWorkspaceRole,
			message: string
		) => {
			const payload = {
				emails,
				role,
				message,
			};

			try {
				const res = (await post(
					`/workspaces/members/add/${workspace_id}`,
					payload
				)) as { members: TWorkspaceMember[]; emailsCanNotBeInvited: string[] };
				setMembersInWorkspace((prev) => [...prev, ...res.members]);
			} catch (error) {
				throw error;
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
		membersInWorkspace,
		getDetailWorkspace,
		workspaceSetting,
		updateWorkspaceSetting,
		addMembersToWorkspace,
		setMembersInWorkspace,
		allWorkspaces,
		setAllWorkspaces,
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
