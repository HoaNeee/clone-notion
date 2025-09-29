import React from "react";
import { DropdownMenuItem, DropdownMenuLabel } from "../ui/dropdown-menu";
import {
	blockTypeToBlockName,
	useToolbarState,
} from "@/contexts/toolbar-context";
import {
	Baseline,
	Check,
	Code,
	Heading1,
	Heading2,
	Heading3,
	List,
	ListOrdered,
	Quote,
} from "lucide-react";

const DropdownMenuBlock = ({
	onBlockChange,
}: {
	onBlockChange: (blockTypeName: string) => void;
}) => {
	const {
		toolbarState: { blockType },
	} = useToolbarState();
	const keyBlocks = [
		{
			key: "paragraph",
			title: "Normal",
			icon: Baseline,
		},
		{
			key: "h1",
			title: "Heading 1",
			icon: Heading1,
		},
		{
			key: "h2",
			title: "Heading 2",
			icon: Heading2,
		},
		{
			key: "h3",
			title: "Heading 3",
			icon: Heading3,
		},
		{
			key: "ul",
			title: "Bulleted List",
			icon: List,
		},
		{
			key: "ol",
			title: "Numbered List",
			icon: ListOrdered,
		},
		{
			key: "code",
			title: "Code Block",
			icon: Code,
		},
		{
			key: "quote",
			title: "Quote Block",
			icon: Quote,
		},
	];

	return (
		<>
			<DropdownMenuLabel className="text-neutral-600 text-sm font-medium capitalize">
				{blockTypeToBlockName[blockType]}
			</DropdownMenuLabel>
			{keyBlocks.map(({ key, icon: Icon, title }, index) => (
				<DropdownMenuItem
					key={index}
					onClick={() => {
						onBlockChange(key);
					}}
					className="cursor-pointer ml-1"
				>
					<div className="flex items-center justify-between gap-1.5 w-full">
						<div className="flex items-center gap-1 flex-1">
							{<Icon />}
							{title}
						</div>

						{blockType === key && <Check />}
					</div>
				</DropdownMenuItem>
			))}
		</>
	);
};

export default DropdownMenuBlock;
