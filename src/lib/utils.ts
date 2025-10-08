import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export async function sleep(duration: number = 100) {
	return new Promise((resolve) => {
		setTimeout(() => resolve, duration);
	});
}
