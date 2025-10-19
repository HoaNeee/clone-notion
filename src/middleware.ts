import { NextRequest, NextResponse } from "next/server";
import { BASE_URL } from "./utils/request";

const getDefaultNote = async (token: string) => {
	try {
		const response = await fetch(`${BASE_URL}/notes/default`, {
			method: "GET",
			headers: { Authorization: `Bearer ${token}` },
		});
		if (!response.ok) throw new Error("Failed to fetch default note");
		const result = await response.json();
		if (result.success) {
			return result.data;
		}
		return null;
	} catch (error) {
		console.error(error);
		return null;
	}
};

const logout = async (token: string) => {
	try {
		const res = await fetch(`${BASE_URL}/auth/logout`, {
			method: "POST",
			headers: { Authorization: `Bearer ${token}` },
		});
		if (!res.ok) throw new Error("Logout failed");
		const result = await res.json();
		if (!result.success) {
			throw new Error("Logout failed");
		}
	} catch (error) {
		console.log("Logout failed:", error);
	}
};

export async function middleware(request: NextRequest) {
	const token = request.cookies.get("note_jwt_token")?.value;

	const pathName = request.nextUrl.pathname;

	if (pathName.startsWith("/login")) {
		if (token) {
			const defaultNote = await getDefaultNote(token);
			if (defaultNote) {
				return NextResponse.redirect(
					new URL(`/${defaultNote.slug}`, request.url)
				);
			} else {
				await logout(token);
			}
		}
	} else if (pathName === "/") {
		if (token) {
			const defaultNote = await getDefaultNote(token);
			if (defaultNote) {
				return NextResponse.redirect(
					new URL(`/${defaultNote.slug}`, request.url)
				);
			} else {
				await logout(token);
			}
		}
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/:path*", "/"],
};
