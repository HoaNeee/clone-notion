import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function sleep(duration: number = 100) {
  return await new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
}

export const logAction = (...args: unknown[]) => {
  if (!isProduction) {
    console.log(...args);
  }
};

export const isProduction = process.env.NODE_ENV === "production";
