import { TNote, TThread } from "@/types/note.type";
import { NoteHeader, NoteHeaderPublic } from "./note-header";
import { Skeleton } from "./ui/skeleton";

const NoteLoading = () => {
	return (
		<div className="w-full max-w-3xl max-h-full overflow-hidden">
			<div className="flex flex-col gap-8 h-full overflow-hidden">
				<div className="flex flex-col gap-4">
					<Skeleton className="w-48 h-7" />
					<div className="flex flex-col gap-4">
						<Skeleton className="w-full h-4" />
						<Skeleton className="w-3/4 h-4" />
						<Skeleton className="w-2/3 h-4" />
						<Skeleton className="w-4/5 h-4" />
						<Skeleton className="w-1/2 h-4" />
					</div>
				</div>
				<div className="flex flex-col gap-4">
					<Skeleton className="w-48 h-7" />
					<div className="flex flex-col gap-4">
						<Skeleton className="w-full h-4" />
						<Skeleton className="w-2/3 h-4" />
						<Skeleton className="w-1/2 h-4" />
						<Skeleton className="w-3/4 h-4" />
						<Skeleton className="w-1/2 h-4" />
						<Skeleton className="w-5/6 h-4" />
					</div>
				</div>
				<div className="flex flex-col gap-4">
					<Skeleton className="w-48 h-7" />
					<div className="flex flex-col gap-4">
						<Skeleton className="w-3/4 h-4" />
						<Skeleton className="w-5/6 h-4" />
						<Skeleton className="w-2/3 h-4" />
						<Skeleton className="w-2/3 h-4" />
						<Skeleton className="w-2/3 h-4" />
					</div>
				</div>
			</div>
		</div>
	);
};

const DetailNotePageContainer = ({
	note,
	children,
	token,
	loading = false,
	threadComments,
}: {
	note: TNote | null;
	threadComments?: TThread[];
	children: React.ReactNode;
	token?: string;
	loading?: boolean;
}) => {
	return (
		<div className="w-full h-full">
			{loading ? null : token && note ? (
				<NoteHeader note={note} />
			) : (
				<NoteHeaderPublic note={note} threadComments={threadComments} /> //thread prop here is server side only
			)}
			<div className="relative flex flex-col items-center w-full p-3">
				<div className="pl-15 w-full max-w-4xl pt-16 pb-6">
					{loading ? (
						<Skeleton className="h-10.5 w-56" />
					) : (
						<h1 className="text-4xl font-bold">{note?.title || "New File"}</h1>
					)}
				</div>
				{loading ? <NoteLoading /> : children}
			</div>
		</div>
	);
};

export default DetailNotePageContainer;
