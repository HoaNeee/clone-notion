import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { DRAG_DROP_PASTE } from "@lexical/rich-text";
import { isMimeType } from "@lexical/utils";
import { COMMAND_PRIORITY_LOW } from "lexical";
import { useEffect } from "react";
import { INSERT_IMAGE_COMMAND } from "./image-plugin";

const ACCEPTABLE_IMAGE_TYPES = [
	"image/",
	"image/heic",
	"image/heif",
	"image/gif",
	"image/webp",
];

export default function DragDropPaste(): null {
	const [editor] = useLexicalComposerContext();
	useEffect(() => {
		return editor.registerCommand(
			DRAG_DROP_PASTE,
			(files) => {
				async function solve(files: File[]) {
					// const filesResult = await mediaFileReader(
					// 	files,
					// 	[ACCEPTABLE_IMAGE_TYPES].flatMap((x) => x)
					// );
					// console.log(filesResult);
					// for (const { file, result } of filesResult) {
					// 	if (isMimeType(file, ACCEPTABLE_IMAGE_TYPES)) {
					// 		editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
					// 			altText: file.name,
					// 			src: result,
					// 			maxWidth: 500,
					// 		});
					// 	}
					// }

					for (const file of files) {
						if (isMimeType(file, ACCEPTABLE_IMAGE_TYPES)) {
							const src = URL.createObjectURL(file);
							editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
								altText: file.name,
								src,
								status: "initial",
							});
						}
					}
				}

				solve(files);

				return true;
			},
			COMMAND_PRIORITY_LOW
		);
	}, [editor]);
	return null;
}
