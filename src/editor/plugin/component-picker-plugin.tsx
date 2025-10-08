import React, { useState } from "react";
import {
	LexicalTypeaheadMenuPlugin,
	useBasicTypeaheadTriggerMatch,
} from "@lexical/react/LexicalTypeaheadMenuPlugin";

const ComponentPickerPlugin = () => {
	const [queryString, setQueryString] = useState<string | null>(null);

	const checkTrigger = useBasicTypeaheadTriggerMatch("/", {
		minLength: 0,
		allowWhitespace: true,
	});

	const onSelectOption = () => {};

	return (
		<>
			<LexicalTypeaheadMenuPlugin
				onQueryChange={setQueryString}
				options={[]}
				triggerFn={checkTrigger}
				onSelectOption={onSelectOption}
				menuRenderFn={() => {
					return <>menu</>;
				}}
			/>
		</>
	);
};

export default ComponentPickerPlugin;
