"use client";

import React, { Dispatch, SetStateAction, useCallback, useEffect } from "react";
import { Input } from "./ui/input";
import { ButtonLoading } from "./ui/button";
import { z } from "zod";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
} from "./ui/form";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import ResendOTPButton from "./resend-otp-button";

const loginFormSchema = z.object({
	email: z.string(),
	otp: z.string(),
	password: z.string(),
});

const FieldVerificationCode = ({
	form,
	setError,
	stepType,
}: {
	form: UseFormReturn<z.infer<typeof loginFormSchema>>;
	setError: Dispatch<SetStateAction<string | null>>;
	stepType: string;
}) => {
	useEffect(() => {
		return () => {
			form.setValue("otp", "");
		};
	}, [form]);

	if (stepType !== "otp") {
		return null;
	}

	return (
		<FormField
			control={form.control}
			name="otp"
			render={({ field }) => {
				return (
					<FormItem>
						<FormLabel className="text-gray-500 font-medium">
							Verification Code
						</FormLabel>
						<div className="flex flex-col gap-1">
							<FormControl
								onChange={() => {
									setError(null);
								}}
							>
								<Input
									placeholder="Enter verification code here"
									type="text"
									className="rounded-sm py-5"
									{...field}
								/>
							</FormControl>
							<FormDescription className="text-xs">
								We have sent a verification code to your email.
							</FormDescription>
						</div>
					</FormItem>
				);
			}}
		/>
	);
};

const FieldPassword = ({
	form,
	setError,
	description,
	setDescription,
	stepType,
}: {
	form: UseFormReturn<z.infer<typeof loginFormSchema>>;
	setError: Dispatch<SetStateAction<string | null>>;
	description: string;
	setDescription: Dispatch<SetStateAction<string>>;
	stepType: string;
}) => {
	useEffect(() => {
		return () => {
			form.setValue("password", "");
			setDescription("");
		};
	}, [form, setDescription]);

	if (stepType !== "newPassword" && stepType !== "password") {
		return null;
	}

	return (
		<FormField
			control={form.control}
			name="password"
			render={({ field }) => {
				return (
					<FormItem>
						<FormLabel className="text-gray-500 font-medium">
							Password
						</FormLabel>
						<FormControl
							onChange={() => {
								setError(null);
							}}
						>
							<Input
								placeholder="Enter password here..."
								type="password"
								className="rounded-sm py-5"
								autoComplete="new-password"
								{...field}
							/>
						</FormControl>
						{description && (
							<FormDescription className="text-xs">
								{description}
							</FormDescription>
						)}
					</FormItem>
				);
			}}
		/>
	);
};

const AuthForm = ({ isForgotPassword }: { isForgotPassword?: boolean }) => {
	const {
		state: authState,
		login,
		checkEmailExist,
		verifyCode,
		register,
	} = useAuth();

	const [error, setError] = React.useState<string | null>(null);
	const [stepType, setStepType] = React.useState<
		"email" | "password" | "otp" | "newPassword"
	>("email");
	const [descriptionPassword, setDescriptionPassword] =
		React.useState<string>("");

	useEffect(() => {
		if (authState.error) {
			setError(authState.error);
		}
	}, [authState.error]);

	const form = useForm<z.infer<typeof loginFormSchema>>({
		resolver: zodResolver(loginFormSchema),
		defaultValues: {
			email: "",
			otp: "",
			password: "",
		},
	});

	const onSubmit = useCallback(
		async (values: z.infer<typeof loginFormSchema>) => {
			try {
				if (authState.loading) return;

				const emailSafe = z.email().safeParse(values.email);

				if (!emailSafe.success) {
					setError("Invalid email address, please try again.");
					return;
				}

				if (
					stepType === "newPassword" ||
					stepType === "password" ||
					stepType === "otp"
				) {
					if (stepType === "newPassword") {
						if (isForgotPassword) {
							//change password logic here
							console.log("Resetting password to:", values.password);
						} else {
							await register(values);
						}
					} else if (stepType === "password") {
						await login(values);
					} else if (stepType === "otp") {
						await verifyCode(values.email, values.otp);

						if (isForgotPassword) {
							setDescriptionPassword(
								"Verification successful. Please enter your new password to complete resetting your password."
							);
						} else {
							setDescriptionPassword(
								"Verification successful. You are creating new account. Please enter your new password to continue."
							);
						}
						setStepType("newPassword");
					}
					return;
				}

				const exist = await checkEmailExist(values.email);

				if (!exist) {
					if (isForgotPassword) {
						setError("Email does not exist, please try again.");
					} else {
						setStepType("otp");
					}
				} else if (stepType === "email") {
					if (isForgotPassword) {
						setStepType("otp");
					} else {
						setStepType("password");
					}
				}
			} catch (error) {
				setError((error as Error).message || `${error}`);
			}
		},
		[
			stepType,
			authState.loading,
			isForgotPassword,
			login,
			checkEmailExist,
			verifyCode,
			register,
		]
	);

	return (
		<div className="w-full flex items-center justify-center flex-col">
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="space-y-4 w-full"
				>
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => {
							return (
								<FormItem>
									<FormLabel className="text-gray-500 font-medium">
										Email
									</FormLabel>
									<FormControl
										onChange={() => {
											setError(null);
											if (stepType === "otp") {
												setStepType("email");
											}
										}}
									>
										<Input
											placeholder="Enter your email here"
											type="text"
											className="rounded-sm py-5"
											autoComplete="new-email"
											{...field}
										/>
									</FormControl>
								</FormItem>
							);
						}}
					/>

					<FieldVerificationCode
						form={form}
						setError={setError}
						stepType={stepType}
					/>

					<FieldPassword
						form={form}
						setError={setError}
						description={descriptionPassword}
						setDescription={setDescriptionPassword}
						stepType={stepType}
					/>

					<div>
						<div className="max-w-full break-all">
							{error && <p className="text-red-500 text-sm">{error}</p>}
						</div>
						<ButtonLoading loading={authState.loading} className="w-full mt-4">
							Continue
						</ButtonLoading>
					</div>
				</form>
			</Form>

			{stepType === "otp" && <ResendOTPButton email={"email"} />}
			{!isForgotPassword && (
				<Link
					href={"/forgot-password"}
					className="text-center text-gray-500 text-sm mt-2 hover:underline hover:text-blue-800"
				>
					Forgot password?
				</Link>
			)}
		</div>
	);
};

export default AuthForm;
