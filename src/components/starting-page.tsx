"use client";

import { logAction, sleep } from "@/lib/utils";
import { post } from "@/utils/request";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { Spinner } from "./ui/spinner";
import { TNote } from "@/types/note.type";
import { DialogLoading } from "./loading";
import { TWorkspace } from "@/types/workspace.type";

const StartingPage = ({ is_new_user }: { is_new_user: boolean }) => {
	const [loaded, setLoaded] = React.useState(false);
	const [isPreparing, setIsPreparing] = React.useState(false);

	const router = useRouter();

	useEffect(() => {
		setLoaded(true);
	}, []);

	useEffect(() => {
		const prepareApp = async () => {
			setIsPreparing(true);
			try {
				//simulate delay
				await sleep(2000);

				const ws = (await post("/workspaces/create-default")) as TWorkspace;

				if (ws && ws.id) {
					await sleep(2000);
					const res = await post(
						`/folders/create-root-and-default-note?workspace_id=${ws.id}`
					);
					const { note } = res as { note: TNote };
					router.replace(`/${note.slug}`);
				}
			} catch (error) {
				logAction("Error preparing app for new user: ", error);
			} finally {
				setIsPreparing(false);
			}
		};
		if (is_new_user && loaded) {
			prepareApp();
		}
	}, [is_new_user, router, loaded]);

	const renderLoading = () => {
		if (!loaded) {
			return <Spinner className="size-8 text-neutral-500" />;
		}

		if (isPreparing) {
			return <DialogLoading title="Preparing for you..." />;
		}
		return null;
	};

	return (
		<div className="flex flex-col justify-center items-center w-full h-screen">
			{renderLoading()}
		</div>
	);
};

export default StartingPage;
