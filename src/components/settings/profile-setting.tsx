"use client";

import React, { useCallback, useEffect, useState } from "react";
import { SettingMenu, SettingMenuGroup, SettingMenuItem } from "./settings";
import { Button, ButtonLoading } from "../ui/button";
import { ChevronRight, X } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../ui/dialog";
import { MyInput } from "../ui/input";
import { checkEmail, logAction, sleep } from "@/lib/utils";
import { myToast } from "@/utils/toast";
import { postImage } from "@/utils/request";
import { Spinner } from "../ui/spinner";

const initialStepState = {
	isConfirm: true,
	isVerifyCurrentEmail: false,
	isConfirmNewEmail: false,
	isVerifyNewEmail: false,
};

type StepState = typeof initialStepState;

const DialogConfirmChangeEmail = ({
	open,
	setOpen,
}: {
	open: boolean;
	setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
	const { updateUser } = useAuth();

	const [step, setStep] = useState<StepState>(initialStepState);
	const [error, setError] = useState<{
		step: keyof StepState;
		message: string;
	} | null>(null);
	const [loading, setLoading] = useState(false);

	const inputCode1Ref = React.useRef<HTMLInputElement>(null);
	const inputNewEmailRef = React.useRef<HTMLInputElement>(null);
	const inputCode2Ref = React.useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (!open) {
			setStep(initialStepState);
		}
	}, [open]);

	const onSubmit = useCallback(
		async (e: React.FormEvent<HTMLFormElement>) => {
			const inputCode1 = inputCode1Ref.current;
			const inputNewEmail = inputNewEmailRef.current;
			const inputCode2 = inputCode2Ref.current;

			e.preventDefault();

			let current_step: keyof StepState = "isConfirm";

			try {
				setLoading(true);
				if (step.isVerifyNewEmail) {
					if (!inputCode2) {
						return;
					}

					const value = inputCode2.value;
					current_step = "isVerifyNewEmail";

					if (!value.trim()) {
						setError({
							step: current_step,
							message: "Verification code is required",
						});
						return;
					}

					//call api, update email, verify code
					await sleep(1000);

					// updateUser({ email: value.trim() });
					setOpen(false);
				} else if (step.isConfirmNewEmail) {
					if (!inputNewEmail) {
						return;
					}

					const value = inputNewEmail.value;
					current_step = "isConfirmNewEmail";
					if (!value.trim()) {
						setError({
							step: current_step,
							message: "New email is required",
						});
						return;
					}

					if (!checkEmail(value.trim())) {
						setError({
							step: current_step,
							message: "Invalid email format",
						});
						return;
					}

					await sleep(1000);

					setStep({ ...step, isVerifyNewEmail: true });
				} else if (step.isVerifyCurrentEmail) {
					if (!inputCode1) {
						return;
					}

					current_step = "isVerifyCurrentEmail";

					const value = inputCode1.value;
					if (!value.trim()) {
						setError({
							step: current_step,
							message: "Verification code is required",
						});
						return;
					}

					await sleep(1000);

					setStep({ ...step, isConfirmNewEmail: true });
				} else if (step.isConfirm) {
					await sleep(1000);
					setStep({ ...step, isVerifyCurrentEmail: true });
				}
			} catch (error) {
				logAction("Error in changing email:", error);
				setError({
					step: current_step,
					message: "An unexpected error occurred. Please try again.",
				});
			} finally {
				setLoading(false);
			}
		},
		[step, setOpen]
	);

	const renderError = useCallback(
		(step: keyof StepState) => {
			if (!error || error.step !== step) {
				return null;
			}
			return <p className="text-destructive text-xs">{error.message}</p>;
		},
		[error]
	);

	const renderStepContent = (step: StepState) => {
		return (
			<div className="flex flex-col gap-5 mt-2">
				{step.isVerifyCurrentEmail && (
					<div className="flex flex-col gap-2">
						<MyInput
							placeholder="Enter verification code"
							disabled={step.isConfirmNewEmail || step.isVerifyNewEmail}
							autoFocus
							ref={inputCode1Ref}
							onChange={() => setError(null)}
						/>
						{renderError("isVerifyCurrentEmail")}
					</div>
				)}
				{step.isConfirmNewEmail && (
					<div className="flex flex-col gap-2">
						<label htmlFor="new-email">
							Please enter a new email and we will send you a verification code.
						</label>
						<MyInput
							placeholder="New email address"
							id="new-email"
							autoFocus
							ref={inputNewEmailRef}
							onChange={() => setError(null)}
							disabled={step.isVerifyNewEmail}
						/>
						{renderError("isConfirmNewEmail")}
					</div>
				)}
				{step.isVerifyNewEmail && (
					<div className="flex flex-col gap-2">
						<label htmlFor="verify-new-email">
							We have sent a verification code to your new email. Please enter
							it below to confirm the change.
						</label>
						<MyInput
							placeholder="Enter verification code"
							id="verify-new-email"
							autoFocus
							ref={inputCode2Ref}
							onChange={() => setError(null)}
						/>
						{renderError("isVerifyNewEmail")}
					</div>
				)}
			</div>
		);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<span />
			</DialogTrigger>
			<DialogContent>
				<DialogHeader className="hidden">
					<DialogTitle />
					<DialogDescription />
				</DialogHeader>
				<form className="text-sm" onSubmit={onSubmit}>
					<p>
						Your current email is <span>nhhoa03@gmail.com</span>. We’ll send a
						temporary verification code to this email.
					</p>

					{renderStepContent(step)}
					<ButtonLoading type="submit" className="mt-4" loading={loading}>
						{step.isVerifyNewEmail
							? "Confirm Change Email"
							: "Send verification code"}
					</ButtonLoading>
				</form>
			</DialogContent>
		</Dialog>
	);
};

const DialogChangePassword = ({
	open,
	setOpen,
}: {
	open: boolean;
	setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const onSubmit = useCallback(
		async (e: React.FormEvent<HTMLFormElement>) => {
			e.preventDefault();

			try {
				setLoading(true);
				const currentPassword = e.currentTarget.elements[0] as HTMLInputElement;
				const newPassword = e.currentTarget.elements[1] as HTMLInputElement;
				const confirmNewPassword = e.currentTarget
					.elements[2] as HTMLInputElement;

				if (
					!currentPassword.value.trim() ||
					!newPassword.value.trim() ||
					!confirmNewPassword.value.trim()
				) {
					setError("All fields are required");
					return;
				}
				if (newPassword.value !== confirmNewPassword.value) {
					setError("New password and confirm password do not match");
					return;
				}
				await sleep(1000);

				console.log("Change password:", {
					currentPassword: currentPassword.value,
					newPassword: newPassword.value,
				});
				setOpen(false);
			} catch (error) {
				logAction("Error in changing password:", error);
				setError("An unexpected error occurred. Please try again.");
			} finally {
				setLoading(false);
			}
		},
		[setOpen]
	);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<span />
			</DialogTrigger>
			<DialogContent>
				<DialogHeader className="hidden">
					<DialogTitle />
					<DialogDescription />
				</DialogHeader>
				<form className="text-sm" onSubmit={onSubmit}>
					<div className="flex flex-col gap-2">
						<label htmlFor="current-password">Current Password</label>
						<MyInput
							id="current-password"
							placeholder="Enter current password"
							type="password"
							autoFocus
							onChange={() => setError(null)}
						/>
					</div>
					<div className="flex flex-col gap-2 mt-4">
						<label htmlFor="new-password">New Password</label>
						<MyInput
							id="new-password"
							placeholder="Enter new password"
							type="password"
							onChange={() => setError(null)}
						/>
					</div>
					<div className="flex flex-col gap-2 mt-4">
						<label htmlFor="confirm-new-password">Confirm New Password</label>
						<MyInput
							id="confirm-new-password"
							placeholder="Confirm new password"
							type="password"
							onChange={() => setError(null)}
						/>
					</div>

					{error && <p className="text-destructive text-xs mt-2">{error}</p>}

					<ButtonLoading type="submit" className="mt-4" loading={loading}>
						Change Password
					</ButtonLoading>
				</form>
			</DialogContent>
		</Dialog>
	);
};

const ProfileSettings = () => {
	const {
		state: { user },
		updateUser,
	} = useAuth();

	const [fullname, setFullname] = React.useState(user?.fullname || "");
	const [openDialogConfirmChangeEmail, setOpenDialogConfirmChangeEmail] =
		React.useState(false);
	const [openDialogChangePassword, setOpenDialogChangePassword] =
		React.useState(false);
	const [avatarTemp, setAvatarTemp] = React.useState<string | null>(null);
	const [uploading, setUploading] = React.useState(false);

	const inputRef = React.useRef<HTMLInputElement>(null);
	const inputFileRef = React.useRef<HTMLInputElement>(null);

	const handleChangeAvatar = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];

			if (file) {
				try {
					setUploading(true);
					const url = URL.createObjectURL(file);
					setAvatarTemp(url);
					await sleep(5000);
					const res = (await postImage("image", file)) as string;
					updateUser({ avatar: res });
				} catch (error) {
					logAction("Error uploading avatar:", error);
					myToast({
						title: "Error",
						description: "Failed to upload avatar. Please try again.",
					});
				} finally {
					setUploading(false);
					setAvatarTemp(null);
				}
			}
		},
		[updateUser]
	);

	if (!user) {
		return null;
	}

	return (
		<>
			<div className="flex flex-col w-full h-full overflow-hidden rounded-md p-5 overflow-y-auto max-h-full">
				<SettingMenuGroup label="Profile">
					<div className="flex flex-col w-full gap-5 py-6 text-sm">
						<div className="w-full">
							<div className="max-w-1/2 flex items-center w-full gap-5 py-4">
								<div className="size-14 relative group rounded-full">
									{uploading && (
										<div className="absolute size-full bg-black/20 rounded-full z-10 flex items-center justify-center pointer-events-none inset-0">
											<Spinner className="text-white" />
										</div>
									)}

									<label
										htmlFor="avatar-upload"
										style={{
											cursor: uploading ? "not-allowed" : "pointer",
										}}
									>
										<Avatar className="size-full">
											<AvatarImage
												src={avatarTemp || user.avatar || undefined}
												className="object-cover"
											/>

											<AvatarFallback className="text-lg border">
												{user.fullname
													? user.fullname.charAt(0).toUpperCase()
													: "U"}
											</AvatarFallback>
										</Avatar>
									</label>

									{user.avatar && !uploading && (
										<div
											className="absolute right-0 top-0 size-4 rounded-full group-hover:flex hidden items-center justify-center bg-neutral-900/70 hover:bg-neutral-900 text-neutral-200 cursor-pointer"
											onClick={() => {
												updateUser({ avatar: "" });
												if (inputFileRef.current) {
													inputFileRef.current.value = "";
												}
											}}
										>
											<X size={14} />
										</div>
									)}
									{!uploading && (
										<input
											hidden
											id="avatar-upload"
											type="file"
											accept="image/*"
											onChange={handleChangeAvatar}
											ref={inputFileRef}
										/>
									)}
								</div>
								<div className="space-y-0.5">
									<p className="text-neutral-500 text-xs font-normal">
										Preferred name
									</p>
									<MyInput
										value={fullname || ""}
										onChange={(e) => setFullname(e.target.value)}
										onBlur={() => {
											updateUser({ fullname });
										}}
										ref={inputRef}
										onKeyDown={(e) => {
											if (!e.ctrlKey && e.key === "Enter") {
												e.preventDefault();
												if (inputRef.current) {
													inputRef.current.blur();
												}
												updateUser({ fullname });
											}
										}}
									/>
								</div>
							</div>
							{!user.avatar && (
								<label
									htmlFor="avatar-upload"
									className="font-normal text-sm cursor-pointer text-blue-600/80 hover:underline"
								>
									Add photo
								</label>
							)}
						</div>
					</div>
					<SettingMenuGroup label="Account Security">
						<SettingMenu>
							<SettingMenuItem
								action={
									<Button
										variant={"outline"}
										size={"sm"}
										onClick={() => setOpenDialogConfirmChangeEmail(true)}
									>
										Change Email
									</Button>
								}
								label="Email"
								description={user?.email || "No email provided"}
							/>
							<SettingMenuItem
								action={
									<Button
										variant={"outline"}
										size={"sm"}
										onClick={() => setOpenDialogChangePassword(true)}
									>
										Change Password
									</Button>
								}
								label="Password"
								description={"Change your account password"}
							/>
						</SettingMenu>
					</SettingMenuGroup>
					<SettingMenuGroup label="Support">
						<SettingMenu>
							<SettingMenuItem
								action={
									<Button variant={"ghost"} size={"sm"}>
										<ChevronRight />
									</Button>
								}
								className="cursor-pointer"
								label={
									<p className="text-destructive font-semibold">
										Delete Account
									</p>
								}
								description={
									"Permanently delete your account and all associated data."
								}
								onClick={() => {
									console.log("delete account");
								}}
							/>
						</SettingMenu>
					</SettingMenuGroup>
				</SettingMenuGroup>
			</div>
			<DialogConfirmChangeEmail
				open={openDialogConfirmChangeEmail}
				setOpen={setOpenDialogConfirmChangeEmail}
			/>
			<DialogChangePassword
				open={openDialogChangePassword}
				setOpen={setOpenDialogChangePassword}
			/>
		</>
	);
};

export default ProfileSettings;
