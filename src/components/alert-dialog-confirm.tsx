"use client";

import React from "react";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import { LucideProps } from "lucide-react";

interface Props {
	open?: boolean;
	setOpen?: (val: boolean) => void;
	trigger?: React.ReactNode;
	title?: string | React.ReactNode;
	description?: string | React.ReactNode;
	onOk?: () => void;
	loading?: boolean;
	dialogType?: "row" | "column";
	icon?: React.ForwardRefExoticComponent<
		Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
	>;
	okText?: string;
	cancelText?: string;
	okButton?: React.ReactNode;
	cancelButton?: React.ReactNode;
}

const AlertDialogConfirm = (props: Props) => {
	const {
		open,
		setOpen,
		trigger,
		title,
		description,
		onOk,
		loading,
		dialogType = "row",
		icon,
		okText,
		cancelText,
		okButton,
		cancelButton,
	} = props;

	const titleDefault = "Are you sure you want to log out?";
	const descriptionDefault =
		"You will need to log back in to access your Notion workspaces.";

	const Icon = icon;

	return dialogType === "row" ? (
		<AlertDialog onOpenChange={setOpen} open={open}>
			{trigger ? (
				<AlertDialogTrigger asChild>
					{trigger || <Button variant="outline">Show Dialog</Button>}
				</AlertDialogTrigger>
			) : null}
			<AlertDialogContent className="z-10001">
				<AlertDialogHeader>
					<AlertDialogTitle>{title || titleDefault}</AlertDialogTitle>
					<AlertDialogDescription asChild={!!description}>
						{description || descriptionDefault}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
					<Button onClick={onOk}>Continue</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	) : (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent showCloseButton={false} className="w-xs z-10001">
				<DialogHeader className="text-neutral-700">
					<DialogTitle asChild>
						<div className="flex flex-col items-center justify-center gap-2 font-normal">
							{Icon && <Icon />}
							<p className="font-semibold">{title || titleDefault}</p>
						</div>
					</DialogTitle>
					<DialogDescription className="text-neutral-400 text-center">
						{description || descriptionDefault}
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-2">
					{okButton || <Button onClick={onOk}>{okText || "Continue"}</Button>}
					<DialogClose asChild>
						{cancelButton || (
							<Button variant="outline">{cancelText || "Cancel"}</Button>
						)}
					</DialogClose>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default AlertDialogConfirm;
