import React from "react";

const MyOverlay = ({ ...props }: React.ComponentProps<"div">) => {
	return (
		<div className="fixed inset-0 z-[9998] pointer-events-auto" {...props} />
	);
};

export default MyOverlay;
