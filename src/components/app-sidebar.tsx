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
import { ErrorNoteEnum, useNote } from "@/contexts/note-context";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { logAction } from "@/lib/utils";
import { get, patch, post } from "@/utils/request";
import { TRequest } from "@/types/request.type";
import { Button } from "./ui/button";
import { Archive, Bell, BookmarkCheck, Check, Trash, X } from "lucide-react";
import { useWorkspace } from "@/contexts/workspace-context";
import { useRequest } from "@/contexts/request-context";
import { useAuth } from "@/contexts/auth-context";
import { usePathname } from "next/navigation";
import { VariantProps } from "class-variance-authority";
import { TNote } from "@/types/note.type";
import { Skeleton } from "./ui/skeleton";

const SidebarInboxItem = ({ req }: { req: TRequest }) => {
	const { setRequests } = useRequest();
	const { currentWorkspace } = useWorkspace();

	const {
		state: { user },
	} = useAuth();

	const actionElementRef = React.useRef<HTMLDivElement>(null);

	const handleChangeNotification = useCallback(() => {
		console.log("change notification", req);
	}, [req]);

	const handleArchiveRequest = useCallback(() => {
		console.log("archive request", req);
	}, [req]);

	const handleRemoveRequest = useCallback(() => {
		console.log("remove request", req);
	}, [req]);

	const handleMarkAsRead = useCallback(
		async (user_id: number) => {
			try {
				if (!user_id) {
					return;
				}

				if (!currentWorkspace) {
					return;
				}

				await post(
					`/requests/${req.id}/read?workspace_id=${currentWorkspace.id}`,
					{ user_id }
				);
				setRequests((prev) => {
					return prev.map((re) => {
						if (re.id === req.id) {
							return {
								...re,
								user_reads: [...re.user_reads, user_id],
							};
						}
						return re;
					});
				});
			} catch (error) {
				logAction("Error marking request as read:", error);
			}
		},
		[req, setRequests, currentWorkspace]
	);

	const onPointerDown = useCallback(
		async (e: React.PointerEvent) => {
			if (
				(actionElementRef.current &&
					actionElementRef.current.contains(e.target as Node)) ||
				!user
			) {
				return;
			}

			await handleMarkAsRead(user.id || 0);
		},
		[handleMarkAsRead, user]
	);

	const renderTitle = (req: TRequest) => {
		const sender_fullname = (
			<span className="text-primary font-medium">
				{req.sender_info?.fullname || "Someone"}{" "}
			</span>
		);

		const receiver_fullname = (
			<span className="text-primary font-medium">
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
							: "you"}
						to{" "}
					</>
				);
			}

			if (req.request_type === "request") {
				return (
					<>
						{`${
							req.status === "pending"
								? "requested"
								: req.status === "accepted"
								? "has been accepted"
								: "was rejected"
						} `}
						{req.type_action === "other"
							? receiver_fullname
							: req.type_action === "send"
							? receiver_fullname
							: "you "}
						to join
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
							: "you "}
						from{" "}
					</>
				);
			}

			return null;
		};

		return (
			<div className="whitespace-pre-wrap">
				{req.type_action === "other"
					? sender_fullname
					: req.type_action === "send"
					? " You "
					: sender_fullname}

				<span className="text-neutral-600 leading-5">
					{getTitleMessage(req)}
				</span>
				{req.ref_link ? (
					<Link
						href={req.ref_link}
						className="hover:bg-neutral-200 rounded-xs px-1"
						onPointerDown={onPointerDown}
					>
						<span className="font-medium">
							{req.ref_data_info?.title || "Untitled"}
						</span>
					</Link>
				) : (
					<span className="font-medium">
						{req.ref_data_info?.title || "Untitled"}
					</span>
				)}
			</div>
		);
	};

	const handleChangeStatusRequest = useCallback(
		async (status: string) => {
			try {
				await patch(
					`/requests/update-status/${req.id}?workspace_id=${currentWorkspace?.id}`,
					{
						status,
					}
				);

				setRequests((prev) => {
					return prev.map((re) => {
						if (re.id === req.id) {
							return {
								...re,
								user_reads: user
									? [...re.user_reads, user.id || 0]
									: re.user_reads,
								is_completed: true,
							};
						}
						return re;
					});
				});
			} catch (error) {
				logAction("Error changing request status:", error);
			}
		},
		[req, setRequests, currentWorkspace, user]
	);

	const renderDate = useCallback(() => {
		const buttonProps = {
			variant: "ghost" as VariantProps<typeof Button>["variant"],
			className: "size-5 rounded-xs text-neutral-500 dark:text-neutral-300 p-0",
		};

		const action = (
			<div className="flex flex-col items-center justify-center gap-1">
				<Button
					className="size-6 p-0 rounded-sm"
					variant={"outline"}
					onClick={() => handleChangeStatusRequest("accepted")}
				>
					<Check />
				</Button>

				<Button
					className="size-6 opacity-80 p-0 rounded-sm"
					variant={"destructive"}
					onClick={() => handleChangeStatusRequest("rejected")}
				>
					<X />
				</Button>
			</div>
		);

		if (!user) {
			return (
				<span className="text-neutral-400 dark:text-neutral-200 text-xs">
					Oct
				</span>
			);
		}

		if (!currentWorkspace) {
			return null;
		}

		const isShowAction =
			req.status === "pending" &&
			req.request_type === "request" &&
			req.receiver_id === user.id &&
			!req.is_completed;

		return (
			<div className="min-w-22 text-center">
				{isShowAction ? (
					action
				) : (
					<div className="relative">
						<div className="group-hover/item-inbox:opacity-0 flex items-center justify-end gap-2 opacity-100">
							<span className="text-neutral-400 dark:text-neutral-200 text-xs">
								Oct
							</span>
							{!req.user_reads.includes(user.id) && (
								<div className="bg-blue-500 rounded-full size-1.5" />
							)}
						</div>
						<div
							ref={actionElementRef}
							className="top-1/2 group-hover/item-inbox:opacity-100 group-hover/item-inbox:pointer-events-auto absolute right-0 flex items-center gap-1 p-1 transition-opacity transform -translate-y-1/2 bg-white border rounded-sm shadow-md opacity-0 pointer-events-none"
						>
							<Button {...buttonProps} onClick={handleChangeNotification}>
								<Bell />
							</Button>
							<Button
								{...buttonProps}
								onClick={() => handleMarkAsRead(user.id || 0)}
							>
								<BookmarkCheck />
							</Button>
							{currentWorkspace?.role === "admin" ? (
								<>
									<Button {...buttonProps} onClick={handleArchiveRequest}>
										<Archive />
									</Button>
									<Button {...buttonProps} onClick={handleRemoveRequest}>
										<Trash />
									</Button>
								</>
							) : null}
						</div>
					</div>
				)}
			</div>
		);
	}, [
		handleArchiveRequest,
		handleChangeNotification,
		handleMarkAsRead,
		handleRemoveRequest,
		req.status,
		req.request_type,
		req.user_reads,
		user,
		req.receiver_id,
		currentWorkspace,
		handleChangeStatusRequest,
		req.is_completed,
	]);

	const content = (
		<div className="space-y-1 w-full">
			<div className="flex items-center justify-between w-full gap-2">
				<div className="flex items-center gap-2">
					<Avatar className="bg-neutral-300">
						<AvatarImage
							src={req?.sender_info?.avatar || undefined}
							alt="avatar inbox"
						/>
						<AvatarFallback>
							<span className="text-xs uppercase font-bold text-neutral-500">
								{req?.sender_info?.fullname?.charAt(0) || "U"}
							</span>
						</AvatarFallback>
					</Avatar>
					<div>
						{renderTitle(req)}
						<p className="text-ellipsis line-clamp-1 text-neutral-400 mt-1 text-xs">
							{req.message}
						</p>
					</div>
				</div>
				{renderDate()}
			</div>
			{/* {req.request_type === "request" ? status : null} */}
		</div>
	);

	return (
		<>
			{req.ref_link ? (
				<div className="hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground whitespace-nowrap min-h-25 group/item-inbox relative flex items-center gap-2 p-4 text-sm leading-tight border-b">
					{content}
				</div>
			) : (
				<div className="whitespace-nowrap group/item-inbox min-h-25 relative flex items-center p-4 text-sm leading-tight border-b">
					{content}
				</div>
			)}
		</>
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
				open ? "flex min-w-sm" : "hidden"
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

const SidebarLoading = () => {
	return (
		<div className="w-full h-full flex flex-col px-3 py-2">
			{/* Header */}
			<div className="pb-3">
				<Skeleton className="h-7.5 w-full mb-4 rounded-sm" />
				<div className="mt-4 flex flex-col gap-2">
					<Skeleton className={`h-5.5 rounded-sm w-1/2`} />
					<Skeleton className={`h-5.5 rounded-sm w-2/3`} />
					<Skeleton className={`h-5.5 rounded-sm w-full`} />
				</div>
			</div>
			{/* favorites */}
			<div className="mt-6 py-2">
				<Skeleton className="h-2 w-1/2 rounded-sm" />
				<div className="mt-3 flex flex-col gap-3">
					<Skeleton className="h-5.5 w-2/3 rounded-sm" />
					<Skeleton className="h-5.5 w-full rounded-sm" />
				</div>
			</div>

			{/* private */}
			<div className="mt-6 py-2">
				<Skeleton className="h-2 w-1/2 rounded-sm" />
				<div className="mt-3 flex flex-col gap-3">
					<Skeleton className="h-5.5 w-2/3 rounded-sm" />
					<Skeleton className="h-5.5 w-3/4 rounded-sm" />
					<Skeleton className="h-5.5 w-full rounded-sm" />
					<Skeleton className="h-5.5 w-3/4 rounded-sm" />
					<Skeleton className="h-5.5 w-full rounded-sm" />
					<Skeleton className="h-5.5 w-1/2 rounded-sm" />
				</div>
			</div>
			{/* teamspace */}
			<div className="mt-6 py-2">
				<Skeleton className="h-2 w-1/2 rounded-sm" />
				<div className="mt-3 flex flex-col gap-3">
					<Skeleton className={`h-5.5 rounded-sm w-1/2`} />
					<Skeleton className={`h-5.5 rounded-sm w-2/3`} />
					<Skeleton className={`h-5.5 rounded-sm w-full`} />
				</div>
			</div>
			{/* setting */}
			<div className="py-2 mt-6">
				<div className="flex flex-col gap-3">
					{Array.from({ length: 2 }).map((_, index) => (
						<Skeleton key={index} className="h-5.5 w-full rounded-sm" />
					))}
				</div>
			</div>
		</div>
	);
};

const AppSidebarClient = ({ note }: { note: TNote | null }) => {
	const { currentWorkspace } = useWorkspace();

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

	if (!note && !(pathname === "/home")) {
		return <SidebarLoading />;
	}

	if (pathname === "/home" && !currentWorkspace) {
		return <SidebarLoading />;
	}

	// return <SidebarLoading />;

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

const AppSidebar = () => {
	const { errorNote, currentNote } = useNote();

	if (errorNote !== ErrorNoteEnum.NONE) {
		return null;
	}

	return (
		<>
			<Sidebar
				side="left"
				collapsible="offcanvas"
				className="flex-row *:data-[sidebar=sidebar]:flex-row z-21"
			>
				<AppSidebarClient note={currentNote} />
			</Sidebar>
		</>
	);
};

export default AppSidebar;
