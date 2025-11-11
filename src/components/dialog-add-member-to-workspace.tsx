import React from "react";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { UserPlus } from "lucide-react";

const DialogAddNewMember = ({
	open,
	setOpen,
}: {
	open: boolean;
	setOpen: (open: boolean) => void;
}) => {
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent showCloseButton={false} className="w-xs">
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
				<div className="flex flex-col gap-2">
					<Button
						variant={"destructive"}
						className="opacity-80"
						onClick={() => {}}
					>
						Log out
					</Button>
					<DialogClose asChild>
						<Button variant={"outline"}>Cancel</Button>
					</DialogClose>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default DialogAddNewMember;
