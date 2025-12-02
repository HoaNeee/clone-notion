"use client";

import { useWorkspace } from "@/contexts/workspace-context";
import { get } from "@/utils/request";
import { useParams, usePathname } from "next/navigation";
import React, { useEffect } from "react";

const HomePage = () => {
	const params = useParams();
	const slug = params.slug as string | undefined;
	const pathName = usePathname();

	const { currentWorkspace, setCurrentWorkspace } = useWorkspace();

	useEffect(() => {
		const isFetchWorkspace = !slug && !currentWorkspace && pathName === "/home";

		if (isFetchWorkspace) {
			const fetch = async () => {
				const res = await get(`/workspaces/last-workspace`);
				if (res && res.workspace) {
					setCurrentWorkspace(res.workspace);
				}
			};

			fetch();
		}
	}, [currentWorkspace, pathName, slug, setCurrentWorkspace]);

	return <div>HomePage</div>;
};

export default HomePage;
