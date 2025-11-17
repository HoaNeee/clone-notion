"use client";

import React, { Dispatch, SetStateAction, useCallback } from "react";
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
	Plus,
	Search,
	Settings,
	ShieldUser,
	UserPlus,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "./ui/button";
import { logAction } from "@/lib/utils";
import { useWorkspace } from "@/contexts/workspace-context";
import { TWorkspace } from "@/types/workspace.type";
import { useRouter } from "next/navigation";
import { useRequest } from "@/contexts/request-context";
import AlertDialogConfirm from "./alert-dialog-confirm";
import Link from "next/link";
import DialogAddNewMemberToWorkspace from "./dialogs/dialog-add-member-to-workspace";
import DialogSetting from "./settings/dialog-setting";
import { useFolderState } from "@/contexts/folder-context";
import DialogAddNewWorkspace from "./dialogs/dialog-add-new-workspace";

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
		addMembersToWorkspace,
	} = useWorkspace();
	const {
		dataInTeamspace,
		rootFolderInTeamspace,
		createRootFolderAndNoteDefaultInTeamspace,
	} = useFolderState();

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

	const handleSubmitAddMembers = useCallback(
		async (emails: string[], role: "admin" | "member", message: string) => {
			try {
				if (!currentWorkspace) {
					return;
				}
				await addMembersToWorkspace(currentWorkspace.id, emails, role, message);
				if (!rootFolderInTeamspace && !dataInTeamspace.length) {
					await createRootFolderAndNoteDefaultInTeamspace(currentWorkspace.id);
				}
			} catch (error) {
				logAction("Error adding members to workspace:", error);
			}
		},
		[
			currentWorkspace,
			addMembersToWorkspace,
			rootFolderInTeamspace,
			dataInTeamspace,
			createRootFolderAndNoteDefaultInTeamspace,
		]
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
			<DialogAddNewMemberToWorkspace
				open={openDialogAddMember}
				setOpen={setOpenDialogAddMember}
				onSubmit={handleSubmitAddMembers}
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
	const {
		state: { user },
	} = useAuth();

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
					{requests.some((r) => !r.user_reads.includes(user?.id || 0)) && (
						<div className="w-1.5 h-1.5 rounded-full bg-red-600 absolute right-2 top-1/2 transform -translate-y-1/2"></div>
					)}
				</SidebarMenuItem>
			</SidebarMenu>
		</>
	);
};

export default AppSidebarHeader;
