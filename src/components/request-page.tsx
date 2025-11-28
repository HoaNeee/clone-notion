import React, { useCallback, useMemo, useState } from "react";
import AlertDialogConfirm from "./alert-dialog-confirm";
import { IoMdLock } from "react-icons/io";
import { useParams } from "next/navigation";
import { TWorkspace } from "@/types/workspace.type";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Dot } from "lucide-react";
import { Button } from "./ui/button";
import AppLogo from "./app-logo";
import { logAction } from "@/lib/utils";
import { post } from "@/utils/request";
import { useWorkspace } from "@/contexts/workspace-context";
import { TRequest } from "@/types/request.type";

const DialogRequest = ({ workspace }: { workspace: TWorkspace | null }) => {
  const { currentWorkspace } = useWorkspace();

  const [isSentRequest, setIsSentRequest] = useState(false);
  const [existRequestStatus, setExistRequestStatus] = useState<
    TRequest["status"] | null
  >(null);

  const params = useParams();
  const slug = (params.slug as string) || "";

  const nameWorkspaceDefault = useMemo(() => {
    if (!workspace) return "W";
    return workspace.title.charAt(0).toUpperCase();
  }, [workspace]);

  const handleSendRequest = useCallback(
    async (slug: string) => {
      try {
        setIsSentRequest(true);
        const res = (await post(
          `/requests/create/note?workspace_id=${currentWorkspace?.id}`,
          {
            note_slug: slug,
          }
        )) as {
          request: TRequest;
          is_exist: boolean;
        };

        if (res.is_exist) {
          setExistRequestStatus(res.request.status);
        } else {
          setExistRequestStatus(null);
        }
      } catch (error) {
        logAction("Error sending request access:", error);
      }
    },
    [currentWorkspace]
  );

  return (
    <>
      <AlertDialogConfirm
        open
        modal={false}
        dialogType="column"
        hideCancelButton
        icon={
          <div className="relative">
            <div className="size-9 bg-neutral-200 flex items-center justify-center rounded-sm">
              <p>{nameWorkspaceDefault}</p>
            </div>
            <IoMdLock
              className="-bottom-1.5 -right-1.5 absolute text-neutral-600"
              size={20}
            />
          </div>
        }
        title={
          <p className="py-1 leading-6 text-center">
            You do not have permission to access this page.
          </p>
        }
        description={
          <p className="text-neutral-500 text-sm text-center">
            Please request access to this page so the owner can approve it.
          </p>
        }
        okButton={
          <Button
            disabled={isSentRequest}
            onClick={() => {
              handleSendRequest(slug);
            }}
          >
            {existRequestStatus === "rejected"
              ? "You have been rejected"
              : "Request to access"}
          </Button>
        }
      />
    </>
  );
};

const RequestPage = ({ workspace }: { workspace: TWorkspace | null }) => {
  const {
    state: { user },
  } = useAuth();
  return (
    <>
      <section className="flex flex-col w-full h-full">
        <header className="flex items-center gap-4 px-12 py-3">
          <AppLogo />
        </header>
        <div className="bg-gradient-to-b from-transparent to-white/50 relative flex-1 w-full max-w-3xl mx-auto">
          <div className="absolute bottom-0 left-0 right-0 inline-block text-center">
            <footer className="inline-flex items-center justify-center gap-1 px-4 py-6 mx-auto bg-white">
              <div className="flex items-center gap-2">
                <Avatar className="size-6.5">
                  <AvatarImage src={user?.avatar || undefined} alt="Image" />
                  <AvatarFallback className="bg-neutral-300 text-sm">
                    {user?.fullname
                      ? user.fullname.charAt(0).toUpperCase()
                      : "U"}
                  </AvatarFallback>
                </Avatar>
                <p className="text-neutral-500 text-sm">
                  Logged in as{" "}
                  <span className="text-primary font-medium">
                    {user?.email || "someone.com"}
                  </span>
                </p>
              </div>
              <div>
                <Dot size={16} />
              </div>
              <button className="hover:text-destructive text-neutral-600 text-sm font-semibold transition-colors cursor-pointer">
                Log out
              </button>
            </footer>
          </div>
        </div>
      </section>
      <DialogRequest workspace={workspace} />
    </>
  );
};

export default RequestPage;
