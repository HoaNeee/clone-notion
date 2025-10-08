import { LexicalEditor } from "lexical";
import React, { Dispatch, useCallback, useEffect, useRef } from "react";
import { calculateZoomLevel } from "@lexical/utils";

interface ImagerResizerProps {
	editor: LexicalEditor;
	imageRef: { current: HTMLElement | null };
	maxWidth?: number;
	onResizeStart: () => void;
	onResizeEnd: (width: "inherit" | number, height: "inherit" | number) => void;
	showCaption: boolean;
	setShowCaption: Dispatch<boolean>;
	captionEnable: boolean;
	btnCaptionRef: { current: HTMLButtonElement | null };
	caption: LexicalEditor;
}

type Direction = "left" | "right";

function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max);
}

const ImageResizer = (props: ImagerResizerProps) => {
	const {
		editor,
		imageRef,
		maxWidth,
		onResizeEnd,
		onResizeStart,
		showCaption,
		setShowCaption,
		captionEnable,
		btnCaptionRef,
	} = props;

	const controlWrapperRef = useRef<HTMLDivElement>(null);
	const positioningRef = useRef<{
		startWidth: number;
		startHeight: number;
		currentWidth: "inherit" | number;
		currentHeight: "inherit" | number;
		startX: number;
		startY: number;
		ratio: number;
		isResizing: boolean;
		direction: Direction;
	}>({
		startWidth: 0,
		startHeight: 0,
		currentWidth: 0,
		currentHeight: 0,
		startX: 0,
		startY: 0,
		ratio: 0,
		isResizing: false,
		direction: "right",
	});

	const editorRootElement = editor.getRootElement();
	const maxWidthContainer = maxWidth
		? maxWidth
		: editorRootElement !== null
		? editorRootElement.getBoundingClientRect().width
		: 100;
	const minWidth = 100;

	const setStartCursor = () => {
		if (editorRootElement !== null) {
			editorRootElement.style.pointerEvents = "none";
			editorRootElement.style.cursor = "col-resize";
		}

		if (typeof document !== "undefined" && document.body !== null) {
			document.body.style.cursor = "col-resize";
		}
	};

	const handleShowCaption = (e: React.MouseEvent) => {
		e.preventDefault();
		setShowCaption(!showCaption);
	};

	const setEndCursor = () => {
		if (editorRootElement !== null) {
			editorRootElement.style.pointerEvents = "auto";
			editorRootElement.style.cursor = "auto";
		}

		if (typeof document !== "undefined" && document.body !== null) {
			document.body.style.cursor = "auto";
		}
	};

	const handlePointerDown = (e: React.PointerEvent, direction: Direction) => {
		e.preventDefault();

		const image = imageRef.current;
		const position = positioningRef.current;
		const controlWrapper = controlWrapperRef.current;
		if (
			!editorRootElement ||
			!image ||
			!controlWrapper ||
			!editor.isEditable()
		) {
			return;
		}

		onResizeStart();
		setStartCursor();

		const { width, height } = image.getBoundingClientRect();
		const zoom = calculateZoomLevel(image);

		position.currentHeight = height;
		position.currentWidth = width;
		position.startHeight = height;
		position.startWidth = width;
		position.startX = e.clientX / zoom;
		position.startY = e.clientY / zoom;
		position.ratio = width / height;
		position.isResizing = true;
		position.direction = direction;

		image.style.width = `${width}px`;
		image.style.height = `${height}px`;

		document.addEventListener("pointermove", handlePointerMove);
		document.addEventListener("pointerup", handlePointerUp);
	};

	const handlePointerMove = (e: PointerEvent) => {
		e.preventDefault();

		const image = imageRef.current;
		const position = positioningRef.current;

		if (!image || !position.isResizing) {
			return;
		}

		const zoom = calculateZoomLevel(image);

		let diff = Math.floor(position.startX - e.clientX / zoom);

		diff = position.direction === "left" ? diff : -diff;

		const width = clamp(
			position.startWidth + diff,
			minWidth,
			maxWidthContainer
		);
		const height = width / position.ratio;
		image.style.width = `${width}px`;
		image.style.height = `${height}px`;
		position.currentHeight = height;
		position.currentWidth = width;
	};

	const handlePointerUp = (e: PointerEvent) => {
		e.preventDefault();

		const image = imageRef.current;
		const position = positioningRef.current;
		const controlWrapper = controlWrapperRef.current;
		if (!image || !controlWrapper || !position.isResizing) {
			return;
		}

		const width = position.currentWidth;
		const height = position.currentHeight;

		position.currentHeight = 0;
		position.currentWidth = 0;
		position.isResizing = false;
		position.startHeight = 0;
		position.currentWidth = 0;
		position.ratio = 0;
		position.startX = 0;
		position.startY = 0;
		position.direction = "right";

		onResizeEnd(width, height);
		setEndCursor();

		document.removeEventListener("pointermove", handlePointerMove);
		document.removeEventListener("pointerup", handlePointerUp);
	};

	return (
		<div ref={controlWrapperRef} className="">
			{!showCaption && captionEnable && (
				<div className="absolute bottom-2 left-0 justify-center flex items-center w-full">
					<button
						className="bg-black/70 backdrop-blur-lg text-xs w-2/3 py-1.5 px-2 border-white text-white border rounded-md cursor-pointer hover:bg-black/40 transition-colors"
						ref={btnCaptionRef}
						onClick={handleShowCaption}
					>
						Add Caption
					</button>
				</div>
			)}
			<div
				className="image-resizer absolute top-1/2 transform translate-x-1/2 z-11 -translate-y-1/2 rounded-sm cursor-col-resize left-0 w-1.5 border border-white h-1/4 bg-black"
				onPointerDown={(e) => handlePointerDown(e, "left")}
			></div>
			<div
				className="image-resizer absolute top-1/2 transform translate-x-1/2 z-11 -translate-y-1/2 rounded-sm cursor-col-resize right-1.5 w-1.5 h-1/4 bg-black border border-white"
				onPointerDown={(e) => handlePointerDown(e, "right")}
			></div>
		</div>
	);
};

export default ImageResizer;
