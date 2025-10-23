"use client";

import { logAction, sleep } from "@/lib/utils";
import { get, post } from "@/utils/request";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { Spinner } from "./ui/spinner";
import { TNote } from "@/types/note.type";
import { DialogLoading } from "./loading";

const StartingPage = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isPreparing, setIsPreparing] = React.useState(false);
  const [isNewUser, setIsNewUser] = React.useState(false);

  const router = useRouter();

  useEffect(() => {
    const getData = async () => {
      setIsLoading(true);
      try {
        //simulate delay
        await sleep(2000);

        const res = await get("/folders/root");
        if (!res) {
          setIsNewUser(true);
        }
      } catch (error) {
        logAction("No root folder found, creating for new user: ", error);
        setIsNewUser(true);
      } finally {
        setIsLoading(false);
      }
    };

    getData();
  }, [router]);

  useEffect(() => {
    const prepareApp = async () => {
      setIsPreparing(true);
      try {
        //simulate delay
        await sleep(2000);

        const res = await post("/folders/create-root-and-default-note");
        const { note } = res as { note: TNote };
        router.replace(`/${note.slug}`);
        setIsNewUser(false);
      } catch (error) {
        logAction("Error preparing app for new user: ", error);
      } finally {
        setIsPreparing(false);
      }
    };
    if (isNewUser && !isPreparing && !isLoading) {
      prepareApp();
    }
  }, [isNewUser, router, isPreparing, isLoading]);

  const renderLoading = () => {
    if (isLoading) {
      return <Spinner className="size-8 text-neutral-500" />;
    }

    if (isPreparing) {
      return <DialogLoading title="Preparing for you..." />;
    }
  };

  return (
    <div className="flex flex-col justify-center items-center w-full h-screen">
      {renderLoading()}
    </div>
  );
};

export default StartingPage;
