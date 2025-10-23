/* eslint-disable @next/next/no-img-element */
import React, { Dispatch, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { SettingMenuGroup } from "./settings";
import { ImageIcon } from "lucide-react";
import { Button } from "../ui/button";
import { isMimeType } from "@lexical/utils";

const ACCEPTABLE_IMAGE_TYPES = [
  "image/",
  "image/heic",
  "image/heif",
  "image/gif",
  "image/webp",
];

const isLinkHasImage = (url: string): boolean => {
  const imageExtensions = [
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".bmp",
    ".svg",
    ".heic",
    ".heif",
  ];
  return (
    imageExtensions.some((ext) => url.endsWith(ext)) &&
    /^https?:\/\//i.test(url)
  );
};

const PreviewIcon = ({ icon }: { icon: File | string }) => {
  if (typeof icon === "string") {
    return (
      <div className="size-20 p-1.5 bg-white overflow-hidden border border-gray-300 rounded-sm">
        <img
          src={icon}
          alt="workspace-icon"
          className=" object-cover w-full h-full"
        />
      </div>
    );
  }

  const url = URL.createObjectURL(icon);

  return (
    <div className="size-20 p-1.5 bg-white overflow-hidden border border-gray-300 rounded-sm">
      <img
        src={url}
        alt="workspace-icon"
        className="object-cover w-full h-full"
      />
    </div>
  );
};

const TabUploadIcon = ({
  setOpen,
  icon,
  setIcon,
}: {
  open: boolean;
  setOpen: Dispatch<boolean>;
  icon: File | string | null;
  setIcon: Dispatch<File | string | null>;
}) => {
  const [error, setError] = React.useState<string | null>(null);

  const dropzoneRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dropEventHandler = (e: DragEvent) => {
      const dropzone = dropzoneRef.current;

      if (!dropzone) {
        return;
      }

      e.preventDefault();

      if (
        e.dataTransfer?.files &&
        e.dataTransfer.files.length > 0 &&
        dropzone.contains(e.target as Node)
      ) {
        const file = e.dataTransfer.files[0];
        if (isMimeType(file, ACCEPTABLE_IMAGE_TYPES)) {
          setIcon(file);
          setError(null);
        } else {
          setError("Unsupported file type. Please upload an image.");
        }
      }
    };

    const handlePasteEvent = (e: ClipboardEvent) => {
      const dropzone = dropzoneRef.current;

      if (!dropzone) {
        return;
      }

      if (e.clipboardData) {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.kind === "file") {
            const file = item.getAsFile();
            if (file && isMimeType(file, ACCEPTABLE_IMAGE_TYPES)) {
              setIcon(file);
              setError(null);
              e.preventDefault();
              return;
            } else {
              setError("Unsupported file type. Please upload an image.");
            }
          }
          if (item.kind === "string" && item.type === "text/plain") {
            item.getAsString((text) => {
              try {
                if (isLinkHasImage(text)) {
                  setIcon(text);
                  setError(null);
                  console.log(text);
                  e.preventDefault();
                  return;
                } else {
                  throw new Error("No image link");
                }
              } catch {
                setError("Unsupported file type. Please upload an image.");
              }
            });
          }
        }
      }
    };

    document.addEventListener("drop", dropEventHandler);
    document.addEventListener("paste", handlePasteEvent);

    return () => {
      document.removeEventListener("drop", dropEventHandler);
      document.removeEventListener("paste", handlePasteEvent);
      setError(null);
      setIcon(null);
    };
  }, [setIcon]);

  return (
    <div className="min-h-10 w-full p-4 text-sm" ref={dropzoneRef}>
      {icon ? (
        <div className="bg-neutral-200/60 text-neutral-500 flex items-center justify-center w-full gap-2 px-2 py-3 text-center rounded-sm">
          <div className="space-y-1">
            <p>Preview</p>
            <PreviewIcon icon={icon} />
          </div>
        </div>
      ) : (
        <label
          htmlFor="workspace-icon-picker"
          className="bg-neutral-200/60 hover:bg-neutral-200 text-neutral-500 flex items-center justify-center w-full gap-2 px-2 py-3 text-center rounded-sm cursor-pointer"
        >
          <ImageIcon size={20} />
          Upload an image
        </label>
      )}
      {!icon && (
        <>
          <input
            type="file"
            onChange={(e) => {
              if (e.target.files) {
                setIcon(e.target.files[0]);
              }
            }}
            className="hidden"
            id="workspace-icon-picker"
          />
          {error ? (
            <p className="text-destructive mt-2 text-xs text-center">{error}</p>
          ) : (
            <p className="text-neutral-400 mt-2 text-xs text-center">
              or drag, Ctrl + V to paste an image or link
            </p>
          )}
        </>
      )}

      <div className="flex items-center justify-between w-full mt-6">
        {icon ? (
          <Button
            className="h-7 text-neutral-500 text-sm"
            variant={"ghost"}
            size={"sm"}
            onClick={() => {
              setIcon(null);
              setError(null);
            }}
          >
            Back
          </Button>
        ) : (
          <Button
            className="h-7 text-neutral-500 text-sm"
            variant={"ghost"}
            size={"sm"}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
        )}
        <Button disabled={!icon} className="h-7 text-sm" size={"sm"}>
          Save
        </Button>
      </div>
    </div>
  );
};

const PopoverSettingIcon = () => {
  const [open, setOpen] = React.useState(false);
  const [icon, setIcon] = React.useState<File | string | null>(null);

  const cnTabTrigger = `rounded-none data-[state=active]:shadow-none border-t-0 border-l-0 border-r-0 border-b-[3px] border-transparent data-[state=active]:border-primary text-neutral-500 data-[state=active]:text-primary/80`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <div className="size-8 hover:bg-gray-300 flex items-center justify-center bg-gray-200 rounded-sm cursor-pointer">
          N
        </div>
      </PopoverTrigger>
      <PopoverContent className="z-10000 data-[state=open]:animate-none rounded-sm p-0 py-2">
        <Tabs>
          <TabsList className="flex items-center justify-between w-full gap-2 p-0 bg-transparent border-b rounded-none">
            <div className="px-2">
              <TabsTrigger value="upload" className={cnTabTrigger}>
                <span className="hover:bg-neutral-200/50 px-2 py-1 rounded-sm cursor-pointer">
                  Upload
                </span>
              </TabsTrigger>
              <TabsTrigger value="emoji" className={cnTabTrigger}>
                <span className="hover:bg-neutral-200/50 px-2 py-1 rounded-sm cursor-pointer">
                  Emoji
                </span>
              </TabsTrigger>
            </div>

            <div className="border-b-[5px] border-transparent mr-2 text-sm">
              <span
                className="hover:bg-neutral-200/50 px-2 py-1 rounded-sm cursor-pointer"
                onClick={() => {
                  if (icon) {
                    setIcon(null);
                  }
                  setOpen(false);
                }}
              >
                Remove
              </span>
            </div>
          </TabsList>
          <TabsContent value="emoji">
            <div className="min-h-10 px-2 text-sm">Updating...</div>
          </TabsContent>
          <TabsContent value="upload">
            <TabUploadIcon
              open={open}
              setOpen={setOpen}
              icon={icon}
              setIcon={setIcon}
            />
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};

const WorkspaceGeneralSettings = () => {
  return (
    <div className="flex flex-col w-full h-full overflow-hidden rounded-md">
      <SettingMenuGroup
        label="Workspace Settings"
        className="max-h-full p-5 overflow-hidden overflow-y-auto"
      >
        <div className="flex flex-col w-full h-full max-h-full gap-5 py-4 overflow-hidden overflow-y-auto text-sm">
          <div className="flex flex-col gap-1">
            <label>Name</label>
            <input placeholder="Name workspace" />
          </div>
          <div className="flex flex-col gap-1">
            <label>Icon</label>
            <div className="size-10 flex items-center justify-center border rounded-sm">
              <PopoverSettingIcon />
            </div>
          </div>
        </div>
      </SettingMenuGroup>
    </div>
  );
};

export default WorkspaceGeneralSettings;
