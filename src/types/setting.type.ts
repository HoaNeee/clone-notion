export interface EditorSetting {
	id: number;
	setting_id: number;
	fontStyle: string;
	tabSize: string;
	is_code_highlighting: number;
	is_auto_wrap_code: number;
	is_auto_save: number;
	createdAt: string;
	updatedAt: string;
}

export interface NotificationSetting {
	id: number;
	setting_id: number;
	is_activity: number;
	is_email: number;
	is_page_update: number;
	is_workspace: number;
	createdAt: string;
	updatedAt: string;
}
