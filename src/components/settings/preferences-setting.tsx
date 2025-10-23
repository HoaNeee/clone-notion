import { ChevronDown } from "lucide-react";
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
  return (
    <div className="flex flex-col w-full h-full overflow-hidden rounded-md">
      <SettingMenuGroup
        label="Preferences"
        className="max-h-full p-5 overflow-hidden overflow-y-auto"
      >
        <div className="flex flex-col w-full h-full max-h-full gap-5 py-4 overflow-hidden overflow-y-auto text-sm">
          <SettingMenuItem
            label="Appearance"
            description="Customize the appearance of the application"
            action={
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant={"ghost"} className="font-normal">
                    Light <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="z-10000">
                  <DropdownMenuItem className="cursor-pointer">
                    Light
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    Dark
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            }
          />

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
        </div>
      </SettingMenuGroup>
    </div>
  );
};

export default PreferencesSettings;
