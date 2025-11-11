import { AlertDialogHeader } from "./ui/alert-dialog";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "./ui/dialog";
import { Spinner } from "./ui/spinner";

const DialogLoading = ({ title }: { title?: string }) => {
	return (
		<Dialog open={true}>
			<DialogContent className="w-68 z-10001" showCloseButton={false}>
				<AlertDialogHeader className="hidden">
					<DialogTitle />
					<DialogDescription />
				</AlertDialogHeader>
				<div className="flex items-center justify-center gap-5 text-neutral-600">
					<p>{title || "Loading..."}</p>
					<Spinner className="size-6" />
				</div>
			</DialogContent>
		</Dialog>
	);
};

const LoadingPage = () => {
	return (
		<div className="fixed inset-0 flex items-center justify-center text-neutral-600">
			<Spinner className="size-6" />
		</div>
	);
};

export { DialogLoading, LoadingPage };
