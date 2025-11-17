"use client";

import { Check, ChevronDown } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { SettingMenu, SettingMenuGroup, SettingMenuItem } from "./settings";
import { Button } from "../ui/button";
import { useTheme } from "next-themes";

const LanguageSelector = () => {
	return (
		<Select defaultValue="en">
			<SelectTrigger>
				<SelectValue placeholder="Select Language" />
			</SelectTrigger>

			<SelectContent className="z-10000">
				<SelectGroup>
					<SelectItem value="en">English</SelectItem>
					<SelectItem value="vi">Vietnamese</SelectItem>
				</SelectGroup>
			</SelectContent>
		</Select>
	);
};

const TimeZoneSelector = () => {
	return (
		<Select defaultValue="UTC">
			<SelectTrigger>
				<SelectValue placeholder="Select Time Zone" />
			</SelectTrigger>

			<SelectContent className="z-10000">
				<SelectGroup>
					<SelectItem value="UTC">UTC</SelectItem>
					<SelectItem value="GMT">GMT</SelectItem>
					<SelectItem value="PST">PST</SelectItem>
					<SelectItem value="EST">EST</SelectItem>
				</SelectGroup>
			</SelectContent>
		</Select>
	);
};

const PreferencesSettings = () => {
	const { theme, setTheme } = useTheme();

	return (
		<div className="flex flex-col w-full h-full overflow-hidden rounded-md p-5 overflow-y-auto">
			<SettingMenuGroup label="Preferences">
				<div className="flex flex-col w-full gap-5 py-4 text-sm">
					<SettingMenuItem
						label="Appearance"
						description="Customize the appearance of the application"
						action={
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant={"ghost"} className="font-normal capitalize">
										{theme} <ChevronDown />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="start" className="z-10000">
									<DropdownMenuItem
										className="flex justify-between cursor-pointer"
										onClick={() => setTheme("light")}
									>
										Light {theme === "light" ? <Check /> : null}
									</DropdownMenuItem>
									<DropdownMenuItem
										className="flex justify-between cursor-pointer"
										onClick={() => setTheme("dark")}
									>
										Dark {theme === "dark" ? <Check /> : null}
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						}
					/>
					<SettingMenuItem
						label="Open on start"
						description="Choose what to show when Notion starts or when you switch workspaces."
						action={
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant={"ghost"} className="font-normal capitalize">
										Last visited page <ChevronDown />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="start" className="z-10000">
									<DropdownMenuItem className="flex justify-between cursor-pointer">
										Last visited page <Check />
									</DropdownMenuItem>
									<DropdownMenuItem className="flex justify-between cursor-pointer">
										Home
									</DropdownMenuItem>
									<DropdownMenuItem className="flex justify-between cursor-pointer">
										Top page in sidebar
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						}
					/>
				</div>
				<SettingMenuGroup label="Language & Time">
					<SettingMenu>
						<SettingMenuItem
							label="Language"
							description="Select your preferred language"
							action={<LanguageSelector />}
						/>
						<SettingMenuItem
							label="Time Zone"
							description="Current time zone setting"
							action={<TimeZoneSelector />}
						/>
					</SettingMenu>
				</SettingMenuGroup>
			</SettingMenuGroup>
		</div>
	);
};

export default PreferencesSettings;
