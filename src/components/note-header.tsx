"use client";

import React from "react";
import { useSidebar } from "./ui/sidebar";
import { LockKeyhole, Menu, MessageSquareText, Star } from "lucide-react";
import { Button } from "./ui/button";
import { TNote } from "@/types/note.type";

const NoteHeader = ({ note }: { note: TNote }) => {
  const { open, toggleSidebar } = useSidebar();

  return (
    <header className="sticky z-20 px-4 top-0 left-0 w-full bg-white py-3 text-sm flex items-center justify-between  min-h-8">
      <div className="flex items-center gap-2">
        {!open && (
          <Button size={"sm"} variant={"ghost"} onClick={toggleSidebar}>
            <Menu className="text-neutral-500" />
          </Button>
        )}
        <p>{note?.title || "New File"}</p>
        {note.status === "private" && (
          <div className="flex items-center gap-1 text-neutral-500 hover:bg-neutral-100 px-2 py-1 rounded-md cursor-pointer">
            <LockKeyhole size={12} />
            <span className="">Private</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-0">
        <Button
          variant={"ghost"}
          size={"sm"}
          className="h-7 text-neutral-400 text-sm font-normal"
        >
          <p>Edited 3 days ago</p>
        </Button>
        <Button
          variant={"ghost"}
          size={"sm"}
          className="h-7 text-sm font-normal"
        >
          Share
        </Button>
        <Button
          variant={"ghost"}
          size={"sm"}
          className="h-7 text-sm font-normal"
        >
          <MessageSquareText />
        </Button>
        <Button
          variant={"ghost"}
          size={"sm"}
          className="h-7 text-sm font-normal"
        >
          <Star />
        </Button>
      </div>
    </header>
  );
};

export default NoteHeader;
