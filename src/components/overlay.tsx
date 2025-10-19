"use client";

import React from "react";

const MyOverlay = ({ ...props }: React.ComponentProps<"div">) => {
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
		<div className="fixed inset-0 z-[9998] pointer-events-auto" {...props} />
	);
};

export default MyOverlay;
