"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
} from "./ui/sidebar";
import AppSidebarHeader from "./sidebar-header";
import SidebarNavMainContainer from "./sidebar-nav-main";
import SidebarNavSetting from "./sidebar-nav-setting";
import { useNote } from "@/contexts/note-context";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { logAction } from "@/lib/utils";
import { get, post } from "@/utils/request";
import { TRequest } from "@/types/request.type";
import { Button } from "./ui/button";
import { Check, X } from "lucide-react";
import { useWorkspace } from "@/contexts/workspace-context";
import { useRequest } from "@/contexts/request-context";
import { useAuth } from "@/contexts/auth-context";
import { usePathname } from "next/navigation";

const SidebarInboxItem = ({ req }: { req: TRequest }) => {
  const { setRequests } = useRequest();

  const renderTitle = (req: TRequest) => {
    const sender_fullname = (
      <span className="text-primary font-medium">
        {" "}
        {req.sender_info?.fullname || "Someone"}{" "}
      </span>
    );

    const receiver_fullname = (
      <span className="text-primary font-medium">
        {" "}
        {req.receiver_info?.fullname || "Someone"}{" "}
      </span>
    );

    const getTitleMessage = (req: TRequest) => {
      if (req.request_type === "invite") {
        return (
          <>
            invited{" "}
            {req.type_action === "other"
              ? receiver_fullname
              : req.type_action === "send"
              ? receiver_fullname
              : " you "}{" "}
            to{" "}
          </>
        );
      }

      if (req.request_type === "request") {
        return (
          <>
            requested{" "}
            {req.type_action === "other"
              ? receiver_fullname
              : req.type_action === "send"
              ? receiver_fullname
              : " you "}{" "}
            to join{" "}
          </>
        );
      }

      if (req.request_type === "remove") {
        return (
          <>
            removed{" "}
            {req.type_action === "other"
              ? receiver_fullname
              : req.type_action === "send"
              ? receiver_fullname
              : " you "}{" "}
            from{" "}
          </>
        );
      }

      return null;
    };

    return (
      <div className="flex flex-wrap gap-1 pr-5 break-all">
        {req.type_action === "other"
          ? sender_fullname
          : req.type_action === "send"
          ? "You"
          : sender_fullname}

        <span className="text-neutral-600">{getTitleMessage(req)}</span>
        <p className="font-medium">{req.ref_data_info?.title || "Untitled"}</p>
      </div>
    );
  };

  const action = (
    <div className="flex flex-col gap-1">
      {req.type_action === "receive" ? (
        <Button className="size-6 p-0 rounded-sm" variant={"outline"}>
          <Check />
        </Button>
      ) : null}
      {req.type_action === "send" ? (
        //cancel sent request
        <Button
          className="size-6 opacity-80 p-0 rounded-sm"
          variant={"destructive"}
        >
          <X />
        </Button>
      ) : (
        <Button
          className="size-6 opacity-80 p-0 rounded-sm"
          variant={"destructive"}
        >
          <X />
        </Button>
      )}
    </div>
  );

  const dateHTML = (
    <div className="">
      {req.status === "pending" && req.request_type === "request"
        ? action
        : "Oct"}
    </div>
  );

  const handleRead = useCallback(async () => {
    try {
      await post(`/requests/${req.id}/read`);
      setRequests((prev) => {
        return prev.map((re) => {
          if (re.id === req.id) {
            return {
              ...re,
              is_read: 1,
            };
          }
          return re;
        });
      });
    } catch (error) {
      logAction("Error marking request as read:", error);
    }
  }, [req, setRequests]);

  return req.ref_link ? (
    <Link
      href={req.ref_link}
      className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground whitespace-nowrap min-h-20 relative flex items-center gap-2 p-4 text-sm leading-tight border-b"
      onPointerDown={handleRead}
    >
      <div className="flex items-center justify-between w-full gap-2">
        <div className="flex items-center gap-2">
          <Avatar className="bg-neutral-300">
            <AvatarImage src={""} />
            <AvatarFallback>
              <span className="text-xs">U</span>
            </AvatarFallback>
          </Avatar>
          <div>
            {renderTitle(req)}
            <p className="text-ellipsis line-clamp-1 text-neutral-400 mt-1 text-xs">
              {req.message}
            </p>
          </div>
        </div>
        {dateHTML}
      </div>
      {!req.is_read && (
        <div className="size-1.5 top-3 right-2 absolute bg-blue-500 rounded-full" />
      )}
    </Link>
  ) : (
    <div
      className="whitespace-nowrap min-h-20 flex items-center p-4 text-sm leading-tight border-b"
      onPointerDown={handleRead}
    >
      <div className="flex items-center justify-between w-full gap-2">
        <div className="flex items-center gap-2">
          <Avatar className="bg-neutral-300">
            <AvatarImage src={""} />
            <AvatarFallback>
              <span className="text-xs">U</span>
            </AvatarFallback>
          </Avatar>
          <div>
            {renderTitle(req)}
            <p className="text-ellipsis line-clamp-1 text-neutral-400 mt-1 text-xs">
              {req.message}
            </p>
          </div>
        </div>
        {dateHTML}
      </div>
    </div>
  );
};

const SidebarInbox = ({
  open,
  ref,
}: {
  open: boolean;
  ref: React.RefObject<HTMLDivElement | null>;
}) => {
  const { currentWorkspace } = useWorkspace();
  const { requests, setRequests } = useRequest();
  const {
    state: { user },
  } = useAuth();

  useEffect(() => {
    const fetchData = async (workspace_id: number) => {
      try {
        const res = (await get("/requests?workspace_id=" + workspace_id)) as {
          requests: TRequest[];
        };

        if (res.requests && Array.isArray(res.requests)) {
          setRequests(res.requests);
        }
      } catch (error) {
        logAction("Error fetching inbox data:", error);
      }
    };

    if (!currentWorkspace || !currentWorkspace.id || !user) {
      return;
    }
    fetchData(currentWorkspace.id);
  }, [currentWorkspace, setRequests, user]);

  return (
    <Sidebar
      collapsible="none"
      className={`flex-1 border-r bg-white ${
        open ? "flex min-w-xs" : "hidden"
      }`}
      ref={ref}
    >
      <SidebarContent>
        <SidebarGroup className="px-0">
          <SidebarGroupLabel className="text-primary text-sm font-medium">
            Inbox
          </SidebarGroupLabel>
          <SidebarGroupContent className="flex flex-col">
            {requests.length ? (
              requests.map((req) => <SidebarInboxItem key={req.id} req={req} />)
            ) : (
              <div className="py-18 flex flex-col items-center justify-center w-full gap-1 text-center">
                <Check className="size-8 text-neutral-500" />
                <p className="text-neutral-500 font-semibold">
                  You&apos;ve all caught up!
                </p>
                <p className="text-ellipsis line-clamp-1 text-neutral-400 text-xs">
                  No new requests
                </p>
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

const AppSidebarClient = () => {
  const { currentNote } = useNote();

  const [openMenuInbox, setOpenMenuInbox] = useState(false);

  const sidebarRef = React.useRef<HTMLDivElement>(null);
  const sidebarInboxRef = React.useRef<HTMLDivElement>(null);
  const btnMenuInboxRef = React.useRef<HTMLButtonElement>(null);

  const pathname = usePathname();

  useEffect(() => {
    const sidebar = sidebarRef.current;
    const sidebarInbox = sidebarInboxRef.current;
    const btnMenuInbox = btnMenuInboxRef.current;

    if (!sidebar || !openMenuInbox || !btnMenuInbox || !sidebarInbox) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        !sidebarInbox.contains(event.target as Node) &&
        !btnMenuInbox.contains(event.target as Node)
      ) {
        setOpenMenuInbox(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuInbox]);

  if (!currentNote && !(pathname === "/home")) {
    return <>Loading</>;
  }

  return (
    <>
      <Sidebar
        collapsible="none"
        className={`${
          openMenuInbox ? "border-r" : ""
        } min-w-[255px] not-outside group/sidebar`}
        ref={sidebarRef}
      >
        <SidebarHeader>
          <AppSidebarHeader
            openMenuInbox={openMenuInbox}
            setOpenMenuInbox={setOpenMenuInbox}
            btnMenuInboxRef={btnMenuInboxRef}
          />
        </SidebarHeader>
        <SidebarContent>
          <SidebarNavMainContainer />
          <SidebarNavSetting />
        </SidebarContent>
      </Sidebar>
      <SidebarInbox open={openMenuInbox} ref={sidebarInboxRef} />
    </>
  );
};

export default AppSidebarClient;
