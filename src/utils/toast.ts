/* eslint-disable @typescript-eslint/no-explicit-any */
import { logAction } from "@/lib/utils";

export const myToast = ({
	title,
	description,
}: {
	title: string;
	description: string | any;
}) => {
	//handle toast here (later)

	return logAction(`TOAST: ${title}`, description);
};
