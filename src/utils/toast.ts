import { logAction } from "@/lib/utils";

export const myToast = ({
	title,
	description,
}: {
	title: string;
	description: string;
}) => {
	//handle toast here (later)

	return logAction(`[Toast] ${title} - ${description}`);
};
