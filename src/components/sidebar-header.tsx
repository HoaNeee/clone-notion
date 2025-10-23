"use client";

import React, { Dispatch } from "react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  ChevronsLeft,
  ChevronsUpDown,
  Home,
  Search,
  Settings,
  ShieldUser,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { logAction } from "@/lib/utils";
import TabNavSetting from "./settings/tab-nav-setting";

const DialogLogout = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: Dispatch<boolean>;
}) => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/";
    } catch (error) {
      logAction("Error logging out:", error);
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent showCloseButton={false} className="w-xs">
        <DialogHeader className="text-neutral-700">
          <DialogTitle asChild>
            <div className="flex flex-col items-center justify-center gap-2 font-normal">
              <ShieldUser />
              <p className="font-semibold">Log out of your account?</p>
            </div>
          </DialogTitle>
          <DialogDescription className="text-center">
            You will need to log back in to access your Notion workspaces.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Button
            variant={"destructive"}
            className="opacity-80"
            onClick={handleLogout}
          >
            Log out
          </Button>
          <DialogClose asChild>
            <Button variant={"outline"}>Cancel</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DialogSetting = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: Dispatch<boolean>;
}) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="h-10/12 w-7/10 p-0"
        style={{ maxWidth: "100%" }}
      >
        <DialogHeader className="max-h-0 absolute hidden h-0">
          <DialogTitle />
          <DialogDescription />
        </DialogHeader>
        <div className="flex w-full h-full max-h-full gap-2 overflow-hidden">
          <TabNavSetting />
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DropdownSidebarUser = () => {
  const { toggleSidebar } = useSidebar();

  const {
    state: { user },
  } = useAuth();

  const [openDropdown, setOpenDropdown] = React.useState(false);
  const [openDialogLogout, setOpenDialogLogout] = React.useState(false);
  const [openDialogSettings, setOpenDialogSettings] = React.useState(false);

  const hideDropdown = () => {
    setOpenDropdown(false);
  };

  return (
    <>
      <DropdownMenu open={openDropdown} onOpenChange={setOpenDropdown}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton className="relative flex justify-between cursor-pointer">
            <div className="size-6 bg-neutral-200 flex items-center justify-center text-sm rounded-sm">
              N
            </div>
            <p className="group-hover/item:pr-10 group-hover/sidebar:pr-4 line-clamp-1 text-ellipsis flex-1">
              Notion de {user?.fullname || "User"}
            </p>
            <div className="group-hover/item:opacity-100 right-10 top-1/2 text-neutral-500 absolute transform -translate-y-1/2 opacity-0">
              <ChevronsUpDown size={18} className="" />
            </div>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <div className="group-hover/sidebar:opacity-100 text-neutral-500 right-2 top-1/2 absolute flex items-center gap-1 transition-opacity transform -translate-y-1/2 opacity-0">
          <ChevronsLeft
            size={22}
            className="hover:bg-gray-200/70 rounded-sm cursor-pointer"
            onClick={toggleSidebar}
          />
        </div>
        <DropdownMenuContent
          align="start"
          className="w-[calc(var(--radix-dropdown-menu-trigger-width)+50px)] text-sm py-2 px-3"
        >
          <div className="mb-3">
            <div className="flex items-center gap-2">
              <div className="size-9 bg-neutral-200 flex items-center justify-center text-lg font-semibold rounded-sm">
                N
              </div>
              <div>
                <p className="flex-1 font-semibold">
                  Notion de {user?.fullname || "User 1234567890"}
                </p>
                <p className="text-neutral-400 text-xs">1 member</p>
              </div>
            </div>
            <div className="mt-3">
              <Button
                variant={"outline"}
                size={"sm"}
                className="h-7 text-neutral-500 p-0 text-xs"
                onClick={() => {
                  setOpenDialogSettings(true);
                  hideDropdown();
                }}
              >
                <Settings /> Settings
              </Button>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuGroup className="mt-0">
            <DropdownMenuLabel className="text-neutral-500/80 text-xs">
              {"example@gmail.com"}
            </DropdownMenuLabel>
            <DropdownMenuItem
              className="cursor-pointer  text-[13px] font-semibold text-neutral-700"
              onClick={() => setOpenDialogLogout(true)}
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogLogout open={openDialogLogout} setOpen={setOpenDialogLogout} />
      <DialogSetting
        open={openDialogSettings}
        setOpen={setOpenDialogSettings}
      />
    </>
  );
};

const AppSidebarHeader = () => {
  return (
    <SidebarMenu>
      <SidebarMenuItem className="group/item">
        <DropdownSidebarUser />
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton className="text-neutral-700 font-medium cursor-pointer">
          <Search className="text-neutral-500" /> Search
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton className="text-neutral-700 font-medium cursor-pointer">
          <Home className="text-neutral-500" /> Home
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

export default AppSidebarHeader;
