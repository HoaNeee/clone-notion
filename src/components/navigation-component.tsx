"use client";

import { getValueInLocalStorage, logAction } from "@/lib/utils";
import { TNote } from "@/types/note.type";
import { TWorkspace } from "@/types/workspace.type";
import { get } from "@/utils/request";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const NavigationComponent = ({ token }: { token: string }) => {
	const [isNotDefined, setIsNotDefined] = useState<boolean>(false);

	const router = useRouter();

	const getDefaultNote = useCallback(async (workspace_id: number | null) => {
		try {
			const res = (await get(
				`/notes/default${workspace_id ? `?workspace_id=${workspace_id}` : ""}`
			)) as {
				note: TNote | null;
				workspace: TWorkspace | null;
			};

			if (res && res.note) {
				return res.note as TNote;
			}
			return null;
		} catch (error) {
			logAction(error);
			return null;
		}
	}, []);

	useEffect(() => {
		if (!token) {
			return;
		}

		const workspace_id = getValueInLocalStorage("last_workspace_id");
		const fetchData = async () => {
			const defaultNote = await getDefaultNote(
				workspace_id ? parseInt(workspace_id) : null
			);
			if (defaultNote) {
				router.push(`/${defaultNote.slug}`);
			} else {
				setIsNotDefined(true);
			}
		};
		fetchData();

		return () => {
			setIsNotDefined(false);
		};
	}, [token, getDefaultNote, router]);

	if (isNotDefined) {
		return (
			<>
				Note not found, maybe create a new one, or redirect to onboarding route
			</>
		);
	}

	return <>Loading...</>;
};

export default NavigationComponent;
