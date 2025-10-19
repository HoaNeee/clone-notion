import AuthForm from "@/components/auth-form";
import React from "react";

const ForgotPassword = () => {
	return (
		<div className="w-full h-screen max-w-3xl mx-auto flex items-center justify-center flex-col gap-8">
			<div className="max-w-76 w-full flex items-center justify-center flex-col">
				<div className="space-y-1 text-start max-w-full text-xl font-bold flex flex-col items-start justify-start w-full mb-6">
					<h2 className="">Forgot Password</h2>
				</div>
				<AuthForm isForgotPassword />
			</div>
		</div>
	);
};

export default ForgotPassword;
