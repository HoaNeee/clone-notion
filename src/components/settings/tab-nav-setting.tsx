"use client";

import React from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  Bolt,
  LucideProps,
  Settings,
  Settings2,
  Users,
} from "lucide-react";
import { Label } from "../ui/label";
import { useAuth } from "@/contexts/auth-context";
import ProfileSettings from "./profile-setting";
import PreferencesSettings from "./preferences-setting";
import NotificationsSettings from "./notification-setting";
import EditorSettings from "./editor-setting";
import WorkspaceGeneralSettings from "./workspace-general-setting";

const TabGroup = ({ children }: { children: React.ReactNode }) => {
  return <div className="flex flex-col w-full gap-0.5 mb-2">{children}</div>;
};

const TabGroupLabel = ({ children }: { children: React.ReactNode }) => {
  return <Label className="mb-1 text-xs">{children}</Label>;
};

const TabNavSetting = () => {
  const {
    state: { user },
  } = useAuth();

  const tabs = [
    {
      label: "Account",
      menu: [
        {
          name: user?.fullname || "Profile",
          value: "profile",
          icon: (
            <div className="size-5 bg-neutral-400/60 text-neutral-600 flex items-center justify-center text-xs rounded-full">
              {user?.avatar ||
                (user?.fullname ? user.fullname.charAt(0).toUpperCase() : "U")}
            </div>
          ),
        },
        {
          name: "Preferences",
          value: "preferences",
          icon: Settings2,
        },
        {
          name: "Notifications",
          value: "notifications",
          icon: Bell,
        },
        {
          name: "Editor",
          value: "editor",
          icon: Bolt,
        },
      ],
    },
    {
      label: "Workspace",
      menu: [
        {
          name: "General",
          value: "workspace_general",
          icon: Settings,
        },
        {
          name: "People",
          value: "workspace_people",
          icon: Users,
        },
      ],
    },
  ];

  const navigateContent = (value: string) => {
    switch (value) {
      case "profile":
        return <ProfileSettings />;
      case "preferences":
        return <PreferencesSettings />;
      case "notifications":
        return <NotificationsSettings />;
      case "editor":
        return <EditorSettings />;
      case "workspace_general":
        return <WorkspaceGeneralSettings />;

      default:
        return <div>Default Content</div>;
    }
  };

  return (
    <Tabs
      orientation="vertical"
      defaultValue={tabs[0].menu[0].value}
      className="flex flex-row items-start w-full h-full gap-4"
    >
      <TabsList className="shrink-0 bg-neutral-50 grid items-start justify-start w-1/5 h-full max-h-full grid-cols-1 p-3">
        <div className="flex flex-col w-full h-full gap-0">
          {tabs.map((tabGroup) => {
            return (
              <TabGroup key={tabGroup.label}>
                <TabGroupLabel>{tabGroup.label}</TabGroupLabel>
                {tabGroup.menu.map((tab, key) => {
                  let Icon = tab.icon;

                  if (Icon && React.isValidElement(Icon)) {
                    Icon = Icon;
                  } else {
                    Icon = Icon as React.ForwardRefExoticComponent<
                      Omit<LucideProps, "ref"> &
                        React.RefAttributes<SVGSVGElement>
                    >;
                    Icon = <Icon className="me-2 w-5 h-5" />;
                  }

                  if (tab.value === "profile") {
                    return (
                      <TabsTrigger
                        key={key}
                        value={tab.value}
                        className={`data-[state=active]:bg-neutral-200 data-[state=active]:text-primary/80 text-neutral-500 justify-start px-2.5 py-1 h-fit w-full data-[state=active]:shadow-none cursor-pointer hover:bg-neutral-200/50 gap-2`}
                      >
                        {Icon}{" "}
                        <span className="line-clamp-1 text-ellipsis text-start flex-1 inline-block">
                          {tab.name}
                        </span>
                      </TabsTrigger>
                    );
                  }

                  return (
                    <TabsTrigger
                      key={key}
                      value={tab.value}
                      className={`data-[state=active]:bg-neutral-200 data-[state=active]:text-primary/80 text-neutral-500 justify-start px-3 py-1 h-fit w-full data-[state=active]:shadow-none cursor-pointer hover:bg-neutral-200/50 gap-0.5`}
                    >
                      {Icon}
                      {tab.name}
                    </TabsTrigger>
                  );
                })}
              </TabGroup>
            );
          })}
        </div>
      </TabsList>

      <div className="text-muted-foreground flex items-center justify-center w-full h-full font-medium rounded-md">
        {tabs.map((tabGroup) =>
          tabGroup.menu.map((tab) => (
            <TabsContent
              key={tab.value}
              value={tab.value}
              className="flex items-center justify-center h-full"
            >
              {navigateContent(tab.value)}
            </TabsContent>
          ))
        )}
      </div>
    </Tabs>
  );
};

export default TabNavSetting;
