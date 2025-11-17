import React, { useCallback, useEffect, useState } from "react";
import { SettingMenuGroup } from "./settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
	ArrowUp,
	Check,
	ChevronDown,
	CircleQuestionMark,
	Search,
	UserRoundPlus,
	UserX,
} from "lucide-react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import DialogAddNewMemberToWorkspace, {
	roles,
} from "../dialogs/dialog-add-member-to-workspace";
import { TWorkspaceMember, TWorkspaceRole } from "@/types/workspace.type";
import { useWorkspace } from "@/contexts/workspace-context";
import { logAction, sleep } from "@/lib/utils";
import { del, patch } from "@/utils/request";
import { useAuth } from "@/contexts/auth-context";
import { useFolderState } from "@/contexts/folder-context";
import AlertDialogConfirm from "../alert-dialog-confirm";
import { DialogLoading } from "../loading";

const SelectorRole = ({
	open,
	setOpen,
	value,
	onValueChange,
	onRemoveMember,
	disabled,
}: {
	open?: boolean;
	setOpen?: (open: boolean) => void;
	value?: TWorkspaceRole;
	onValueChange?: (value: TWorkspaceRole) => void;
	onRemoveMember?: () => void;
	disabled?: boolean;
}) => {
	const getTitle = (roleValue: TWorkspaceRole | undefined) => {
		if (roleValue === "admin") return "Workspace owner";
		return "Member";
	};

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild disabled={disabled}>
				<Button
					variant={"ghost"}
					className="h-7 font-normal disabled:opacity-80"
					disabled={disabled}
				>
					{getTitle(value)}
					<ChevronDown />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="z-10001 w-64">
				<DropdownMenuGroup>
					<DropdownMenuLabel className="text-xs text-neutral-500 dark:text-neutral-200">
						Select role
					</DropdownMenuLabel>
					{roles.map((role, key) => (
						<DropdownMenuItem
							key={key}
							className="cursor-pointer"
							onClick={() => onValueChange?.(role.value as TWorkspaceRole)}
						>
							<role.icon />
							<div className="text-left">
								<p>{role.label}</p>
								<p className="text-neutral-500 text-xs">{role.description}</p>
							</div>
							{value === role.value ? <Check /> : null}
						</DropdownMenuItem>
					))}

					<DropdownMenuItem
						className="cursor-pointer"
						onClick={() => onRemoveMember?.()}
					>
						<UserX />
						<div className="text-left">
							<p>Leave workspace</p>
						</div>
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem className="cursor-pointer">
						<CircleQuestionMark className="text-neutral-400 dark:text-neutral-600" />
						<div className="text-left">
							<p className="text-neutral-400 dark:text-neutral-600">
								Learn more about each role
							</p>
						</div>
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

const MemberItem = ({
	member,
	disabled,
}: {
	member: TWorkspaceMember;
	disabled?: boolean;
}) => {
	const { currentWorkspace, membersInWorkspace, setMembersInWorkspace } =
		useWorkspace();
	const {
		state: { user },
	} = useAuth();

	const [role, setRole] = useState<TWorkspaceRole>(member.role);
	const [openDialogConfirmRemove, setOpenDialogConfirmRemove] = useState(false);
	const [removingMember, setRemovingMember] = useState(false);
	const [openDialogError, setOpenDialogError] = useState(false);
	const [errorMessage, setErrorMessage] = useState({
		title: "",
		description: "",
	});

	const handleRemoveMember = useCallback(
		async (member: TWorkspaceMember) => {
			try {
				setOpenDialogConfirmRemove(false);

				if (!currentWorkspace || !user) {
					return;
				}

				if (membersInWorkspace.length <= 1) {
					setErrorMessage({
						title: "Cannot remove member",
						description: "You cannot remove the last member of the workspace.",
					});
					setOpenDialogError(true);
					return;
				}

				const canNotRemove =
					currentWorkspace.owner_id === member.id &&
					member.id === user.id &&
					membersInWorkspace
						.filter((mem) => mem.id !== member.id)
						.every((mem) => mem.role !== "admin");

				if (canNotRemove) {
					setErrorMessage({
						title: "Cannot remove member",
						description:
							"You are the owner and the last admin of this workspace. Please transfer ownership or assign another admin before leaving the workspace.",
					});
					setOpenDialogError(true);
					return;
				}

				setRemovingMember(true);
				await sleep(1000);
				await del(`/workspaces/members/remove/${currentWorkspace.id}`, {
					email: member.email,
				});
				setMembersInWorkspace((prev) => {
					return prev.filter((m) => m.id !== member.id);
				});
			} catch (error) {
				logAction("Error removing member:", error);
			} finally {
				setRemovingMember(false);
			}
		},
		[currentWorkspace, membersInWorkspace, user, setMembersInWorkspace]
	);

	const handleChangeRole = useCallback(
		async (newRole: TWorkspaceRole) => {
			try {
				if (!currentWorkspace) {
					return;
				}

				const canNotChange = membersInWorkspace
					.filter((mem) => mem.id !== member.id)
					.every((mem) => mem.role !== "admin");

				if (canNotChange && member.role === "admin") {
					setErrorMessage({
						title: "Cannot change role",
						description:
							"You are the last admin of this workspace. Please assign another admin before changing your role.",
					});
					setOpenDialogError(true);
					return;
				}

				await patch(`/workspaces/members/update/${currentWorkspace.id}`, {
					role: newRole,
					email: member.email,
				});
				const mem = membersInWorkspace.find((m) => m.id === member.id);
				if (mem) {
					mem.role = newRole;
					setMembersInWorkspace([...membersInWorkspace]);
				}
				setRole(newRole);
			} catch (error) {
				logAction("Error changing member role:", error);
			}
		},
		[
			currentWorkspace,
			member,
			setRole,
			membersInWorkspace,
			setMembersInWorkspace,
		]
	);

	return (
		<>
			<div className="flex items-center px-4 w-full not-last:border-b py-2">
				<div className="flex items-center gap-2 w-2/4">
					<Avatar className="size-7">
						<AvatarImage src={member.avatar || ""} />
						<AvatarFallback className="bg-neutral-200 dark:bg-neutral-700">
							{member.fullname ? member.fullname.charAt(0).toUpperCase() : "U"}
						</AvatarFallback>
					</Avatar>
					<div className="space-y-0">
						<p className="font-medium text-primary">
							{member.fullname || "Unknown"}
							{user?.email === member.email ? (
								<span className="text-neutral-500 dark:text-neutral-200">
									{" "}
									(You){" "}
								</span>
							) : (
								""
							)}
						</p>
						<p className="text-xs text-neutral-400">
							{member.email || "Example@example.com"}
						</p>
					</div>
				</div>
				<div className="w-1/4">
					<p>None</p>
				</div>
				<div className="w-1/4">
					<SelectorRole
						value={role}
						onValueChange={handleChangeRole}
						onRemoveMember={() => setOpenDialogConfirmRemove(true)}
						disabled={disabled}
					/>
				</div>
			</div>
			<AlertDialogConfirm
				open={openDialogConfirmRemove}
				setOpen={setOpenDialogConfirmRemove}
				title="Confirm Remove Member"
				description={
					<span>
						Are you sure you want to remove{" "}
						<span className="font-medium text-primary">
							{member.fullname || member.email}{" "}
						</span>
						from the workspace? If you are removing this user,{" "}
						<span className="font-medium text-primary">
							they will lose access to all notes and folders within this
							workspace and any associated teamspaces
						</span>
						. This action cannot be undone.
					</span>
				}
				dialogType="column"
				okButton={
					<Button
						variant="destructive"
						onClick={() => handleRemoveMember(member)}
					>
						Remove Member
					</Button>
				}
			/>
			{removingMember && <DialogLoading title="Removing Member..." />}
			<AlertDialogConfirm
				open={openDialogError}
				setOpen={setOpenDialogError}
				title={errorMessage.title}
				description={errorMessage.description}
				okText="Got it"
				dialogType="column"
				onOk={() => setOpenDialogError(false)}
			/>
		</>
	);
};

const TabMembers = ({
	searchValue,
	disabled,
}: {
	searchValue: string;
	disabled?: boolean;
}) => {
	const { membersInWorkspace } = useWorkspace();
	const [filteredMembers, setFilteredMembers] = useState<TWorkspaceMember[]>(
		[]
	);

	useEffect(() => {
		if (!searchValue.trim()) {
			setFilteredMembers(membersInWorkspace);
		} else {
			const filtered = membersInWorkspace.filter(
				(member) =>
					member.fullname.toLowerCase().includes(searchValue.toLowerCase()) ||
					member.email.toLowerCase().includes(searchValue.toLowerCase())
			);
			setFilteredMembers(filtered);
		}
	}, [searchValue, membersInWorkspace]);

	return (
		<div className="h-1/2 rounded-sm border flex flex-col">
			<div className="py-1 border-b px-4 flex justify-between items-center font-normal text-sm">
				<div className="w-2/4">
					<Button
						className="flex items-center gap-1 h-7 font-normal"
						variant={"ghost"}
						size={"sm"}
					>
						User
						<ArrowUp size={16} />
					</Button>
				</div>
				<div className="w-1/4">
					<p>Groups</p>
				</div>
				<div className="w-1/4">
					<Button
						className="flex items-center gap-1 h-7 font-normal"
						variant={"ghost"}
						size={"sm"}
					>
						Role
					</Button>
				</div>
			</div>

			<div className="py-1 font-normal w-full flex flex-col overflow-hidden h-full overflow-y-auto">
				{filteredMembers.length ? (
					filteredMembers.map((member, index) => (
						<MemberItem key={index} member={member} disabled={disabled} />
					))
				) : (
					<div className="py-6 text-center">
						<p className="text-neutral-500">No members found</p>
					</div>
				)}
			</div>
		</div>
	);
};

const WorkspacePeopleSetting = () => {
	const { currentWorkspace, isGuestInWorkspace, addMembersToWorkspace } =
		useWorkspace();

	const {
		rootFolderInTeamspace,
		dataInTeamspace,
		createRootFolderAndNoteDefaultInTeamspace,
	} = useFolderState();

	const [openDialogAddMember, setOpenDialogAddMember] = useState(false);
	const [showSearchInput, setShowSearchInput] = useState(false);
	const [searchValue, setSearchValue] = useState("");

	const inputRef = React.useRef<HTMLInputElement>(null);

	useEffect(() => {
		const input = inputRef.current;

		if (!input) {
			return;
		}

		if (showSearchInput) {
			input.focus();
		} else {
			setSearchValue("");
			input.blur();
		}
	}, [showSearchInput]);

	const handleSubmitAddMembers = useCallback(
		async (emails: string[], role: TWorkspaceRole, message: string) => {
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

	if (!currentWorkspace) {
		return null;
	}

	const cnTabTrigger = `rounded-none data-[state=active]:shadow-none border-t-0 border-l-0 border-r-0 border-b-[3px] border-transparent data-[state=active]:border-primary text-neutral-500 data-[state=active]:text-primary/80`;
	const disabled = !!(
		currentWorkspace.role !== "admin" ||
		isGuestInWorkspace ||
		currentWorkspace.is_guest
	);

	return (
		<>
			<div className="relative flex flex-col w-full h-full overflow-hidden rounded-md">
				<SettingMenuGroup
					label="People"
					className="max-h-full px-10 py-5 overflow-hidden overflow-y-auto h-full"
				>
					<div className="py-4 h-full">
						<Tabs defaultValue="guest" className="h-full">
							<TabsList className="flex items-center justify-between w-full gap-2 p-0 bg-transparent rounded-none">
								<div className="px-2">
									<TabsTrigger value="guest" className={cnTabTrigger}>
										<span className="hover:bg-neutral-200/50 px-2 py-1 rounded-sm cursor-pointer">
											Guest
										</span>
									</TabsTrigger>
									<TabsTrigger value="members" className={cnTabTrigger}>
										<span className="hover:bg-neutral-200/50 px-2 py-1 rounded-sm cursor-pointer">
											Members
										</span>
									</TabsTrigger>
								</div>

								<div className="flex items-center gap-3 text-sm">
									{!showSearchInput ? (
										<Button
											variant={"ghost"}
											className="size-8"
											onClick={() => setShowSearchInput(!showSearchInput)}
										>
											<Search />
										</Button>
									) : (
										<div className="flex items-center">
											<Button
												variant={"ghost"}
												className="size-8"
												onClick={() => setShowSearchInput(!showSearchInput)}
											>
												<Search />
											</Button>
											<input
												className="py-1 px-2 rounded-sm focus-visible:outline-0 font-normal"
												placeholder="Type to search..."
												ref={inputRef}
												onBlur={() => {
													setShowSearchInput(false);
													setSearchValue("");
												}}
												onChange={(e) => setSearchValue(e.target.value)}
												value={searchValue}
											/>
										</div>
									)}
									<Button
										className="h-8 disabled:cursor-not-allowed"
										onClick={() => setOpenDialogAddMember(true)}
										disabled={disabled}
									>
										Add members
									</Button>
								</div>
							</TabsList>
							<TabsContent value="guest" className="mt-4 text-sm">
								<div className="text-center flex flex-col items-center py-12 border border-dashed rounded-sm gap-1">
									<div className="size-13 bg-neutral-200/80 dark:bg-neutral-700 rounded-full flex items-center justify-center">
										<UserRoundPlus size={24} />
									</div>
									<p className="text-primary font-semibold">No guests yet</p>
									<p className="text-xs text-neutral-400 dark:text-neutral-600 font-normal">
										Invite guests to collaborate on your workspace.
									</p>
								</div>
							</TabsContent>
							<TabsContent value="members" className="mt-4 text-sm">
								<TabMembers searchValue={searchValue} disabled={disabled} />
							</TabsContent>
						</Tabs>
					</div>
				</SettingMenuGroup>
			</div>
			<DialogAddNewMemberToWorkspace
				open={openDialogAddMember}
				setOpen={setOpenDialogAddMember}
				onSubmit={handleSubmitAddMembers}
			/>
		</>
	);
};

export default WorkspacePeopleSetting;
