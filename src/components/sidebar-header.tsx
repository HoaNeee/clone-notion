"use client";

import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Check,
  ChevronLeft,
  ChevronsLeft,
  ChevronsUpDown,
  Home,
  Inbox,
  Mail,
  Plus,
  Search,
  Settings,
  ShieldUser,
  User,
  UserLock,
  UserPlus,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { logAction, sleep } from "@/lib/utils";
import TabNavSetting from "./settings/tab-nav-setting";
import { useWorkspace } from "@/contexts/workspace-context";
import { TWorkspace } from "@/types/workspace.type";
import { post } from "@/utils/request";
import { TNote } from "@/types/note.type";
import { useRouter } from "next/navigation";
import { TFolder } from "@/types/folder.type";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { DialogLoading } from "./loading";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";
import { useFolderState } from "@/contexts/folder-context";
import { useRequest } from "@/contexts/request-context";
import AlertDialogConfirm from "./alert-dialog-confirm";
import Link from "next/link";

const DialogLogout = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: Dispatch<boolean>;
}) => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/";
    } catch (error) {
      logAction("Error logging out:", error);
    }
  };
  return (
    <AlertDialogConfirm
      icon={ShieldUser}
      title="Log out of your account?"
      description="You will need to log back in to access your Notion workspaces."
      open={open}
      setOpen={setOpen}
      okButton={
        <Button
          variant={"destructive"}
          className="opacity-80"
          onClick={handleLogout}
        >
          Log out
        </Button>
      }
      dialogType="column"
    />
  );
};

const DialogSetting = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: Dispatch<boolean>;
}) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="h-10/12 w-7/10 p-0"
        style={{ maxWidth: "100%" }}
      >
        <DialogHeader className="max-h-0 absolute hidden h-0">
          <DialogTitle />
          <DialogDescription />
        </DialogHeader>
        <div className="flex w-full h-full max-h-full gap-2 overflow-hidden">
          <TabNavSetting />
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DialogAddNewWorkspace = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: Dispatch<boolean>;
}) => {
  const { createNewWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      const title = formData.get("title") as string;

      if (loading) {
        return;
      }

      try {
        setLoading(true);
        const newWorkspace = await createNewWorkspace({ title });
        if (newWorkspace) {
          const data = (await post(
            "/folders/create-root-and-default-note?workspace_id=" +
              newWorkspace.id
          )) as {
            folder: TFolder;
            note: TNote;
          };
          if (data && data.note) {
            setOpen(false);
            await sleep(2000);
            router.push(`/${data.note.slug}`);
          }
        }
      } catch (error) {
        logAction("Error creating workspace:", error);
      } finally {
        setLoading(false);
      }
    },
    [router, setOpen, loading, createNewWorkspace]
  );

  return (
    <>
      {loading && <DialogLoading />}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false} className="min-w-md">
          <DialogHeader className="text-neutral-700">
            <DialogTitle>
              <p className="font-semibold">Create a new workspace?</p>
            </DialogTitle>
            <DialogDescription className="">
              You can invite members to join and collaborate in this workspace.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit}>
            <div className="min-h-50 flex flex-col gap-2">
              <Label htmlFor="title">Workspace Name</Label>
              <Input type="text" name="title" placeholder="Workspace name" />
            </div>
            <DialogFooter className="flex items-center">
              <DialogClose asChild>
                <Button variant={"outline"}>Cancel</Button>
              </DialogClose>
              <Button type="submit" className="">
                Create Workspace
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

const DialogAddNewMember = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) => {
  const [inputEmail, setInputEmail] = useState("");
  const [emailList, setEmailList] = useState<string[]>([]);
  const [role, setRole] = useState<"admin" | "member">("admin");
  const [message, setMessage] = useState("");
  const [isFocusedInput, setIsFocusedInput] = useState(false);

  const { currentWorkspace } = useWorkspace();
  const {
    rootFolderInTeamspace,
    dataInTeamspace,
    setDataInTeamspace,
    setRootFolderInTeamspace,
  } = useFolderState();

  const handleSubmit = useCallback(async () => {
    if (!currentWorkspace) {
      return;
    }

    try {
      const payload = {
        emails: emailList,
        role,
        message,
      };

      await post(`/workspaces/add-members/${currentWorkspace.id}`, payload);

      if (!rootFolderInTeamspace && !dataInTeamspace.length) {
        const res = (await post(
          `/folders/create-root-and-default-note-teamspace?workspace_id=${currentWorkspace.id}`
        )) as {
          folder: TFolder;
          note: TNote;
        };

        if (res.folder && res.note) {
          setRootFolderInTeamspace(res.folder);
          setDataInTeamspace([
            {
              ...res.folder,
              type: "folder",
            },
            {
              ...res.note,
              type: "note",
            },
          ]);
        }
      }

      setOpen(false);
    } catch (error) {
      logAction("Error inviting members:", error);
    }
  }, [
    emailList,
    role,
    message,
    currentWorkspace,
    setOpen,
    rootFolderInTeamspace,
    dataInTeamspace,
    setDataInTeamspace,
    setRootFolderInTeamspace,
  ]);

  useEffect(() => {
    if (!open) {
      setInputEmail("");
      setEmailList([]);
      setRole("admin");
      setMessage("");
    }
  }, [open]);

  const handleAddEmail = useCallback(() => {
    const check =
      inputEmail.includes("@") &&
      inputEmail.includes(".") &&
      !inputEmail.trim().includes(" ") &&
      !emailList.includes(inputEmail.trim()) &&
      inputEmail.substring(inputEmail.indexOf("@") + 1).length &&
      inputEmail.indexOf(".") > inputEmail.indexOf("@") &&
      inputEmail.substring(inputEmail.indexOf(".") + 1).length;
    if (check) {
      setEmailList((prev) => [...prev, inputEmail.trim()]);
      setInputEmail("");
    }
  }, [inputEmail, emailList]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent showCloseButton={false} className="w-lg overflow-hidden">
        <DialogHeader className="text-neutral-700">
          <DialogTitle asChild>
            <div className="flex flex-col items-center justify-center gap-2 font-normal">
              <UserPlus />
              <p className="font-semibold">Add members</p>
            </div>
          </DialogTitle>
          <DialogDescription className="text-center">
            Type or paste in emails below, separated by commas
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-5 py-4">
          <div className="relative">
            <Input
              type="text"
              name="emails"
              placeholder="Search or paste email addresses"
              className="bg-neutral-50"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAddEmail();
                }
              }}
              value={inputEmail}
              onChange={(e) => setInputEmail(e.target.value)}
              onFocus={() => setIsFocusedInput(true)}
              onBlur={() => {
                setIsFocusedInput(false);
                handleAddEmail();
              }}
            />
            {isFocusedInput && inputEmail.trim().length ? (
              <div
                className="top-11 absolute left-0 w-full p-1 text-sm bg-white rounded shadow"
                onPointerDown={(e) => e.preventDefault()}
              >
                <div
                  className="bg-neutral-200/60 flex items-center w-full gap-2 p-1 text-sm rounded-sm cursor-pointer"
                  onClick={handleAddEmail}
                >
                  <Mail size={16} />
                  {inputEmail}
                </div>
              </div>
            ) : null}
          </div>

          <div>
            <Label className="text-neutral-500 block mb-1 text-xs font-medium">
              Added members
            </Label>
            <div className="border-neutral-200 min-h-15 bg-neutral-50 flex flex-wrap gap-2 p-2 border rounded">
              {emailList.length === 0 ? (
                <p className="text-neutral-400 text-sm">No members added yet</p>
              ) : (
                emailList.map((email) => (
                  <div
                    key={email}
                    className="px-2 py-0.5 bg-neutral-200 rounded-sm text-sm items-center gap-1 inline-flex h-fit"
                  >
                    <span>{email}</span>
                    <Button
                      className="size-4.5 rounded-sm hover:bg-neutral-300"
                      variant={"ghost"}
                      onClick={() => {
                        setEmailList((prev) => prev.filter((e) => e !== email));
                      }}
                    >
                      <X />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="w-full">
            <Label className="text-neutral-500 block mb-1 text-xs font-medium">
              Select role
            </Label>
            <Select
              defaultValue="admin"
              onValueChange={(value) => setRole(value as "admin" | "member")}
            >
              <SelectTrigger className="w-full whitespace-pre-wrap max-w-full min-h-18 data-[size=default]:h-auto data-[size=sm]:h-auto">
                <SelectValue
                  placeholder="Select role for new members"
                  className="flex items-start"
                />
              </SelectTrigger>
              <SelectContent className="z-10001">
                <SelectGroup>
                  <SelectItem value="admin" className="">
                    <UserLock />
                    <div className="text-left">
                      <p>Workspace Owner</p>
                      <p className="text-neutral-500 text-xs">
                        Can manage workspace settings and invite new members to
                        workspace
                      </p>
                    </div>
                  </SelectItem>
                  <SelectItem value="member">
                    <User />
                    <div className="text-left">
                      <p>Member</p>
                      <p className="text-neutral-500 text-xs">
                        Cannot manage workspace settings and and invite new
                        members to workspace
                      </p>
                    </div>
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-neutral-500 block mb-1 text-xs font-medium">
              Message
            </Label>
            <Textarea
              placeholder="Add a message..."
              className="bg-neutral-50"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            variant={"default"}
            onClick={handleSubmit}
            disabled={emailList.length === 0}
          >
            Send Invites
          </Button>
          <DialogClose asChild>
            <Button variant={"outline"}>Cancel</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DropdownSidebarUser = () => {
  const { toggleSidebar } = useSidebar();

  const {
    state: { user },
  } = useAuth();

  const {
    currentWorkspace,
    workspaces,
    workspacesBeInvited,
    isGuestInWorkspace,
    getDetailWorkspace,
  } = useWorkspace();

  const [openDropdown, setOpenDropdown] = React.useState(false);
  const [openDialogLogout, setOpenDialogLogout] = React.useState(false);
  const [openDialogSettings, setOpenDialogSettings] = React.useState(false);
  const [openDialogAddWorkspace, setOpenDialogAddWorkspace] =
    React.useState(false);
  const [openDialogAddMember, setOpenDialogAddMember] = React.useState(false);

  const router = useRouter();

  const hideDropdown = () => {
    setOpenDropdown(false);
  };

  const handleChangeWorkspace = useCallback(
    async (workspace_id: number, is_guest: boolean, force_change = false) => {
      //maybe can reset workspace, note, folder context here

      try {
        if (
          currentWorkspace &&
          workspace_id === currentWorkspace.id &&
          !force_change
        ) {
          return;
        }

        is_guest =
          is_guest || workspacesBeInvited.some((w) => w.id === workspace_id);

        const result = await getDetailWorkspace(workspace_id, is_guest);

        if (!result) {
          return;
        }

        const { defaultNote } = result;

        if (!defaultNote && is_guest) {
          return;
        }

        if (defaultNote) {
          router.push(`/${defaultNote.slug}`);
          router.refresh();
        }

        if (!is_guest) {
          localStorage.setItem("last_workspace_id", workspace_id.toString());
        }
      } catch (error) {
        logAction("Error changing workspace:", error);
      }
    },
    [router, workspacesBeInvited, currentWorkspace, getDetailWorkspace]
  );

  const renderItem = useCallback(
    ({
      workspace,
      is_guest,
      key,
    }: {
      workspace: TWorkspace;
      is_guest: boolean;
      key: number;
    }) => {
      return (
        <DropdownMenuItem
          className="flex justify-between text-sm cursor-pointer"
          onClick={() =>
            handleChangeWorkspace(workspace.id, !!workspace.is_guest)
          }
          key={`${workspace.id}-${key}`}
        >
          <div className="flex items-center gap-2">
            <div className="size-5 bg-neutral-200 text-neutral-400 flex items-center justify-center text-sm rounded-sm">
              {workspace.title.charAt(0)}
            </div>
            <p className="text-ellipsis line-clamp-1 max-w-full">
              {workspace.title}
            </p>
            {is_guest ? (
              <span className="ml-2 px-1.5 text-xs bg-yellow-50 text-yellow-600 rounded-sm flex items-center justify-center">
                Guest
              </span>
            ) : null}
          </div>
          {currentWorkspace?.id === workspace.id ? <Check /> : null}
        </DropdownMenuItem>
      );
    },
    [currentWorkspace, handleChangeWorkspace]
  );

  const handleChangePrevWorkspace = useCallback(async () => {
    const lastWorkspaceId = Number(
      localStorage.getItem("last_workspace_id") || 0
    );

    if (!lastWorkspaceId) {
      return;
    }

    try {
      await handleChangeWorkspace(lastWorkspaceId, false, true);
    } catch (error) {
      logAction("Error change previous workspace: ", error);
    }
  }, [handleChangeWorkspace]);

  const isGuest = currentWorkspace?.is_guest || isGuestInWorkspace;

  const nameFallback = currentWorkspace
    ? currentWorkspace.title.charAt(0)
    : "W";
  const titleFallback = currentWorkspace
    ? currentWorkspace.title
    : "Workspace Default Of User";

  const renderTrigger = useCallback(() => {
    return isGuest ? (
      <SidebarMenuButton className="relative flex justify-between cursor-pointer">
        <DropdownMenuTrigger asChild className="absolute w-full h-full">
          <span />
        </DropdownMenuTrigger>
        <div
          className="size-6 bg-neutral-200 text-neutral-500 hover:bg-neutral-300 relative flex items-center justify-center text-sm rounded-sm"
          onClick={handleChangePrevWorkspace}
        >
          <ChevronLeft
            size={20}
            className="group-hover/sidebar:opacity-100 absolute transition-opacity opacity-0"
          />
          <p className="group-hover/sidebar:opacity-0 text-neutral-500 absolute text-xs font-bold transition-opacity opacity-100">
            {nameFallback}
          </p>
        </div>
        <p className="group-hover/item:pr-10 group-hover/sidebar:pr-4 line-clamp-1 text-ellipsis flex-1">
          {titleFallback}
        </p>
        <div className="group-hover/item:opacity-100 right-10 top-1/2 text-neutral-500 absolute transform -translate-y-1/2 opacity-0 pointer-events-none">
          <ChevronsUpDown size={18} className="" />
        </div>
      </SidebarMenuButton>
    ) : (
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton className="relative flex justify-between cursor-pointer">
          <div className="size-6 bg-neutral-200 text-neutral-500 flex items-center justify-center text-xs font-bold rounded-sm">
            {nameFallback}
          </div>
          <p className="group-hover/item:pr-10 group-hover/sidebar:pr-4 line-clamp-1 text-ellipsis text-primary/90 flex-1 font-semibold">
            {titleFallback}
          </p>
          <div className="group-hover/item:opacity-100 right-10 top-1/2 text-neutral-500 absolute transform -translate-y-1/2 opacity-0">
            <ChevronsUpDown size={18} className="" />
          </div>
        </SidebarMenuButton>
      </DropdownMenuTrigger>
    );
  }, [isGuest, handleChangePrevWorkspace, nameFallback, titleFallback]);

  return (
    <>
      <DropdownMenu open={openDropdown} onOpenChange={setOpenDropdown}>
        {renderTrigger()}
        <div className="group-hover/sidebar:opacity-100 text-neutral-500 right-2 top-1/2 absolute flex items-center gap-1 transition-opacity transform -translate-y-1/2 opacity-0">
          <ChevronsLeft
            size={22}
            className="hover:bg-gray-200/70 rounded-sm cursor-pointer"
            onClick={toggleSidebar}
          />
        </div>
        <DropdownMenuContent align="start" className="w-xs px-3 py-2 text-sm">
          <div className="mb-3">
            <div className="flex items-center gap-2">
              <div className="size-9 bg-neutral-200 text-neutral-500 flex items-center justify-center text-lg font-semibold rounded-sm">
                {nameFallback}
              </div>
              <div>
                <p className="flex-1 font-semibold">{titleFallback}</p>
                <p className="text-neutral-400 text-xs">
                  {currentWorkspace?.member_count || 1} member
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <Button
                variant={"outline"}
                size={"sm"}
                className="h-7 text-neutral-500 p-0 text-xs"
                onClick={() => {
                  setOpenDialogSettings(true);
                  hideDropdown();
                }}
              >
                <Settings /> Settings
              </Button>
              {currentWorkspace?.role === "admin" ? (
                <Button
                  variant={"outline"}
                  size={"sm"}
                  className="h-7 text-neutral-500 p-0 text-xs"
                  onClick={() => {
                    setOpenDialogAddMember(true);
                    hideDropdown();
                  }}
                >
                  <UserPlus /> Invite members
                </Button>
              ) : null}
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuGroup className="mt-0">
            <DropdownMenuLabel className="text-neutral-500/80 text-xs">
              {user?.email || "example@gmail.com"}
            </DropdownMenuLabel>
            {workspaces.map((workspace, key) =>
              renderItem({ workspace, is_guest: false, key })
            )}
            {workspacesBeInvited && workspacesBeInvited.length
              ? workspacesBeInvited.map((workspace, key) =>
                  renderItem({ workspace, is_guest: true, key })
                )
              : null}
            <DropdownMenuItem
              className=" px-4 text-sm cursor-pointer"
              onClick={() => {
                setOpenDialogAddWorkspace(true);
              }}
            >
              <Plus className="text-blue-600" />
              <span className="text-blue-600">Create new workspace</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup className="mt-0">
            <DropdownMenuItem
              className="cursor-pointer text-[13px] font-semibold text-neutral-700"
              onClick={() => setOpenDialogLogout(true)}
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogLogout open={openDialogLogout} setOpen={setOpenDialogLogout} />
      <DialogSetting
        open={openDialogSettings}
        setOpen={setOpenDialogSettings}
      />
      <DialogAddNewWorkspace
        open={openDialogAddWorkspace}
        setOpen={setOpenDialogAddWorkspace}
      />
      <DialogAddNewMember
        open={openDialogAddMember}
        setOpen={setOpenDialogAddMember}
      />
    </>
  );
};

const AppSidebarHeader = ({
  openMenuInbox,
  setOpenMenuInbox,
  btnMenuInboxRef,
}: {
  openMenuInbox: boolean;
  setOpenMenuInbox: Dispatch<SetStateAction<boolean>>;
  btnMenuInboxRef: React.RefObject<HTMLButtonElement | null>;
}) => {
  const { requests } = useRequest();

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem className="group/item">
          <DropdownSidebarUser />
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton className="text-neutral-700 font-medium cursor-pointer">
            <Search className="text-neutral-500" /> Search
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <Link href={"/home"}>
            <SidebarMenuButton className="text-neutral-700 font-medium cursor-pointer">
              <Home className="text-neutral-500" /> Home
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            className="text-neutral-700 font-medium cursor-pointer"
            onClick={() => setOpenMenuInbox(!openMenuInbox)}
            ref={btnMenuInboxRef}
          >
            <Inbox />
            Inbox
          </SidebarMenuButton>
          {requests.some((r) => !r.is_read) && (
            <div className="w-1.5 h-1.5 rounded-full bg-red-600 absolute right-2 top-1/2 transform -translate-y-1/2"></div>
          )}
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  );
};

export default AppSidebarHeader;
