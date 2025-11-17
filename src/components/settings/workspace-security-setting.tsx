"use client";

import React from "react";
import { SettingMenu, SettingMenuGroup, SettingMenuItem } from "./settings";
import { Switch } from "../ui/switch";
import { useWorkspace } from "@/contexts/workspace-context";

const WorkspaceSecuritySetting = () => {
	const { workspaceSetting, updateWorkspaceSetting } = useWorkspace();

	if (!workspaceSetting) {
		return (
			<div className="text-neutral-500 dark:text-neutral-200 py-12 text-center">
				You don&apos;t have permission to view this workspace settings.
			</div>
		);
	}

	return (
		<div className="relative flex flex-col w-full h-full overflow-hidden rounded-md">
			<SettingMenuGroup
				label="Security"
				className="max-h-full px-10 py-5 overflow-hidden overflow-y-auto"
			>
				<SettingMenu className="gap-8">
					<SettingMenuItem
						isRealLabel
						action={
							<Switch
								id="access-request-non-members"
								checked={!!workspaceSetting.is_allow_access_from_non_members}
								onCheckedChange={(checked) =>
									updateWorkspaceSetting(
										"is_allow_access_from_non_members",
										checked ? 1 : 0
									)
								}
							/>
						}
						labelHtmlFor="access-request-non-members"
						label="Allow page access requests from non-members"
						description="Disable the ability for anyone with the link to page to request access"
					/>
					<SettingMenuItem
						isRealLabel
						action={
							<Switch
								id="allow-members-invite-guests"
								checked={!!workspaceSetting.is_allow_members_invite_guests}
								onCheckedChange={(checked) =>
									updateWorkspaceSetting(
										"is_allow_members_invite_guests",
										checked ? 1 : 0
									)
								}
							/>
						}
						labelHtmlFor="allow-members-invite-guests"
						label="Allow members to invite guests to pages"
						description="Disable the ability for members to invite guests to pages"
					/>
					<SettingMenuItem
						isRealLabel
						action={
							<Switch
								id="allow-members-request-adding-guests"
								checked={!!workspaceSetting.is_allow_members_adding_guests}
								onCheckedChange={(checked) =>
									updateWorkspaceSetting(
										"is_allow_members_adding_guests",
										checked ? 1 : 0
									)
								}
							/>
						}
						labelHtmlFor="allow-members-request-adding-guests"
						label="Allow members to request adding guests"
						description="Let workspace members send guest requests to admins"
					/>
					<SettingMenuItem
						isRealLabel
						action={
							<Switch
								id="allow-members-request-adding-members"
								checked={
									!!workspaceSetting.is_allow_members_adding_other_members
								}
								onCheckedChange={(checked) =>
									updateWorkspaceSetting(
										"is_allow_members_adding_other_members",
										checked ? 1 : 0
									)
								}
							/>
						}
						labelHtmlFor="allow-members-request-adding-members"
						label="Allow members to request adding other members"
						description="Let members submit requests to admins to add more members"
					/>
					<SettingMenuItem
						isRealLabel
						action={
							<Switch
								id="allow-any-user-request-adding-members"
								checked={!!workspaceSetting.is_allow_any_user_request_to_added}
								onCheckedChange={(checked) =>
									updateWorkspaceSetting(
										"is_allow_any_user_request_to_added",
										checked ? 1 : 0
									)
								}
							/>
						}
						labelHtmlFor="allow-any-user-request-adding-members"
						label="Allow any user to request to be added as a member of the workspace"
						description="Let users with teamspace invite links submit requests to admins to be added as members"
					/>
				</SettingMenu>
			</SettingMenuGroup>
		</div>
	);
};

export default WorkspaceSecuritySetting;
