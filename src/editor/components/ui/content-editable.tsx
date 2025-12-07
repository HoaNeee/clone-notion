import type { JSX } from "react";

import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import * as React from "react";
import { cn } from "@/lib/utils";

type Props = {
	className?: string;
	placeholderClassName?: string;
	placeholder: string;
};

export default function LexicalContentEditable({
	className,
	placeholder,
	placeholderClassName,
}: Props): JSX.Element {
	return (
		<ContentEditable
			className={cn(className, "relative")}
			aria-placeholder={placeholder}
			placeholder={
				<div
					className={cn(
						"absolute inset-0 pointer-events-none top-2.5 left-2.5 text-secondary",
						placeholderClassName
					)}
				>
					{placeholder}
				</div>
			}
		/>
	);
}
