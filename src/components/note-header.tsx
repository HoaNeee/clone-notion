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
	Check,
	ChevronDown,
	ChevronLeft,
	Earth,
	LockKeyhole,
	Menu,
	MessageSquareText,
	Search,
	Star,
	UserRoundPlus,
	X,
} from "lucide-react";
import { Button } from "./ui/button";
import { TMemberInNote, TNote, TNotePermission } from "@/types/note.type";
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
import { get, patch } from "@/utils/request";
import { checkEmail, logAction } from "@/lib/utils";
import { Label } from "./ui/label";
import lodash from "lodash";
import { Textarea } from "./ui/textarea";
import AlertDialogConfirm from "./alert-dialog-confirm";
import { useNote } from "@/contexts/note-context";
import { title } from "process";

type TEmailInvite = {
	email: string;
	is_guest: boolean;
	permission: TNotePermission;
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
							<p className="text-xs text-neutral-400">
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
}: {
	user: TMemberInNote;
	isSelf?: boolean;
}) => {
	const { membersInNote } = useNote();

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
		(user: TMemberInNote, value: string) => {
			setOpenDialogConfirmChangePermission(false);
			if (user.permission === value) {
				return;
			}

			try {
				if (
					!membersInNote.some(
						(mem) => mem.permission !== "admin" && mem.id !== user.id
					) ||
					membersInNote.length <= 1
				) {
					setAlertDialogState({
						open: true,
						title: "Cannot Change Permission",
						description:
							"You cannot change the permission of the last admin. Please assign another admin before changing this permission.",
					});
					return;
				}
				setPermission(value);
			} catch (error) {
				logAction("Error changing permission:", error);
			}
		},
		[membersInNote]
	);

	const handleRemoveUser = useCallback(
		(user: TMemberInNote) => {
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
			setOpenDialogRemoveUser(false);
		},
		[membersInNote]
	);

	return (
		<>
			<div className="flex items-center justify-between w-full py-1 px-2 hover:bg-neutral-100 rounded-md cursor-pointer">
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
						<p className="text-xs text-neutral-400">{user.email}</p>
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
								<p className="text-red-500 hover:text-red-600">Remove</p>
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
				description="Are you sure you want to remove this user? They will no longer have access to this note."
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
}: {
	open: boolean;
	onOpenChange: Dispatch<SetStateAction<boolean>>;
	note: TNote;
	members: TMemberInNote[];
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
			className="flex items-center justify-between w-full py-1 px-2 hover:bg-neutral-100 rounded-md cursor-pointer"
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
							<div className="size-8 rounded-sm bg-neutral-200/70 flex items-center justify-center">
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
							<div className="size-6 rounded-sm bg-neutral-50/50 flex items-center justify-center">
								<LockKeyhole />
							</div>
							Only people invited
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => handleChangeStatus("workspace")}>
							<div className="size-6 rounded-sm bg-neutral-200/70 flex items-center justify-center">
								W
							</div>
							Everyone in workspace
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => handleChangeStatus("public")}>
							<div className="size-6 rounded-sm bg-neutral-50/50 flex items-center justify-center">
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
											<p className="text-xs text-neutral-400">
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
			<div className="p-1 flex items-center gap-2 bg-yellow-500/10 rounded-xs text-neutral-600">
				<div className="flex items-center gap-1">
					<Earth size={16} className="text-yellow-600/50" />
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
}: {
	searchValue: string;
	inputRef: React.RefObject<HTMLInputElement | null>;
	emails: TEmailInvite[];
	setEmails: React.Dispatch<React.SetStateAction<TEmailInvite[]>>;
	setSearchValue: React.Dispatch<React.SetStateAction<string>>;
	onSubmitAllEmails: (emails: TEmailInvite[], message: string) => void;
}) => {
	const [filteredEmails, setFilteredEmails] = useState<string[]>([]);
	const [selectedIndex, setSelectedIndex] = useState<number>(-1);

	const [isValidEmail, setIsValidEmail] = useState<boolean>(false);
	const [userState, setUserState] = useState<{
		email: string;
		avatar: string;
		fullname: string;
	} | null>(null);
	const [isFetchingUser, setIsFetchingUser] = useState<boolean>(false);
	const [message, setMessage] = useState<string>("");

	const elementRef = useRef<HTMLDivElement>(null);

	const debouncedFetchUser = useRef(
		lodash.debounce((val: string) => fetchEmail(val), 500)
	).current;

	const fetchEmail = async (email: string) => {
		//fake fetch email
		console.log("call");
		const rand = Math.floor(Math.random() * 50);
		const userFake = {
			email: email,
			avatar: `https://i.pravatar.cc/150?img=${rand}`,
			fullname: "Hoa Nguyen " + rand,
		};

		try {
			setIsFetchingUser(true);
			setUserState(userFake);
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
	}, []);

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
				handleSubmitEmail(filteredEmails[selectedIndex] || searchValue.trim());
			}
		};

		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedIndex, filteredEmails, searchValue]);

	useEffect(() => {
		debouncedFetchUser.cancel();
		if (isValidEmail) {
			debouncedFetchUser(searchValue);
		} else {
			setUserState(null);
		}
	}, [isValidEmail, debouncedFetchUser, searchValue]);

	const handleSubmitEmail = useCallback(
		(email: string) => {
			if (searchValue.trim()) {
				let reset = true;
				setEmails((prev) => {
					if (prev.find((em) => em.email === email)) {
						reset = false;
						return prev.filter((e) => e.email !== email);
					} else {
						reset = true;
						return [...prev, { email, is_guest: true, permission: "admin" }]; // FIX THEN
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
		]
	);

	const getLabelInvite = useCallback(() => {
		if (isValidEmail && !isFetchingUser && userState) {
			return "Not invited to page";
		}

		return 'Keep typing to an email"';
	}, [isValidEmail, isFetchingUser, userState]);

	const renderContent = useCallback(() => {
		if (!isValidEmail) {
			return filteredEmails.map((email, index) => (
				<div
					key={index}
					className={`w-full flex items-center justify-between px-3 rounded-md cursor-pointer py-1 hover:bg-neutral-100 ${
						selectedIndex === index ? "bg-neutral-100" : ""
					}`}
					onClick={() => handleSubmitEmail(email)}
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
			return (
				<div
					className="w-full flex items-center justify-between px-3 bg-neutral-100 rounded-md cursor-pointer py-1"
					onClick={() => handleSubmitEmail(userState.email)}
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
								<span className="px-1.5 text-xs bg-yellow-400/20 text-yellow-600 rounded-xs flex items-center justify-center">
									Guest
								</span>
							</div>
							<p className="text-xs text-neutral-400">{userState.email}</p>
						</div>
					</div>
					<div className="size-4 rounded-full bg-transparent border border-neutral-400 flex items-center justify-center">
						<div className="size-2 bg-blue-500/70 rounded-full"></div>
					</div>
				</div>
			);
		}

		return (
			<div className="w-full flex items-center justify-between px-2 bg-neutral-100 rounded-md cursor-pointer py-1">
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
		handleSubmitEmail,
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
			<Label className="text-neutral-500 text-xs px-2 mb-1">
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
}: {
	setIsTabSearch: Dispatch<SetStateAction<boolean>>;
	open: boolean;
	value?: string;
	onValueChange?: (value: string) => void;
	inputRef: React.RefObject<HTMLInputElement | null>;
	isTabSearch?: boolean;
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

	useEffect(() => {
		const inputElem = inputRef.current;

		if (!inputElem) {
			return;
		}

		//fake blur when click outside input
		const onPointerDown = (e: PointerEvent) => {
			const target = e.target as HTMLElement;

			if (!(target === inputElem || inputElem.contains(target))) {
				setIsFocusedInput(false);
			}
		};

		inputElem.addEventListener("pointerdown", onPointerDown);

		return () => {
			inputElem.removeEventListener("pointerdown", onPointerDown);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<input
			className="py-1.5 border rounded-sm w-full px-2"
			placeholder="Enter email or group"
			ref={inputRef}
			onFocus={() => {
				countFocusRef.current += 1;
				setIsFocusedInput(true);
				if (countFocusRef.current > 1) {
					setIsTabSearch(true);
				}
			}}
			value={value}
			onChange={(e) => {
				if (onValueChange) {
					onValueChange(e.target.value);
				}
			}}
		/>
	);
};

const TabSearch = ({
	searchValue,
	inputRef,
	setSearchValue,
	onSubmitAllEmails,
}: {
	searchValue: string;
	inputRef: React.RefObject<HTMLInputElement | null>;
	setSearchValue: Dispatch<SetStateAction<string>>;
	onSubmitAllEmails: (emails: TEmailInvite[], message: string) => void;
}) => {
	const [emails, setEmails] = useState<TEmailInvite[]>([]);

	return (
		<div className="py-1">
			{(!searchValue || searchValue.trim() === "") && !emails.length ? (
				<div className="py-6 flex items-center justify-center flex-col px-2">
					<div className="size-10 bg-neutral-200 rounded-full flex items-center justify-center">
						<Search size={20} className="text-neutral-400" />
					</div>
					<p className="text-neutral-600 font-medium mt-2">
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
				/>
			)}
		</div>
	);
};

const PopoverShareNote = ({ note }: { note: TNote }) => {
	const { membersInNote, setMembersInNote } = useNote();

	const [openSelectGeneralAccess, setOpenSelectGeneralAccess] = useState(false);
	const [open, setOpen] = useState(false);
	const [isTabSearch, setIsTabSearch] = useState(false);
	const [searchValue, setSearchValue] = useState("");

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

	const handleSubmitAllEmails = (emails: TEmailInvite[]) => {
		console.log("Submit all emails:", emails);
	};

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
			<PopoverContent side="bottom" align="end" className="text-sm w-sm p-0">
				<div className="w-full py-2 flex flex-col">
					<div className="px-2 border-b pb-2">
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
							<p className="font-semibold px-2">Share</p>
						)}
					</div>
					<div className="py-3 px-4">
						<div className="flex items-center gap-2 justify-between">
							<InputSearchMember
								setIsTabSearch={setIsTabSearch}
								open={open}
								value={searchValue}
								onValueChange={setSearchValue}
								inputRef={inputRef}
								isTabSearch={isTabSearch}
							/>
							<Button size={"sm"}>Invite</Button>
						</div>
					</div>
					{isTabSearch ? (
						<TabSearch
							searchValue={searchValue}
							inputRef={inputRef}
							setSearchValue={setSearchValue}
							onSubmitAllEmails={handleSubmitAllEmails}
						/>
					) : (
						<>
							<div className="flex flex-col gap-0 px-2">
								{membersInNote.map((member) => (
									<UserPermissionItem
										key={member.id}
										user={member}
										isSelf={!!(user && user.id === member.id)}
									/>
								))}
							</div>
							<div className="px-2 py-4">
								<Label className="px-2 text-xs text-neutral-800 mb-1">
									General access
								</Label>
								<SelectorGeneralAccess
									open={openSelectGeneralAccess}
									onOpenChange={setOpenSelectGeneralAccess}
									note={note}
									members={membersInNote}
								/>
							</div>
						</>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
};

const NoteHeaderAction = ({ note }: { note: TNote }) => {
	const {
		state: { user },
	} = useAuth();
	return (
		<div className="flex items-center gap-0">
			<Button
				variant={"ghost"}
				size={"sm"}
				className="h-7 text-neutral-400 text-sm font-normal"
			>
				<p>Edited 3 days ago</p>
			</Button>
			{!user || note.permission === "view" ? null : (
				<PopoverShareNote note={note} />
			)}
			<Button variant={"ghost"} size={"sm"} className="h-7 text-sm font-normal">
				<MessageSquareText />
			</Button>
			{!user ? null : (
				<Button
					variant={"ghost"}
					size={"sm"}
					className="h-7 text-sm font-normal"
				>
					<Star />
				</Button>
			)}
		</div>
	);
};

const NoteHeader = ({ note }: { note: TNote }) => {
	const { open, toggleSidebar } = useSidebar();

	return (
		<header className="sticky z-20 px-4 top-0 left-0 w-full bg-white py-3 text-sm flex items-center justify-between  min-h-8">
			<div className="flex items-center gap-2">
				{!open && (
					<Button size={"sm"} variant={"ghost"} onClick={toggleSidebar}>
						<Menu className="text-neutral-500" />
					</Button>
				)}
				<p>{note?.title || "New File"}</p>
				{note.status === "private" && (
					<div className="flex items-center gap-1 text-neutral-500 hover:bg-neutral-100 px-2 py-1 rounded-md cursor-pointer">
						<LockKeyhole size={12} />
						<span className="">Private</span>
					</div>
				)}
			</div>
			<NoteHeaderAction note={note} />
		</header>
	);
};

export default NoteHeader;
