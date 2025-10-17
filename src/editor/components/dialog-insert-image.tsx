import { FileUploadComponent } from "@/components/file-upload-component";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { $insertNodes, LexicalEditor } from "lexical";
import React, { Dispatch, useEffect, useState } from "react";
import { $createImageNode } from "../nodes/image-node";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DialogInsertImage = ({
  editor,
  open,
  setOpen,
  onCloseParent,
}: {
  editor: LexicalEditor;
  open: boolean;
  setOpen: Dispatch<boolean>;
  onCloseParent?: () => void;
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isUrl, setIsUrl] = useState(false);
  const [isUpload, setIsUpload] = useState(false);
  const [objectUrl, setObjectUrl] = useState({
    url: "",
    alt: "",
  });

  function setAction(type: "url" | "upload") {
    setIsUrl(type === "url");
    setIsUpload(type === "upload");
  }

  function resetAction() {
    setIsUrl(false);
    setIsUpload(false);
    setObjectUrl({ url: "", alt: "" });
  }

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        resetAction();
        setFiles([]);
      }, 100);
    }
  }, [open]);

  function renderContent() {
    if (isUrl) {
      return (
        <div className="space-y-2 max-w-2/3 mx-auto w-full">
          <div className="flex items-center gap-2 w-full">
            <Label htmlFor="image-url" className="font-normal w-1/4">
              Image URL:
            </Label>
            <Input
              id="image-url"
              placeholder="Enter image url"
              className="flex-1"
              value={objectUrl.url}
              onChange={(e) =>
                setObjectUrl((prev) => ({ ...prev, url: e.target.value }))
              }
            />
          </div>
          <div className="flex items-center gap-2 w-full ">
            <Label htmlFor="image-alt" className="font-normal w-1/4">
              Alt Text:
            </Label>
            <Input
              id="image-alt"
              placeholder="Enter image alt text"
              className="flex-1"
              value={objectUrl.alt}
              onChange={(e) =>
                setObjectUrl((prev) => ({ ...prev, alt: e.target.value }))
              }
            />
          </div>
        </div>
      );
    }

    if (isUpload) {
      return (
        <div className="w-full h-full">
          <FileUploadComponent files={files} setFiles={setFiles} />
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-3 max-w-1/2 mx-auto w-full my-4">
        <Button variant={"outline"} onClick={() => setAction("url")}>
          URL
        </Button>
        <Button variant={"outline"} onClick={() => setAction("upload")}>
          Upload File
        </Button>
      </div>
    );
  }

  function confirmInsert() {
    if (isUpload) {
      if (files && files.length) {
        editor.update(() => {
          for (const file of files) {
            const src = URL.createObjectURL(file);
            const imageNode = $createImageNode({
              src,
              altText: file.name,
              current_file: file,
            });
            $insertNodes([imageNode]);
          }
        });
      }
    } else if (isUrl) {
      if (objectUrl.url.trim() !== "") {
        editor.update(() => {
          const imageNode = $createImageNode({
            src: objectUrl.url,
            altText: objectUrl.alt || "Image",
            status: "success",
          });
          $insertNodes([imageNode]);
        });
      }
    }
    if (onCloseParent) {
      onCloseParent();
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
          <DialogDescription />
        </DialogHeader>
        {renderContent()}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant={"outline"}>Cancel</Button>
          </DialogClose>

          <Button onClick={confirmInsert}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DialogInsertImage;
