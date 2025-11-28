import React from "react";
import { AlertDialog } from "../ui/alert-dialog";
import AlertDialogConfirm from "../alert-dialog-confirm";
import MyOverlay from "../overlay";
import { Trash } from "lucide-react";

const DialogRequest = () => {
  return (
    <>
      <div className="flex flex-col justify-between w-full h-full">
        <div>Header</div>
        <div>Footer</div>
      </div>
      <AlertDialogConfirm
        open
        modal={false}
        dialogType="column"
        hideCancelButton
        icon={<div></div>}
      />
    </>
  );
};

export default DialogRequest;
