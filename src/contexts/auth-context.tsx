"use client";

import { sleep } from "@/lib/utils";
import { TUser } from "@/types/user.type";
import { get, patch, post } from "@/utils/request";
import { removeLastWorkspaceInLocalStorage } from "@/utils/workspace";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useReducer,
} from "react";

type AuthState = {
	user: TUser | null;
	isAuthenticated: boolean;
	loading: boolean;
	error: string | null;
	isNewUser: boolean;
};

const initialState = {
	user: null,
	isAuthenticated: false,
	loading: false,
	error: null,
	isNewUser: false,
};

type AuthAction =
	| { type: "LOGIN_REQUEST" }
	| { type: "LOGIN_SUCCESS"; payload: { user: TUser } }
	| { type: "LOGIN_FAILURE"; payload: string }
	| { type: "REGISTER_REQUEST" }
	| { type: "REGISTER_SUCCESS"; payload: { user: TUser } }
	| { type: "REGISTER_FAILURE"; payload: string }
	| { type: "LOGOUT" }
	| { type: "CLEAR_ERROR" }
	| { type: "UPDATE_USER"; payload: { user: TUser } }
	| { type: "SET_LOADING"; payload: { loading: boolean } }
	| { type: "SET_ERROR"; payload: { error: string | null } };

type AuthContextType = {
	state: AuthState;
	login: ({
		email,
		password,
	}: {
		email: string;
		password: string;
	}) => Promise<void>;
	checkEmailExist: (email: string) => Promise<boolean>;
	verifyCode: (email: string, code: string) => Promise<boolean>;
	register: ({
		email,
		password,
	}: {
		email: string;
		password: string;
	}) => Promise<void>;
	logout: () => Promise<void>;
	updateUser: (payload: Partial<TUser>) => Promise<void>;
};

const Context = createContext<AuthContextType | undefined>(undefined);

function authReducer(state: AuthState, action: AuthAction) {
	switch (action.type) {
		case "LOGIN_REQUEST":
			return { ...state, loading: true };
		case "LOGIN_SUCCESS":
			return {
				...state,
				loading: false,
				isAuthenticated: true,
				user: action.payload.user,
			};
		case "LOGIN_FAILURE":
			return { ...state, loading: false, error: action.payload };
		case "REGISTER_REQUEST":
			return { ...state, loading: true };
		case "REGISTER_SUCCESS":
			return {
				...state,
				loading: false,
				isAuthenticated: true,
				user: action.payload.user,
				isNewUser: true,
			};
		case "REGISTER_FAILURE":
			return {
				...state,
				loading: false,
				isNewUser: false,
				error: action.payload,
			};
		case "LOGOUT":
			return { ...state, isAuthenticated: false, user: null, isNewUser: false };
		case "CLEAR_ERROR":
			return { ...state, error: null };
		case "UPDATE_USER":
			return { ...state, user: action.payload.user };
		case "SET_LOADING":
			return { ...state, loading: action.payload.loading };
		case "SET_ERROR":
			return { ...state, error: action.payload.error };
		default:
			return state;
	}
}

const useAuth = () => {
	const context = useContext(Context);

	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}

	return context;
};

const AuthContext = ({
	children,
	token,
}: {
	children: React.ReactNode;
	token?: string;
}) => {
	const [state, dispatch] = useReducer(authReducer, initialState);

	const getCurrentUser = useCallback(async () => {
		try {
			dispatch({ type: "SET_LOADING", payload: { loading: true } });
			const res = await get("/auth/current-user");
			console.log(res);
			dispatch({ type: "LOGIN_SUCCESS", payload: { user: res } });
		} catch (error) {
			dispatch({ type: "SET_ERROR", payload: { error: `${error}` } });
		} finally {
			dispatch({ type: "SET_LOADING", payload: { loading: false } });
		}
	}, []);

	useEffect(() => {
		if (token && token.trim()) {
			getCurrentUser();
		}
	}, [token, getCurrentUser]);

	const login = useCallback(
		async ({ email, password }: { email: string; password: string }) => {
			try {
				dispatch({ type: "LOGIN_REQUEST" });

				// Simulate an API call
				await sleep(1000);
				const res = await post("/auth/login", { email, password });

				dispatch({ type: "LOGIN_SUCCESS", payload: { user: res } });
				window.location.reload();
			} catch (error) {
				dispatch({
					type: "LOGIN_FAILURE",
					payload: (error as Error).message || `${error}`,
				});
				throw error;
			}
		},
		[dispatch]
	);

	const register = useCallback(
		async ({ email, password }: { email: string; password: string }) => {
			try {
				dispatch({ type: "REGISTER_REQUEST" });
				await sleep(1000);
				const res = await post("/auth/register", { email, password });
				dispatch({ type: "REGISTER_SUCCESS", payload: { user: res } });
			} catch (error) {
				dispatch({
					type: "REGISTER_FAILURE",
					payload: (error as Error).message || `${error}`,
				});
				throw error;
			}
		},
		[dispatch]
	);

	const checkEmailExist = useCallback(async (email: string) => {
		try {
			dispatch({ type: "SET_LOADING", payload: { loading: true } });
			await sleep(1000);
			const res = await post("/auth/check-email", { email });

			return res.exist;
		} catch (error) {
			dispatch({
				type: "SET_ERROR",
				payload: { error: (error as Error).message || `${error}` },
			});
			throw error;
		} finally {
			dispatch({ type: "SET_LOADING", payload: { loading: false } });
		}
	}, []);

	const verifyCode = useCallback(async (email: string, code: string) => {
		try {
			dispatch({ type: "SET_LOADING", payload: { loading: true } });
			await sleep(1000);
			await post("/auth/verify-code", { email, code });
			return true;
		} catch (error) {
			dispatch({
				type: "SET_ERROR",
				payload: { error: (error as Error).message || `${error}` },
			});
			throw error;
		} finally {
			dispatch({ type: "SET_LOADING", payload: { loading: false } });
		}
	}, []);

	const logout = useCallback(async () => {
		try {
			await post("/auth/logout");
			removeLastWorkspaceInLocalStorage();
			dispatch({ type: "LOGOUT" });
		} catch (error) {
			throw error;
		}
	}, []);

	const updateUser = useCallback(
		async (payload: Partial<TUser>) => {
			if (state.user && payload !== state.user) {
				try {
					await patch("/auth/update-profile", { ...payload });

					dispatch({
						type: "UPDATE_USER",
						payload: { user: { ...state.user, ...payload } },
					});
				} catch (error) {
					dispatch({
						type: "SET_ERROR",
						payload: { error: (error as Error).message || `${error}` },
					});
				}
			}
		},
		[state.user]
	);

	const value = {
		state,
		login,
		checkEmailExist,
		verifyCode,
		register,
		logout,
		updateUser,
	};

	return <Context.Provider value={value}>{children}</Context.Provider>;
};

export { AuthContext, useAuth };
