"use client";

import { logAction } from "@/lib/utils";
import { EditorSetting, NotificationSetting } from "@/types/setting.type";
import { get, patch } from "@/utils/request";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";

const initialSettingState = {
	notification: {
		is_activity: false,
		is_email: false,
		is_page_update: false,
		is_workspace: false,
	},
	editor: {
		is_auto_save: true,
		fontStyle: "Tahoma",
		tabSize: 4,
		is_code_highlighting: false,
		is_auto_wrap_code: false,
	},
};

type SettingState = typeof initialSettingState;
type SettingStateCategory = keyof SettingState;
type SettingStateKey<T extends SettingStateCategory> = keyof SettingState[T];
type SettingStateValueOfCategory<
	T extends SettingStateCategory,
	K extends SettingStateKey<T>
> = SettingState[T][K];

type SettingContextType = {
	settingState: SettingState;
	updateSetting: <T extends SettingStateCategory, K extends SettingStateKey<T>>(
		keySetting: T,
		key: K,
		value: SettingStateValueOfCategory<T, K>,
		force_call?: boolean
	) => void;
};

const Context = createContext<SettingContextType | null>(null);

const SettingContext = ({
	children,
	token,
}: {
	children: React.ReactNode;
	token: string | undefined;
}) => {
	const [settingState, setSettingState] =
		useState<SettingState>(initialSettingState);

	const updateSetting = useCallback(
		async <T extends SettingStateCategory, K extends SettingStateKey<T>>(
			keySetting: T,
			key: K,
			value: SettingStateValueOfCategory<T, K>,
			force_call = false
		) => {
			try {
				if (force_call) {
					await patch(`/settings/update/${keySetting}`, {
						[key]: value,
					});
				}
				setSettingState((prev) => ({
					...prev,
					[keySetting]: {
						...prev[keySetting],
						[key]: value,
					},
				}));
			} catch (error) {
				logAction("[SettingContext] Failed to update setting: ", error);
			}
		},
		[]
	);

	useEffect(() => {
		const fetchSettings = async () => {
			try {
				const res = (await get("/settings")) as {
					editorSetting: EditorSetting;
					notificationSetting: NotificationSetting;
				};
				const {
					fontStyle,
					is_auto_save,
					tabSize,
					is_code_highlighting,
					is_auto_wrap_code,
				} = res.editorSetting;
				const { is_activity, is_email, is_page_update, is_workspace } =
					res.notificationSetting;

				updateSetting("editor", "fontStyle", fontStyle);
				updateSetting("editor", "is_auto_save", !!is_auto_save);
				updateSetting("editor", "tabSize", Number(tabSize));
				updateSetting("editor", "is_code_highlighting", !!is_code_highlighting);
				updateSetting("editor", "is_auto_wrap_code", !!is_auto_wrap_code);
				updateSetting("notification", "is_activity", !!is_activity);
				updateSetting("notification", "is_email", !!is_email);
				updateSetting("notification", "is_page_update", !!is_page_update);
				updateSetting("notification", "is_workspace", !!is_workspace);
			} catch (error) {
				logAction("[SettingContext] Failed to fetch settings: ", error);
			}
		};
		if (token) {
			fetchSettings();
		}
	}, [token, updateSetting]);

	const value = {
		settingState,
		updateSetting,
	};
	return <Context.Provider value={value}>{children}</Context.Provider>;
};

const useSetting = () => {
	const context = useContext(Context);
	if (!context) {
		throw new Error("useSetting must be used within a SettingProvider");
	}
	return context;
};

export { SettingContext, useSetting };
