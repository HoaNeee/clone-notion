"use client";

import StartingPage from "@/components/starting-page";
import { useAuth } from "@/contexts/auth-context";
// import AuthForm from "@/components/auth-form";
import dynamic from "next/dynamic";
import React from "react";

const AuthForm = dynamic(() => import("../../../components/auth-form"), {
	ssr: false,
});

const Login = () => {
	const { state } = useAuth();

	if (state.isNewUser) {
		return <StartingPage is_new_user />;
	}

	return (
		<div className="flex flex-col items-center justify-center w-full h-screen max-w-3xl gap-8 mx-auto">
			<div className="max-w-76 flex flex-col items-center justify-center w-full">
				<div className="text-start flex flex-col items-start justify-start w-full max-w-full mb-6 space-y-1 text-xl font-bold">
					<h2 className="">Your Workspace</h2>
					<h2 className="text-gray-400">Login to your account</h2>
				</div>
				<AuthForm />
			</div>
		</div>
	);
};

export default Login;
