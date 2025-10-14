/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { FolderContext } from "@/contexts/folder-context";
import { TFolder } from "@/types/folder.type";
import { get } from "@/utils/request";
import { DragDropManager } from "dnd-core";
import React, { useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

const CustomBackend = (manager: DragDropManager, context: any) => {
	const backend: any = HTML5Backend(manager, context);

	const originalTopDragStart = backend.handleTopDragStart;
	const originalTopDrop = backend.handleTopDrop;
	const originalTopDragOver = backend.handleTopDragOver;

	const unlock = (e: any, cb: any) => {
		const target = e.target as HTMLElement;

		if (!target || !(target instanceof HTMLElement)) {
			return;
		}

		const children = Array.from(target.children);

		for (const child of children) {
			if (
				child.closest(".draggable-block-menu") ||
				target.closest(".draggable-block-menu") ||
				target.closest(".editor-input") ||
				child.closest(".editor-input")
			) {
				return;
			}
		}

		cb(e);
	};

	backend.handleTopDragStart = (e: any) => {
		// console.log("drag start", e);

		if (e._lexicalHandled) {
			return;
		}

		unlock(e, originalTopDragStart);
	};

	backend.handleTopDragOver = (e: any) => {
		// console.log("drag over", e);
		if (e._lexicalHandled) {
			return;
		}
		unlock(e, originalTopDragOver);
	};

	backend.handleTopDrop = (e: any) => {
		// console.log("drop", e);
		if (e._lexicalHandled) {
			return;
		}
		unlock(e, originalTopDrop);
	};

	return backend;
};

const SidebarLayoutContainer = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const [rootFolder, setRootFolder] = useState<TFolder | undefined>();

	useEffect(() => {
		const getData = async () => {
			try {
				const res = await get("/folders/root");
				setRootFolder(res);
			} catch (error) {
				console.log(error);
			}
		};
		getData();
	}, []);

	if (!rootFolder) {
		return;
	}

	return (
		<DndProvider backend={CustomBackend}>
			<FolderContext rootFolder={rootFolder}>{children}</FolderContext>
		</DndProvider>
	);
};

export default SidebarLayoutContainer;
