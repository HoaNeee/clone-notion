"use client";

import { cn } from "@/lib/utils";
import React from "react";

const MyOverlay = ({ className, ...props }: React.ComponentProps<"div">) => {
  React.useEffect(() => {
    const scrollHandler = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    document.addEventListener("wheel", scrollHandler, { passive: false });

    return () => {
      document.removeEventListener("wheel", scrollHandler);
    };
  }, []);

  return (
    <div
      className={cn("fixed inset-0 z-[9998] pointer-events-auto", className)}
      {...props}
    />
  );
};

export default MyOverlay;
