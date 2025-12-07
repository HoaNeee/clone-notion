"use client";

import { logAction } from "@/lib/utils";
import { TNote } from "@/types/note.type";
import { get } from "@/utils/request";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Spinner } from "./ui/spinner";

const NavigationComponent = ({ token }: { token: string }) => {
	const [isNotDefined, setIsNotDefined] = useState<boolean>(false);

	const router = useRouter();

	const getDefaultNote = useCallback(async () => {
		try {
			const res = (await get(`/notes/last-note`)) as {
				last_note: TNote | null;
			};

			if (res.last_note) {
				return res.last_note;
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

		const fetchData = async () => {
			const defaultNote = await getDefaultNote();
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
				You dont have any notes, maybe create a new one, or redirect to
				onboarding route
			</>
		);
	}

	return (
		<div className="w-full min-h-screen flex items-center justify-center">
			<Spinner className="size-8 text-neutral-500" />
		</div>
	);
};

export default NavigationComponent;
