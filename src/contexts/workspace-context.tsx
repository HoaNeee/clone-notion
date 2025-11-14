"use client";

import { logAction, sleep } from "@/lib/utils";
import { TWorkspace, TWorkspaceMember } from "@/types/workspace.type";
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
  membersInWorkspace: TWorkspaceMember[];
  getDetailWorkspace: (
    workspace_id: number,
    is_guest: boolean
  ) => Promise<{ workspace: TWorkspace; defaultNote: TNote | null } | null>;
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
  const [membersInWorkspace, setMembersInWorkspace] = useState<
    TWorkspaceMember[]
  >([]);

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

  useEffect(() => {
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
    if (currentWorkspace && user && !currentWorkspace.is_guest) {
      fetchMemberInWorkspace(currentWorkspace.id);
    }
  }, [currentWorkspace, user]);

  const getDetailWorkspace = useCallback(
    async (workspace_id: number, is_guest: boolean) => {
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
    },
    []
  );

  useEffect(() => {
    const fn = async (workspace_id: number) => {
      const res = await getDetailWorkspace(workspace_id, false);
      if (res) {
        setCurrentWorkspace(res.workspace);
      }
    };

    if (!currentWorkspace) {
      const lastWorkspaceId = localStorage.getItem("last_workspace_id");
      if (lastWorkspaceId) {
        fn(Number(lastWorkspaceId || 0));
      }
    }
  }, [currentWorkspace, getDetailWorkspace]);

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
    membersInWorkspace,
    getDetailWorkspace,
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
