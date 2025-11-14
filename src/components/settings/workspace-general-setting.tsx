/* eslint-disable @next/next/no-img-element */
import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { SettingMenu, SettingMenuGroup, SettingMenuItem } from "./settings";
import { CircleQuestionMark, Copy, ImageIcon } from "lucide-react";
import { Button } from "../ui/button";
import { isMimeType } from "@lexical/utils";
import { Label } from "../ui/label";
import { useWorkspace } from "@/contexts/workspace-context";
import { TWorkspace } from "@/types/workspace.type";
import { Switch } from "../ui/switch";

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

const PreviewIcon = ({ icon }: { icon: File | string | null }) => {
  if (!icon) {
    return null;
  }

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
  setIcon,
  iconState,
  setIconState,
}: {
  open: boolean;
  setOpen: Dispatch<boolean>;
  icon: File | string | null;
  setIcon: Dispatch<File | string | null>;
  iconState: File | string | null;
  setIconState: Dispatch<SetStateAction<File | string | null>>;
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
          setIconState(file);
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
              setIconState(file);
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
                  setIconState(text);
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
      setIconState(null);
    };
  }, [setIconState]);

  return (
    <div className="min-h-10 w-full p-4 text-sm" ref={dropzoneRef}>
      {iconState ? (
        <div className="bg-neutral-200/60 text-neutral-500 flex items-center justify-center w-full gap-2 px-2 py-3 text-center rounded-sm">
          <div className="space-y-1">
            <p>Preview</p>
            <PreviewIcon icon={iconState} />
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
      {!iconState && (
        <>
          <input
            type="file"
            onChange={(e) => {
              if (e.target.files) {
                setIconState(e.target.files[0]);
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
        {iconState ? (
          <Button
            className="h-7 text-neutral-500 text-sm"
            variant={"ghost"}
            size={"sm"}
            onClick={() => {
              setIconState(null);
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
            onClick={() => {
              setOpen(false);
              setIconState(null);
            }}
          >
            Cancel
          </Button>
        )}
        <Button
          disabled={!iconState}
          className="h-7 text-sm"
          size={"sm"}
          onClick={() => {
            if (iconState) {
              setIcon(iconState);
            } else {
              setIcon(null);
            }
            setOpen(false);
          }}
        >
          Save
        </Button>
      </div>
    </div>
  );
};

const PopoverSettingIcon = ({
  workspace,
  icon,
  setIcon,
}: {
  workspace: TWorkspace;
  icon: File | string | null;
  setIcon: React.Dispatch<React.SetStateAction<File | string | null>>;
}) => {
  const [open, setOpen] = React.useState(false);
  const [iconState, setIconState] = useState<File | string | null>(null);

  const cnTabTrigger = `rounded-none data-[state=active]:shadow-none border-t-0 border-l-0 border-r-0 border-b-[3px] border-transparent data-[state=active]:border-primary text-neutral-500 data-[state=active]:text-primary/80`;

  const titleFallback = workspace?.title?.charAt(0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <div className="size-9 hover:bg-gray-300 flex items-center justify-center bg-gray-200 rounded-sm cursor-pointer">
          {icon ? (
            <img
              src={
                typeof icon === "string"
                  ? icon
                  : icon instanceof File
                  ? URL.createObjectURL(icon)
                  : ""
              }
              alt=""
            />
          ) : (
            titleFallback
          )}
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
                  if (iconState) {
                    setIconState(null);
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
              setIconState={setIconState}
              iconState={iconState}
            />
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};

const WorkspaceGeneralSettings = () => {
  const { currentWorkspace } = useWorkspace();
  const [icon, setIcon] = React.useState<File | string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleUpdate = useCallback(() => {
    const input = inputRef.current;

    let title = "";
    if (input) {
      title = input.value;
    }

    const payload = {
      title,
      icon,
    };

    console.log(payload);
  }, [icon]);

  if (!currentWorkspace) {
    return null;
  }

  return (
    <div className="relative flex flex-col w-full h-full overflow-hidden rounded-md">
      <SettingMenuGroup
        label="Workspace Settings"
        className="max-h-full px-10 py-5 overflow-hidden overflow-y-auto"
      >
        <div className="flex flex-col w-full gap-5 py-4 overflow-hidden overflow-y-auto text-sm">
          <div className="flex flex-col gap-2">
            <Label className="text-primary font-normal">Name</Label>
            <div className="flex flex-col gap-0.5">
              <input
                placeholder="Name workspace"
                className="bg-neutral-100 text-primary dark:bg-neutral-600 px-2 py-1 font-normal border rounded"
                ref={inputRef}
                defaultValue={currentWorkspace.title}
              />
              <span className="text-neutral-500 dark:text-neutral-200 text-xs font-normal">
                You can use your organization or company name. Keep it simple.
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-primary font-normal">Icon</Label>
            <div className="flex flex-col gap-1">
              <div className="size-12 flex items-center justify-center border rounded-sm">
                <PopoverSettingIcon
                  workspace={currentWorkspace}
                  icon={icon}
                  setIcon={setIcon}
                />
              </div>
              <span className="text-neutral-500 dark:text-neutral-200 text-xs font-normal">
                Upload an image or pick an emoji. It will show up in your
                sidebar and notifications
              </span>
            </div>
          </div>
        </div>
        <SettingMenuGroup label="People">
          <SettingMenu className="gap-4">
            <SettingMenuItem
              label="Profiles"
              description="Enable user profiles"
              isRealLabel
              labelHtmlFor="setting-enable-profiles"
              action={
                <Switch
                  className="cursor-pointer"
                  id="setting-enable-profiles"
                />
              }
            />
            <SettingMenuItem
              label="Hover cards"
              description="Show information on hover over name"
              isRealLabel
              labelHtmlFor="setting-hover-card-profile"
              action={
                <Switch
                  className="cursor-pointer"
                  id="setting-hover-card-profile"
                />
              }
            />
          </SettingMenu>
        </SettingMenuGroup>
        <SettingMenuGroup label="Danger zone">
          <SettingMenu className="inline-flex items-start">
            <div className="flex flex-row gap-2">
              <Button
                className="border-destructive/80 text-destructive/80 hover:text-destructive/80 text-sm"
                variant={"outline"}
              >
                Leave Workspace
              </Button>
              <Button
                variant={"outline"}
                className="border-destructive/80 text-destructive/80 hover:text-destructive/80 text-sm"
              >
                Delete entire workspace
              </Button>
            </div>
            <Button variant={"ghost"} size={"sm"} className="h-7 text-xs">
              <CircleQuestionMark />
              Learn about deleting a workspace
            </Button>
          </SettingMenu>
        </SettingMenuGroup>
        <SettingMenuGroup label="Workspace ID">
          <SettingMenu>
            <SettingMenuItem
              action={
                <div className="flex items-center gap-2">
                  <p>{currentWorkspace.id}</p>
                  <Button className="size-5 rounded-xs" variant={"ghost"}>
                    <Copy size={16} className="" />
                  </Button>
                </div>
              }
              label="Workspace ID"
            />
          </SettingMenu>
        </SettingMenuGroup>
      </SettingMenuGroup>
      <div className="flex items-center w-full gap-2 px-8 py-4 bg-white border-t">
        <Button size={"sm"} onClick={handleUpdate}>
          Update
        </Button>
        <Button size={"sm"} variant={"outline"}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default WorkspaceGeneralSettings;
