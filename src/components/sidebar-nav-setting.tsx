import React from "react";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";
import { Settings, Trash2 } from "lucide-react";

const SidebarNavSetting = () => {
  return (
    <SidebarGroup className="py-0">
      <SidebarMenu className="text-neutral-600 dark:text-neutral-400">
        <SidebarMenuItem className="cursor-pointer">
          <SidebarMenuButton className="font-semibold cursor-pointer">
            <div className="flex items-center gap-2">
              <Settings size={20} />
              <p>Settings</p>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem className="cursor-pointer">
          <SidebarMenuButton className="font-semibold cursor-pointer">
            <div className="flex items-center gap-2">
              <Trash2 size={20} />
              <p>Trash</p>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
};

export default SidebarNavSetting;
