import React from "react";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { SettingMenu, SettingMenuGroup, SettingMenuItem } from "./settings";
import { Switch } from "../ui/switch";
import { fontEnables, tabSizeEnables } from "./utils/utils";
import { useSetting } from "@/contexts/setting-context";

const FontSelector = ({
	defaultValue,
	onValueChange,
}: {
	defaultValue: string;
	onValueChange: (value: string) => void;
}) => {
	return (
		<Select defaultValue={defaultValue} onValueChange={onValueChange}>
			<SelectTrigger>
				<SelectValue placeholder="Select Font Style" />
			</SelectTrigger>
			<SelectContent className="z-10000">
				<SelectGroup>
					{fontEnables.map((font) => (
						<SelectItem key={font} value={font}>
							{font}
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
};

const TabSizeSelector = ({
	defaultValue,
	onValueChange,
}: {
	defaultValue: string;
	onValueChange: (value: string) => void;
}) => {
	return (
		<Select defaultValue={defaultValue} onValueChange={onValueChange}>
			<SelectTrigger>
				<SelectValue placeholder="Select Tab Size" />
			</SelectTrigger>
			<SelectContent className="z-10000">
				<SelectGroup>
					{tabSizeEnables.map((size) => (
						<SelectItem key={size} value={size.toString()}>
							{size}
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
};

const EditorSettings = () => {
	const {
		settingState: { editor },
		updateSetting,
	} = useSetting();

	return (
		<div className="flex flex-col w-full h-full overflow-hidden rounded-md overflow-y-auto p-5">
			<SettingMenuGroup label="Editor">
				<div className="flex flex-col w-full gap-5 py-4 overflow-hidden text-sm">
					<SettingMenu>
						<SettingMenuItem
							label="Auto Save"
							description="Automatically save changes as you make them"
							isRealLabel
							labelHtmlFor="setting-editor-auto-save"
							action={
								<Switch
									className="cursor-pointer"
									id="setting-editor-auto-save"
									defaultChecked={editor.is_auto_save}
									onCheckedChange={(checked) =>
										updateSetting("editor", "is_auto_save", checked, true)
									}
								/>
							}
						/>
					</SettingMenu>
				</div>
				<SettingMenuGroup label="Text Style">
					<SettingMenu className="gap-4">
						<SettingMenuItem
							label="Font Style"
							description="Select your preferred font style"
							action={
								<FontSelector
									defaultValue={editor.fontStyle}
									onValueChange={(val) => {
										updateSetting("editor", "fontStyle", val, true);
									}}
								/>
							}
						/>
						<SettingMenuItem
							label="Tab Size"
							description="Set your preferred tab size for indentation when spaces are used"
							action={
								<TabSizeSelector
									defaultValue={editor.tabSize.toString()}
									onValueChange={(val) => {
										updateSetting("editor", "tabSize", Number(val), true);
									}}
								/>
							}
						/>
					</SettingMenu>
				</SettingMenuGroup>
				<SettingMenuGroup label="Code Format">
					<SettingMenu className="gap-4">
						<SettingMenuItem
							label="Code Highlighting"
							description="Enable or disable syntax highlighting in code blocks"
							isRealLabel
							labelHtmlFor="setting-editor-code-highlighting"
							action={
								<Switch
									className="cursor-pointer"
									id="setting-editor-code-highlighting"
									defaultChecked={editor.is_code_highlighting}
									onCheckedChange={(checked) =>
										updateSetting(
											"editor",
											"is_code_highlighting",
											checked,
											true
										)
									}
								/>
							}
						/>
						<SettingMenuItem
							label="Auto wrap Code Lines"
							description="Enable or disable automatic wrapping of code lines"
							action={
								<Switch
									className="cursor-pointer"
									id="setting-editor-code-auto-wrap"
									defaultChecked={editor.is_auto_wrap_code}
									onCheckedChange={(val) => {
										updateSetting("editor", "is_auto_wrap_code", val, true);
									}}
								/>
							}
							isRealLabel
							labelHtmlFor="setting-editor-code-auto-wrap"
						/>
					</SettingMenu>
				</SettingMenuGroup>
			</SettingMenuGroup>
		</div>
	);
};

export default EditorSettings;
