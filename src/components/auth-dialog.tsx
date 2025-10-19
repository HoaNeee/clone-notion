import React from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./ui/dialog";
import AuthForm from "./auth-form";

const AuthDialog = () => {
	return (
		<Dialog open={true}>
			<DialogContent
				showCloseButton={false}
				className="flex items-center justify-center w-fit"
			>
				<DialogHeader className="h-0 max-h-0 p-0 m-0">
					<DialogTitle />
					<DialogDescription />
				</DialogHeader>
				<div className="max-w-76 w-full flex items-center justify-center flex-col">
					<div className="space-y-1 text-start max-w-full text-xl font-bold flex flex-col items-start justify-start w-full mb-6">
						<h2 className="">Login to your account to view this workspace</h2>
					</div>
					<AuthForm />
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default AuthDialog;
