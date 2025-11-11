"use client";

import { TRequest } from "@/types/request.type";
import {
	createContext,
	Dispatch,
	SetStateAction,
	useContext,
	useState,
} from "react";

type RequestContextType = {
	requests: TRequest[];
	setRequests: Dispatch<SetStateAction<TRequest[]>>;
};

const Context = createContext<RequestContextType | null>(null);

export const RequestContext = ({ children }: { children: React.ReactNode }) => {
	const [requests, setRequests] = useState<TRequest[]>([]);

	const value = {
		requests,
		setRequests,
	};

	return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useRequest = () => {
	const context = useContext(Context);
	if (!context) {
		throw new Error("useRequest must be used within a RequestProvider");
	}
	return context;
};
