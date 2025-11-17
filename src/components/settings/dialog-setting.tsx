import React, { Dispatch, SetStateAction } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import TabNavSetting from "./tab-nav-setting";

const DialogSetting = ({
	open,
	setOpen,
}: {
	open: boolean;
	setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent
				showCloseButton={false}
				className="h-10/12 w-7/10 p-0"
				style={{ maxWidth: "100%" }}
			>
				<DialogHeader className="max-h-0 absolute hidden h-0">
					<DialogTitle />
					<DialogDescription />
				</DialogHeader>
				<div className="flex w-full h-full max-h-full gap-2 overflow-hidden">
					<TabNavSetting />
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default DialogSetting;
