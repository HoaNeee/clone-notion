"use client";

import React, {
	Dispatch,
	SetStateAction,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useSidebar } from "./ui/sidebar";
import {
	ArrowUpLeft,
	ChevronDown,
	ChevronLeft,
	CornerUpLeft,
	Earth,
	LockKeyhole,
	Menu,
	MessageSquareText,
	Search,
	Star,
	Trash,
	UserRoundPlus,
	X,
} from "lucide-react";
import { Button } from "./ui/button";
import {
	TMemberInNote,
	TNote,
	TNotePermission,
	TThread,
} from "@/types/note.type";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { del, get, patch, post } from "@/utils/request";
import { checkEmail, logAction } from "@/lib/utils";
import { Label } from "./ui/label";
import lodash from "lodash";
import { Textarea } from "./ui/textarea";
import AlertDialogConfirm from "./alert-dialog-confirm";
import { useNote } from "@/contexts/note-context";
import { useWorkspace } from "@/contexts/workspace-context";
import { useFolderState } from "@/contexts/folder-context";
import { TFolder } from "@/types/folder.type";
import moment from "moment";
import { Spinner } from "./ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

type TEmailInvite = {
	email: string;
	is_guest: boolean;
	permission: TNotePermission;
	avatar?: string;
};

const permissions = [
	{
		label: "Full access",
		description: "Edit, comment and can share with other users",
		value: "admin",
	},
	{
		label: "Can edit",
		description: "Edit and comment on the note",
		value: "edit",
	},
	{
		label: "Can comment",
		description: "Comment on the note",
		value: "comment",
	},
	{ label: "Can view", description: "", value: "view" },
];

const DropdownPermissionNote = ({
	value,
	onValueChange,
	extra,
}: {
	value: string;
	onValueChange: (value: string) => void;
	extra?: React.ReactNode;
}) => {
	const getPermissionLabel = (val: string) => {
		const perm = permissions.find((p) => p.value === val);
		return perm ? perm.label : "Can view";
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger className="" asChild>
				<Button
					size={"sm"}
					variant={"ghost"}
					className="hover:bg-neutral-200 text-neutral-500 font-normal"
				>
					{getPermissionLabel(value)}
					<ChevronDown />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-xs">
				{permissions.map((permission) => (
					<DropdownMenuItem
						key={permission.value}
						className="cursor-pointer"
						onClick={() => onValueChange(permission.value)}
					>
						<div>
							<p>{permission.label}</p>
							<p className="text-neutral-400 text-xs">
								{permission.description}
							</p>
						</div>
					</DropdownMenuItem>
				))}
				{extra}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

const UserPermissionItem = ({
	user,
	isSelf = false,
	note,
	disabled = false,
}: {
	user: TMemberInNote;
	isSelf?: boolean;
	note: TNote;
	disabled?: boolean;
}) => {
	const { membersInNote, setMembersInNote } = useNote();
	const { currentWorkspace } = useWorkspace();
	const {
		state: { user: currentUser },
	} = useAuth();

	const [permission, setPermission] = useState<string>(
		user.permission || "view"
	);
	const [newPermission, setNewPermission] = useState<string>(
		user.permission || "view"
	);

	const [
		openDialogConfirmChangePermission,
		setOpenDialogConfirmChangePermission,
	] = useState(false);
	const [openDialogRemoveUser, setOpenDialogRemoveUser] = useState(false);
	const [alertDialogState, setAlertDialogState] = useState({
		open: false,
		title: "",
		description: "",
	});

	const handleChangePermission = useCallback(
		async (user: TMemberInNote, value: string) => {
			setOpenDialogConfirmChangePermission(false);
			if (user.permission === value) {
				return;
			}

			try {
				if (membersInNote.length <= 1 || currentUser?.id === user.id) {
					setAlertDialogState({
						open: true,
						title: "Cannot Change Permission",
						description:
							"You cannot change the permission for yourself, because you are owner of this note.",
					});
					return;
				}

				await patch(`/notes/members/update/${note.id}`, {
					member_id: user.id,
					permission: value,
				});

				setPermission(value);
			} catch (error) {
				logAction("Error changing permission:", error);
			}
		},
		[membersInNote, note, currentUser]
	);

	const handleRemoveUser = useCallback(
		async (user: TMemberInNote) => {
			if (membersInNote.length <= 1) {
				setOpenDialogRemoveUser(false);
				setAlertDialogState({
					open: true,
					title: "Cannot Remove User",
					description:
						"You cannot remove the last user from the note. Please invite another user before removing this one.",
				});
				return;
			}
			await del(
				`/notes/members/remove/${note.id}/${user.id}?workspace_id=${currentWorkspace?.id}`
			);
			setMembersInNote(membersInNote.filter((mem) => mem.email !== user.email));
			setOpenDialogRemoveUser(false);
		},
		[membersInNote, setMembersInNote, note, currentWorkspace]
	);

	return (
		<>
			<div
				className={`hover:bg-neutral-100 flex items-center justify-between w-full px-2 py-1 rounded-md cursor-pointer`}
				style={{
					pointerEvents: disabled ? "none" : "auto",
					opacity: disabled ? 0.9 : 1,
				}}
			>
				<div className="flex items-center gap-2">
					<Avatar className="size-9">
						<AvatarImage src={user.avatar || ""} />
						<AvatarFallback className="bg-neutral-200 font-semibold capitalize">
							<p>{user?.fullname?.charAt(0) || "U"}</p>
						</AvatarFallback>
					</Avatar>
					<div className="">
						<p>
							{user.fullname}{" "}
							{isSelf && <span className="text-neutral-400">(You)</span>}
						</p>
						<p className="text-neutral-400 text-xs">{user.email}</p>
					</div>
				</div>
				<DropdownPermissionNote
					value={permission}
					onValueChange={(per) => {
						if (user.permission === per) {
							return;
						}
						setNewPermission(per);
						setOpenDialogConfirmChangePermission(true);
					}}
					extra={
						<>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								className="cursor-pointer"
								onClick={() => {
									setOpenDialogRemoveUser(true);
								}}
							>
								<p className="hover:text-red-600 text-red-500">Remove</p>
							</DropdownMenuItem>
						</>
					}
				/>
			</div>
			<AlertDialogConfirm
				dialogType="column"
				open={openDialogConfirmChangePermission}
				setOpen={setOpenDialogConfirmChangePermission}
				title="Confirm Change Permission"
				description="Are you sure you want to change the permission?"
				okText="Confirm"
				onOk={() => {
					handleChangePermission(user, newPermission);
				}}
			/>
			<AlertDialogConfirm
				dialogType="column"
				open={openDialogRemoveUser}
				setOpen={setOpenDialogRemoveUser}
				title="Confirm Remove User"
				description="Are you sure you want to remove this user? They will no longer have access to this note. This action will remove all notes and folders of this user."
				okButton={
					<Button
						variant="destructive"
						className="opacity-80"
						onClick={() => handleRemoveUser(user)}
					>
						Remove
					</Button>
				}
			/>
			<AlertDialogConfirm
				dialogType="column"
				open={alertDialogState.open}
				setOpen={(val) =>
					setAlertDialogState((prev) => ({ ...prev, open: val }))
				}
				title={alertDialogState.title}
				description={alertDialogState.description}
				okText="OK"
				onOk={() => {
					setAlertDialogState((prev) => ({ ...prev, open: false }));
				}}
			/>
		</>
	);
};

const SelectorGeneralAccess = ({
	open,
	onOpenChange,
	note,
	members,
	disabled,
}: {
	open: boolean;
	onOpenChange: Dispatch<SetStateAction<boolean>>;
	note: TNote;
	members: TMemberInNote[];
	disabled?: boolean;
}) => {
	const [status, setStatus] = useState<TNote["status"]>(
		note.status || "private"
	);
	const [statusPermission, setStatusPermission] = useState<TNotePermission>(
		note.status_permission || "view"
	);
	const [openDropdownPermission, setOpenDropdownPermission] = useState(false);

	const listPermisions = permissions.filter((p) => p.value !== "admin");

	const actionRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const contentActionRef = useRef<HTMLDivElement>(null);

	const getLabelStatus = (val: TNote["status"]) => {
		switch (val) {
			case "private":
				return "Only people invited";
			case "workspace":
				return "Everyone in workspace";
			case "public":
				return "Anyone with the link";
			case "shared":
				return "Only people invited";
			default:
				return "Only people invited";
		}
	};

	const getIconStatus = (val: TNote["status"]) => {
		switch (val) {
			case "private":
				return <LockKeyhole size={20} className="opacity-70" />;
			case "shared":
				return <LockKeyhole size={20} className="opacity-70" />;
			case "workspace":
				return <>W</>;
			case "public":
				return <Earth size={20} className="opacity-70" />;
			default:
				return <LockKeyhole size={20} className="opacity-70" />;
		}
	};

	const getPermissionLabel = (val: string) => {
		const perm = permissions.find((p) => p.value === val);
		return perm ? perm.label : "Can view";
	};

	const handleChangeStatus = useCallback(
		async (val: TNote["status"]) => {
			try {
				const payload = {
					status: val,
					status_permission: note.status_permission,
				};

				if (val === "private" || val === "shared") {
					payload.status_permission = "view";
				}

				await patch(`/notes/update/${note.id}`, payload);

				setStatus(val);
				setStatusPermission(payload.status_permission);
				onOpenChange(false);
			} catch (error) {
				logAction("Error changing status:", error);
			}
		},
		[note.id, onOpenChange, note.status_permission]
	);

	const handleChangeStatusPermission = async (value: TNotePermission) => {
		try {
			await patch(`/notes/update/${note.id}`, {
				status_permission: value,
			});
			setStatusPermission(value);
			setOpenDropdownPermission(false);
		} catch (error) {
			logAction("Error changing status permission:", error);
		}
	};

	return (
		<div
			className="hover:bg-neutral-100 flex items-center justify-between w-full px-2 py-1 rounded-md cursor-pointer"
			style={{
				pointerEvents: disabled ? "none" : "auto",
				opacity: disabled ? 0.6 : 1,
			}}
			onClick={(e) => {
				const actionElem = actionRef.current;
				const contentElem = contentRef.current;
				const contentActionElem = contentActionRef.current;

				const target = e.target as HTMLElement;

				if (
					(actionElem && actionElem.contains(target)) ||
					(contentElem && contentElem.contains(target)) ||
					(contentActionElem && contentActionElem.contains(target))
				) {
					return;
				}

				onOpenChange((prev) => !prev);
			}}
		>
			<div className="w-full">
				<DropdownMenu onOpenChange={onOpenChange} open={open}>
					<DropdownMenuTrigger asChild>
						<div className="flex items-center">
							<div className="size-8 bg-neutral-200/70 flex items-center justify-center rounded-sm">
								{getIconStatus(status)}
							</div>
							<Button
								className="h-7 text-neutral-500 p-0 font-normal"
								variant={"ghost"}
							>
								{getLabelStatus(status)}
								<ChevronDown />
							</Button>
						</div>
					</DropdownMenuTrigger>

					<DropdownMenuContent ref={contentRef} className="w-xs" align="start">
						<DropdownMenuItem
							onClick={() => {
								if (members && members.length > 1) {
									handleChangeStatus("shared");
								} else {
									handleChangeStatus("private");
								}
							}}
						>
							<div className="size-6 bg-neutral-50/50 flex items-center justify-center rounded-sm">
								<LockKeyhole />
							</div>
							Only people invited
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => handleChangeStatus("workspace")}>
							<div className="size-6 bg-neutral-200/70 flex items-center justify-center rounded-sm">
								W
							</div>
							Everyone in workspace
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => handleChangeStatus("public")}>
							<div className="size-6 bg-neutral-50/50 flex items-center justify-center rounded-sm">
								<Earth />
							</div>
							Anyone with the link
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			{status !== "private" && status !== "shared" ? (
				<div className="relative" ref={actionRef}>
					<DropdownMenu
						open={openDropdownPermission}
						onOpenChange={setOpenDropdownPermission}
					>
						<DropdownMenu>
							<DropdownMenuTrigger className="" asChild>
								<Button
									size={"sm"}
									variant={"ghost"}
									className="hover:bg-neutral-200 text-neutral-500 font-normal"
								>
									{getPermissionLabel(statusPermission)}
									<ChevronDown />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								ref={contentActionRef}
								align="end"
								className="w-xs"
							>
								{listPermisions.map((permission) => (
									<DropdownMenuItem
										key={permission.value}
										className="cursor-pointer"
										onClick={() =>
											handleChangeStatusPermission(
												permission.value as TNotePermission
											)
										}
									>
										<div>
											<p>{permission.label}</p>
											<p className="text-neutral-400 text-xs">
												{permission.description}
											</p>
										</div>
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
					</DropdownMenu>
				</div>
			) : null}
		</div>
	);
};

const ItemEmailReady = ({
	email,
	onDelete,
	onChangePermission,
}: {
	email: TEmailInvite;
	onDelete: (email: string) => void;
	onChangePermission?: (permission: TNotePermission) => void;
}) => {
	return (
		<div className="flex items-center justify-between w-full">
			<div
				className={`rounded-xs text-neutral-600 flex items-center gap-2 p-1 ${
					email.is_guest ? "bg-yellow-100/50" : "bg-neutral-300/50"
				}`}
			>
				<div className="flex items-center gap-1">
					{email.is_guest ? (
						<Earth
							size={16}
							className={`${
								email.is_guest ? "text-yellow-600/50" : "text-neutral-600/50"
							}`}
						/>
					) : (
						<Avatar className="size-6">
							<AvatarImage src={email.avatar || ""} />
							<AvatarFallback className="bg-neutral-300 font-semibold capitalize">
								{<p>{email.email.charAt(0) || "U"}</p>}
							</AvatarFallback>
						</Avatar>
					)}
					<p>{email.email}</p>
				</div>
				<X
					size={18}
					className="cursor-pointer"
					onClick={() => {
						onDelete(email.email);
					}}
				/>
			</div>
			<DropdownPermissionNote
				onValueChange={(p) => {
					onChangePermission?.(p as TNotePermission);
				}}
				value={email.permission || "admin"}
			/>
		</div>
	);
};

const SuggestionEmail = ({
	searchValue,
	inputRef,
	emails,
	setEmails,
	setSearchValue,
	onSubmitAllEmails,
	message,
	setMessage,
}: {
	searchValue: string;
	inputRef: React.RefObject<HTMLInputElement | null>;
	emails: TEmailInvite[];
	setEmails: React.Dispatch<React.SetStateAction<TEmailInvite[]>>;
	setSearchValue: React.Dispatch<React.SetStateAction<string>>;
	onSubmitAllEmails: (emails: TEmailInvite[], message: string) => void;
	message: string;
	setMessage: React.Dispatch<React.SetStateAction<string>>;
}) => {
	const { membersInWorkspace } = useWorkspace();
	const { membersInNote } = useNote();
	const {
		state: { user },
	} = useAuth();

	const [filteredEmails, setFilteredEmails] = useState<string[]>([]);
	const [selectedIndex, setSelectedIndex] = useState<number>(-1);

	const [isValidEmail, setIsValidEmail] = useState<boolean>(false);
	const [userState, setUserState] = useState<{
		email: string;
		avatar: string;
		fullname: string;
	} | null>(null);
	const [isFetchingUser, setIsFetchingUser] = useState<boolean>(false);

	const elementRef = useRef<HTMLDivElement>(null);

	const debouncedFetchUser = useRef(
		lodash.debounce((val: string) => fetchEmail(val), 500)
	).current;

	const fetchEmail = async (email: string) => {
		try {
			setIsFetchingUser(true);
			const res = await get(
				"/auth/public-user?email=" + encodeURIComponent(email)
			);
			console.log(res);
			if (res && res.email) {
				setUserState(res);
			} else {
				setUserState(null);
			}
		} catch (error) {
			logAction("Error fetching user by email:", error);
			setUserState(null);
		} finally {
			setIsFetchingUser(false);
		}
	};

	const listEmails = useMemo(() => {
		const head = searchValue.trim().indexOf("@");
		let domain = searchValue.trim();
		if (head !== -1) {
			domain = searchValue.trim().slice(0, head);
		}

		return [
			`${domain}@gmail.com`,
			`${domain}@yahoo.com`,
			`${domain}@outlook.com`,
		];
	}, [searchValue]);

	useEffect(() => {
		if (!searchValue || !searchValue.trim()) {
			setSelectedIndex(-1);
			setFilteredEmails(listEmails);
			return;
		}
		setSelectedIndex(0);
		if (checkEmail(searchValue.trim())) {
			setIsValidEmail(true);
			setFilteredEmails([`${searchValue.trim()}`]);
			return;
		}
		setIsValidEmail(false);

		const filtered = listEmails.filter((email) =>
			email.toLocaleLowerCase().includes(searchValue.toLocaleLowerCase())
		);

		if (!filtered.length && !filtered.length) {
			setFilteredEmails([`${searchValue.trim()}`]);
			return;
		}

		setFilteredEmails(filtered);
	}, [searchValue, listEmails]);

	useEffect(() => {
		const element = elementRef.current;

		if (!element) {
			return;
		}

		const handleMouseMove = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			const childs = element.children;
			for (let i = 0; i < childs.length; i++) {
				if (childs[i] === target || childs[i].contains(target)) {
					setSelectedIndex(i);
					break;
				}
			}
		};

		element.addEventListener("mousemove", handleMouseMove);

		return () => {
			element.removeEventListener("mousemove", handleMouseMove);
			setUserState(null);
			setMessage("");
		};
	}, [setUserState, setMessage]);

	const handleAddEmail = useCallback(
		(email: string) => {
			const existMember = membersInWorkspace.find((mem) => mem.email === email);
			const existMemberInNote = membersInNote.find(
				(mem) => mem.email === email
			);

			if ((user && user.email === email) || existMemberInNote) {
				return;
			}

			if (searchValue.trim()) {
				let reset = true;
				setEmails((prev) => {
					if (prev.find((em) => em.email === email)) {
						reset = false;
						return prev.filter((e) => e.email !== email);
					} else {
						reset = true;
						return [
							...prev,
							{
								email,
								is_guest: existMember ? false : true,
								permission: "admin",
								avatar: existMember ? existMember.avatar : "",
							},
						];
					}
				});

				if (reset) {
					setSearchValue("");
					setUserState(null);
					setIsValidEmail(false);
					setSelectedIndex(-1);
					setFilteredEmails(listEmails);
				}
			} else {
				onSubmitAllEmails(emails, message);
			}
		},
		[
			listEmails,
			setEmails,
			setSearchValue,
			searchValue,
			emails,
			onSubmitAllEmails,
			message,
			user,
			membersInWorkspace,
			membersInNote,
		]
	);

	useEffect(() => {
		const input = inputRef.current;

		if (!input) {
			return;
		}

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "ArrowDown") {
				e.preventDefault();
				setSelectedIndex((prevIndex) => {
					const nextIndex = prevIndex + 1;
					return nextIndex >= filteredEmails.length ? 0 : nextIndex;
				});
			}
			if (e.key === "ArrowUp") {
				e.preventDefault();
				setSelectedIndex((prevIndex) => {
					const nextIndex = prevIndex - 1;
					return nextIndex < 0 ? filteredEmails.length - 1 : nextIndex;
				});
			}
			if (e.key === "Enter") {
				e.preventDefault();
				handleAddEmail(filteredEmails[selectedIndex] || searchValue.trim());
			}
		};

		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedIndex, filteredEmails, handleAddEmail, searchValue]);

	useEffect(() => {
		debouncedFetchUser.cancel();
		if (isValidEmail) {
			debouncedFetchUser(searchValue.trim());
		} else {
			setUserState(null);
		}
	}, [isValidEmail, debouncedFetchUser, searchValue]);

	const getLabelInvite = useCallback(() => {
		if (isValidEmail && !isFetchingUser && userState) {
			if (membersInNote.find((mem) => mem.email === userState.email)) {
				return "User already invited to page";
			}
			return "Not invited to page";
		}

		return 'Keep typing to an email"';
	}, [isValidEmail, isFetchingUser, userState, membersInNote]);

	const renderContent = useCallback(() => {
		if (!isValidEmail) {
			return filteredEmails.map((email, index) => (
				<div
					key={index}
					className={`w-full flex items-center justify-between px-3 rounded-md cursor-pointer py-1 hover:bg-neutral-100 ${
						selectedIndex === index ? "bg-neutral-100" : ""
					}`}
					onClick={() => handleAddEmail(email)}
				>
					<div className="flex items-center gap-2">
						<UserRoundPlus size={18} className="text-neutral-500" />
						<div>{`"${email}"`}</div>
					</div>
					<ArrowUpLeft size={18} className="text-neutral-400" />
				</div>
			));
		}

		if (isFetchingUser) {
			return <div>loading...</div>;
		}

		if (userState) {
			const existMembers =
				emails.find((em) => em.email === userState.email) ||
				membersInNote.find((mem) => mem.email === userState.email);
			const is_in_workspace = !!membersInWorkspace.find(
				(mem) => mem.email === userState.email
			);
			const is_self = userState.email === (user && user.email);

			const tag = (
				<span
					className={`px-1.5 text-xs rounded-xs flex items-center justify-center ${
						is_self
							? "bg-blue-400/20 text-blue-600"
							: is_in_workspace
							? "bg-neutral-400/20 text-neutral-600"
							: "bg-yellow-400/20 text-yellow-600"
					}`}
				>
					{is_self ? "You" : is_in_workspace ? "In workspace" : "Guest"}
				</span>
			);

			return (
				<div
					className="bg-neutral-100 flex items-center justify-between w-full px-3 py-1 rounded-md cursor-pointer"
					onClick={() => handleAddEmail(userState.email)}
				>
					<div className="flex items-center gap-2">
						<Avatar className="size-6">
							<AvatarImage src={userState.avatar} />
							<AvatarFallback className="bg-neutral-200 font-semibold capitalize">
								{<p>{userState.fullname?.charAt(0) || "U"}</p>}
							</AvatarFallback>
						</Avatar>
						<div>
							<div className="flex items-center gap-2">
								<p>{userState.fullname}</p>
								{tag}
							</div>
							<p className="text-neutral-400 text-xs">{userState.email}</p>
						</div>
					</div>
					<div className="size-4 border-neutral-400 flex items-center justify-center bg-transparent border rounded-full">
						{existMembers ? (
							<div className="size-2 bg-blue-500/70 rounded-full" />
						) : null}
					</div>
				</div>
			);
		}

		return (
			<div className="bg-neutral-100 flex items-center justify-between w-full px-2 py-1 rounded-md cursor-pointer">
				<div className="flex items-center gap-2">
					<UserRoundPlus size={18} className="text-neutral-500" />
					<div>{`"${searchValue.trim()}"`}</div>
				</div>
				<ArrowUpLeft size={18} className="text-neutral-400" />
			</div>
		);
	}, [
		filteredEmails,
		isFetchingUser,
		isValidEmail,
		searchValue,
		selectedIndex,
		userState,
		handleAddEmail,
		emails,
		user,
		membersInWorkspace,
		membersInNote,
	]);

	const showMessageTextarea = useMemo(() => {
		return !searchValue.trim() && emails.length > 0;
	}, [searchValue, emails]);

	return (
		<div
			className={`w-full relative overflow-hidden ${
				showMessageTextarea ? "min-h-50" : ""
			}`}
		>
			{emails.length ? (
				<div className="px-2">
					<div className="border rounded-md bg-neutral-50 p-0.5 mb-3 min-h-20 px-1">
						{emails.map((em, index) => (
							<ItemEmailReady
								key={index}
								email={em}
								onChangePermission={(permission) => {
									setEmails((prev) =>
										prev.map((e) =>
											e.email === em.email ? { ...e, permission } : e
										)
									);
								}}
								onDelete={(email) => {
									setEmails((prev) => prev.filter((e) => e.email !== email));
								}}
							/>
						))}
					</div>
				</div>
			) : null}
			<Label className="text-neutral-500 px-2 mb-1 text-xs">
				{getLabelInvite()}
			</Label>
			<div className="flex flex-col gap-0.5 px-2" ref={elementRef}>
				{renderContent()}
			</div>
			<div
				className={`absolute transition-all duration-300 left-0 bg-white w-full px-2 pt-4 rounded-t-sm border-t ${
					showMessageTextarea
						? "bottom-0 opacity-100"
						: "bottom-[-100%] opacity-0"
				}`}
				style={{
					boxShadow: `rgba(0, 0, 0, 0.03) 0px -4px 4px`,
					pointerEvents: showMessageTextarea ? "auto" : "none",
				}}
			>
				<Textarea
					className={`border-none outline-0 shadow-none resize-none focus:ring-0 focus:outline-0 focus-within:outline-0 focus-within:ring-0 focus-visible:outline-0 focus-visible:ring-0 `}
					placeholder="Add a message to your invite..."
					value={message}
					onChange={(e) => setMessage(e.target.value)}
				/>
			</div>
		</div>
	);
};

const InputSearchMember = ({
	setIsTabSearch,
	open,
	value,
	onValueChange,
	inputRef,
	isTabSearch,
	disabled,
}: {
	setIsTabSearch: Dispatch<SetStateAction<boolean>>;
	open: boolean;
	value?: string;
	onValueChange?: (value: string) => void;
	inputRef: React.RefObject<HTMLInputElement | null>;
	isTabSearch?: boolean;
	disabled?: boolean;
}) => {
	const [isFocusedInput, setIsFocusedInput] = useState(false);

	const countFocusRef = useRef(0);

	useEffect(() => {
		const inputElem = inputRef.current;

		if (!inputElem) {
			return;
		}

		const handleClick = () => {
			setIsTabSearch(true);
			inputElem.removeEventListener("click", handleClick);
		};

		if (open && isFocusedInput && countFocusRef.current === 1) {
			countFocusRef.current += 1;
			inputElem.addEventListener("click", handleClick);
		} else {
			inputElem.removeEventListener("click", handleClick);
		}

		if (!open) {
			countFocusRef.current = 0;
			setIsTabSearch(false);
			onValueChange?.("");
		}

		return () => {
			inputElem.removeEventListener("click", handleClick);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, isFocusedInput, setIsTabSearch, onValueChange]);

	useEffect(() => {
		if (!isTabSearch) {
			countFocusRef.current = 0;
		}
	}, [isTabSearch]);

	return (
		<input
			className="py-1.5 border rounded-sm w-full px-2 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:opacity-70"
			placeholder="Enter email or group"
			ref={inputRef}
			onFocus={() => {
				countFocusRef.current += 1;
				setIsFocusedInput(true);
				if (countFocusRef.current > 1) {
					setIsTabSearch(true);
				}
			}}
			onBlur={() => {
				countFocusRef.current = 0;
				setIsFocusedInput(false);
			}}
			value={value}
			onChange={(e) => {
				if (onValueChange) {
					onValueChange(e.target.value);
				}
			}}
			disabled={disabled}
		/>
	);
};

const TabSearch = ({
	searchValue,
	inputRef,
	setSearchValue,
	emails,
	setEmails,
	onSubmitAllEmails,
	message,
	setMessage,
}: {
	searchValue: string;
	inputRef: React.RefObject<HTMLInputElement | null>;
	setSearchValue: Dispatch<SetStateAction<string>>;
	emails: TEmailInvite[];
	setEmails: Dispatch<SetStateAction<TEmailInvite[]>>;
	onSubmitAllEmails: (emails: TEmailInvite[], message: string) => void;
	message: string;
	setMessage: Dispatch<SetStateAction<string>>;
}) => {
	return (
		<div className="py-1">
			{(!searchValue || searchValue.trim() === "") && !emails.length ? (
				<div className="flex flex-col items-center justify-center px-2 py-6">
					<div className="size-10 bg-neutral-200 flex items-center justify-center rounded-full">
						<Search size={20} className="text-neutral-400" />
					</div>
					<p className="text-neutral-600 mt-2 font-medium">
						Search by email or group name
					</p>
					<p className="text-neutral-400">Press Enter to invite</p>
					<p className="text-neutral-400">Try typing is correct email</p>
				</div>
			) : (
				<SuggestionEmail
					searchValue={searchValue}
					inputRef={inputRef}
					emails={emails}
					setEmails={setEmails}
					setSearchValue={setSearchValue}
					onSubmitAllEmails={onSubmitAllEmails}
					message={message}
					setMessage={setMessage}
				/>
			)}
		</div>
	);
};

const PopoverShareNote = ({ note }: { note: TNote }) => {
	const { membersInNote, setMembersInNote } = useNote();
	const { currentWorkspace } = useWorkspace();

	const [openSelectGeneralAccess, setOpenSelectGeneralAccess] = useState(false);
	const [open, setOpen] = useState(false);
	const [isTabSearch, setIsTabSearch] = useState(false);
	const [searchValue, setSearchValue] = useState("");
	const [emails, setEmails] = useState<TEmailInvite[]>([]);
	const [message, setMessage] = useState("");

	const inputRef = useRef<HTMLInputElement>(null);

	const {
		state: { user },
	} = useAuth();

	useEffect(() => {
		const fetchMembers = async (id: number) => {
			try {
				const res = await get(`/notes/members/${id}`);
				if (res.members && Array.isArray(res.members)) {
					setMembersInNote(res.members);
				}
			} catch (error) {
				logAction("Error fetching members in note:", error);
			}
		};
		if (note) {
			fetchMembers(note.id);
		}
	}, [note, setMembersInNote]);

	useEffect(() => {
		if (searchValue && searchValue.trim() !== "") {
			setIsTabSearch(true);
		}
	}, [searchValue]);

	useEffect(() => {
		if (!isTabSearch) {
			setEmails([]);
		}
	}, [isTabSearch]);

	const handleSubmitAllEmails = useCallback(
		async (emails: TEmailInvite[], message: string) => {
			if (!emails.length) {
				return;
			}

			try {
				const res = (await post(`/notes/members/invite/${note.id}`, {
					emails,
					message,
					workspace_id: currentWorkspace?.id,
				})) as {
					members: TMemberInNote[];
				};
				if (res.members && Array.isArray(res.members)) {
					setMembersInNote([...membersInNote, ...res.members]);
					setEmails([]);
					setSearchValue("");
					setMessage("");
					setIsTabSearch(false);
					setOpen(false);
				}
			} catch (error) {
				logAction("Error submitting all emails:", error);
			}
		},
		[note, currentWorkspace, setMembersInNote, membersInNote]
	);

	const disabled = !!note.deleted;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant={"ghost"}
					size={"sm"}
					className="h-7 text-sm font-normal"
				>
					Share
				</Button>
			</PopoverTrigger>
			<PopoverContent side="bottom" align="end" className="w-sm p-0 text-sm">
				<div className="flex flex-col w-full py-2">
					<div className="px-2 pb-2 border-b">
						{isTabSearch ? (
							<div className="flex items-center gap-1">
								<Button
									className="size-6"
									variant={"ghost"}
									onClick={() => {
										setIsTabSearch(false);
									}}
								>
									<ChevronLeft className="text-neutral-500" />
								</Button>
								<p className="font-semibold">Invite</p>
							</div>
						) : (
							<p className="px-2 font-semibold">Share</p>
						)}
					</div>
					<div className="px-4 py-3">
						<div className="flex items-center justify-between gap-2">
							<InputSearchMember
								setIsTabSearch={setIsTabSearch}
								open={open}
								value={searchValue}
								onValueChange={setSearchValue}
								inputRef={inputRef}
								isTabSearch={isTabSearch}
								disabled={disabled}
							/>
							<Button
								size={"sm"}
								onClick={() => {
									if (!isTabSearch) {
										setIsTabSearch(true);
									} else {
										handleSubmitAllEmails(emails, message);
									}
								}}
								disabled={disabled}
							>
								Invite
							</Button>
						</div>
					</div>
					{isTabSearch ? (
						<TabSearch
							searchValue={searchValue}
							inputRef={inputRef}
							setSearchValue={setSearchValue}
							emails={emails}
							setEmails={setEmails}
							onSubmitAllEmails={handleSubmitAllEmails}
							message={message}
							setMessage={setMessage}
						/>
					) : (
						<>
							<div className="flex flex-col gap-0 px-2">
								{membersInNote.map((member) => (
									<UserPermissionItem
										key={member.id}
										user={member}
										isSelf={!!(user && user.id === member.id)}
										note={note}
										disabled={disabled}
									/>
								))}
							</div>
							<div className="px-2 py-4">
								<Label className="text-neutral-800 px-2 mb-1 text-xs">
									General access
								</Label>
								<SelectorGeneralAccess
									open={openSelectGeneralAccess}
									onOpenChange={setOpenSelectGeneralAccess}
									note={note}
									members={membersInNote}
									disabled={disabled}
								/>
							</div>
						</>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
};

const TooltipLastEdited = ({
	time_update,
	time_create,
	created_by,
	last_edit_name,
}: {
	time_update: string;
	time_create?: string;
	last_edit_name?: string;
	created_by?: string;
}) => {
	const diff_update = moment(new Date()).diff(moment(time_update), "days");
	const diff_create = moment(new Date()).diff(moment(time_create), "days");

	let time_update_label = "";
	let time_create_label = "";

	if (diff_update < 10) {
		time_update_label = moment(time_update).fromNow();
	} else {
		time_update_label = moment(time_update).format("MMM, DD");
	}

	if (diff_create < 10) {
		time_create_label = moment(time_create).fromNow();
	} else {
		time_create_label = moment(time_create).format("MMM, DD");
	}

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant={"ghost"}
					size={"sm"}
					className="h-7 text-neutral-400 text-sm font-normal"
				>
					<p>Edited {time_update_label}</p>
				</Button>
			</TooltipTrigger>
			<TooltipContent className="opacity-80 space-y-1 py-2 text-neutral-400">
				<p>
					Edited by{" "}
					<span className="text-white">{last_edit_name || "Unknown"}</span>{" "}
					{time_update_label}
				</p>
				<p>
					Created by{" "}
					<span className="text-white">{created_by || "Unknown"}</span>{" "}
					{time_create_label}
				</p>
			</TooltipContent>
		</Tooltip>
	);
};

const NoteHeaderAction = ({
	note,
	setShowThreadComments,
	showThreadComments,
}: {
	note: TNote;
	setShowThreadComments: Dispatch<SetStateAction<boolean>>;
	showThreadComments: boolean;
}) => {
	const {
		state: { user },
	} = useAuth();

	const { onFavoriteNote, noteFavorites, currentNote } = useNote();
	const { currentWorkspace } = useWorkspace();

	const handleFavorite = useCallback(() => {
		if (!user || !currentNote || !currentWorkspace) {
			return;
		}

		if (noteFavorites.find((fav) => fav.id === currentNote.id)) {
			onFavoriteNote(currentNote, currentWorkspace.id, "remove");
		} else {
			onFavoriteNote(currentNote, currentWorkspace.id, "add");
		}
	}, [noteFavorites, onFavoriteNote, user, currentNote, currentWorkspace]);

	const include = useMemo(() => {
		return currentNote && noteFavorites.find((no) => no.id === currentNote.id);
	}, [noteFavorites, currentNote]);

	return (
		<div className="flex items-center gap-0">
			<TooltipLastEdited
				time_update={note.updatedAt}
				time_create={note.createdAt}
				last_edit_name={note.last_updated_by?.fullname}
				created_by={note.created_by?.fullname}
			/>
			{!user || note.permission === "view" ? null : (
				<PopoverShareNote note={note} />
			)}
			<Button
				variant={"ghost"}
				size={"sm"}
				className="h-7 text-sm font-normal"
				onClick={() => setShowThreadComments(!showThreadComments)}
			>
				<MessageSquareText />
			</Button>
			{!user || note.deleted ? null : (
				<Button
					variant={"ghost"}
					size={"sm"}
					className="h-7 text-sm font-normal relative"
					onClick={handleFavorite}
				>
					<Star
						fill="#F6C050"
						stroke="#F6C050"
						className="transition-opacity"
						style={{
							opacity: include ? 1 : 0,
						}}
					/>
					<Star
						className="transition-opacity absolute"
						style={{
							opacity: include ? 0 : 1,
						}}
					/>
				</Button>
			)}
		</div>
	);
};

const NoteHeader = ({ note }: { note: TNote }) => {
	const { open, toggleSidebar } = useSidebar();
	const { setData, data } = useFolderState();
	const { currentWorkspace } = useWorkspace();
	const {
		setCurrentNote,
		setShowThreadComments,
		showThreadComments,
		savingContent,
	} = useNote();

	const [openDialogConfirmDeleteNote, setOpenDialogConfirmDeleteNote] =
		useState(false);

	const handleRestore = useCallback(
		async (id: number, type: TFolder["type"]) => {
			if (!currentWorkspace || !note) {
				return;
			}
			try {
				const res = (await patch(
					`/trash/${type}/restore/${id}?workspace_id=${currentWorkspace.id}`
				)) as TFolder | TNote;

				setData([...data, res]);
				setCurrentNote({
					...note,
					deleted: 0,
				});
			} catch (error) {
				logAction("Error restoring note from trash: ", error);
			}
		},
		[currentWorkspace, setData, data, note, setCurrentNote]
	);

	const handleDelete = useCallback(
		async (id: number, type: TFolder["type"]) => {
			if (!currentWorkspace) {
				return;
			}
			try {
				await patch(
					`/trash/${type}/delete/${id}?workspace_id=${currentWorkspace.id}`
				);
			} catch (error) {
				logAction("Error deleting note from trash: ", error);
			}
		},
		[currentWorkspace]
	);

	return (
		<>
			<header className="min-h-8 sticky top-0 left-0 z-20 flex flex-col w-full py-1 text-sm bg-white">
				<div className="flex items-center justify-between px-4 py-2">
					<div className="flex items-center gap-2">
						{!open && (
							<Button size={"sm"} variant={"ghost"} onClick={toggleSidebar}>
								<Menu className="text-neutral-500" />
							</Button>
						)}
						<p>{note?.title || "New File"}</p>
						{note.status === "private" && (
							<div className="text-neutral-500 hover:bg-neutral-100 flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer">
								<LockKeyhole size={12} />
								<span className="">Private</span>
							</div>
						)}
						<div>
							{savingContent ? <Spinner className="text-secondary" /> : null}
						</div>
					</div>
					<NoteHeaderAction
						note={note}
						setShowThreadComments={setShowThreadComments}
						showThreadComments={showThreadComments}
					/>
				</div>
				{note.deleted ? (
					<div className="bg-destructive/70 flex items-center justify-center gap-2 px-4 py-2 text-white">
						<p>Hoa nguyen moved this file to Trash just now.</p>
						<div className="flex items-center gap-2">
							<Button
								className="h-7 hover:bg-destructive/50 font-normal bg-transparent border border-white"
								onClick={() => {
									handleRestore(note.id, "note");
								}}
							>
								<CornerUpLeft />
								Restore file
							</Button>
							<Button
								className="h-7 hover:bg-destructive/50 font-normal bg-transparent border border-white"
								onClick={() => {
									setOpenDialogConfirmDeleteNote(true);
								}}
							>
								<Trash />
								Delete from Trash
							</Button>
						</div>
					</div>
				) : null}
			</header>
			<AlertDialogConfirm
				open={openDialogConfirmDeleteNote}
				setOpen={setOpenDialogConfirmDeleteNote}
				dialogType="column"
				icon={Trash}
				description="Are you sure you want to delete this note? This action will remove data from our server."
				title="Are you sure?"
				okButton={
					<Button
						variant={"destructive"}
						className="opacity-80"
						onClick={() => handleDelete(note.id, "note")}
					>
						Continue
					</Button>
				}
			/>
		</>
	);
};

const NoteHeaderPublic = ({
	note,
	threadComments,
}: {
	note: TNote | null;
	threadComments?: TThread[];
}) => {
	const showThreadComments = useNote().showThreadComments; // we use this way to avoid re-rendering
	const setShowThreadComments = useNote().setShowThreadComments;
	const setThreadComments = useNote().setThreadComments;

	useEffect(() => {
		if (!note) {
			return;
		}

		setThreadComments(threadComments || []);
	}, [note, threadComments, setThreadComments]);

	return (
		<header className="min-h-8 sticky top-0 left-0 z-20 flex flex-col w-full py-1 text-sm bg-white">
			<div className="flex items-center justify-between px-4 py-2">
				<div className="flex items-center gap-2">
					<p>{note?.title || "New File"}</p>
				</div>
				<div className="flex items-center gap-0">
					<TooltipLastEdited
						time_update={note?.updatedAt || new Date().toISOString()}
						time_create={note?.createdAt || new Date().toISOString()}
						last_edit_name={note?.last_updated_by?.fullname || "Unknown"}
						created_by={note?.created_by?.fullname || "Unknown"}
					/>

					<Button
						variant={"ghost"}
						size={"sm"}
						className="h-7 text-sm font-normal"
						onClick={() => setShowThreadComments(!showThreadComments)}
					>
						<MessageSquareText />
					</Button>
				</div>
			</div>
		</header>
	);
};

export { NoteHeader, NoteHeaderPublic };
