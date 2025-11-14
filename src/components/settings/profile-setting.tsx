"use client";

import React from "react";
import { SettingMenu, SettingMenuGroup, SettingMenuItem } from "./settings";
import { Button } from "../ui/button";
import { ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

const ProfileSettings = () => {
  const {
    state: { user },
    updateUser,
  } = useAuth();

  const [fullname, setFullname] = React.useState(user?.fullname || "");

  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col w-full h-full overflow-hidden rounded-md">
      <SettingMenuGroup
        label="Profile"
        className="max-h-full p-5 overflow-hidden overflow-y-auto"
      >
        <div className="flex flex-col w-full h-full max-h-full gap-5 py-4 overflow-hidden overflow-y-auto text-sm">
          <div className="max-w-1/2 flex items-center w-full gap-5 py-4">
            <Avatar className="size-14">
              <AvatarImage src={user?.avatar || ""} />
              <AvatarFallback className="text-lg">
                {user?.fullname ? user.fullname.charAt(0).toUpperCase() : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-0.5">
              <p className="text-neutral-500 text-xs font-normal">
                Preferred name
              </p>
              <input
                type="text"
                className="border-neutral-300 w-full px-2 py-1 border rounded-md"
                value={fullname || ""}
                onChange={(e) => setFullname(e.target.value)}
                onBlur={() => {
                  updateUser({ fullname });
                }}
                ref={inputRef}
                onKeyDown={(e) => {
                  if (!e.ctrlKey && e.key === "Enter") {
                    e.preventDefault();
                    if (inputRef.current) {
                      inputRef.current.blur();
                    }
                    updateUser({ fullname });
                  }
                }}
              />
            </div>
          </div>

          <SettingMenuGroup label="Account Security">
            <SettingMenu>
              <SettingMenuItem
                action={
                  <Button variant={"outline"} size={"sm"}>
                    Change Email
                  </Button>
                }
                label="Email"
                description={user?.email || "No email provided"}
              />
              <SettingMenuItem
                action={
                  <Button variant={"outline"} size={"sm"}>
                    Change Password
                  </Button>
                }
                label="Password"
                description={"Change your account password"}
              />
            </SettingMenu>
          </SettingMenuGroup>
          <SettingMenuGroup label="Support">
            <SettingMenu>
              <SettingMenuItem
                action={
                  <Button variant={"ghost"} size={"sm"}>
                    <ChevronRight />
                  </Button>
                }
                className="cursor-pointer"
                label={
                  <p className="text-destructive font-semibold">
                    Delete Account
                  </p>
                }
                description={
                  "Permanently delete your account and all associated data."
                }
              />
            </SettingMenu>
          </SettingMenuGroup>
        </div>
      </SettingMenuGroup>
    </div>
  );
};

export default ProfileSettings;
