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

export const getValueInLocalStorage = (key: string) => {
  if (typeof window === "undefined") return null;

  const value = localStorage.getItem(key);

  if (!value) return null;

  return JSON.parse(value);
};

export const getPriorityRole = (role: string) => {
  switch (role) {
    case "admin":
      return 0;
    case "member":
      return 1;
    default:
      return 2;
  }
};
export const getPriorityPermission = (per: string) => {
  switch (per) {
    case "admin":
      return 0;
    case "edit":
      return 1;
    case "comment":
      return 2;
    case "view":
      return 3;
    default:
      return 4;
  }
};

export const checkEmail = (email: string) => {
  if (!email || email.length === 0) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.toLowerCase());
};

export const getTranslate = (element: HTMLDivElement) => {
  const style = window.getComputedStyle(element);
  const matrix = new DOMMatrixReadOnly(style.transform);
  return { x: matrix.m41, y: matrix.m42 };
};

export const isProduction = process.env.NODE_ENV === "production";
