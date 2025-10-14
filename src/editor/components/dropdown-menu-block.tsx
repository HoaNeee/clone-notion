import React from "react";
import {
	DropdownMenuItem,
	DropdownMenuLabel,
} from "../../components/ui/dropdown-menu";
import {
	blockTypeToBlockName,
	useToolbarState,
} from "@/contexts/toolbar-context";
import { keyBlocks } from "@/utils/key-blocks";
import { Check } from "lucide-react";

const DropdownMenuBlock = ({
	onBlockChange,
	size = "small",
	selected = "tick",
}: {
	onBlockChange: (blockTypeName: string) => void;
	size?: "small" | "large" | "medium";
	selected?: "tick" | "background";
}) => {
	const {
		toolbarState: { blockType },
	} = useToolbarState();

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
					className={`cursor-pointer ml-1 ${
						size === "small" ? "text-sm" : ""
					} ${size === "medium" ? "text-base" : ""} ${
						size === "large" ? "text-lg" : ""
					} ${
						selected === "background" && blockType === key
							? "bg-neutral-100/80"
							: ""
					}`}
				>
					<div className="flex items-center justify-between gap-1.5 w-full">
						<div
							className={`flex items-center flex-1 ${
								size === "small"
									? "gap-1"
									: size === "large"
									? "gap-3"
									: "gap-2"
							}`}
						>
							<Icon
								className={`${
									size === "medium"
										? "size-5"
										: size === "large"
										? "size-6"
										: ""
								}`}
							/>

							{title}
						</div>

						{selected === "tick" && blockType === key && <Check />}
					</div>
				</DropdownMenuItem>
			))}
		</>
	);
};

export default DropdownMenuBlock;
