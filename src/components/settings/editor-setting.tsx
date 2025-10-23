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

const FontSelector = () => {
  return (
    <Select defaultValue="Tahoma">
      <SelectTrigger>
        <SelectValue placeholder="Select Font Style" />
      </SelectTrigger>
      <SelectContent className="z-10000">
        <SelectGroup>
          <SelectItem value="Arial">Arial</SelectItem>
          <SelectItem value="Helvetica">Helvetica</SelectItem>
          <SelectItem value="Times New Roman">Times New Roman</SelectItem>
          <SelectItem value="Courier New">Courier New</SelectItem>
          <SelectItem value="Verdana">Verdana</SelectItem>
          <SelectItem value="Tahoma">Tahoma</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

const TabSizeSelector = () => {
  return (
    <Select defaultValue="4">
      <SelectTrigger>
        <SelectValue placeholder="Select Tab Size" />
      </SelectTrigger>
      <SelectContent className="z-10000">
        <SelectGroup>
          <SelectItem value="2">2</SelectItem>
          <SelectItem value="4">4</SelectItem>
          <SelectItem value="8">8</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

const EditorSettings = () => {
  return (
    <div className="flex flex-col w-full h-full overflow-hidden rounded-md">
      <SettingMenuGroup
        label="Editor"
        className="max-h-full p-5 overflow-hidden overflow-y-auto"
      >
        <div className="flex flex-col w-full h-full max-h-full gap-5 py-4 overflow-hidden overflow-y-auto text-sm">
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
                />
              }
            />
          </SettingMenu>
          <SettingMenuGroup label="Text Style">
            <SettingMenu className="gap-4">
              <SettingMenuItem
                label="Font Style"
                description="Select your preferred font style"
                action={<FontSelector />}
              />
              <SettingMenuItem
                label="Tab Size"
                description="Set your preferred tab size for indentation when spaces are used"
                action={<TabSizeSelector />}
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
                  />
                }
                isRealLabel
                labelHtmlFor="setting-editor-code-auto-wrap"
              />
            </SettingMenu>
          </SettingMenuGroup>
        </div>
      </SettingMenuGroup>
    </div>
  );
};

export default EditorSettings;
