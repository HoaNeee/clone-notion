import { useWorkspace } from "@/contexts/workspace-context";
import { logAction, sleep } from "@/lib/utils";
import { TFolder } from "@/types/folder.type";
import { TNote } from "@/types/note.type";
import { TWorkspaceRole } from "@/types/workspace.type";
import { post } from "@/utils/request";
import { useRouter } from "next/navigation";
import {
	Dispatch,
	SetStateAction,
	useCallback,
	useEffect,
	useState,
} from "react";
import { DialogLoading } from "../loading";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { X } from "lucide-react";
import DialogAddNewMemberToWorkspace, {
	SelectorRole,
} from "./dialog-add-member-to-workspace";
import { Textarea } from "../ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { useFolderState } from "@/contexts/folder-context";

const initialPayloadAddMembersState = {
	emails: [] as string[],
	role: "admin" as TWorkspaceRole,
	message: "",
};

type PayloadAddMemberState = typeof initialPayloadAddMembersState;

const DialogAddNewWorkspace = ({
	open,
	setOpen,
}: {
	open: boolean;
	setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
	const { createNewWorkspace, addMembersToWorkspace } = useWorkspace();

	const { createRootFolderAndNoteDefaultInTeamspace } = useFolderState();

	const {
		state: { user },
	} = useAuth();

	const [loading, setLoading] = useState(false);
	const [openDialogAddMember, setOpenDialogAddMember] = useState(false);
	const [payloadAddMembersState, setPayloadAddMembersState] =
		useState<PayloadAddMemberState>(initialPayloadAddMembersState);
	const router = useRouter();

	useEffect(() => {
		if (!open) {
			setPayloadAddMembersState(initialPayloadAddMembersState);
		}
	}, [open]);

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
				const newWorkspace = await createNewWorkspace(
					{ title },
					payloadAddMembersState.emails.length + 1
				);
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
					if (payloadAddMembersState.emails.length) {
						await sleep(1000);
						await addMembersToWorkspace(
							newWorkspace.id,
							payloadAddMembersState.emails,
							payloadAddMembersState.role,
							payloadAddMembersState.message
						);
						await sleep(1000);
						await createRootFolderAndNoteDefaultInTeamspace(newWorkspace.id);
					}
				}
			} catch (error) {
				logAction("Error creating workspace:", error);
			} finally {
				setLoading(false);
			}
		},
		[
			router,
			setOpen,
			loading,
			createNewWorkspace,
			payloadAddMembersState,
			addMembersToWorkspace,
			createRootFolderAndNoteDefaultInTeamspace,
		]
	);

	const hasMembersToAdd = payloadAddMembersState.emails.length > 0;

	const defaultWorkspaceTitle = user
		? `${user.fullname}'s Workspace`
		: `My Workspace`;

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
						<div className="min-h-50 flex flex-col gap-2 pb-6">
							<div className="flex flex-col gap-2">
								<Label htmlFor="title">Workspace Name</Label>
								<Input
									type="text"
									name="title"
									placeholder={defaultWorkspaceTitle}
									defaultValue={defaultWorkspaceTitle}
								/>
							</div>
							<div className="space-y-2 mt-4">
								<div className="flex w-full justify-between items-center">
									<Label
										htmlFor="invite-members"
										onClick={() => {
											if (!hasMembersToAdd) {
												setOpenDialogAddMember(true);
											}
										}}
									>
										Invite Members (optional)
									</Label>
									{hasMembersToAdd ? (
										<Button
											className="h-7"
											size={"sm"}
											variant={"outline"}
											onClick={() => {
												setOpenDialogAddMember(true);
											}}
											type="button"
										>
											Add Members
										</Button>
									) : null}
								</div>
								<div
									id="invite-members"
									className={`min-h-20 p-2 text-sm text-neutral-500 border rounded-md bg-neutral-50 ${
										!hasMembersToAdd
											? "flex items-center justify-center hover:shadow cursor-pointer"
											: ""
									}`}
									onClick={() => {
										if (!hasMembersToAdd) {
											setOpenDialogAddMember(true);
										}
									}}
								>
									{hasMembersToAdd ? (
										<div className="flex flex-row flex-wrap gap-2">
											{payloadAddMembersState.emails.map((em, key) => (
												<div
													key={key}
													className="px-2 py-0.5 bg-neutral-200 rounded-sm text-sm items-center gap-1 inline-flex h-fit"
												>
													<span>{em}</span>
													<Button
														className="size-4.5 rounded-sm hover:bg-neutral-300"
														variant={"ghost"}
														onClick={() => {
															const newEmails =
																payloadAddMembersState.emails.filter(
																	(e) => e !== em
																);
															setPayloadAddMembersState((prev) => ({
																...prev,
																emails: newEmails,
															}));
														}}
													>
														<X />
													</Button>
												</div>
											))}
										</div>
									) : (
										<p>Invite members to your workspace (click here)</p>
									)}
								</div>
								{hasMembersToAdd && (
									<div className="mt-2">
										<Label className="text-neutral-500 block mb-1 text-xs font-medium">
											Select role
										</Label>
										<SelectorRole
											setRole={(role) => {
												setPayloadAddMembersState((prev) => ({
													...prev,
													role,
												}));
											}}
											defaultValue={payloadAddMembersState.role}
										/>
									</div>
								)}

								{hasMembersToAdd && (
									<div className="mt-2">
										<Label className="text-neutral-500 block mb-1 text-xs font-medium">
											Message
										</Label>
										<Textarea
											className="bg-neutral-50"
											placeholder="Add a message..."
											value={payloadAddMembersState.message}
											onChange={(e) => {
												setPayloadAddMembersState((prev) => ({
													...prev,
													message: e.target.value,
												}));
											}}
										/>
									</div>
								)}
							</div>
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
			<DialogAddNewMemberToWorkspace
				open={openDialogAddMember}
				setOpen={setOpenDialogAddMember}
				onSubmit={(emails, role, message) => {
					setPayloadAddMembersState({ emails, role, message });
				}}
				defaultValue={payloadAddMembersState}
				okTitle="Add Members"
			/>
		</>
	);
};

export default DialogAddNewWorkspace;
