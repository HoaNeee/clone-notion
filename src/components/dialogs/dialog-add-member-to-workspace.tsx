import React, { useCallback, useEffect, useState } from "react";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Mail, User, UserLock, UserPlus, X } from "lucide-react";
import { useWorkspace } from "@/contexts/workspace-context";
import { checkEmail } from "@/lib/utils";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { TWorkspaceRole } from "@/types/workspace.type";

export const roles = [
	{
		value: "admin",
		label: "Workspace Owner",
		description:
			"Can manage workspace settings and invite new members to workspace",
		icon: UserLock,
	},
	{
		value: "member",
		label: "Member",
		description:
			"Cannot manage workspace settings and and invite new members to workspace",
		icon: User,
	},
];

export const SelectorRole = ({
	setRole,
	defaultValue,
}: {
	setRole: (role: TWorkspaceRole) => void;
	defaultValue?: TWorkspaceRole;
}) => {
	return (
		<Select
			defaultValue={defaultValue || "admin"}
			onValueChange={(value) => setRole(value as TWorkspaceRole)}
		>
			<SelectTrigger className="w-full whitespace-pre-wrap max-w-full min-h-18 data-[size=default]:h-auto data-[size=sm]:h-auto">
				<SelectValue
					placeholder="Select role for new members"
					className="flex items-start"
				/>
			</SelectTrigger>
			<SelectContent className="z-10001">
				<SelectGroup>
					{roles.map((role, key) => (
						<SelectItem value={role.value} className="" key={key}>
							<role.icon />
							<div className="text-left">
								<p>{role.label}</p>
								<p className="text-neutral-500 text-xs">{role.description}</p>
							</div>
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
};

const DialogAddNewMemberToWorkspace = ({
	open,
	setOpen,
	onSubmit,
	defaultValue,
	okTitle,
}: {
	open: boolean;
	setOpen: (open: boolean) => void;
	onSubmit: (
		emails: string[],
		role: TWorkspaceRole,
		message: string
	) => void | Promise<void>;
	defaultValue?: { emails?: string[]; role?: TWorkspaceRole; message?: string };
	okTitle?: string;
}) => {
	const [inputEmail, setInputEmail] = useState("");
	const [emailList, setEmailList] = useState<string[]>([]);
	const [role, setRole] = useState<TWorkspaceRole>("admin");
	const [message, setMessage] = useState("");
	const [isFocusedInput, setIsFocusedInput] = useState(false);

	const { currentWorkspace } = useWorkspace();

	const handleSubmit = useCallback(async () => {
		if (!currentWorkspace) {
			return;
		}
		if (onSubmit) {
			onSubmit(emailList, role, message);
		}

		setOpen(false);
	}, [emailList, role, message, onSubmit, currentWorkspace, setOpen]);

	useEffect(() => {
		if (!open) {
			setInputEmail("");
			setEmailList([]);
			setRole("admin");
			setMessage("");
		}
	}, [open]);

	useEffect(() => {
		if (defaultValue && open) {
			setEmailList(defaultValue.emails || []);
			setRole(defaultValue.role || "admin");
			setMessage(defaultValue.message || "");
		}
	}, [defaultValue, open]);

	const handleAddEmail = useCallback(
		(email: string) => {
			if (checkEmail(email.trim())) {
				if (emailList.includes(email.trim())) {
					setInputEmail("");
					return;
				}
				setEmailList((prev) => [...prev, email.trim()]);
				setInputEmail("");
			}
		},
		[emailList]
	);

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
									handleAddEmail(inputEmail);
								}
							}}
							value={inputEmail}
							onChange={(e) => setInputEmail(e.target.value)}
							onFocus={() => setIsFocusedInput(true)}
							onBlur={() => {
								setIsFocusedInput(false);
								handleAddEmail(inputEmail);
							}}
						/>
						{isFocusedInput && inputEmail.trim().length ? (
							<div
								className="top-11 absolute left-0 w-full p-1 text-sm bg-white rounded shadow"
								onPointerDown={(e) => e.preventDefault()}
							>
								<div
									className="bg-neutral-200/60 flex items-center w-full gap-2 p-1 text-sm rounded-sm cursor-pointer"
									onClick={() => handleAddEmail(inputEmail)}
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
								emailList.map((email, key) => (
									<div
										key={key}
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
						<SelectorRole
							setRole={setRole}
							defaultValue={defaultValue?.role || "admin"}
						/>
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
						disabled={emailList.length === 0 || inputEmail.trim().length > 0}
					>
						{okTitle || "Send Invites"}
					</Button>
					<DialogClose asChild>
						<Button variant={"outline"}>Cancel</Button>
					</DialogClose>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default DialogAddNewMemberToWorkspace;
