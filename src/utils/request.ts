/* eslint-disable @typescript-eslint/no-explicit-any */

export const DOMAIN =
	process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const BASE_URL = `${DOMAIN}/api`;

export const get = async (url: string, config?: RequestInit) => {
	try {
		const response = await fetch(`${BASE_URL}${url}`, {
			method: "GET",
			credentials: "include",
			...config,
		});

		if (!response.ok) {
			throw new Error(response.statusText || "Internal Server Error");
		}

		const result = await response.json();
		if (!result.success) {
			throw result.error || result.message || new Error("Request failed");
		}
		return result.data;
	} catch (error) {
		console.log(error);
		throw error;
	}
};

export const post = async (
	url: string,
	options?: Record<string, any>,
	config?: RequestInit
) => {
	try {
		const response = await fetch(`${BASE_URL}${url}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
			body: JSON.stringify(options),
			...config,
		});

		if (!response.ok) {
			throw new Error(response.statusText || "Internal Server Error");
		}

		const contentType = response.headers.get("Content-Type");

		if (contentType === "text/event-stream") {
			const reader = response.body?.getReader();
			return reader;
		}

		const result = await response.json();

		if (!result.success) {
			throw result.error || result.message || new Error("Request failed");
		}

		if (result.data) {
			return result.data;
		}
		return result;
	} catch (error: any) {
		console.log(error);
		throw error.message || error;
	}
};

export const patch = async (
	url: string,
	options?: Record<string, any>,
	config?: RequestInit
) => {
	try {
		const response = await fetch(`${BASE_URL}${url}`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
			body: JSON.stringify(options),
			...config,
		});

		if (!response.ok) {
			throw new Error(response.statusText || "Internal Server Error");
		}

		const result = await response.json();

		if (!result.success) {
			throw result.error || result.message || new Error("Request failed");
		}

		if (result.data) {
			return result.data;
		}
		return result;
	} catch (error: any) {
		console.log(error);
		throw error.message || error;
	}
};

export const del = async (
	url: string,
	options?: Record<string, any>,
	config?: RequestInit
) => {
	try {
		const response = await fetch(`${BASE_URL}${url}`, {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
			body: JSON.stringify(options),
			...config,
		});

		if (!response.ok) {
			throw new Error(response.statusText || "Internal Server Error");
		}

		const result = await response.json();

		if (!result.success) {
			throw result.error || result.message || new Error("Request failed");
		}

		if (result.data) {
			return result.data;
		}
		return result;
	} catch (error: any) {
		console.log(error);
		throw error.message || error;
	}
};

export const postImage = async (key: string, options: any) => {
	// myHeaders.append("Content-Type", "multipart/form-data");
	const formdata = new FormData();
	formdata.append(key, options);
	try {
		const response = await fetch(`${BASE_URL}/upload`, {
			credentials: "include",
			method: "POST",
			body: formdata,
		});

		if (!response.ok) {
			throw new Error(response.statusText || "Internal Server Error");
		}

		const result = await response.json();

		if (!result.success) {
			throw result.error || result.message || new Error("Request failed");
		}

		return result;
	} catch (error: any) {
		console.log(error);
		throw Error(error.message || error);
	}
};
