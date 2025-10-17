import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LexicalEditor } from "lexical";
import React, { useCallback, useEffect, useMemo } from "react";
import { INSERT_TABLE_COMMAND } from "@lexical/table";
import { useToolbarState } from "@/contexts/toolbar-context";

const DialogInsertTable = ({
  open,
  setOpen,
  editor,
  onCloseParent,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  editor: LexicalEditor;
  onCloseParent?: () => void;
}) => {
  const {
    toolbarState: { blockType, isImageNode },
  } = useToolbarState();

  const [rows, setRows] = React.useState("5");
  const [columns, setColumns] = React.useState("5");

  const disabled = useMemo(() => {
    return (
      !rows ||
      !columns ||
      isNaN(Number(rows)) ||
      isNaN(Number(columns)) ||
      !Number(rows) ||
      Number(rows) <= 0 ||
      Number(rows) > 500 ||
      !Number(columns) ||
      Number(columns) <= 0 ||
      Number(columns) > 50
    );
  }, [rows, columns]);

  const handleInsertTable = useCallback(() => {
    if (disabled) {
      return;
    }

    if (blockType === "code" || isImageNode) {
      setOpen(false);
      return;
    }

    editor.dispatchCommand(INSERT_TABLE_COMMAND, {
      columns,
      rows,
    });
    setOpen(false);
    if (onCloseParent) {
      onCloseParent();
    }
  }, [
    editor,
    rows,
    columns,
    setOpen,
    disabled,
    blockType,
    isImageNode,
    onCloseParent,
  ]);

  useEffect(() => {
    const keydownHandler = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleInsertTable();
      }
    };

    if (!open) {
      setTimeout(() => {
        setRows("5");
        setColumns("5");
      }, 100);
      window.removeEventListener("keydown", keydownHandler);
    }
    if (open) {
      window.addEventListener("keydown", keydownHandler);
    }

    return () => {
      window.removeEventListener("keydown", keydownHandler);
    };
  }, [open, handleInsertTable]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Table</DialogTitle>
          <DialogDescription />
        </DialogHeader>

        <div className="max-w-2/3 w-full mx-auto space-y-2">
          <div className="flex items-center w-full gap-2">
            <Label htmlFor="rows-table" className="w-1/4 font-normal">
              Rows
            </Label>
            <Input
              id="rows-table"
              placeholder="Enter number of rows"
              className="flex-1"
              value={rows}
              onChange={(e) => setRows(e.target.value)}
            />
          </div>
          <div className="flex items-center w-full gap-2">
            <Label htmlFor="columns-table" className="w-1/4 font-normal">
              Columns
            </Label>
            <Input
              id="columns-table"
              placeholder="Enter number of columns"
              className="flex-1"
              value={columns}
              onChange={(e) => setColumns(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant={"outline"}>Cancel</Button>
          </DialogClose>
          <Button disabled={disabled} onClick={handleInsertTable}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DialogInsertTable;
