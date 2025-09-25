import React, { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import ToolbarPlugin from "./editor/plugin/toolbar-plugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

const MenuActionButton = () => {
  const [open, setOpen] = useState(false);
  const [editor] = useLexicalComposerContext();

  return (
    <div className="">
      <button
        className=""
        onClick={(e) => {
          setOpen(!open);
          // console.log(e);
        }}
      >
        keo
      </button>
      <DropdownMenu modal open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild></DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-black min-h-20 absolute">
          <div className="">Content</div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default MenuActionButton;
