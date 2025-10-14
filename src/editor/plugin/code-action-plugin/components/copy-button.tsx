"use client";

import { Button } from "@/components/ui/button";
import { $getNearestNodeFromDOMNode, LexicalEditor } from "lexical";
import { Check, Clipboard } from "lucide-react";
import React, { useCallback } from "react";
import { $isCodeNode } from "@lexical/code";

const CopyButton = ({
	editor,
	getDomNode,
}: {
	editor: LexicalEditor;
	getDomNode: () => HTMLElement | null;
}) => {
	const [copied, setCopied] = React.useState(false);

	const handleCopy = useCallback(async () => {
		if (copied) {
			return;
		}
		const codeNode = getDomNode();

		if (!codeNode) {
			return;
		}

		let content = "";

		editor.update(() => {
			const node = $getNearestNodeFromDOMNode(codeNode);
			if ($isCodeNode(node)) {
				const textContent = node.getTextContent();
				content = textContent;
			}
		});

		try {
			await navigator.clipboard.writeText(content);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch (error) {
			console.log(error);
		}
	}, [editor, getDomNode, copied]);

	return (
		<Button
			className=" size-5 rounded-xs"
			variant={"ghost"}
			onClick={handleCopy}
		>
			{!copied ? <Clipboard size={18} /> : <Check size={18} />}
		</Button>
	);
};

export default CopyButton;
