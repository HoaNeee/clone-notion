import React from "react";
import { SettingMenuGroup, SettingMenuItem } from "./settings";
import { Switch } from "../ui/switch";
import { useSetting } from "@/contexts/setting-context";

const NotificationsSettings = () => {
	const {
		settingState: { notification },
		updateSetting,
	} = useSetting();

	return (
		<div className="flex flex-col w-full h-full overflow-hidden rounded-md p-5 overflow-y-auto">
			<SettingMenuGroup label="Notifications">
				<div className="flex flex-col gap-6 py-4 text-sm">
					<SettingMenuItem
						isRealLabel
						labelHtmlFor="setting-notifications-activity"
						className="cursor-pointer"
						label="Activity in your workspace"
						description="Receive emails when you get comments, mentions, page invites, reminders, access requests, and property changes"
						action={
							<Switch
								className="cursor-pointer"
								id="setting-notifications-activity"
								defaultChecked={notification.is_activity}
								onCheckedChange={(checked) =>
									updateSetting("notification", "is_activity", checked, true)
								}
							/>
						}
					/>
					<SettingMenuItem
						label="Always send email notifications"
						isRealLabel
						description="Receive emails about activity in your workspace, even when you're active on the app"
						action={
							<Switch
								className="cursor-pointer"
								id="setting-notifications-email"
								defaultChecked={notification.is_email}
								onCheckedChange={(checked) =>
									updateSetting("notification", "is_email", checked, true)
								}
							/>
						}
						labelHtmlFor="setting-notifications-email"
					/>

					<SettingMenuItem
						label="Page updates"
						isRealLabel
						description="Receive email digests for changes to pages you're subscribed to"
						action={
							<Switch
								className="cursor-pointer"
								id="setting-notifications-page-updates"
								defaultChecked={notification.is_page_update}
								onCheckedChange={(checked) =>
									updateSetting("notification", "is_page_update", checked, true)
								}
							/>
						}
						labelHtmlFor="setting-notifications-page-updates"
					/>
					<SettingMenuItem
						label="Workspace digest"
						isRealLabel
						description="Receive email digests of what's happening in your workspace"
						action={
							<Switch
								className="cursor-pointer"
								id="setting-notifications-workspace-digest"
								defaultChecked={notification.is_workspace}
								onCheckedChange={(checked) =>
									updateSetting("notification", "is_workspace", checked, true)
								}
							/>
						}
						labelHtmlFor="setting-notifications-workspace-digest"
					></SettingMenuItem>
				</div>
			</SettingMenuGroup>
		</div>
	);
};

export default NotificationsSettings;
